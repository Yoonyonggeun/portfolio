import { useId, useMemo, useState } from "react";
import { BREWS, CLICK_MAX, CLICK_UM } from "./data";

/*
 * DETAIL B — 분쇄실 종단면.
 *
 * 처음엔 빗금 친 평행사변형 둘 사이에 치수선 하나를 놓았다. 기계를 아는
 * 사람에게만 읽히는 그림이었다. 07 무렵에서 얻은 교훈 — 컨셉을 설명하는
 * 도식보다 일어나는 일을 그대로 보여주는 편이 훨씬 세다 — 을 여기서 다시
 * 밟았다. 그래서 다시 그렸다:
 *
 *   위에서 원두가 들어가고 → 이가 난 두 면 사이가 아래로 갈수록 좁아지고
 *   → 그 끝의 틈만큼 굵은 알갱이가 떨어진다.
 *
 * 다이얼을 돌리면 바뀌는 게 수치가 아니라 **나오는 알갱이의 굵기**다.
 *
 * 축척은 하나만 정직하면 된다. 떨어지는 알갱이의 지름은 그 위 틈과 같은
 * 축척으로 그린다. 원두 알까지 같이 그리면(지름 6mm ≈ 틈의 100배 이상)
 * 한 프레임에 둘 다 정직하게 담을 수 없어 원두는 화살표로만 표시한다.
 *
 * 부품 이름은 지시선으로 빼지 않고 단면 안에 직접 얹었다. 화면이 위아래로
 * 꽉 차 있어 지시선을 빼면 라벨이 반대쪽 부품 위에 올라앉는다.
 */

const W = 620;
const H = 420;
const CX = 310;
const Y_TOP = 62;
const Y_EXIT = 252;
/** 통로 입구의 한쪽 폭 */
const MOUTH = 148;
/** 수쇠 바닥의 반지름 */
const CONE_R = 56;
/** 수쇠 꼭대기의 반지름 */
const CONE_TOP = 10;
/** 2,250μm(최대)일 때 틈의 픽셀 폭 */
const GAP_PX_MAX = 44;
const PX_PER_UM = GAP_PX_MAX / (CLICK_MAX * CLICK_UM);
const TEETH = 13;

/** 고정 난수. 매 렌더 흔들리면 안 되므로 인덱스에서 만든다. */
const rnd = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * 이가 난 모선. 실제 버는 입구 쪽 이가 굵고 출구로 갈수록 잘아진다 —
 * 원두를 한 번에 자르는 게 아니라 단계적으로 부수기 때문이다.
 *
 * 이는 면 밖으로 튀어나오지 않고 **몸통 안쪽으로 파인다.** 실제 버의 이가
 * 그렇고, 그래야 0μm에서 두 면이 정확히 맞물린다 — 양쪽에서 튀어나오게
 * 그리면 틈이 좁을 때 두 부품이 서로를 파고든 그림이 된다.
 */
function toothed(x1: number, y1: number, x2: number, y2: number, sign: 1 | -1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (dy / len) * sign;
  const ny = (-dx / len) * sign;
  const pts: string[] = [];
  for (let i = 0; i <= TEETH * 2; i++) {
    const u = i / (TEETH * 2);
    const amp = i % 2 === 1 ? 8.5 - u * 5.2 : 0;
    pts.push(`${(x1 + dx * u + nx * amp).toFixed(1)} ${(y1 + dy * u + ny * amp).toFixed(1)}`);
  }
  return pts;
}

export default function DetailGap() {
  const [clicks, setClicks] = useState(32);
  const uid = useId();
  const um = clicks * CLICK_UM;
  const gap = um * PX_PER_UM;

  const brew = useMemo(() => {
    let best = BREWS[0];
    for (const b of BREWS) {
      if (Math.abs(b.clicks - clicks) < Math.abs(best.clicks - clicks)) best = b;
    }
    return best;
  }, [clicks]);

  /*
   * 나온 분쇄물. 지름은 지나온 틈보다 조금 작다. 자리는 흔들린 격자로
   * 잡는다 — 순수 난수는 뭉쳐서 굵기 비교가 안 된다.
   */
  const grains = useMemo(() => {
    const r = gap * 0.42;
    if (r < 0.5) return [];
    const n = Math.max(9, Math.min(80, Math.round(2400 / (r * r + 3))));
    const cols = Math.max(3, Math.ceil(Math.sqrt(n * 2.1)));
    const rows = Math.ceil(n / cols);
    const bw = 224;
    const bh = 96;
    return Array.from({ length: n }, (_, i) => {
      const cxi = i % cols;
      const cyi = Math.floor(i / cols);
      return {
        x: CX - bw / 2 + ((cxi + 0.5) / cols) * bw + (rnd(i, 1) - 0.5) * (bw / cols) * 0.8,
        y: Y_EXIT + 40 + ((cyi + 0.5) / rows) * bh + (rnd(i, 2) - 0.5) * (bh / rows) * 0.8,
        r: r * (0.76 + rnd(i, 4) * 0.42),
      };
    });
  }, [gap]);

  /* 통로: 입구는 넓고, 출구는 다이얼이 정한 틈이다 */
  const cone = [
    `M${CX - CONE_TOP} ${Y_TOP}`,
    `L${toothed(CX - CONE_TOP, Y_TOP, CX - CONE_R, Y_EXIT, 1).join(" L")}`,
    `L${CX + CONE_R} ${Y_EXIT}`,
    `L${toothed(CX + CONE_R, Y_EXIT, CX + CONE_TOP, Y_TOP, 1).join(" L")}`,
    "Z",
  ].join(" ");

  const ringL = [
    `M22 ${Y_TOP}`,
    `L${toothed(CX - MOUTH, Y_TOP, CX - CONE_R - gap, Y_EXIT, -1).join(" L")}`,
    `L22 ${Y_EXIT} Z`,
  ].join(" ");

  const ringR = [
    `M${W - 22} ${Y_TOP}`,
    `L${toothed(CX + MOUTH, Y_TOP, CX + CONE_R + gap, Y_EXIT, 1).join(" L")}`,
    `L${W - 22} ${Y_EXIT} Z`,
  ].join(" ");

  const xIn = CX + CONE_R;
  const xOut = CX + CONE_R + gap;
  const yDim = Y_EXIT + 24;
  const tight = gap < 36;

  return (
    <div className="jn-detail">
      <figure className="jn-detail-fig">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`버 간극 ${um}μm 단면`}>
          <defs>
            <marker
              id={`${uid}-a`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0 L10 5 L0 10 z" fill="var(--jn-blue)" />
            </marker>
            <pattern
              id={`${uid}-h`}
              width="8"
              height="8"
              patternTransform="rotate(45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--jn-dim)" strokeWidth="1.1" />
            </pattern>
            {/* 맞닿은 부품은 해칭 각을 반대로 준다. 도면의 관용구이자
                여기서는 수쇠와 암쇠를 한눈에 가르는 장치다. */}
            <pattern
              id={`${uid}-h2`}
              width="8"
              height="8"
              patternTransform="rotate(-45)"
              patternUnits="userSpaceOnUse"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--jn-dim)" strokeWidth="1.1" />
            </pattern>
          </defs>

          {/* 들어가는 쪽 — 원두는 수쇠 양옆의 통로로 떨어진다 */}
          <g className="jn-d-flow">
            <line x1={CX - 96} y1="12" x2={CX - 96} y2={Y_TOP - 6} markerEnd={`url(#${uid}-a)`} />
            <line x1={CX + 96} y1="12" x2={CX + 96} y2={Y_TOP - 6} markerEnd={`url(#${uid}-a)`} />
            <text x={CX} y="26" textAnchor="middle">
              원두
            </text>
          </g>

          {/* 암쇠 — 챔버에 물려 돌지 않는다 */}
          <g className="jn-d-solid">
            <path d={ringL} fill={`url(#${uid}-h)`} fillOpacity="0.55" />
            <path d={ringL} fill="none" />
            <path d={ringR} fill={`url(#${uid}-h)`} fillOpacity="0.55" />
            <path d={ringR} fill="none" />
          </g>

          {/* 수쇠 — 축에 물려 돌아간다 */}
          <g className="jn-d-solid">
            <path d={cone} fill={`url(#${uid}-h2)`} fillOpacity="0.55" />
            <path d={cone} fill="none" />
          </g>

          {/* 이름은 단면 안에 직접 얹는다 */}
          <g className="jn-d-inplace">
            <text x={CX} y={Y_EXIT - 40} textAnchor="middle">
              수쇠
            </text>
            <text x={CX} y={Y_EXIT - 24} textAnchor="middle" className="jn-d-sub">
              돌아간다
            </text>
            <text x={CX + 214} y={Y_TOP + 74} textAnchor="middle">
              암쇠
            </text>
            <text x={CX + 214} y={Y_TOP + 90} textAnchor="middle" className="jn-d-sub">
              돌지 않는다
            </text>
          </g>

          {/* 나오는 쪽 — 틈이 벌어진 만큼 굵어진다 */}
          <g className="jn-d-grain">
            {grains.map((g, i) => (
              <circle key={i} cx={g.x.toFixed(1)} cy={g.y.toFixed(1)} r={g.r.toFixed(2)} />
            ))}
          </g>

          {/* 출구 치수 — 값이 작을 땐 화살표를 바깥으로 뺀다 */}
          <g className="jn-d-dim">
            <line x1={xIn} y1={Y_EXIT + 2} x2={xIn} y2={yDim + 7} />
            <line x1={xOut} y1={Y_EXIT + 2} x2={xOut} y2={yDim + 7} />
            {um > 0 &&
              (tight ? (
                <>
                  <line x1={xIn - 28} y1={yDim} x2={xIn} y2={yDim} markerStart={`url(#${uid}-a)`} />
                  <line
                    x1={xOut + 28}
                    y1={yDim}
                    x2={xOut}
                    y2={yDim}
                    markerStart={`url(#${uid}-a)`}
                  />
                </>
              ) : (
                <line
                  x1={xIn}
                  y1={yDim}
                  x2={xOut}
                  y2={yDim}
                  markerStart={`url(#${uid}-a)`}
                  markerEnd={`url(#${uid}-a)`}
                />
              ))}
            {um > 0 ? (
              <text x={xOut + (tight ? 36 : 12)} y={yDim + 5}>
                {um.toLocaleString()}μm
              </text>
            ) : (
              <text x={CX} y={yDim + 30} textAnchor="middle">
                0μm · 두 면이 닿아 아무것도 안 나온다
              </text>
            )}
          </g>

          <text className="jn-d-scale" x={W - 10} y={H - 10} textAnchor="end">
            SECTION · 분쇄실
          </text>
        </svg>
      </figure>

      <div className="jn-detail-ctl">
        <p className="jn-detail-read">
          <b>{clicks}</b>
          <span>클릭</span>
          <em>{um.toLocaleString()}μm</em>
        </p>
        <p className="jn-detail-feel">{brew.grind}</p>

        <input
          type="range"
          min={0}
          max={CLICK_MAX}
          value={clicks}
          onChange={(e) => setClicks(Number(e.target.value))}
          aria-label="클릭 수"
        />

        <div className="jn-brews">
          {BREWS.map((b) => (
            <button
              key={b.id}
              type="button"
              className={`jn-brew${clicks === b.clicks ? " is-on" : ""}`}
              onClick={() => setClicks(b.clicks)}
            >
              {b.label}
              <em>{b.clicks}</em>
            </button>
          ))}
        </div>

        <p className="jn-detail-note">
          다이얼 한 칸이 축을 {CLICK_UM}μm 들어 올린다. 머리카락 굵기가 70μm 안팎이니 세
          칸이 머리카락 한 올이다. 나오는 굵기가 손끝으로 세어지는 값에 묶여 있으니,
          어제 맛있었던 잔을 오늘 같은 숫자로 다시 만들 수 있다.
        </p>
      </div>
    </div>
  );
}
