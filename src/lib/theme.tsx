import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

/*
 * 테마: 심야(dark) ↔ 새벽(light).
 *
 * 전환은 View Transitions API의 원형 클립패스 확산으로 처리한다. 토글 버튼을
 * 누른 좌표에서 원이 퍼지면서 새 테마가 드러난다 — CSS 트랜지션으로는 흉내낼 수
 * 없는 효과다. 브라우저가 지원하지 않거나 prefers-reduced-motion이면 그냥 즉시
 * 바뀐다(기능은 동일하게 동작).
 *
 * 첫 페인트 FOUC는 index.html의 인라인 스크립트가 막는다. 여기서는 그 스크립트가
 * 이미 심어놓은 documentElement.dataset.theme을 그대로 읽어서 시작한다.
 */

export type Theme = "dark" | "light";

const STORAGE_KEY = "pf-theme";

type Ctx = {
  theme: Theme;
  /** 이벤트를 넘기면 그 좌표에서 원이 퍼진다. 없으면 화면 우상단 기준. */
  toggle: (origin?: { clientX: number; clientY: number }) => void;
  /**
   * 사용자가 아직 직접 고른 적이 없을 때만 테마를 강제한다.
   * 페이지 고유의 정체색이 있을 때 쓴다 (NOKTURN은 '심야'가 기본값이다).
   * 명시적 선택은 언제나 이긴다 — 저장도 하지 않는다.
   */
  suggest: (theme: Theme) => void;
};

const ThemeContext = createContext<Ctx | null>(null);

function readInitial(): Theme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark" || attr === "light") return attr;
  return "dark";
}

function paint(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* 사파리 프라이빗 모드 등 — 저장 실패해도 전환은 되어야 한다 */
  }
}

const REVEAL_MS = 640;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitial);

  // 사용자가 직접 고른 적이 없을 때만 OS 설정을 따라간다.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    if (stored === "dark" || stored === "light") return;

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const sync = () => {
      const next: Theme = mq.matches ? "light" : "dark";
      setTheme(next);
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const toggle = useCallback(
    (origin?: { clientX: number; clientY: number }) => {
      const next: Theme = theme === "dark" ? "light" : "dark";

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const canAnimate =
        typeof document.startViewTransition === "function" && !reduced;

      if (!canAnimate) {
        setTheme(next);
        paint(next);
        return;
      }

      const x = origin?.clientX ?? window.innerWidth - 56;
      const y = origin?.clientY ?? 56;
      // 클릭 지점에서 가장 먼 모서리까지의 거리 = 원이 화면을 다 덮는 반지름.
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );

      const transition = document.startViewTransition(() => {
        // flushSync가 없으면 스냅샷이 옛 DOM을 잡는다.
        flushSync(() => {
          setTheme(next);
          paint(next);
        });
      });

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: REVEAL_MS,
              easing: "cubic-bezier(0.22, 1, 0.36, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => {
          /* 전환이 중간에 스킵돼도 테마 자체는 이미 적용돼 있다 */
        });
    },
    [theme],
  );

  const suggest = useCallback((next: Theme) => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    if (stored === "dark" || stored === "light") return; // 사용자 선택이 우선
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, suggest }}>{children}</ThemeContext.Provider>
  );
}

/** 마운트되어 있는 동안 이 테마를 기본값으로 제안한다. */
export function useThemeDefault(theme: Theme) {
  const { suggest } = useTheme();
  useEffect(() => {
    suggest(theme);
  }, [suggest, theme]);
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
