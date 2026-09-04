from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as http_status
from .models import Product, Voucher
from .serializers import ProductSerializer, VoucherSerializer
from django.utils import timezone
from decimal import Decimal
from apps.bookings.permissions import IsSuperAdminOnly

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsSuperAdminOnly()]

class VoucherViewSet(viewsets.ModelViewSet):
    queryset = Voucher.objects.all()
    serializer_class = VoucherSerializer
    
    def get_permissions(self):
        # Allow public access for list and validate
        if self.action in ['list', 'validate']:
            return [permissions.AllowAny()]
        return [IsSuperAdminOnly()]
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a voucher code and calculate discount"""
        code = request.data.get('code', '').upper()
        order_amount = Decimal(str(request.data.get('order_amount', 0)))
        
        if not code:
            return Response({
                'valid': False,
                'error': 'Voucher code is required'
            }, status=http_status.HTTP_400_BAD_REQUEST)
        
        try:
            voucher = Voucher.objects.get(code__iexact=code)
        except Voucher.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Invalid voucher code'
            })
        
        # Check if voucher is active
        if not voucher.is_active:
            return Response({
                'valid': False,
                'error': 'This voucher is no longer active'
            })
        
        # Check expiry date
        if voucher.expiry_date and voucher.expiry_date < timezone.now():
            return Response({
                'valid': False,
                'error': 'This voucher has expired'
            })
        
        # Check usage limit
        if voucher.usage_limit and voucher.used_count >= voucher.usage_limit:
            return Response({
                'valid': False,
                'error': 'This voucher has reached its usage limit'
            })
        
        # Check minimum order amount
        if voucher.min_order_amount and order_amount < voucher.min_order_amount:
            return Response({
                'valid': False,
                'error': f'Minimum order amount of £{voucher.min_order_amount:.2f} required'
            })
        
        # Check minimum hours before booking slot
        if voucher.min_hours_before_slot > 0:
            booking_datetime_str = request.data.get('booking_datetime')
            
            if not booking_datetime_str:
                return Response({
                    'valid': False,
                    'error': 'Please select a booking time to apply this voucher'
                })
            
            try:
                # Parse booking datetime (ISO format from frontend)
                from datetime import datetime
                booking_datetime = datetime.fromisoformat(booking_datetime_str.replace('Z', '+00:00'))
                
                # Make timezone-aware if naive
                if timezone.is_naive(booking_datetime):
                    booking_datetime = timezone.make_aware(booking_datetime)
                
                # Calculate time difference
                time_until_booking = booking_datetime - timezone.now()
                hours_until_booking = time_until_booking.total_seconds() / 3600
                
                if hours_until_booking < voucher.min_hours_before_slot:
                    return Response({
                        'valid': False,
                        'error': f'This voucher requires booking at least {voucher.min_hours_before_slot} hours in advance. Please select a later time slot.'
                    })
            except (ValueError, TypeError) as e:
                return Response({
                    'valid': False,
                    'error': 'Invalid booking time format'
                })
        
        # Calculate discount
        if voucher.discount_type == 'PERCENTAGE':
            discount_amount = (order_amount * voucher.discount_value) / 100
        else:  # FLAT
            discount_amount = voucher.discount_value
        
        # Ensure discount doesn't exceed order amount
        discount_amount = min(discount_amount, order_amount)
        
        final_amount = order_amount - discount_amount
        
        return Response({
            'valid': True,
            'voucher': {
                'code': voucher.code,
                'discount_type': voucher.discount_type,
                'discount_value': float(voucher.discount_value),
                'description': voucher.description
            },
            'discount_amount': float(discount_amount),
            'final_amount': float(final_amount)
        })
