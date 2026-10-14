from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, VoucherViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'vouchers', VoucherViewSet)
from .views import MembershipPlanViewSet, CustomerMembershipViewSet
router.register(r'membership-plans', MembershipPlanViewSet, basename='membershipplan')
router.register(r'customer-memberships', CustomerMembershipViewSet, basename='customermembership')

urlpatterns = [
    path('', include(router.urls)),
]
