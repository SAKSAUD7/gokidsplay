from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import google_reviews_view, google_reviews_sync_view
from .views import (
    BannerViewSet, ActivityViewSet, FaqViewSet, TestimonialViewSet, SocialLinkViewSet, GalleryItemViewSet,
    StatCardViewSet, InstagramReelViewSet, MenuSectionViewSet,
    GuidelineCategoryViewSet, LegalDocumentViewSet,
    PageSectionViewSet, PricingPlanViewSet, ContactInfoViewSet, PartyPackageViewSet,
    TimelineItemViewSet, ValueItemViewSet, FacilityItemViewSet,
    PageViewSet, UploadView, ReorderView, ContactMessageViewSet, FreeEntryViewSet, SessionBookingConfigViewSet, PartyBookingConfigViewSet,
    attraction_video_view, PricingCarouselImageViewSet, BookingInformationViewSet, TimingCardViewSet, CustomerAccountConfigViewSet
)

router = DefaultRouter()
router.register(r'banners', BannerViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'faqs', FaqViewSet)
router.register(r'testimonials', TestimonialViewSet)
router.register(r'social-links', SocialLinkViewSet)
router.register(r'gallery', GalleryItemViewSet)
router.register(r'stat-cards', StatCardViewSet)
router.register(r'instagram-reels', InstagramReelViewSet)
router.register(r'menu-sections', MenuSectionViewSet)
router.register(r'guideline-categories', GuidelineCategoryViewSet)
router.register(r'legal-documents', LegalDocumentViewSet)
router.register(r'page-sections', PageSectionViewSet)
router.register(r'pricing-plans', PricingPlanViewSet)
router.register(r'contact-info', ContactInfoViewSet)
router.register(r'party-packages', PartyPackageViewSet)
router.register(r'timeline-items', TimelineItemViewSet)
router.register(r'value-items', ValueItemViewSet)
router.register(r'facility-items', FacilityItemViewSet)
router.register(r'contact-messages', ContactMessageViewSet)
router.register(r'free-entries', FreeEntryViewSet)
router.register(r'pages', PageViewSet)
router.register(r'session-booking-config', SessionBookingConfigViewSet)
router.register(r'party-booking-config', PartyBookingConfigViewSet)
router.register(r'pricing-carousel-images', PricingCarouselImageViewSet)
router.register(r'booking-information', BookingInformationViewSet)
router.register(r'timing-cards', TimingCardViewSet)
router.register(r'customer-account-config', CustomerAccountConfigViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', UploadView.as_view(), name='cms-upload'),
    path('reorder/', ReorderView.as_view(), name='cms-reorder'),
    path('attraction-video/', attraction_video_view, name='attraction-video'),
    path('google-reviews/', google_reviews_view, name='google-reviews'),
    path('google-reviews/sync/', google_reviews_sync_view, name='google-reviews-sync'),
]
