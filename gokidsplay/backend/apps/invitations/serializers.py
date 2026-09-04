from rest_framework import serializers
from .models import InvitationTemplate, BookingInvitation

class InvitationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvitationTemplate
        fields = '__all__'

class BookingInvitationSerializer(serializers.ModelSerializer):
    template_details = InvitationTemplateSerializer(source='template', read_only=True)
    
    class Meta:
        model = BookingInvitation
        fields = ['id', 'uuid', 'booking', 'template', 'template_details', 'child_name', 'party_date', 'party_time', 'venue', 'custom_message', 'created_at']

class PublicInvitationSerializer(serializers.ModelSerializer):
    template_image = serializers.SerializerMethodField()
    template_title = serializers.SerializerMethodField()
    
    class Meta:
        model = BookingInvitation
        fields = ['uuid', 'child_name', 'party_date', 'party_time', 'venue', 'custom_message', 'template_image', 'template_title']

    def get_template_image(self, obj):
        if obj.template and obj.template.background_image:
            return obj.template.background_image.url
        return None

    def get_template_title(self, obj):
        if obj.template:
            return obj.template.default_title
        return "You're Invited!"
