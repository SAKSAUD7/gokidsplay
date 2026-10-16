"""
Django Admin for Payments app.

Provides comprehensive admin interface for viewing and managing payments.
All payment records are read-only to prevent manual editing.
"""

# pyright: reportIncompatibleVariableOverride=false
# pyright: reportMissingTypeStubs=false
# pyright: reportAttributeAccessIssue=false
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Admin interface for Payment model.
    
    Features:
    - Read-only fields (no manual editing)
    - Clickable booking links
    - Provider and status filtering
    - Search by order_id and payment_id
    - Detailed payment information display
    """
    
    list_display = [
        'id',
        'booking_link',
        'provider',
        'order_id',
        'payment_id',
        'amount_display',
        'status_display',
        'created_at',
    ]
    
    list_filter = [
        'provider',
        'status',
        'created_at',
    ]
    
    search_fields = [
        'order_id',
        'payment_id',
        'booking__id',
        'party_booking__id',
        'booking__email',
        'party_booking__email',
    ]
    
    readonly_fields = [
        'id',
        'booking',
        'party_booking',
        'provider',
        'order_id',
        'payment_id',
        'amount',
        'currency',
        'status',
        'provider_response',
        'notes',
        'created_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('Payment Information', {
            'fields': (
                'id',
                'provider',
                'order_id',
                'payment_id',
                'amount',
                'currency',
                'status',
            )
        }),
        ('Booking Reference', {
            'fields': (
                'booking',
                'party_booking',
            )
        }),
        ('Provider Details', {
            'fields': (
                'provider_response',
                'notes',
            ),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
    
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        """Disable manual payment creation"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow payment deletion only for superusers"""
        return request.user.is_superuser
    
    def booking_link(self, obj):
        """Display clickable link to booking"""
        if obj.booking:
            url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
            return format_html('<a href="{}">Session #{}</a>', url, obj.booking.id)
        elif obj.party_booking:
            url = reverse('admin:bookings_partybooking_change', args=[obj.party_booking.id])
            return format_html('<a href="{}">Party #{}</a>', url, obj.party_booking.id)
        return '-'
    booking_link.short_description = 'Booking'
    
    def amount_display(self, obj):
        """Display amount with currency symbol and color"""
        if obj.amount < 0:
            return format_html('<span style="color: red;">-£{}</span>', abs(obj.amount))
        return format_html('£{}', obj.amount)
    amount_display.short_description = 'Amount'
    amount_display.admin_order_field = 'amount'
    
    def status_display(self, obj):
        """Display status with color coding"""
        colors = {
            'CREATED': 'blue',
            'SUCCESS': 'green',
            'FAILED': 'red',
            'REFUNDED': 'orange',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.status
        )
    status_display.short_description = 'Status'
    status_display.admin_order_field = 'status'
