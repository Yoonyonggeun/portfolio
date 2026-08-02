import type { Theme } from "./useTheme";

/*
 * 해 ↔ 달 모프. 아이콘을 크로스페이드하지 않고 도형 하나를 변형시킨다:
 *  - 가운데 원의 반지름이 줄었다 늘었다 하고
 *  - 오른쪽 위의 마스크 원이 안으로 파고들어 초승달을 깎아내고
 *  - 광선 8개가 회전하며 스케일 0으로 접힌다
 * 전부 SVG 속성 트랜지션이라 별도 라이브러리가 필요 없고, 테마 전환의
 * 원형 확산(View Transition)과 같은 이징을 써서 한 몸처럼 움직인다.
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Props = {
  theme: Theme;
  onToggle: (origin: { clientX: number; clientY: number }) => void;
  className?: string;
};

export default function ThemeToggle({ theme, onToggle, className = "" }: Props) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`nk-themebtn ${className}`}
      // aria-pressed가 아니라 label로 상태를 말해준다 — 스크린리더에서
      // "눌림/안눌림"보다 "새벽으로 전환"이 훨씬 명확하다.
      aria-label={isDark ? "새벽 모드로 전환" : "심야 모드로 전환"}
      title={isDark ? "새벽 모드" : "심야 모드"}
      onClick={(e) => onToggle({ clientX: e.clientX, clientY: e.clientY })}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <mask id="nk-moon-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle
            cx={isDark ? 17 : 30}
            cy={isDark ? 7 : -6}
            r="9"
            fill="black"
            style={{ transition: `cx 620ms ${EASE}, cy 620ms ${EASE}` }}
          />
        </mask>

        <circle
          cx="12"
          cy="12"
          r={isDark ? 9 : 5.5}
          fill="currentColor"
          mask="url(#nk-moon-mask)"
          style={{ transition: `r 620ms ${EASE}` }}
        />

        <g
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          style={{
            transformOrigin: "12px 12px",
            transform: isDark ? "rotate(-25deg) scale(0)" : "rotate(0deg) scale(1)",
            opacity: isDark ? 0 : 1,
            transition: `transform 620ms ${EASE}, opacity 380ms ${EASE}`,
          }}
        >
          <line x1="12" y1="1.6" x2="12" y2="3.6" />
          <line x1="12" y1="20.4" x2="12" y2="22.4" />
          <line x1="1.6" y1="12" x2="3.6" y2="12" />
          <line x1="20.4" y1="12" x2="22.4" y2="12" />
          <line x1="4.6" y1="4.6" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.4" y2="19.4" />
          <line x1="19.4" y1="4.6" x2="18" y2="6" />
          <line x1="6" y1="18" x2="4.6" y2="19.4" />
        </g>
      </svg>
      <span className="nk-themebtn-label">{isDark ? "심야" : "새벽"}</span>
    </button>
  );
}
