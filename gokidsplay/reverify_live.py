import requests

API_URL = 'https://spinpin-backend-cfgcejczfpgyabd7.centralus-01.azurewebsites.net/api/v1'

def reverify_stuck_payments():
    # IDs from the screenshot that are stuck
    payment_ids = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6]
    
    print('Fetching payment details from live site...')
    for pid in payment_ids:
        print(f'Checking Payment #{pid}...')
        res = requests.get(f'{API_URL}/payments/{pid}/')
        
        if not res.ok:
            print(f'  -> Failed to fetch payment #{pid}: {res.status_code}')
            continue
            
        payment = res.json()
        if payment.get('status') in ('CREATED', 'PENDING', 'PENDING_PAYMENT') and payment.get('provider', '').upper() == 'SUMUP':
            order_id = payment.get('order_id')
            print(f"  -> Re-verifying Order ID: {order_id}...")
            
            reverify_res = requests.post(f'{API_URL}/payments/reverify/{order_id}/')
            if reverify_res.ok:
                print(f"  -> Success: {reverify_res.json()}")
            else:
                print(f"  -> Failed: {reverify_res.text}")
        else:
            print(f"  -> Status is {payment.get('status')}, Provider is {payment.get('provider')}. Skipping.")

if __name__ == '__main__':
    reverify_stuck_payments()
