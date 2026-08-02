import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";

/*
 * 홈이 첫 진입점이라 초기 번들에 프로젝트 페이지를 싣지 않는다.
 * 홈만 정적, 나머지 여덟은 라우트 진입 시 받는다 — 홈에 들어온 사람이
 * GSAP·Motion·Embla·three.js를 전부 내려받을 이유가 없다.
 */
const KlangPage = lazy(() => import("./pages/klang/KlangPage"));
const KontaktPage = lazy(() => import("./pages/kontakt/KontaktPage"));
const AurumPage = lazy(() => import("./pages/aurum/AurumPage"));
const UmbraPage = lazy(() => import("./pages/umbra/UmbraPage"));
const JeongbonPage = lazy(() => import("./pages/jeongbon/JeongbonPage"));
const MeridianPage = lazy(() => import("./pages/meridian/MeridianPage"));
const MuryeopPage = lazy(() => import("./pages/muryeop/MuryeopPage"));
const NokturnPage = lazy(() => import("./pages/nokturn/NokturnPage"));
const BulmokPage = lazy(() => import("./pages/bulmok/BulmokPage"));
const SeokriPage = lazy(() => import("./pages/seokri/SeokriPage"));
const JungsoePage = lazy(() => import("./pages/jungsoe/JungsoePage"));

const TITLES: Record<string, string> = {
  "/work/klang": "KLANG Pro — 소음은 지우고, 소리만 남기다",
  "/work/kontakt": "KONTAKT ONE — Pain-free 100km",
  "/work/aurum": "AURUM Calibre 04 — 1초를 쪼개는 기계",
  "/work/umbra": "UMBRA GLIDE 01 — Engineered in the dark",
  "/work/jeongbon": "정본치과의원 — 치료 전에 비용과 기간을 먼저 드립니다",
  "/work/meridian": "MERIDIAN FLUID — Series FK-9 flow control",
  "/work/muryeop": "무렵 01 — 어두워질수록, 따뜻해집니다",
  "/work/nokturn": "NOKTURN — 제3회 서울 국제 심야 단편영화제",
  "/work/bulmok": "불목 S1 — 접으면 봉투 두께, 펴면 연기가 없는 불",
  "/work/seokri": "석리 石理 — 표면이 아니라 잘린 면을 봅니다",
  "/work/jungsoe": "중쇠 48 — 축이 흔들리면 입자가 흔들린다",
};

const HOME_TITLE = "PRODUCT FILM — 부수지 않고, 속을 보여준다";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = TITLES[pathname] ?? HOME_TITLE;
  }, [pathname]);
  return null;
}

/* 청크를 받는 동안의 빈 화면. 배경만 깔아 흰 번쩍임을 막는다. */
function RouteFallback() {
  return <div style={{ minHeight: "100dvh", background: "#17191c" }} />;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/klang" element={<KlangPage />} />
          <Route path="/work/kontakt" element={<KontaktPage />} />
          <Route path="/work/aurum" element={<AurumPage />} />
          <Route path="/work/umbra" element={<UmbraPage />} />
          <Route path="/work/jeongbon" element={<JeongbonPage />} />
          <Route path="/work/meridian" element={<MeridianPage />} />
          <Route path="/work/muryeop" element={<MuryeopPage />} />
          <Route path="/work/nokturn" element={<NokturnPage />} />
          <Route path="/work/bulmok" element={<BulmokPage />} />
          <Route path="/work/seokri" element={<SeokriPage />} />
          <Route path="/work/jungsoe" element={<JungsoePage />} />
        </Routes>
      </Suspense>
    </>
  );
}
