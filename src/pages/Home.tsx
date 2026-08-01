import { Link } from "react-router-dom";
import ThemeToggle from "../lib/ThemeToggle";

/* 스튜디오 이름은 여기 한 곳만 바꾸면 전체에 반영됩니다. */
const STUDIO = "PRODUCT FILM";
const CONTACT = "mailto:hello@example.com";

type Project = {
  no: string;
  name: string;
  category: string;
  year: string;
  desc: string;
  tags: string[];
  image: string;
  href?: string;
  accent: string;
  dark?: boolean;
};

const projects: Project[] = [
  {
    no: "05",
    name: "NOKTURN",
    category: "국제 심야 단편영화제",
    year: "2026",
    desc: "제품이 아닌 첫 작업. 밤 10시부터 새벽 4시까지만 상영하는 가상의 영화제 사이트. 스크롤이 곧 시각이 되는 상영시간표, FLIP으로 재배치되는 라인업 그리드, 포스터 위에서 재생되는 12초 프리뷰. 심야↔새벽 테마 전환.",
    tags: ["GSAP Flip · ScrollTrigger", "Lenis + Motion", "dark/light", "AI film 15s ×1 · 12s ×3"],
    image: "https://d2ol7oe51mr4n9.cloudfront.net/user_3EWnZzTSAsTHSEPmy7uQdn8lIfH/0daa784d-9d88-41de-82e1-a66bd756b2f1.webp",
    href: "/work/nokturn",
    accent: "#f0b429",
    dark: true,
  },
  {
    no: "04",
    name: "AURUM Calibre 04",
    category: "기계식 크로노그래프",
    year: "2026",
    desc: "“1초를 쪼개는 기계.” 스크롤이 곧 시간이 되는 스켈레톤 워치 페이지. 프레임 스크럽 히어로, 3레이어 X-ray, 다이얼 캡션 핀.",
    tags: ["frame scrub ×61", "3-layer x-ray", "AI stills ×9", "AI film ×1"],
    image: "/assets/aurum/hero-lg.webp",
    href: "/work/aurum",
    accent: "#c9a86a",
    dark: true,
  },
  {
    no: "03",
    name: "KLANG Pro",
    category: "무선 이어폰",
    year: "2026",
    desc: "애플 제품 페이지의 인터랙션 문법을 그대로 재현한 이어폰 상세페이지. 스크롤 스크럽 히어로, 아코디언 제품 뷰어, 타이포 리빌.",
    tags: ["scroll-scrub", "accordion viewer", "AI stills ×11", "AI film ×1"],
    image: "/assets/klang/hero-lg.webp",
    href: "/work/klang",
    accent: "#1d1d1f",
  },
  {
    no: "02",
    name: "KONTAKT ONE",
    category: "엔듀런스 로드 자전거",
    year: "2026",
    desc: "\u201c통증 없는 100km.\u201d 몸의 접점 5곳을 다시 설계한 자전거를 7씬 스크롤 필름으로. 분해→파츠→재조립 서사.",
    tags: ["7-scene scrub", "PASONA copy", "AI film ×1", "AI stills ×7"],
    image: "/assets/kontakt/world/hero-poster.webp",
    href: "/work/kontakt",
    accent: "#ff4d00",
    dark: true,
  },
  {
    no: "01",
    name: "UMBRA GLIDE 01",
    category: "러닝 슈즈",
    year: "2026",
    desc: "SOP의 출발점이 된 첫 프로젝트. “8km에서 포기하는 신발”을 회전→분해→재조립 3막 스크럽 필름으로 해부하고, 드래그로 돌려보는 3D 인스펙터로 마무리.",
    tags: ["frame scrub ×242", "3D inspect", "4-layer teardown", "AI stills ×5"],
    image: "/assets/umbra/hi_exploded.webp",
    href: "/work/umbra",
    accent: "#7fe3c3",
    dark: true,
  },
];

function ProjectCard({ p }: { p: Project }) {
  const body = (
    <article
      className="group grid gap-0 overflow-hidden rounded-2xl border border-[var(--pf-line)] bg-white transition-shadow duration-300 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] md:grid-cols-[1.15fr_1fr]"
      style={{ background: p.dark ? "#17191c" : "#fff", color: p.dark ? "#f2efe9" : "var(--pf-ink)" }}
    >
      <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[340px]">
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: p.accent }}
          >
            <span className="pf-display text-2xl font-bold tracking-[0.3em] text-white/70">
              {p.name}
            </span>
          </div>
        )}
        <span
          className="pf-mono absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: p.dark ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.75)", backdropFilter: "blur(6px)" }}
        >
          FILM {p.no} · {p.year}
        </span>
      </div>

      <div className="flex flex-col justify-between gap-8 p-7 md:p-10">
        <div>
          <p className="pf-mono text-xs uppercase tracking-[0.2em] opacity-60">{p.category}</p>
          <h3 className="pf-display mt-2 text-3xl font-bold md:text-4xl">{p.name}</h3>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed opacity-75">{p.desc}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {p.tags.map((t) => (
            <span
              key={t}
              className="pf-mono rounded-full border px-3 py-1 text-[11px]"
              style={{ borderColor: p.dark ? "rgba(242,239,233,.25)" : "var(--pf-line)" }}
            >
              {t}
            </span>
          ))}
          {p.href && (
            <span
              className="pf-mono ml-auto text-sm font-bold transition-transform duration-200 group-hover:translate-x-1"
              style={{ color: p.accent === "#1d1d1f" && p.dark ? "#fff" : p.accent }}
            >
              보러 가기 →
            </span>
          )}
        </div>
      </div>
    </article>
  );

  return p.href ? (
    <Link to={p.href} className="block focus-visible:outline-2 focus-visible:outline-offset-4">
      {body}
    </Link>
  ) : (
    <div className="cursor-default opacity-80">{body}</div>
  );
}

export default function Home() {
  return (
    <div className="pf-site min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-8">
        <span className="pf-display text-sm font-bold tracking-[0.25em]">{STUDIO}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={CONTACT}
            className="pf-mono rounded-full border border-[var(--pf-line)] px-4 py-2 text-xs transition-colors hover:bg-[var(--pf-ink)] hover:text-[var(--pf-paper)]"
          >
            프로젝트 문의
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 md:pt-28">
        <p className="pf-mono text-xs uppercase tracking-[0.25em] text-[var(--pf-dim)]">
          AI product film · scroll-driven detail pages
        </p>
        <h1 className="pf-display mt-5 max-w-3xl text-4xl font-bold leading-[1.12] md:text-6xl">
          하나를,
          <br />
          스크롤 한 편의 필름으로.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--pf-dim)] md:text-lg">
          촬영 없이 AI 생성 에셋만으로 히어로 필름·분해 컷·디테일 스틸을 만들고, 스크롤
          인터랙션으로 엮어 반나절 안에 배포합니다. 제품 상세페이지에서 시작해 브랜드·이벤트
          사이트까지 넓히는 중입니다.
        </p>
        <div className="pf-mono mt-10 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <span>
            <b className="text-lg">5</b>&nbsp;films shipped
          </span>
          <span>
            <b className="text-lg">½</b>&nbsp;day per product
          </span>
          <span>
            <b className="text-lg">0</b>&nbsp;photo shoots
          </span>
        </div>
      </section>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-24">
        {projects.map((p) => (
          <ProjectCard key={p.no} p={p} />
        ))}
      </main>

      <footer className="border-t border-[var(--pf-line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <p className="pf-mono text-xs text-[var(--pf-dim)]">
            All products above are fictional concept demos. Specs illustrative.
          </p>
          <a href={CONTACT} className="pf-display text-sm font-bold underline underline-offset-4">
            hello@example.com
          </a>
        </div>
      </footer>
    </div>
  );
}
