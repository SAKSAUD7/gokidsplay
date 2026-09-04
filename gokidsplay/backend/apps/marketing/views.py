from django.shortcuts import render
from django.http import HttpResponseBadRequest
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmailTemplate, MarketingCampaign, EmailSendLog, EmailEngagement, EmailUnsubscribe
from .serializers import EmailTemplateSerializer, MarketingCampaignSerializer
from .services import marketing_service
from django.http import HttpResponse, HttpResponseRedirect
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
import base64

def unsubscribe_view(request):
    """
    Public unsubscribe view.
    Zero auth required, but requires strict token validation.
    """
    token = request.GET.get('token')
    
    if not token:
        return HttpResponseBadRequest("Missing token")
        
    email = marketing_service.verify_unsubscribe_token(token)
    
    if not email:
        return HttpResponseBadRequest("Invalid or expired token")
        
    if request.method == 'POST':
        # Confirm unsubscribe
        marketing_service.unsubscribe_email(email, reason="User confirmed via web link")
        return render(request, 'marketing/unsubscribe_success.html', {'email': email, 'success': True})
        
    return render(request, 'marketing/unsubscribe_confirm.html', {'email': email})

class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all().order_by('-created_at')
    serializer_class = EmailTemplateSerializer
    filterset_fields = ['is_active', 'type']

    def get_queryset(self):
        return EmailTemplate.objects.all().order_by('-created_at')

class MarketingCampaignViewSet(viewsets.ModelViewSet):
    queryset = MarketingCampaign.objects.all().order_by('-created_at')
    serializer_class = MarketingCampaignSerializer
    filterset_fields = ['status', 'recipient_type']

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        campaign = self.get_object()
        
        if campaign.status == 'SENT':
            return Response(
                {"error": "Campaign already sent."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Trigger sending logic
            marketing_service.send_campaign(campaign.id)
            
            # Refresh to get updated fields
            campaign.refresh_from_db()
            branding_serializer = self.get_serializer(campaign)
            
            return Response({
                "message": f"Campaign '{campaign.title}' successfully sent.",
                "data": branding_serializer.data
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Email marketing dashboard statistics.
        """
        # Total campaigns
        total_campaigns = MarketingCampaign.objects.count()
        active_campaigns = MarketingCampaign.objects.filter(status='SCHEDULED').count()
        sent_campaigns = MarketingCampaign.objects.filter(status='SENT').count()
        
        # Total emails sent
        total_emails_sent = EmailSendLog.objects.filter(status='SENT').count()
        
        # Calculate open rate
        emails_with_opens = EmailSendLog.objects.filter(
            status='SENT',
            engagements__event_type='OPEN'
        ).distinct().count()
        
        avg_open_rate = (emails_with_opens / total_emails_sent * 100) if total_emails_sent > 0 else 0
        
        # Calculate click rate
        emails_with_clicks = EmailSendLog.objects.filter(
            status='SENT',
            engagements__event_type='CLICK'
        ).distinct().count()
        
        avg_click_rate = (emails_with_clicks / total_emails_sent * 100) if total_emails_sent > 0 else 0
        
        # Subscriber count (unique emails from send logs)
        subscriber_count = EmailSendLog.objects.values('recipient_email').distinct().count()
        
        # Unsubscribe rate
        unsubscribe_count = EmailUnsubscribe.objects.count()
        unsubscribe_rate = (unsubscribe_count / subscriber_count * 100) if subscriber_count > 0 else 0
        
        # Recent campaigns (last 5) - show all sent campaigns, not just those with send logs
        recent_campaigns = MarketingCampaign.objects.filter(
            status='SENT'
        ).order_by('-sent_at')[:5]
        
        recent_campaigns_data = []
        for campaign in recent_campaigns:
            # Use campaign.send_logs if available, otherwise use campaign.sent_count
            campaign_sends = campaign.send_logs.filter(status='SENT').count()
            
            # If no send logs, use the sent_count from campaign model
            if campaign_sends == 0:
                campaign_sends = campaign.sent_count
            
            campaign_opens = campaign.send_logs.filter(
                status='SENT',
                engagements__event_type='OPEN'
            ).distinct().count()
            campaign_clicks = campaign.send_logs.filter(
                status='SENT',
                engagements__event_type='CLICK'
            ).distinct().count()
            
            recent_campaigns_data.append({
                'id': campaign.id,
                'title': campaign.title,
                'sent_at': campaign.sent_at,
                'sent_count': campaign_sends,
                'open_rate': (campaign_opens / campaign_sends * 100) if campaign_sends > 0 else 0,
                'click_rate': (campaign_clicks / campaign_sends * 100) if campaign_sends > 0 else 0,
            })
        
        # Monthly growth (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_data = EmailSendLog.objects.filter(
            sent_at__gte=six_months_ago,
            status='SENT'
        ).extra(select={'month': "strftime('%%Y-%%m', sent_at)"}).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        return Response({
            'total_campaigns': total_campaigns,
            'active_campaigns': active_campaigns,
            'sent_campaigns': sent_campaigns,
            'total_emails_sent': total_emails_sent,
            'avg_open_rate': round(avg_open_rate, 1),
            'avg_click_rate': round(avg_click_rate, 1),
            'subscriber_count': subscriber_count,
            'unsubscribe_count': unsubscribe_count,
            'unsubscribe_rate': round(unsubscribe_rate, 1),
            'recent_campaigns': recent_campaigns_data,
            'monthly_growth': list(monthly_data),
        })

def email_tracking_pixel(request, tracking_id):
    """
    1x1 transparent pixel for email open tracking.
    """
    try:
        send_log = EmailSendLog.objects.get(tracking_id=tracking_id)
        
        # Record open event (only once per send_log to avoid duplicates)
        if not send_log.engagements.filter(event_type='OPEN').exists():
            EmailEngagement.objects.create(
                send_log=send_log,
                event_type='OPEN',
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                ip_address=request.META.get('REMOTE_ADDR')
            )
    except EmailSendLog.DoesNotExist:
        pass
    
    # Return 1x1 transparent GIF
    pixel = base64.b64decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
    return HttpResponse(pixel, content_type='image/gif')

def email_click_redirect(request, tracking_id):
    """
    Track link clicks and redirect to target URL.
    """
    target_url = request.GET.get('url', '/')
    
    try:
        send_log = EmailSendLog.objects.get(tracking_id=tracking_id)
        
        # Record click event
        EmailEngagement.objects.create(
            send_log=send_log,
            event_type='CLICK',
            event_url=target_url,
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            ip_address=request.META.get('REMOTE_ADDR')
        )
    except EmailSendLog.DoesNotExist:
        pass
    
    return HttpResponseRedirect(target_url)
