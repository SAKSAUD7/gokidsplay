"""
Global Search Service for Admin Portal.

Provides unified search across all admin modules with RBAC filtering.
"""

from django.db.models import Q
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()


class GlobalSearchService:
    """
    Unified search service that searches across all admin modules.
    
    Respects RBAC permissions and returns formatted results.
    """
    
    def __init__(self, user, query):
        self.user = user
        self.query = query.strip()
        self.allowed_modules = self._get_allowed_modules()
        self.results = []
    
    def _get_allowed_modules(self):
        """Return list of modules user can search based on role."""
        # Get user role - adjust based on your User model
        role = getattr(self.user, 'role', 'STAFF')
        if hasattr(role, 'upper'):
            role = role.upper()
        
        # Define module permissions
        modules = {
            'ADMIN': [
                'bookings', 'users', 'payments', 'cms', 
                'vouchers', 'campaigns', 'messages'
            ],
            'MANAGER': [
                'bookings', 'payments', 'cms', 
                'vouchers', 'campaigns', 'messages'
            ],
            'STAFF': [
                'bookings', 'payments', 'messages'
            ]
        }
        
        # Superusers can search everything
        if self.user.is_superuser:
            return modules['ADMIN']
        
        return modules.get(role, modules['STAFF'])
    
    def search_all(self):
        """Execute search across all allowed modules."""
        if len(self.query) < 2:
            return []
        
        # Search each module if user has permission
        if 'bookings' in self.allowed_modules:
            self._search_bookings()
        
        if 'users' in self.allowed_modules:
            self._search_users()
        
        if 'payments' in self.allowed_modules:
            self._search_payments()
        
        if 'vouchers' in self.allowed_modules:
            self._search_vouchers()
        

        if 'campaigns' in self.allowed_modules:
            self._search_campaigns()
        
        if 'messages' in self.allowed_modules:
            self._search_messages()
        
        return self.results
    
    def _search_bookings(self):
        """Search session and party bookings."""
        from apps.bookings.models import Booking, PartyBooking

        # Session bookings
        session_bookings = Booking.objects.filter(
            Q(booking_number__icontains=self.query) |
            Q(name__icontains=self.query) |
            Q(email__icontains=self.query) |
            Q(phone__icontains=self.query) |
            Q(id__icontains=self.query)
        ).select_related('customer')[:5]
        
        for booking in session_bookings:
            self.results.append({
                'type': 'booking',
                'title': booking.name,
                'subtitle': f"{booking.booking_number or f'#{booking.id}'} • {booking.date.strftime('%d %b %Y')}",
                'route': f'/admin/session-bookings/{booking.id}'
            })
        
        # Party bookings
        party_bookings = PartyBooking.objects.filter(
            Q(booking_number__icontains=self.query) |
            Q(name__icontains=self.query) |
            Q(email__icontains=self.query) |
            Q(phone__icontains=self.query) |
            Q(id__icontains=self.query)
        )[:5]
        
        for booking in party_bookings:
            self.results.append({
                'type': 'party_booking',
                'title': booking.name,
                'subtitle': f"{booking.booking_number or f'P#{booking.id}'} • {booking.date.strftime('%d %b %Y')}",
                'route': f'/admin/party-bookings/{booking.id}'
            })
    
    def _search_users(self):
        """Search admin users."""
        users = User.objects.filter(
            Q(username__icontains=self.query) |
            Q(email__icontains=self.query) |
            Q(first_name__icontains=self.query) |
            Q(last_name__icontains=self.query)
        )[:5]
        
        for user in users:
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            role = getattr(user, 'role', 'User')
            
            self.results.append({
                'type': 'user',
                'title': full_name,
                'subtitle': f"{user.email} • {role}",
                'route': f'/admin/users/{user.id}'
            })
    
    def _search_payments(self):
        """Search payment records."""
        from apps.payments.models import Payment

        payments = Payment.objects.filter(
            Q(order_id__icontains=self.query) |
            Q(payment_id__icontains=self.query) |
            Q(booking__email__icontains=self.query) |
            Q(booking__name__icontains=self.query) |
            Q(party_booking__email__icontains=self.query) |
            Q(party_booking__name__icontains=self.query)
        ).select_related('booking', 'party_booking')[:5]
        
        for payment in payments:
            customer_name = 'Unknown'
            if payment.booking:
                customer_name = payment.booking.name
            elif payment.party_booking:
                customer_name = payment.party_booking.name
            
            self.results.append({
                'type': 'payment',
                'title': f"Order #{payment.order_id}",
                'subtitle': f"₹{payment.amount:,.0f} • {customer_name} • {payment.status}",
                'route': f'/admin/payments/{payment.id}'
            })
    
    def _search_vouchers(self):
        """Search voucher codes."""
        from apps.shop.models import Voucher

        vouchers = Voucher.objects.filter(
            Q(code__icontains=self.query) |
            Q(description__icontains=self.query)
        )[:5]
        
        for voucher in vouchers:
            status = 'Active' if voucher.is_active else 'Inactive'
            discount = f"{voucher.discount_value}{'%' if voucher.discount_type == 'PERCENTAGE' else '₹'}"
            
            self.results.append({
                'type': 'voucher',
                'title': voucher.code,
                'subtitle': f"{discount} Off • {status}",
                'route': f'/admin/vouchers/{voucher.id}'
            })
    

    
    def _search_campaigns(self):
        """Search marketing campaigns."""
        try:
            from apps.marketing.models import MarketingCampaign as Campaign
            campaigns = Campaign.objects.filter(
                Q(name__icontains=self.query) |
                Q(subject__icontains=self.query)
            )[:5]
            
            for campaign in campaigns:
                status = campaign.status if hasattr(campaign, 'status') else 'Draft'
                
                self.results.append({
                    'type': 'campaign',
                    'title': campaign.name,
                    'subtitle': f"Email • {status}",
                    'route': f'/admin/marketing/campaigns/{campaign.id}'
                })
        except Exception:
            # Campaign model might not exist or have different structure
            pass
    
    def _search_messages(self):
        """Search contact messages."""
        try:
            from apps.cms.models import ContactMessage
            messages = ContactMessage.objects.filter(
                Q(name__icontains=self.query) |
                Q(email__icontains=self.query) |
                Q(subject__icontains=self.query) |
                Q(message__icontains=self.query)
            )[:5]
            
            for message in messages:
                time_ago = self._get_time_ago(message.created_at)
                
                self.results.append({
                    'type': 'message',
                    'title': message.name,
                    'subtitle': f"{message.subject} • {time_ago}",
                    'route': f'/admin/messages/{message.id}'
                })
        except Exception:
            # ContactMessage model might not exist
            pass
    
    def _get_time_ago(self, dt):
        """Get human-readable time ago string."""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - dt
        
        if diff < timedelta(minutes=1):
            return 'Just now'
        elif diff < timedelta(hours=1):
            mins = int(diff.total_seconds() / 60)
            return f'{mins} min{"s" if mins != 1 else ""} ago'
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif diff < timedelta(days=7):
            days = diff.days
            return f'{days} day{"s" if days != 1 else ""} ago'
        else:
            return dt.strftime('%d %b %Y')
