import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import Lenis from "lenis";
import { useTheme } from "./useTheme";
import "./muryeop.css";

const A = "/assets/muryeop";

/* ── 섹션 인덱스 (레일에 상주) ─────────────────────────────── */
const NAV = [
  { id: "hero", no: "01", ko: "무렵 01", en: "Overview" },
  { id: "concept", no: "02", ko: "빛의 개념", en: "Light concept" },
  { id: "home", no: "03", ko: "두 얼굴", en: "At home" },
  { id: "finish", no: "04", ko: "마감", en: "Finishes" },
  { id: "dial", no: "05", ko: "밝기 4단", en: "Brightness" },
  { id: "spec", no: "06", ko: "제품 상세", en: "Specifications" },
  { id: "kit", no: "07", ko: "구성품·가격", en: "Kit & price" },
  { id: "end", no: "08", ko: "마무리", en: "End" },
];

/*
 * ── 03 두 얼굴 ────────────────────────────────────────────
 * 같은 프레임, 세 가지 상태. 문장으로 설명하지 않고 사진만 바꾼다.
 * 꺼진 낮 컷이 '오브제', 켜진 두 컷이 '조명 + 색이 바뀐다'를 동시에 말한다.
 */
const DUAL = [
  { k: "day", file: "dual-day", label: "낮", sub: "꺼짐" },
  { k: "warm", file: "dual-warm", label: "밤", sub: "2200K" },
  { k: "cool", file: "dual-cool", label: "밤", sub: "4000K" },
];

const GALLERY = [
  { file: "space-bedside", label: "머리맡" },
  { file: "space-table", label: "식탁" },
  { file: "space-porch", label: "툇마루" },
  { file: "object-front", label: "단독" },
];

/* ── 04 마감 ───────────────────────────────────────────────── */
/* 네 이름 모두 빛이 옅어지는 순간에서 가져왔다. '그레이' 같은 색 이름은 섞지 않는다. */
const FINISH = [
  {
    file: "finish-bakmyeong",
    ko: "박명",
    en: "BAKMYEONG",
    hint: "날이 새기 직전",
    ex: 50,
    ey: 30,
  },
  { file: "finish-jae", ko: "재", en: "JAE", hint: "다 타고 남은 뒤", ex: 50, ey: 33 },
  {
    file: "finish-noeul",
    ko: "노을",
    en: "NOEUL",
    hint: "해가 넘어갈 때",
    ex: 47,
    ey: 26,
  },
  {
    file: "finish-geumeum",
    ko: "그믐",
    en: "GEUMEUM",
    hint: "달이 없는 밤",
    ex: 50,
    ey: 28,
    pick: true,
  },
];

/* ── 05 밝기 4단 ───────────────────────────────────────────── */
/* Ambientec·Tala·Gantri 3사 공통 — 밝기를 루멘 단독으로 팔지 않고
   '단계 × 지속시간'으로 번역한다. 거기에 국내 문법(평수)을 얹는다. */
const STEPS = [
  { n: "1단", lm: 12, k: "1800K", hr: 90, emit: 0.28, say: "자다 깨서 물 마시러 갈 만큼" },
  { n: "2단", lm: 60, k: "2000K", hr: 42, emit: 0.5, say: "머리맡에서 책 한 쪽 읽을 만큼" },
  { n: "3단", lm: 160, k: "2400K", hr: 18, emit: 0.76, say: "원목 식탁 위 두 사람 몫" },
  {
    n: "4단",
    lm: 320,
    k: "2700K",
    hr: 9,
    emit: 1,
    say: "협탁에서 1m, 6~8평 침실의 취침등",
  },
];
const MAX_HR = 90;

/* ── 06 제품 상세 ──────────────────────────────────────────── */
type Row = { no: string; label: string; value: string; facet?: string; art: string };
const SPEC: Row[] = [
  { no: "01", label: "색온도", value: "1800 – 2700K · 밝기 4단 연동", facet: "색온도", art: "temp" },
  { no: "02", label: "광속", value: "12 – 320 lm", facet: "밝기", art: "lumen" },
  { no: "03", label: "연색성", value: "Ra 97", art: "cri" },
  { no: "04", label: "배터리", value: "10,000mAh · 최장 90시간", facet: "밝기", art: "batt" },
  { no: "05", label: "충전", value: "USB-C · 마그네틱 베이스 · 3.5시간", art: "usb" },
  { no: "06", label: "방수", value: "IP44 (충전 베이스는 실내 전용)", facet: "방수", art: "ip" },
  { no: "07", label: "크기", value: "Ø132 × H262 mm", art: "dim" },
  { no: "08", label: "무게", value: "690 g", art: "mass" },
  { no: "09", label: "플리커", value: "플리커프리 · SVM 0.4 이하", facet: "인증", art: "flick" },
  { no: "10", label: "KC 인증", value: "KC-00000-00000 (데모 표기)", facet: "인증", art: "kc" },
  { no: "11", label: "품질보증", value: "구입일로부터 2년 무상", facet: "인증", art: "as" },
];
const FACETS = ["색온도", "밝기", "방수", "인증"];

/* ── 07 구성품 ─────────────────────────────────────────────── */
const KIT = [
  { no: "01", ko: "무렵 01 본체", x: 54, y: 24 },
  { no: "02", ko: "마그네틱 충전 베이스", x: 38, y: 51 },
  { no: "03", ko: "USB-C 케이블 1.5m", x: 64, y: 50 },
  { no: "04", ko: "리넨 파우치", x: 50, y: 75 },
];

/* ─────────────────────────────────────────────────────────── */

const RV = ".wipe, .rise";

/*
 * 리빌. 05·06은 translateY+opacity에 --d 스태거였고, 07은 clip-path 가로 와이프다.
 *
 * 함정: clip-path로 완전히 잘린 요소는 IntersectionObserver가 교차 면적을 0으로
 * 보고 영영 isIntersecting을 안 준다. 그래서 마운트 시점에 이미 화면 안이던
 * 히어로만 살아나고, 스크롤로 들어오는 마감 카드는 영원히 잘린 채 남았다
 * (라이트 모드에서 카드가 통째로 안 보이던 버그의 원인).
 *
 * → 잘린 요소를 직접 관찰하지 않는다. 부모를 관찰하고, 부모가 들어오면
 *   그 안의 대상들을 연다. 부모는 clip-path가 없으니 판정이 정상이다.
 *
 * 함정 2: 열림 표시를 class로 달면 React가 도로 지운다. className이 상태에
 * 따라 바뀌는 요소(.mu-kitfig의 zoom)는 리렌더 때 React가 문자열 전체를 다시
 * 쓰는데, 그 안에 없는 .in이 같이 날아간다 — 구성품 이미지가 목록에 마우스를
 * 올렸다 떼면 사라지던 원인이다. 그래서 React가 절대 관리하지 않는 data 속성에
 * 표시를 단다. CSS는 [data-rv]로 받는다.
 */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = [...root.querySelectorAll<HTMLElement>(RV)];
    const open = (n: HTMLElement) => {
      n.dataset.rv = "";
    };
    const showAll = () => targets.forEach(open);

    if (!("IntersectionObserver" in window)) {
      showAll();
      return;
    }

    /* 대상마다 부모를 프록시로 삼는다. 형제끼리 부모를 공유하면 한 번에 열린다. */
    const proxies = new Set<HTMLElement>();
    targets.forEach((n) => proxies.add(n.parentElement ?? n));

    let io: IntersectionObserver;
    try {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            const p = e.target as HTMLElement;
            if (p.matches(RV)) open(p);
            p.querySelectorAll<HTMLElement>(RV).forEach(open);
            io.unobserve(p);
          }),
        { threshold: 0.06, rootMargin: "0px 0px -4% 0px" },
      );
      proxies.forEach((p) => io.observe(p));
    } catch {
      showAll();
      return;
    }

    /* 그래도 못 연 게 남으면 강제로 연다 — 안 움직이는 게 안 보이는 것보다 낫다. */
    const safety = window.setTimeout(() => {
      targets.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) open(n);
      });
    }, 1200);

    return () => {
      window.clearTimeout(safety);
      io.disconnect();
    };
  }, []);
  return ref;
}

/*
 * 부드러운 관성 스크롤. reduced-motion이면 아예 붙이지 않는다.
 *
 * Lenis가 스크롤을 대신 관리하기 때문에 브라우저 기본 앵커 점프가 죽는다
 * (레일 인덱스 9개가 전부 먹통이 됐다). 그래서 #앵커 클릭을 가로채
 * lenis.scrollTo로 넘긴다. Lenis가 없을 때는 이 리스너 자체가 없으므로
 * 브라우저 기본 동작이 그대로 산다.
 */
function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.05, wheelMultiplier: 0.9 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      /* 탭이 백그라운드로 밀리면 rAF가 멈춰 관성 스크롤이 영영 도착하지
         않는다. 보이지 않는 상태에서는 애니메이션 없이 즉시 이동시킨다. */
      const instant = document.visibilityState !== "visible";
      lenis.scrollTo(target, { offset: 0, immediate: instant });
      history.replaceState(null, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}

/* 레일이 세로 기둥인지(데스크톱) 하단 바인지(모바일). 다이얼의 축이 뒤집힌다. */
function useNarrow() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    on();
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

/* 레일 인덱스의 활성 항목 */
function useActive() {
  const [active, setActive] = useState("hero");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => {
        const hit = es
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.2, 0.6] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

/* 06의 미니 도면. 렌더에 글자를 넣을 수 없으므로 전부 SVG로 그린다. */
function Art({ kind }: { kind: string }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: 1 } as const;
  switch (kind) {
    case "temp":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <defs>
            <linearGradient id="mu-g1" x1="0" x2="1">
              <stop offset="0" stopColor="#d4823f" />
              <stop offset="1" stopColor="#c9d6ea" />
            </linearGradient>
          </defs>
          <rect x="2" y="13" width="84" height="8" fill="url(#mu-g1)" />
        </svg>
      );
    case "lumen":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          {[6, 20, 34, 48].map((x, i) => (
            <rect key={x} x={x} y={26 - i * 6} width="9" height={4 + i * 6} {...s} />
          ))}
        </svg>
      );
    case "cri":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <path d="M4 26 L20 8 L36 26 Z" {...s} />
          <path d="M40 17 h44" {...s} />
        </svg>
      );
    case "batt":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <rect x="4" y="10" width="60" height="14" {...s} />
          <rect x="6" y="12" width="42" height="10" fill="currentColor" />
          <rect x="64" y="14" width="4" height="6" fill="currentColor" />
        </svg>
      );
    case "usb":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <rect x="4" y="13" width="22" height="8" rx="4" {...s} />
          <path d="M26 17 h58" {...s} />
        </svg>
      );
    case "ip":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <path d="M18 6 C 9 17 5 21 5 25 a13 13 0 0 0 26 0 c0-4-4-8-13-19Z" {...s} />
          <path d="M40 12 h44 M40 22 h30" {...s} />
        </svg>
      );
    case "dim":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <path d="M8 4 v26 M80 4 v26" {...s} />
          <path d="M8 17 h72 M12 13 l-4 4 4 4 M76 13 l4 4-4 4" {...s} />
        </svg>
      );
    case "mass":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <path d="M22 10 h44 l8 18 H14Z" {...s} />
          <circle cx="44" cy="7" r="4" {...s} />
        </svg>
      );
    case "flick":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <path d="M2 17 h84" {...s} />
          <path d="M2 25 q11 -16 22 0 t22 0 t22 0 t18 0" {...s} opacity="0.35" />
        </svg>
      );
    case "kc":
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <circle cx="17" cy="17" r="12" {...s} />
          <path d="M36 8 h48 M36 17 h48 M36 26 h30" {...s} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 88 34" aria-hidden="true">
          <circle cx="17" cy="17" r="12" {...s} />
          <path d="M17 10 v8 l5 4" {...s} />
          <path d="M40 17 h44" {...s} />
        </svg>
      );
  }
}

/*
 * ── 03 두 얼굴 ────────────────────────────────────────────
 * 이 섹션은 문장으로 설득하지 않는다. 같은 프레임을 세 상태로 갈아끼우는 것만으로
 * "꺼져 있어도 오브제, 켜면 공간에 맞춰 색이 바뀌는 조명"이 읽히게 한다.
 * 그래서 리드 문단이 없고 텍스트는 헤드라인과 칩 라벨뿐이다.
 */
function DualRole() {
  const [i, setI] = useState(0);
  const [emblaRef] = useEmblaCarousel({ align: "start", loop: false, dragFree: true });

  return (
    <section id="home" className="mu-sec mu-home">
      <div className="mu-homehead rise">
        <p className="mu-tag lat">03 — At home</p>
        <h2 className="mu-h">
          켜면 조명,
          <br />
          끄면 오브제
        </h2>
      </div>

      <div className="mu-swap">
        {DUAL.map((d, n) => (
          <motion.img
            key={d.k}
            src={`${A}/${d.file}.webp`}
            alt={
              d.k === "day"
                ? "낮, 꺼진 채 콘솔 위에 놓인 무렵 01"
                : `밤, ${d.sub}으로 켜져 벽에 빛 웅덩이를 만든 무렵 01`
            }
            loading={n === 0 ? "eager" : "lazy"}
            initial={false}
            animate={{ opacity: i === n ? 1 : 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>

      <div className="mu-swapbar">
        {DUAL.map((d, n) => (
          <button
            key={d.k}
            className="mu-chip"
            aria-pressed={i === n}
            onClick={() => setI(n)}
          >
            {d.label} · {d.sub}
          </button>
        ))}
      </div>

      <div className="mu-gal" ref={emblaRef}>
        <div className="mu-gal-track">
          {GALLERY.map((g) => (
            <figure className="mu-gal-slide" key={g.file}>
              <img src={`${A}/${g.file}.webp`} alt={g.label} loading="lazy" />
              <figcaption className="mu-tag">{g.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 02 빛 개념 (10초 영상) ────────────────────────────────── */
function ConceptVideo() {
  const vid = useRef<HTMLVideoElement | null>(null);
  const [k, setK] = useState(1800);
  const [prog, setProg] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = vid.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) {
            el.play().catch(() => {
              /* 자동재생이 막히면 포스터가 남고 '다시 보기'로 시작할 수 있다 */
            });
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* 밝기가 오르는 구간(2.5s→8.5s)에서만 색온도가 1800→2700으로 따라 오른다.
     이 상관을 눈으로 읽히게 하는 게 이 영상이 10초인 이유다. */
  const onTime = useCallback(() => {
    const el = vid.current;
    if (!el || !el.duration) return;
    setProg(el.currentTime / el.duration);
    const r = Math.min(1, Math.max(0, (el.currentTime - 2.5) / 6));
    setK(Math.round((1800 + r * 900) / 10) * 10);
  }, []);

  const replay = () => {
    const el = vid.current;
    if (!el) return;
    el.currentTime = 0;
    setDone(false);
    el.play().catch(() => {});
  };

  return (
    <section id="concept" className="mu-sec mu-concept">
      <div className="mu-vidwrap wipe">
        <video
          ref={vid}
          muted
          playsInline
          preload="metadata"
          poster={`${A}/light-up-poster.webp`}
          onTimeUpdate={onTime}
          onEnded={() => setDone(true)}
        >
          <source src={`${A}/light-up.mp4`} type="video/mp4" />
        </video>
      </div>

      <div className="mu-vidbar">
        <span className="mu-kread">{k.toLocaleString()}K</span>
        <span className="mu-track">
          <i style={{ transform: `scaleX(${prog})`, transition: "transform .25s linear" }} />
        </span>
        <button className="mu-replay" onClick={replay}>
          {done ? "다시 보기 ↻" : "10초"}
        </button>
      </div>

      <div className="mu-concept-txt">
        <div className="rise">
          <p className="mu-tag lat">02 — Light concept</p>
          <h2 className="mu-h">
            켜지는 게 아니라
            <br />
            번집니다
          </h2>
          <p className="mu-lead">
            유백 폴리카보네이트 돔이 광원을 통째로 덮습니다. 눈에 닿는 것은 LED가 아니라 돔 전체가
            머금은 빛이라, 어느 각도에서 봐도 눈부신 점이 없습니다. 돔 아래로 떨어지는 빛은 지름
            1m 남짓의 둥근 웅덩이를 만들고, 그 바깥은 건드리지 않습니다.
          </p>
          <p className="mu-lead">
            영상 10초 동안 밝기는 0에서 100%로, 색온도는 1800K에서 2700K로 함께 올라갑니다. 둘이
            같이 움직인다는 것 하나를 보여주려고 10초를 썼습니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── 05 밝기 4단 ───────────────────────────────────────────── */
function Brightness({ onStep }: { onStep: (v: number) => void }) {
  const [i, setI] = useState(3);
  const pick = (n: number) => {
    setI(n);
    onStep(STEPS[n].emit);
  };
  return (
    <section id="dial" className="mu-sec mu-dialsec">
      <div className="mu-dialhead rise">
        <p className="mu-tag lat">05 — Brightness</p>
        <h2 className="mu-h">밝기가 곧 시간입니다</h2>
        <p className="mu-lead">
          루멘만 적힌 표는 몇 시간 쓸 수 있는지 알려주지 않습니다. 이 램프는 네 단계뿐이고, 단을
          고르면 색온도와 지속시간이 같이 정해집니다. 단을 눌러보세요 — 화면도 같이 어두워집니다.
        </p>
        <p className="mu-plain">
          <b>{STEPS[i].n}</b> {STEPS[i].lm}lm — {STEPS[i].say}
        </p>
      </div>

      <div className="mu-bars">
        <div className="mu-chips" role="group" aria-label="밝기 단계">
          {STEPS.map((s, n) => (
            <button
              key={s.n}
              className="mu-chip"
              aria-pressed={i === n}
              onClick={() => pick(n)}
            >
              {s.n} · {s.lm}lm
            </button>
          ))}
        </div>

        {STEPS.map((s, n) => (
          <div className={`mu-bar${i === n ? " on" : ""}`} key={s.n}>
            <b>{s.n}</b>
            <span className="mu-barwrap">
              <motion.i
                initial={false}
                animate={{ scaleX: s.hr / MAX_HR }}
                transition={{ type: "spring", stiffness: 190, damping: 26 }}
                style={{ transformOrigin: "left", width: "100%" }}
              />
            </span>
            <span>{s.hr}시간</span>
            <span>{s.k}</span>
          </div>
        ))}
        <p className="mu-tag" style={{ marginTop: 14 }}>
          지속시간은 완충 기준이며 데모용 예시 값입니다.
        </p>
      </div>
    </section>
  );
}

/* ── 08 구성품 ─────────────────────────────────────────────── */
function Kit() {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <section id="kit" className="mu-sec mu-kit">
      <div className={`mu-kitfig wipe${hot ? " zoom" : ""}`}>
        <img src={`${A}/kit-flatlay.webp`} alt="무렵 01 구성품 네 가지" loading="lazy" />
        {KIT.map((k) => (
          <span
            key={k.no}
            className={`mu-hot${hot === k.no ? " on" : ""}`}
            style={{ left: `${k.x}%`, top: `${k.y}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="mu-kittxt rise">
        <p className="mu-tag lat">08 — Kit &amp; price</p>
        <h2 className="mu-h">상자를 열면 네 가지</h2>
        <ul className="mu-items">
          {KIT.map((k) => (
            <li key={k.no} onMouseEnter={() => setHot(k.no)} onMouseLeave={() => setHot(null)}>
              <b>{k.no}</b>
              <span>{k.ko}</span>
            </li>
          ))}
        </ul>

        <div className="mu-price">
          <s>179,000원</s>
          <b>129,000원</b>
          <span className="mu-off">28%</span>
        </div>

        <div className="mu-rewards">
          <div className="mu-reward">
            1개<b>129,000원</b>
          </div>
          <div className="mu-reward">
            2개 세트<b>236,000원</b>
          </div>
          <div className="mu-reward">
            2개 + 여분 베이스<b>268,000원</b>
          </div>
        </div>

        <div className="mu-refund">
          <div>
            <h4>반환 가능</h4>
            수령 후 7일 이내, 구성품이 모두 있고 사용 흔적이 없는 경우.
          </div>
          <div>
            <h4>반환 불가</h4>
            사용으로 가치가 떨어진 경우, 구성품이 빠진 경우, 단순 변심 후 7일이 지난 경우.
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function MuryeopPage() {
  const page = useReveal<HTMLDivElement>();
  const active = useActive();
  const { theme, toggle, knobRef } = useTheme();
  const [step, setStep] = useState(1);
  const [facet, setFacet] = useState<string | null>(null);
  const dragged = useRef(false);
  const narrow = useNarrow();
  useLenis();

  const isDark = theme === "dark";
  /* 세로 기둥에서는 아래=밤, 하단 바에서는 오른쪽=밤 */
  const travel = narrow ? 28 : 38;

  const onKnob = useCallback(() => {
    /* 드래그 직후의 click은 삼킨다 — 안 그러면 놓자마자 두 번 뒤집힌다 */
    if (dragged.current) return;
    toggle();
  }, [toggle]);

  return (
    <div
      className="mu-site"
      ref={page}
      style={{ ["--mu-step" as string]: String(step) }}
    >
      <div className="mu-ambient" aria-hidden="true" />

      {/* ── 좌측 레일 ─────────────────────────────────────── */}
      <aside className="mu-rail">
        <Link to="/" className="mu-back">
          ← Portfolio
        </Link>

        <a href="#hero" className="mu-brand">
          <b className="mu-display">무렵</b>
          <i>MURYEOP 01</i>
        </a>

        <ul className="mu-idx">
          {NAV.map((n) => (
            <li key={n.id} className={active === n.id ? "on" : undefined}>
              {active === n.id && <motion.span layoutId="mu-mark" className="mu-mark" />}
              <a href={`#${n.id}`}>
                <span>{n.no}</span>
                <span>
                  {n.ko}
                  <br />
                  <em>{n.en}</em>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mu-railfoot">
          {/* 테마 다이얼 — 스위치가 아니라 디밍 다이얼의 형태다 */}
          <div className="mu-dial">
            <div
              className="mu-slot"
              onClick={onKnob}
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? "밤 모드 — 눌러서 낮으로" : "낮 모드 — 눌러서 밤으로"}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle();
                }
              }}
            >
              <motion.span
                ref={knobRef as React.Ref<HTMLSpanElement>}
                className="mu-knob"
                drag={narrow ? "x" : "y"}
                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                dragElastic={0.55}
                dragMomentum={false}
                onDragStart={() => {
                  dragged.current = true;
                }}
                onDragEnd={(_, info) => {
                  /* 아래(또는 오른쪽)로 끌면 밤. 임계 이상일 때만 뒤집는다. */
                  const d = narrow ? info.offset.x : info.offset.y;
                  const want = d > 10 ? "dark" : d < -10 ? "light" : theme;
                  if (want !== theme) toggle();
                  window.setTimeout(() => {
                    dragged.current = false;
                  }, 40);
                }}
                animate={
                  narrow ? { x: isDark ? travel : 0, y: 0 } : { y: isDark ? travel : 0, x: 0 }
                }
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            </div>
            <span className="mu-dialread">
              <b>{isDark ? "1800K" : "2700K"}</b>
              <i>{isDark ? "밤 · 촛불색" : "낮 · 전구색"}</i>
            </span>
          </div>

          <a className="mu-cta" href="#kit">
            <span>펀딩 알림 신청</span>
            <span aria-hidden="true">→</span>
          </a>

          <p className="mu-railnote">
            무렵은 자체 기획 컨셉이며 표기된 수치·인증번호는 예시입니다.
            <br />
            © 2026 PRODUCT FILM
          </p>
        </div>
      </aside>

      {/* ── 우측 열 ───────────────────────────────────────── */}
      <main className="mu-main">
        {/* 01 히어로 */}
        <section id="hero" className="mu-hero">
          <img
            className="mu-hero-img"
            src={`${A}/hero-dusk.webp`}
            alt="해가 넘어간 직후, 창가 협탁 위에 꺼진 채 놓인 무렵 01"
            fetchPriority="high"
          />
          <span
            className="mu-emit"
            style={{ ["--emit-x" as string]: "69%", ["--emit-y" as string]: "24%" }}
            aria-hidden="true"
          />
          <span className="mu-hero-scrim" aria-hidden="true" />

          <div className="mu-hero-txt">
            <p className="mu-tag lat wipe">Portable table lamp · 2026</p>
            <h1 className="wipe" style={{ ["--wd" as string]: "0.1s" }}>
              어두워질수록,
              <br />
              따뜻해집니다
            </h1>
            <p className="mu-lead rise" style={{ ["--wd" as string]: "0.42s" }}>
              밝기를 한 단계 내릴 때마다 색온도도 같이 내려갑니다. 2700K에서 1800K까지 네 단계.
              방이 어두워지는 게 아니라 저녁이 깊어집니다.
            </p>
            <p className="mu-credit rise" style={{ ["--wd" as string]: "0.5s" }}>
              무렵 01 — 포터블 테이블 램프 · Design 윤용규, 2026
            </p>
          </div>

          <a className="mu-jump" href="#spec">
            사양으로 바로 가기 ↓
          </a>
        </section>

        {/* 02 빛 개념 */}
        <ConceptVideo />

        {/* 03 두 얼굴 */}
        <DualRole />

        {/* 04 마감 */}
        <section id="finish" className="mu-sec mu-finish">
          <div className="mu-finish-head rise">
            <p className="mu-tag lat">04 — Finishes</p>
            <h2 className="mu-h">네 가지 마감</h2>
            <p className="mu-lead">
              돔은 네 마감 모두 같은 유백색입니다. 바뀌는 것은 알루미늄 바디뿐이고, 이름은
              색이 아니라 빛이 옅어지는 순간에서 가져왔습니다.
            </p>
          </div>

          <div className="mu-cards">
            {FINISH.map((f) => (
              <button className="mu-card wipe" key={f.file} type="button">
                <span className="mu-card-fig">
                  {f.pick && <span className="mu-badge">디자이너 기본값</span>}
                  <img
                    src={`${A}/${f.file}.webp`}
                    alt={`무렵 01 ${f.ko} 마감`}
                    loading="lazy"
                    style={{
                      ["--emit-x" as string]: `${f.ex}%`,
                      ["--emit-y" as string]: `${f.ey}%`,
                    }}
                  />
                  <span
                    style={{
                      ["--emit-x" as string]: `${f.ex}%`,
                      ["--emit-y" as string]: `${f.ey}%`,
                    }}
                  />
                </span>
                <span className="mu-card-cap">
                  <b>{f.ko}</b>
                  <span>{f.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* 05 밝기 */}
        <Brightness onStep={setStep} />

        {/* 06 사양 */}
        <section id="spec" className="mu-sec mu-specsec">
          <div className="mu-spechead rise">
            <p className="mu-tag lat">06 — Specifications</p>
            <h2 className="mu-h">제품 상세 사양</h2>
            <p className="mu-lead" style={{ marginLeft: "auto" }}>
              예외까지 함께 적었습니다. IP44는 본체 기준이고, 충전 베이스는 실내 전용입니다.
            </p>
          </div>

          <div className="mu-facets">
            {FACETS.map((f) => (
              <button
                key={f}
                className="mu-chip"
                aria-pressed={facet === f}
                onClick={() => setFacet(facet === f ? null : f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div>
            {SPEC.map((r) => (
              <div
                className={`mu-row${facet && r.facet !== facet ? " dim" : ""}`}
                key={r.no}
              >
                <b>{r.no}</b>
                <span>{r.label}</span>
                <em>{r.value}</em>
                <Art kind={r.art} />
              </div>
            ))}
          </div>
        </section>

        {/* 07 구성품 */}
        <Kit />

        {/* 08 마무리 — 밴드가 아니라 여백 */}
        <section id="end" className="mu-end">
          <div className="mu-endfig">
            <img src={`${A}/object-front.webp`} alt="무렵 01" loading="lazy" />
            <span
              className="mu-emit"
              style={{
                ["--emit-x" as string]: "50%",
                ["--emit-y" as string]: "32%",
                width: "120%",
              }}
              aria-hidden="true"
            />
          </div>
          <p>
            무렵 01 — 포터블 테이블 램프
            <br />
            1800 – 2700K · 12 – 320lm · IP44
          </p>
        </section>
      </main>
    </div>
  );
}
