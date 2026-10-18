import re
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import Voucher, VoucherRedemption


class VoucherSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()
    total_discount_given = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = '__all__'
        read_only_fields = ['used_count', 'created_at', 'updated_at', 'batch']

    def get_status(self, voucher) -> str:
        """Active / Scheduled / Expired / Used up / Off: what staff see in the list."""
        now = timezone.now()
        if not voucher.is_active:
            return 'Off'
        if voucher.expiry_date and voucher.expiry_date < now:
            return 'Expired'
        if voucher.usage_limit and voucher.used_count >= voucher.usage_limit:
            return 'Used up'
        if voucher.valid_from and voucher.valid_from > now:
            return 'Scheduled'
        return 'Active'

    def get_total_discount_given(self, voucher) -> float:
        total = sum((r.discount_amount for r in voucher.redemptions.all() if not r.released), Decimal('0'))
        return float(total)

    def validate_code(self, value):
        code = (value or '').strip().upper()
        if not re.fullmatch(r'[A-Z0-9][A-Z0-9-]{2,49}', code):
            raise serializers.ValidationError('Use 3 to 50 letters, numbers or dashes (e.g. SUMMER-10).')
        clash = Voucher.objects.filter(code__iexact=code)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError('A voucher with this code already exists.')
        return code

    def validate(self, attrs):
        def get(key):
            return attrs[key] if key in attrs else getattr(self.instance, key, None)

        value, kind = get('discount_value'), get('discount_type')
        if value is not None and value <= 0:
            raise serializers.ValidationError({'discount_value': 'The discount must be more than 0.'})
        if kind == 'PERCENTAGE' and value is not None and value > 100:
            raise serializers.ValidationError({'discount_value': 'A percentage discount can be at most 100.'})
        start, end = get('valid_from'), get('expiry_date')
        if start and end and end <= start:
            raise serializers.ValidationError({'expiry_date': 'The expiry must be after the start date.'})
        for field in ('usage_limit', 'min_hours_before_slot'):
            if attrs.get(field) is not None and attrs[field] < 0:
                raise serializers.ValidationError({field: 'Must be 0 or more.'})
        for field in ('min_order_amount', 'max_discount_amount'):
            if attrs.get(field) is not None and attrs[field] < 0:
                raise serializers.ValidationError({field: 'Must be 0 or more.'})
        return attrs


class VoucherRedemptionSerializer(serializers.ModelSerializer):
    booking_number = serializers.SerializerMethodField()
    booking_type = serializers.SerializerMethodField()
    booking_id = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()
    booking_status = serializers.SerializerMethodField()

    class Meta:
        model = VoucherRedemption
        fields = ['id', 'email', 'discount_amount', 'released', 'created_at', 'booking_number', 'booking_type',
                  'booking_id', 'customer_name', 'booking_date', 'booking_status']

    def _booking(self, r):
        return r.booking or r.party_booking

    def get_booking_number(self, r):
        b = self._booking(r)
        return getattr(b, 'booking_number', None) if b else None

    def get_booking_type(self, r):
        return 'party' if r.party_booking_id else 'session'

    def get_booking_id(self, r):
        return r.party_booking_id or r.booking_id

    def get_customer_name(self, r):
        b = self._booking(r)
        return getattr(b, 'name', '') if b else ''

    def get_booking_date(self, r):
        b = self._booking(r)
        return str(b.date) if b and getattr(b, 'date', None) else None

    def get_booking_status(self, r):
        b = self._booking(r)
        return getattr(b, 'status', None) if b else None
