from django.contrib import admin
from .models import Product, Voucher

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'stock', 'category', 'active', 'created_at']
    list_filter = ['active', 'category', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']

@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'is_active', 'used_count', 'usage_limit', 'expiry_date']
    list_filter = ['is_active', 'discount_type', 'expiry_date']
    search_fields = ['code', 'description']
    ordering = ['-created_at']
