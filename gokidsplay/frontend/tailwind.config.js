/** @type {import('tailwindcss').Config} */
const sharedConfig = require("@repo/config/tailwind.config");

module.exports = {
    ...sharedConfig,
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./features/**/*.{js,ts,jsx,tsx,mdx}",
        "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        ...sharedConfig.theme,
        extend: {
            ...sharedConfig.theme?.extend,
            colors: {
                ...sharedConfig.theme?.extend?.colors,
                // Go Kids Play brand overrides
                primary: {
                    DEFAULT: "#ccff00", // Neon Lime
                    foreground: "#000000",
                    light: "#e5ff66",
                    dark: "#99cc00",
                },
                secondary: {
                    DEFAULT: "#00f0ff", // Neon Cyan
                    foreground: "#000000",
                    light: "#5cffff",
                    dark: "#00b8cc",
                },
                accent: {
                    DEFAULT: "#ff0099", // Neon Pink
                    foreground: "#ffffff",
                    light: "#ff66cc",
                    dark: "#cc007a",
                },
                background: {
                    DEFAULT: "#1A0B2E",
                    light: "#2D1B4E",
                    dark: "#0D0518",
                    paper: "#251042",
                },
                surface: {
                    50: "#F5F3FF",
                    100: "#EDE9FE",
                    200: "#DDD6FE",
                    300: "#C4B5FD",
                    400: "#A78BFA",
                    500: "#8B5CF6",
                    600: "#7C3AED",
                    700: "#6D28D9",
                    800: "#5B21B6",
                    900: "#4C1D95",
                },
                success: "#00FF94",
                warning: "#FFD600",
                error: "#FF0055",
                info: "#00F0FF",
            },
            fontFamily: {
                display: ["Outfit", "'Fredoka'", "sans-serif"],
                body: ["DM Sans", "sans-serif"],
                fun: ["Fredoka", "cursive"],
                sans: ["DM Sans", "sans-serif"],
            },
        },
    },
};
