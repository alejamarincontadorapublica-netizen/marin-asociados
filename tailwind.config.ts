import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ma: {
          negro:         "#1A1814",
          "negro-sidebar":"#211E19",
          "negro-hover": "#2A261F",
          dorado:        "#C0A36B",
          "dorado-texto":"#9A7223",
          "dorado-oscuro":"#6B4F2A",
          crema:         "#FAF8F4",
          blanco:        "#FFFFFF",
          "crema-suave": "#FDFBF7",
          borde:         "#E8E1D4",
          "borde-suave": "#EFEADF",
          texto:         "#1A1814",
          "texto-2":     "#2A2620",
          "texto-mute":  "#9A9281",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        sans:  ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
