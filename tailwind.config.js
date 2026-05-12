/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007AFF", // Example color, adjust to brand
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#5856D6",
          foreground: "#FFFFFF",
        },
        background: "#F2F2F7",
        foreground: "#000000",
      },
    },
  },
  plugins: [],
};
