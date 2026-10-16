"""
Payment models for Ninja Inflatable Park.

Supports multiple payment providers (Mock, Razorpay) with a unified interface.
Tracks all payment transactions including partial payments and refunds.
"""

from django.db import models
from django.utils import timezone
from decimal import Decimal


class Payment(models.Model):
    """
    Payment transaction record.
    
    Supports:
    - Multiple providers (Mock, Razorpay)
    - Partial payments
    - Refunds (stored as negative amounts)
    - Full audit trail
    """
    
    PROVIDER_CHOICES = [
        ('SUMUP', 'SumUp'),
        ('MOCK', 'Mock Gateway'),
        ('RAZORPAY', 'Razorpay'),
    ]
    
    STATUS_CHOICES = [
        ('CREATED', 'Created'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    
    # Relationships (one of these will be set)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True,
        help_text="Session booking this payment belongs to"
    )
    party_booking = models.ForeignKey(
        'bookings.PartyBooking',
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True,
        help_text="Party booking this payment belongs to"
    )
    
    # Payment Details
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        help_text="Payment gateway provider"
    )
    order_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique order ID from payment gateway"
    )
    payment_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        help_text="Payment ID from gateway (set after successful payment)"
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Payment amount (negative for refunds)"
    )
    currency = models.CharField(
        max_length=3,
        default='GBP',
        help_text="Currency code"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='CREATED',
        db_index=True,
        help_text="Payment status"
    )
    
    # Metadata
    provider_response = models.JSONField(
        null=True,
        blank=True,
        help_text="Raw response from payment provider"
    )
    notes = models.TextField(
        null=True,
        blank=True,
        help_text="Internal notes about this payment"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['provider', 'status']),
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['party_booking', 'status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        booking_ref = f"Booking #{self.booking_id}" if self.booking else f"Party #{self.party_booking_id}"
        return f"Payment {self.order_id} - {booking_ref} - £{self.amount}"
    
    def get_booking(self):
        """Get the associated booking (either session or party)"""
        return self.booking or self.party_booking
    
    def is_refund(self):
        """Check if this is a refund payment"""
        return self.amount < 0
    
    def mark_success(self, payment_id, provider_response=None):
        """Mark payment as successful"""
        self.status = 'SUCCESS'
        self.payment_id = payment_id
        if provider_response:
            self.provider_response = provider_response
        self.save()
    
    def mark_failed(self, error_message=None):
        """Mark payment as failed"""
        self.status = 'FAILED'
        if error_message:
            self.notes = error_message
        self.save()
