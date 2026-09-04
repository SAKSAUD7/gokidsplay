from django.contrib import admin
from .models import User, GlobalSettings

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'role', 'is_active', 'is_staff']
    list_filter = ['is_active', 'is_staff', 'role']
    search_fields = ['email', 'name']
    ordering = ['-date_joined']

@admin.register(GlobalSettings)
class GlobalSettingsAdmin(admin.ModelAdmin):
    list_display = ['park_name', 'contact_phone', 'contact_email', 'updated_at']
    
    def has_add_permission(self, request):
        # Only allow one settings instance
        return not GlobalSettings.objects.exists()
