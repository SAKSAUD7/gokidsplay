"""
Payment serializers for API responses.
"""

from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model with customer and booking details."""
    
    # Add custom fields
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    booking_number = serializers.SerializerMethodField()
    booking_date = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id',
            'booking',
            'party_booking',
            'provider',
            'order_id',
            'payment_id',
            'amount',
            'currency',
            'status',
            'created_at',
            'updated_at',
            # Custom fields
            'customer_name',
            'customer_email',
            'booking_number',
            'booking_date',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_customer_name(self, obj):
        """Get customer name from booking."""
        if obj.booking:
            return obj.booking.name
        elif obj.party_booking:
            return obj.party_booking.name
        return None
    
    def get_customer_email(self, obj):
        """Get customer email from booking."""
        if obj.booking:
            return obj.booking.email
        elif obj.party_booking:
            return obj.party_booking.email
        return None
    
    def get_booking_number(self, obj):
        """Get booking number."""
        if obj.booking:
            return f"#{obj.booking.id}"
        elif obj.party_booking:
            return f"P#{obj.party_booking.id}"
        return None
    
    def get_booking_date(self, obj):
        """Get booking date."""
        if obj.booking:
            return obj.booking.date.isoformat() if obj.booking.date else None
        elif obj.party_booking:
            return obj.party_booking.date.isoformat() if obj.party_booking.date else None
        return None
    
    def to_representation(self, instance):
        """Customize output to match frontend expectations."""
        data = super().to_representation(instance)
        
        # Add booking_id and party_booking_id for easier frontend access
        data['booking_id'] = instance.booking.id if instance.booking else None
        data['party_booking_id'] = instance.party_booking.id if instance.party_booking else None
        
        return data
