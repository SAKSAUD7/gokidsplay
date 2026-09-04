# pyright: reportAttributeAccessIssue=false
# pyright: reportMissingTypeStubs=false
"""
Customer authentication views for Go Kids Play.
Provides register, login, logout, me, and my-bookings endpoints.
Uses simple token auth stored in a separate CustomerToken table.
No Django sessions — pure API token approach compatible with Next.js frontend.
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
import secrets
import re

from apps.bookings.models import Customer, Booking, PartyBooking
from .models import CustomerToken


def validate_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def customer_to_dict(customer):
    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
    }


def get_customer_from_request(request):
    """Extract customer from Bearer token in Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token_key = auth[7:]
    try:
        token_obj = CustomerToken.objects.select_related("customer").get(
            token=token_key,
            expires_at__gt=timezone.now()
        )
        return token_obj.customer
    except CustomerToken.DoesNotExist:
        return None


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_register(request):
    """Register a new customer account."""
    data = request.data
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""

    # Validate
    if not name or len(name) < 2:
        return Response({"error": "Please enter your full name."}, status=400)
    if not email or not validate_email(email):
        return Response({"error": "Please enter a valid email address."}, status=400)
    if not password or len(password) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=400)

    # Check if customer already has an account
    if CustomerToken.objects.filter(customer__email=email).exists():
        return Response({"error": "An account already exists with this email. Please log in."}, status=400)

    # Get-or-create the Customer record
    customer, created = Customer.objects.get_or_create(
        email=email,
        defaults={"name": name, "phone": phone}
    )
    if not created:
        # Update existing customer record with name/phone if blank
        if not customer.name:
            customer.name = name
        if not customer.phone and phone:
            customer.phone = phone
        customer.save()

    # Create CustomerToken record with hashed password
    hashed = make_password(password)
    # Delete any old tokens for this customer
    CustomerToken.objects.filter(customer=customer).delete()
    token_key = secrets.token_urlsafe(40)
    expires_at = timezone.now() + timezone.timedelta(days=30)
    CustomerToken.objects.create(
        customer=customer,
        token=token_key,
        password_hash=hashed,
        expires_at=expires_at
    )

    return Response({
        "token": token_key,
        "customer": customer_to_dict(customer),
        "message": "Account created successfully!"
    }, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def customer_login(request):
    """Log in with email and password."""
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=400)

    # Find customer
    try:
        customer = Customer.objects.get(email=email)
    except Customer.DoesNotExist:
        return Response({"error": "No account found with this email. Please register first."}, status=404)

    # Find token record (which stores the password hash)
    try:
        token_obj = CustomerToken.objects.get(customer=customer)
    except CustomerToken.DoesNotExist:
        return Response({"error": "No account found. Please register first."}, status=404)

    # Check password
    if not check_password(password, token_obj.password_hash):
        return Response({"error": "Incorrect password. Please try again."}, status=401)

    # Refresh token
    token_key = secrets.token_urlsafe(40)
    token_obj.token = token_key
    token_obj.expires_at = timezone.now() + timezone.timedelta(days=30)
    token_obj.save()

    return Response({
        "token": token_key,
        "customer": customer_to_dict(customer),
    })


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_me(request):
    """Get current logged-in customer."""
    customer = get_customer_from_request(request)
    if not customer:
        return Response({"error": "Not authenticated."}, status=401)
    return Response(customer_to_dict(customer))


@api_view(["PATCH"])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_update_profile(request):
    """Update customer profile (name, phone)."""
    customer = get_customer_from_request(request)
    if not customer:
        return Response({"error": "Not authenticated."}, status=401)

    data = request.data
    if data.get("name"):
        customer.name = data["name"].strip()
    if data.get("phone") is not None:
        customer.phone = data["phone"].strip()
    customer.save()

    return Response(customer_to_dict(customer))


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_change_password(request):
    """Change customer password."""
    customer = get_customer_from_request(request)
    if not customer:
        return Response({"error": "Not authenticated."}, status=401)

    old_password = request.data.get("old_password") or ""
    new_password = request.data.get("new_password") or ""

    if len(new_password) < 6:
        return Response({"error": "New password must be at least 6 characters."}, status=400)

    try:
        token_obj = CustomerToken.objects.get(customer=customer)
    except CustomerToken.DoesNotExist:
        return Response({"error": "Account error."}, status=400)

    if not check_password(old_password, token_obj.password_hash):
        return Response({"error": "Current password is incorrect."}, status=401)

    token_obj.password_hash = make_password(new_password)
    token_obj.save()

    return Response({"message": "Password changed successfully."})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_my_bookings(request):
    """Get all bookings (session + party) for the logged-in customer."""
    customer = get_customer_from_request(request)
    if not customer:
        return Response({"error": "Not authenticated."}, status=401)

    # Session bookings for this customer (by customer FK or email)
    session_qs = Booking.objects.filter(
        customer=customer
    ).order_by("-created_at")

    # Also search by email if no FK link
    session_by_email = Booking.objects.filter(
        email=customer.email, customer__isnull=True
    ).order_by("-created_at")

    # Party bookings
    party_qs = PartyBooking.objects.filter(
        customer=customer
    ).order_by("-created_at")

    party_by_email = PartyBooking.objects.filter(
        email=customer.email, customer__isnull=True
    ).order_by("-created_at")

    session_bookings = []
    for b in list(session_qs) + list(session_by_email):
        activity_emoji = "🛼" if "skating" in (b.activity or "").lower() else "🎳" if "bowling" in (b.activity or "").lower() else "🎮"
        session_bookings.append({
            "id": b.id,
            "booking_number": b.booking_number,
            "type": "SESSION",
            "activity": b.activity,
            "activity_emoji": activity_emoji,
            "date": str(b.date),
            "time": str(b.time) if b.time else None,
            "duration": b.duration,
            "adults": b.adults,
            "kids": b.kids,
            "amount": float(b.amount) if b.amount else 0,
            "status": b.booking_status or b.status,
            "booking_status": b.booking_status,
            "payment_status": b.payment_status,
            "created_at": b.created_at.isoformat(),
        })

    party_bookings = []
    for b in list(party_qs) + list(party_by_email):
        party_bookings.append({
            "id": b.id,
            "booking_number": b.booking_number,
            "type": "PARTY",
            "activity": "Party Booking",
            "activity_emoji": "🎉",
            "package_name": b.package_name,
            "date": str(b.date),
            "time": str(b.time) if b.time else None,
            "adults": b.adults,
            "kids": b.kids,
            "amount": float(b.amount) if b.amount else 0,
            "paid_amount": float(b.paid_amount) if b.paid_amount else 0,
            "deposit_amount": float(b.deposit_amount) if b.deposit_amount else 0,
            "remaining_balance": float(b.remaining_balance) if b.remaining_balance else 0,
            "payment_type": b.payment_type,
            "payment_status": b.payment_status,
            "status": b.status,
            "birthday_child_name": b.birthday_child_name,
            "created_at": b.created_at.isoformat(),
            "reschedule_count": b.reschedule_count,
            "admin_fee_charged": float(b.admin_fee_charged) if b.admin_fee_charged else 0,
        })

    all_bookings = sorted(
        session_bookings + party_bookings,
        key=lambda x: x["created_at"],
        reverse=True
    )

    return Response({
        "count": len(all_bookings),
        "bookings": all_bookings
    })


@api_view(["GET", "PATCH"])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_booking_detail(request, booking_type, booking_id):
    """Get or update a single booking (session or party) for the logged-in customer."""
    customer = get_customer_from_request(request)
    if not customer:
        return Response({"error": "Not authenticated."}, status=401)

    booking = None
    try:
        if booking_type == "session":
            booking = Booking.objects.get(id=booking_id, customer=customer)
        elif booking_type == "party":
            booking = PartyBooking.objects.get(id=booking_id, customer=customer)
        else:
            return Response({"error": "Invalid booking type."}, status=400)
    except (Booking.DoesNotExist, PartyBooking.DoesNotExist):
        # Fallback: look up by email
        try:
            if booking_type == "session":
                booking = Booking.objects.get(id=booking_id, email=customer.email)
            else:
                booking = PartyBooking.objects.get(id=booking_id, email=customer.email)
        except (Booking.DoesNotExist, PartyBooking.DoesNotExist):
            return Response({"error": "Booking not found."}, status=404)

    if request.method == "PATCH":
        # --- Cancellation action ---
        if request.data.get("action") == "cancel" or request.data.get("status") == "CANCELLED" or request.data.get("booking_status") == "CANCELLED":
            current_status = getattr(booking, "status", None) or getattr(booking, "booking_status", None)
            if current_status == "COMPLETED":
                return Response({"error": "Completed bookings cannot be cancelled."}, status=400)
            if current_status == "CANCELLED":
                return Response({"error": "Booking is already cancelled."}, status=400)
            if booking_type == "session":
                booking.booking_status = "CANCELLED"
                if hasattr(booking, "status"):
                    booking.status = "CANCELLED"
            else:  # party
                booking.status = "CANCELLED"
            booking.save()
        else:
            # --- Normal field-level update ---
            allowed = ["date", "time", "adults", "kids", "spectators",
                       "special_requests", "dietary_restrictions", "notes", "payment_type"]
            for field in allowed:
                if field in request.data:
                    setattr(booking, field, request.data[field])
            booking.save()

    if booking_type == "session":
        b = booking
        return Response({
            "id": b.id,
            "booking_number": b.booking_number,
            "type": "SESSION",
            "activity": b.activity,
            "date": str(b.date),
            "time": str(b.time) if b.time else None,
            "duration": b.duration,
            "adults": b.adults,
            "kids": b.kids,
            "spectators": getattr(b, "spectators", 0),
            "amount": float(b.amount) if b.amount else 0,
            "paid_amount": float(getattr(b, "paid_amount", 0) or 0),
            "remaining_balance": float(getattr(b, "remaining_balance", b.amount) or 0),
            "status": b.booking_status,
            "booking_status": b.booking_status,
            "payment_status": getattr(b, "payment_status", "PENDING"),
            "notes": getattr(b, "notes", "") or "",
            "created_at": b.created_at.isoformat(),
        })
    else:
        b = booking
        return Response({
            "id": b.id,
            "booking_number": b.booking_number,
            "type": "PARTY",
            "package_name": b.package_name,
            "date": str(b.date),
            "time": str(b.time) if b.time else None,
            "adults": b.adults,
            "kids": b.kids,
            "spectators": getattr(b, "spectators", 0),
            "amount": float(b.amount) if b.amount else 0,
            "paid_amount": float(b.paid_amount) if b.paid_amount else 0,
            "deposit_amount": float(b.deposit_amount) if b.deposit_amount else 0,
            "remaining_balance": float(b.remaining_balance) if b.remaining_balance else 0,
            "payment_type": b.payment_type,
            "payment_status": b.payment_status,
            "status": b.status,
            "booking_status": b.status,
            "birthday_child_name": b.birthday_child_name,
            "special_requests": getattr(b, "special_requests", "") or "",
            "participants": getattr(b, "participants", {}) or {},
            "waiver_signed": getattr(b, "waiver_signed", False),
            "created_at": b.created_at.isoformat(),
        })


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def customer_logout(request):
    """Invalidate the customer's token."""
    customer = get_customer_from_request(request)
    if customer:
        CustomerToken.objects.filter(customer=customer).delete()
    return Response({"message": "Logged out."})




# ─── ADMIN-ONLY endpoints ─────────────────────────────────────────────────────

from apps.bookings.permissions import IsSuperAdminOnly
from django.contrib.auth.hashers import make_password

@api_view(["GET"])
@permission_classes([IsSuperAdminOnly])
def admin_customer_account(request, customer_id):
    """Admin: Get full CustomerToken details for a customer (password hash, token, expiry)."""
    from apps.bookings.models import Customer
    try:
        customer = Customer.objects.get(pk=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found."}, status=404)

    try:
        token_obj = CustomerToken.objects.get(customer=customer)
        return Response({
            "has_account": True,
            "customer_id": customer.id,
            "customer_name": customer.name,
            "customer_email": customer.email,
            "token": token_obj.token,
            "token_expires_at": token_obj.expires_at.isoformat() if token_obj.expires_at else None,
            "password_hash": token_obj.password_hash,
            "created_at": token_obj.created_at.isoformat() if hasattr(token_obj, 'created_at') and token_obj.created_at else None,
        })
    except CustomerToken.DoesNotExist:
        return Response({
            "has_account": False,
            "customer_id": customer.id,
            "customer_name": customer.name,
            "customer_email": customer.email,
        })


@api_view(["POST"])
@permission_classes([IsSuperAdminOnly])
def admin_reset_customer_password(request, customer_id):
    """Admin: Reset a customer's password to a new value."""
    from apps.bookings.models import Customer
    new_password = request.data.get("new_password", "").strip()
    if len(new_password) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=400)

    try:
        customer = Customer.objects.get(pk=customer_id)
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found."}, status=404)

    try:
        token_obj = CustomerToken.objects.get(customer=customer)
    except CustomerToken.DoesNotExist:
        return Response({"error": "This customer does not have a login account yet."}, status=404)

    token_obj.password_hash = make_password(new_password)
    token_obj.save(update_fields=["password_hash"])

    return Response({"message": f"Password reset successfully for {customer.email}."})


@api_view(["DELETE"])
@permission_classes([IsSuperAdminOnly])
def admin_revoke_customer_token(request, customer_id):
    """Admin: Revoke/delete the customer's active token (force logout)."""
    from apps.bookings.models import Customer
    try:
        customer = Customer.objects.get(pk=customer_id)
        deleted, _ = CustomerToken.objects.filter(customer=customer).delete()
        return Response({"message": f"Token revoked. Customer will need to log in again.", "deleted": deleted})
    except Customer.DoesNotExist:
        return Response({"error": "Customer not found."}, status=404)

