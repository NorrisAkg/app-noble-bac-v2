/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            DEFAULT: '#3DBE45',
            dark: '#2EA037',
            soft: '#EAF7EB',
          },
          salmon: {
            DEFAULT: '#E8A090',
            dark: '#D38576',
            soft: '#FBEDE8',
          },
          ink: {
            DEFAULT: '#1A2027',
            medium: '#5A6470',
            light: '#9AA3AC',
          },
          danger: {
            DEFAULT: '#E14B36',
            soft: '#FCE9E5',
          },
          warning: {
            DEFAULT: '#FFB800',
            soft: '#FFF6E0',
          },
          info: {
            DEFAULT: '#3D7BBE',
            soft: '#E8F1FB',
          },
          premium: '#FFC857',
          tomato: '#E8624C',
          handle: '#D5DAE0',
          muted: '#EEF1F4',
        },
        primary: {
          DEFAULT: "#3DBE45",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E8A090",
          foreground: "#FFFFFF",
        },
        background: "#F5F5F5",
        line: "#E6E8EB",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
        "poppins-extrabold": ["Poppins_800ExtraBold"],
        "poppins-black": ["Poppins_900Black"],
      },
    },
  },
  plugins: [],
};
