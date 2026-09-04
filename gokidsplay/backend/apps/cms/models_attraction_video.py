from django.db import models


class AttractionVideoSection(models.Model):
    """
    Independent video section for attraction page.
    Managed via admin, displayed below hero section.
    """
    title = models.CharField(max_length=200, blank=True, null=True)
    video = models.FileField(upload_to='attraction_videos/', max_length=500)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Attraction Video Section"
        verbose_name_plural = "Attraction Video Sections"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Video: {self.title or 'Untitled'} - {'Active' if self.is_active else 'Inactive'}"
