from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0019_attractionvideosection'),
    ]

    operations = [
        migrations.AlterField(
            model_name='instagramreel',
            name='thumbnail_url',
            field=models.CharField(blank=True, help_text='Thumbnail image URL (local path or external link)', max_length=700, null=True),
        ),
    ]
