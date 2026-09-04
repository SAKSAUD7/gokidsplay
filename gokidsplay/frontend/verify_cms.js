const fetch = require('node-fetch');

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

async function checkEndpoint(name, path) {
    console.log(`Checking ${name}...`);
    try {
        const res = await fetch(`${BASE_URL}${path}`);
        console.log(`  Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : (data.results ? data.results.length : Object.keys(data).length);
            console.log(`  Data: OK (Items: ${count})`);
            return true;
        } else {
            console.log(`  FAILED: ${res.statusText}`);
            return false;
        }
    } catch (e) {
        console.log(`  ERROR: ${e.message}`);
        return false;
    }
}

async function verify() {
    console.log('--- CMS Verification ---');
    await checkEndpoint('Contact Info', '/cms/contactinfo/');
    await checkEndpoint('Global Settings', '/core/settings/');
    await checkEndpoint('Home Page', '/cms/page-sections/?page=home');
    await checkEndpoint('Attractions', '/cms/page-sections/?page=attractions');
}

verify();
