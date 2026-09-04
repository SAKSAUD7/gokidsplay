const sharedConfig = require("@repo/config/tailwind.config");

module.exports = {
    ...sharedConfig,
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
};
