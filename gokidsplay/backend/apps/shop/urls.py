from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, VoucherViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'vouchers', VoucherViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
