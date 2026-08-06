import nextPlugin from "@next/eslint-plugin-next";
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  {
    plugins: {
      "@next/next": nextPlugin,
      "react-compiler": reactCompiler,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-compiler/react-compiler": "error",
    },
  },
];
