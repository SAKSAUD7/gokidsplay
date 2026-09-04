from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
import subprocess
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

# Create custom token view that uses email
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


def health_check(request):
    """Root health check endpoint so the backend root doesn't return 404."""
    return JsonResponse({
        "status": "online",
        "service": "SpinPin Backend API",
        "version": "1.0",
        "api_docs": "/api/docs/",
        "admin": "/admin/",
    })


def seed_database(request):
    try:
        command = "python populate_spinpin_content.py && python full_seed.py && python cms_seed_spinpin.py"
        subprocess.Popen(command, shell=True, cwd=settings.BASE_DIR)
        return JsonResponse({"status": "All 3 Seed scripts started in background!"})
    except Exception as e:
        return JsonResponse({"status": "Error", "message": str(e)})


def reset_admin_password(request):
    """Temporary endpoint: resets admin password and creates logo. Remove after use."""
    results = {}
    try:
        # 1. Reset / create admin user
        from django.contrib.auth import get_user_model
        User = get_user_model()
        NEW_PASSWORD = "SpinPin2026!"
        ADMIN_EMAIL = "admin@spinpin.co.uk"
        try:
            user = User.objects.get(email=ADMIN_EMAIL)
            user.set_password(NEW_PASSWORD)
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.role = 'ADMIN'
            user.save()
            results['admin'] = f"Password for {ADMIN_EMAIL} reset to: {NEW_PASSWORD}"
        except User.DoesNotExist:
            # Custom User model needs username + name as REQUIRED_FIELDS
            user = User(
                email=ADMIN_EMAIL,
                username='admin',
                name='SpinPin Admin',
                role='ADMIN',
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            user.set_password(NEW_PASSWORD)
            user.save()
            results['admin'] = f"Admin created. Email: {ADMIN_EMAIL}, Password: {NEW_PASSWORD}"

        # 2. Create logo from frontend's public folder if none exists
        try:
            from apps.core.models import Logo
            if not Logo.objects.filter(is_active=True).exists():
                import urllib.request
                from django.core.files import File
                logo_url = "https://spinpin-frontend-d7ftbvf8h8cxe9g5.centralus-01.azurewebsites.net/logo_transparent.png"
                tmp_path = "/tmp/spinpin_logo.png"
                try:
                    urllib.request.urlretrieve(logo_url, tmp_path)
                    logo = Logo(name="SpinPin Logo", is_active=True)
                    with open(tmp_path, 'rb') as f:
                        logo.image.save("logo_transparent.png", File(f), save=True)
                    results['logo'] = "Logo created from frontend public folder"
                except Exception as logo_err:
                    results['logo'] = f"Auto-download failed: {str(logo_err)} — upload manually via Django Admin at /admin/"
            else:
                results['logo'] = "Active logo already exists — no changes made"
        except Exception as e:
            results['logo'] = f"Logo error: {str(e)}"

        return JsonResponse({"status": "success", "results": results})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)})


def fix_logo(request):
    """Endpoint to set the correct circular SpinPin logo as active."""
    try:
        from apps.core.models import Logo
        import os

        # Deactivate all existing logos
        Logo.objects.all().update(is_active=False)

        # We'll use a permanent logo that is checked into the git repository
        # This prevents the 404 error caused by Azure App Service wiping uploaded files on deploy
        logo_image_path = "logos/spinpin-logo.png"
        
        # Ensure the logo file actually exists in the persistent MEDIA_ROOT
        import shutil
        from django.conf import settings
        from pathlib import Path
        
        target_dir = Path(settings.MEDIA_ROOT) / 'logos'
        target_dir.mkdir(parents=True, exist_ok=True)
        target_path = target_dir / 'spinpin-logo.png'
        
        # Source path is where git put it (relative to BASE_DIR)
        source_path = settings.BASE_DIR / 'media' / 'logos' / 'spinpin-logo.png'
        
        if source_path.exists() and not target_path.exists():
            shutil.copy2(source_path, target_path)

        # We can just create a new logo that references this path
        # django-storages will correctly resolve it to Azure Blob storage or local serve
        logo = Logo(name="SpinPin Logo", is_active=True)
        logo.image.name = logo_image_path
        logo.save()

        return JsonResponse({
            "status": "success",
            "message": "SpinPin logo successfully set as active.",
            "logo_id": logo.id,
            "image": str(logo.image)
        })
    except Exception as e:
        import traceback
        return JsonResponse({"status": "error", "message": str(e), "traceback": traceback.format_exc()})


urlpatterns = [
    path('', health_check),                         # Root health check
    path('api/v1/seed-db/', seed_database),
    path('api/v1/reset-admin/', reset_admin_password),
    path('api/v1/fix-logo/', fix_logo),
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

    # Documentation
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
