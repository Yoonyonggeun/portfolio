import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import "./klang.css";

const A = "/assets/klang";
const FRAME_COUNT = 61;
const frameSrc = (i: number) => `${A}/frames/f_${String(i + 1).padStart(3, "0")}.webp`;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- reveal on intersection ---------- */
function useReveal<T extends HTMLElement>(threshold = 0.25) {
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
    if (el.classList.contains("rv") || el.classList.contains("kl-rise-frame"))
      io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/* ---------- smoothed section progress (sticky scrub) ---------- */
function useSectionProgress<T extends HTMLElement>(lerp = 0.13) {
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
function CountUp({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
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
      {val}
      {suffix}
    </span>
  );
}

/* ---------- hero: canvas frame scrub ---------- */
function HeroScrub() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
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
    ctx.fillStyle = "#f5f5f7";
    ctx.fillRect(0, 0, cw, ch);
    const s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    let y = ch - h - ch * 0.02;
    if (canvas.clientWidth < 740) {
      // 모바일: 카피 아래 남는 공간의 세로 중앙에 배치
      const copyH = (copyRef.current?.offsetHeight ?? 0) * dpr;
      y = Math.min(y, copyH + Math.max(0, (ch - copyH - h) / 2));
    }
    ctx.drawImage(img, (cw - w) / 2, y, w, h);
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
    opacity: Math.max(0, 1 - progress * 1.6),
    transform: `translateY(${progress * -30}px)`,
  };

  return (
    <section className="kl-hero" ref={ref} aria-label="KLANG Pro 히어로">
      <div className="kl-hero-sticky">
        <div className="kl-hero-copy" ref={copyRef} style={reduced ? undefined : copyStyle}>
          <p className="kl-hero-eyebrow">KLANG Pro</p>
          <h1 className="kl-hero-h1">
            소음은 지우고,
            <br />
            소리만 남기다.
          </h1>
          <p className="kl-hero-sub">
            적응형 액티브 노이즈 캔슬링. 이전 세대 대비 최대 2배 강력하게.<sup>1</sup>
          </p>
          <a className="kl-hero-cta" href="#buy">
            구입하기
          </a>
        </div>
        {reduced ? (
          <img className="kl-hero-canvas" src={`${A}/hero-lg.webp`} alt="KLANG Pro 이어버드 한 쌍" />
        ) : (
          <canvas className="kl-hero-canvas" ref={canvasRef} aria-hidden="true" />
        )}
        {!reduced && progress < 0.02 && <div className="kl-scroll-hint">스크롤</div>}
      </div>
    </section>
  );
}

/* ---------- highlights ---------- */
const highlights = [
  { img: `${A}/dancer.webp`, label: <>동급 최고 수준의 액티브 노이즈 캔슬링.</> },
  { img: `${A}/sensor.webp`, label: <>새롭게 탑재된 심박 센서.</> },
  { img: `${A}/tips.webp`, label: <>온몸을 감싸는 공간 음향.</> },
  { img: `${A}/water.webp`, label: <>땀과 비에 강한 IP57.</> },
  { img: `${A}/case.webp`, label: <>한 번 충전으로 9시간.</> },
];

/* ---------- closer look data ---------- */
type CloserItem = { id: string; title: string; body: ReactNode; img: string };
const closerItems: CloserItem[] = [
  {
    id: "sound",
    title: "음질",
    img: `${A}/nozzle.webp`,
    body: (
      <p>
        <b>멀티포트 어쿠스틱 구조</b>가 공기 흐름을 정밀하게 제어해 저음은 더 깊게, 음장은
        더 넓게 만듭니다. 어떤 곡에서도 묻히는 음이 없습니다.
      </p>
    ),
  },
  {
    id: "fit",
    title: "핏과 착용감",
    img: `${A}/fit.webp`,
    body: (
      <p>
        귀 안쪽을 향해 회전된 이어팁이 <b>흔들림 없는 밀착</b>을 만듭니다. 폼이 융합된
        실리콘 팁은 XS부터 다섯 가지 사이즈로 제공됩니다.
      </p>
    ),
  },
  {
    id: "heart",
    title: "심박수 측정 기능",
    img: `${A}/sensor.webp`,
    body: (
      <p>
        초소형 광학 센서가 보이지 않는 빛을 초당 256회 내보내 <b>운동 중 심박수</b>를
        읽습니다.<sup>2</sup> 손목이 아닌 귀에서, 더 가까이.
      </p>
    ),
  },
  {
    id: "water",
    title: "먼지, 땀, 습기에 강한 방진 및 생활 방수 디자인",
    img: `${A}/water.webp`,
    body: (
      <p>
        이어버드와 케이스 모두 <b>IP57 등급</b>.<sup>3</sup> 땀에 젖는 러닝도, 갑작스러운
        소나기도 문제없습니다.
      </p>
    ),
  },
  {
    id: "touch",
    title: "터치 제어",
    img: `${A}/touch.webp`,
    body: (
      <p>
        스템을 <b>눌러서 재생·정지</b>, 위아래로 쓸어 음량 조절. 손끝 하나로 대부분의
        조작이 끝납니다.
      </p>
    ),
  },
  {
    id: "case",
    title: "충전 케이스",
    img: `${A}/case.webp`,
    body: (
      <p>
        내장 스피커와 초광대역 칩으로 <b>잃어버린 위치까지 찾아주는</b> 케이스. 무선 충전을
        지원하며 총 36시간을 담습니다.<sup>4</sup>
      </p>
    ),
  },
];

function CloserLook() {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useReveal<HTMLDivElement>();
  const activeImg = open ? closerItems.find((c) => c.id === open)!.img : `${A}/hero.webp`;
  return (
    <section className="kl-sec" id="closer" ref={ref}>
      <div className="kl-wrap">
        <p className="kl-eyebrow rv">디자인</p>
        <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
          보다 자세히
          <br />
          들여다보기.
        </h2>
        <div className="kl-closer">
          <div className="kl-chips">
            {closerItems.map((c, i) => (
              <button
                key={c.id}
                className="kl-chip rv"
                style={{ ["--d" as string]: `${i * 0.05}s` }}
                aria-expanded={open === c.id}
                onClick={() => setOpen(open === c.id ? null : c.id)}
              >
                <span className="kl-chip-head">
                  <span className="kl-chip-plus" aria-hidden="true" />
                  {c.title}
                </span>
                <span className="kl-chip-body">
                  <span className="kl-chip-inner">
                    {c.body}
                    <img className="kl-chip-img" src={c.img} alt="" loading="lazy" />
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="kl-viewer rv" aria-live="polite">
            {[`${A}/hero.webp`, ...closerItems.map((c) => c.img)]
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((src) => (
                <img key={src} src={src} alt="" className={src === activeImg ? "on" : ""} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- cutaway crossfade ---------- */
function Xray() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const reduced = useMemo(prefersReduced, []);
  const x = Math.min(1, Math.max(0, (progress - 0.25) / 0.5));
  return (
    <div className="kl-xray" ref={ref}>
      <div className="kl-xray-sticky">
        <div className="kl-xray-stage">
          <img src={`${A}/fit.webp`} alt="KLANG Pro 외관" style={{ opacity: reduced ? 0 : 1 - x }} />
          <img
            src={`${A}/cutaway.webp`}
            alt="KLANG Pro 내부 구조"
            style={{ opacity: reduced ? 1 : x }}
          />
        </div>
        <p className="kl-xray-cap">
          {x < 0.5 && !reduced ? (
            <>계속 스크롤해 안을 들여다보세요.</>
          ) : (
            <>
              <b>맞춤 설계 드라이버와 K1 칩</b>이 한 몸으로 움직이며 고해상도 3차원
              사운드를 만들고, 재생 왜곡은 들리지 않는 수준까지 낮춥니다.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* ---------- experience tabs ---------- */
const tabs = [
  {
    id: "touch",
    label: "터치 제어",
    img: `${A}/touch.webp`,
    desc: (
      <>
        <b>누르고, 쓸어올리는 것</b>만으로 재생·음량·통화를 제어합니다. 주머니 속 휴대폰은
        그대로 두세요.
      </>
    ),
  },
  {
    id: "fit",
    label: "핏",
    img: `${A}/fit.webp`,
    desc: (
      <>
        다섯 가지 사이즈의 폼 융합 팁이 <b>귀의 모양대로</b> 밀착합니다. 전력 질주에도
        빠지지 않습니다.
      </>
    ),
  },
  {
    id: "case",
    label: "케이스 · 위치 찾기",
    img: `${A}/case.webp`,
    desc: (
      <>
        케이스가 스스로 소리를 내고, 초광대역 칩이 <b>방향과 거리까지</b> 안내합니다. 소파
        틈에서도 찾아냅니다.
      </>
    ),
  },
  {
    id: "share",
    label: "함께 듣기",
    img: `${A}/dancer.webp`,
    desc: (
      <>
        친구의 KLANG을 가까이 대면 <b>듣던 음악이 그대로 공유</b>됩니다. 좋은 순간은 둘이서.
      </>
    ),
  },
];

function ExperienceTabs() {
  const [tab, setTab] = useState(tabs[0].id);
  const ref = useReveal<HTMLDivElement>();
  const active = tabs.find((t) => t.id === tab)!;
  return (
    <section className="kl-sec" ref={ref}>
      <div className="kl-wrap">
        <p className="kl-eyebrow rv">사용 경험</p>
        <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
          들리는 게, 다가 아닙니다.
        </h2>
        <div className="kl-tabs rv" role="tablist" aria-label="사용 경험 살펴보기">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className="kl-tab"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="kl-tab-stage rv" role="tabpanel">
          {tabs.map((t) => (
            <img key={t.id} src={t.img} alt={t.label} className={t.id === tab ? "on" : ""} />
          ))}
        </div>
        <p className="kl-tab-desc">{active.desc}</p>
      </div>
    </section>
  );
}

/* ---------- page ---------- */
export default function KlangPage() {
  const hiRef = useReveal<HTMLDivElement>();
  const ncRef = useReveal<HTMLDivElement>();
  const auRef = useReveal<HTMLDivElement>(0.2);
  const riseRef = useReveal<HTMLDivElement>(0.35);
  const fitRef = useReveal<HTMLDivElement>();
  const btRef = useReveal<HTMLDivElement>();
  const buyRef = useReveal<HTMLDivElement>();

  return (
    <div className="kl-site">
      <nav className="kl-nav" aria-label="KLANG Pro">
        <Link to="/" className="kl-nav-title" title="포트폴리오로 돌아가기">
          KLANG&nbsp;Pro
        </Link>
        <div className="kl-nav-links">
          <a href="#closer">개요</a>
          <a href="#specs" className="max-sm:hidden">
            제품 사양
          </a>
          <a href="#buy" className="kl-buy-pill">
            구입하기
          </a>
        </div>
      </nav>

      <HeroScrub />

      {/* 일단 핵심부터 */}
      <section className="kl-sec" ref={hiRef} style={{ paddingBottom: 40 }}>
        <div className="kl-wrap">
          <p className="kl-eyebrow rv">하이라이트</p>
          <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
            일단, 핵심부터.
          </h2>
        </div>
        <div className="kl-cards">
          {highlights.map((h, i) => (
            <figure className="kl-card rv" key={i} style={{ ["--d" as string]: `${i * 0.06}s`, margin: 0 }}>
              <figcaption className="kl-card-label">{h.label}</figcaption>
              <img src={h.img} alt="" loading="lazy" />
            </figure>
          ))}
        </div>
      </section>

      <CloserLook />

      {/* 지능형 소음 제어 */}
      <section className="kl-sec kl-dark" ref={ncRef}>
        <div className="kl-rings" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="kl-ring" style={{ ["--rd" as string]: `${i * 1.25}s` }} />
          ))}
        </div>
        <div className="kl-wrap kl-center" style={{ position: "relative" }}>
          <p className="kl-eyebrow rv">지능형 소음 제어</p>
          <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
            당신이 듣고 싶은
            <br />
            소리만.
          </h2>
          <p className="kl-body rv" style={{ ["--d" as string]: "0.16s" }}>
            업그레이드된 어쿠스틱 차폐 구조와 초저소음 마이크가 주변의 소음을 실시간으로
            상쇄합니다. 지하철에서도, 카페에서도 <b>당신과 음악 사이에는 아무것도 없습니다.</b>
          </p>
          <div className="kl-stats">
            <div className="rv">
              <div className="kl-stat-num">
                <CountUp to={2} suffix="배" />
              </div>
              <p className="kl-stat-cap">
                더 강력해진 노이즈 캔슬링
                <br />
                (KLANG 2세대 대비)<sup>1</sup>
              </p>
            </div>
            <div className="rv" style={{ ["--d" as string]: "0.1s" }}>
              <div className="kl-stat-num">
                <CountUp to={42} suffix="dB" duration={1700} />
              </div>
              <p className="kl-stat-cap">
                최대 소음 감쇠량
                <br />
                (저역대 기준 실험실 측정)<sup>1</sup>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 오디오 성능 — 타이포 + 부상 이미지 */}
      <section className="kl-sec kl-audio" ref={auRef} style={{ paddingBottom: 0 }}>
        <div className="kl-wrap kl-center">
          <p className="kl-eyebrow rv">오디오 성능</p>
          <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s", fontSize: "clamp(40px, 7.4vw, 88px)" }}>
            사운드는, 물리학.
          </h2>
          <p className="kl-body rv" style={{ ["--d" as string]: "0.16s" }}>
            KLANG이 직접 설계한 <b>K1 칩</b>이 완전히 새로운 어쿠스틱 구조를 구동합니다.
            새벽 러닝의 플레이리스트부터 밤늦은 통화까지, 무엇을 듣든 소리가 온몸을
            감싸는 경험을 하게 됩니다.
          </p>
        </div>
        <div className="kl-rise-frame" ref={riseRef}>
          <img src={`${A}/tips.webp`} alt="KLANG Pro 이어팁 클로즈업" loading="lazy" />
        </div>
      </section>

      <Xray />

      {/* 피트니스 */}
      <section className="kl-sec" ref={fitRef}>
        <div className="kl-wrap">
          <p className="kl-eyebrow rv">피트니스</p>
          <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
            심박까지 듣는 이어폰.
          </h2>
          <p className="kl-body rv" style={{ ["--d" as string]: "0.16s" }}>
            달리는 동안 귀에서 심박수와 칼로리를 읽습니다.<sup>2</sup> 손목의 워치가 없어도,
            운동 기록은 끊기지 않습니다.
          </p>
          <div className="kl-fit-grid">
            <div className="kl-tile rv" style={{ aspectRatio: "16/10" }}>
              <img src={`${A}/runner.webp`} alt="KLANG Pro를 착용하고 달리는 러너" loading="lazy" />
              <p className="kl-tile-cap">전력 질주에도, 제자리에.</p>
            </div>
            <div className="kl-tile rv" style={{ ["--d" as string]: "0.1s", aspectRatio: "16/10" }}>
              <img src={`${A}/sensor.webp`} alt="심박 센서 클로즈업" loading="lazy" />
              {[0, 1].map((i) => (
                <span key={i} className="kl-pulse" style={{ ["--rd" as string]: `${i * 0.9}s` }} />
              ))}
              <p className="kl-tile-cap">초당 256회, 보이지 않는 빛.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 배터리 */}
      <section className="kl-sec kl-batt" id="specs" ref={btRef}>
        <div className="kl-wrap kl-center">
          <p className="kl-eyebrow rv">배터리</p>
          <h2 className="kl-h2 rv" style={{ ["--d" as string]: "0.08s" }}>
            아침부터, 다시 아침까지.
          </h2>
          <div className="kl-stats" style={{ color: "var(--kl-ink)" }}>
            <div className="rv">
              <div className="kl-stat-num">
                <CountUp to={9} suffix="시간" />
              </div>
              <p className="kl-stat-cap">
                한 번 충전 시 청취
                <br />
                (노이즈 캔슬링 켠 상태)<sup>4</sup>
              </p>
            </div>
            <div className="rv" style={{ ["--d" as string]: "0.1s" }}>
              <div className="kl-stat-num">
                <CountUp to={36} suffix="시간" duration={1700} />
              </div>
              <p className="kl-stat-cap">
                케이스 포함 총 사용 시간
                <br />
                (무선 충전 지원)<sup>4</sup>
              </p>
            </div>
          </div>
        </div>
      </section>

      <ExperienceTabs />

      {/* 구입 */}
      <section className="kl-sec" id="buy" ref={buyRef} style={{ paddingTop: 0 }}>
        <div className="kl-wrap">
          <div className="kl-buy-card rv">
            <img src={`${A}/hero-lg.webp`} alt="KLANG Pro" loading="lazy" />
            <div>
              <h2 className="kl-h2" style={{ fontSize: "clamp(28px,3.6vw,40px)" }}>
                KLANG Pro
              </h2>
              <p className="kl-price">₩329,000</p>
              <ul className="kl-buy-perks">
                <li>무료 배송 · 무료 각인</li>
                <li>30일 무료 체험, 이유 불문 반품</li>
                <li>화이트 단일 색상 · 이어팁 5종 동봉</li>
              </ul>
              <a
                className="kl-hero-cta"
                href="#buy"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
              >
                구입하기
              </a>
              <p className="kl-demo-note">
                포트폴리오 데모 페이지로, 실제 구매는 지원되지 않습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="kl-foot">
        <div className="kl-wrap" style={{ padding: "48px 22px" }}>
          <ol className="kl-footnotes">
            <li>
              1. 노이즈 캔슬링 성능 수치는 가상의 실험실 조건을 가정한 예시 값입니다.
            </li>
            <li>2. 심박수 측정은 의료 목적이 아닌 피트니스 참고용 기능입니다.</li>
            <li>3. IP57 등급은 통제된 실험 조건 기준이며 효과는 영구적이지 않습니다.</li>
            <li>4. 배터리 시간은 사용 환경과 설정에 따라 달라질 수 있습니다.</li>
          </ol>
          <p className="kl-footnotes" style={{ marginTop: 20 }}>
            KLANG은 실존하지 않는 가상 브랜드이며, 이 페이지는 AI 생성 에셋으로 제작된
            포트폴리오 데모입니다. Concept demo — all specs illustrative.
          </p>
          <p style={{ marginTop: 24 }}>
            <Link to="/" className="kl-footnotes" style={{ textDecoration: "underline" }}>
              ← Portfolio로 돌아가기
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
