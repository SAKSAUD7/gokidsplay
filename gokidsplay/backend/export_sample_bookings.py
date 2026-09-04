"""
Export Sample Booking Data + Global Settings + Invitation Templates
Exports 1-2 sample records from each booking model for testing
"""
import os
import sys
import django
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ninja_backend.settings')
django.setup()

def export_sample_data():
    """Export sample booking data and settings"""
    from apps.bookings import models as booking_models
    from apps.invitations import models as invitation_models
    from apps.core import models as core_models
    
    data = {}
    
    print("\n📋 Exporting Sample Booking Data...")
    print("=" * 60)
    
    # Booking models - 1-2 samples each
    booking_model_configs = [
        ('Customer', 2),
        ('BookingBlock', 2),
        ('SessionBooking', 1),
        ('PartyBooking', 1),
        ('Transaction', 2),
        ('Waiver', 2),
    ]
    
    for model_name, limit in booking_model_configs:
        try:
            model_class = getattr(booking_models, model_name)
            records = list(model_class.objects.values()[:limit])
            if records:
                data[f'bookings.{model_name}'] = records
                print(f"✅ {model_name}: {len(records)} sample records")
            else:
                print(f"⚪ {model_name}: No data to export")
        except AttributeError:
            print(f"⚠️  {model_name}: Model not found")
        except Exception as e:
            print(f"❌ {model_name}: Error - {str(e)[:100]}")
    
    print("\n🎫 Exporting Invitation Templates...")
    print("=" * 60)
    
    # Invitation models
    invitation_models_list = ['InvitationTemplate', 'BookingInvitation']
    
    for model_name in invitation_models_list:
        try:
            model_class = getattr(invitation_models, model_name)
            records = list(model_class.objects.values())
            if records:
                data[f'invitations.{model_name}'] = records
                print(f"✅ {model_name}: {len(records)} records")
            else:
                print(f"⚪ {model_name}: No data")
        except AttributeError:
            print(f"⚠️  {model_name}: Model not found")
        except Exception as e:
            print(f"❌ {model_name}: Error - {str(e)[:100]}")
    
    print("\n⚙️  Exporting Global Settings...")
    print("=" * 60)
    
    # Global Settings
    try:
        GlobalSettings = getattr(core_models, 'GlobalSettings')
        records = list(GlobalSettings.objects.values())
        if records:
            data['core.GlobalSettings'] = records
            print(f"✅ GlobalSettings: {len(records)} records")
        else:
            print(f"⚪ GlobalSettings: No data")
    except AttributeError:
        print(f"⚠️  GlobalSettings: Model not found")
    except Exception as e:
        print(f"❌ GlobalSettings: Error - {str(e)[:100]}")
    
    # Write to file
    output_file = 'sample_booking_data.json'
    print(f"\n💾 Writing to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    
    print(f"✅ Export complete! File: {output_file}\n")
    
    total_records = sum(len(records) for records in data.values())
    print(f"📊 Total records exported: {total_records}")
    print(f"📦 Models with data: {len(data)}\n")

if __name__ == '__main__':
    export_sample_data()
