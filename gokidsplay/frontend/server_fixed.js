// Azure App Service startup wrapper for Next.js standalone
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 8080;

console.log('Starting Next.js server on port', PORT);
console.log('Current directory:', __dirname);

// Start the Next.js standalone server
const server = spawn('node', [path.join(__dirname, '.next/standalone/frontend/server.js')], {
    env: { ...process.env, PORT },
    stdio: 'inherit'
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

server.on('exit', (code) => {
    console.log('Server exited with code:', code);
    process.exit(code);
});
