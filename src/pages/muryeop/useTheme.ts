import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export type Theme = "light" | "dark";

const KEY = "muryeop-theme";

type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function readInitial(): Theme {
  /* index.html의 인라인 부트스트랩이 이미 계산해둔 값. 첫 페인트와 어긋나면
     한 프레임 번쩍이므로 여기서 다시 계산하지 않고 그대로 받는다. */
  const boot = (window as unknown as { __muryeopTheme?: Theme }).__muryeopTheme;
  if (boot === "light" || boot === "dark") return boot;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/*
 * 07 전용 테마. data-theme과 color-scheme은 documentElement에 붙으므로
 * 언마운트에서 반드시 걷어낸다 — 안 그러면 뒤로 가기로 홈에 돌아갔을 때
 * 홈의 스크롤바만 어두운 채로 남는다.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitial);
  const knobRef = useRef<HTMLElement | null>(null);

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

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const doc = document as VTDocument;
    const knob = knobRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* 셋 중 하나라도 없으면 애니메이션 없이 색만 바꾼다. 전환이 실패해서
       테마가 안 바뀌는 것보다, 안 예쁘게라도 바뀌는 게 낫다. */
    if (!knob || reduce || typeof doc.startViewTransition !== "function") {
      setTheme(next);
      return;
    }

    /* flushSync가 없으면 React가 상태 갱신을 배칭해서, '이후' 스냅샷이
       옛 색으로 찍힌다. 원형 마스크가 돌아도 화면이 안 바뀐 것처럼 보인다. */
    const vt = doc.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    vt.ready
      .then(() => {
        const r = knob.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        /* 손잡이에서 화면 가장 먼 모서리까지 = 원이 화면을 다 덮는 반지름 */
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
            /* 불을 끄는 쪽이 더 무겁고 느리다. 방향마다 체감이 달라야
               토글이 스위치가 아니라 디밍 다이얼로 읽힌다. */
            duration: next === "dark" ? 520 : 420,
            easing:
              next === "dark"
                ? "cubic-bezier(0.32, 0.08, 0.24, 1)"
                : "cubic-bezier(0.16, 1, 0.3, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {
        /* 전환 중 다른 전환이 시작되면 ready가 reject된다. 색은 이미 바뀌었다. */
      });
  }, [theme]);

  return { theme, toggle, knobRef };
}
