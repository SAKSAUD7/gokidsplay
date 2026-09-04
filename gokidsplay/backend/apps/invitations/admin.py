from django.contrib import admin
from .models import InvitationTemplate, BookingInvitation

@admin.register(InvitationTemplate)
class InvitationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at', 'updated_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'default_title')

@admin.register(BookingInvitation)
class BookingInvitationAdmin(admin.ModelAdmin):
    list_display = ('booking', 'template', 'child_name', 'party_date', 'created_at')
    list_filter = ('party_date', 'created_at')
    search_fields = ('booking__id', 'child_name', 'venue')
