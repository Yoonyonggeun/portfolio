import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import KlangPage from "./pages/klang/KlangPage";
import KontaktPage from "./pages/kontakt/KontaktPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      pathname === "/work/klang"
        ? "KLANG Pro — 소음은 지우고, 소리만 남기다"
        : pathname === "/work/kontakt"
          ? "KONTAKT ONE — Pain-free 100km"
          : "AI Product Film Studio — Portfolio";
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/klang" element={<KlangPage />} />
        <Route path="/work/kontakt" element={<KontaktPage />} />
      </Routes>
    </>
  );
}
