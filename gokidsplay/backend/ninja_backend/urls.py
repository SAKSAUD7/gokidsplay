from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

# Create custom token view that uses email
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


def health_check(request):
    """Health check for the root URL and load balancer probes (also checks the database)."""
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        database = "ok"
    except Exception:
        database = "unavailable"
    return JsonResponse(
        {"status": "online" if database == "ok" else "degraded", "service": "Go Kids Play Backend API",
         "database": database},
        status=200 if database == "ok" else 503,
    )


urlpatterns = [
    path('', health_check),                         # Root health check
    path('api/health/', health_check),              # Load balancer health probe
    path('admin/', admin.site.urls),

    # API V1
    path('api/v1/core/', include('apps.core.urls')),
    path('api/v1/shop/', include('apps.shop.urls')),
    path('api/v1/cms/', include('apps.cms.urls')),
    path('api/v1/bookings/', include('apps.bookings.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/invitations/', include('apps.invitations.urls')),
    path('api/v1/emails/', include('apps.emails.urls')),
    path('api/v1/marketing/', include('apps.marketing.urls')),

    # Auth
    path('api/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# API documentation lists every endpoint, so it is only served in local development
if settings.DEBUG:
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
        path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    ]

import os
from ninja_backend.serve_media import serve_media_proxy

if os.environ.get('AZURE_STORAGE_CONNECTION_STRING'):
    # In production with Azure, proxy media through backend to avoid CORS/Private Container issues
    from django.urls import re_path
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve_media_proxy, name='media_proxy'),
    ]
else:
    # In local development or production without Azure Storage
    # Serve media files using Django's static serve view
    from django.urls import re_path
    from django.views.static import serve
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
