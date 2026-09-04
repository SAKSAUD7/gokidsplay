import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

from apps.cms.models import PageSection, Page

print("=== PAGES ===")
for p in Page.objects.all():
    print(f"  {p.slug} | {p.name} | active={p.active}")

print("\n=== PAGE SECTIONS ===")
for ps in PageSection.objects.all().order_by('page', 'section_key'):
    title = ps.title[:60] if ps.title else "(empty)"
    print(f"  [{ps.page}] key={ps.section_key} | title={title}")
