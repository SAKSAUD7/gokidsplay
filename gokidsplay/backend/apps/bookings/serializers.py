from rest_framework import serializers
from .models import Customer, Booking, Transaction, BookingBlock, PartyBooking, SessionBookingHistory, PartyBookingHistory, BookingAuditLog, SpecialEvent, EventBooking, EventRequest
# from apps.shop.serializers import VoucherSerializer

class CustomerSerializer(serializers.ModelSerializer):
    booking_count = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    last_visit = serializers.DateField(read_only=True)
    email_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'notes', 'created_at', 'updated_at', 
                  'booking_count', 'total_spent', 'last_visit', 'email_count']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class BookingBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingBlock
        fields = '__all__'

# Simple booking serializer WITHOUT waivers to avoid circular reference
class SimpleBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'name', 'email', 'phone', 'date', 'time', 'duration', 
                  'adults', 'kids', 'spectators', 'amount', 'status', 'booking_status',
                  'payment_status', 'waiver_status', 'type', 'created_at', 'updated_at']



class BookingSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    # voucher_details = VoucherSerializer(source='voucher', read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True)
    waiver_status = serializers.SerializerMethodField()
    # waivers = WaiverSerializer(many=True, read_only=True)  # Temporarily disabled due to IPAddressField error

    class Meta:
        model = Booking
        fields = ['id', 'uuid', 'booking_number', 'name', 'email', 'phone', 'date', 'time', 'duration',
                  'adults', 'kids', 'spectators', 'subtotal', 'discount_amount', 'amount', 'paid_amount',
                  'voucher_code', 'status', 'booking_status', 'payment_status', 'waiver_status',
                  'type', 'activity', 'add_ons', 'tickets', 'parking_plates', 'qr_code', 'customer', 'customer_details',
                  'voucher', 'transactions', 'arrived', 'arrived_at',
                  # 'waivers',  # Temporarily removed
                  'created_at', 'updated_at']

    def get_waiver_status(self, obj):
        return obj.waiver_status or 'PENDING'
        
    def validate(self, attrs):  # type: ignore[override]
        """Check for Booking Blocks"""
        date = attrs.get('date')
        if date:
            # Check for active blocks on this date
            # We block if type is BLOCKED_DATE or any legacy blocking type
            # CLOSED_TODAY and OPEN_TODAY are alerts only, not blocks
            blocking_types = ['BLOCKED_DATE', 'CLOSED', 'MAINTENANCE', 'PRIVATE_EVENT', 'OTHER']
            
            blocks = BookingBlock.objects.filter(  # type: ignore[attr-defined]
                start_date__lte=date,
                end_date__gte=date,
                type__in=blocking_types
            )
            
            if blocks.exists():
                block = blocks.first()
                raise serializers.ValidationError(f"This date is not available due to {block.reason}")
                
        return attrs
    
    def create(self, validated_data):
        """Override create to automatically create/link customer"""
        # Extract customer data
        email = validated_data.get('email')
        name = validated_data.get('name')
        phone = validated_data.get('phone')
        
        # Get or create customer by email
        if email:
            customer, created = Customer.objects.get_or_create(  # type: ignore[attr-defined]
                email=email,
                defaults={
                    'name': name,
                    'phone': phone
                }
            )
            
            # Update customer info if changed
            if not created:
                updated = False
                if customer.name != name:
                    customer.name = name
                    updated = True
                if phone and customer.phone != phone:
                    customer.phone = phone
                    updated = True
                if updated:
                    customer.save()
            
            # Link customer to booking
            validated_data['customer'] = customer
        
        # Create booking with linked customer
        booking = super().create(validated_data)
        return booking

class PartyBookingSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()
    qr_code = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    waiver_status = serializers.SerializerMethodField()
    booking_status = serializers.SerializerMethodField()

    class Meta:
        model = PartyBooking
        fields = ['id', 'uuid', 'booking_number', 'name', 'email', 'phone', 'date', 'time', 'package_name',
                  'kids', 'adults', 'spectators', 'amount', 'paid_amount', 'package_price', 'deposit_amount',
                  'payment_type', 'reschedule_count', 'original_date', 'admin_fee_charged', 'remaining_balance',
                  'birthday_child_name', 'birthday_child_age',
                  'special_requests', 'dietary_restrictions',
                  'participants', 'waiver_signed', 'waiver_signed_at', 'waiver_ip_address',
                  'status', 'customer', 'arrived', 'arrived_at', 'created_at', 'updated_at',
                  'duration', 'qr_code', 'payment_status', 'waiver_status', 'booking_status']

    def get_duration(self, obj):
        return 120  # Party bookings are standard 2 hours

    def get_qr_code(self, obj):
        return f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data={obj.uuid}"

    def get_payment_status(self, obj):
        # The payment flow records PENDING / PARTIAL (deposit) / PAID / REFUNDED on the booking
        return obj.payment_status or 'PENDING'

    def get_waiver_status(self, obj):
        return 'SIGNED' if obj.waiver_signed else 'PENDING'

    def get_booking_status(self, obj):
        return obj.status

    def validate(self, attrs):  # type: ignore[override]
        """Check for Booking Blocks"""
        date = attrs.get('date')
        if date:
            blocking_types = ['BLOCKED_DATE', 'CLOSED', 'MAINTENANCE', 'PRIVATE_EVENT', 'OTHER']
            blocks = BookingBlock.objects.filter(  # type: ignore[attr-defined]
                start_date__lte=date,
                end_date__gte=date,
                type__in=blocking_types
            )
            
            if blocks.exists():
                block = blocks.first()
                raise serializers.ValidationError(f"This date is not available due to {block.reason}")
                
        return attrs
    
    def create(self, validated_data):
        """Override create to automatically create/link customer"""
        # Extract customer data
        email = validated_data.get('email')
        name = validated_data.get('name')
        phone = validated_data.get('phone')
        
        # Get or create customer by email
        if email:
            customer, created = Customer.objects.get_or_create(  # type: ignore[attr-defined]
                email=email,
                defaults={
                    'name': name,
                    'phone': phone
                }
            )
            
            # Update customer info if changed
            if not created:
                updated = False
                if customer.name != name:
                    customer.name = name
                    updated = True
                if phone and customer.phone != phone:
                    customer.phone = phone
                    updated = True
                if updated:
                    customer.save()
            
            # Link customer to booking
            validated_data['customer'] = customer
        
        # Create party booking with linked customer
        party_booking = super().create(validated_data)
        return party_booking


class SessionBookingHistorySerializer(serializers.ModelSerializer):
    """Serializer for SessionBookingHistory with computed fields"""
    can_restore = serializers.SerializerMethodField()
    restored_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SessionBookingHistory
        fields = '__all__'
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at', 'restored', 
                           'restored_at', 'restored_by', 'restored_booking_id']
    
    def get_can_restore(self, obj):
        """Check if this history record can be restored"""
        return not obj.restored
    
    def get_restored_by_name(self, obj):
        """Get the name of the admin who restored this booking"""
        if obj.restored_by:
            return obj.restored_by.username
        return None


class PartyBookingHistorySerializer(serializers.ModelSerializer):
    """Serializer for PartyBookingHistory with computed fields"""
    can_restore = serializers.SerializerMethodField()
    restored_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PartyBookingHistory
        fields = '__all__'


class BookingAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingAuditLog
        fields = '__all__'


# ─── Section 7: Special Events Serializers ────────────────────────────────────

class SpecialEventSerializer(serializers.ModelSerializer):
    available_spots = serializers.ReadOnlyField()
    is_sold_out = serializers.ReadOnlyField()
    duration_minutes = serializers.ReadOnlyField()
    confirmed_booking_count = serializers.ReadOnlyField()
    event_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = SpecialEvent
        fields = [
            'id', 'uuid', 'event_type', 'event_type_display', 'title', 'slug',
            'description', 'short_description', 'status', 'status_display',
            'date', 'start_time', 'end_time', 'doors_open_time',
            'total_capacity', 'min_attendees', 'reserved_spots',
            'price_per_child', 'price_per_adult', 'deposit_amount', 'is_free',
            'cover_image', 'gallery_images', 'accent_color', 'emoji',
            'is_public', 'requires_age_verification', 'min_age', 'max_age',
            'terms_and_conditions', 'special_instructions',
            'available_spots', 'is_sold_out', 'duration_minutes',
            'confirmed_booking_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'slug', 'created_at', 'updated_at']

    def get_event_type_display(self, obj):
        return obj.get_event_type_display()

    def get_status_display(self, obj):
        return obj.get_status_display()


class EventBookingSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateField(source='event.date', read_only=True)
    event_start_time = serializers.TimeField(source='event.start_time', read_only=True)
    status_display = serializers.SerializerMethodField()
    payment_status_display = serializers.SerializerMethodField()

    class Meta:
        model = EventBooking
        fields = [
            'id', 'uuid', 'booking_reference',
            'event', 'event_title', 'event_date', 'event_start_time',
            'customer',
            'name', 'email', 'phone',
            'num_children', 'num_adults', 'special_requirements',
            'price_per_child', 'price_per_adult',
            'subtotal', 'deposit_amount', 'amount_paid', 'balance_due',
            'status', 'status_display', 'payment_status', 'payment_status_display',
            'arrived', 'arrived_at', 'notes',
            'ip_address', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'booking_reference', 'created_at', 'updated_at']

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_payment_status_display(self, obj):
        return obj.get_payment_status_display()


class EventRequestSerializer(serializers.ModelSerializer):
    """Requests from customers asking Go Kids Play to organise an event."""
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True, default=None)

    class Meta:
        model = EventRequest
        fields = [
            'id', 'reference', 'name', 'email', 'phone',
            'event_type', 'event_type_display', 'preferred_date', 'alternative_date', 'preferred_time',
            'num_children', 'num_adults', 'budget', 'details',
            'status', 'status_display', 'admin_notes', 'event', 'event_title',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'reference', 'created_at', 'updated_at']
