from django.db import models
from apps.shop.models import Voucher
import uuid
from datetime import datetime

class Customer(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['-created_at']),  # For sorting by newest
        ]
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return self.name


class CustomerToken(models.Model):
    """
    Stores customer account credentials (hashed password + auth tokens).
    Separate from admin User model — for public customer login only.
    """
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='auth_token')
    password_hash = models.CharField(max_length=255)
    token = models.CharField(max_length=100, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Customer Token'
        verbose_name_plural = 'Customer Tokens'

    def __str__(self):
        return f"Token for {self.customer.email}"


class Booking(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    ]
    WAIVER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SIGNED', 'Signed'),
    ]
    TYPE_CHOICES = [
        ('SESSION', 'Session'),
        ('PARTY', 'Party'),
        ('MANUAL', 'Manual'),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    date = models.DateField()
    time = models.TimeField()
    duration = models.IntegerField(help_text="Duration in minutes")
    adults = models.IntegerField(default=0)
    kids = models.IntegerField(default=0)
    spectators = models.IntegerField(default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total amount paid so far")
    voucher_code = models.CharField(max_length=50, null=True, blank=True)
    
    status = models.CharField(max_length=20, default='CONFIRMED') # Legacy
    booking_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    waiver_status = models.CharField(max_length=20, choices=WAIVER_STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='SESSION')
    activity = models.CharField(max_length=100, null=True, blank=True, help_text="Activity type: roller-skating, ten-pin-bowling, arcade")
    add_ons = models.JSONField(null=True, blank=True, help_text="Selected add-ons: [{id, label, qty, price_each, subtotal}]")
    tickets = models.JSONField(null=True, blank=True, help_text="Admission tickets: [{plan_id, label, qty, price_each, subtotal, playing}]")
    parking_plates = models.JSONField(null=True, blank=True, help_text="Car registration plates for pre-booked parking: ['LE21 ABC', ...]")
    qr_code = models.CharField(max_length=255, unique=True, null=True, blank=True)
    booking_number = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Booking number, e.g. GK482913 (see references.py)")
    online_checkout = models.BooleanField(default=False, help_text="Booked on the website and paid online (released if left unpaid, see unpaid.py)")
    
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    voucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    
    # Arrival tracking
    arrived = models.BooleanField(default=False)
    arrived_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['date', 'time']),  # For availability checks
            models.Index(fields=['email']),  # For customer lookups
            models.Index(fields=['name']),   # For global search
            models.Index(fields=['phone']),  # For global search
            models.Index(fields=['uuid']),  # For ticket retrieval
            models.Index(fields=['booking_status']),  # For filtering by status
            models.Index(fields=['payment_status']),  # For payment tracking
            models.Index(fields=['-created_at']),  # For sorting by newest
            models.Index(fields=['customer']),  # Foreign key lookup
            models.Index(fields=['activity']),   # For skating/bowling filter
            models.Index(fields=['type']),        # For SESSION/PARTY/MANUAL filter
            models.Index(fields=['type', 'activity']),  # Composite for activity+type queries
        ]
        ordering = ['-created_at']
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'

    def __str__(self):
        return f"Booking {self.id} - {self.name}"
    
    @property
    def remaining_balance(self):
        """Calculate remaining balance to be paid"""
        return self.amount - self.paid_amount
    
    def generate_booking_number(self):
        """Short random booking number, e.g. GK482913."""
        from .references import new_reference, SESSION_PREFIX
        return new_reference(SESSION_PREFIX, Booking)
    
    def save(self, *args, **kwargs):
        if not self.booking_number:
            self.booking_number = self.generate_booking_number()
        super().save(*args, **kwargs)

class PartyBooking(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_PAYMENT', 'Pending Payment'),
        ('DEPOSIT_PAID', 'Deposit Paid'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('FULLY_PAID', 'Fully Paid'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
        ('EXPIRED', 'Expired'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PARTIAL', 'Partially Paid'),
        ('PAID', 'Fully Paid'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    ]
    
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    date = models.DateField()
    time = models.TimeField()
    package_name = models.CharField(max_length=255)
    kids = models.IntegerField(default=0)
    adults = models.IntegerField(default=0)
    spectators = models.IntegerField(default=0, help_text="Non-participating spectators")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total amount paid so far")
    
    package_price = models.DecimalField(max_digits=10, decimal_places=2, default=250.00, help_text="Base package price")
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Deposit amount required/paid")
    voucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, related_name='party_bookings')
    voucher_code = models.CharField(max_length=50, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Voucher discount taken off")
    payment_type = models.CharField(max_length=20, default='FULL', choices=[('DEPOSIT', 'Deposit (50%)'), ('FULL', 'Full Payment (100%)')])
    
    reschedule_count = models.IntegerField(default=0, help_text="Number of times this party was rescheduled")
    original_date = models.DateField(null=True, blank=True, help_text="Original date before reschedule")
    admin_fee_charged = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Admin fees charged for rescheduling")

    birthday_child_name = models.CharField(max_length=255, null=True, blank=True)
    birthday_child_age = models.IntegerField(null=True, blank=True)

    # Special requests & dietary info from booking form
    special_requests = models.TextField(null=True, blank=True, help_text="Customer special requests entered during booking")
    dietary_restrictions = models.TextField(null=True, blank=True, help_text="Dietary restrictions submitted by customer")

    # Participant Details
    participants = models.JSONField(null=True, blank=True)
    # Structure: {
    #   "adults": [{"name": "John Doe", "email": "john@example.com", "phone": "123", "dob": "1990-01-01"}],
    #   "minors": [{"name": "Jane Doe", "dob": "2015-05-10", "guardian": "John Doe"}]
    # }
    
    # Waiver Information
    waiver_signed = models.BooleanField(default=False)
    waiver_signed_at = models.DateTimeField(null=True, blank=True)
    waiver_ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='party_bookings')
    booking_number = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Booking number, e.g. GP105377 (see references.py)")
    online_checkout = models.BooleanField(default=False, help_text="Booked on the website and paid online (released if left unpaid, see unpaid.py)")
    
    # Arrival tracking (matching Booking model)
    arrived = models.BooleanField(default=False)
    arrived_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['date', 'time']),  # For availability checks
            models.Index(fields=['email']),  # For customer lookups
            models.Index(fields=['name']),   # For global search
            models.Index(fields=['phone']),  # For global search
            models.Index(fields=['uuid']),  # For ticket retrieval
            models.Index(fields=['status']),  # For filtering by status
            models.Index(fields=['-created_at']),  # For sorting by newest
            models.Index(fields=['customer']),  # Foreign key lookup
        ]
        ordering = ['-created_at']
        verbose_name = 'Party Booking'
        verbose_name_plural = 'Party Bookings'

    def __str__(self):
        return f"Party {self.id} - {self.name}"
    
    @property
    def remaining_balance(self):
        """Calculate remaining balance to be paid"""
        return self.amount - self.paid_amount
    
    def generate_booking_number(self):
        """Short random booking number, e.g. GP105377."""
        from .references import new_reference, PARTY_PREFIX
        return new_reference(PARTY_PREFIX, PartyBooking)
    
    def save(self, *args, **kwargs):
        if not self.booking_number:
            self.booking_number = self.generate_booking_number()
        super().save(*args, **kwargs)


class Transaction(models.Model):
    METHOD_CHOICES = [
        ('SUMUP', 'SumUp'),
        ('CASH', 'Cash'),
        ('STRIPE', 'Stripe'),
        ('RAZORPAY', 'Razorpay'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='GBP')
    transaction_id = models.CharField(max_length=255, unique=True)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_id} - {self.amount} {self.currency}"

class BookingBlock(models.Model):
    TYPE_CHOICES = [
        ('BLOCKED_DATE', 'Blocked Date'),
        ('CLOSED_TODAY', 'Closed Today (Popup)'),
        ('OPEN_TODAY', 'Special opening'),
        ('SLOT_CLOSED', 'Individual Slot Closed'),
        # Legacy choices kept for backward compatibility
        ('CLOSED', 'Closed'),
        ('MAINTENANCE', 'Maintenance'),
        ('PRIVATE_EVENT', 'Private Event'),
        ('OTHER', 'Other'),
    ]

    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='BLOCKED_DATE')
    recurring = models.BooleanField(default=False)
    # Individual time slot override (e.g. close only the 10:00 slot)
    slot_time = models.TimeField(null=True, blank=True, help_text='If set, this block applies only to bookings at this time slot')
    # GKP granular override fields
    blocks_normal_bookings = models.BooleanField(default=True, help_text='Block normal session bookings on this date')
    blocks_party_bookings = models.BooleanField(default=True, help_text='Block party bookings on this date')
    # Special opening (type OPEN_TODAY): optional hours, otherwise the holiday hours are used
    open_time = models.TimeField(null=True, blank=True, help_text='Opening time for a special opening')
    close_time = models.TimeField(null=True, blank=True, help_text='Closing time for a special opening')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.type}] {self.reason} ({self.start_date} - {self.end_date})"

class SessionBookingHistory(models.Model):
    """
    Stores session bookings that were paid but not saved due to system errors.
    Allows admins to restore these bookings to the main Booking table.
    """
    # Original booking data (copied from Booking model)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    date = models.DateField()
    time = models.TimeField()
    duration = models.IntegerField(help_text="Duration in minutes")
    adults = models.IntegerField(default=0)
    kids = models.IntegerField(default=0)
    spectators = models.IntegerField(default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    voucher_code = models.CharField(max_length=50, null=True, blank=True)
    
    # History-specific fields
    original_booking_id = models.IntegerField(null=True, blank=True, help_text="Original booking ID if it existed")
    payment_transaction_id = models.CharField(max_length=255, null=True, blank=True, help_text="Payment gateway transaction ID")
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Amount actually paid")
    failure_reason = models.TextField(help_text="Why this booking went to history (e.g., 'Payment succeeded but save failed')")
    
    # Restore tracking
    restored = models.BooleanField(default=False, help_text="Whether this booking has been restored")
    restored_at = models.DateTimeField(null=True, blank=True, help_text="When the booking was restored")
    restored_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='restored_session_bookings', help_text="Admin who restored this booking")
    restored_booking_id = models.IntegerField(null=True, blank=True, help_text="ID of the booking created when restored")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Session Booking History"
        verbose_name_plural = "Session Booking History"
    
    def __str__(self):
        status = "Restored" if self.restored else "Pending"
        return f"Session History #{self.id} - {self.name} ({status})"

class PartyBookingHistory(models.Model):
    """
    Stores party bookings that were paid but not saved due to system errors.
    Allows admins to restore these bookings to the main PartyBooking table.
    """
    # Original booking data (copied from PartyBooking model)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    date = models.DateField()
    time = models.TimeField()
    package_name = models.CharField(max_length=255)
    kids = models.IntegerField(default=0)
    adults = models.IntegerField(default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    birthday_child_name = models.CharField(max_length=255, null=True, blank=True)
    birthday_child_age = models.IntegerField(null=True, blank=True)
    participants = models.JSONField(null=True, blank=True)
    
    # History-specific fields
    original_booking_id = models.IntegerField(null=True, blank=True, help_text="Original booking ID if it existed")
    payment_transaction_id = models.CharField(max_length=255, null=True, blank=True, help_text="Payment gateway transaction ID")
    payment_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Amount actually paid")
    failure_reason = models.TextField(help_text="Why this booking went to history (e.g., 'Payment succeeded but save failed')")
    
    # Restore tracking
    restored = models.BooleanField(default=False, help_text="Whether this booking has been restored")
    restored_at = models.DateTimeField(null=True, blank=True, help_text="When the booking was restored")
    restored_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='restored_party_bookings', help_text="Admin who restored this booking")
    restored_booking_id = models.IntegerField(null=True, blank=True, help_text="ID of the booking created when restored")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Party Booking History"
        verbose_name_plural = "Party Booking History"
    
    def __str__(self):
        status = "Restored" if self.restored else "Pending"
        return f"Party History #{self.id} - {self.name} ({status})"


class BookingAuditLog(models.Model):
    booking_id = models.IntegerField(help_text="ID of the Booking or PartyBooking")
    booking_type = models.CharField(max_length=20, choices=[('SESSION', 'Session'), ('PARTY', 'Party')], default='SESSION')
    field_changed = models.CharField(max_length=100)
    old_value = models.CharField(max_length=255, null=True, blank=True)
    new_value = models.CharField(max_length=255, null=True, blank=True)
    changed_by = models.CharField(max_length=255, null=True, blank=True, help_text="Email or name of the admin who made the change")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Booking Audit Log"
        verbose_name_plural = "Booking Audit Logs"

    def __str__(self):
        return f"{self.booking_type} {self.booking_id}: {self.field_changed} changed to {self.new_value}"


# ─── SECTION 7: SPECIAL EVENTS ────────────────────────────────────────────────

class SpecialEvent(models.Model):
    """
    Represents a special event (Birthday Party, Christmas, Halloween, etc.)
    hosted at Go Kids Play. Events have their own pricing, capacity, and
    booking flow separate from standard session bookings.
    """
    EVENT_TYPE_CHOICES = [
        ('BIRTHDAY', 'Birthday Party'),
        ('CHRISTMAS', 'Christmas Party'),
        ('PAJAMA', 'Pajama Party'),
        ('HALLOWEEN', 'Halloween Party'),
        ('EASTER', 'Easter Party'),
        ('SCHOOL_HOLIDAY', 'School Holiday Event'),
        ('SUMMER', 'Summer Event'),
        ('SPECIAL', 'Special Event'),
        ('CUSTOM', 'Custom Event'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
        ('SOLD_OUT', 'Sold Out'),
    ]

    # Core Identity
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPE_CHOICES, default='SPECIAL')
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    short_description = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')

    # Scheduling
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    doors_open_time = models.TimeField(null=True, blank=True, help_text="Time doors open (can be before start_time)")

    # Capacity
    total_capacity = models.PositiveIntegerField(default=30, help_text="Maximum number of attendees")
    min_attendees = models.PositiveIntegerField(default=1)
    reserved_spots = models.PositiveIntegerField(default=0, help_text="Admin-reserved spots (not available for booking)")

    # Pricing (GBP)
    price_per_child = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Price per child (£)")
    price_per_adult = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Price per adult (£)")
    deposit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Deposit to secure a booking (£). 0 = full payment required.")
    is_free = models.BooleanField(default=False, help_text="If true, event is free (no payment required)")

    # Visuals
    # Full URL or an uploaded file path such as /media/uploads/cover.jpg
    cover_image = models.CharField(max_length=500, blank=True, null=True)
    gallery_images = models.JSONField(default=list, blank=True)
    accent_color = models.CharField(max_length=20, default='#8B5CF6', help_text="Brand colour for the event page")
    emoji = models.CharField(max_length=10, default='🎉')

    # Settings
    is_public = models.BooleanField(default=True, help_text="Show on the public events page")
    requires_age_verification = models.BooleanField(default=False)
    min_age = models.PositiveIntegerField(null=True, blank=True)
    max_age = models.PositiveIntegerField(null=True, blank=True)
    terms_and_conditions = models.TextField(blank=True)
    special_instructions = models.TextField(blank=True, help_text="Shown to customers after booking")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_events')

    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['event_type']),
            models.Index(fields=['slug']),
            models.Index(fields=['is_public']),
        ]
        verbose_name = 'Special Event'
        verbose_name_plural = 'Special Events'

    def __str__(self):
        return f"{self.title} ({self.date})"

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(f"{self.title}-{self.date}")
            slug = base_slug
            counter = 1
            while SpecialEvent.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def confirmed_booking_count(self):
        """Places taken by reservations that still hold a place (payment is taken at the venue)."""
        return self.event_bookings.exclude(status__in=EventBooking.RELEASED_STATUSES).aggregate(
            total=models.Sum('num_children') + models.Sum('num_adults')
        )['total'] or 0

    @property
    def available_spots(self):
        return max(0, self.total_capacity - self.reserved_spots - self.confirmed_booking_count)

    @property
    def is_sold_out(self):
        return self.available_spots == 0

    @property
    def duration_minutes(self):
        from datetime import datetime, date
        start = datetime.combine(date.today(), self.start_time)
        end = datetime.combine(date.today(), self.end_time)
        return int((end - start).total_seconds() / 60)


class EventBooking(models.Model):
    """
    A customer booking for a SpecialEvent.
    Handles deposit/full payment, capacity tracking, and confirmation.
    """
    # Reservations with these statuses no longer hold a place at the event
    RELEASED_STATUSES = ('CANCELLED', 'REFUNDED')

    STATUS_CHOICES = [
        ('PENDING', 'Pending Payment'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
        ('COMPLETED', 'Completed'),
        ('NO_SHOW', 'No Show'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('DEPOSIT_PAID', 'Deposit Paid'),
        ('FULLY_PAID', 'Fully Paid'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    ]

    # Identity
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    booking_reference = models.CharField(max_length=20, unique=True, blank=True)

    # Associations
    event = models.ForeignKey(SpecialEvent, on_delete=models.PROTECT, related_name='event_bookings')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='event_bookings')

    # Contact
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True)

    # Attendees
    num_children = models.PositiveIntegerField(default=0)
    num_adults = models.PositiveIntegerField(default=0)
    special_requirements = models.TextField(blank=True)

    # Pricing
    price_per_child = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    price_per_adult = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    deposit_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    balance_due = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')

    # Attendance
    arrived = models.BooleanField(default=False)
    arrived_at = models.DateTimeField(null=True, blank=True)

    # Admin notes
    notes = models.TextField(blank=True)

    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['email']),
            models.Index(fields=['booking_reference']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = 'Event Booking'
        verbose_name_plural = 'Event Bookings'

    def __str__(self):
        return f"EventBooking #{self.booking_reference} — {self.name} @ {self.event.title}"

    def generate_booking_reference(self):
        from .references import new_reference, EVENT_PREFIX
        return new_reference(EVENT_PREFIX, EventBooking, 'booking_reference')

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            self.booking_reference = self.generate_booking_reference()
        # Recalculate balance
        self.balance_due = max(0, self.subtotal - self.amount_paid)
        super().save(*args, **kwargs)


class EventRequest(models.Model):
    """
    A customer's request for Go Kids Play to organise an event for them
    (sent from the "Request an Event" form on the public events page).
    """
    STATUS_CHOICES = [
        ('NEW', 'New'),
        ('CONTACTED', 'Contacted'),
        ('QUOTED', 'Quote sent'),
        ('CONFIRMED', 'Confirmed'),
        ('DECLINED', 'Declined'),
        ('CANCELLED', 'Cancelled by customer'),
    ]

    reference = models.CharField(max_length=20, unique=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    event_type = models.CharField(max_length=30, choices=SpecialEvent.EVENT_TYPE_CHOICES, default='CUSTOM')
    preferred_date = models.DateField()
    alternative_date = models.DateField(null=True, blank=True)
    preferred_time = models.CharField(max_length=50, blank=True, help_text="e.g. Morning, Afternoon or 14:00")
    num_children = models.PositiveIntegerField(default=0)
    num_adults = models.PositiveIntegerField(default=0)
    budget = models.CharField(max_length=100, blank=True)
    details = models.TextField(help_text="What the customer would like")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NEW')
    admin_notes = models.TextField(blank=True)
    event = models.ForeignKey(SpecialEvent, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name='requests', help_text="Event created for this request")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['status', '-created_at'])]
        verbose_name = 'Event Request'
        verbose_name_plural = 'Event Requests'

    def __str__(self):
        return f"EventRequest {self.reference} — {self.name} ({self.get_event_type_display()})"

    def save(self, *args, **kwargs):
        if not self.reference:
            from .references import new_reference, EVENT_REQUEST_PREFIX
            self.reference = new_reference(EVENT_REQUEST_PREFIX, EventRequest, 'reference')
        super().save(*args, **kwargs)
