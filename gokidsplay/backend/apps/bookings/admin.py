from django.contrib import admin
from django.utils.html import format_html
from .models import Customer, Booking, PartyBooking, Transaction, BookingBlock, SessionBookingHistory, PartyBookingHistory, SpecialEvent, EventBooking
from apps.payments.models import Payment

# Payment inline for Booking admin
class PaymentInline(admin.TabularInline):
    """Inline display of payments for bookings"""
    model = Payment
    fk_name = 'booking'
    extra = 0
    can_delete = False
    readonly_fields = ['provider', 'order_id', 'payment_id', 'amount_display', 'status_display', 'created_at']
    fields = ['provider', 'order_id', 'payment_id', 'amount_display', 'status_display', 'created_at']
    
    def amount_display(self, obj):
        """Display amount with color"""
        if obj.amount < 0:
            return format_html('<span style="color: red;">-£{}</span>', abs(obj.amount))
        return format_html('£{}', obj.amount)
    amount_display.short_description = 'Amount'
    
    def status_display(self, obj):
        """Display status with color"""
        colors = {'CREATED': 'blue', 'SUCCESS': 'green', 'FAILED': 'red', 'REFUNDED': 'orange'}
        color = colors.get(obj.status, 'gray')
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.status)
    status_display.short_description = 'Status'
    
    def has_add_permission(self, request, obj=None):
        return False

# Party Payment inline
class PartyPaymentInline(admin.TabularInline):
    """Inline display of payments for party bookings"""
    model = Payment
    fk_name = 'party_booking'
    extra = 0
    can_delete = False
    readonly_fields = ['provider', 'order_id', 'payment_id', 'amount_display', 'status_display', 'created_at']
    fields = ['provider', 'order_id', 'payment_id', 'amount_display', 'status_display', 'created_at']
    
    def amount_display(self, obj):
        """Display amount with color"""
        if obj.amount < 0:
            return format_html('<span style="color: red;">-£{}</span>', abs(obj.amount))
        return format_html('£{}', obj.amount)
    amount_display.short_description = 'Amount'
    
    def status_display(self, obj):
        """Display status with color"""
        colors = {'CREATED': 'blue', 'SUCCESS': 'green', 'FAILED': 'red', 'REFUNDED': 'orange'}
        color = colors.get(obj.status, 'gray')
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', color, obj.status)
    status_display.short_description = 'Status'
    
    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'phone', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'email', 'phone']
    ordering = ['-created_at']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'uuid', 'name', 'email', 'date', 'time', 'adults', 'kids', 'amount_display', 'paid_amount_display', 'remaining_display', 'booking_status', 'payment_status', 'waiver_status', 'created_at']
    list_filter = ['booking_status', 'payment_status', 'waiver_status', 'type', 'date', 'created_at']
    search_fields = ['name', 'email', 'phone', 'uuid']
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'remaining_balance_display']
    ordering = ['-created_at']
    inlines = [PaymentInline]
    
    def amount_display(self, obj):
        return format_html('£{}', obj.amount)
    amount_display.short_description = 'Total (GBP)'
    amount_display.admin_order_field = 'amount'
    
    def paid_amount_display(self, obj):
        return format_html('£{}', obj.paid_amount)
    paid_amount_display.short_description = 'Paid (GBP)'
    paid_amount_display.admin_order_field = 'paid_amount'
    
    def remaining_display(self, obj):
        remaining = obj.remaining_balance
        if remaining > 0:
            return format_html('<span style="color: orange;">£{}</span>', remaining)
        return format_html('<span style="color: green;">£0</span>')
    remaining_display.short_description = 'Remaining'
    
    def remaining_balance_display(self, obj):
        return format_html('£{}', obj.remaining_balance)
    remaining_balance_display.short_description = 'Remaining Balance'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone', 'customer')
        }),
        ('Booking Details', {
            'fields': ('date', 'time', 'duration', 'type', 'adults', 'kids', 'spectators')
        }),
        ('Payment', {
            'fields': ('amount', 'paid_amount', 'remaining_balance_display', 'subtotal', 'discount_amount', 'voucher_code', 'voucher')
        }),
        ('Status', {
            'fields': ('booking_status', 'payment_status', 'waiver_status', 'status')
        }),
        ('QR Code', {
            'fields': ('qr_code',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(PartyBooking)
class PartyBookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking_number', 'name', 'email', 'phone', 'date', 'time', 'package_name', 'kids', 'adults', 'amount_display', 'paid_amount_display', 'remaining_display', 'status', 'payment_status', 'waiver_signed', 'created_at']
    list_filter = ['status', 'payment_status', 'waiver_signed', 'date', 'package_name', 'created_at']
    search_fields = ['name', 'email', 'phone', 'uuid', 'package_name', 'birthday_child_name', 'booking_number']
    readonly_fields = ['uuid', 'booking_number', 'created_at', 'updated_at', 'remaining_balance_display']
    ordering = ['-created_at']
    inlines = [PartyPaymentInline]
    
    def amount_display(self, obj):
        return format_html('£{}', obj.amount)
    amount_display.short_description = 'Total (GBP)'
    amount_display.admin_order_field = 'amount'
    
    def paid_amount_display(self, obj):
        return format_html('£{}', obj.paid_amount)
    paid_amount_display.short_description = 'Paid (GBP)'
    paid_amount_display.admin_order_field = 'paid_amount'
    
    def remaining_display(self, obj):
        remaining = obj.remaining_balance
        if remaining > 0:
            return format_html('<span style="color: orange;">£{}</span>', remaining)
        return format_html('<span style="color: green;">£0</span>')
    remaining_display.short_description = 'Balance Due'
    
    def remaining_balance_display(self, obj):
        return format_html('£{}', obj.remaining_balance)
    remaining_balance_display.short_description = 'Remaining Balance (GBP)'
    
    fieldsets = (
        ('Booking Reference', {
            'fields': ('uuid', 'booking_number')
        }),
        ('Customer Information', {
            'fields': ('name', 'email', 'phone', 'customer')
        }),
        ('Party Details', {
            'fields': ('date', 'time', 'package_name', 'kids', 'adults', 'spectators')
        }),
        ('Birthday Child', {
            'fields': ('birthday_child_name', 'birthday_child_age')
        }),
        ('Special Requests', {
            'fields': ('special_requests', 'dietary_restrictions')
        }),
        ('Pricing', {
            'fields': ('amount', 'paid_amount', 'remaining_balance_display')
        }),
        ('Participants & Waiver', {
            'fields': ('participants', 'waiver_signed', 'waiver_signed_at', 'waiver_ip_address')
        }),
        ('Status', {
            'fields': ('status', 'payment_status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


# ─── Section 7: Special Events Admin ──────────────────────────────────────────

class EventBookingInline(admin.TabularInline):
    model = EventBooking
    extra = 0
    can_delete = False
    readonly_fields = ['booking_reference', 'name', 'email', 'num_children', 'num_adults', 'subtotal', 'amount_paid', 'status', 'payment_status', 'arrived', 'created_at']
    fields = ['booking_reference', 'name', 'email', 'num_children', 'num_adults', 'subtotal', 'amount_paid', 'status', 'payment_status', 'arrived']


@admin.register(SpecialEvent)
class SpecialEventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'date', 'start_time', 'status', 'total_capacity', 'available_spots_display', 'is_public', 'created_at']
    list_filter = ['status', 'event_type', 'is_public', 'date']
    search_fields = ['title', 'description']
    readonly_fields = ['uuid', 'slug', 'created_at', 'updated_at', 'available_spots_display']
    ordering = ['date', 'start_time']
    inlines = [EventBookingInline]
    fieldsets = (
        ('Event Identity', {
            'fields': ('uuid', 'event_type', 'title', 'slug', 'short_description', 'description', 'status', 'emoji')
        }),
        ('Scheduling', {
            'fields': ('date', 'start_time', 'end_time', 'doors_open_time')
        }),
        ('Capacity', {
            'fields': ('total_capacity', 'min_attendees', 'reserved_spots', 'available_spots_display')
        }),
        ('Pricing (GBP)', {
            'fields': ('price_per_child', 'price_per_adult', 'deposit_amount', 'is_free')
        }),
        ('Visuals', {
            'fields': ('cover_image', 'gallery_images', 'accent_color'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('is_public', 'requires_age_verification', 'min_age', 'max_age')
        }),
        ('Content', {
            'fields': ('terms_and_conditions', 'special_instructions'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'created_by')
        }),
    )

    def available_spots_display(self, obj):
        spots = obj.available_spots
        color = 'green' if spots > 5 else ('orange' if spots > 0 else 'red')
        return format_html('<span style="color: {}; font-weight: bold;">{} spots left</span>', color, spots)
    available_spots_display.short_description = 'Available Spots'


@admin.register(EventBooking)
class EventBookingAdmin(admin.ModelAdmin):
    list_display = ['booking_reference', 'name', 'email', 'event_link', 'num_children', 'num_adults', 'subtotal_display', 'amount_paid_display', 'status', 'payment_status', 'arrived', 'created_at']
    list_filter = ['status', 'payment_status', 'arrived', 'event__date']
    search_fields = ['name', 'email', 'booking_reference', 'phone']
    readonly_fields = ['uuid', 'booking_reference', 'created_at', 'updated_at']
    ordering = ['-created_at']
    raw_id_fields = ['event', 'customer']
    fieldsets = (
        ('Booking Identity', {
            'fields': ('uuid', 'booking_reference', 'event', 'customer')
        }),
        ('Contact', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Attendees', {
            'fields': ('num_children', 'num_adults', 'special_requirements')
        }),
        ('Pricing (GBP)', {
            'fields': ('price_per_child', 'price_per_adult', 'subtotal', 'deposit_amount', 'amount_paid', 'balance_due')
        }),
        ('Status', {
            'fields': ('status', 'payment_status')
        }),
        ('Attendance', {
            'fields': ('arrived', 'arrived_at')
        }),
        ('Admin Notes', {
            'fields': ('notes',)
        }),
        ('Timestamps', {
            'fields': ('ip_address', 'created_at', 'updated_at')
        }),
    )

    def subtotal_display(self, obj):
        return format_html('£{:.2f}', obj.subtotal)
    subtotal_display.short_description = 'Total'

    def amount_paid_display(self, obj):
        color = 'green' if obj.amount_paid >= obj.subtotal else ('orange' if obj.amount_paid > 0 else 'red')
        return format_html('<span style="color: {};">£{:.2f}</span>', color, obj.amount_paid)
    amount_paid_display.short_description = 'Paid'

    def event_link(self, obj):
        return format_html('<a href="/admin/bookings/specialevent/{}/change/">{}</a>', obj.event.id, obj.event.title)
    event_link.short_description = 'Event'
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'transaction_id', 'booking', 'amount', 'currency', 'payment_method', 'status', 'created_at']
    list_filter = ['payment_method', 'status', 'currency', 'created_at']
    search_fields = ['transaction_id', 'booking__name', 'booking__email']
    readonly_fields = ['created_at']
    ordering = ['-created_at']

@admin.register(BookingBlock)
class BookingBlockAdmin(admin.ModelAdmin):
    list_display = ['id', 'reason', 'type', 'start_date', 'end_date', 'recurring', 'created_at']
    list_filter = ['type', 'recurring', 'created_at']
    search_fields = ['reason']
    ordering = ['-start_date']
    fieldsets = (
        ('Block Details', {
            'fields': ('reason', 'type', 'recurring')
        }),
        ('Date Range', {
            'fields': ('start_date', 'end_date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(SessionBookingHistory)
class SessionBookingHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'date', 'time', 'amount', 'restored', 'restored_at', 'restored_by', 'created_at']
    list_filter = ['restored', 'date', 'created_at', 'restored_at']
    search_fields = ['name', 'email', 'phone', 'failure_reason']
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'restored', 'restored_at', 'restored_by', 'restored_booking_id']
    ordering = ['-created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone')
        }),
        ('Booking Details', {
            'fields': ('date', 'time', 'duration', 'adults', 'kids', 'spectators')
        }),
        ('Payment', {
            'fields': ('amount', 'subtotal', 'discount_amount', 'voucher_code', 'payment_amount', 'payment_transaction_id')
        }),
        ('History Information', {
            'fields': ('original_booking_id', 'failure_reason')
        }),
        ('Restore Status', {
            'fields': ('restored', 'restored_at', 'restored_by', 'restored_booking_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(PartyBookingHistory)
class PartyBookingHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'date', 'time', 'package_name', 'amount', 'restored', 'restored_at', 'restored_by', 'created_at']
    list_filter = ['restored', 'date', 'created_at', 'restored_at']
    search_fields = ['name', 'email', 'phone', 'package_name', 'birthday_child_name', 'failure_reason']
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'restored', 'restored_at', 'restored_by', 'restored_booking_id']
    ordering = ['-created_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'name', 'email', 'phone')
        }),
        ('Party Details', {
            'fields': ('date', 'time', 'package_name', 'kids', 'adults', 'amount')
        }),
        ('Birthday Child', {
            'fields': ('birthday_child_name', 'birthday_child_age')
        }),
        ('Participants', {
            'fields': ('participants',)
        }),
        ('Payment', {
            'fields': ('payment_amount', 'payment_transaction_id')
        }),
        ('History Information', {
            'fields': ('original_booking_id', 'failure_reason')
        }),
        ('Restore Status', {
            'fields': ('restored', 'restored_at', 'restored_by', 'restored_booking_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

