import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  /*
   * motion/lenis/embla를 나중에 설치했더니 dev에서 "Invalid hook call"이 났다.
   * 원인은 vite가 의존성을 뒤늦게 발견해 프리번들을 여러 세대로 나눠 내보내는
   * 것이었다 — 한 페이지가 서로 다른 ?v= 세대의 react-dom을 물면 React 인스턴스가
   * 갈린다. 아래 둘로 첫 패스에 전부 잡아 세대를 하나로 만든다.
   */
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react-router-dom",
      "motion/react",
      "lenis",
      "embla-carousel-react",
    ],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
  },
});
