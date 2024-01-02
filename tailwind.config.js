module.exports = {
  mode: "jit",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "th-bkg-1": "#141026",
        "th-fgd-1": "#E5E3EC",
      },
    },
  },
  plugins: [],
};
