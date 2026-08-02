import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BONDS,
  DOWNLOADS,
  FACETS,
  GROUTS,
  KELVIN,
  MATERIALS,
  TECH,
  type FacetKey,
  type Material,
} from "./data";
import "./seokri.css";

/*
 * 석리 石理 / SEOKRI — 대형 포세린 슬래브 소재 라이브러리 (10)
 *
 * 09와 정면으로 반대인 편이다. 09는 고정 740px 한 컬럼에 인터랙션이 0인
 * 커머스 산출물이고, 이건 뷰포트 전폭을 쓰는 탐색 도구다.
 *
 * 06 MERIDIAN과 뭉뚱그려지지 않으려고 세 가지를 못 박았다:
 *   1. 훅이 '파라미터 → 수치표'(06)가 아니라 '파라미터 → 광학 변화'다. 수치 0.
 *   2. 모노 폰트를 한 글자도 쓰지 않는다(06의 뼈대가 IBM Plex Mono).
 *   3. 절단면을 척추로 세워 앞으로 끌어올리고 스펙·인증을 뒤로 밀었다.
 *
 * 소재 사진은 넉 장뿐이고 12개 품목·조명·줄눈·배열은 전부 CSS로 파생한다.
 * 같은 소재를 여러 각도로 찍으면 무늬 이음매가 컷마다 어긋나기 때문이다.
 */

const A = "/assets/seokri";

type Sel = Record<FacetKey, string[]>;
const EMPTY: Sel = { finish: [], tone: [], gauge: [], body: [] };

function match(m: Material, sel: Sel) {
  if (sel.finish.length && !sel.finish.includes(m.finish)) return false;
  if (sel.tone.length && !sel.tone.includes(m.tone)) return false;
  if (sel.gauge.length && !sel.gauge.some((g) => m.gauge.includes(Number(g)))) return false;
  if (sel.body.length) {
    const want = m.fullBody ? "관통무늬" : "표면 프린트";
    if (!sel.body.includes(want)) return false;
  }
  return true;
}

/*
 * 리빌. 05·06의 translateY도, 07의 clip-path 와이프도 아니다.
 * 스와치가 화면에 들어오면 저각 그레이징 상태에서 정상 조명으로 전이한다 —
 * 이동은 0px이고 광학만 움직인다. 소재 페이지에서 카드가 움직이면
 * 소재끼리 비교가 안 되기 때문이다.
 *
 * 07에서 배운 함정을 피한다: 열림 표시를 class가 아니라 data 속성에 단다.
 * className은 필터 상태에 따라 React가 통째로 다시 쓰므로 같이 지워진다.
 */
function useLight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cells = [...root.querySelectorAll<HTMLElement>(".sk-swatch")];
    const lit = (n: HTMLElement) => {
      n.dataset.lit = "";
    };
    if (!("IntersectionObserver" in window)) {
      cells.forEach(lit);
      return;
    }
    let io: IntersectionObserver;
    try {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            lit(e.target as HTMLElement);
            io.unobserve(e.target);
          }),
        { threshold: 0.15 },
      );
      cells.forEach((c) => io.observe(c));
    } catch {
      cells.forEach(lit);
      return;
    }
    /* 못 연 게 남으면 강제로 연다 — 어두운 채로 남으면 소재를 못 읽는다. */
    const safety = window.setTimeout(() => cells.forEach(lit), 1400);
    return () => {
      window.clearTimeout(safety);
      io.disconnect();
    };
  }, []);
  return ref;
}

export default function SeokriPage() {
  const [sel, setSel] = useState<Sel>(EMPTY);
  const [tray, setTray] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  const hits = useMemo(() => MATERIALS.filter((m) => match(m, sel)), [sel]);
  const detail = open ? MATERIALS.find((m) => m.code === open) : null;

  const toggle = (k: FacetKey, v: string) =>
    setSel((s) => ({
      ...s,
      [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v],
    }));

  const pickCompare = (code: string) =>
    setTray((t) =>
      t.includes(code) ? t.filter((x) => x !== code) : t.length >= 3 ? t : [...t, code],
    );

  const grid = useLight<HTMLDivElement>();
  const active = Object.values(sel).flat().length;

  return (
    <div className="sk-site sk-body">
      <header className="sk-top">
        <Link to="/" className="sk-back">
          ← Product Film
        </Link>
        <p className="sk-brand">
          <b>석리 石理</b>
          <i>SEOKRI</i>
        </p>
      </header>

      <div className="sk-shell">
        {/* ── 좌: 고정 필터 파사드 ─────────────────────────
            드롭다운이 아니라 축 이름 + 옵션이 전부 펼쳐진 체크리스트다.
            실측한 이 바닥의 공통 문법 그대로. */}
        <aside className="sk-facade" aria-label="소재 필터">
          <h2>Filter</h2>
          {FACETS.map((f) => (
            <div className="sk-axis" key={f.key}>
              <h3>{f.label}</h3>
              <ul>
                {f.options.map((o) => {
                  const on = sel[f.key].includes(o);
                  const n = MATERIALS.filter((m) =>
                    match(m, { ...sel, [f.key]: [o] }),
                  ).length;
                  return (
                    <li key={o}>
                      <button
                        className="sk-opt"
                        aria-pressed={on}
                        onClick={() => toggle(f.key, o)}
                      >
                        <span />
                        <span>
                          {o}
                          {f.key === "gauge" ? " mm" : ""}
                        </span>
                        <small>{n}</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {active > 0 && (
            <button className="sk-clear" onClick={() => setSel(EMPTY)}>
              필터 {active}개 해제
            </button>
          )}
        </aside>

        {/* ── 우 ────────────────────────────────────────── */}
        <main className="sk-main">
          {detail ? (
            <Detail m={detail} onBack={() => setOpen(null)} onCompare={pickCompare} />
          ) : (
            <>
              <section className="sk-hero">
                <h1>
                  표면은 카탈로그가 보여줍니다.
                  <br />
                  우리는 <em>잘린 면</em>을 보여줍니다.
                </h1>
                <p>
                  포세린 슬래브를 고를 때 실제로 갈리는 건 무늬가 아니라 그 무늬가 두께를
                  관통하는지입니다. 모서리를 갈고 마이터로 접는 순간 드러나기 때문입니다. 석리는
                  모든 품목의 절단면을 먼저 놓습니다.
                </p>
              </section>

              {/* 숫자 카운터 띠 — 이 바닥이 히어로 직하에 까는 실측 문법 */}
              <dl className="sk-count">
                <div>
                  <dt>Materials</dt>
                  <dd>{MATERIALS.length}</dd>
                </div>
                <div>
                  <dt>Finishes</dt>
                  <dd>3</dd>
                </div>
                <div>
                  <dt>Gauges</dt>
                  <dd>3</dd>
                </div>
                <div>
                  <dt>Full-body</dt>
                  <dd>{MATERIALS.filter((m) => m.fullBody).length}</dd>
                </div>
              </dl>

              <div className="sk-bar sk-ui">
                <span>
                  총 <b>{hits.length}</b>개 품목
                  {active > 0 && <> · 필터 {active}개 적용</>}
                </span>
                <span>비교는 최대 3개까지 담을 수 있습니다</span>
              </div>

              {/*
               * 필터에 안 걸린 카드도 자리를 지킨다. 채도만 빠진다.
               * 재배열하면 소재 간 위치 기억이 깨져 비교가 불가능해진다 —
               * 그래서 FLIP 재배치를 일부러 쓰지 않았다(08과 갈리는 지점).
               */}
              <div className="sk-grid" ref={grid}>
                {MATERIALS.map((m, i) => {
                  const off = !match(m, sel);
                  return (
                    <button
                      key={m.code}
                      className="sk-cell"
                      data-off={off ? 1 : 0}
                      disabled={off}
                      onClick={() => setOpen(m.code)}
                    >
                      <span
                        className="sk-swatch"
                        style={{ ["--sd" as string]: `${(i % 4) * 0.06}s` }}
                      >
                        <img
                          src={`${A}/${m.base}.webp`}
                          alt={`${m.ko} 표면 매크로`}
                          width={680}
                          height={680}
                          loading="lazy"
                          style={{ filter: m.tint }}
                        />
                      </span>
                      <span className="sk-cellmeta">
                        <b>{m.ko}</b>
                        <i>
                          {m.en} · {m.code}
                        </i>
                        <u>
                          {m.finish} · {m.size} · {m.gauge.join("·")} mm
                        </u>
                        <span className="sk-flag" data-b={m.fullBody ? 1 : 0}>
                          {m.fullBody ? "관통무늬" : "표면 프린트"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="sk-foot">
                포트폴리오용 자체 기획 컨셉입니다. 실존하는 브랜드·제품이 아니며 소재 이미지는
                전부 AI로 생성했습니다. 12개 품목은 촬영 매크로 4장에서 CSS로 파생한 것이고,
                시험 수치는 예시입니다.
              </p>
            </>
          )}
        </main>
      </div>

      {/* ── 비교 트레이 — 하단 상주, 최대 3 ───────────────── */}
      <div className="sk-tray sk-ui" data-open={tray.length ? "" : undefined}>
        <p>비교 {tray.length}/3</p>
        <ul>
          {tray.map((c) => {
            const m = MATERIALS.find((x) => x.code === c)!;
            return (
              <li key={c}>
                <button onClick={() => pickCompare(c)}>
                  <img src={`${A}/${m.base}.webp`} alt="" style={{ filter: m.tint }} />
                  {m.ko} ✕
                </button>
              </li>
            );
          })}
        </ul>
        <button className="sk-go">샘플 신청</button>
      </div>
    </div>
  );
}

/* ── 상세 뷰 — 그리드를 버리고 축을 뒤집는다 ────────────── */
function Detail({
  m,
  onBack,
  onCompare,
}: {
  m: Material;
  onBack: () => void;
  onCompare: (code: string) => void;
}) {
  /* 훅: 그레이징 라이트. 각도가 낮을수록 방향성 그라디언트가 강해진다. */
  const [angle, setAngle] = useState(18);
  const [kelvin, setKelvin] = useState(1);
  const [bond, setBond] = useState(1);
  const [grout, setGrout] = useState(0);

  /* 90°(정면광)에서 0, 0°(완전 그레이징)에서 1 */
  const graze = 1 - angle / 90;
  const k = KELVIN[kelvin];
  const b = BONDS[bond];
  const g = GROUTS[grout];

  return (
    <article className="sk-detail">
      <header className="sk-dhead">
        <button className="sk-dback" onClick={onBack}>
          ← 라이브러리로
        </button>
        <h1>
          {m.ko}
          <span>
            {m.en} · {m.code}
          </span>
        </h1>
      </header>

      <div className="sk-col">
        <p className="sk-eye">Definition</p>
        <h2>{m.note}</h2>
        <p>
          {m.finish} 마감 · {m.tone} 톤 · {m.size} mm · 두께 {m.gauge.join(" · ")} mm. 아래
          절단면이 이 품목의 분류를 결정합니다.
        </p>
      </div>

      {/* ── 절단면 — 이 편의 척추 ─────────────────────────
          업계 관행은 스펙·인증이 중반이지만, 그 순서를 따르면 06이 된다.
          그래서 절단면을 최상단으로 끌어올리고 스펙을 아래로 밀었다. */}
      <div className="sk-cut">
        <figure>
          <img
            src={`${A}/cut-body.webp`}
            alt="관통무늬 슬래브의 톱날 절단면. 무늬가 두께 전체를 지나간다."
            width={1200}
            height={670}
            loading="lazy"
          />
          <figcaption>
            <h3>
              관통무늬 — <em>결이 두께를 지나갑니다</em>
            </h3>
            <p>
              바디 전체에 안료와 골재가 들어갑니다. 모서리를 45°로 갈아도 같은 면이 나오고,
              사용 중 깨져도 흰 속이 드러나지 않습니다.
            </p>
          </figcaption>
        </figure>
        <figure>
          <img
            src={`${A}/cut-print.webp`}
            alt="표면 프린트 타일의 절단면. 얇은 무늬층 아래가 백색 바디다."
            width={1200}
            height={670}
            loading="lazy"
          />
          <figcaption>
            <h3>표면 프린트 — 무늬는 위 5%입니다</h3>
            <p>
              백색 바디 위에 무늬층과 유약을 얹습니다. 표현 폭이 넓고 값이 쌉니다. 대신 갈면
              흰 속이 나오므로 마이터 가공 부위에는 쓰지 않습니다.
            </p>
          </figcaption>
        </figure>
      </div>
      <p className="sk-cap">
        같은 배율·같은 프레이밍에서 찍은 두 장입니다. 이 품목은{" "}
        <b>{m.fullBody ? "왼쪽(관통무늬)" : "오른쪽(표면 프린트)"}</b>입니다.
      </p>

      {/* ── 훅: 그레이징 라이트 시뮬레이터 ────────────────
          06은 '선택 → 수치표'였다. 여기는 수치가 하나도 없고 광학만 바뀐다.
          마감재 바이어의 실제 1번 질문에 답하는 도구다. */}
      <section className="sk-sim">
        <div className="sk-col" style={{ paddingBottom: 0 }}>
          <p className="sk-eye">Grazing light</p>
          <h2>현장 조명에서도 이렇게 보이나요</h2>
          <p>
            소재 카탈로그의 사진은 전부 정면 확산광입니다. 실제 현장의 빛은 벽을 스쳐 지나가고,
            그때 표면 요철이 전혀 다르게 읽힙니다. 아래는 입사각과 색온도를 바꿔보는
            자리입니다 — <b>사진은 한 장이고 나머지는 전부 계산입니다.</b>
          </p>
        </div>

        <div
          className="sk-stage"
          style={{
            ["--sk-g" as string]: graze.toFixed(3),
            ["--sk-dir" as string]: `${100 - angle * 0.5}deg`,
            ["--sk-kt" as string]: k.tint,
          }}
        >
          <img
            src={`${A}/${m.base}.webp`}
            alt={`${m.ko} 표면`}
            width={680}
            height={680}
            style={{ filter: m.tint }}
          />
          <span className="sk-graze" aria-hidden="true" />
          <span className="sk-kelvin" aria-hidden="true" />
        </div>

        <div className="sk-simctl">
          <div>
            <label htmlFor="sk-ang">
              조명 입사각 <b>{angle}°</b> — {angle < 25 ? "그레이징(스침)" : angle < 60 ? "사광" : "정면광"}
            </label>
            <input
              id="sk-ang"
              className="sk-range"
              type="range"
              min={0}
              max={90}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </div>
          <div>
            <label>
              색온도 <b>{k.k}</b> {k.label}
            </label>
            <div className="sk-kbtns">
              {KELVIN.map((x, i) => (
                <button key={x.k} aria-pressed={kelvin === i} onClick={() => setKelvin(i)}>
                  {x.k}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="sk-cap">
          저각 그레이징은 석재 검수에서 실제로 쓰는 기법입니다. 표면 요철과 연마 불균일이 이
          각도에서만 드러납니다.
        </p>
      </section>

      {/* ── 배열·줄눈 — 아홉 장면 전부 CSS ─────────────────── */}
      <section className="sk-bond">
        <div className="sk-col" style={{ paddingBottom: 0 }}>
          <p className="sk-eye">Bond & joint</p>
          <h2>배열과 줄눈이 무늬를 바꿉니다</h2>
        </div>
        <div
          className="sk-bondview"
          style={{ ["--sk-grout" as string]: g.hex, ["--sk-joint" as string]: "3px" }}
        >
          {[0, 1, 2, 3].map((row) => (
            <div
              key={row}
              className="sk-bondrow"
              style={{ ["--sk-off" as string]: (row * b.offset) % 100 }}
            >
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <img
                  key={c}
                  src={`${A}/${m.base}.webp`}
                  alt=""
                  loading="lazy"
                  style={{ filter: m.tint }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="sk-bondctl">
          <div>
            <label className="sk-ui" style={{ display: "block", marginBottom: 8 }}>
              배열
            </label>
            <div className="sk-kbtns">
              {BONDS.map((x, i) => (
                <button key={x.id} aria-pressed={bond === i} onClick={() => setBond(i)}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="sk-ui" style={{ display: "block", marginBottom: 8 }}>
              줄눈색 — {g.label}
            </label>
            <div className="sk-kbtns">
              {GROUTS.map((x, i) => (
                <button
                  key={x.id}
                  className="sk-swatchbtn"
                  aria-pressed={grout === i}
                  aria-label={x.label}
                  style={{ background: x.hex }}
                  onClick={() => setGrout(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 엣지·두께 ─────────────────────────────────────── */}
      <section>
        <div className="sk-col">
          <p className="sk-eye">Edge & gauge</p>
          <h2>두께는 시공 방법을 정합니다</h2>
          <p>
            6mm는 벽면 덧방, 12mm는 바닥과 벽 겸용, 20mm는 옥외 건식과 상판입니다. 마이터
            가공을 하려면 <b>관통무늬여야</b> 합니다 — 45°로 갈면 표면 프린트는 흰 속이
            드러납니다.
          </p>
        </div>
        <div className="sk-bleed">
          <img
            src={`${A}/thickness.webp`}
            alt="두께가 다른 슬래브 세 장을 계단처럼 겹쳐 옆에서 본 컷."
            width={1200}
            height={670}
            loading="lazy"
          />
        </div>
        <p className="sk-cap">6 · 12 · 20 mm. 같은 면, 다른 두께.</p>
        <div className="sk-bleed">
          <img
            src={`${A}/finish-pair.webp`}
            alt="같은 소재를 반으로 갈라 왼쪽은 폴리시, 오른쪽은 허니드로 마감한 컷."
            width={1200}
            height={670}
            loading="lazy"
          />
        </div>
        <p className="sk-cap">
          같은 원석, 왼쪽 폴리시 · 오른쪽 허니드. 결의 대비가 마감에서 갈립니다.
        </p>
      </section>

      {/* ── 규격·기술정보 — 의도적으로 뒤로 밀었다 ─────────── */}
      <section>
        <div className="sk-col">
          <p className="sk-eye">Technical</p>
          <h2>기술 정보</h2>
        </div>
        <dl className="sk-table">
          {TECH.map((t) => (
            <div key={t.k}>
              <dt>{t.k}</dt>
              <dd>{t.v}</dd>
              <dd>{t.std}</dd>
            </div>
          ))}
        </dl>
        <p className="sk-cap">시험 수치는 데모 예시입니다.</p>
      </section>

      {/* ── 다운로드 — 실측: 파일 용량을 병기한다 ───────────── */}
      <section>
        <div className="sk-col">
          <p className="sk-eye">Documents</p>
          <h2>자료실</h2>
        </div>
        <div className="sk-dl">
          {DOWNLOADS.map((d) => (
            <a key={d.k} href="#none" onClick={(e) => e.preventDefault()}>
              <b>{d.k}</b>
              <span>
                {d.t} · {d.s}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* ── 전환 3분기 ────────────────────────────────────── */}
      <div className="sk-cta">
        <div>
          <h3>샘플 신청</h3>
          <p>A4 크기 실물 샘플을 보내드립니다. 최대 3종.</p>
          <button onClick={() => onCompare(m.code)}>비교함에 담기</button>
        </div>
        <div>
          <h3>견적 요청</h3>
          <p>면적과 두께, 가공 사양을 알려주시면 3영업일 안에 회신합니다.</p>
          <button>수량 산출 요청</button>
        </div>
        <div>
          <h3>시공 파트너</h3>
          <p>마이터 가공과 대형 판재 시공이 가능한 협력사를 연결합니다.</p>
          <button>지역별 파트너 보기</button>
        </div>
      </div>

      <p className="sk-foot">
        포트폴리오용 자체 기획 컨셉입니다. 실존하는 브랜드·제품이 아니며 소재 이미지는 전부
        AI로 생성했습니다. 조명·줄눈·배열·컬러웨이는 촬영 매크로 4장에서 CSS로 파생한
        것입니다.
      </p>
    </article>
  );
}
