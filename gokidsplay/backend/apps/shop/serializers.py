from rest_framework import serializers
from .models import Product, Voucher
from django.apps import apps

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = '__all__'

class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = apps.get_model('shop', 'MembershipPlan')
        fields = '__all__'

class CustomerMembershipSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    class Meta:
        model = apps.get_model('shop', 'CustomerMembership')
        fields = '__all__'
