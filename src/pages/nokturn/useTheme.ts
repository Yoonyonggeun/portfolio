import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Theme = "dark" | "light";

const KEY = "nokturn-theme";

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function readInitial(): Theme {
  /* index.html의 인라인 부트스트랩이 이미 계산해둔 값. 첫 페인트와 어긋나면
     한 프레임 번쩍이므로 여기서 다시 계산하지 않고 그대로 받는다. */
  const boot = (window as unknown as { __nokturnTheme?: Theme }).__nokturnTheme;
  if (boot === "light" || boot === "dark") return boot;
  return "dark";
}

/*
 * 08 전용 테마: 심야(dark) ↔ 새벽(light).
 *
 * 07(무렵)과 같은 구조다 — data-theme·color-scheme은 documentElement에
 * 붙으므로 언마운트에서 반드시 걷어낸다. 안 그러면 뒤로 가기로 홈에 돌아갔을
 * 때 명도가 고정된 나머지 페이지들의 스크롤바만 어두운 채로 남는다.
 *
 * 다만 기본값이 다르다. 무렵은 OS 설정을 따라가지만, 이 영화제는 밤 10시에
 * 시작한다 — 아무것도 고른 적이 없으면 '심야'로 여는 게 맞다. 사용자가 한 번
 * 고르면 그 선택이 언제나 이긴다.
 *
 * 전환은 View Transitions API의 원형 클립패스 확산으로 처리한다. 누른 좌표에서
 * 원이 퍼지면서 새 테마가 드러난다 — CSS 트랜지션으로는 흉내낼 수 없다.
 * 지원하지 않거나 prefers-reduced-motion이면 색만 즉시 바뀐다.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitial);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* 저장 실패는 무시한다. 이번 세션 동안만 유지되면 된다. */
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      const root = document.documentElement;
      delete root.dataset.theme;
      root.style.colorScheme = "";
    };
  }, []);

  /** 이벤트를 넘기면 그 좌표에서 원이 퍼진다. 없으면 화면 우상단 기준. */
  const toggle = useCallback(
    (origin?: { clientX: number; clientY: number }) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const doc = document as VTDocument;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      /* 전환이 안 되는 것보다, 안 예쁘게라도 바뀌는 게 낫다. */
      if (reduce || typeof doc.startViewTransition !== "function") {
        setTheme(next);
        return;
      }

      const x = origin?.clientX ?? window.innerWidth - 56;
      const y = origin?.clientY ?? 56;

      /* flushSync가 없으면 React가 상태 갱신을 배칭해서 '이후' 스냅샷이
         옛 색으로 찍힌다. 원이 퍼져도 화면이 안 바뀐 것처럼 보인다. */
      const vt = doc.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });

      vt.ready
        .then(() => {
          /* 누른 지점에서 가장 먼 모서리까지 = 원이 화면을 다 덮는 반지름 */
          const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y),
          );

          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 640,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => {
          /* 전환 중 다른 전환이 시작되면 ready가 reject된다. 색은 이미 바뀌었다. */
        });
    },
    [theme],
  );

  return { theme, toggle };
}
