import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./jeongbon.css";

/*
 * 정본치과의원 — 가상 치과 상세페이지 (포트폴리오 데모)
 *
 * 구조는 국내 치과 사이트의 표준 골격을 그대로 따른다:
 *   히어로 → 실적 → 진료과목 → 왜 우리인가 → 프로세스 → 비용 →
 *   장비 → 의료진 → FAQ → 진료시간·오시는길 → 상담
 * 환자가 이미 아는 순서라 설명 없이 읽힌다. 차별화는 구조가 아니라
 * 사진·조판·카피의 마감에서 가져간다.
 */

const A = "/assets/jeongbon";
const TEL = "02-0000-0000";

/* ── 실적 (데모용 예시 값) ───────────────────────────────── */
const STATS: [string, string, string][] = [
  ["19", "년", "개원 후 진료 기간"],
  ["8", "인", "분야별 협진 의료진"],
  ["3", "종", "디지털 진단 장비"],
  ["5", "년", "보철 사후관리 보증"],
];

/* ── 진료과목 ────────────────────────────────────────────── */
const DEPTS: { name: string; desc: string; img: string; alt: string }[] = [
  {
    name: "임플란트",
    desc: "CBCT로 뼈 상태와 신경 위치를 먼저 확인하고, 식립 위치를 계획한 뒤 시작합니다.",
    img: `${A}/part-fixture.webp`,
    alt: "티타늄 픽스처 나사산 매크로",
  },
  {
    name: "치아교정",
    desc: "투명교정과 브라켓을 모두 다룹니다. 치아 이동 계획을 미리 보여드리고 시작합니다.",
    img: `${A}/part-aligner.webp`,
    alt: "투명 교정장치 세 개가 나란히 놓인 매크로",
  },
  {
    name: "충치·보철",
    desc: "지르코니아·골드·PFM 중 씹는 힘과 위치에 맞는 재료를 함께 정합니다.",
    img: `${A}/part-zirconia.webp`,
    alt: "지르코니아 블록 절단면 매크로",
  },
  {
    name: "잇몸치료",
    desc: "탐침 깊이와 방사선상 골 소실을 함께 보고 치료 범위를 정합니다.",
    img: `${A}/spectrum-xray.webp`,
    alt: "치아 단면의 X선 이미지",
  },
];

/* ── 왜 정본치과인가 ─────────────────────────────────────── */
const REASONS: [string, string, string][] = [
  [
    "01",
    "진단한 의사가 끝까지 맡습니다",
    "상담한 의사가 시술하고 사후관리까지 담당합니다. 담당이 바뀌면 바뀌기 전에 알려드립니다.",
  ],
  [
    "02",
    "비용을 먼저 알려드립니다",
    "치료 전 항목별 금액이 적힌 치료계획서를 드립니다. 계획이 바뀌면 문서로 다시 드립니다.",
  ],
  [
    "03",
    "첫 상담은 진료의자 밖에서",
    "눕기 전에 별도 상담실에서 이야기합니다. 누운 자세에서는 질문하기 어렵기 때문입니다.",
  ],
  [
    "04",
    "관찰로 둘 것은 관찰로 둡니다",
    "지금 치료하지 않아도 되는 상태는 기준을 설명드리고 경과를 봅니다.",
  ],
  [
    "05",
    "진단 자료를 드립니다",
    "파노라마·CT·구강 스캔 원본을 요청하시면 드립니다. 다른 곳에서 한 번 더 보셔도 됩니다.",
  ],
  [
    "06",
    "언제든 멈출 수 있습니다",
    "치료 중 손을 드시면 기구를 먼저 빼고 이야기합니다. 이유를 묻지 않습니다.",
  ],
];

/* ── 진료 프로세스 ───────────────────────────────────────── */
const STEPS: [string, string, string][] = [
  ["STEP 01", "상담 예약", "전화로 예약하시면 대기 없이 상담실에서 시작합니다."],
  ["STEP 02", "검사와 진단", "파노라마·CBCT·구강 스캔으로 현재 상태를 확인합니다."],
  ["STEP 03", "치료계획 설명", "항목별 비용과 기간이 적힌 계획서를 보면서 설명드립니다."],
  ["STEP 04", "치료와 관리", "계획대로 진행하고, 끝난 뒤에도 정기 확인을 안내드립니다."],
];

/* ── 비용 (데모용 예시 값) ───────────────────────────────── */
const FEES: { name: string; note: string; price: string }[] = [
  { name: "임플란트 (국산 픽스처 + 지르코니아)", note: "진단 · 식립 · 보철 포함 / 1치 기준", price: "1,690,000원" },
  { name: "임플란트 (수입 픽스처 + 지르코니아)", note: "진단 · 식립 · 보철 포함 / 1치 기준", price: "2,190,000원" },
  { name: "지르코니아 크라운", note: "인상 채득 · 시적 · 장착 · 교합 조정 2회 포함", price: "510,000원" },
  { name: "골이식 (단순)", note: "이식재 · 차폐막 포함 / 1부위", price: "330,000원" },
  { name: "투명교정", note: "전악 기준 · 난이도에 따라 조정", price: "3,900,000원부터" },
  { name: "치아 미백 (전문가)", note: "1회 시술 기준", price: "290,000원" },
];

/* ── 장비 ────────────────────────────────────────────────── */
const EQUIP: [string, string, string][] = [
  [
    `${A}/spectrum-visible.webp`,
    "구강 스캐너",
    "본을 뜨지 않고 스캔합니다. 입에 무언가를 물고 있는 시간이 짧아집니다.",
  ],
  [
    `${A}/spectrum-niri.webp`,
    "근적외선 진단",
    "방사선 없이 치아 안쪽을 봅니다. 초기 충치를 겉이 아니라 속으로 확인합니다.",
  ],
  [
    `${A}/spectrum-xray.webp`,
    "CBCT 3D 촬영",
    "잇몸 아래 뼈 높이와 신경 위치를 3차원으로 확인한 뒤 식립을 계획합니다.",
  ],
];

/* ── 의료진 ──────────────────────────────────────────────── */
const DOCTORS: { name: string; role: string; career: string[] }[] = [
  {
    name: "김정본",
    role: "대표원장 · 구강악안면외과",
    career: [
      "치의학 박사",
      "구강악안면외과 전문의",
      "대한구강악안면임플란트학회 정회원",
      "종합병원 구강악안면외과 진료 경력",
    ],
  },
  {
    name: "이서형",
    role: "원장 · 치과교정과",
    career: [
      "치과교정과 전문의",
      "대한치과교정학회 정회원",
      "투명교정 인증의",
      "성장기 환자 교정 진료 경력",
    ],
  },
];

/* ── FAQ ─────────────────────────────────────────────────── */
const FAQ: [string, string][] = [
  [
    "상담만 받아도 되나요?",
    "네. 상담 후 그날 결정하지 않으셔도 됩니다. 치료계획서는 그대로 드리고, 다른 곳에서 한 번 더 보셔도 괜찮습니다.",
  ],
  [
    "비용은 언제 알 수 있나요?",
    "첫 상담에서 항목별 금액이 적힌 치료계획서를 드립니다. 진행 중 계획이 바뀌면 바뀌기 전에 문서로 다시 드립니다.",
  ],
  [
    "임플란트는 얼마나 걸리나요?",
    "일반적으로 12~24주입니다. 뼈가 붙는 기간이 대부분이라 그 사이 내원 횟수는 많지 않습니다. 개인차가 있어 검사 후 안내드립니다.",
  ],
  [
    "치료가 무서운데 어떻게 하나요?",
    "첫 상담은 진료의자에 눕기 전 상담실에서 합니다. 치료 중에도 손을 드시면 기구를 먼저 빼고 이야기합니다.",
  ],
  [
    "주차가 되나요?",
    "건물 지하 주차장을 이용하실 수 있고 진료 시 2시간 무료입니다. 지하철 이용 시 도보 3분 거리입니다.",
  ],
];

/* ── 진료시간 ────────────────────────────────────────────── */
type Row = { day: string; open: string; blocks: [number, number][]; late?: boolean; off?: boolean };
const HOURS: Row[] = [
  { day: "월 · 화 · 금", open: "09:30 – 18:30", blocks: [[9.5, 13], [14, 18.5]] },
  { day: "수 · 목", open: "09:30 – 21:00", blocks: [[9.5, 13], [14, 21]], late: true },
  { day: "토요일", open: "09:30 – 13:30", blocks: [[9.5, 13.5]] },
  { day: "점심시간", open: "13:00 – 14:00", blocks: [] },
  { day: "일요일 · 공휴일", open: "휴진", blocks: [], off: true },
];

/* 요일 인덱스(월=0) → HOURS 행 */
function todayBlocks(d: Date): [number, number][] {
  const i = (d.getDay() + 6) % 7;
  if (i === 6) return [];
  if (i === 5) return [[9.5, 13.5]];
  if (i === 2 || i === 3) return [[9.5, 13], [14, 21]];
  return [[9.5, 13], [14, 18.5]];
}

function useReveal<T extends HTMLElement>(threshold = 0.15) {
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

/* ─────────────────────────────────────────────────────────── */

export default function JeongbonPage() {
  const page = useReveal<HTMLDivElement>();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const openNow = useMemo(() => {
    const h = now.getHours() + now.getMinutes() / 60;
    return todayBlocks(now).some(([a, b]) => h >= a && h < b);
  }, [now]);

  return (
    <div className="jb-site" ref={page}>
      <Link to="/" className="jb-back jb-mono">
        ← PORTFOLIO
      </Link>

      {/* ── 내비 ─────────────────────────────────────────── */}
      <nav className="jb-nav" aria-label="주요 메뉴">
        <div className="jb-nav-inner">
          <a href="#top" className="jb-logo">
            정본치과의원
            <small>JEONGBON DENTAL</small>
          </a>
          <div className="jb-menu">
            <a href="#depts">진료과목</a>
            <a href="#why">병원소개</a>
            <a href="#fee">비용안내</a>
            <a href="#equip">장비·시설</a>
            <a href="#doctors">의료진</a>
            <a href="#visit">진료시간·오시는길</a>
          </div>
          <a href={`tel:${TEL.replace(/-/g, "")}`} className="jb-btn primary sm jb-nav-cta">
            전화 상담
          </a>
        </div>
      </nav>

      {/* ── 히어로 ───────────────────────────────────────── */}
      <section className="jb-hero" id="top">
        <img
          src={`${A}/hero-lg.webp`}
          srcSet={`${A}/hero-mobile.webp 900w, ${A}/hero-lg.webp 1800w`}
          sizes="100vw"
          alt="상악과 하악 석고 모형이 맞물리기 직전의 모습"
          width={1800}
          height={1005}
          fetchPriority="high"
        />
        <div className="jb-hero-body">
          <span className="jb-hero-tag">진단한 의사가 끝까지 맡습니다</span>
          <h1>
            치료를 시작하기 전에,
            <br />
            <em>비용과 기간</em>을 먼저 드립니다.
          </h1>
          <p>
            검사 결과와 항목별 금액이 적힌 치료계획서를 상담 자리에서 드립니다. 그날 결정하지
            않으셔도 됩니다.
          </p>
          <div className="jb-hero-cta">
            <a href={`tel:${TEL.replace(/-/g, "")}`} className="jb-btn primary">
              전화로 상담 예약
            </a>
            <a href="#fee" className="jb-btn ghost">
              비용 먼저 보기
            </a>
          </div>
        </div>
      </section>

      {/* ── 실적 ─────────────────────────────────────────── */}
      <div className="jb-stats">
        <div className="jb-stats-grid">
          {STATS.map(([n, unit, label]) => (
            <div className="jb-stat" key={label}>
              <b>
                {n}
                <span>{unit}</span>
              </b>
              <i>{label}</i>
            </div>
          ))}
        </div>
      </div>

      {/* ── 진료과목 ─────────────────────────────────────── */}
      <section className="jb-sec" id="depts">
        <div className="jb-wrap">
          <div className="jb-head rv">
            <span className="jb-label">진료과목</span>
            <h2 className="jb-h2">필요한 치료만, 필요한 만큼</h2>
            <p className="jb-lead">
              어떤 치료가 필요한지 먼저 확인하고, 지금 하지 않아도 되는 것은 그렇게 말씀드립니다.
            </p>
          </div>
          <div className="jb-grid4">
            {DEPTS.map((d, i) => (
              <a
                href="#fee"
                className="jb-card rv"
                key={d.name}
                style={{ ["--d" as string]: `${i * 0.06}s` }}
              >
                <div className="jb-card-img">
                  <img src={d.img} alt={d.alt} loading="lazy" />
                </div>
                <div className="jb-card-body">
                  <h3>{d.name}</h3>
                  <p>{d.desc}</p>
                  <span className="jb-card-more">비용 보기 →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 왜 정본치과인가 ──────────────────────────────── */}
      <section className="jb-sec soft" id="why">
        <div className="jb-wrap">
          <div className="jb-head center rv">
            <span className="jb-label">병원소개</span>
            <h2 className="jb-h2">환자분들이 정본치과를 선택하는 이유</h2>
            <p className="jb-lead">
              잘하는 것을 늘어놓기보다, 저희가 지키는 여섯 가지를 적었습니다.
            </p>
          </div>
          <div className="jb-grid3">
            {REASONS.map(([no, title, body], i) => (
              <div className="jb-reason rv" key={no} style={{ ["--d" as string]: `${(i % 3) * 0.06}s` }}>
                <b className="jb-mono">{no}</b>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 프로세스 ─────────────────────────────────────── */}
      <section className="jb-sec">
        <div className="jb-wrap">
          <div className="jb-head rv">
            <span className="jb-label">진료 절차</span>
            <h2 className="jb-h2">처음 오시면 이렇게 진행됩니다</h2>
            <p className="jb-lead">첫날은 검사와 상담까지 약 40분 정도 걸립니다.</p>
          </div>
          <div className="jb-steps">
            {STEPS.map(([no, title, body], i) => (
              <div className="jb-step rv" key={no} style={{ ["--d" as string]: `${i * 0.06}s` }}>
                <b className="jb-mono">{no}</b>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 비용 ─────────────────────────────────────────── */}
      <section className="jb-sec soft" id="fee">
        <div className="jb-wrap">
          <div className="jb-head rv">
            <span className="jb-label">비용안내</span>
            <h2 className="jb-h2">비급여 진료비를 먼저 공개합니다</h2>
            <p className="jb-lead">
              아래 금액을 넘겨 받지 않습니다. 상담에서는 이 표를 기준으로 계획서를 만들어
              드립니다.
            </p>
          </div>

          <table className="jb-fee rv">
            <thead>
              <tr>
                <th scope="col">항목</th>
                <th scope="col" className="price">
                  금액
                </th>
              </tr>
            </thead>
            <tbody>
              {FEES.map((f) => (
                <tr key={f.name}>
                  <th scope="row">
                    {f.name}
                    <span className="note">{f.note}</span>
                  </th>
                  <td className="price jb-mono">{f.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="jb-fee-foot rv">
            의료법 제45조에 따른 비급여 진료비용 고지입니다. 뼈 상태와 잇몸 상태에 따라 항목이
            추가될 수 있으며, 추가되는 경우 시술 전에 다시 안내드립니다.
          </p>
        </div>
      </section>

      {/* ── 장비 ─────────────────────────────────────────── */}
      <section className="jb-sec dark" id="equip">
        <div className="jb-wrap">
          <div className="jb-head rv">
            <span className="jb-label">장비 · 시설</span>
            <h2 className="jb-h2">눈으로 확인하고 설명드립니다</h2>
            <p className="jb-lead">
              장비 사진 대신, 그 장비가 만들어낸 화면을 보여드립니다. 같은 치아를 세 가지 방식으로
              확인합니다.
            </p>
          </div>
          <div className="jb-equip">
            {EQUIP.map(([img, title, body], i) => (
              <figure className="rv" key={title} style={{ ["--d" as string]: `${i * 0.08}s` }}>
                <img src={img} alt={`${title}로 확인한 치아 단면`} loading="lazy" />
                <figcaption>
                  <b>{title}</b>
                  <span>{body}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── 의료진 ───────────────────────────────────────── */}
      <section className="jb-sec" id="doctors">
        <div className="jb-wrap">
          <div className="jb-head rv">
            <span className="jb-label">의료진</span>
            <h2 className="jb-h2">진단한 의사가 시술합니다</h2>
            <p className="jb-lead">
              상담한 의사가 시술하고 이후 관리까지 맡습니다. 담당이 바뀌는 경우 미리 알려드립니다.
            </p>
          </div>
          <div className="jb-grid3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            {DOCTORS.map((d, i) => (
              <div className="jb-doc rv" key={d.name} style={{ ["--d" as string]: `${i * 0.08}s` }}>
                <div className="jb-doc-top">
                  <h3>{d.name}</h3>
                  <span>{d.role}</span>
                </div>
                <ul>
                  {d.career.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="jb-sec soft">
        <div className="jb-wrap" style={{ maxWidth: 820 }}>
          <div className="jb-head rv">
            <span className="jb-label">자주 묻는 질문</span>
            <h2 className="jb-h2">궁금하신 점</h2>
          </div>
          <div className="jb-faq rv">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>
                  <b className="jb-mono">Q</b>
                  {q}
                </summary>
                <p className="jb-faq-a">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 진료시간 · 오시는길 ──────────────────────────── */}
      <section className="jb-sec" id="visit">
        <div className="jb-wrap">
          <div className="jb-head rv">
            <span className="jb-label">진료시간 · 오시는길</span>
            <h2 className="jb-h2">언제 오시면 되는지</h2>
          </div>

          <div className="jb-visit">
            <div className="rv">
              <span className={`jb-open-now${openNow ? "" : " closed"}`}>
                <i aria-hidden="true" />
                {openNow ? "지금 진료 중입니다" : "지금은 진료시간이 아닙니다"}
              </span>
              <table className="jb-hours">
                <tbody>
                  {HOURS.map((r) => (
                    <tr key={r.day} className={r.late ? "late" : r.off ? "off" : undefined}>
                      <th scope="row">{r.day}</th>
                      <td className="jb-mono">{r.open}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="jb-map rv" style={{ ["--d" as string]: "0.08s" }}>
              <h3>오시는길</h3>
              <dl>
                <dt>주소</dt>
                <dd>
                  <b>서울시 ○○구 ○○로 00, 3층</b>
                </dd>
                <dt>지하철</dt>
                <dd>○○역 0번 출구 도보 3분</dd>
                <dt>주차</dt>
                <dd>건물 지하주차장 · 진료 시 2시간 무료</dd>
                <dt>전화</dt>
                <dd>
                  <a href={`tel:${TEL.replace(/-/g, "")}`} className="jb-mono">
                    {TEL}
                  </a>
                </dd>
              </dl>
              <p style={{ marginTop: "1.2rem", fontSize: "0.82rem", color: "var(--jb-dim)" }}>
                포트폴리오 데모 페이지라 지도와 주소는 예시로 표기했습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 상담 CTA ─────────────────────────────────────── */}
      <section className="jb-sec cta jb-cta">
        <div className="jb-wrap">
          <h2 className="rv">
            치료를 결정하기 전에,
            <br />
            먼저 확인해 보세요.
          </h2>
          <p className="rv">
            검사와 상담까지 약 40분입니다. 상담 후 그날 결정하지 않으셔도 계획서는 그대로
            드립니다.
          </p>
          <a href={`tel:${TEL.replace(/-/g, "")}`} className="jb-tel jb-mono rv">
            {TEL}
          </a>
          <div className="jb-cta-row rv">
            <a href={`tel:${TEL.replace(/-/g, "")}`} className="jb-btn primary">
              전화로 상담 예약
            </a>
            <a href="#visit" className="jb-btn ghost">
              진료시간 보기
            </a>
          </div>
        </div>
      </section>

      {/* ── 푸터 ─────────────────────────────────────────── */}
      <footer className="jb-foot">
        <div className="jb-wrap">
          <b>정본치과의원</b>
          <p>서울시 ○○구 ○○로 00, 3층 · 대표전화 {TEL}</p>
          <p>진료시간 평일 09:30–18:30 · 수 · 목 21:00까지 · 토 09:30–13:30 · 일요일 · 공휴일 휴진</p>
          <div className="jb-demo">
            이 페이지는 포트폴리오 데모이며 실재하는 의료기관이 아닙니다. 의료진 · 금액 · 주소 ·
            연락처는 모두 예시이고, 이미지는 AI로 생성한 연출 컷입니다.
            <br />
            <Link to="/" style={{ textDecoration: "underline" }}>
              ← Portfolio로 돌아가기
            </Link>
          </div>
        </div>
      </footer>

      {/* 모바일 하단 고정 바 */}
      <div className="jb-dock">
        <a href="#visit">오시는길</a>
        <a href="#fee">비용안내</a>
        <a href={`tel:${TEL.replace(/-/g, "")}`} className="call">
          전화 상담
        </a>
      </div>
    </div>
  );
}
