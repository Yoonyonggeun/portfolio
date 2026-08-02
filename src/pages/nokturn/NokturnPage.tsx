import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";

import { useSmoothScroll } from "../../lib/useSmoothScroll";
import { useTheme } from "./useTheme";
import ThemeToggle from "./ThemeToggle";
import { asset } from "./assets";
import { FESTIVAL, FILMS, NOTES, PASSES } from "./data";
import Lineup from "./Lineup";
import Timetable from "./Timetable";
import Venues from "./Venues";
import "./nokturn.css";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/* ── 개막까지 남은 시간 ─────────────────────────────────────── */
function useCountdown(iso: string) {
  const [left, setLeft] = useState(() => Math.max(0, +new Date(iso) - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, +new Date(iso) - Date.now())), 1000);
    return () => clearInterval(id);
  }, [iso]);

  const s = Math.floor(left / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: String(Math.floor((s % 86400) / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((s % 3600) / 60)).padStart(2, "0"),
    seconds: String(s % 60).padStart(2, "0"),
  };
}

/* ── 히어로 ──────────────────────────────────────────────────── */
function Hero() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const t = useCountdown(FESTIVAL.opensAt);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      /*
       * SplitText의 mask:"lines" — 각 줄을 overflow:hidden 래퍼로 감싼다.
       * 그래서 글자가 '아래에서 밀려 올라오는' 게 아니라 '가려진 곳에서
       * 드러나는' 것처럼 보인다. 직접 구현하면 줄바꿈 재계산이 지옥인데
       * autoSplit이 폰트 로드와 리사이즈 때 알아서 다시 쪼갠다.
       */
      const split = SplitText.create(".nk-hero-title", {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        linesClass: "nk-splitline",
      });

      const tl = gsap.timeline({ delay: 0.15 });
      tl.from(split.lines, {
        yPercent: 115,
        duration: 1.05,
        ease: "expo.out",
        stagger: 0.09,
      })
        .from(".nk-hero-meta > *", { y: 18, opacity: 0, duration: 0.7, stagger: 0.06, ease: "power3.out" }, "-=0.6")
        .from(".nk-hero-count", { opacity: 0, duration: 0.6 }, "-=0.4");

      // 스크롤에 따라 히어로가 살짝 가라앉고 어두워진다 (패럴랙스 + 디밍)
      gsap.to(".nk-hero-media", {
        yPercent: 14,
        scale: 1.06,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".nk-hero-veil", {
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      return () => split.revert();
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <header className="nk-hero" ref={root}>
      <div className="nk-hero-media">
        <video
          ref={videoRef}
          className="nk-hero-video"
          src={asset("film-hero")}
          poster={asset("still-hall")}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <span className="nk-hero-veil" aria-hidden="true" />
        <span className="nk-grain" aria-hidden="true" />
      </div>

      <div className="nk-wrap nk-hero-inner">
        <p className="nk-hero-edition">
          {FESTIVAL.edition} · {FESTIVAL.nameKo}
        </p>

        <h1 className="nk-hero-title">
          해가 진 뒤에만
          <br />
          상영합니다
        </h1>

        <div className="nk-hero-meta">
          <p className="nk-hero-lead">{FESTIVAL.lead}</p>
          <div className="nk-hero-facts">
            <span>
              <b>{FESTIVAL.dates}</b>
              <i>상영 기간</i>
            </span>
            <span>
              <b>{FESTIVAL.window}</b>
              <i>상영 시간</i>
            </span>
            <span>
              <b>{FILMS.length}편 · 4개국</b>
              <i>초청작</i>
            </span>
          </div>
          <div className="nk-hero-cta">
            <a className="nk-btn solid" href="#lineup">
              상영작 보기
            </a>
            <a className="nk-btn line" href="#pass">
              관람권 안내
            </a>
          </div>
        </div>
      </div>

      <div className="nk-hero-count" aria-label="개막까지 남은 시간">
        <span className="nk-hero-count-k">개막까지</span>
        <span className="nk-hero-count-v">
          <b>{t.days}</b>일 <b>{t.hours}</b>:<b>{t.minutes}</b>:<b>{t.seconds}</b>
        </span>
      </div>
    </header>
  );
}

/* ── 스크롤 속도에 반응하는 마퀴 ────────────────────────────── */
function Ticker() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;
      const inner = root.current?.querySelector<HTMLElement>(".nk-ticker-inner");
      if (!inner) return;

      // 같은 내용을 두 벌 깔고 -50%까지 밀면 이음매 없이 순환한다.
      const loop = gsap.to(inner, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });

      /*
       * 스크롤 방향이 바뀌면 마퀴도 방향을 뒤집고, 스크롤이 빠를수록
       * 빨라진다. 정지 상태에서는 천천히 흐른다. 흔한 CSS 무한 루프와
       * 결정적으로 다른 지점이 이 '반응성'이다.
       */
      const st = ScrollTrigger.create({
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 1400, 4);
          gsap.to(loop, {
            timeScale: self.direction * boost,
            duration: 0.45,
            overwrite: true,
            ease: "power2.out",
          });
        },
      });

      return () => {
        st.kill();
        loop.kill();
      };
    },
    { scope: root, dependencies: [reduced] },
  );

  const items = FILMS.map((f) => `${f.titleKo} — ${f.director}`);
  const strip = [...items, ...items];

  return (
    <div className="nk-ticker" ref={root} aria-hidden="true">
      <div className="nk-ticker-inner">
        {strip.map((label, i) => (
          <span className="nk-ticker-item" key={i}>
            {label}
            <em>✳</em>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 프로그램 노트 (스티키 + 스크럽) ────────────────────────── */
function Notes() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced) return;

      // 각 노트가 화면 중앙을 지날 때 활성 인덱스를 바꾼다.
      const cards = gsap.utils.toArray<HTMLElement>(".nk-note");
      cards.forEach((card, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 62%",
          end: "bottom 38%",
          onToggle: (self) => self.isActive && setActive(i),
        });
      });

      // 스티키 이미지가 섹션 전체에 걸쳐 아주 천천히 밀린다.
      gsap.fromTo(
        ".nk-notes-img",
        { scale: 1.16, yPercent: -3 },
        {
          scale: 1,
          yPercent: 3,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      );

      gsap.from(".nk-note", {
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ".nk-notes-list", start: "top 78%" },
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section className="nk-sec nk-notes" id="notes" ref={root}>
      <div className="nk-wrap nk-notes-grid">
        <div className="nk-notes-sticky">
          <figure className="nk-notes-fig">
            <img className="nk-notes-img" src={asset("still-proj")} alt="" loading="lazy" decoding="async" />
            <span className="nk-grain" aria-hidden="true" />
          </figure>
          <p className="nk-notes-index" aria-hidden="true">
            <b>{String(active + 1).padStart(2, "0")}</b>
            <i>/ {String(NOTES.length).padStart(2, "0")}</i>
          </p>
        </div>

        <ol className="nk-notes-list">
          {NOTES.map((n, i) => (
            <li className="nk-note" key={n.kicker} data-on={active === i ? "1" : "0"}>
              <p className="nk-note-kicker">{n.kicker}</p>
              <h3 className="nk-note-title">{n.title}</h3>
              <p className="nk-note-body">{n.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── 관람권 ─────────────────────────────────────────────────── */
function Passes() {
  return (
    <section className="nk-sec nk-pass" id="pass">
      <div className="nk-wrap">
        <header className="nk-head">
          <p className="nk-kicker">Tickets · 관람권</p>
          <h2 className="nk-h2">밤을 어떻게 살 것인가</h2>
        </header>

        <div className="nk-stubs">
          {PASSES.map((p) => (
            <article
              key={p.id}
              className="nk-stub"
              data-featured={p.featured ? "1" : "0"}
              onPointerMove={(e) => {
                // 포인터 위치에 따라 살짝 기우는 카드. 값이 작아야 싸구려로 안 보인다.
                const el = e.currentTarget;
                const r = el.getBoundingClientRect();
                el.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -5}deg`);
                el.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty("--rx", "0deg");
                e.currentTarget.style.setProperty("--ry", "0deg");
              }}
            >
              <div className="nk-stub-top">
                <h3>{p.name}</h3>
                <p className="nk-stub-price">
                  <b>{p.price}</b>
                  <i>{p.unit}</i>
                </p>
              </div>

              <span className="nk-stub-perf" aria-hidden="true" />

              <div className="nk-stub-bot">
                <ul>
                  {p.perks.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="nk-stub-note">{p.note}</p>
                <span className="nk-stub-cta">예매하기 →</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 페이지 ─────────────────────────────────────────────────── */
export default function NokturnPage() {
  useSmoothScroll();
  /* 테마는 이 페이지 안에서만 산다 — 언마운트하면 훅이 data-theme을 걷어낸다.
     기본 상태는 '심야'다. OS가 라이트여도 처음엔 어둡게 열고, 방문자가 토글을
     누른 적이 있으면 그 선택이 이긴다. */
  const { theme, toggle } = useTheme();

  return (
    <div className="nk-site">
      <div className="nk-rail">
        <Link to="/" className="nk-rail-back">
          ← 포트폴리오
        </Link>
        <ThemeToggle theme={theme} onToggle={toggle} />
      </div>

      <Hero />
      <Ticker />
      <Lineup />
      <Timetable />
      <Notes />
      <Venues />
      <Passes />

      <footer className="nk-foot">
        <div className="nk-wrap nk-foot-grid">
          <div>
            <b className="nk-foot-logo">NOKTURN</b>
            <p>
              {FESTIVAL.edition} {FESTIVAL.nameKo}
            </p>
            <p className="nk-foot-en">{FESTIVAL.nameEn}</p>
          </div>
          <div className="nk-foot-col">
            <p>사무국 · 서울 중구 을지로 14길</p>
            <p>운영 시간 14:00 — 22:00 (상영 기간 중 04:00까지)</p>
            <p>program@nokturn.example</p>
          </div>
        </div>
        <div className="nk-wrap nk-foot-demo">
          이 페이지는 포트폴리오용 가상 프로젝트입니다. 실존하는 영화제·작품·감독이 아니며, 모든
          이미지와 영상은 AI로 생성했습니다. 상영 정보와 가격은 예시입니다.
        </div>
      </footer>
    </div>
  );
}
