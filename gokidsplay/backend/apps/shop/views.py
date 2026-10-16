from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as http_status
from .models import Voucher
from .serializers import VoucherSerializer
from django.utils import timezone
from decimal import Decimal
from apps.bookings.permissions import IsSuperAdminOnly

class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all()
    serializer_class = VoucherSerializer
    
    def get_permissions(self):
        # Only single-code validation is public — listing would expose every voucher code
        if self.action == 'validate':
            return [permissions.AllowAny()]
        return [IsSuperAdminOnly()]
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a voucher code and calculate discount"""
        from .services import evaluate_voucher

        code = request.data.get('code', '')
        try:
            order_amount = Decimal(str(request.data.get('order_amount', 0)))
        except Exception:
            order_amount = Decimal('0')
        if not str(code).strip():
            return Response({'valid': False, 'error': 'Voucher code is required'},
                            status=http_status.HTTP_400_BAD_REQUEST)

        result = evaluate_voucher(code, order_amount, request.data.get('booking_datetime'))
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
