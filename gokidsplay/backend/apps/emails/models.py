from django.db import models
from django.utils import timezone


class EmailLog(models.Model):
    """
    Audit log for all emails sent by the system.
    Tracks status, retries, and relationships to bookings.
    """
    
    EMAIL_TYPE_CHOICES = [
        # Bookings
        ('BOOKING_CONFIRMATION', 'Booking Confirmation'),
        ('BOOKING_REMINDER', 'Booking Reminder'),
        ('BOOKING_CANCELLED', 'Booking Cancelled'),
        ('BOOKING_RESCHEDULED', 'Booking Rescheduled'),
        
        # Party Bookings
        ('PARTY_BOOKING_CONFIRMATION', 'Party Booking Confirmation'),
        ('PARTY_DEPOSIT_PAID', 'Party Deposit Paid'),
        ('PARTY_FULL_PAID', 'Party Full Paid'),
        ('PARTY_BALANCE_DUE', 'Party Balance Due'),
        ('PARTY_REMINDER', 'Party Reminder'),
        ('PARTY_RESCHEDULED', 'Party Rescheduled'),
        ('PARTY_CANCELLED', 'Party Cancelled'),
        ('PARTY_COMPLETED', 'Party Completed'),
        
        # Payments
        ('PAYMENT_CONFIRMATION', 'Payment Confirmation'),
        ('PAYMENT_RECEIPT', 'Payment Receipt'),
        ('PAYMENT_INVOICE', 'Payment Invoice'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('PAYMENT_REFUNDED', 'Payment Refunded'),
        ('BALANCE_PAID', 'Balance Paid'),
        
        # Waivers
        ('WAIVER_CONFIRMATION', 'Waiver Confirmation'),
        ('WAIVER_REMINDER', 'Waiver Reminder'),
        ('WAIVER_SECURE_LINK', 'Waiver Secure Link'),
        ('ADMIN_WAIVER_NOTIFICATION', 'Admin: Waiver Notification'),
        
        # Vouchers & Memberships
        ('VOUCHER_PURCHASED', 'Voucher Purchased'),
        ('VOUCHER_REDEEMED', 'Voucher Redeemed'),
        ('VOUCHER_EXPIRY_REMINDER', 'Voucher Expiry Reminder'),
        ('GIFT_VOUCHER', 'Gift Voucher'),
        ('MEMBERSHIP_PURCHASED', 'Membership Purchased'),
        ('MEMBERSHIP_RENEWAL', 'Membership Renewal Reminder'),
        ('MEMBERSHIP_EXPIRED', 'Membership Expired'),
        ('MEMBERSHIP_CANCELLED', 'Membership Cancelled'),
        ('MEMBERSHIP_UPDATED', 'Membership Updated'),
        ('MEMBERSHIP_WELCOME', 'Membership Welcome'),
        
        # Accounts
        ('ACCOUNT_WELCOME', 'Account Welcome'),
        ('ACCOUNT_PASSWORD_RESET', 'Account Password Reset'),
        ('ACCOUNT_EMAIL_VERIFICATION', 'Account Email Verification'),
        ('ACCOUNT_EMAIL_CHANGED', 'Account Email Changed'),
        ('ACCOUNT_PROFILE_UPDATED', 'Account Profile Updated'),
        ('ACCOUNT_DELETED', 'Account Deleted'),
        
        # Free Entry & CMS
        ('FREE_ENTRY_CONFIRMATION', 'Free Entry Confirmation'),
        ('ADMIN_FREE_ENTRY', 'Admin: Free Entry'),
        ('ADMIN_CONTACT_MESSAGE', 'Admin: Contact Message'),
        ('CONTACT_CONFIRMATION', 'Contact Message Confirmation'),
        
        # Admin Notifications
        ('ADMIN_NOTIFICATION', 'Admin: Booking Notice'),
        ('EVENT_REQUEST_RECEIVED', 'Event Request Received'),
        ('POST_VISIT_THANK_YOU', 'Thank You After the Visit'),
        ('ADMIN_NEW_BOOKING', 'Admin: New Booking'),
        ('ADMIN_PARTY_BOOKING', 'Admin: Party Booking'),
        ('ADMIN_MEMBERSHIP_PURCHASE', 'Admin: Membership Purchase'),
        ('ADMIN_LARGE_BOOKING', 'Admin: Large Booking'),
        ('ADMIN_REFUND_REQUEST', 'Admin: Refund Request'),
        ('ADMIN_PAYMENT_FAILURE', 'Admin: Payment Failure'),
        ('ADMIN_SYSTEM_ERROR', 'Admin: System Error'),
        
        # Marketing
        ('MARKETING_CAMPAIGN', 'Marketing Campaign'),
        ('BIRTHDAY_MARKETING', 'Birthday Automation'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    # Email Metadata
    email_type = models.CharField(
        max_length=50, 
        choices=EMAIL_TYPE_CHOICES,
        help_text="Type of email being sent"
    )
    recipient_email = models.EmailField(help_text="Email address of recipient")
    recipient_name = models.CharField(max_length=255, null=True, blank=True)
    subject = models.CharField(max_length=255, help_text="Email subject line")
    
    # Content (stored as JSON for flexibility)
    template_name = models.CharField(max_length=100, help_text="Template file used")
    context_data = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Template variables as JSON"
    )
    
    # Sending Status
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='PENDING',
        db_index=True
    )
    error_message = models.TextField(
        null=True, 
        blank=True,
        help_text="Error details if sending failed"
    )
    
    # Azure Communication Services Response
    message_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Azure message ID for tracking"
    )
    
    # Retry Logic
    retry_count = models.IntegerField(
        default=0,
        help_text="Number of retry attempts made"
    )
    max_retries = models.IntegerField(
        default=3,
        help_text="Maximum number of retries allowed"
    )
    next_retry_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When to retry next (if failed)"
    )
    
    # Relationships (nullable - emails can exist independently)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_logs',
        help_text="Related session booking (if any)"
    )
    party_booking = models.ForeignKey(
        'bookings.PartyBooking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_logs',
        help_text="Related party booking (if any)"
    )
    contact_message = models.ForeignKey(
        'cms.ContactMessage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_logs',
        help_text="Related contact message (if any)"
    )
    
    # Generic reference for items without explicit ForeignKeys (Vouchers, Memberships, Customers)
    reference_id = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="ID of the related object if no ForeignKey exists"
    )
    reference_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Type of the related object (e.g. Voucher, Customer)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When email was queued"
    )
    sent_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When email was successfully sent"
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Email Log'
        verbose_name_plural = 'Email Logs'
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['email_type', 'created_at']),
            models.Index(fields=['recipient_email']),
            models.Index(fields=['next_retry_at']),
        ]
    
    def __str__(self):
        return f"{self.email_type} to {self.recipient_email} - {self.status}"
    
    def mark_sent(self, message_id=None):
        """Mark email as successfully sent"""
        self.status = 'SENT'
        self.sent_at = timezone.now()
        if message_id:
            self.message_id = message_id
        self.save()
    
    def mark_failed(self, error_message):
        """Mark email as failed and schedule retry if applicable"""
        self.status = 'FAILED'
        self.error_message = error_message
        self.retry_count += 1
        
        if self.retry_count < self.max_retries:
            # Exponential backoff: 1min, 2min, 4min
            delay_minutes = 2 ** (self.retry_count - 1)
            self.next_retry_at = timezone.now() + timezone.timedelta(minutes=delay_minutes)
        
        self.save()
    
    def can_retry(self):
        """Check if email can be retried"""
        return (
            self.status == 'FAILED' and
            self.retry_count < self.max_retries and
            self.next_retry_at and
            timezone.now() >= self.next_retry_at
        )
