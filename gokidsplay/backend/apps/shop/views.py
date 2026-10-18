import secrets
from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework import permissions, status as http_status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.bookings.permissions import IsSuperAdminOnly
from apps.core.throttling import VoucherCheckThrottle
from .models import Voucher
from .serializers import VoucherRedemptionSerializer, VoucherSerializer

CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  # no 0/O or 1/I, so codes are easy to read out


class VoucherViewSet(viewsets.ModelViewSet):
    """
    Vouchers (Admin → Vouchers). Only admins manage them; the public can only
    check one code at a time, rate limited so codes can't be guessed.
    """
    queryset = Voucher.objects.all().prefetch_related('redemptions').order_by('-created_at')
    serializer_class = VoucherSerializer

    def get_permissions(self):
        # Only single-code validation is public; listing would expose every voucher code
        if self.action == 'validate':
            return [permissions.AllowAny()]
        return [IsSuperAdminOnly()]

    def get_throttles(self):
        if self.action == 'validate':
            return [VoucherCheckThrottle()]
        return super().get_throttles()

    def destroy(self, request, *args, **kwargs):
        # A used code keeps its history (which bookings had which discount): switch it off instead
        if self.get_object().redemptions.exists():
            return Response({'detail': 'This code has been used, so it is kept for the records. Switch it off instead.'},
                            status=http_status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Check a code for the booking wizards: {code, order_amount, booking_datetime?, booking_type?, email?}"""
        from .services import evaluate_voucher

        code = str(request.data.get('code', '') or '')[:50]
        try:
            order_amount = max(Decimal('0'), Decimal(str(request.data.get('order_amount', 0))))
        except (InvalidOperation, ValueError, TypeError):
            order_amount = Decimal('0')
        if not code.strip():
            return Response({'valid': False, 'error': 'Voucher code is required'},
                            status=http_status.HTTP_400_BAD_REQUEST)
        kind = request.data.get('booking_type')
        email = str(request.data.get('email') or '')[:254] or None
        result = evaluate_voucher(code, order_amount, request.data.get('booking_datetime'),
                                  kind=kind if kind in ('session', 'party') else None, email=email)
        if not result.valid:
            return Response({'valid': False, 'error': result.error})

        voucher = result.voucher
        return Response({
            'valid': True,
            'voucher': {
                'id': voucher.id,
                'code': voucher.code,
                'discount_type': voucher.discount_type,
                'discount_value': float(voucher.discount_value),
                'description': voucher.description,
            },
            'discount_amount': float(result.discount),
            'final_amount': float(order_amount - result.discount),
        })

    @action(detail=True, methods=['get'])
    def redemptions(self, request, pk=None):
        """Every use of this voucher: booking, customer, discount, and whether it was given back."""
        voucher = self.get_object()
        rows = voucher.redemptions.select_related('booking', 'party_booking')
        return Response(VoucherRedemptionSerializer(rows, many=True).data)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Make a batch of single-use codes: {prefix, count, discount_type, discount_value,
        expiry_date?, valid_from?, applies_to?, min_order_amount?, max_discount_amount?,
        min_hours_before_slot?, description?}. Each code works once. Returns the codes.
        """
        data = request.data
        prefix = ''.join(ch for ch in str(data.get('prefix') or 'GKP').upper() if ch.isascii() and ch.isalnum())[:12]
        prefix = prefix or 'GKP'
        try:
            count = int(data.get('count') or 0)
        except (TypeError, ValueError):
            count = 0
        if not 1 <= count <= 500:
            return Response({'error': 'Choose between 1 and 500 codes.'}, status=http_status.HTTP_400_BAD_REQUEST)

        keys = ('discount_type', 'discount_value', 'expiry_date', 'valid_from', 'applies_to', 'min_order_amount',
                'description', 'max_discount_amount', 'min_hours_before_slot')
        template = {key: data.get(key) for key in keys if data.get(key) not in (None, '')}
        template.update({'usage_limit': 1, 'is_active': True, 'code': f'{prefix}-CHECK-{secrets.token_hex(3)}'})
        check = VoucherSerializer(data=template)
        if not check.is_valid():
            return Response(check.errors, status=http_status.HTTP_400_BAD_REQUEST)

        batch = f"{prefix}-{secrets.token_hex(2).upper()}"
        fields = {k: v for k, v in check.validated_data.items() if k != 'code'}
        codes = []
        with transaction.atomic():
            while len(codes) < count:
                code = f"{prefix}-{''.join(secrets.choice(CODE_ALPHABET) for _ in range(6))}"
                if code in codes or Voucher.objects.filter(code__iexact=code).exists():
                    continue
                Voucher.objects.create(code=code, batch=batch, **fields)
                codes.append(code)
        return Response({'batch': batch, 'count': len(codes), 'codes': codes}, status=http_status.HTTP_201_CREATED)
