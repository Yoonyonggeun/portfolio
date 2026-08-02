import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { asset } from "./nokturn/assets";

/* 스튜디오 이름·연락처는 여기 한 곳만 바꾸면 전체에 반영됩니다. */
const STUDIO = "PRODUCT FILM";
const EMAIL = "yoon5ye@gmail.com";
const CONTACT = `mailto:${EMAIL}?subject=${encodeURIComponent("프로젝트 문의")}`;

type Project = {
  no: string;
  name: string;
  category: string;
  year: string;
  /* 카드에서 제일 먼저 읽히는 한 줄. 문장은 짧게, 동사로 끝낸다. */
  line: string;
  desc: string;
  tags: string[];
  image: string;
  href: string;
  accent: string;
  dark?: boolean;
};

const projects: Project[] = [
  {
    no: "11",
    name: "중쇠 48",
    category: "수동 커피 그라인더 · 홈카페",
    year: "2026",
    line: "축이 흔들리면, 입자가 흔들린다.",
    desc: "끌면 열두 조각으로 벌어지고, 부품을 누르면 지시선이 뻗으며 왜 거기 있는지가 나온다. 단면은 도면처럼 잘린 자리를 막고 45° 해칭을 얹는다. 분해도 에셋은 0KB — 지오메트리를 코드가 만든다.",
    tags: ["procedural 3D", "leader callouts", "section + hatch"],
    image: "/assets/jungsoe/hero.webp",
    href: "/work/jungsoe",
    accent: "#1b4dd8",
  },
  {
    no: "10",
    name: "석리 石理",
    category: "포세린 슬래브 · 내수 B2B",
    year: "2026",
    line: "표면이 아니라, 잘린 면을 판다.",
    desc: "좌측 필터와 전폭 그리드로 짠 소재 라이브러리. 무늬가 두께를 관통하는지를 절단면 두 장으로 대조하고, 조명 입사각을 낮추면 표면 요철이 드러난다. 12개 품목이 매크로 4장에서 파생된다.",
    tags: ["filter + grid", "grazing light", "AI stills ×8"],
    image: "/assets/seokri/cut-body.webp",
    href: "/work/seokri",
    accent: "#8c4a2f",
  },
  {
    no: "09",
    name: "불목 S1",
    category: "아웃도어 · 크라우드펀딩 상세페이지",
    year: "2026",
    line: "에디터 안에서 작동하는 상세페이지.",
    desc: "앞의 여덟 편과 달리 랜딩이 아니라 와디즈 스토리에 그대로 올라가는 산출물. 컬럼 740px과 이미지 1024px은 플랫폼이 정한 값이고, 토글 하나로 에디터가 못 받는 것들이 살아난다.",
    tags: ["wadiz 740px", "AI stills ×9", "SVG 도해"],
    image: "/assets/bulmok/hero.webp",
    href: "/work/bulmok",
    accent: "#4b4a9e",
  },
  {
    no: "08",
    name: "NOKTURN",
    category: "심야 단편영화제 · 문화",
    year: "2026",
    line: "스크롤을 내리면 밤이 흘러간다.",
    desc: "제품이 아닌 첫 작업. 밤 10시부터 새벽 4시까지만 상영하는 영화제. 스크롤 진행도가 그대로 시각이 되는 상영시간표, FLIP으로 재배치되는 라인업, 심야↔새벽 테마 전환.",
    tags: ["GSAP Flip · ScrollTrigger", "심야 / 새벽", "AI film 15s + 12s ×3"],
    /* 08은 에셋이 public이 아니라 CDN에 있다. `npm run assets`를 돌려
       src/pages/nokturn/media/를 채우면 같은 헬퍼가 로컬 번들을 먼저 집는다. */
    image: asset("poster-lastcar"),
    href: "/work/nokturn",
    accent: "#f0b429",
    dark: true,
  },
  {
    no: "07",
    name: "무렵 01",
    category: "포터블 조명 · 리빙",
    year: "2026",
    line: "어두워질수록, 따뜻해집니다.",
    desc: "밝기와 색온도가 함께 내려가는 무선 램프. 페이지의 낮/밤 전환이 곧 제품 시연이고, 밝기 단을 고르면 화면 전체가 같이 어두워진다.",
    tags: ["light / dark", "10s film", "AI stills ×10"],
    image: "/assets/muryeop/space-bedside.webp",
    href: "/work/muryeop",
    accent: "#a992d1",
    dark: true,
  },
  {
    no: "06",
    name: "MERIDIAN FLUID",
    category: "산업 부품 · 수출 B2B",
    year: "2026",
    line: "바이어가 묻기 전에 수치를 놓는다.",
    desc: "PDF 카탈로그를 대신하는 영문·국문 데이터시트 사이트. 구경과 압력등급을 고르면 사양표와 압력강하 곡선이 함께 바뀐다.",
    tags: ["EN · KO", "live datasheet", "SVG curve"],
    image: "/assets/meridian/hero-valve.webp",
    href: "/work/meridian",
    accent: "#8b9a3f",
    dark: true,
  },
  {
    no: "05",
    name: "정본치과의원",
    category: "치과 · 의료",
    year: "2026",
    line: "비용을 숨기지 않는 치과를 만든다.",
    desc: "국내 치과 사이트의 표준 골격을 그대로 따르되, 사진·조판·카피의 마감으로 차이를 낸다.",
    tags: ["conventional IA", "AI stills ×9", "no stock photo"],
    image: "/assets/jeongbon/hero-lg.webp",
    href: "/work/jeongbon",
    accent: "#b4402e",
  },
  {
    no: "04",
    name: "AURUM Calibre 04",
    category: "기계식 크로노그래프",
    year: "2026",
    line: "케이스를 열지 않고 무브먼트를 본다.",
    desc: "스크롤이 곧 시간이 되는 스켈레톤 워치 페이지.",
    tags: ["frame scrub ×61", "3-layer x-ray", "AI stills ×9"],
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
    line: "반으로 잘라 드라이버를 본다.",
    desc: "애플 제품 페이지의 인터랙션 문법으로 재구성한 이어폰 상세.",
    tags: ["scroll scrub", "accordion viewer", "AI stills ×11"],
    image: "/assets/klang/hero-lg.webp",
    href: "/work/klang",
    accent: "#1d1d1f",
  },
  {
    no: "02",
    name: "KONTAKT ONE",
    category: "엔듀런스 로드 자전거",
    year: "2026",
    line: "몸에 닿는 다섯 곳을 분해한다.",
    desc: "“통증 없는 100km.” 분해 → 파츠 → 재조립의 7씬 스크롤 필름.",
    tags: ["7-scene scrub", "PASONA copy", "AI film ×1"],
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
    line: "미드솔 네 겹을 가른다.",
    desc: "회전 → 분해 → 재조립 3막. 드래그로 돌려보는 3D 인스펙터로 끝난다.",
    tags: ["frame scrub ×242", "3D inspect", "4-layer teardown"],
    image: "/assets/umbra/hi_exploded.webp",
    href: "/work/umbra",
    accent: "#7fe3c3",
    dark: true,
  },
];

/* 방법론은 세 개의 동사로만 말한다. 설명은 각 한 줄. */
const method = [
  { verb: "가른다", body: "층으로 자르고 껍데기 너머를 비춥니다." },
  { verb: "움직인다", body: "스크롤이 카메라가 되고, 시간이 됩니다." },
  { verb: "증명한다", body: "스펙 표를 읽는 대신 눈으로 납득시킵니다." },
];

/* 자식 .pf-rv를 한 번씩만 등장시킨다. umbra·klang과 같은 패턴. */
function useReveal<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>(".pf-rv");
    const revealAll = () => targets.forEach((n) => n.classList.add("pf-in"));

    /* 관찰할 수 없으면 리빌을 포기하고 즉시 드러낸다. */
    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    let io: IntersectionObserver;
    try {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("pf-in");
              io.unobserve(e.target);
            }
          }),
        { threshold },
      );
      targets.forEach((n) => io.observe(n));
    } catch {
      revealAll();
      return;
    }

    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <Link
      to={p.href}
      className="pf-rv block focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <article
        className="group grid gap-0 overflow-hidden rounded-2xl border border-[var(--pf-line)] transition-shadow duration-[400ms] ease-out hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)] md:grid-cols-[1.15fr_1fr]"
        style={{
          background: p.dark ? "#17191c" : "#fff",
          color: p.dark ? "#f2efe9" : "var(--pf-ink)",
        }}
      >
        <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:min-h-[360px]">
          <img
            src={p.image}
            alt={`${p.name} — ${p.line}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04]"
          />
          <span
            className="pf-mono absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: p.dark ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.75)",
              backdropFilter: "blur(6px)",
            }}
          >
            FILM {p.no} · {p.year}
          </span>
        </div>

        <div className="flex flex-col justify-between gap-8 p-7 md:p-10">
          <div>
            <p className="pf-label text-xs opacity-55">{p.category}</p>
            <h3 className="pf-display mt-2 text-3xl font-bold md:text-4xl">{p.name}</h3>
            <p
              className="mt-5 text-lg font-semibold leading-snug md:text-xl"
              style={{ color: p.accent === "#1d1d1f" ? "var(--pf-ink)" : p.accent }}
            >
              {p.line}
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed opacity-65">{p.desc}</p>
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
            <span
              className="pf-mono ml-auto text-sm font-bold transition-transform duration-[400ms] ease-out group-hover:translate-x-1"
              style={{ color: p.accent === "#1d1d1f" && p.dark ? "#fff" : p.accent }}
            >
              보러 가기 →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function Home() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div className="pf-site min-h-dvh">
      <header className="sticky top-0 z-50 bg-[var(--pf-paper)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="pf-display text-sm font-bold tracking-[0.25em]">{STUDIO}</span>
          <div className="flex items-center gap-2">
            <a
              href="#work"
              className="hidden rounded-full px-4 py-2 text-xs transition-colors hover:bg-black/5 sm:block"
            >
              작업물
            </a>
            <a
              href={CONTACT}
              className="rounded-full bg-[var(--pf-ink)] px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-80"
            >
              프로젝트 문의
            </a>
          </div>
        </div>
      </header>

      <div ref={page}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
          <p className="pf-rise pf-label text-xs text-[var(--pf-dim)]">
            제품 비주얼 · 스크롤 필름 · 2026
          </p>

          {/* 한 문장. 이 페이지에서 제일 큰 글자이고, 이것만 읽고 나가도 되게 쓴다. */}
          <h1
            className="pf-rise pf-display mt-6 max-w-5xl text-[clamp(2.6rem,8.4vw,6.5rem)] font-bold leading-[1.02]"
            style={{ ["--d" as string]: "0.06s" }}
          >
            부수지 않고,
            <br />
            <span className="text-[var(--pf-orange)]">속</span>을 보여준다.
          </h1>

          <p
            className="pf-rise mt-8 max-w-xl text-lg leading-relaxed text-[var(--pf-dim)] md:text-xl"
            style={{ ["--d" as string]: "0.12s" }}
          >
            찍을 실물이 없는 제품의 분해도 · 단면 · 내부 구조.
            <br />
            카메라 없이 만듭니다.
          </p>

          <div
            className="pf-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ ["--d" as string]: "0.18s" }}
          >
            <a
              href="#work"
              className="inline-flex items-center justify-center rounded-full bg-[var(--pf-ink)] px-7 py-3.5 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
            >
              작업물 보기 →
            </a>
            <a
              href={CONTACT}
              className="inline-flex items-center justify-center rounded-full border border-[var(--pf-line)] px-7 py-3.5 text-sm font-medium transition-colors hover:bg-black/5"
            >
              프로젝트 문의
            </a>
          </div>

          <dl
            className="pf-rise mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[var(--pf-line)] pt-8 sm:grid-cols-4"
            style={{ ["--d" as string]: "0.24s" }}
          >
            {[
              ["10", "프로젝트"],
              ["77", "구조 스틸"],
              ["610", "스크럽 프레임"],
              ["0", "촬영 컷"],
            ].map(([v, k]) => (
              <div key={k}>
                <dt className="pf-display text-3xl font-bold md:text-4xl">{v}</dt>
                <dd className="pf-label mt-1 text-xs text-[var(--pf-dim)]">{k}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── 선언 ─────────────────────────────────────────── */}
        <section className="bg-[#17191c] text-[#f2efe9]">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <h2 className="pf-rv pf-display max-w-4xl text-[clamp(1.9rem,4.6vw,3.4rem)] font-bold leading-[1.12]">
              촬영을 대신하지 않습니다.
              <br />
              <span className="text-[var(--pf-orange)]">촬영으로 못 찍는 컷</span>을 만듭니다.
            </h2>

            <div className="mt-20 grid gap-px overflow-hidden rounded-2xl bg-white/10 md:grid-cols-3">
              {method.map((m, i) => (
                <div
                  key={m.verb}
                  className="pf-rv bg-[#17191c] p-8 md:p-10"
                  style={{ ["--d" as string]: `${i * 0.08}s` }}
                >
                  <h3 className="pf-display text-2xl font-bold md:text-3xl">{m.verb}</h3>
                  <p className="mt-3 text-sm leading-relaxed opacity-60">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 작업물 ───────────────────────────────────────── */}
        <section id="work" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
            <div className="pf-rv max-w-2xl">
              <p className="pf-label text-xs text-[var(--pf-dim)]">작업물</p>
              <h2 className="pf-display mt-4 text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.14]">
                열 개의 대상.
                <br />
                열 가지 방법.
              </h2>
              {/* 컨셉 작업이라는 사실은 숨기지 않되 사과하지 않는다. 의도로 말한다. */}
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--pf-dim)]">
                모두 자체 기획 프로젝트입니다. 다섯은 소비재, 하나는 의료 서비스, 둘은 산업
                부품과 건축 소재, 하나는 제품이 아예 없는 영화제, 하나는 랜딩이 아니라 크라우드
                펀딩 플랫폼 안에 그대로 올라가는 상세페이지입니다. 대상이 바뀌면 속을 보여주는
                방법도 바뀐다는 걸 확인하려고 만들었습니다.
              </p>
            </div>

            <div className="mt-14 flex flex-col gap-8">
              {projects.map((p) => (
                <ProjectCard key={p.no} p={p} />
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="border-t border-[var(--pf-line)]">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <h2 className="pf-rv pf-display max-w-3xl text-[clamp(1.9rem,4.6vw,3.4rem)] font-bold leading-[1.12]">
              다음은,
              <br />
              당신의 제품.
            </h2>
            <div className="pf-rv mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={CONTACT}
                className="inline-flex items-center justify-center rounded-full bg-[var(--pf-orange)] px-8 py-4 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                프로젝트 문의 →
              </a>
              <span className="pf-mono text-sm text-[var(--pf-dim)]">{EMAIL}</span>
            </div>
          </div>
        </section>

        <footer className="border-t border-[var(--pf-line)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <p className="text-xs leading-relaxed text-[var(--pf-dim)]">
              작업물의 제품은 모두 자체 기획 컨셉이며, 표기된 스펙은 예시입니다.
            </p>
            <span className="pf-display text-sm font-bold tracking-[0.25em]">{STUDIO}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
