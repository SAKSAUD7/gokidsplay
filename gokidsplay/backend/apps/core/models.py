from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('MANAGER', 'Manager'),
        ('CONTENT_MANAGER', 'Content Manager'),
        ('STAFF', 'Staff'),
        ('EMPLOYEE', 'Employee'),
    ]
    
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='STAFF')
    
    # Use email as the unique identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    def save(self, *args, **kwargs):
        # Automatically set is_staff for all roles, and is_superuser for ADMIN
        self.is_staff = True
        if self.role == 'ADMIN':
            self.is_superuser = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

class GlobalSettings(models.Model):
    park_name = models.CharField(max_length=255, default="Ninja Inflatable Park")
    contact_phone = models.CharField(max_length=50, default="+91 98454 71611")
    contact_email = models.EmailField(default="info@ninjapark.com")
    address = models.TextField(null=True, blank=True)
    map_url = models.URLField(null=True, blank=True)
    opening_hours = models.JSONField(default=dict, blank=True)
    marquee_text = models.JSONField(default=list, blank=True)
    about_text = models.TextField(null=True, blank=True)
    hero_title = models.CharField(max_length=255, null=True, blank=True)
    hero_subtitle = models.CharField(max_length=255, null=True, blank=True)
    gst_number = models.CharField(max_length=50, null=True, blank=True)
    session_duration = models.IntegerField(default=60) # minutes
    adult_price = models.DecimalField(max_digits=10, decimal_places=2, default=899.00)
    child_price = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    
    # Feature Toggles
    online_booking_enabled = models.BooleanField(default=True)
    party_bookings_enabled = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    waiver_required = models.BooleanField(default=True)
    
    # Party Settings
    party_availability = models.CharField(max_length=100, default="Thursday - Sunday", help_text="Party booking availability days")
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Global Settings"
        verbose_name_plural = "Global Settings"

    def __str__(self):
        return "Global Settings"

class Logo(models.Model):
    name = models.CharField(max_length=255, help_text="Logo name/description")
    image = models.ImageField(upload_to='logos/', help_text="Logo image file")
    is_active = models.BooleanField(default=False, help_text="Set as active logo")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Logo"
        verbose_name_plural = "Logos"
    
    def save(self, *args, **kwargs):
        # Enforce single active logo
        self.is_active = True
        super().save(*args, **kwargs)
        
        # Delete all other logos to keep DB clean and enforce single source of truth
        Logo.objects.exclude(pk=self.pk).delete()
    
    def __str__(self):
        return f"{self.name} ({'Active' if self.is_active else 'Inactive'})"

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('BOOKING', 'New Booking'),
        ('PARTY_BOOKING', 'New Party Booking'),
        ('CONTACT_MESSAGE', 'Contact Message'),
        ('WAIVER_PENDING', 'Waiver Pending'),
        ('LOW_INVENTORY', 'Low Inventory'),
        ('PAYMENT_RECEIVED', 'Payment Received'),
        ('SYSTEM', 'System Alert'),
    ]
    
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    link = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Optional: Link to specific objects
    booking_id = models.IntegerField(null=True, blank=True)
    party_booking_id = models.IntegerField(null=True, blank=True)
    contact_message_id = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
    
    def __str__(self):
        return f"{self.type}: {self.title}"

