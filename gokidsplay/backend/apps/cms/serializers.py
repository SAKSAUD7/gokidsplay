from rest_framework import serializers
from .models import (
    Banner, Activity, Faq, SocialLink, GalleryItem,
    StatCard, InstagramReel, MenuSection, GroupPackage, GuidelineCategory, LegalDocument,
    PageSection, PricingPlan, ContactInfo, PartyPackage, TimelineItem, ValueItem, FacilityItem,
    Page, ContactMessage, FreeEntry, SessionBookingConfig, PartyBookingConfig, PricingCarouselImage,
    BookingInformation, TimingCard, CustomerAccountConfig
)


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = '__all__'

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = '__all__'

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'

class FaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = Faq
        fields = '__all__'

class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = '__all__'

class GalleryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryItem
        fields = '__all__'

class StatCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatCard
        fields = '__all__'

class InstagramReelSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstagramReel
        fields = '__all__'

class MenuSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuSection
        fields = '__all__'

class GroupPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupPackage
        fields = '__all__'

class GuidelineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = GuidelineCategory
        fields = '__all__'

class LegalDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalDocument
        fields = '__all__'

class PageSectionSerializer(serializers.ModelSerializer):
    # Override URL fields to allow blank values and relative URLs
    image_url = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    video_url = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    cta_link = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = PageSection
        fields = '__all__'

class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = '__all__'

class ContactInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInfo
        fields = '__all__'

class PartyPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyPackage
        fields = '__all__'

class TimelineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineItem
        fields = '__all__'

class ValueItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValueItem
        fields = '__all__'

class FacilityItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityItem
        fields = '__all__'

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        read_only_fields = ['is_read', 'created_at']

class FreeEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FreeEntry
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class SessionBookingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionBookingConfig
        fields = '__all__'

class PartyBookingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyBookingConfig
        fields = '__all__'

class PricingCarouselImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingCarouselImage
        fields = '__all__'

class BookingInformationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingInformation
        fields = '__all__'

class TimingCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimingCard
        fields = '__all__'

class CustomerAccountConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAccountConfig
        fields = '__all__'
