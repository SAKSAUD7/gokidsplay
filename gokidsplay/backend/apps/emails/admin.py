# pyright: reportIncompatibleVariableOverride=false
# pyright: reportMissingTypeStubs=false
from django.contrib import admin
from .models import EmailLog


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    """
    Read-only admin interface for viewing email logs.
    Provides filtering and search capabilities.
    """
    
    list_display = [
        'id',
        'email_type',
        'recipient_email',
        'recipient_name',
        'status',
        'retry_count',
        'created_at',
        'sent_at',
    ]
    
    list_filter = [
        'status',
        'email_type',
        'created_at',
        'sent_at',
    ]
    
    search_fields = [
        'recipient_email',
        'recipient_name',
        'subject',
        'message_id',
    ]
    
    readonly_fields = [
        'id',
        'email_type',
        'recipient_email',
        'recipient_name',
        'subject',
        'template_name',
        'context_data',
        'status',
        'error_message',
        'message_id',
        'retry_count',
        'max_retries',
        'next_retry_at',
        'booking',
        'party_booking',
        'contact_message',
        'created_at',
        'sent_at',
        'updated_at',
    ]
    
    fieldsets = (
        ('Email Details', {
            'fields': (
                'email_type',
                'recipient_email',
                'recipient_name',
                'subject',
            )
        }),
        ('Template & Content', {
            'fields': (
                'template_name',
                'context_data',
            )
        }),
        ('Status & Delivery', {
            'fields': (
                'status',
                'message_id',
                'error_message',
                'sent_at',
            )
        }),
        ('Retry Logic', {
            'fields': (
                'retry_count',
                'max_retries',
                'next_retry_at',
            )
        }),
        ('Relationships', {
            'fields': (
                'booking',
                'party_booking',
                'contact_message',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
    
    def has_add_permission(self, request):
        """Disable manual creation of email logs"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Disable deletion of email logs (audit trail) except for superusers"""
        return request.user.is_superuser
    
    def has_change_permission(self, request, obj=None):
        """Make all fields read-only"""
        return False
