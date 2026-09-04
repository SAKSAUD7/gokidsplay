from rest_framework import serializers
from .models import EmailTemplate, MarketingCampaign

class EmailTemplateSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'type', 'type_display', 'subject', 
            'html_content', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class MarketingCampaignSerializer(serializers.ModelSerializer):
    recipient_type_display = serializers.CharField(source='get_recipient_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = MarketingCampaign
        fields = [
            'id', 'title', 'subject', 'template', 'template_name', 
            'content', 'recipient_type', 'recipient_type_display', 'custom_email_list',
            'status', 'status_display', 'sent_at', 'scheduled_at',
            'recipient_count', 'sent_count', 'failed_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'status', 'sent_at', 'recipient_count', 
            'sent_count', 'failed_count', 'created_at', 'updated_at'
        ]
