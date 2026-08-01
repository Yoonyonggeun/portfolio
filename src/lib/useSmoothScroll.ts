import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
 * Lenis(관성 스크롤) + GSAP ScrollTrigger를 한 프레임 루프에 묶는다.
 *
 * 둘을 그냥 같이 쓰면 서로 다른 rAF에서 돌아서 pin/scrub이 한 프레임씩
 * 밀린다. 해결책은 Lenis의 자체 rAF를 끄고(autoRaf: false) gsap.ticker에
 * 태우는 것 — 그러면 스크롤 값 갱신과 트리거 업데이트가 같은 틱에 일어난다.
 *
 * prefers-reduced-motion이면 Lenis를 아예 붙이지 않는다. 관성 스크롤은
 * 전정기관에 부담을 주는 대표적인 효과라 끄는 게 맞다.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      // 지수 감쇠. 프레임레이트가 달라도 같은 느낌이 나온다.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // 터치는 브라우저 네이티브가 훨씬 낫다. 모바일에서 관성 스크롤을
      // 가로채면 스크롤이 끈적하게 느껴진다.
      syncTouch: false,
      autoRaf: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000); // gsap는 초, lenis는 ms
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // 해시 앵커는 Lenis가 가로채므로 직접 넘겨준다.
    const onAnchor = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!el) return;
      const id = el.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72 });
    };
    document.addEventListener("click", onAnchor);

    return () => {
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [enabled]);
}
