# Group bookings (the /groups page, its packages and benefits) were removed.

from django.db import migrations


def remove_groups_page_text(apps, schema_editor):
    apps.get_model("cms", "PageSection").objects.filter(page="groups").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0045_google_photos"),
    ]

    operations = [
        migrations.RunPython(remove_groups_page_text, migrations.RunPython.noop),
        migrations.DeleteModel(
            name="GroupBenefit",
        ),
        migrations.DeleteModel(
            name="GroupPackage",
        ),
    ]
