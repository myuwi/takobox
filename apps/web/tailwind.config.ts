import { type Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
      },
      colors: {
        primary: "#FBBE74",
      },
    },
  },
  plugins: [forms({ strategy: "base" })],
} satisfies Config;
