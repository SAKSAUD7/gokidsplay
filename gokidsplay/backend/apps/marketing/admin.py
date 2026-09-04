from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from .models import EmailUnsubscribe, EmailTemplate, MarketingCampaign, BirthdayEmailTracker, EmailSendLog, EmailEngagement
from .services import marketing_service

@admin.register(EmailUnsubscribe)
class EmailUnsubscribeAdmin(admin.ModelAdmin):
    list_display = ('email', 'reason', 'created_at')
    search_fields = ('email', 'reason')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'subject', 'is_active', 'updated_at')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'subject')

@admin.register(MarketingCampaign)
class MarketingCampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'recipient_type', 'status', 'sent_at', 'sent_count')
    list_filter = ('status', 'recipient_type', 'created_at')
    search_fields = ('title', 'subject')
    readonly_fields = ('sent_at', 'sent_count', 'failed_count', 'recipient_count')
    
    actions = ['send_campaign_action']
    
    def send_campaign_action(self, request, queryset):
        """Action to send selected campaigns."""
        processed = 0
        for campaign in queryset:
            if campaign.status == 'SENT':
                self.message_user(request, f"Campaign '{campaign.title}' already sent.", messages.WARNING)
                continue
                
            # Trigger sending (Sync for now, should be Async task in future)
            # In a real Azure setup, we would trigger a function or queue here.
            # But per "ZERO BREAKS", we keep it simple sync or pseudo-async.
            
            # Update status to sending
            campaign.status = 'SCHEDULED' # Or Processing
            campaign.save()
            
            try:
                marketing_service.send_campaign(campaign.id)
                processed += 1
                self.message_user(request, f"Campaign '{campaign.title}' sent successfully.", messages.SUCCESS)
            except Exception as e:
                self.message_user(request, f"Error sending '{campaign.title}': {str(e)}", messages.ERROR)
                
        if processed == 0:
            self.message_user(request, "No eligible campaigns processed.", messages.INFO)
            
    send_campaign_action.short_description = "Send Selected Campaigns"
    
@admin.register(BirthdayEmailTracker)
class BirthdayEmailTrackerAdmin(admin.ModelAdmin):
    list_display = ('email', 'year', 'sent_at')
    search_fields = ('email',)
    list_filter = ('year',)
    readonly_fields = ('sent_at',)

@admin.register(EmailSendLog)
class EmailSendLogAdmin(admin.ModelAdmin):
    list_display = ('recipient_email', 'campaign', 'status', 'sent_at', 'has_opens', 'has_clicks')
    list_filter = ('status', 'sent_at')
    search_fields = ('recipient_email', 'campaign__title')
    readonly_fields = ('tracking_id', 'sent_at')
    
    def has_opens(self, obj):
        return obj.engagements.filter(event_type='OPEN').exists()
    has_opens.boolean = True
    has_opens.short_description = 'Opened'
    
    def has_clicks(self, obj):
        return obj.engagements.filter(event_type='CLICK').exists()
    has_clicks.boolean = True
    has_clicks.short_description = 'Clicked'

@admin.register(EmailEngagement)
class EmailEngagementAdmin(admin.ModelAdmin):
    list_display = ('send_log', 'event_type', 'event_url', 'created_at', 'ip_address')
    list_filter = ('event_type', 'created_at')
    search_fields = ('send_log__recipient_email', 'event_url')
    readonly_fields = ('created_at',)
