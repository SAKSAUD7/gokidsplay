from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_rbac_users(apps, schema_editor):
    User = apps.get_model('core', 'User')
    
    # Default secure password
    password_hash = make_password('NinjaPark2026!')
    
    users = [
        {
            'email': 'admin2@ninjapark.com',
            'name': 'Admin Two',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True
        },
        {
            'email': 'manager@ninjapark.com',
            'name': 'Park Manager',
            'role': 'MANAGER',
            'is_staff': True,
            'is_superuser': False
        },
        {
            'email': 'content@ninjapark.com',
            'name': 'Content Manager',
            'role': 'CONTENT_MANAGER',
            'is_staff': True,
            'is_superuser': False
        },
        {
            'email': 'staff@ninjapark.com',
            'name': 'Front Desk Staff',
            'role': 'STAFF',
            'is_staff': True,
            'is_superuser': False
        },
        {
            'email': 'employee@ninjapark.com',
            'name': 'General Employee',
            'role': 'EMPLOYEE',
            'is_staff': True,
            'is_superuser': False
        },
    ]

    for user_data in users:
        email = user_data['email']
        if not User.objects.filter(email=email).exists():
            print(f"Creating user: {email}")
            User.objects.create(
                email=email,
                username=email.split('@')[0],
                name=user_data['name'],
                role=user_data['role'],
                password=password_hash,
                is_staff=user_data['is_staff'],
                is_superuser=user_data['is_superuser'],
                is_active=True
            )

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0007_alter_user_role'),
    ]

    operations = [
        migrations.RunPython(create_rbac_users),
    ]
