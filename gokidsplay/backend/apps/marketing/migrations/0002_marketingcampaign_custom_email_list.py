from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('marketing', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='marketingcampaign',
            name='custom_email_list',
            field=models.TextField(blank=True, help_text='Comma-separated list of emails for CUSTOM_LIST recipient type', null=True),
        ),
    ]
