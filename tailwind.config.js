/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        press: ['"Press Start 2P"', "monospace"],
        pixel: ['"Pixelify Sans"', "sans-serif"],
        vt: ["VT323", "monospace"],
      },
      colors: {
        ink: "#241436",
        deepink: "#17102a",
        cream: "#fdf3dd",
        lavender: "#b8a8dd",
        muted: "#8f83ad",
        action: "#f08a4b",
        actionhover: "#ff9d5c",
        highlight: "#ffb066",
        teamblue: "#7db8ff",
        teamcoral: "#ff7a9e",
        cardart: "#3d2a63",
      },
    },
  },
  plugins: [],
};
