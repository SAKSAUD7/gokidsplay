from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from apps.bookings.permissions import IsStaffUser
from apps.core.permissions import IsContentManagerOrAdmin
from .models import (
    Banner, Activity, Faq, SocialLink, GalleryItem,
    StatCard, InstagramReel, MenuSection, GuidelineCategory, LegalDocument,
    PageSection, PricingPlan, ContactInfo, PartyPackage, TimelineItem, ValueItem, FacilityItem,
    Page, ContactMessage, FreeEntry, SessionBookingConfig, PartyBookingConfig, PricingCarouselImage,
    BookingInformation, TimingCard, CustomerAccountConfig
)
from .serializers import (
    BannerSerializer, ActivitySerializer, FaqSerializer, 
    SocialLinkSerializer, GalleryItemSerializer,
    StatCardSerializer, InstagramReelSerializer, MenuSectionSerializer,
    GuidelineCategorySerializer, LegalDocumentSerializer,
    PageSectionSerializer, PricingPlanSerializer, ContactInfoSerializer, PartyPackageSerializer,
    TimelineItemSerializer, ValueItemSerializer, FacilityItemSerializer,
    PageSerializer, ContactMessageSerializer, FreeEntrySerializer, SessionBookingConfigSerializer, PartyBookingConfigSerializer,
    PricingCarouselImageSerializer, BookingInformationSerializer, TimingCardSerializer, CustomerAccountConfigSerializer
)

class BaseCmsViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        # Allow public read access, require CONTENT_MANAGER or ADMIN for write operations
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsContentManagerOrAdmin()]  # Allow CONTENT_MANAGER and ADMIN to manage CMS content

class BannerViewSet(BaseCmsViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class ActivityViewSet(BaseCmsViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class FaqViewSet(BaseCmsViewSet):
    queryset = Faq.objects.all()
    serializer_class = FaqSerializer
    filterset_fields = ['active', 'category']
    ordering_fields = ['order']
    ordering = ['order']

class TestimonialViewSet(BaseCmsViewSet):
    from .models import Testimonial as _Testimonial
    queryset = _Testimonial.objects.all()
    from .serializers import TestimonialSerializer as _TestimonialSerializer
    serializer_class = _TestimonialSerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']

class SocialLinkViewSet(BaseCmsViewSet):
    queryset = SocialLink.objects.all()
    serializer_class = SocialLinkSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class GalleryItemViewSet(BaseCmsViewSet):
    queryset = GalleryItem.objects.all()
    serializer_class = GalleryItemSerializer
    filterset_fields = ['active', 'category']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class StatCardViewSet(BaseCmsViewSet):
    queryset = StatCard.objects.all()
    serializer_class = StatCardSerializer
    filterset_fields = ['active', 'page']
    ordering_fields = ['order']
    ordering = ['page', 'order']

class InstagramReelViewSet(BaseCmsViewSet):
    queryset = InstagramReel.objects.all()
    serializer_class = InstagramReelSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class MenuSectionViewSet(BaseCmsViewSet):
    queryset = MenuSection.objects.all()
    serializer_class = MenuSectionSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class GuidelineCategoryViewSet(BaseCmsViewSet):
    queryset = GuidelineCategory.objects.all()
    serializer_class = GuidelineCategorySerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class LegalDocumentViewSet(BaseCmsViewSet):
    queryset = LegalDocument.objects.all()
    serializer_class = LegalDocumentSerializer
    filterset_fields = ['active', 'document_type']
    # Removed lookup_field to use default 'id' for proper edit page routing

class PageSectionViewSet(BaseCmsViewSet):
    queryset = PageSection.objects.all()
    serializer_class = PageSectionSerializer
    # filterset_fields = ['active', 'page', 'section_key']  <-- Replacing this with explicit get_queryset
    ordering_fields = ['order']
    ordering = ['page', 'order']

    def get_queryset(self):
        """
        Explicitly filter queryset to ensure strict isolation.
        Relies on frontend passing ?page=...
        """
        queryset = PageSection.objects.all()
        page = self.request.query_params.get('page')
        section_key = self.request.query_params.get('section_key')
        
        if page:
            queryset = queryset.filter(page=page)
        
        if section_key:
            queryset = queryset.filter(section_key=section_key)
            
        return queryset

class PricingPlanViewSet(BaseCmsViewSet):
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer
    filterset_fields = ['active', 'type', 'popular']
    ordering_fields = ['order']
    ordering = ['type', 'order']

class ContactInfoViewSet(BaseCmsViewSet):
    queryset = ContactInfo.objects.all()
    serializer_class = ContactInfoSerializer
    filterset_fields = ['active', 'category']
    ordering_fields = ['order']
    ordering = ['category', 'order']

class PartyPackageViewSet(BaseCmsViewSet):
    queryset = PartyPackage.objects.all()
    serializer_class = PartyPackageSerializer
    filterset_fields = ['active', 'popular']
    ordering_fields = ['order']
    ordering = ['order']

class TimelineItemViewSet(BaseCmsViewSet):
    queryset = TimelineItem.objects.all()
    serializer_class = TimelineItemSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class ValueItemViewSet(BaseCmsViewSet):
    queryset = ValueItem.objects.all()
    serializer_class = ValueItemSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class FacilityItemViewSet(BaseCmsViewSet):
    queryset = FacilityItem.objects.all()
    serializer_class = FacilityItemSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [IsStaffUser]  # Allow managers to view contact messages
    ordering = ['-created_at']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        # Visitors may submit the contact form; reading messages (customer PII) is staff-only
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [IsStaffUser()]  # Allow managers to manage messages
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a contact message as read"""
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({'status': 'marked as read', 'is_read': True})
    
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark a contact message as unread"""
        message = self.get_object()
        message.is_read = False
        message.save()
        return Response({'status': 'marked as unread', 'is_read': False})

    def perform_create(self, serializer):
        """
        Save the contact message and trigger email notification.
        """
        instance = serializer.save()
        
        # Trigger email notification
        try:
            from apps.emails.services import email_service
            email_service.send_admin_contact_notification(instance)
            email_service.send_contact_customer_confirmation(instance)
        except Exception as e:
            # IMPORTANT: Log error but DO NOT break the contact form flow
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to trigger contact message email: {str(e)}")

class PageViewSet(BaseCmsViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    filterset_fields = ['active', 'slug']
    lookup_field = 'slug'

class FreeEntryViewSet(viewsets.ModelViewSet):
    queryset = FreeEntry.objects.all()
    serializer_class = FreeEntrySerializer
    permission_classes = [IsStaffUser]  # Only staff can view/manage free entries
    filterset_fields = ['status']
    ordering = ['-created_at']
    ordering_fields = ['created_at', 'status']

class SessionBookingConfigViewSet(BaseCmsViewSet):
    """Singleton viewset for session booking configuration"""
    queryset = SessionBookingConfig.objects.all()
    serializer_class = SessionBookingConfigSerializer
    
    def list(self, request, *args, **kwargs):
        """Return the singleton config"""
        config = SessionBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Always return the singleton config regardless of ID"""
        config = SessionBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

class PartyBookingConfigViewSet(BaseCmsViewSet):
    """Singleton viewset for party booking configuration"""
    queryset = PartyBookingConfig.objects.all()
    serializer_class = PartyBookingConfigSerializer
    
    def list(self, request, *args, **kwargs):
        """Return the singleton config"""
        config = PartyBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Always return the singleton config regardless of ID"""
        config = PartyBookingConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

class CustomerAccountConfigViewSet(BaseCmsViewSet):
    """Singleton viewset for customer account configuration"""
    queryset = CustomerAccountConfig.objects.all()
    serializer_class = CustomerAccountConfigSerializer
    
    def list(self, request, *args, **kwargs):
        """Return the singleton config"""
        config = CustomerAccountConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Always return the singleton config regardless of ID"""
        config = CustomerAccountConfig.get_config()
        serializer = self.get_serializer(config)
        return Response(serializer.data)

class UploadView(APIView):
    """
    Handle file uploads for CMS images.
    Validates file type, size, and saves to media storage.
    """
    permission_classes = [IsContentManagerOrAdmin]  # Require CONTENT_MANAGER or ADMIN
    parser_classes = (MultiPartParser, FormParser)
    
    # Configuration
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB (videos)
    MAX_IMAGE_SIZE = 20 * 1024 * 1024  # 20MB
    IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm'}
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/webm'
    }

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        
        if not file_obj:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size
        if file_obj.size > self.MAX_FILE_SIZE:
            size_mb = file_obj.size / 1024 / 1024
            max_mb = self.MAX_FILE_SIZE / 1024 / 1024
            return Response(
                {'error': f'File too large. Maximum size is {max_mb:.0f}MB. Uploaded file is {size_mb:.2f}MB'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        
        # Validate file extension
        file_ext = file_obj.name.split('.')[-1].lower() if '.' in file_obj.name else ''
        if file_ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {'error': f'Invalid file type. Allowed: {", ".join(self.ALLOWED_EXTENSIONS).upper()}. Got: {file_ext}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if file_ext in self.IMAGE_EXTENSIONS:
            if file_obj.size > self.MAX_IMAGE_SIZE:
                return Response({'error': 'Images can be at most 20MB.'}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
            # The file must really be an image (not something renamed to .jpg)
            try:
                from PIL import Image
                with Image.open(file_obj) as img:
                    img.verify()
                file_obj.seek(0)
            except Exception:
                return Response({'error': 'This file is not a valid image.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate MIME type
        content_type = file_obj.content_type
        if content_type not in self.ALLOWED_MIME_TYPES:
            return Response(
                {'error': f'Invalid content type. Expected image, got: {content_type}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Save file using Django's default storage
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile
            import uuid
            from datetime import datetime
            import logging
            
            logger = logging.getLogger(__name__)
            logger.info(f"Starting upload for file: {file_obj.name}, size: {file_obj.size} bytes")
            
            # Generate unique filename to prevent overwrites
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            from django.utils.text import get_valid_filename
            original = get_valid_filename(file_obj.name.replace('\\', '/').rsplit('/', 1)[-1])[-80:] or f"file.{file_ext}"
            safe_filename = f"{timestamp}_{unique_id}_{original}"

            # Save to uploads directory (streamed, so large videos don't fill the memory)
            try:
                path = default_storage.save(f"uploads/{safe_filename}", file_obj)
                logger.info(f"File saved successfully to: {path}")
            except Exception as storage_error:
                logger.error(f"Azure storage error: {str(storage_error)}")
                import traceback
                logger.error(traceback.format_exc())
                return Response(
                    {'error': f'Storage error: {str(storage_error)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Always return a relative media path. 
            # The frontend will construct the backend API URL and the backend
            # will proxy the media request to Azure Blob Storage, bypassing CORS
            # and private container issues.
            full_url = f"/media/{path}"
            
            return Response({
                'url': full_url,
                'filename': file_obj.name,
                'size': file_obj.size,
                'path': path
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # DEBUG: Return 500 with actual error for debugging
            import traceback
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Upload failed with exception: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {'error': f'Upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ReorderView(APIView):
    permission_classes = [IsContentManagerOrAdmin]

    def post(self, request, *args, **kwargs):
        """
        Expects payload: { "model": "banner", "items": [{ "id": 1, "order": 0 }, { "id": 2, "order": 1 }] }
        """
        model_name = request.data.get('model')
        items = request.data.get('items', [])

        if not model_name or not items:
            return Response({'error': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        # Map model name to actual model class
        model_map = {
            'banner': Banner,
            'activity': Activity,
            'faq': Faq,
            'social-link': SocialLink,
            'gallery-item': GalleryItem,
            'stat-card': StatCard,
            'instagram-reel': InstagramReel,
            'menu-section': MenuSection,
            'guideline-category': GuidelineCategory,
            'page-section': PageSection,
            'pricing-plan': PricingPlan,
            'contact-info': ContactInfo,
            'party-package': PartyPackage,
            'timeline-item': TimelineItem,
            'value-item': ValueItem,
            'facility-item': FacilityItem,
        }

        ModelClass = model_map.get(model_name)
        if not ModelClass:
            return Response({'error': f'Invalid model: {model_name}'}, status=status.HTTP_400_BAD_REQUEST)

        # Update orders
        for item in items:
            item_id = item.get('id')
            order = item.get('order')
            if item_id is not None and order is not None:
                ModelClass.objects.filter(id=item_id).update(order=order)

        return Response({'success': True})


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.conf import settings
from .models import AttractionVideoSection

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def attraction_video_view(request):
    """
    Simple video section management - just YouTube URL and title.
    GET: Returns the video data (admin sees all, public sees active only)
    POST: Saves the video data (admin only)
    """
    if request.method == 'GET':
        # Check if user is admin
        is_admin = request.user.is_authenticated and (
            getattr(request.user, 'role', '') in ['admin', 'manager', 'content_manager'] or 
            request.user.is_staff or 
            request.user.is_superuser
        )

        # Get the video section
        # Get the video section - Just get the first one for everyone for now to debug
        video_section = AttractionVideoSection.objects.first()
        
        if not video_section:
            return Response(None, status=200)
        
        # Return simple data
        # Handle video field which could be URL or File
        video_val = ''
        if video_section.video:
             # Check if it's a direct URL string stored in the name
             if str(video_section.video).startswith('http'):
                 video_val = str(video_section.video)
             else:
                 # It's a file, get the URL
                 try:
                     video_val = video_section.video.url
                 except:
                     video_val = str(video_section.video)
        
        # For public, if inactive, we SHOULD return None normally, but for debugging let's return it
        # but mark as inactive so frontend knows using is_active flag
        
        return Response({
            'title': video_section.title or '',
            'video': video_val,
            'is_active': video_section.is_active
        })

    if request.method == 'POST':
        # Check permissions manually since we used AllowAny for GET
        if not (request.user.is_authenticated and (
            getattr(request.user, 'role', '') in ['admin', 'manager', 'content_manager'] or 
            request.user.is_staff or 
            request.user.is_superuser
        )):
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            data = request.data
            
            # Get or create video section
            video_section = AttractionVideoSection.objects.first()
            if not video_section:
                video_section = AttractionVideoSection()
            
            # Update simple fields
            video_section.title = data.get('title', '')
            
            # Handle video URL - now stored as CharField
            new_video_url = data.get('video_url', '')
            video_section.video = new_video_url if new_video_url else None

            video_section.is_active = data.get('is_active', True)
            
            # Save
            video_section.save()
            
            # Return updated data
            return Response({
                'title': video_section.title or '',
                'video': str(video_section.video) if video_section.video else '',
                'is_active': video_section.is_active,
                'debug_payload': data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to save: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class PricingCarouselImageViewSet(BaseCmsViewSet):
    queryset = PricingCarouselImage.objects.all()
    serializer_class = PricingCarouselImageSerializer
    filterset_fields = ['active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order']

class BookingInformationViewSet(BaseCmsViewSet):
    queryset = BookingInformation.objects.all()
    serializer_class = BookingInformationSerializer
    filterset_fields = ['active', 'booking_type']

class TimingCardViewSet(BaseCmsViewSet):
    queryset = TimingCard.objects.all()
    serializer_class = TimingCardSerializer
    filterset_fields = ['active']
    ordering_fields = ['order']
    ordering = ['order']


# ── Google reviews (Testimonies page) ────────────────────────────────────────

def _google_reviews_summary(profile, staff=False):
    from .google_reviews import api_key
    data = {
        'rating': float(profile.rating) if profile.rating is not None else None,
        'review_count': profile.review_count,
        'reviews_url': profile.reviews_url,
        'write_review_url': profile.write_review_url,
        'last_synced': profile.last_synced.isoformat() if profile.last_synced else None,
        'photos': profile.photos if profile.show_photos else [],
    }
    if staff:
        data.update({
            'connected': bool(api_key()),
            'place_id': profile.place_id,
            'search_query': profile.search_query,
            'maps_url': profile.maps_url,
            'min_rating_to_show': profile.min_rating_to_show,
            'auto_sync': profile.auto_sync,
            'show_photos': profile.show_photos,
            'photo_count': len(profile.photos or []),
            'last_error': profile.last_error,
        })
    return data


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def google_reviews_view(request):
    """
    GET: the Google rating, number of reviews and review links (public; refreshes
    from Google when the data is over 12 hours old).
    PATCH (content managers): place_id, search_query, maps_url, min_rating_to_show, auto_sync.
    """
    from .models import GoogleReviewsProfile
    from .google_reviews import sync_if_stale
    is_manager = IsContentManagerOrAdmin().has_permission(request, None)

    if request.method == 'PATCH':
        if not is_manager:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        profile = GoogleReviewsProfile.get()
        for field in ('place_id', 'search_query', 'maps_url'):
            if field in request.data:
                setattr(profile, field, str(request.data[field] or '').strip())
        if 'min_rating_to_show' in request.data:
            try:
                profile.min_rating_to_show = min(5, max(1, int(request.data['min_rating_to_show'])))
            except (TypeError, ValueError):
                return Response({'error': 'Minimum rating must be 1–5'}, status=status.HTTP_400_BAD_REQUEST)
        if 'auto_sync' in request.data:
            profile.auto_sync = bool(request.data['auto_sync'])
        if 'show_photos' in request.data:
            profile.show_photos = bool(request.data['show_photos'])
        if profile.maps_url and not profile.maps_url.startswith('https://'):
            return Response({'error': 'The Google Maps link must start with https://'}, status=status.HTTP_400_BAD_REQUEST)
        profile.save()
        return Response(_google_reviews_summary(profile, staff=True))

    sync_if_stale()
    return Response(_google_reviews_summary(GoogleReviewsProfile.get(), staff=is_manager))


@api_view(['POST'])
@permission_classes([IsContentManagerOrAdmin])
def google_reviews_sync_view(request):
    """Fetch the latest rating and reviews from Google now."""
    from .models import GoogleReviewsProfile
    from .google_reviews import GoogleReviewsError, sync_google_reviews
    try:
        result = sync_google_reviews()
    except GoogleReviewsError as exc:
        return Response({'error': str(exc), **_google_reviews_summary(GoogleReviewsProfile.get(), staff=True)},
                        status=status.HTTP_400_BAD_REQUEST)
    return Response({'created': result['created'], 'updated': result['updated'],
                     **_google_reviews_summary(GoogleReviewsProfile.get(), staff=True)})
