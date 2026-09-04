"""
Emergency script to trigger the database migration on Azure production.
This will fix all the ProgrammingError issues you're seeing.
"""

import requests
import time

# CORRECT URL (note: ninjainflablepark - the Azure app name has a typo in it)
FIX_URL = "https://ninjainflablepark-gbhwbbdna5hjgvf9.centralindia-01.azurewebsites.net/api/v1/core/settings/fix_db_schema/"

print("=" * 60)
print("DATABASE MIGRATION TRIGGER SCRIPT")
print("=" * 60)
print(f"\nTargeting: {FIX_URL}")
print("\nAttempting to trigger database migration...")
print("This will fix the 'booking_number does not exist' errors.\n")

try:
    # Make the request with a timeout
    response = requests.get(FIX_URL, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}\n")
    
    if response.status_code == 200:
        print("✅ SUCCESS! Database migration triggered successfully!")
        print("\nNext steps:")
        print("1. Wait 10 seconds for migration to complete")
        print("2. Refresh your admin portal")
        print("3. All ProgrammingError messages should be gone")
    else:
        print(f"⚠️  Unexpected status code: {response.status_code}")
        print("The migration may have still run. Try refreshing your admin portal.")
        
except requests.exceptions.Timeout:
    print("⏱️  Request timed out (30 seconds)")
    print("The server might be slow. Try refreshing your admin portal in 1 minute.")
    
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection Error: {e}")
    print("\nPossible causes:")
    print("1. Azure server is still deploying")
    print("2. DNS hasn't propagated yet")
    print("3. Network connectivity issue")
    print("\nTry running this script again in 2 minutes.")
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
