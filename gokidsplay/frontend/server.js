// Azure App Service - Next.js Standalone Startup
// Directly requires the Next.js server in-process (no child spawn needed)

const path = require('path');

const PORT = process.env.PORT || '8080';

process.env.PORT = PORT;
process.env.HOSTNAME = '0.0.0.0';

console.log('=== Azure Next.js Standalone Startup ===');
console.log('PORT:', PORT);
console.log('Working directory:', __dirname);
console.log('Node version:', process.version);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET');

// Path to Next.js standalone server
const standaloneServerPath = path.join(__dirname, '.next', 'standalone', 'frontend', 'server.js');
console.log('Loading Next.js from:', standaloneServerPath);

try {
    require(standaloneServerPath);
    console.log('✅ Next.js server loaded successfully');
} catch (err) {
    console.error('❌ Failed to load Next.js server:', err);
    process.exit(1);
}
