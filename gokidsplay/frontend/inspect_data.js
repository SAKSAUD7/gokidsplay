const fetch = require('node-fetch');

async function dumpHomeData() {
    const url = 'http://127.0.0.1:8000/api/v1/cms/page-sections/?page=home';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error(`Status: ${res.status} ${res.statusText}`);
            console.error(await res.text());
            return;
        }
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

dumpHomeData();
