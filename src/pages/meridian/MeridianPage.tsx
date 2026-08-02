import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./meridian.css";

/*
 * MERIDIAN FLUID — Series FK-9 (가상 브랜드)
 *
 * 수출용 다국어 산업 부품 카탈로그. 국내 제조사가 해외 바이어에게 PDF 대신
 * 보내는 사이트라는 전제라 영문이 기본이고 국문은 토글이다.
 *
 * IA는 이 업종 카탈로그의 표준 순서를 그대로 따른다
 * (Products → Specifications → Certifications → Manufacturing → Inquiry).
 * 독창성은 구조가 아니라 조판과 한 곳의 마감에서 낸다 — 05에서 배운 것.
 */

const A = "/assets/meridian";

type Lang = "en" | "ko";
type S = Record<Lang, string>;
const t = (l: Lang, s: S) => s[l];

/* ── 사양 데이터 ─────────────────────────────────────────── */
type SizeKey = "DN25" | "DN50" | "DN80" | "DN100";
type ClassKey = "PN16" | "PN25" | "PN40";
type MatKey = "WCB" | "CF8M" | "DUPLEX";
type SeatKey = "PTFE" | "METAL" | "EPDM";

/* Kv는 m³/h, Δp = (Q/Kv)² 로 압력강하를 낸다 */
const SIZES: Record<SizeKey, { dn: number; kv: number; f2f: number; kg: number }> = {
  DN25: { dn: 25, kv: 16, f2f: 160, kg: 7.2 },
  DN50: { dn: 50, kv: 62, f2f: 230, kg: 15.4 },
  DN80: { dn: 80, kv: 155, f2f: 310, kg: 31.0 },
  DN100: { dn: 100, kv: 260, f2f: 350, kg: 44.5 },
};
const CLASSES: Record<ClassKey, { bar: number; psi: number }> = {
  PN16: { bar: 16, psi: 232 },
  PN25: { bar: 25, psi: 363 },
  PN40: { bar: 40, psi: 580 },
};
const MATS: Record<MatKey, { label: string; std: string; factor: number }> = {
  WCB: { label: "Cast steel", std: "ASTM A216 WCB", factor: 1 },
  CF8M: { label: "Stainless", std: "ASTM A351 CF8M", factor: 1.02 },
  DUPLEX: { label: "Duplex", std: "ASTM A995 4A", factor: 1.05 },
};
const SEATS: Record<SeatKey, { label: string; lo: number; hi: number }> = {
  PTFE: { label: "PTFE", lo: -20, hi: 200 },
  METAL: { label: "Metal", lo: -29, hi: 425 },
  EPDM: { label: "EPDM", lo: -40, hi: 120 },
};

/* ── 페이지 카피 ─────────────────────────────────────────── */
const C = {
  navProducts: { en: "Products", ko: "제품군" },
  navSpecs: { en: "Specifications", ko: "사양" },
  navCerts: { en: "Certifications", ko: "인증" },
  navMfg: { en: "Manufacturing", ko: "생산" },
  navContact: { en: "Contact", ko: "문의" },

  heroTag: { en: "Series FK-9 · Flow control", ko: "Series FK-9 · 유체 제어" },
  heroH1: {
    en: "Every figure a buyer asks for, before they ask.",
    ko: "바이어가 묻기 전에, 묻게 될 수치를 먼저 놓습니다.",
  },
  heroP: {
    en: "Cast steel valves, pumps, filters and heat exchangers for industrial fluid lines. Full specification data on this page — no download, no login.",
    ko: "산업용 유체 라인을 위한 주강 밸브 · 펌프 · 필터 · 열교환기. 사양 데이터를 이 페이지에서 그대로 확인하실 수 있습니다. 다운로드도 로그인도 없습니다.",
  },
  heroCta1: { en: "Open datasheet", ko: "데이터시트 열기" },
  heroCta2: { en: "Request a quotation", ko: "견적 문의" },

  rangeEyebrow: { en: "Product range", ko: "제품군" },
  rangeH2: { en: "Four families, one flange standard.", ko: "네 개 계열, 하나의 플랜지 규격." },
  rangeLead: {
    en: "Every family shares the same face-to-face dimensions and flange drilling, so a line can be reconfigured without re-piping.",
    ko: "모든 계열이 동일한 면간 치수와 플랜지 드릴링을 씁니다. 배관을 다시 짜지 않고 라인을 재구성할 수 있습니다.",
  },

  dsEyebrow: { en: "Live datasheet", ko: "데이터시트" },
  dsH2: { en: "Configure it here. The curve follows.", ko: "여기서 조합하면 곡선이 따라옵니다." },
  dsLead: {
    en: "Select bore, pressure class, body material and seat. Flow coefficient, temperature range and pressure drop update together.",
    ko: "구경 · 압력등급 · 몸체 재질 · 시트를 고르면 유량계수와 사용 온도, 압력강하가 함께 바뀝니다.",
  },
  dsCap: { en: "FIG. 1 — FK-9 body, sectioned", ko: "FIG. 1 — FK-9 몸체 종단면" },
  dsSize: { en: "Bore", ko: "구경" },
  dsClass: { en: "Class", ko: "압력등급" },
  dsMat: { en: "Body", ko: "몸체" },
  dsSeat: { en: "Seat", ko: "시트" },
  dsTable: { en: "Resulting specification", ko: "산출 사양" },
  dsCurve: { en: "Pressure drop — Δp against flow", ko: "압력강하 — 유량 대비 Δp" },

  certEyebrow: { en: "Certifications", ko: "인증" },
  certH2: { en: "Documents ship with the goods.", ko: "서류는 제품과 함께 나갑니다." },
  certLead: {
    en: "Material and pressure test certificates are issued per production lot and travel with the shipment, not on request afterwards.",
    ko: "재질 시험성적서와 내압 시험성적서는 생산 로트 단위로 발행되어 선적과 함께 나갑니다. 나중에 요청하실 필요가 없습니다.",
  },

  mfgEyebrow: { en: "Manufacturing", ko: "생산" },
  mfgH2: { en: "Cast, machined and tested in one plant.", ko: "주조 · 가공 · 시험을 한 공장에서." },
  mfgBand: {
    en: "Sand-cast surface, as it leaves the mould. The machined sealing face at the right is the only surface we finish.",
    ko: "주형에서 나온 그대로의 주물 표면. 오른쪽 기계 가공면이 저희가 마감하는 유일한 면입니다.",
  },

  inqEyebrow: { en: "Inquiry", ko: "문의" },
  inqH2: { en: "Send the line conditions. We reply with a sized quotation.", ko: "라인 조건을 보내주시면 사이징된 견적으로 회신합니다." },
  inqLead: {
    en: "Fluid, flow rate, working pressure and temperature are enough to start. Drawings in DWG or STEP are welcome but not required.",
    ko: "유체 · 유량 · 사용 압력 · 온도만 있으면 시작할 수 있습니다. DWG나 STEP 도면이 있으면 좋지만 없어도 됩니다.",
  },

  demo: {
    en: "Portfolio demo. MERIDIAN FLUID is a fictional brand; all figures, certifications and contact details are illustrative. Images are AI-generated.",
    ko: "포트폴리오 데모입니다. MERIDIAN FLUID는 가상 브랜드이며 수치 · 인증 · 연락처는 모두 예시입니다. 이미지는 AI로 생성했습니다.",
  },
} satisfies Record<string, S>;

const FIGURES: [S, S][] = [
  [{ en: "DN25 – DN100", ko: "DN25 – DN100" }, { en: "Bore range", ko: "구경 범위" }],
  [{ en: "PN16 – PN40", ko: "PN16 – PN40" }, { en: "Pressure class", ko: "압력 등급" }],
  [{ en: "−40 – 425 °C", ko: "−40 – 425 °C" }, { en: "Service temp.", ko: "사용 온도" }],
  [{ en: "EN 1092-1", ko: "EN 1092-1" }, { en: "Flange standard", ko: "플랜지 규격" }],
];

const PRODUCTS: { code: string; img: string; name: S; desc: S }[] = [
  {
    code: "FK-9V",
    img: `${A}/hero-valve.webp`,
    name: { en: "Flow control valve", ko: "유체 제어 밸브" },
    desc: { en: "Cast body, bolted bonnet, rising stem.", ko: "주조 몸체 · 볼트 보닛 · 상승 스템." },
  },
  {
    code: "FK-9P",
    img: `${A}/impeller.webp`,
    name: { en: "Closed impeller", ko: "밀폐형 임펠러" },
    desc: { en: "Investment cast, backswept vanes.", ko: "정밀 주조 · 후곡 베인." },
  },
  {
    code: "FK-9H",
    img: `${A}/plates.webp`,
    name: { en: "Plate heat exchanger", ko: "플레이트 열교환기" },
    desc: { en: "Pressed chevron plates, gasketed.", ko: "쉐브론 프레스 플레이트 · 개스킷식." },
  },
  {
    code: "FK-9F",
    img: `${A}/filter-media.webp`,
    name: { en: "Filter element", ko: "필터 엘리먼트" },
    desc: { en: "Pleated non-woven media, 10–200 µm.", ko: "주름형 부직포 미디어 · 10–200 µm." },
  },
];

const CERTS: [string, S][] = [
  ["ISO 9001", { en: "Quality management system", ko: "품질경영시스템" }],
  ["CE / PED", { en: "Pressure Equipment Directive 2014/68/EU", ko: "압력기기 지침 2014/68/EU" }],
  ["EN 10204 3.1", { en: "Material test certificate per lot", ko: "로트별 재질 시험성적서" }],
  ["API 598", { en: "Valve inspection and testing", ko: "밸브 검사 및 시험" }],
];

const MFG_STEPS: [string, S, S][] = [
  [
    "01",
    { en: "Sand casting", ko: "주조" },
    { en: "Bodies are poured in-house. Each heat is sampled and kept against the lot certificate.", ko: "몸체를 자체 주조합니다. 용탕마다 시편을 채취해 로트 성적서와 함께 보관합니다." },
  ],
  [
    "02",
    { en: "Machining", ko: "기계 가공" },
    { en: "Sealing faces and flange drilling on one setup, so face-to-face stays within tolerance.", ko: "실링면과 플랜지 드릴링을 한 셋업에서 가공해 면간 치수 공차를 지킵니다." },
  ],
  [
    "03",
    { en: "Pressure test", ko: "내압 시험" },
    { en: "Every unit is shell- and seat-tested. Results are recorded against the serial number.", ko: "전 수량 셸·시트 시험을 거칩니다. 결과는 시리얼 번호에 기록됩니다." },
  ],
];

/* ── hooks ───────────────────────────────────────────────── */
function useReveal<T extends HTMLElement>(threshold = 0.14) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>(".rv");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((n) => n.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold },
    );
    targets.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/* ── 압력강하 곡선 ───────────────────────────────────────── */
function DropCurve({ kv, label }: { kv: number; label: string }) {
  /* Δp = (Q/Kv)². 2.5 bar에서 끊어 곡선 하나가 항상 프레임을 채우게 한다. */
  const dpMax = 2.5;
  const qMax = kv * Math.sqrt(dpMax);
  /* 플롯 영역: x 16→98, y 10→46. 라벨이 들어갈 좌·하단 여백을 먼저 뺀다. */
  const X0 = 16;
  const X1 = 98;
  const Y0 = 10;
  const Y1 = 46;
  const pts = Array.from({ length: 41 }, (_, i) => {
    const q = (qMax * i) / 40;
    const dp = (q / kv) ** 2;
    return `${X0 + (q / qMax) * (X1 - X0)},${Y1 - (dp / dpMax) * (Y1 - Y0)}`;
  }).join(" ");

  return (
    <div className="mf-curve">
      <p className="mf-ds-cap" style={{ marginBottom: 8 }}>
        {label} · bar / m³·h⁻¹
      </p>
      <svg viewBox="0 0 104 56" role="img" aria-label={`Pressure drop curve, Kv ${kv}`}>
        {[0, 1, 2, 3].map((i) => (
          <line
            key={i}
            className="grid"
            x1={X0}
            y1={Y1 - (i * (Y1 - Y0)) / 3}
            x2={X1}
            y2={Y1 - (i * (Y1 - Y0)) / 3}
          />
        ))}
        <line className="axis" x1={X0} y1={Y0} x2={X0} y2={Y1} />
        <line className="axis" x1={X0} y1={Y1} x2={X1} y2={Y1} />
        <polyline className="plot" points={pts} />
        <text className="lbl" x={X0 - 3} y={Y0 + 1.6} textAnchor="end">
          2.5
        </text>
        <text className="lbl" x={X0 - 3} y={Y1 + 1.4} textAnchor="end">
          0
        </text>
        <text className="lbl" x={X0} y={Y1 + 8}>
          0
        </text>
        <text className="lbl" x={X1} y={Y1 + 8} textAnchor="end">
          {Math.round(qMax)}
        </text>
      </svg>
    </div>
  );
}

/* ── 데이터시트 ──────────────────────────────────────────── */
function Datasheet({ lang }: { lang: Lang }) {
  const [size, setSize] = useState<SizeKey>("DN50");
  const [cls, setCls] = useState<ClassKey>("PN25");
  const [mat, setMat] = useState<MatKey>("WCB");
  const [seat, setSeat] = useState<SeatKey>("PTFE");

  const spec = useMemo(() => {
    const s = SIZES[size];
    const c = CLASSES[cls];
    const m = MATS[mat];
    const st = SEATS[seat];
    return {
      kv: s.kv,
      dn: s.dn,
      f2f: s.f2f,
      kg: (s.kg * m.factor).toFixed(1),
      bar: c.bar,
      psi: c.psi,
      lo: st.lo,
      hi: Math.min(st.hi, mat === "WCB" ? 425 : st.hi),
      std: m.std,
      code: `FK-9V-${s.dn}-${cls}-${mat}-${seat}`,
    };
  }, [size, cls, mat, seat]);

  const axes: [S, string[], string, (v: string) => void][] = [
    [C.dsSize, Object.keys(SIZES), size, (v) => setSize(v as SizeKey)],
    [C.dsClass, Object.keys(CLASSES), cls, (v) => setCls(v as ClassKey)],
    [C.dsMat, Object.keys(MATS), mat, (v) => setMat(v as MatKey)],
    [C.dsSeat, Object.keys(SEATS), seat, (v) => setSeat(v as SeatKey)],
  ];

  return (
    <div className="mf-panel">
      {axes.map(([label, opts, cur, set]) => (
        <div className="mf-axis" key={label.en}>
          <span className="mf-axis-label" id={`ax-${label.en}`}>
            {t(lang, label)}
          </span>
          <div className="mf-chips" role="radiogroup" aria-labelledby={`ax-${label.en}`}>
            {opts.map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={cur === o}
                tabIndex={cur === o ? 0 : -1}
                className="mf-chip"
                onClick={() => set(o)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const i = opts.indexOf(cur);
                  set(opts[(i + (e.key === "ArrowRight" ? 1 : -1) + opts.length) % opts.length]);
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}

      <table className="mf-spec">
        <caption>{t(lang, C.dsTable)}</caption>
        <tbody>
          <tr>
            <th scope="row">Order code</th>
            <td>
              <b>{spec.code}</b>
            </td>
          </tr>
          <tr>
            <th scope="row">Flow coefficient Kv</th>
            <td>
              <b>{spec.kv}</b> m³/h
            </td>
          </tr>
          <tr>
            <th scope="row">Max. working pressure</th>
            <td>
              {spec.bar} bar / {spec.psi} psi
            </td>
          </tr>
          <tr>
            <th scope="row">Service temperature</th>
            <td>
              {spec.lo} – {spec.hi} °C
            </td>
          </tr>
          <tr>
            <th scope="row">Face to face</th>
            <td>{spec.f2f} mm</td>
          </tr>
          <tr>
            <th scope="row">Body material</th>
            <td>{spec.std}</td>
          </tr>
          <tr>
            <th scope="row">Approx. weight</th>
            <td>{spec.kg} kg</td>
          </tr>
        </tbody>
      </table>

      <DropCurve kv={spec.kv} label={t(lang, C.dsCurve)} />
    </div>
  );
}

/* ── page ────────────────────────────────────────────────── */
export default function MeridianPage() {
  const page = useReveal<HTMLDivElement>();
  const [lang, setLang] = useState<Lang>("en");
  const kr = lang === "ko" ? "mf-kr" : "";

  useEffect(() => {
    document.documentElement.lang = lang === "ko" ? "ko" : "en";
    return () => {
      document.documentElement.lang = "ko";
    };
  }, [lang]);

  return (
    <div className={`mf-site ${kr}`} ref={page}>
      <Link to="/" className="mf-back">
        ← PORTFOLIO
      </Link>

      <nav className="mf-nav" aria-label={lang === "ko" ? "주요 메뉴" : "Primary"}>
        <div className="mf-nav-inner">
          <a href="#top" className="mf-logo">
            MERIDIAN <span>FLUID</span>
          </a>
          <div className="mf-menu">
            <a href="#range">{t(lang, C.navProducts)}</a>
            <a href="#datasheet">{t(lang, C.navSpecs)}</a>
            <a href="#certs">{t(lang, C.navCerts)}</a>
            <a href="#mfg">{t(lang, C.navMfg)}</a>
            <a href="#inquiry">{t(lang, C.navContact)}</a>
          </div>
          <div className="mf-lang">
            <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
              EN
            </button>
            <button type="button" aria-pressed={lang === "ko"} onClick={() => setLang("ko")}>
              KO
            </button>
          </div>
        </div>
      </nav>

      {/* 히어로 — 부품이 지면 위에 경계 없이 뜬다 */}
      <section className="mf-hero" id="top">
        <div className="mf-hero-inner">
          <div>
            <p className="mf-hero-tag">{t(lang, C.heroTag)}</p>
            <h1>{t(lang, C.heroH1)}</h1>
            <p>{t(lang, C.heroP)}</p>
            <div className="mf-hero-cta">
              <a href="#datasheet" className="mf-btn solid">
                {t(lang, C.heroCta1)}
              </a>
              <a href="#inquiry" className="mf-btn line">
                {t(lang, C.heroCta2)}
              </a>
            </div>
          </div>
          <figure className="mf-hero-fig">
            <img
              src={`${A}/hero-valve.webp`}
              alt={
                lang === "ko"
                  ? "FK-9 주강 유체 제어 밸브 몸체"
                  : "FK-9 cast steel flow control valve body"
              }
              width={1800}
              height={1005}
              fetchPriority="high"
            />
          </figure>
        </div>
      </section>

      <div className="mf-figs">
        <div className="mf-figs-grid">
          {FIGURES.map(([v, k]) => (
            <div className="mf-fig" key={k.en}>
              <b>{t(lang, v)}</b>
              <i>{t(lang, k)}</i>
            </div>
          ))}
        </div>
      </div>

      {/* 제품군 */}
      <section className="mf-sec deep" id="range">
        <div className="mf-wrap">
          <div className="mf-head rv">
            <p className="mf-eyebrow">{t(lang, C.rangeEyebrow)}</p>
            <h2 className="mf-h2">{t(lang, C.rangeH2)}</h2>
            <p className="mf-lead">{t(lang, C.rangeLead)}</p>
          </div>
          <div className="mf-range">
            {PRODUCTS.map((p, i) => (
              <article className="mf-prod rv" key={p.code} style={{ ["--d" as string]: `${i * 0.06}s` }}>
                <img src={p.img} alt={t(lang, p.name)} loading="lazy" />
                <div className="mf-prod-body">
                  <span className="mf-prod-code">{p.code}</span>
                  <h3>{t(lang, p.name)}</h3>
                  <p>{t(lang, p.desc)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 데이터시트 — 시그니처 */}
      <section className="mf-ds" id="datasheet">
        <div className="mf-wrap">
          <div className="mf-head rv">
            <p className="mf-eyebrow">{t(lang, C.dsEyebrow)}</p>
            <h2 className="mf-h2">{t(lang, C.dsH2)}</h2>
            <p className="mf-lead">{t(lang, C.dsLead)}</p>
          </div>
          <div className="mf-ds-grid">
            <figure className="mf-ds-fig rv">
              <img
                src={`${A}/valve-section.webp`}
                alt={
                  lang === "ko"
                    ? "FK-9 밸브 몸체 종단면 — 유로 · 시트 · 디스크 · 스템"
                    : "FK-9 valve body sectioned — flow path, seat, disc and stem"
                }
                width={1600}
                height={893}
                loading="lazy"
              />
              <figcaption className="mf-ds-cap">{t(lang, C.dsCap)}</figcaption>
            </figure>
            <div className="rv" style={{ ["--d" as string]: "0.08s" }}>
              <Datasheet lang={lang} />
            </div>
          </div>
        </div>
      </section>

      {/* 인증 */}
      <section className="mf-sec alt" id="certs">
        <div className="mf-wrap">
          <div className="mf-head rv">
            <p className="mf-eyebrow">{t(lang, C.certEyebrow)}</p>
            <h2 className="mf-h2">{t(lang, C.certH2)}</h2>
            <p className="mf-lead">{t(lang, C.certLead)}</p>
          </div>
          <div className="mf-certs rv">
            {CERTS.map(([code, desc]) => (
              <div className="mf-cert" key={code}>
                <b>{code}</b>
                <span>{t(lang, desc)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 생산 */}
      <section className="mf-sec" id="mfg" style={{ paddingBottom: 0 }}>
        <div className="mf-wrap">
          <div className="mf-head rv">
            <p className="mf-eyebrow">{t(lang, C.mfgEyebrow)}</p>
            <h2 className="mf-h2">{t(lang, C.mfgH2)}</h2>
          </div>
          <div className="mf-steps" style={{ marginBottom: "clamp(40px,5vw,64px)" }}>
            {MFG_STEPS.map(([no, title, body], i) => (
              <div className="mf-step rv" key={no} style={{ ["--d" as string]: `${i * 0.06}s` }}>
                <b>{no}</b>
                <h3>{t(lang, title)}</h3>
                <p>{t(lang, body)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mf-band">
          <img
            src={`${A}/cast-surface.webp`}
            alt={lang === "ko" ? "주물 표면과 기계 가공면" : "As-cast surface meeting a machined face"}
            loading="lazy"
          />
          <div className="mf-band-body">
            <p className="mf-lead" style={{ color: "rgba(242,244,243,.86)", margin: 0 }}>
              {t(lang, C.mfgBand)}
            </p>
          </div>
        </div>
      </section>

      {/* 문의 */}
      <section className="mf-sec inq mf-inq" id="inquiry">
        <div className="mf-wrap">
          <div className="mf-inq-grid">
            <div className="rv">
              <p className="mf-eyebrow">{t(lang, C.inqEyebrow)}</p>
              <h2 className="mf-h2">{t(lang, C.inqH2)}</h2>
              <p className="mf-lead">{t(lang, C.inqLead)}</p>
              <div style={{ marginTop: "1.8rem" }}>
                <a href="mailto:sales@example.com" className="mf-btn solid" style={{ background: "var(--mf-signal)", color: "#162325" }}>
                  sales@example.com
                </a>
              </div>
            </div>
            <div className="rv" style={{ ["--d" as string]: "0.08s" }}>
              <img
                src={`${A}/seals.webp`}
                alt={lang === "ko" ? "시트 실링 링 3종" : "Three seat sealing rings"}
                loading="lazy"
                style={{ width: "100%", height: "auto", display: "block", marginBottom: "1.6rem" }}
              />
              <dl className="mf-contact">
                <dt>Plant</dt>
                <dd>Changwon, Republic of Korea</dd>
                <dt>Export</dt>
                <dd>EU · MENA · SEA</dd>
                <dt>Lead time</dt>
                <dd>Stock items 2 weeks · made to order 6–8 weeks</dd>
                <dt>Incoterms</dt>
                <dd>EXW · FOB Busan · CIF</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <footer className="mf-foot">
        <div className="mf-wrap">
          <b>MERIDIAN FLUID</b>
          <p>Series FK-9 · Flow control valves, pumps, filters and heat exchangers</p>
          <p>Changwon, Republic of Korea · sales@example.com</p>
          <div className="mf-demo">
            {t(lang, C.demo)}
            <br />
            <Link to="/" style={{ textDecoration: "underline" }}>
              ← Portfolio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
