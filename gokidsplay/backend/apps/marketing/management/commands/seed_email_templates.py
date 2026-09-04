import os
import sys

# Ensure backend directory is in the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ninja_backend.settings")
django.setup()

from apps.marketing.models import EmailTemplate

templates = [
    {
        "name": "General Campaign (Default)",
        "type": "GENERAL",
        "subject": "Update from Spin Pin",
        "html_content": "{{ content }}",
    },
    {
        "name": "Monthly Newsletter",
        "type": "GENERAL",
        "subject": "Spin Pin Monthly Newsletter",
        "html_content": "<h2>Monthly Newsletter</h2><p>Here is what is happening this month at Spin Pin!</p><br/>{{ content }}",
    },
    {
        "name": "Holiday Special Promotion",
        "type": "HOLIDAY",
        "subject": "Holiday Special at Spin Pin!",
        "html_content": "<div style='text-align: center;'><h2>🎉 Holiday Special! 🎉</h2><p>{{ content }}</p></div>",
    },
    {
        "name": "Birthday Offer",
        "type": "BIRTHDAY",
        "subject": "Happy Birthday from Spin Pin!",
        "html_content": "<div style='text-align: center;'><h2>🎂 Happy Birthday! 🎂</h2><p>Celebrate with us!</p><p>{{ content }}</p></div>",
    },
    {
        "name": "Weekend Flash Sale",
        "type": "PROMOTION",
        "subject": "Flash Sale This Weekend Only!",
        "html_content": "<div style='color: red;'><h2>⚡ Flash Sale ⚡</h2></div><p>{{ content }}</p>",
    },
    {
        "name": "Customer Feedback Request",
        "type": "GENERAL",
        "subject": "How was your recent visit?",
        "html_content": "<p>We value your feedback.</p><p>{{ content }}</p>",
    },
    {
        "name": "New Activity Announcement",
        "type": "PROMOTION",
        "subject": "New Activity at Spin Pin!",
        "html_content": "<h2>Check out our newest activity!</h2><p>{{ content }}</p>",
    },
]

for t in templates:
    EmailTemplate.objects.get_or_create(
        name=t["name"],
        defaults={
            "type": t["type"],
            "subject": t["subject"],
            "html_content": t["html_content"],
            "is_active": True
        }
    )
print("Seeded 7 default templates successfully.")
