from django.db import models

class Page(models.Model):
    slug = models.CharField(max_length=100, unique=True, help_text="Unique page identifier (e.g., 'home', 'about')")
    title = models.CharField(max_length=255, help_text="SEO Title")
    description = models.TextField(null=True, blank=True, help_text="SEO Description")
    keywords = models.TextField(null=True, blank=True, help_text="SEO Keywords")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.slug})"

class Banner(models.Model):
    title = models.CharField(max_length=255)
    image_url = models.URLField()
    link = models.URLField(null=True, blank=True)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Activity(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True, help_text="URL-friendly name")
    short_description = models.TextField(null=True, blank=True, help_text="Brief summary for list views")
    description = models.TextField(help_text="Full detailed description")
    image_url = models.URLField(help_text="Main cover image")
    gallery = models.JSONField(default=list, help_text="List of additional image URLs")
    
    # Enhanced content fields
    why_choose_us = models.TextField(null=True, blank=True, help_text="Why choose this activity section")
    what_to_expect = models.TextField(null=True, blank=True, help_text="What to expect section")
    location_info = models.TextField(null=True, blank=True, help_text="Location information")
    activity_faqs = models.JSONField(default=list, null=True, blank=True, help_text="Activity-specific FAQs as list of {question, answer}")
    
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Faq(models.Model):
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=100, null=True, blank=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question[:50]

class Testimonial(models.Model):
    TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('VIDEO', 'Video'),
    ]
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=100, null=True, blank=True)
    content = models.TextField()
    rating = models.IntegerField(default=5)
    image_url = models.URLField(null=True, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='TEXT')
    video_url = models.URLField(null=True, blank=True)
    thumbnail_url = models.URLField(null=True, blank=True)
    platform = models.CharField(max_length=50, blank=True, default='Google', help_text="Where the review was left (Google, Facebook, …)")
    review_date = models.CharField(max_length=50, blank=True, default='', help_text="Shown as written, e.g. 'August 2026'")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.name

class SocialLink(models.Model):
    platform = models.CharField(max_length=50)
    url = models.URLField()
    icon = models.CharField(max_length=50, null=True, blank=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.platform

class GalleryItem(models.Model):
    title = models.CharField(max_length=255, null=True, blank=True)
    image_url = models.CharField(max_length=700, help_text="Image URL (local path or external link)")
    category = models.CharField(max_length=100, null=True, blank=True)
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or "Gallery Item"

class StatCard(models.Model):
    """Statistics cards for homepage and about page"""
    label = models.CharField(max_length=100, help_text="e.g., 'Happy Jumpers'")
    value = models.CharField(max_length=50, help_text="e.g., '5,000+'")
    unit = models.CharField(max_length=100, help_text="e.g., 'Happy Jumpers'")
    icon = models.CharField(max_length=50, help_text="Icon name (e.g., 'Users')")
    color = models.CharField(max_length=20, default="primary", help_text="Color variant: primary, secondary, accent")
    page = models.CharField(max_length=50, help_text="Page identifier: 'home' or 'about'")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page', 'order']

    def __str__(self):
        return f"{self.value} {self.unit} ({self.page})"

class InstagramReel(models.Model):
    """Instagram reels to display on homepage"""
    title = models.CharField(max_length=255, help_text="Reel title/description")
    thumbnail_url = models.CharField(max_length=700, blank=True, null=True, help_text="Thumbnail image URL (local path or external link)")
    reel_url = models.CharField(max_length=700, help_text="Instagram reel URL")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0, help_text="Display order (lower numbers first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Instagram Reel"
        verbose_name_plural = "Instagram Reels"

    def __str__(self):
        return self.title

class MenuSection(models.Model):
    """Menu sections for party feast"""
    category = models.CharField(max_length=100, help_text="e.g., 'Pre-Plated', 'Buffet'")
    description = models.TextField(null=True, blank=True, help_text="Subtitle or description (e.g. 'For each participant')")
    items = models.JSONField(default=list, help_text="List of menu items")
    icon = models.CharField(max_length=50, null=True, blank=True, help_text="Icon name")
    color = models.CharField(max_length=20, default="secondary", help_text="Color variant")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.category

class GroupPackage(models.Model):
    """Group booking packages for schools, corporates, etc."""
    name = models.CharField(max_length=255)
    subtitle = models.TextField()
    min_size = models.CharField(max_length=100, help_text="e.g., '15+ Students'")
    icon = models.CharField(max_length=50, help_text="Icon name")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_note = models.CharField(max_length=50, help_text="e.g., 'per student'")
    features = models.JSONField(default=list, help_text="List of features")
    color = models.CharField(max_length=20, default="primary", help_text="Color variant")
    popular = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class GuidelineCategory(models.Model):
    """Safety guideline categories"""
    title = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, help_text="Icon name")
    items = models.JSONField(default=list, help_text="List of guideline items")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name_plural = "Guideline Categories"

    def __str__(self):
        return self.title

class LegalDocument(models.Model):
    """Legal documents: terms, privacy, waiver, and information pages"""
    DOCUMENT_TYPES = [
        ('TERMS', 'Terms & Conditions'),
        ('DETAILED_RULES', 'Detailed Rules'),
        ('WAIVER', 'Participant Waiver'),
        ('PRIVACY', 'Privacy Policy'),
        ('WAIVER_TERMS', 'Waiver Terms'),
        ('YOUR_RIGHTS', 'Your Rights'),
        ('SECURITY', 'Security'),
        ('COOKIES', 'Cookies'),
        ('DISCLAIMER', 'Disclaimer'),
    ]
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES, unique=True)
    title = models.CharField(max_length=255)
    intro = models.TextField(null=True, blank=True, help_text="Optional introduction text")
    sections = models.JSONField(default=list, help_text="List of sections with title and content")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Legal Documents"

    def __str__(self):
        return self.get_document_type_display()

class BookingInformation(models.Model):
    """Information pages for session and party booking"""
    BOOKING_TYPES = [
        ('SESSION', 'Session Booking'),
        ('PARTY', 'Party Booking'),
    ]
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPES, unique=True)
    title = models.CharField(max_length=255)
    subtitle = models.TextField(null=True, blank=True)
    content = models.TextField(help_text="Main content/description")
    rules_content = models.TextField(null=True, blank=True, help_text="Rules and guidelines content")
    sessions_info = models.JSONField(default=list, null=True, blank=True, help_text="List of special sessions with details")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Booking Information"

    def __str__(self):
        return self.get_booking_type_display()

class PageSection(models.Model):
    """Generic reusable section for any page"""
    page = models.CharField(max_length=100, help_text="Page identifier (e.g., 'about', 'contact')")
    section_key = models.CharField(max_length=100, help_text="Section identifier (e.g., 'hero', 'features')")
    title = models.CharField(max_length=255, null=True, blank=True)
    subtitle = models.TextField(null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    cta_text = models.CharField(max_length=100, null=True, blank=True, help_text="Call-to-action button text")
    cta_link = models.URLField(null=True, blank=True, help_text="Call-to-action button link")
    extra = models.JSONField(default=dict, blank=True, help_text="Additional named fields for this section (badges, extra buttons, list items)")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page', 'order']
        unique_together = ['page', 'section_key']

    def __str__(self):
        return f"{self.page} - {self.section_key}"

class PricingPlan(models.Model):
    """Pricing plans for sessions and parties"""
    TYPE_CHOICES = [
        ('SESSION', 'Session'),
        ('PARTY', 'Party'),
    ]
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    age_group = models.CharField(max_length=100, null=True, blank=True, help_text="e.g., 'Ages 1-7 Years'")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.IntegerField(help_text="Duration in minutes")
    period_text = models.CharField(max_length=50, default="/ 60 Mins", help_text="e.g., '/ 60 Mins', '/ Person'")
    description = models.TextField(null=True, blank=True)
    features = models.JSONField(default=list, help_text="List of features/inclusions")
    popular = models.BooleanField(default=False)
    variant = models.CharField(max_length=20, default="primary", help_text="Color variant: primary, secondary, accent")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['type', 'order']

    def __str__(self):
        return f"{self.name} ({self.type})"

class ContactInfo(models.Model):
    """Site-wide contact information"""
    CATEGORY_CHOICES = [
        ('PHONE', 'Phone'),
        ('EMAIL', 'Email'),
        ('ADDRESS', 'Address'),
        ('HOURS', 'Operating Hours'),
        ('SOCIAL', 'Social Media'),
        ('OTHER', 'Other'),
    ]
    key = models.CharField(max_length=100, unique=True, help_text="Unique identifier (e.g., 'main_phone')")
    label = models.CharField(max_length=255, help_text="Display label (e.g., 'Call Us')")
    value = models.TextField(help_text="Contact value (phone, email, address, etc.)")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    icon = models.CharField(max_length=50, null=True, blank=True, help_text="Icon name (e.g., 'Phone', 'Mail')")
    link = models.URLField(null=True, blank=True, help_text="Optional link (tel:, mailto:, maps link)")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'order']
        verbose_name_plural = "Contact Information"

    def __str__(self):
        return f"{self.label} ({self.category})"

class PartyPackage(models.Model):
    """Party packages for birthday and events"""
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    min_participants = models.IntegerField()
    max_participants = models.IntegerField(null=True, blank=True)
    duration = models.IntegerField(help_text="Duration in minutes")
    includes = models.JSONField(default=list, help_text="List of included items")
    addons = models.JSONField(default=list, help_text="List of available add-ons")
    image_url = models.URLField(null=True, blank=True)
    popular = models.BooleanField(default=False)
    variant = models.CharField(max_length=20, default="accent", help_text="Color variant")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class TimelineItem(models.Model):
    """Timeline items for About page journey"""
    year = models.CharField(max_length=10)
    title = models.CharField(max_length=255)
    description = models.TextField()
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.year} - {self.title}"

class ValueItem(models.Model):
    """Company values for About page"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Icon name (e.g., 'Users', 'Shield')")
    color = models.CharField(max_length=20, default="primary", help_text="Color variant: primary, secondary, accent")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class FacilityItem(models.Model):
    """Facilities available at the park"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Icon name")
    image_url = models.URLField(null=True, blank=True)
    items = models.JSONField(default=list, help_text="List of specific items/features")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title

class GroupBenefit(models.Model):
    """Benefits for group bookings page"""
    title = models.CharField(max_length=255)
    description = models.TextField()
    icon = models.CharField(max_length=50, help_text="Lucide icon name")
    order = models.IntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title


class ContactMessage(models.Model):
    """Messages from the contact form"""
    ticket_id = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Unique ticket reference for support")
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            import uuid
            import datetime
            # Format: TKT-YYYYMMDD-XXXX
            date_str = datetime.datetime.now().strftime('%Y%m%d')
            unique_str = str(uuid.uuid4())[:4].upper()
            self.ticket_id = f"TKT-{date_str}-{unique_str}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_id} | {self.name} - {self.email}"


class FreeEntry(models.Model):
    """Free entry requests from customers"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    reason = models.TextField(help_text="Reason for free entry request")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(null=True, blank=True, help_text="Admin notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Free Entry"
        verbose_name_plural = "Free Entries"

    def __str__(self):
        return f"{self.name} - {self.status}"



class SessionBookingConfig(models.Model):
    """Configuration for session booking wizard - makes all pricing and labels editable from CMS"""
    
    # Adult Pricing & Labels
    adult_price = models.DecimalField(max_digits=10, decimal_places=2, default=9.95, help_text="Price per adult in GBP")
    adult_label = models.CharField(max_length=100, default="Adults (7+ Years)", help_text="Display label for adults")
    adult_description = models.CharField(max_length=200, default="£9.95 per person", help_text="Price description for adults")
    
    # Kid Pricing & Labels
    kid_price = models.DecimalField(max_digits=10, decimal_places=2, default=9.95, help_text="Price per kid in GBP")
    kid_label = models.CharField(max_length=100, default="Kids (1-7 Years)", help_text="Display label for kids")
    kid_description = models.CharField(max_length=200, default="£9.95 per person", help_text="Price description for kids")
    
    # Spectator Pricing & Labels
    spectator_price = models.DecimalField(max_digits=10, decimal_places=2, default=2.95, help_text="Price per spectator in GBP")
    spectator_label = models.CharField(max_length=100, default="Spectators (Age 4+)", help_text="Display label for spectators")
    spectator_description = models.CharField(max_length=200, default="£2.95 per person", help_text="Price description for spectators")
    
    # Tax Configuration
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="VAT percentage (0 for no VAT)")
    
    # Duration Configuration
    duration_minutes = models.IntegerField(default=60, help_text="Session duration in minutes")
    duration_label = models.CharField(max_length=100, default="60 Minutes", help_text="Display label for duration")
    duration_description = models.CharField(max_length=200, default="Standard Session", help_text="Duration description")

    # Add-on Pricing (per item, GBP)
    skate_hire_price = models.DecimalField(max_digits=10, decimal_places=2, default=2.95, help_text="Skate hire price per pair")
    shoe_hire_price = models.DecimalField(max_digits=10, decimal_places=2, default=1.50, help_text="Bowling shoe hire price per pair")
    locker_hire_price = models.DecimalField(max_digits=10, decimal_places=2, default=2.00, help_text="Locker hire price per locker")
    token_pack_20_price = models.DecimalField(max_digits=10, decimal_places=2, default=5.00, help_text="Arcade token pack (20 tokens)")
    token_pack_50_price = models.DecimalField(max_digits=10, decimal_places=2, default=10.00, help_text="Arcade token pack (50 tokens)")
    parking_price = models.DecimalField(max_digits=10, decimal_places=2, default=3.00, help_text="Parking price per car")

    # Meta
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Session Booking Configuration"
        verbose_name_plural = "Session Booking Configuration"
    
    def __str__(self):
        return f"Session Booking Config (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    @classmethod
    def get_config(cls):
        """Get or create singleton config"""
        config, created = cls.objects.get_or_create(id=1)
        if created:
            config.save()  # Ensure defaults are saved
        return config


class PartyBookingConfig(models.Model):
    """Singleton model for party booking wizard configuration"""
    
    # Pricing
    participant_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=14.95,
        help_text="Price per participant in GBP"
    )
    participant_label = models.CharField(
        max_length=200, 
        default="Participants",
        help_text="Label for participants"
    )
    participant_description = models.CharField(
        max_length=500, 
        default="£14.95 per person",
        help_text="Description shown for participants"
    )
    
    spectator_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=100.00,
        help_text="Price per extra spectator (after free count)"
    )
    free_spectators = models.IntegerField(
        default=10,
        help_text="Number of free spectators included"
    )
    spectator_label = models.CharField(
        max_length=200, 
        default="Spectators",
        help_text="Label for spectators"
    )
    spectator_description = models.CharField(
        max_length=500, 
        default="First 10 free, ₹100 each after",
        help_text="Description shown for spectators"
    )
    
    # Minimums & Limits
    min_participants = models.IntegerField(
        default=10,
        help_text="Minimum number of participants required"
    )
    
    # Tax & Deposit
    gst_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=18.00,
        help_text="GST rate in percentage"
    )
    deposit_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=50.00,
        help_text="Deposit percentage required"
    )
    
    # Package Inclusions (JSON field for flexibility)
    package_inclusions = models.JSONField(
        default=list,
        blank=True,
        help_text="List of package inclusions (e.g., ['75 mins play + 1hr party room', 'Party feast included'])"
    )
    
    # Time Slots
    available_time_slots = models.JSONField(
        default=list,
        blank=True,
        help_text="List of available time slots (e.g., ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'])"
    )
    
    # Duration & Labels
    duration_label = models.CharField(
        max_length=200, 
        default="75 mins play + 1hr party room",
        help_text="Duration/package label"
    )
    
    # Status
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Party Booking Configuration"
        verbose_name_plural = "Party Booking Configuration"
    
    def __str__(self):
        return f"Party Booking Config (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    def save(self, *args, **kwargs):
        # Ensure default values for JSON fields
        if not self.package_inclusions:
            self.package_inclusions = [
                "75 mins play + 1hr party room",
                "Party feast included",
                "Drinks & mini slush",
                "10 free spectators"
            ]
        if not self.available_time_slots:
            self.available_time_slots = ["12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"]
        super().save(*args, **kwargs)
    
    @classmethod
    def get_config(cls):
        """Get or create singleton config"""
        config, created = cls.objects.get_or_create(id=1)
        if created:
            config.save()  # Ensure defaults are saved
        return config



class AttractionVideoSection(models.Model):
    """
    Independent video section for attraction page.
    Managed via admin, displayed below hero section.
    Supports YouTube/Vimeo URLs.
    """
    title = models.CharField(max_length=200, blank=True, null=True)
    video = models.CharField(max_length=500, blank=True, null=True, help_text="YouTube, Vimeo, or other video URL")
    thumbnail = models.ImageField(upload_to='attraction_thumbnails/', blank=True, null=True, help_text="Poster image to show while video loads")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Attraction Video Section"
        verbose_name_plural = "Attraction Video Sections"
        ordering = ['-created_at']
    
    def __str__(self):
        active_status = 'Active' if self.is_active else 'Inactive'
        title_display = self.title or 'Untitled'
        return f"Video: {title_display} - {active_status}"
    
    def get_video_url(self):
        """Returns the video URL (YouTube/Vimeo link or uploaded file path), or None."""
        return self.video or None

class PricingCarouselImage(models.Model):
    """
    Images for the carousel on the Pricing page.
    """
    title = models.CharField(max_length=200, blank=True, null=True, help_text="Optional title/alt text")
    image_url = models.CharField(max_length=700, help_text="URL of the image (uploaded via gallery or external)")
    order = models.IntegerField(default=0, help_text="Display order")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = "Pricing Carousel Image"
        verbose_name_plural = "Pricing Carousel Images"

    def __str__(self):
        return self.title or f"Image {self.id}"


class TimingCard(models.Model):
    """Timing/operating hours cards shown site-wide on all pages."""
    COLOR_CHOICES = [
        ('primary', 'Primary'),
        ('secondary', 'Secondary'),
        ('accent', 'Accent'),
    ]
    day_label = models.CharField(max_length=100, help_text="e.g. 'Monday – Friday' or 'Weekends'")
    open_time = models.CharField(max_length=20, help_text="Opening time, e.g. '10:00 AM'")
    close_time = models.CharField(max_length=20, help_text="Closing time, e.g. '9:00 PM'")
    note = models.CharField(max_length=200, null=True, blank=True, help_text="Optional note, e.g. 'Last entry 8 PM'")
    icon = models.CharField(max_length=50, default='Clock', help_text="Lucide icon name, e.g. 'Clock'")
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='primary', help_text="Card accent color")
    active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = "Timing Card"
        verbose_name_plural = "Timing Cards"

    def __str__(self):
        return f"{self.day_label}: {self.open_time} – {self.close_time}"


class CustomerAccountConfig(models.Model):
    """Singleton model for the Customer Account / Bookings page text"""
    
    # Header Section
    header_title = models.CharField(max_length=255, default="Hi, {name}! 👋", help_text="Use {name} as a placeholder for the customer's first name")
    
    # Book Again CTA
    cta_title = models.CharField(max_length=255, default="Book Another Session")
    cta_subtitle = models.CharField(max_length=255, default="Skating, bowling — book your next visit")
    cta_link = models.CharField(max_length=255, default="/book")
    
    # Empty State
    empty_state_title = models.CharField(max_length=255, default="No bookings yet")
    empty_state_subtitle = models.CharField(max_length=255, default="Book your first session at Go Kids Play!")
    empty_state_button_text = models.CharField(max_length=100, default="Book Now")
    
    # Additional Support / Contact logic can be added here
    
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Customer Account Config"
        verbose_name_plural = "Customer Account Config"
        
    def __str__(self):
        return "Account Page Configuration"
        
    @classmethod
    def get_config(cls):
        config, created = cls.objects.get_or_create(id=1)
        if created:
            config.save()
        return config
