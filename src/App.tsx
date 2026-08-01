import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import { ThemeProvider } from "./lib/theme";

/*
 * 작업 페이지는 라우트 단위로 쪼갠다. 홈에 들어온 사람이 GSAP·Motion·Embla·
 * three.js를 전부 내려받을 이유가 없다 — 각자 필요한 페이지에 들어갈 때 받는다.
 */
const KlangPage = lazy(() => import("./pages/klang/KlangPage"));
const KontaktPage = lazy(() => import("./pages/kontakt/KontaktPage"));
const AurumPage = lazy(() => import("./pages/aurum/AurumPage"));
const UmbraPage = lazy(() => import("./pages/umbra/UmbraPage"));
const NokturnPage = lazy(() => import("./pages/nokturn/NokturnPage"));

const TITLES: Record<string, string> = {
  "/work/klang": "KLANG Pro — 소음은 지우고, 소리만 남기다",
  "/work/kontakt": "KONTAKT ONE — Pain-free 100km",
  "/work/aurum": "AURUM Calibre 04 — 1초를 쪼개는 기계",
  "/work/umbra": "UMBRA GLIDE 01 — Engineered in the dark",
  "/work/nokturn": "NOKTURN — 제3회 서울 국제 심야 단편영화제",
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLES[pathname] ?? "AI Product Film Studio — Portfolio";
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      {/* 폴백은 배경색 한 판. 스피너를 넣으면 빠른 전환에서 오히려 깜빡인다. */}
      <Suspense fallback={<div style={{ minHeight: "100dvh", background: "var(--pf-paper)" }} />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/klang" element={<KlangPage />} />
          <Route path="/work/kontakt" element={<KontaktPage />} />
          <Route path="/work/aurum" element={<AurumPage />} />
          <Route path="/work/umbra" element={<UmbraPage />} />
          <Route path="/work/nokturn" element={<NokturnPage />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
