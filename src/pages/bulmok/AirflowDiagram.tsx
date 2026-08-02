/*
 * 이중연소 공기 유로 종단면.
 *
 * 이 컷만 AI 렌더로 못 만들었다. "반으로 잘라 단면을 보여줘"를 두 번
 * 시도했는데 모델이 매번 '앞판을 뺀 상태'를 냈다 — 잘린 면이 아니라
 * 열린 면이다. 06에서 세운 원칙("렌더에 글자를 넣지 않고 도해는 코드로")을
 * 그대로 적용해 직접 그렸다. 결과적으로 이쪽이 낫다: 2KB고, 확장 모드에서
 * 공기가 실제로 흐르고, 어느 배율에서도 선이 뭉개지지 않는다.
 *
 * 좌표는 렌더의 사다리꼴 실루엣(위가 넓고 아래가 좁다)을 따랐다.
 */
export default function AirflowDiagram() {
  /* 외벽 / 내벽 — 사이의 빈 틈이 예열 통로다 */
  const outer = "M108 66 L432 66 L398 288 L142 288 Z";
  const inner = "M130 66 L410 66 L380 272 L160 272 Z";

  /* 2차 연소구. 내벽 상단에 Ø4 × 24개 — 도해에서는 한쪽 열만 보인다. */
  const jets = Array.from({ length: 11 }, (_, i) => 146 + i * 24.8);

  return (
    <svg viewBox="0 0 540 360" role="img" aria-labelledby="bm-dia-t bm-dia-d">
      <title id="bm-dia-t">불목 S1 이중벽 공기 유로 종단면</title>
      <desc id="bm-dia-d">
        바닥 틈으로 들어온 찬 공기가 외벽과 내벽 사이를 타고 올라가며 데워지고, 내벽 상단의
        구멍 24개로 챔버 안에 뿜어져 나와 1차 연소에서 미처 타지 못한 연기를 다시 태운다.
      </desc>

      <defs>
        <linearGradient id="bm-pre" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#8e9bb5" />
          <stop offset="1" stopColor="#6d86e8" />
        </linearGradient>
        <linearGradient id="bm-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#c0603a" />
          <stop offset="1" stopColor="#c0603a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 챔버 안쪽 바닥 — 1차 연소 */}
      <path d="M162 270 L378 270 L378 218 L162 218 Z" fill="url(#bm-core)" opacity="0.5" />

      {/* 벽 두 장. 사이의 흰 틈이 통로다. */}
      <path d={outer} fill="none" stroke="#191713" strokeWidth="3" />
      <path d={inner} fill="none" stroke="#191713" strokeWidth="3" />

      {/* 바닥판 + 다리 */}
      <path d="M142 288 L398 288" stroke="#191713" strokeWidth="3" fill="none" />
      <path
        d="M158 288 L152 322 M382 288 L388 322"
        stroke="#191713"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* 2차 연소구 */}
      {jets.map((x) => (
        <circle key={x} cx={x} cy="84" r="3.4" fill="#191713" />
      ))}

      {/* ① 흡기 — 바닥 틈으로 찬 공기가 들어온다 */}
      <path
        className="bm-flow"
        d="M40 300 L110 300 L124 288"
        fill="none"
        stroke="#8e9bb5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="bm-flow"
        d="M500 300 L430 300 L416 288"
        fill="none"
        stroke="#8e9bb5"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ② 예열 — 두 벽 사이를 타고 오르며 데워진다 */}
      <path
        className="bm-flow"
        d="M134 282 L120 78"
        fill="none"
        stroke="url(#bm-pre)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        className="bm-flow"
        d="M406 282 L420 78"
        fill="none"
        stroke="url(#bm-pre)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* ③ 2차 연소 — 구멍에서 챔버 안으로 뿜어져 나온다 */}
      {jets.map((x, i) => (
        <path
          key={x}
          className="bm-flow"
          d={`M${x} 92 L${x + (i < 5 ? 9 : i > 5 ? -9 : 0)} 118`}
          fill="none"
          stroke="#6d86e8"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ))}

      {/* ④ 1차 연소 — 아래에서 타는 불 */}
      <path
        d="M244 268 C238 236 262 232 258 208 C276 224 286 246 278 268 Z
           M282 268 C280 246 296 240 294 224 C306 238 310 254 304 268 Z"
        fill="#c0603a"
        opacity="0.85"
      />

      {/* 번호 마커 — 아래 범례와 짝이 맞는다 */}
      {(
        [
          [62, 300, "1"],
          [104, 176, "2"],
          [270, 132, "3"],
          [270, 288, "4"],
        ] as const
      ).map(([cx, cy, n]) => (
        <g key={n}>
          <circle cx={cx} cy={cy} r="11" fill="#191713" />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#fff"
            fontSize="12"
            fontFamily="DM Mono, monospace"
          >
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}
