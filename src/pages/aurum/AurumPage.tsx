import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import "./aurum.css";

const A = "/assets/aurum";
const FRAME_COUNT = 61;
const frameSrc = (i: number) => `${A}/frames/f_${String(i + 1).padStart(3, "0")}.webp`;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- reveal on intersection ---------- */
function useReveal<T extends HTMLElement>(threshold = 0.22) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
    el.querySelectorAll(".rv").forEach((n) => io.observe(n));
    if (el.classList.contains("rv")) io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/* ---------- smoothed section progress (sticky scrub) ---------- */
function useSectionProgress<T extends HTMLElement>(lerp = 0.14) {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (prefersReduced()) {
      setProgress(1);
      return;
    }
    let raf = 0;
    let current = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height - vh;
        const raw = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        current += (raw - current) * lerp;
        if (Math.abs(raw - current) < 0.0005) current = raw;
        setProgress(current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lerp]);
  return { ref, progress };
}

/* ---------- count-up ---------- */
function CountUp({
  to,
  suffix = "",
  duration = 1500,
  format = false,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  format?: boolean;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      setVal(to);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref}>
      {format ? val.toLocaleString("ko-KR") : val}
      {suffix}
    </span>
  );
}

/* ---------- hero: canvas frame scrub (시간 스크럽) ---------- */
function HeroScrub() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);
  const reduced = useMemo(prefersReduced, []);

  useEffect(() => {
    if (reduced) return;
    let loaded = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = () => {
        loaded += 1;
        if (loaded >= 8) setReady(true);
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, [reduced]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const imgs = imagesRef.current;
    if (!canvas || imgs.length === 0) return;
    const idx = Math.min(FRAME_COUNT - 1, Math.floor(progress * (FRAME_COUNT - 1)));
    const img = imgs[idx];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = canvas.clientWidth * dpr;
    const ch = canvas.clientHeight * dpr;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    ctx.fillStyle = "#060605";
    ctx.fillRect(0, 0, cw, ch);
    /* cover: 프레임이 화면을 가득 채우도록 */
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    /* 위·아래 비네트로 카피 가독성 확보 */
    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, "rgba(6,6,5,0.55)");
    grad.addColorStop(0.35, "rgba(6,6,5,0)");
    grad.addColorStop(0.75, "rgba(6,6,5,0)");
    grad.addColorStop(1, "rgba(6,6,5,0.6)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);
  }, [progress]);

  useEffect(() => {
    draw();
  }, [draw, ready]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const copyStyle = {
    opacity: Math.max(0, 1 - progress * 2.2),
    transform: `translateY(${progress * -26}px)`,
  };

  return (
    <section className="au-hero" ref={ref} aria-label="AURUM Calibre 04 히어로">
      <div className="au-hero-sticky">
        {reduced ? (
          <img className="au-hero-canvas" src={`${A}/hero-lg.webp`} alt="AURUM Calibre 04 스켈레톤 크로노그래프" />
        ) : (
          <canvas className="au-hero-canvas" ref={canvasRef} aria-hidden="true" />
        )}
        <div className="au-hero-copy" style={reduced ? undefined : copyStyle}>
          <p className="au-hero-eyebrow">AURUM · CALIBRE 04</p>
          <h1 className="au-hero-h1">
            1초를 쪼개는,
            <br />
            기계.
          </h1>
          <p className="au-hero-sub">
            시간을 감추지 않는 스켈레톤 크로노그래프. 당신의 스크롤이 곧, 이 시계의 시간입니다.
          </p>
        </div>
        {!reduced && (
          <div className="au-hero-meter" aria-hidden="true">
            <span className="au-hero-meter-bar" style={{ transform: `scaleX(${progress})` }} />
          </div>
        )}
        {!reduced && progress < 0.02 && <div className="au-scroll-hint">스크롤하여 태엽을 감으세요</div>}
      </div>
    </section>
  );
}

/* ---------- 다이얼: 캡션 핀 ---------- */
const dialPins = [
  { x: 50, y: 16, label: "인덱스", body: "샴페인 골드 아플리케 인덱스, 수퍼루미노바 충전" },
  { x: 26, y: 55, label: "60분 적산계", body: "오픈워크 브리지 아래로 톱니가 그대로 보입니다" },
  { x: 73, y: 42, label: "30분 카운터", body: "크로노그래프 작동 시에만 움직이는 두 번째 심장" },
  { x: 55, y: 78, label: "밸런스 휠", body: "초당 8회 진동하는, 시계의 맥박" },
];

function DialSection() {
  const ref = useReveal<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  return (
    <section className="au-sec" id="dial" ref={ref}>
      <div className="au-wrap">
        <p className="au-eyebrow rv">다이얼</p>
        <h2 className="au-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
          숨길 것이 없다는,
          <br />
          자신감.
        </h2>
        <p className="au-body rv" style={{ ["--d" as string]: "0.16s" }}>
          문자판을 덜어내자 217개의 부품이 드러났습니다. 포인트를 눌러 각 부분을 살펴보세요.
        </p>
        <div className="au-dial-stage rv" style={{ ["--d" as string]: "0.2s" }}>
          <img src={`${A}/dial.webp`} alt="AURUM Calibre 04 다이얼 톱다운 매크로" loading="lazy" />
          {dialPins.map((p, i) => (
            <button
              key={i}
              className={`au-pin${active === i ? " on" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              aria-expanded={active === i}
              aria-label={p.label}
              onClick={() => setActive(active === i ? null : i)}
            >
              <span className="au-pin-dot" aria-hidden="true" />
              <span className="au-pin-card" role="tooltip">
                <b>{p.label}</b>
                {p.body}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- X-ray: 3레이어 스크롤 크로스페이드 ---------- */
const xrayLayers = [
  {
    img: `${A}/dial.webp`,
    eyebrow: "LAYER 01 — 다이얼",
    cap: "계속 스크롤해 무브먼트 속으로 들어가 보세요.",
  },
  {
    img: `${A}/gears.webp`,
    eyebrow: "LAYER 02 — 기어 트레인",
    cap: "메인스프링의 힘이 5개의 톱니를 지나 초침까지 전달됩니다. 손실은 단 3%.",
  },
  {
    img: `${A}/caseback.webp`,
    eyebrow: "LAYER 03 — 케이스백",
    cap: "제네바 스트라이프와 페를라주. 뒤집어야 보이는 곳까지, 손으로 마감했습니다.",
  },
];

function XraySection() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const reduced = useMemo(prefersReduced, []);
  /* 0~1 진행도를 3레이어 크로스페이드로 변환 */
  const t = reduced ? 2 : Math.min(2, Math.max(0, progress * 2.6 - 0.3));
  const stage = Math.min(2, Math.round(t));
  return (
    <div className="au-xray" ref={ref}>
      <div className="au-xray-sticky">
        <div className="au-xray-stage">
          {xrayLayers.map((l, i) => (
            <img
              key={i}
              src={l.img}
              alt=""
              style={{ opacity: Math.max(0, 1 - Math.abs(t - i)) }}
            />
          ))}
        </div>
        <div className="au-xray-cap">
          <p className="au-eyebrow" style={{ marginBottom: 8 }}>
            {xrayLayers[stage].eyebrow}
          </p>
          <p>{xrayLayers[stage].cap}</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 밸런스: 스탯 ---------- */
function BalanceSection() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="au-sec au-balance" ref={ref}>
      <div className="au-balance-bg" aria-hidden="true">
        <img src={`${A}/balance.webp`} alt="" loading="lazy" />
      </div>
      <div className="au-wrap au-center" style={{ position: "relative" }}>
        <p className="au-eyebrow rv">밸런스 휠</p>
        <h2 className="au-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
          하루 86,400초를
          <br />
          잘게, 고르게.
        </h2>
        <p className="au-body rv" style={{ ["--d" as string]: "0.16s" }}>
          블루 스크류가 박힌 밸런스 휠이 쉼 없이 진동하며 시간을 균등하게 나눕니다.
          기계식 시계의 심장이 여기에 있습니다.
        </p>
        <div className="au-stats">
          <div className="rv">
            <div className="au-stat-num">
              <CountUp to={28800} format duration={1800} />
            </div>
            <p className="au-stat-cap">시간당 진동수(vph) · 4Hz</p>
          </div>
          <div className="rv" style={{ ["--d" as string]: "0.1s" }}>
            <div className="au-stat-num">
              <CountUp to={62} suffix="시간" />
            </div>
            <p className="au-stat-cap">파워 리저브 · 태엽 완전 감김 기준</p>
          </div>
          <div className="rv" style={{ ["--d" as string]: "0.2s" }}>
            <div className="au-stat-num">
              <CountUp to={27} suffix="석" />
            </div>
            <p className="au-stat-cap">루비 주얼 베어링</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 소재 2분할 ---------- */
function MaterialsSection() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="au-sec" id="materials" ref={ref}>
      <div className="au-wrap">
        <p className="au-eyebrow rv">케이스 & 스트랩</p>
        <h2 className="au-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
          빛은 금속이 받고,
          <br />
          무게는 가죽이 진다.
        </h2>
        <div className="au-mat-grid">
          <figure className="au-tile rv">
            <img src={`${A}/profile.webp`} alt="브러시드 스틸 케이스 측면 프로파일" loading="lazy" />
            <figcaption>
              <b>316L 브러시드 스틸 · 40.5mm</b>
              헤어라인과 폴리싱이 교차하는 11.9mm의 얇은 프로파일. 소매 안으로 조용히
              들어갑니다.
            </figcaption>
          </figure>
          <figure className="au-tile rv" style={{ ["--d" as string]: "0.12s" }}>
            <img src={`${A}/strap.webp`} alt="카프 레더 스트랩 스티치 매크로" loading="lazy" />
            <figcaption>
              <b>베지터블 태닝 카프 레더</b>
              크림 스티치를 손바느질로. 착용할수록 손목의 곡선을 기억합니다.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/* ---------- 스펙 ---------- */
const specs: [string, string][] = [
  ["칼리버", "AURUM cal.04 · 수동 크로노그래프"],
  ["진동수", "28,800 vph (4 Hz)"],
  ["파워 리저브", "62시간"],
  ["주얼", "27석 · 루비"],
  ["케이스", "316L 스테인리스 스틸 · 40.5 × 11.9mm"],
  ["글라스", "양면 사파이어 크리스털 (전면 · 케이스백)"],
  ["방수", "5 ATM"],
  ["스트랩", "카프 레더 · 퀵 릴리스 · 20mm"],
];

function SpecsSection() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="au-sec" id="specs" ref={ref}>
      <div className="au-wrap" style={{ maxWidth: 860 }}>
        <p className="au-eyebrow rv">제원</p>
        <h2 className="au-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
          Calibre 04, 숫자로.
        </h2>
        <dl className="au-specs rv" style={{ ["--d" as string]: "0.14s" }}>
          {specs.map(([k, v]) => (
            <div key={k} className="au-spec-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ---------- 오퍼 ---------- */
function OfferSection() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="au-sec" id="offer" ref={ref} style={{ paddingTop: 0 }}>
      <div className="au-wrap">
        <div className="au-offer rv">
          <div className="au-offer-img">
            <img src={`${A}/wrist.webp`} alt="AURUM Calibre 04 손목 착용 컷" loading="lazy" />
          </div>
          <div className="au-offer-body">
            <p className="au-eyebrow">한정 제작</p>
            <h2 className="au-h2" style={{ fontSize: "clamp(28px,3.6vw,42px)" }}>
              한 달에 4점.
              <br />한 점에 한 손목.
            </h2>
            <p className="au-price">
              ₩8,900,000 <span>· 개인 각인 포함</span>
            </p>
            <ul className="au-offer-perks">
              <li>워치메이커 1인이 조립부터 검수까지 전담</li>
              <li>5년 국제 보증 · 평생 오버홀 예약 우선권</li>
              <li>시리얼 넘버 각인 · 월 4점 한정</li>
            </ul>
            <a className="au-cta" href="#offer" onClick={(e) => e.preventDefault()} aria-disabled="true">
              피팅 예약하기
            </a>
            <p className="au-demo-note">포트폴리오 데모 페이지로, 실제 판매 제품이 아닙니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
export default function AurumPage() {
  return (
    <div className="au-site">
      <nav className="au-nav" aria-label="AURUM Calibre 04">
        <Link to="/" className="au-nav-title" title="포트폴리오로 돌아가기">
          AURUM
        </Link>
        <div className="au-nav-links">
          <a href="#dial">다이얼</a>
          <a href="#specs" className="max-sm:hidden">
            제원
          </a>
          <a href="#offer" className="au-nav-pill">
            피팅 예약
          </a>
        </div>
      </nav>

      <HeroScrub />
      <DialSection />
      <XraySection />
      <BalanceSection />
      <MaterialsSection />
      <SpecsSection />
      <OfferSection />

      <footer className="au-foot">
        <div className="au-wrap" style={{ padding: "48px 22px" }}>
          <p className="au-footnotes">
            AURUM은 실존하지 않는 가상 브랜드이며, 이 페이지는 Higgsfield AI 생성
            에셋(스틸 9컷 · 필름 1편)으로 제작된 포트폴리오 데모입니다. 모든 제원은
            연출된 예시 값입니다. Concept demo — all specs illustrative.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link to="/" className="au-footnotes" style={{ textDecoration: "underline" }}>
              ← Portfolio로 돌아가기
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
