import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { asset } from "./assets";
import { FILMS, SECTIONS, type Film, type Section } from "./data";

gsap.registerPlugin(Flip);

type Filter = "전체" | Section;
const FILTERS: Filter[] = ["전체", ...SECTIONS];

const EASE = "power3.inOut";

/* ── 카드 ────────────────────────────────────────────────────────
 * 포스터 위에 12초 프리뷰를 얹는다. 비디오는 마운트 시점에 로드하지 않고
 * (preload="none") 포인터가 올라온 뒤에야 src를 붙인다 — 여섯 장을 미리
 * 받으면 라인업 진입이 느려진다.
 */
function Card({
  film,
  onOpen,
}: {
  film: Film;
  onOpen: (film: Film, rect: DOMRect) => void;
}) {
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  const enter = () => {
    if (!film.clip || reduced) return;
    setArmed(true);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const leave = () => {
    setPlaying(false);
    videoRef.current?.pause();
  };

  return (
    <button
      ref={rootRef}
      type="button"
      className="nk-card"
      data-film={film.id}
      style={{ "--accent": film.accent } as React.CSSProperties}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={enter}
      onBlur={leave}
      onClick={() => {
        const rect = rootRef.current?.getBoundingClientRect();
        if (rect) onOpen(film, rect);
      }}
      aria-label={`${film.titleKo} — ${film.director}, ${film.runtime}분. 상세 보기`}
    >
      <span className="nk-card-media">
        <img
          src={asset(film.poster)}
          alt=""
          loading="lazy"
          decoding="async"
          width={620}
          height={930}
          className="nk-card-poster"
        />
        {armed && film.clip && (
          <video
            ref={videoRef}
            className="nk-card-clip"
            data-on={playing ? "1" : "0"}
            src={asset(film.clip)}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
        )}
        <span className="nk-card-grain" aria-hidden="true" />

        {film.badge && <span className="nk-card-badge">{film.badge}</span>}
        {film.clip && (
          <span className="nk-card-hasclip" aria-hidden="true">
            <svg viewBox="0 0 10 12" width="8" height="10">
              <path d="M0 0 L10 6 L0 12 Z" fill="currentColor" />
            </svg>
            프리뷰
          </span>
        )}

        {/* 아래에서 밀려 올라오는 메타 스트립 */}
        <span className="nk-card-strip">
          <b>{film.runtime}분</b>
          <i>{film.rating.replace("이상관람가", "+").replace("전체관람가", "ALL")}</i>
          <em>{film.genre}</em>
        </span>
      </span>

      <span className="nk-card-body">
        <span className="nk-card-no">{film.no}</span>
        <span className="nk-card-titles">
          <strong>{film.titleKo}</strong>
          <span className="nk-card-en">{film.titleEn}</span>
        </span>
        <span className="nk-card-meta">
          {film.director} · {film.country} · {film.year}
        </span>
      </span>
    </button>
  );
}

/* ── 상세 오버레이 ───────────────────────────────────────────────
 * 클릭한 카드의 위치에서 자라나도록 transform-origin을 계산해 넘긴다.
 * 별도 라이브러리 없이 공유 요소 전환처럼 읽힌다.
 */
function Detail({
  film,
  origin,
  onClose,
}: {
  film: Film;
  origin: { x: number; y: number } | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="nk-detail-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${film.titleKo} 상세`}
    >
      <motion.article
        className="nk-detail"
        style={{ "--accent": film.accent } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
        initial={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.86, x: origin?.x ?? 0, y: origin?.y ?? 0 }
        }
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
        transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
      >
        <button type="button" className="nk-detail-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        <div className="nk-detail-grid">
          <figure className="nk-detail-fig">
            <img src={asset(film.poster)} alt="" width={620} height={930} />
          </figure>

          <div className="nk-detail-body">
            <p className="nk-detail-sec">
              {film.section}
              {film.badge && <span className="nk-detail-badge">{film.badge}</span>}
            </p>
            <h3 className="nk-detail-title">{film.titleKo}</h3>
            <p className="nk-detail-en">{film.titleEn}</p>
            <p className="nk-detail-log">{film.logline}</p>

            <dl className="nk-detail-spec">
              <dt>감독</dt>
              <dd>{film.director}</dd>
              <dt>제작국가</dt>
              <dd>{film.country}</dd>
              <dt>제작연도</dt>
              <dd>{film.year}</dd>
              <dt>상영시간</dt>
              <dd>{film.runtime}분</dd>
              <dt>장르</dt>
              <dd>{film.genre}</dd>
              <dt>관람등급</dt>
              <dd>{film.rating}</dd>
              <dt>자막</dt>
              <dd>{film.subtitle}</dd>
            </dl>

            <p className="nk-detail-note">{film.note}</p>

            <a className="nk-detail-cta" href="#timetable" onClick={onClose}>
              상영 회차 보기 →
            </a>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

export default function Lineup() {
  const [filter, setFilter] = useState<Filter>("전체");
  const [open, setOpen] = useState<Film | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const reduced = useReducedMotion();

  const visible = filter === "전체" ? FILMS : FILMS.filter((f) => f.section === filter);

  /*
   * FLIP: 상태를 바꾸기 *전에* 현재 카드들의 위치를 찍어 두고,
   * DOM이 갱신된 직후(useLayoutEffect)에 그 차이를 애니메이션한다.
   * CSS만으로는 그리드 재배치를 부드럽게 만들 수 없다 — 이게 그 해법이다.
   */
  const changeFilter = useCallback(
    (next: Filter) => {
      if (next === filter) return;
      if (gridRef.current && !reduced) {
        flipState.current = Flip.getState(gridRef.current.querySelectorAll(".nk-card"));
      }
      setFilter(next);
    },
    [filter, reduced],
  );

  useLayoutEffect(() => {
    const state = flipState.current;
    flipState.current = null;
    if (!state) return;

    Flip.from(state, {
      duration: 0.62,
      ease: EASE,
      absolute: true,
      stagger: 0.035,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { opacity: 0, scale: 0.82, filter: "blur(6px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "power2.out", stagger: 0.04 },
        ),
      onLeave: (els) =>
        gsap.to(els, { opacity: 0, scale: 0.82, filter: "blur(6px)", duration: 0.32, ease: "power2.in" }),
    });
  }, [filter]);

  const handleOpen = useCallback((film: Film, rect: DOMRect) => {
    // 카드 중심 → 화면 중심 벡터. 오버레이가 그 지점에서 자라난다.
    setOrigin({
      x: rect.left + rect.width / 2 - window.innerWidth / 2,
      y: rect.top + rect.height / 2 - window.innerHeight / 2,
    });
    setOpen(film);
  }, []);

  // 오버레이가 열려 있는 동안 배경 스크롤을 막는다.
  useLayoutEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className="nk-sec nk-lineup" id="lineup">
      <div className="nk-wrap">
        <header className="nk-head">
          <p className="nk-kicker">Programme · 상영작</p>
          <h2 className="nk-h2">여섯 편, 네 나라, 나흘 밤</h2>
          <p className="nk-lead">
            전편 국내 초연입니다. 카드를 누르면 상세 정보와 상영 회차를 볼 수 있습니다.
          </p>
        </header>

        <div className="nk-filters" role="tablist" aria-label="부문 필터">
          {FILTERS.map((f) => {
            const n = f === "전체" ? FILMS.length : FILMS.filter((x) => x.section === f).length;
            return (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className="nk-filter"
                onClick={() => changeFilter(f)}
              >
                {f}
                <sup>{n}</sup>
              </button>
            );
          })}
        </div>

        <div className="nk-grid" ref={gridRef}>
          {visible.map((film) => (
            <Card key={film.id} film={film} onOpen={handleOpen} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open && <Detail film={open} origin={origin} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </section>
  );
}
