"""
Tests for bookings app models
"""
import pytest
from django.utils import timezone
from datetime import date, time
from apps.bookings.models import Customer, Booking, PartyBooking


@pytest.mark.django_db
class TestCustomerModel:
    """Test Customer model"""
    
    def test_create_customer(self):
        """Test creating a customer"""
        customer = Customer.objects.create(
            name="John Doe",
            email="john@example.com",
            phone="+91 9876543210"
        )
        assert customer.name == "John Doe"
        assert customer.email == "john@example.com"
        assert customer.phone == "+91 9876543210"
        assert str(customer) == "John Doe"
    
    def test_customer_email_unique(self):
        """Test that customer email must be unique"""
        Customer.objects.create(
            name="John Doe",
            email="john@example.com"
        )
        with pytest.raises(Exception):  # IntegrityError
            Customer.objects.create(
                name="Jane Doe",
                email="john@example.com"
            )


@pytest.mark.django_db
class TestBookingModel:
    """Test Booking model"""
    
    def test_create_booking(self):
        """Test creating a booking"""
        booking = Booking.objects.create(
            name="John Doe",
            email="john@example.com",
            phone="+91 9876543210",
            date=date.today(),
            time=time(14, 0),
            duration=60,
            adults=2,
            kids=1,
            amount=1500.00
        )
        assert booking.name == "John Doe"
        assert booking.adults == 2
        assert booking.kids == 1
        assert booking.amount == 1500.00
        assert booking.booking_status == 'PENDING'
        assert booking.payment_status == 'PENDING'
        assert booking.uuid is not None
    
    def test_booking_str_representation(self):
        """Test booking string representation"""
        booking = Booking.objects.create(
            name="Test User",
            email="test@example.com",
            phone="1234567890",
            date=date.today(),
            time=time(14, 0),
            duration=60,
            amount=1000.00
        )
        assert "Test User" in str(booking)


@pytest.mark.django_db
class TestPartyBookingModel:
    """Test PartyBooking model"""
    
    def test_create_party_booking(self):
        """Test creating a party booking"""
        party = PartyBooking.objects.create(
            name="Birthday Party",
            email="party@example.com",
            phone="+91 9876543210",
            date=date.today(),
            time=time(16, 0),
            package_name="Premium Package",
            kids=10,
            adults=5,
            amount=5000.00,
            birthday_child_name="Little Johnny",
            birthday_child_age=8
        )
        assert party.name == "Birthday Party"
        assert party.kids == 10
        assert party.adults == 5
        assert party.birthday_child_name == "Little Johnny"
        assert party.status == 'PENDING'
        assert party.uuid is not None
