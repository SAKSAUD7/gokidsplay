from rest_framework import serializers
from django.utils import timezone
from .models import User, GlobalSettings, Logo, Notification

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'profile_pic', 'role', 'is_active', 'last_login', 'password']
        read_only_fields = ['last_login']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        # Ensure username is set (using email) since AbstractUser requires it
        if 'username' not in validated_data and 'email' in validated_data:
            validated_data['username'] = validated_data['email']
            
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        return user

class GlobalSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSettings
        fields = '__all__'

class LogoSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Logo
        fields = ['id', 'name', 'image', 'image_url', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image_url(self, obj):
        # A name like "/gokidsplay-logo.png" is the website's own built-in file, not an
        # upload; returning None lets the site use its built-in logo instead of a 404.
        if obj.image and str(obj.image.name).startswith('/'):
            return None
        if obj.image:
            request = self.context.get('request')
            if request:
                url = request.build_absolute_uri(obj.image.url)
            else:
                url = obj.image.url
            # Always force HTTPS in production (Azure terminates SSL at the load balancer,
            # so request.scheme may be 'http' internally even though the public URL is https)
            # Local development has no TLS, so leave localhost URLs as http.
            is_local = '://localhost' in url or '://127.0.0.1' in url
            if url and url.startswith('http://') and not is_local:
                url = 'https://' + url[7:]
            return url
        return None

class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'type', 'title', 'message', 'link', 'is_read', 
                  'created_at', 'time_ago', 'booking_id', 'party_booking_id', 
                  'contact_message_id']
        read_only_fields = ['created_at']
    
    def get_time_ago(self, obj):
        diff = timezone.now() - obj.created_at
        
        if diff.seconds < 60:
            return "Just now"
        elif diff.seconds < 3600:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff.seconds < 86400:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"

