const fetch = require('node-fetch');

async function debugLoginFetch() {
    const email = 'myadmin@ninjapark.com';
    const password = 'admin123';

    // Exact logic from the admin.ts file
    const NEXT_PUBLIC_API_URL = "http://localhost:8000/api/v1"; // simulating env
    const targetUrl = `${(NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1').replace('/v1', '').replace('localhost', '127.0.0.1')}/token/`;

    console.log('--- Debugging Login Fetch ---');
    console.log('Target URL:', targetUrl);

    try {
        console.log('Attempting fetch...');
        const res = await fetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Match the exact payload in admin.ts
            body: JSON.stringify({ email, username: email, password }),
        });

        console.log('Response Status:', res.status);
        console.log('Response OK:', res.ok);

        if (!res.ok) {
            const text = await res.text();
            console.log('Error Text:', text);
        } else {
            const data = await res.json();
            console.log('Success! Token received (length):', data.access.length);
        }
    } catch (error) {
        console.error('FETCH FAILED:', error);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

debugLoginFetch();
