from django.db import models

# Discount vouchers used by session and party bookings. (The shop products and
# membership plans that used to live here were removed.)
# Rules are checked in services.evaluate_voucher; every use is a VoucherRedemption.

class Voucher(models.Model):
    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Percentage'),
        ('FLAT', 'Flat Amount'),
    ]
    APPLIES_TO = [
        ('ALL', 'Sessions and parties'),
        ('SESSION', 'Play sessions only'),
        ('PARTY', 'Parties only'),
    ]

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    description = models.TextField(null=True, blank=True)
    min_hours_before_slot = models.IntegerField(
        default=0,
        help_text="Minimum hours required between current time and booking slot. 0 = no restriction."
    )
    valid_from = models.DateTimeField(null=True, blank=True, help_text="Can't be used before this time (empty = straight away)")
    applies_to = models.CharField(max_length=10, choices=APPLIES_TO, default='ALL')
    max_uses_per_customer = models.PositiveIntegerField(null=True, blank=True,
                                                        help_text="Uses per e-mail address (empty = no limit)")
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                              help_text="Most a percentage voucher can take off, in £ (empty = no cap)")
    batch = models.CharField(max_length=60, blank=True, default='',
                             help_text="Set when the code was made by 'Generate codes' (e.g. SUMMER26)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.code


class VoucherRedemption(models.Model):
    """One use of a voucher on a booking. Released (given back) if the booking is cancelled."""
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE, related_name='redemptions')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, null=True, blank=True,
                                related_name='voucher_redemptions')
    party_booking = models.ForeignKey('bookings.PartyBooking', on_delete=models.CASCADE, null=True, blank=True,
                                      related_name='voucher_redemptions')
    email = models.EmailField(blank=True, default='', db_index=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    released = models.BooleanField(default=False, help_text="The booking was cancelled, so this use was given back")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.voucher.code} on {self.booking_id or self.party_booking_id}"
