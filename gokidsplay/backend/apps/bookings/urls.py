from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomerViewSet, BookingViewSet, TransactionViewSet, 
    BookingBlockViewSet, PartyBookingViewSet, SessionBookingHistoryViewSet, 
    PartyBookingHistoryViewSet, create_party_booking_view, add_party_participants_view, party_booking_detail_view,
    party_booking_update_status_view,
    mark_party_arrived_view, mark_party_not_arrived_view,
    PublicBookingBlockViewSet, PublicSiteAlertViewSet
)
from .events_views import (
    SpecialEventViewSet, EventBookingViewSet, EventRequestViewSet,
    public_events_list, public_event_detail,
    create_event_booking, create_event_request, event_booking_confirmation,
)
from .calendar_views import calendar_bookings, date_availability, today_status
from .customer_auth import (
    customer_register, customer_login, customer_logout,
    customer_me, customer_update_profile, customer_change_password,
    customer_forgot_password, customer_reset_password,
    customer_my_bookings, customer_booking_detail,
    admin_customer_account, admin_reset_customer_password, admin_revoke_customer_token
)

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'bookings', BookingViewSet)

router.register(r'transactions', TransactionViewSet)
router.register(r'booking-blocks', BookingBlockViewSet)
# Note: party-bookings viewset is registered but create endpoint is overridden below
router.register(r'party-bookings-old', PartyBookingViewSet)
# History endpoints for booking restoration
router.register(r'session-booking-history', SessionBookingHistoryViewSet)
router.register(r'party-booking-history', PartyBookingHistoryViewSet)
router.register(r'public/booking-blocks', PublicBookingBlockViewSet, basename='public-booking-blocks')
router.register(r'site-alerts', PublicSiteAlertViewSet, basename='site-alerts')
# ── Special Events (Section 7) ─────────────────────────────────────────────────
router.register(r'events', SpecialEventViewSet, basename='special-events')
router.register(r'event-bookings', EventBookingViewSet, basename='event-bookings')
router.register(r'event-requests', EventRequestViewSet, basename='event-requests')

urlpatterns = [
    # ── Customer Account Auth ─────────────────────────────────────────────────
    path('customer-auth/register/', customer_register, name='customer-register'),
    path('customer-auth/login/', customer_login, name='customer-login'),
    path('customer-auth/logout/', customer_logout, name='customer-logout'),
    path('customer-auth/me/', customer_me, name='customer-me'),
    path('customer-auth/profile/', customer_update_profile, name='customer-update-profile'),
    path('customer-auth/change-password/', customer_change_password, name='customer-change-password'),
    path('customer-auth/forgot-password/', customer_forgot_password, name='customer-forgot-password'),
    path('customer-auth/reset-password/', customer_reset_password, name='customer-reset-password'),
    path('customer-auth/my-bookings/', customer_my_bookings, name='customer-my-bookings'),
    path('customer-auth/booking/<str:booking_type>/<int:booking_id>/', customer_booking_detail, name='customer-booking-detail'),
    # ── Admin customer account management ─────────────────────────────────────
    path('customer-auth/admin/account/<int:customer_id>/', admin_customer_account, name='admin-customer-account'),
    path('customer-auth/admin/reset-password/<int:customer_id>/', admin_reset_customer_password, name='admin-reset-customer-password'),
    path('customer-auth/admin/revoke-token/<int:customer_id>/', admin_revoke_customer_token, name='admin-revoke-customer-token'),
    # ── Calendar endpoints ─────────────────────────────────────────────────────
    path('calendar/', calendar_bookings, name='calendar-bookings'),
    path('calendar/availability/', date_availability, name='calendar-date-availability'),
    path('calendar/today/', today_status, name='calendar-today-status'),
    # Custom party booking endpoints (bypasses serializer bug)
    path('party-bookings/', create_party_booking_view, name='party-bookings-list-create'),
    path('party-bookings/<int:id>/', party_booking_detail_view, name='party-booking-detail'),
    path('party-bookings/<int:pk>/mark_arrived/', mark_party_arrived_view, name='party-booking-mark-arrived'),
    path('party-bookings/<int:pk>/mark_not_arrived/', mark_party_not_arrived_view, name='party-booking-mark-not-arrived'),
    path('party-bookings/<int:id>/update_status/', party_booking_update_status_view, name='party-booking-update-status'),
    path('party-bookings/<int:pk>/audit_log/', PartyBookingViewSet.as_view({'get': 'audit_log'}), name='party-booking-audit-log'),
    path('party-bookings/<uuid:uuid>/add_participants/', add_party_participants_view, name='party-booking-add-participants'),
    path('party-bookings/ticket/<uuid:uuid>/', PartyBookingViewSet.as_view({'get': 'ticket'}), name='party-booking-ticket'),
    # ── Special Events Public API (Section 7) ──────────────────────────────────
    path('public/events/', public_events_list, name='public-events-list'),
    # book/ must come before <slug>/, otherwise "book" is treated as an event slug
    path('public/events/book/', create_event_booking, name='create-event-booking'),
    path('public/events/request/', create_event_request, name='create-event-request'),
    path('public/events/<slug:slug>/', public_event_detail, name='public-event-detail'),
    path('public/events/booking/<uuid:booking_uuid>/', event_booking_confirmation, name='event-booking-confirmation'),

    path('', include(router.urls)),
]

