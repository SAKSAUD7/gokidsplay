from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0017_booking_bookings_bo_name_562a70_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='activity',
            field=models.CharField(
                blank=True,
                null=True,
                max_length=100,
                help_text='Activity type: roller-skating, ten-pin-bowling, arcade'
            ),
        ),
        migrations.AddField(
            model_name='booking',
            name='add_ons',
            field=models.JSONField(
                blank=True,
                null=True,
                help_text='Selected add-ons: [{id, label, qty, price_each, subtotal}]'
            ),
        ),
    ]
