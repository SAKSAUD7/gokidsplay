from django.contrib import admin
from .models import (
    Banner, Activity, Faq, SocialLink, GalleryItem,
    StatCard, InstagramReel, MenuSection, GroupPackage, GuidelineCategory, LegalDocument,
    PageSection, PricingPlan, ContactInfo, PartyPackage, TimelineItem, ValueItem, FacilityItem,
    Page, AttractionVideoSection
)

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'active', 'order', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['title']
    ordering = ['order', '-created_at']

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'active', 'order', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['name', 'description', 'short_description']
    ordering = ['order', '-created_at']
    prepopulated_fields = {'slug': ('name',)}
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'active', 'order')
        }),
        ('Content', {
            'fields': ('short_description', 'description')
        }),
        ('Media', {
            'fields': ('image_url', 'gallery')
        }),
    )

@admin.register(Faq)
class FaqAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'active', 'order']
    list_filter = ['active', 'category']
    search_fields = ['question', 'answer']
    ordering = ['order']



@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ['platform', 'url', 'active', 'order']
    list_filter = ['active', 'platform']
    ordering = ['order']

@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['slug', 'title', 'active', 'updated_at']
    search_fields = ['slug', 'title']
    list_filter = ['active']

@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'active', 'order']
    list_filter = ['active', 'category']
    search_fields = ['title']
    ordering = ['order', '-created_at']

@admin.register(StatCard)
class StatCardAdmin(admin.ModelAdmin):
    list_display = ['label', 'value', 'unit', 'page', 'active', 'order']
    list_filter = ['page', 'active']
    search_fields = ['label', 'value', 'unit']
    ordering = ['page', 'order']

@admin.register(InstagramReel)
class InstagramReelAdmin(admin.ModelAdmin):
    list_display = ['title', 'active', 'order']
    list_filter = ['active']
    search_fields = ['title']
    ordering = ['order']

@admin.register(MenuSection)
class MenuSectionAdmin(admin.ModelAdmin):
    list_display = ['category', 'active', 'order']
    list_filter = ['active']
    search_fields = ['category']
    ordering = ['order']

@admin.register(GroupPackage)
class GroupPackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'min_size', 'popular', 'active', 'order']
    list_filter = ['popular', 'active']
    search_fields = ['name', 'subtitle']
    ordering = ['order']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'subtitle', 'min_size', 'icon', 'active', 'order')
        }),
        ('Pricing', {
            'fields': ('price', 'price_note')
        }),
        ('Details', {
            'fields': ('features', 'color', 'popular')
        }),
    )

@admin.register(GuidelineCategory)
class GuidelineCategoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon', 'active', 'order']
    list_filter = ['active']
    search_fields = ['title']
    ordering = ['order']

@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ['document_type', 'title', 'section_count', 'active', 'updated_at']
    list_filter = ['document_type', 'active']
    search_fields = ['title', 'intro']
    ordering = ['document_type']
    readonly_fields = ['sections_preview']
    fieldsets = (
        ('Document Info', {
            'fields': ('document_type', 'title', 'active')
        }),
        ('Content', {
            'fields': ('intro', 'sections', 'sections_preview'),
            'description': 'Intro is optional introduction text. Sections is a JSON array of {title, content} objects.'
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        # Make document_type readonly after creation to prevent changing type
        if obj:
            return ['document_type', 'sections_preview']
        return ['sections_preview']
    
    def section_count(self, obj):
        """Display number of sections"""
        return len(obj.sections) if obj.sections else 0
    section_count.short_description = 'Sections'
    
    def sections_preview(self, obj):
        """Display formatted preview of all sections"""
        from django.utils.html import format_html
        if not obj.sections:
            return "No sections"
        
        html = '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; max-width: 900px;">'
        html += f'<h2 style="color: #2c3e50; margin-bottom: 20px;">{obj.title}</h2>'
        
        if obj.intro:
            html += f'<div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin-bottom: 25px;">'
            html += f'<strong style="color: #1976d2;">Introduction:</strong><br>'
            html += f'<p style="margin: 10px 0 0 0; color: #424242;">{obj.intro}</p>'
            html += '</div>'
        
        for i, section in enumerate(obj.sections, 1):
            html += f'<div style="background: white; padding: 15px; margin-bottom: 15px; border-left: 4px solid #4caf50; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">'
            html += f'<h3 style="color: #2e7d32; margin: 0 0 10px 0;">{i}. {section.get("title", "Untitled")}</h3>'
            html += f'<p style="color: #424242; line-height: 1.6; margin: 0;">{section.get("content", "No content")}</p>'
            html += '</div>'
        
        html += f'<div style="margin-top: 20px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107;">'
        html += f'<strong>Total Sections: {len(obj.sections)}</strong>'
        html += '</div>'
        html += '</div>'
        
        return format_html(html)
    sections_preview.short_description = 'Content Preview (Read-Only)'

@admin.register(PageSection)
class PageSectionAdmin(admin.ModelAdmin):
    list_display = ['page', 'section_key', 'title', 'active', 'order']
    list_filter = ['page', 'active']
    search_fields = ['title', 'content', 'page', 'section_key']
    ordering = ['page', 'order']
    fieldsets = (
        ('Identification', {
            'fields': ('page', 'section_key', 'active', 'order')
        }),
        ('Content', {
            'fields': ('title', 'subtitle', 'content')
        }),
        ('Media', {
            'fields': ('image_url', 'video_url')
        }),
        ('Call to Action', {
            'fields': ('cta_text', 'cta_link'),
            'classes': ('collapse',)
        }),
    )

@admin.register(PricingPlan)
class PricingPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'price', 'duration', 'popular', 'active', 'order']
    list_filter = ['type', 'popular', 'active']
    search_fields = ['name', 'description']
    ordering = ['type', 'order']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'type', 'age_group', 'active', 'order')
        }),
        ('Pricing', {
            'fields': ('price', 'duration', 'period_text')
        }),
        ('Details', {
            'fields': ('description', 'features', 'popular', 'variant')
        }),
    )

@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ['label', 'category', 'value', 'active', 'order']
    list_filter = ['category', 'active']
    search_fields = ['label', 'value', 'key']
    ordering = ['category', 'order']

@admin.register(PartyPackage)
class PartyPackageAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'min_participants', 'duration', 'popular', 'active', 'order']
    list_filter = ['popular', 'active']
    search_fields = ['name', 'description']
    ordering = ['order']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'image_url', 'active', 'order')
        }),
        ('Pricing & Capacity', {
            'fields': ('price', 'min_participants', 'max_participants', 'duration')
        }),
        ('Details', {
            'fields': ('includes', 'addons', 'popular', 'variant')
        }),
    )

@admin.register(TimelineItem)
class TimelineItemAdmin(admin.ModelAdmin):
    list_display = ['year', 'title', 'active', 'order']
    list_filter = ['active', 'year']
    search_fields = ['title', 'description']
    ordering = ['order']

@admin.register(ValueItem)
class ValueItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon', 'color', 'active', 'order']
    list_filter = ['active', 'color']
    search_fields = ['title', 'description']
    ordering = ['order']

@admin.register(FacilityItem)
class FacilityItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'icon', 'active', 'order']
    list_filter = ['active']
    search_fields = ['title', 'description']
    ordering = ['order']

@admin.register(AttractionVideoSection)
class AttractionVideoSectionAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'created_at', 'video']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Video Content', {
            'fields': ('title', 'video', 'thumbnail', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
