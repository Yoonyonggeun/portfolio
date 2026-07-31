import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import "./jeongbon.css";

/*
 * 정본치과의원 正本 — 발간된 문서로 작동하는 치과 페이지.
 *
 * 이 페이지의 지배적 동작은 스크롤이 아니라 '조판'이다. 축을 바꾸면 견적서가
 * 다시 짜이고, 누르고 있는 동안에만 시간이 흐르고, 인쇄하면 종이가 나온다.
 * 시리즈 01~04가 전부 프레임/영상 스크럽이었으므로 여기엔 스크럽이 없다.
 */

const A = "/assets/jeongbon";

/* ─────────────────────────────────────────────────────────────
 * 훅
 * ───────────────────────────────────────────────────────────── */

function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>(".rv, .ink-in");
    const showAll = () => targets.forEach((n) => n.classList.add("in"));
    if (!("IntersectionObserver" in window)) {
      showAll();
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

/* ─────────────────────────────────────────────────────────────
 * 00 표지 / 판권
 * ───────────────────────────────────────────────────────────── */

const TOC: [string, string, string, string][] = [
  ["01", "fee", "진료비 정본", "3분"],
  ["02", "watch", "지금 치료하지 않아도 되는 경우", "2분"],
  ["03", "time", "시간 — 하루와 반년", "4분"],
  ["04", "viewbox", "판독대", "2분"],
  ["05", "adverse", "잘못될 수 있는 것", "3분"],
  ["06", "protocol", "절차와 담당", "2분"],
  ["07", "worksheet", "상담 준비 서식", "2분"],
];

const EDIT_RULES = [
  "이 문서에는 장비 사진이 없습니다. 장비가 만든 화면만 있습니다.",
  "이 문서에는 후기와 치료 전후 사진이 없습니다. 진단 기준과 치료 단계를 대신 적었습니다.",
  "이 문서에는 인물 사진이 없습니다. 누가 무엇을 맡는지는 06에 적혀 있습니다.",
];

function Colophon({ halted }: { halted: boolean }) {
  const ref = useReveal<HTMLElement>();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* 06 제3조는 이 페이지에도 적용된다 — 멈추면 필름도 선다. */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (halted) v.pause();
  }, [halted]);

  return (
    <header className="jb-sec jb-cover" ref={ref}>
      <div className="jb-film">
        {/* 영상 위에 글자를 한 자도 얹지 않는다 — 국내 표준의 정반대 */}
        <video
          ref={videoRef}
          src={`${A}/hero.mp4`}
          poster={`${A}/hero-lg.webp`}
          autoPlay
          muted
          playsInline
          preload="metadata"
        />
        <p className="jb-film-meta jb-mono">JB-2026-04 · FIG.0</p>
      </div>

      <div className="jb-grid jb-cover-grid">
        <div className="jb-aside jb-mono">
          <p style={{ margin: 0 }}>
            JB-2026-04
            <br />
            개정 4판
            <br />
            2026.07.31 발행
          </p>
          <p style={{ marginTop: "1.2rem" }}>
            의료법 제45조에 따른
            <br />
            비급여 진료비용 고지 포함
          </p>
        </div>

        <div className="jb-body">
          <h1 className="jb-h1 rv">
            상담실에서 듣게 될 말을, 오시기 전에 적어 둡니다.
          </h1>

          <p className="jb-def rv" style={{ ["--d" as string]: "0.06s" }}>
            <b>正本</b>
            <i>명</i>
            원본과 같은 효력을 가지는 문서. 사본이 아니라 정본을 드립니다.
          </p>

          <ul className="jb-rules rv" style={{ ["--d" as string]: "0.1s" }}>
            {EDIT_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          <ul className="jb-toc rv" style={{ ["--d" as string]: "0.14s" }}>
            {TOC.map(([no, id, name, min]) => (
              <li key={no}>
                <a href={`#${id}`}>
                  <span className="jb-toc-no jb-mono">{no}</span>
                  <span className="jb-toc-name">{name}</span>
                  <span className="jb-leader" aria-hidden="true" />
                  <span className="jb-toc-min jb-mono">{min}</span>
                </a>
              </li>
            ))}
          </ul>

          <p className="jb-note">
            포트폴리오 데모 페이지입니다. 실재하는 의료기관이 아니며, 금액 · 재료 ·
            일정은 구조를 보여주기 위한 예시입니다.
          </p>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 01 진료비 정본 — 시그니처
 * ───────────────────────────────────────────────────────────── */

type Proc = "implant" | "crown" | "resin" | "perio";
type Fixture = "dom" | "mid" | "prem";
type Pros = "zir" | "pfm" | "gold";
type Graft = "none" | "simple" | "sinus";

type Plan = {
  proc: Proc;
  count: number;
  fixture: Fixture;
  pros: Pros;
  graft: Graft;
};

type Row = {
  code: string;
  name: string;
  spec: string;
  unit: string;
  qty: number;
  price: number;
  /* 참고 축. [최저, 평균, 최고] — 도식화용 예시 값이다. */
  band?: [number, number, number];
  part?: {
    img?: string;
    alt?: string;
    dl: [string, string][];
  };
};

const FIXTURES: Record<Fixture, { label: string; price: number; maker: string; code: string }> = {
  dom: { label: "국산", price: 1180000, maker: "국내 제조 · SLA 표면", code: "FX-D410" },
  mid: { label: "수입 보급", price: 1380000, maker: "수입 · SLA 표면", code: "FX-M520" },
  prem: { label: "수입 상위", price: 1680000, maker: "수입 · SLActive 표면", code: "FX-P730" },
};

const PROSTHESES: Record<Pros, { label: string; price: number; note: string }> = {
  zir: { label: "지르코니아", price: 510000, note: "밀링 가공 후 소결" },
  pfm: { label: "PFM", price: 420000, note: "금속 코핑 위 도재 축성" },
  gold: { label: "골드", price: 620000, note: "주조 · 함량에 따라 변동" },
};

const GRAFTS: Record<Graft, { label: string; price: number; note: string }> = {
  none: { label: "없음", price: 0, note: "" },
  simple: { label: "단순", price: 330000, note: "이식재 · 차폐막 포함" },
  sinus: { label: "상악동 거상", price: 880000, note: "접근 방식에 따라 변동" },
};

const PROCS: Record<Proc, string> = {
  implant: "임플란트",
  crown: "크라운",
  resin: "레진",
  perio: "치주",
};

function buildRows(plan: Plan): Row[] {
  const rows: Row[] = [
    {
      code: "DX-000",
      name: "진단 및 치료계획 수립",
      spec: "파노라마 · CBCT · 구강 스캔",
      unit: "1회",
      qty: 1,
      price: 0,
      part: {
        dl: [
          ["포함", "촬영 · 판독 · 계획 수립 · 서면 계획서"],
          ["별도", "없음"],
          ["자료 제공", "요청 시 원본 파일로 드립니다"],
        ],
      },
    },
  ];

  if (plan.proc === "implant") {
    const fx = FIXTURES[plan.fixture];
    const pr = PROSTHESES[plan.pros];
    const gf = GRAFTS[plan.graft];
    rows.push({
      code: fx.code,
      name: "픽스처 식립",
      spec: `${fx.label} · ${fx.maker}`,
      unit: "1치",
      qty: plan.count,
      price: fx.price,
      band: [900000, 1350000, 2200000],
      part: {
        img: `${A}/part-fixture.webp`,
        alt: "티타늄 픽스처 나사산 표면 매크로",
        dl: [
          ["규격 코드", fx.code],
          ["표면 처리", fx.maker],
          ["포함", "식립 수술 · 봉합 · 발사 · 골융합 확인 촬영"],
          ["사후관리", "장착 후 5년 · 연 1회 정기 확인"],
        ],
      },
    });
    rows.push({
      code: "PR-100",
      name: "보철 (크라운)",
      spec: `${pr.label} · ${pr.note}`,
      unit: "1치",
      qty: plan.count,
      price: pr.price,
      band: [350000, 520000, 800000],
      part: {
        img: `${A}/part-zirconia.webp`,
        alt: "지르코니아 블록 절단면 매크로",
        dl: [
          ["재료", pr.label],
          ["대체 시 차액", diffText(plan.pros)],
          ["포함", "인상 채득 · 시적 · 장착 · 교합 조정 2회"],
          ["재제작", "파절 시 01의 규칙을 따릅니다"],
        ],
      },
    });
    if (plan.graft !== "none") {
      rows.push({
        code: "GR-200",
        name: gf.label === "단순" ? "골이식 (단순)" : "상악동 거상술",
        spec: gf.note,
        unit: "1부위",
        qty: 1,
        price: gf.price,
        band: [250000, 600000, 1200000],
      });
    }
  }

  if (plan.proc === "crown") {
    const pr = PROSTHESES[plan.pros];
    rows.push({
      code: "PR-100",
      name: "보철 (크라운)",
      spec: `${pr.label} · ${pr.note}`,
      unit: "1치",
      qty: plan.count,
      price: pr.price,
      band: [350000, 520000, 800000],
      part: {
        img: `${A}/part-zirconia.webp`,
        alt: "지르코니아 블록 절단면 매크로",
        dl: [
          ["재료", pr.label],
          ["대체 시 차액", diffText(plan.pros)],
          ["포함", "인상 채득 · 시적 · 장착 · 교합 조정 2회"],
        ],
      },
    });
  }

  if (plan.proc === "resin") {
    rows.push({
      code: "RS-300",
      name: "광중합형 복합레진 충전",
      spec: "1면 기준 · 면 수에 따라 변동",
      unit: "1치",
      qty: plan.count,
      price: 120000,
      band: [70000, 130000, 250000],
    });
  }

  if (plan.proc === "perio") {
    rows.push({
      code: "PD-400",
      name: "치주 치료",
      spec: "치석 제거 후 재측정 · 급여 적용 시 별도",
      unit: "1부위",
      qty: plan.count,
      price: 90000,
    });
  }

  rows.push({
    code: "AF-900",
    name: "사후관리 · 감염관리",
    spec: "멸균 포장 기구 · 1회용 소모품",
    unit: "1건",
    qty: 1,
    price: 0,
    part: {
      img: `${A}/part-sterile.webp`,
      alt: "멸균 포장지와 앰플 매크로",
      dl: [
        ["멸균", "기구는 포장 단위로 관리하고 개봉을 보시게 합니다"],
        ["1회용", "석션 팁 · 트레이 · 장갑 · 마취 앰플"],
        ["비용", "진료비에 포함되며 따로 청구하지 않습니다"],
      ],
    },
  });

  return rows;
}

function diffText(p: Pros) {
  const base = PROSTHESES[p].price;
  const others = (Object.keys(PROSTHESES) as Pros[])
    .filter((k) => k !== p)
    .map((k) => {
      const d = PROSTHESES[k].price - base;
      return `${PROSTHESES[k].label} ${d >= 0 ? "+" : "−"}${Math.abs(d).toLocaleString("ko-KR")}원`;
    });
  return others.join(" · ");
}

/* 자릿수 롤. 값이 바뀐 자리만 움직인다 — rAF도 setInterval도 없다. */
function Digits({ value }: { value: number }) {
  const chars = value.toLocaleString("ko-KR").split("");
  return (
    <span className="jb-total-num jb-mono" aria-hidden="true">
      {chars.map((ch, i) =>
        ch === "," ? (
          <span key={`c${i}`}>,</span>
        ) : (
          <span key={`d${i}`} className="jb-digit">
            <span
              className="jb-digit-strip"
              style={{ ["--n" as string]: Number(ch), ["--i" as string]: i }}
            >
              {"0123456789".split("").map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ),
      )}
      <span className="jb-won">원</span>
    </span>
  );
}

/* 참고 축. 자기 가격 마커는 찍지 않는다 — 그래픽이 비교를 수행하면 비교광고가 된다. */
function Band({ band }: { band: [number, number, number] }) {
  const [lo, avg, hi] = band;
  const span = hi * 1.15;
  return (
    <div className="jb-hira" aria-hidden="true">
      <span
        className="jb-hira-range"
        style={{
          ["--lo" as string]: `${(lo / span) * 100}%`,
          ["--w" as string]: `${((hi - lo) / span) * 100}%`,
        }}
      />
      <span className="jb-hira-avg" style={{ ["--avg" as string]: `${(avg / span) * 100}%` }} />
    </div>
  );
}

const AXES: {
  key: keyof Plan;
  label: string;
  options: [string, string][];
}[] = [
  { key: "proc", label: "진료", options: (Object.keys(PROCS) as Proc[]).map((k) => [k, PROCS[k]]) },
  {
    key: "fixture",
    label: "픽스처",
    options: (Object.keys(FIXTURES) as Fixture[]).map((k) => [k, FIXTURES[k].label]),
  },
  {
    key: "pros",
    label: "보철",
    options: (Object.keys(PROSTHESES) as Pros[]).map((k) => [k, PROSTHESES[k].label]),
  },
  {
    key: "graft",
    label: "뼈이식",
    options: (Object.keys(GRAFTS) as Graft[]).map((k) => [k, GRAFTS[k].label]),
  },
];

function FeeSheet() {
  const ref = useReveal<HTMLElement>();
  const [plan, setPlan] = useState<Plan>({
    proc: "implant",
    count: 1,
    fixture: "dom",
    pros: "zir",
    graft: "none",
  });
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => buildRows(plan), [plan]);
  const total = useMemo(() => rows.reduce((s, r) => s + r.price * r.qty, 0), [rows]);

  /* 임플란트가 아닌 진료는 픽스처·뼈이식 축이 의미가 없다. 축을 회색으로
     비활성화하지 않고 아예 빼는 이유는, 고를 수 없는 것을 보여주는 것이
     이 문서의 규칙(감추지 않는다)과 충돌하지 않는 유일한 방식이기 때문이다. */
  const axisUsed = (k: keyof Plan) => {
    if (k === "proc") return true;
    if (plan.proc === "implant") return true;
    return k === "pros" && plan.proc === "crown";
  };

  return (
    <section className="jb-sec" id="fee" ref={ref}>
      <div className="jb-grid">
        <div className="jb-aside jb-mono">
          <p style={{ margin: 0 }}>
            의료법 제45조
            <br />
            비급여 진료비용 고지
          </p>
          <p style={{ marginTop: "1.1rem" }}>
            축을 바꾸면 아래 계획서가
            <br />
            다시 조판됩니다.
          </p>
        </div>

        <div className="jb-body">
          <p className="jb-secno jb-mono">01</p>
          <h2 className="jb-h2 rv">진료비 정본</h2>
          <p className="jb-sub rv" style={{ ["--d" as string]: "0.06s" }}>
            여기 적힌 금액을 넘겨 받지 않습니다.
          </p>

          <div className="jb-axes rv" style={{ ["--d" as string]: "0.1s" }}>
            {AXES.filter((a) => axisUsed(a.key)).map((axis) => (
              <div className="jb-axis" key={axis.key}>
                <span className="jb-axis-label jb-mono" id={`ax-${axis.key}`}>
                  {axis.label}
                </span>
                <div className="jb-seg" role="radiogroup" aria-labelledby={`ax-${axis.key}`}>
                  {axis.options.map(([val, label]) => {
                    const checked = (plan[axis.key] as string) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        tabIndex={checked ? 0 : -1}
                        className="jb-chip"
                        onClick={() => setPlan((p) => ({ ...p, [axis.key]: val }))}
                        onKeyDown={(e) => {
                          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                          e.preventDefault();
                          const i = axis.options.findIndex(([v]) => v === plan[axis.key]);
                          const n =
                            (i + (e.key === "ArrowRight" ? 1 : -1) + axis.options.length) %
                            axis.options.length;
                          setPlan((p) => ({ ...p, [axis.key]: axis.options[n][0] }));
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="jb-axis">
              <label className="jb-axis-label jb-mono" htmlFor="jb-count">
                개수
              </label>
              <div className="jb-count">
                <input
                  id="jb-count"
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={plan.count}
                  onChange={(e) => setPlan((p) => ({ ...p, count: Number(e.target.value) }))}
                />
                <span className="jb-count-val jb-mono">{plan.count}치</span>
              </div>
            </div>
          </div>

          {/* 시트 — 인쇄하면 이 부분만 A4 한 장으로 나간다 */}
          <div className="jb-sheet">
            <div className="jb-sheet-head jb-mono">
              <b>치료비용계획서 (예시)</b>
              <span>JB-2026-04 · 개정 4판 · 유효기간 2026.12.31</span>
            </div>

            <p className="jb-law">
              여기 적힌 금액을 넘겨 받지 않습니다. <span>— 의료법 제45조</span>
            </p>

            <table className="jb-table">
              <caption>
                {PROCS[plan.proc]} · {plan.count}치 기준. 항목을 누르면 구성 내역이 열립니다.
              </caption>
              <thead>
                <tr>
                  <th scope="col">항목</th>
                  <th scope="col">규격</th>
                  <th scope="col" className="num">
                    수량
                  </th>
                  <th scope="col" className="num">
                    금액
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.code}>
                    <td>
                      <span className="ink-in" style={{ ["--i" as string]: i }}>
                        {r.part && (
                          <button
                            type="button"
                            className="jb-row-open jb-mono"
                            aria-expanded={open === r.code}
                            aria-controls={`part-${r.code}`}
                            onClick={() => setOpen(open === r.code ? null : r.code)}
                          >
                            §
                          </button>
                        )}
                        <span className="jb-item-name">{r.name}</span>
                      </span>
                      {r.part && (
                        <div
                          className={`jb-part${open === r.code ? " open" : ""}`}
                          id={`part-${r.code}`}
                        >
                          <div>
                            <div className="jb-part-inner">
                              {r.part.img ? (
                                <img src={r.part.img} alt={r.part.alt ?? ""} loading="lazy" />
                              ) : (
                                <span />
                              )}
                              <dl>
                                {r.part.dl.map(([k, v]) => (
                                  <div key={k} style={{ display: "contents" }}>
                                    <dt>{k}</dt>
                                    <dd>{v}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="jb-item-spec">{r.spec}</span>
                      {r.band && <Band band={r.band} />}
                    </td>
                    <td className="num jb-mono">
                      {r.qty}
                      {r.unit.replace(/^1/, "")}
                    </td>
                    <td className="num jb-mono">
                      {r.price === 0 ? "포함" : (r.price * r.qty).toLocaleString("ko-KR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="jb-total">
              <span className="jb-total-label jb-mono">합계 · 부가세 없음</span>
              <output aria-live="polite">
                <span className="jb-sr">합계 {total.toLocaleString("ko-KR")}원</span>
                <Digits value={total} />
              </output>
            </div>

            <p className="jb-hira-cap">
              규격 열의 회색 축은 비급여 진료비용 분포를 도식화한 참고 축(예시 값)입니다. 항목별
              차이는 인력 · 시설 · 장비 · 난이도에 따라 발생할 수 있습니다.
            </p>
          </div>

          <div className="jb-fee-foot">
            <b>할인하지 않습니다. 대신 구성 내역을 전부 적습니다.</b>
            <span>이 화면을 인쇄해서 다른 치과에 가져가셔도 됩니다. 서명은 필요하지 않습니다.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 02 지금 치료하지 않아도 되는 경우 — 모션 없음
 * ───────────────────────────────────────────────────────────── */

const JUDGE: [string, string, string, boolean][] = [
  ["착색만 있고 실질 결손이 없는 초기 우식", "관찰", "6개월 후 재평가", false],
  ["증상이 없고 인접치를 밀지 않는 매복 사랑니", "관찰", "연 1회 방사선 확인", false],
  ["탐침 깊이 3mm 미만의 치은열구", "관찰", "스케일링 후 재측정", false],
  ["실질 결손 없이 균열선만 관찰되는 교합면", "관찰", "교합 조정 후 경과", false],
  ["탐침 깊이 5mm 이상이고 방사선상 골 소실이 동반된 부위", "처치", "치주 치료 시작", true],
  ["저작 시 통증이 있고 균열이 상아질에 도달한 치아", "처치", "보존 여부 판단", true],
];

function WatchList() {
  return (
    <section className="jb-sec jb-watch" id="watch">
      <div className="jb-grid">
        <div className="jb-aside jb-mono">
          <p style={{ margin: 0 }}>
            치주 단계 구분은 2018 AAP/EFP 분류를 따릅니다. 같은 상태라도 저작 습관과 전신
            질환에 따라 판단이 달라질 수 있습니다.
          </p>
        </div>
        <div className="jb-body">
          <p className="jb-secno jb-mono">02</p>
          <h2 className="jb-h2">지금 치료하지 않아도 되는 경우</h2>
          <p className="jb-sub">관찰로 두는 기준을 먼저 적습니다.</p>

          <table className="jb-judge">
            <thead>
              <tr>
                <th scope="col">이런 상태</th>
                <th scope="col">정본치과의 기준</th>
                <th scope="col">다음</th>
              </tr>
            </thead>
            <tbody>
              {JUDGE.map(([state, verdict, next, act]) => (
                <tr key={state}>
                  <td>{state}</td>
                  <td className={`jb-verdict${act ? " act" : ""}`}>{verdict}</td>
                  <td className="jb-judge-why jb-mono">{next}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 03 시간 — 하루(홀드)와 반년(주 단위 트랙)
 * ───────────────────────────────────────────────────────────── */

/* 42분을 분 단위로. 폭이 실제 소요 분에 비례한다 — 균질 그리드를 깬다. */
const DAY1: [string, number, number, string][] = [
  ["접수", 0, 3, "소리 없음"],
  ["상담 (진료의자 밖)", 3, 8, "소리 없음"],
  ["파노라마 촬영", 11, 3, "장비가 도는 소리가 납니다"],
  ["구강 스캔", 14, 8, "차가운 공기가 닿습니다"],
  ["설명과 질문", 22, 16, "소리 없음"],
  ["오늘 정할 것", 38, 4, "압박감이 있습니다. 통증은 아닙니다"],
];
const DAY1_TOTAL = 42;
/* 홀드 18초에 42분을 통과한다 */
const HOLD_SECONDS = 18;

function fmtClock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/*
 * 고정 공휴일만 담는다. 음력 공휴일(설·추석)은 해마다 달라 조용히 틀릴 위험이
 * 있으므로 넣지 않는다 — 정확성이 이 문서의 유일한 자산이다.
 */
const HOLIDAYS = new Set([
  "01-01", "03-01", "05-05", "06-06", "08-15", "10-03", "10-09", "12-25",
]);
const HOLIDAYS_VALID_UNTIL = "2027-12-31";

const VISITS: [string, number][] = [
  ["상담 · 진단", 0],
  ["픽스처 식립", 1],
  ["봉합 확인 · 발사", 2],
  ["경과 확인", 4],
  ["2차 수술", 17],
  ["인상 채득", 19],
  ["보철 시적", 21],
  ["장착 · 교합 조정", 22],
];
const TRACK_WEEKS = 23;
const REST_FROM = 5;
const REST_TO = 16;
const PX_PER_DAY = 6;

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isoMD(d: Date) {
  return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/* 일요일·공휴일이면 다음 날로 민다 */
function shiftToOpen(d: Date): [Date, boolean] {
  let x = new Date(d);
  let moved = false;
  let guard = 0;
  while ((x.getDay() === 0 || HOLIDAYS.has(isoMD(x))) && guard < 10) {
    x = addDays(x, 1);
    moved = true;
    guard += 1;
  }
  return [x, moved];
}

const KO_DATE = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

function TimeSection({
  halted,
  onMarks,
}: {
  halted: boolean;
  onMarks: (n: number) => void;
}) {
  const ref = useReveal<HTMLElement>();

  /* ── 3-A 홀드 ── */
  const stripRef = useRef<HTMLDivElement | null>(null);
  const readRef = useRef<HTMLSpanElement | null>(null);
  const holding = useRef(false);
  const tRef = useRef(0);
  const velRef = useRef(0);
  const [marks, setMarks] = useState<number[]>([]);

  useEffect(() => {
    if (halted) {
      holding.current = false;
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last) / 1000;
      last = now;
      const target = holding.current ? 1 : 0;
      /* 가속 0.12 / 감속 0.35 — 뗀 뒤 약 120ms에 선다. 0ms로 끊으면 고장으로 읽힌다. */
      velRef.current += (target - velRef.current) * (holding.current ? 0.12 : 0.35);
      if (velRef.current > 0.0008) {
        tRef.current = Math.min(1, tRef.current + (velRef.current * dt) / HOLD_SECONDS);
      }
      const el = stripRef.current;
      if (el) el.style.setProperty("--t", String(tRef.current));
      const r = readRef.current;
      if (r) r.textContent = fmtClock(tRef.current * DAY1_TOTAL * 60);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [halted]);

  const release = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    /* 손을 뗀 자리에 표시가 남는다. 되감기는 없다. */
    setMarks((m) => {
      if (m.length > 11) return m;
      const next = [...m, tRef.current];
      onMarks(next.length);
      return next;
    });
  }, [onMarks]);

  const jumpTo = (frac: number) => {
    tRef.current = frac;
    const el = stripRef.current;
    if (el) el.style.setProperty("--t", String(frac));
  };

  /* ── 3-B 시작일 드래그 ── */
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return shiftToOpen(addDays(d, 3))[0];
  });
  const dragRef = useRef<{ x: number; base: Date } | null>(null);
  const [osseoOpen, setOsseoOpen] = useState(false);

  const visits = useMemo(
    () =>
      VISITS.map(([label, wk]) => {
        const raw = addDays(startDate, wk * 7);
        const [d, moved] = shiftToOpen(raw);
        return { label, wk, date: d, moved };
      }),
    [startDate],
  );
  const showAdj = useMemo(() => new Date() <= new Date(HOLIDAYS_VALID_UNTIL), []);
  const visitWeeks = useMemo(() => new Set(VISITS.map(([, w]) => w)), []);

  const onHandleMove = (clientX: number) => {
    const st = dragRef.current;
    if (!st) return;
    const days = Math.round((clientX - st.x) / PX_PER_DAY);
    setStartDate(shiftToOpen(addDays(st.base, days))[0]);
  };

  /* 무작위 배열 → 동심원 층판. 시드 고정이라 매번 같은 그림이 나온다. */
  const osseoLines = useMemo(() => {
    let seed = 20260731;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    return Array.from({ length: 80 }, (_, i) => {
      const ring = Math.floor(i / 16);
      const idx = i % 16;
      return {
        x: 6 + (i % 20) * 4.7,
        y: 8 + Math.floor(i / 20) * 9,
        a0: `${Math.round(rnd() * 360)}deg`,
        a1: `${Math.round((idx / 16) * 360 + ring * 8)}deg`,
        i,
      };
    });
  }, []);

  return (
    <section className="jb-sec" id="time" ref={ref}>
      <div className="jb-grid">
        <div className="jb-aside jb-mono">
          <p style={{ margin: 0 }}>
            임플란트는 12~24주입니다. 여기 적힌 22주는 이 조합의 평균이며 개인차가 있습니다.
          </p>
          <p style={{ marginTop: "1.1rem" }}>
            가로 간격은 실제 일수에 비례하지 않습니다. 처음 4주에 내원이 몰립니다.
          </p>
        </div>

        <div className="jb-body">
          <p className="jb-secno jb-mono">03</p>
          <h2 className="jb-h2 rv">시간</h2>
          <p className="jb-sub rv" style={{ ["--d" as string]: "0.06s" }}>
            하루와 반년, 두 개의 축으로 적습니다.
          </p>

          {/* 3-A */}
          <p className="jb-sub rv" style={{ marginTop: "2.6rem", color: "var(--jb-ink)" }}>
            첫날은 42분입니다. 누르고 계신 동안에만 시간이 흐릅니다.
          </p>

          <div
            className="jb-hold"
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              holding.current = true;
            }}
            onPointerUp={release}
            onPointerCancel={release}
            onLostPointerCapture={release}
          >
            <div className="jb-hold-scale">
              {DAY1.map(([label, start, dur]) => (
                <button
                  key={label}
                  type="button"
                  className="jb-tick jb-mono"
                  style={{ flexGrow: dur }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => jumpTo(start / DAY1_TOTAL)}
                  aria-label={`${label} 구간으로 이동`}
                >
                  {String(start).padStart(2, "0")}
                </button>
              ))}
            </div>

            <div
              className="jb-strip"
              ref={stripRef}
              style={{ ["--t" as string]: 0 }}
              role="slider"
              tabIndex={0}
              aria-label={`첫날 42분의 구간. ${DAY1.map(([l, s, d]) => `${l} ${s}분부터 ${d}분`).join(", ")}. 스페이스를 누르고 있는 동안 시간이 흐릅니다.`}
              aria-valuemin={0}
              aria-valuemax={42}
              aria-valuenow={Math.round(tRef.current * 42)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "ArrowRight") {
                  e.preventDefault();
                  holding.current = true;
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "ArrowRight") release();
              }}
              onBlur={release}
            >
              {DAY1.map(([label, start, dur, sense]) => (
                <div
                  key={label}
                  className="jb-seg-block"
                  style={{
                    flexGrow: dur,
                    ["--s0" as string]: start / DAY1_TOTAL,
                    ["--sd" as string]: dur / DAY1_TOTAL,
                  }}
                >
                  <b>{label}</b>
                  <i>{sense}</i>
                  <i style={{ marginTop: 6 }}>여기서 멈출 수 있습니다.</i>
                </div>
              ))}
              {marks.map((m, i) => (
                <span key={i} className="jb-mark" style={{ ["--m" as string]: m }} />
              ))}
              <span className="jb-cursor" />
            </div>

            <div className="jb-hold-read">
              <span className="jb-hold-time jb-mono" ref={readRef}>
                00:00
              </span>
              <span>
                {marks.length === 0
                  ? "누르고 계세요. 손을 떼면 그 자리에 표시가 남습니다."
                  : `여기까지 오시는 동안 ${marks.length}번 멈추셨습니다. 진료실에서도 그만큼 멈춥니다.`}
              </span>
            </div>
          </div>

          {/* 3-B */}
          <div className="jb-weeks">
            <p className="jb-sub" style={{ color: "var(--jb-ink)" }}>
              시작일을 옮겨 보세요. 나머지 날짜가 따라옵니다.
            </p>

            <div className="jb-track">
              <button
                type="button"
                className="jb-handle jb-mono"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={365}
                aria-valuenow={0}
                aria-valuetext={`${KO_DATE.format(startDate)} 시작, 총 ${VISITS.length}회 ${TRACK_WEEKS - 1}주`}
                aria-label="치료 시작일"
                onPointerDown={(e) => {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  dragRef.current = { x: e.clientX, base: startDate };
                }}
                onPointerMove={(e) => dragRef.current && onHandleMove(e.clientX)}
                onPointerUp={() => (dragRef.current = null)}
                onPointerCancel={() => (dragRef.current = null)}
                onLostPointerCapture={() => (dragRef.current = null)}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 7 : 1;
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setStartDate((d) => shiftToOpen(addDays(d, step))[0]);
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setStartDate((d) => shiftToOpen(addDays(d, -step))[0]);
                  }
                }}
              >
                {KO_DATE.format(startDate)}
              </button>

              {Array.from({ length: TRACK_WEEKS }, (_, w) => {
                const rest = w >= REST_FROM && w <= REST_TO;
                const visit = visitWeeks.has(w);
                return rest ? (
                  <button
                    key={w}
                    type="button"
                    className="jb-slit rest"
                    aria-label="내원 없음 — 뼈가 붙는 중. 눌러서 도해 보기"
                    aria-expanded={osseoOpen}
                    onClick={() => setOsseoOpen((v) => !v)}
                  />
                ) : (
                  <span key={w} className={`jb-slit${visit ? " visit" : ""}`} />
                );
              })}
            </div>

            <div className={`jb-osseo${osseoOpen ? " open" : ""}`}>
              <div>
                <svg viewBox="0 0 100 42" aria-label="골융합 도해 — 무작위 배열에서 층판 구조로">
                  {osseoLines.map((l) => (
                    <line
                      key={l.i}
                      x1={l.x}
                      y1={l.y}
                      x2={l.x + 3.2}
                      y2={l.y}
                      style={{
                        ["--a0" as string]: l.a0,
                        ["--a1" as string]: l.a1,
                        ["--i" as string]: l.i,
                      }}
                    />
                  ))}
                </svg>
                <div className="jb-osseo-legend jb-mono">
                  <span>0일 혈병</span>
                  <span>2주 혈관 증식</span>
                  <span>4주 미성숙 골 (woven bone)</span>
                  <span>12주 층판골</span>
                </div>
              </div>
            </div>

            <ol className="jb-visits">
              {visits.map((v, i) => (
                <li key={v.label}>
                  <b>
                    <span className="jb-mono" style={{ color: "var(--jb-margin)", fontSize: "0.66rem" }}>
                      {String(i + 1).padStart(2, "0")}{" "}
                    </span>
                    {v.label}
                  </b>
                  <i className="jb-mono">
                    {KO_DATE.format(v.date)}
                    {v.moved && showAdj && <span className="adj"> · 조정</span>}
                  </i>
                </li>
              ))}
            </ol>

            <p className="jb-note">
              총 {VISITS.length}회 내원 · 약 {TRACK_WEEKS - 1}주 · 마지막 방문{" "}
              <span className="jb-mono">{KO_DATE.format(visits[visits.length - 1].date)}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 04 판독대 — 커서의 X좌표가 곧 촬영 파장
 * ───────────────────────────────────────────────────────────── */

const WAVES: [string, string, string][] = [
  [
    "가시광 400–700nm",
    "spectrum-visible",
    "표면만 보입니다. 안쪽에서 진행 중인 것은 여기 없습니다.",
  ],
  [
    "근적외선 850nm",
    "spectrum-niri",
    "투명도가 낮을수록 밝습니다. 건전한 법랑질은 빛을 투과시켜 어둡고, 우식은 산란시켜 밝습니다. 방사선 피폭이 없습니다.",
  ],
  [
    "X선",
    "spectrum-xray",
    "광화도가 높을수록 밝습니다. 잇몸 아래 골 높이와 픽스처 주변이 여기서만 보입니다.",
  ],
];

function ViewBox({ halted }: { halted: boolean }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef(0);
  const curRef = useRef(0);
  const [wave, setWave] = useState(0);

  useEffect(() => {
    if (halted) return;
    let raf = 0;
    const tick = () => {
      /* 감쇠 추종 — 커서를 흔들어도 튀지 않는다 */
      curRef.current += (targetRef.current - curRef.current) * 0.16;
      const el = stageRef.current;
      if (el) el.style.setProperty("--p", curRef.current.toFixed(3));
      const idx = Math.max(0, Math.min(2, Math.round(curRef.current)));
      setWave((w) => (w === idx ? w : idx));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [halted]);

  /* 터치·키보드에서는 커서 대신 섹션 스크롤 진행도가 --p를 구동한다 */
  useEffect(() => {
    const onScroll = () => {
      const el = trackRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -r.top / total));
      if (window.matchMedia("(hover: none)").matches) targetRef.current = p * 2;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="jb-sec jb-viewbox" id="viewbox">
      <div className="jb-vb-track" ref={trackRef}>
        <div
          className="jb-vb-sticky"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            targetRef.current = Math.max(0, Math.min(2, ((e.clientX - r.left) / r.width) * 2));
          }}
        >
          <div>
            <p className="jb-secno jb-mono">04</p>
            <h2 className="jb-h2" style={{ fontSize: "clamp(1.6rem,3.4vw,2.4rem)" }}>
              판독대
            </h2>
            <p className="jb-sub">같은 치아를 세 가지 빛으로 봅니다. 가로로 움직이면 파장이 바뀝니다.</p>

            <div className="jb-spectrum jb-mono" role="tablist" aria-label="촬영 파장">
              {WAVES.map(([label], i) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={wave === i}
                  onClick={() => {
                    targetRef.current = i;
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="jb-vb-frame">
            <span className="jb-clip" style={{ left: "18%" }} />
            <span className="jb-clip" style={{ left: "38%" }} />
            <span className="jb-clip" style={{ left: "58%" }} />
            <span className="jb-clip" style={{ left: "78%" }} />

            <div className="jb-vb-stage" ref={stageRef} style={{ ["--p" as string]: 0 }}>
              {WAVES.map(([label, file], i) => (
                <div key={file} className="jb-layer" style={{ ["--s" as string]: i }}>
                  <img src={`${A}/${file}.webp`} alt={`같은 어금니 단면 — ${label}`} loading="lazy" />
                </div>
              ))}

              {/* 장식이 아니라 정보다. before/after 슬라이더 오독을 차단한다. */}
              <svg className="jb-vb-svg" viewBox="0 0 100 100" aria-hidden="true">
                <line x1="50" y1="4" x2="50" y2="14" />
                <line x1="50" y1="86" x2="50" y2="96" />
                <line x1="4" y1="50" x2="14" y2="50" />
                <line x1="86" y1="50" x2="96" y2="50" />
                <line className="jb-vb-scalebar" x1="8" y1="92" x2="24" y2="92" />
                <text x="8" y="89">
                  5 mm
                </text>
              </svg>
            </div>
          </div>

          <p className="jb-vb-cap">
            <b className="jb-mono">{WAVES[wave][0]}</b>
            {WAVES[wave][2]}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 05 잘못될 수 있는 것
 * ───────────────────────────────────────────────────────────── */

const ADVERSE: [string, string][] = [
  [
    "픽스처가 뼈와 붙지 않는 경우가 있습니다. 대체로 식립 후 8주 이내에 확인되며, 이때는 픽스처를 제거하고 치유 기간을 둔 뒤 다시 식립합니다. 재식립 시 비용 처리는 01의 규칙을 그대로 따릅니다.",
    "골융합 실패의 확인 시점은 정기 촬영 일정에 따릅니다.",
  ],
  [
    "아래턱 어금니 부위에는 하치조신경이 지나갑니다. CBCT로 신경관까지의 거리를 재고 여유를 두는 것을 기준으로 하지만, 그럼에도 시술 후 감각 저하가 남는 사례가 보고되어 있습니다.",
    "신경관까지의 거리는 진단 자료에 수치로 남기고, 요청하시면 드립니다.",
  ],
  [
    "지르코니아 보철도 깨집니다. 이를 악무는 습관이 있으면 확률이 올라가고, 그런 경우 재제작이 필요합니다.",
    "야간 이갈이가 확인되면 장치 착용을 함께 설명드립니다.",
  ],
  [
    "임시 보철을 쓰는 기간에는 단단한 음식을 씹기 어렵습니다. 03에 적힌 22주 중 약 6주가 여기에 해당합니다.",
    "해당 기간은 03의 트랙에서 빗금으로 표시된 구간 전후입니다.",
  ],
  [
    "교정 중에는 치근이 짧아질 수 있습니다. 정기 방사선 확인으로 진행 여부를 봅니다.",
    "확인 주기는 장치 종류에 따라 달라집니다.",
  ],
];

function Adverse() {
  const ref = useReveal<HTMLElement>();
  const [lit, setLit] = useState<number | null>(null);
  return (
    <section className="jb-sec jb-adverse" id="adverse" ref={ref}>
      <div className="jb-adverse-wrap">
        <p className="jb-secno jb-mono">05</p>
        <h2 className="jb-h2" style={{ fontSize: "clamp(1.7rem,3.2vw,2.3rem)" }}>
          잘못될 수 있는 것
        </h2>
        <p className="jb-sub">일어날 수 있는 일을 먼저 적어 두는 것도 설명의 일부입니다.</p>

        {ADVERSE.map(([body], i) => (
          <p key={i} className={lit === i ? "lit" : undefined} id={`ad-${i}`}>
            {body}
            <button
              type="button"
              className="jb-fn jb-mono"
              aria-describedby={`fn-${i}`}
              onFocus={() => setLit(i)}
              onBlur={() => setLit(null)}
              onPointerEnter={() => setLit(i)}
              onPointerLeave={() => setLit(null)}
              onClick={() => setLit(lit === i ? null : i)}
            >
              {i + 1}
            </button>
          </p>
        ))}

        <ul className="jb-fnlist">
          {ADVERSE.map(([, note], i) => (
            <li
              key={i}
              id={`fn-${i}`}
              className={lit === i ? "lit" : undefined}
              onPointerEnter={() => setLit(i)}
              onPointerLeave={() => setLit(null)}
            >
              <b className="jb-mono">{i + 1}</b>
              {note}
            </li>
          ))}
          <li>
            <b className="jb-mono">*</b>
            위 항목은 이 문서에 적힌 치료 계획에 한정한 서술입니다. 실제 상담에서는 전신 질환 ·
            복용 약 · 흡연 여부에 따라 다시 설명드립니다.
          </li>
        </ul>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 06 절차와 담당
 * ───────────────────────────────────────────────────────────── */

const ARTICLES: [string, string, string, number][] = [
  ["제1조", "진단한 의사가 시술하고 이후 관리까지 맡습니다.", "담당이 바뀌면 바뀌기 전에 알려드립니다.", 0],
  ["제2조", "첫 상담은 진료의자에 눕기 전, 다른 방에서 합니다.", "누운 자세에서는 질문하기 어렵습니다.", 0],
  ["제3조", "손을 드시면 그 자리에서 멈춥니다. 이유를 묻지 않습니다.", "기구를 먼저 뺀 다음 이야기합니다.", 1],
  ["제4조", "치료 계획이 바뀌면, 바뀌기 전에 문서로 다시 드립니다.", "구두로 먼저 설명하고 문서를 뒤에 드립니다.", 1],
  ["제5조", "진단 자료를 요청하시면 드립니다. 다른 곳에서 한 번 더 보셔도 됩니다.", "파노라마 · CT · 구강 스캔 원본 파일입니다.", 2],
  ["제6조", "오늘 치료를 시작할지는 상담이 끝난 뒤에 정하셔도 됩니다.", "그날 결정하지 않아도 계획서는 그대로 유효합니다.", 2],
];

const PHASES = ["오시기 전", "진료의자 위", "진료 후"];

function Protocol({
  halted,
  haltedAt,
  onToggleHalt,
}: {
  halted: boolean;
  haltedAt: string | null;
  onToggleHalt: () => void;
}) {
  const ref = useReveal<HTMLElement>();
  const [phase, setPhase] = useState(1);
  return (
    <section className="jb-sec" id="protocol" ref={ref}>
      <div className="jb-grid">
        <div className="jb-aside jb-mono">
          <p style={{ margin: 0 }}>사람 사진 대신 규칙을 적습니다.</p>
          <div className="jb-seg" role="radiogroup" aria-label="시점" style={{ marginTop: "1.1rem", flexDirection: "column", alignItems: "flex-start" }}>
            {PHASES.map((p, i) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={phase === i}
                tabIndex={phase === i ? 0 : -1}
                className="jb-chip"
                onClick={() => setPhase(i)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                  e.preventDefault();
                  setPhase((v) => (v + (e.key === "ArrowDown" ? 1 : -1) + 3) % 3);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="jb-body">
          <p className="jb-secno jb-mono">06</p>
          <h2 className="jb-h2 rv">절차와 담당</h2>

          <ul className="jb-arts">
            {ARTICLES.map(([no, text, how, ph]) => (
              <li key={no} className={`jb-art${phase === ph ? " on" : ""}`}>
                <span className="jb-art-no jb-mono">{no}</span>
                <span className="jb-art-text">
                  {text}
                  <span className="jb-art-how">{how}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="jb-halt-row">
            <button
              type="button"
              className="jb-halt-btn"
              aria-pressed={halted}
              onClick={onToggleHalt}
            >
              {halted ? "다시" : "멈춤"}
            </button>
            <span>
              {halted && haltedAt
                ? `${haltedAt}에 멈췄습니다.`
                : "제3조는 이 페이지에도 적용됩니다. 누르면 화면의 모든 움직임이 멈춥니다."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 07 상담 준비 서식 / 판권
 * ───────────────────────────────────────────────────────────── */

const TRIGGERS = ["찬 것", "단 것", "씹을 때", "가만히 있을 때", "밤에"];
const FEELS = ["시림", "욱신거림", "뻐근함", "부었음", "잘 모르겠음"];
/* FDI 치식. 상악 우측→좌측, 하악 우측→좌측 순으로 실제 배열을 따른다. */
const UPPER = [
  "18", "17", "16", "15", "14", "13", "12", "11",
  "21", "22", "23", "24", "25", "26", "27", "28",
];
const LOWER = [
  "48", "47", "46", "45", "44", "43", "42", "41",
  "31", "32", "33", "34", "35", "36", "37", "38",
];

const ASKS = [
  "식립 개수와 위치",
  "픽스처 제품명과 제조사",
  "보철 재료와, 변경할 경우의 차액",
  "뼈이식이 별도 비용인지",
  "사후관리 기간과 범위",
  "시술을 맡는 의사",
  "총 치료 기간과 내원 횟수",
];

/* 진료시간 — 24시간 축으로 그린다 */
const HOURS: { day: string; blocks: [number, number][] }[] = [
  { day: "월", blocks: [[9.5, 13], [14, 18.5]] },
  { day: "화", blocks: [[9.5, 13], [14, 18.5]] },
  { day: "수", blocks: [[9.5, 13], [14, 18.5]] },
  { day: "목", blocks: [[9.5, 13], [14, 21]] },
  { day: "금", blocks: [[9.5, 13], [14, 18.5]] },
  { day: "토", blocks: [[9.5, 13.5]] },
  { day: "일", blocks: [] },
];

function Worksheet({ halted, marks }: { halted: boolean; marks: number }) {
  const ref = useReveal<HTMLElement>();
  const [form, setForm] = useState({
    teeth: [] as string[],
    since: "",
    triggers: [] as string[],
    feels: [] as string[],
    meds: "",
    ask: "",
  });
  const [now, setNow] = useState(() => new Date());

  /* 저절로 움직이는 페이지 유일의 요소. 멈춤 상태에서는 이것도 멎는다. */
  useEffect(() => {
    if (halted) return;
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [halted]);

  const toggle = (key: "teeth" | "triggers" | "feels", v: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v],
    }));

  const dayIdx = (now.getDay() + 6) % 7;
  const today = HOURS[dayIdx];
  const hNow = now.getHours() + now.getMinutes() / 60;
  const openBlock = today.blocks.find(([a, b]) => hNow >= a && hNow < b);
  const nextOpen = useMemo(() => {
    for (let i = 0; i < 8; i++) {
      const d = addDays(now, i);
      const idx = (d.getDay() + 6) % 7;
      const row = HOURS[idx];
      if (!row.blocks.length || HOLIDAYS.has(isoMD(d))) continue;
      const first = row.blocks[0][0];
      if (i === 0 && hNow < first) return { d, at: first };
      if (i > 0) return { d, at: first };
    }
    return null;
  }, [now, hNow]);

  const fmtHour = (h: number) =>
    `${String(Math.floor(h)).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;

  return (
    <section className="jb-sec" id="worksheet" ref={ref}>
      <div className="jb-grid">
        <div className="jb-aside jb-mono">
          <p style={{ margin: 0 }}>
            작성하신 내용은 이 브라우저 밖으로 나가지 않습니다. 전송되는 요청이 없습니다.
          </p>
          <p style={{ marginTop: "1.1rem" }}>
            저장도 하지 않습니다. 새로고침하면 사라집니다.
          </p>
        </div>

        <div className="jb-body">
          <p className="jb-secno jb-mono">07</p>
          <h2 className="jb-h2 rv">상담 준비 서식</h2>
          <p className="jb-sub rv" style={{ ["--d" as string]: "0.06s" }}>
            이름과 연락처를 먼저 받지 않습니다. 대신 상담이 잘 되도록 정리해 드립니다.
          </p>

          <div className="jb-work">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="jb-field">
                <fieldset>
                  <legend>어느 쪽</legend>
                  <div className="jb-teeth-row">
                    <div className="jb-teeth">
                      {UPPER.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="jb-tooth jb-mono"
                          aria-pressed={form.teeth.includes(t)}
                          onClick={() => toggle("teeth", t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="jb-teeth-sep" />
                    <div className="jb-teeth">
                      {LOWER.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="jb-tooth jb-mono"
                          aria-pressed={form.teeth.includes(t)}
                          onClick={() => toggle("teeth", t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </fieldset>
              </div>

              <div className="jb-field">
                <label htmlFor="jb-since">언제부터</label>
                <input
                  id="jb-since"
                  type="text"
                  value={form.since}
                  placeholder="예 — 3주 전부터"
                  onChange={(e) => setForm((f) => ({ ...f, since: e.target.value }))}
                />
              </div>

              <div className="jb-field">
                <fieldset>
                  <legend>무엇을 할 때</legend>
                  <div className="jb-checks">
                    {TRIGGERS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="jb-check"
                        aria-pressed={form.triggers.includes(t)}
                        onClick={() => toggle("triggers", t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="jb-field">
                <fieldset>
                  <legend>어떤 느낌</legend>
                  <div className="jb-checks">
                    {FEELS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        className="jb-check"
                        aria-pressed={form.feels.includes(t)}
                        onClick={() => toggle("feels", t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="jb-field">
                <label htmlFor="jb-meds">복용 중인 약</label>
                <input
                  id="jb-meds"
                  type="text"
                  value={form.meds}
                  placeholder="예 — 혈압약, 골다공증 약"
                  onChange={(e) => setForm((f) => ({ ...f, meds: e.target.value }))}
                />
              </div>

              <div className="jb-field">
                <label htmlFor="jb-ask">물어볼 것</label>
                <textarea
                  id="jb-ask"
                  rows={3}
                  value={form.ask}
                  placeholder="상담에서 꼭 확인하고 싶은 것"
                  onChange={(e) => setForm((f) => ({ ...f, ask: e.target.value }))}
                />
              </div>
            </form>

            <div className="jb-form-sheet">
              <h3>정본치과 상담 준비 서식</h3>
              <p className="jb-sheet-sub">이 서식은 어느 치과에서든 쓰실 수 있습니다.</p>

              <dl className="jb-answers">
                <dt>부위</dt>
                <dd className={form.teeth.length ? "ink-in in" : "empty"}>
                  {form.teeth.length ? form.teeth.join(" · ") : "선택 전"}
                </dd>
                <dt>시점</dt>
                <dd className={form.since ? "" : "empty"}>{form.since || "미작성"}</dd>
                <dt>유발</dt>
                <dd className={form.triggers.length ? "" : "empty"}>
                  {form.triggers.length ? form.triggers.join(" · ") : "선택 전"}
                </dd>
                <dt>양상</dt>
                <dd className={form.feels.length ? "" : "empty"}>
                  {form.feels.length ? form.feels.join(" · ") : "선택 전"}
                </dd>
                <dt>복용 약</dt>
                <dd className={form.meds ? "" : "empty"}>{form.meds || "없음 / 미작성"}</dd>
                <dt>질문</dt>
                <dd className={form.ask ? "" : "empty"}>{form.ask || "미작성"}</dd>
              </dl>

              <p style={{ margin: "1.4rem 0 0", fontSize: "0.72rem", color: "var(--jb-margin)" }}>
                상담에서 물어보실 것
              </p>
              <ol className="jb-ask">
                {ASKS.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>

              {marks > 0 && (
                <p className="jb-print-only jb-page-break">
                  03에서 {marks}번 멈추셨습니다.
                </p>
              )}

              {/* 인쇄가 관념이 아니라 실물이라는 것을 보여주는 단 한 장 */}
              <div className="jb-print-row">
                <button type="button" className="jb-print" onClick={() => window.print()}>
                  인쇄 · A4 1장
                </button>
                <img
                  src={`${A}/print-tray.webp`}
                  alt="트레이에 놓인 A4 두 장"
                  loading="lazy"
                  width={760}
                  height={510}
                />
              </div>
            </div>
          </div>

          {/* 판권 */}
          <div className="jb-colophon">
            <p className="jb-status" style={{ marginTop: 0 }}>
              {openBlock ? (
                <>
                  지금은 진료 중입니다 — 오늘{" "}
                  <span className="jb-mono">{fmtHour(today.blocks[today.blocks.length - 1][1])}</span>
                  까지.
                </>
              ) : (
                <span className="off">
                  오늘 진료는 끝났습니다
                  {nextOpen && (
                    <>
                      {" "}
                      — 다음 진료{" "}
                      <span className="jb-mono">
                        {KO_DATE.format(nextOpen.d)} {fmtHour(nextOpen.at)}
                      </span>
                    </>
                  )}
                </span>
              )}
            </p>

            <div className="jb-hours jb-mono">
              <div className="jb-hour-row">
                <span />
                <span className="jb-hour-scale">
                  {[0, 6, 12, 18, 24].map((h) => (
                    <span key={h} style={{ ["--a" as string]: `${(h / 24) * 100}%` }}>
                      {String(h).padStart(2, "0")}
                    </span>
                  ))}
                </span>
              </div>
              {HOURS.map((row, i) => (
                <div key={row.day} className={`jb-hour-row${row.blocks.length ? "" : " off"}`}>
                  <span>{row.day}</span>
                  <span className="jb-hour-bar">
                    {row.blocks.map(([a, b]) => (
                      <span
                        key={a}
                        className="jb-hour-open"
                        style={{
                          ["--a" as string]: `${(a / 24) * 100}%`,
                          ["--w" as string]: `${((b - a) / 24) * 100}%`,
                        }}
                      />
                    ))}
                    {i === dayIdx && (
                      <span className="jb-now" style={{ ["--now" as string]: `${(hNow / 24) * 100}%` }} />
                    )}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1.2rem" }}>
              평일 09:30–18:30 · 목요일 21:00까지 · 점심 13:00–14:00 · 토요일 09:30–13:30 ·
              일요일 · 공휴일 휴진
              <br />
              예약은 전화로 받습니다. <a href="tel:0200000000">02-0000-0000</a>
            </p>

            <p style={{ marginTop: "1.2rem" }}>
              <span className="jb-mono">JB-2026-04 · 개정 4판 · 2026.07.31</span>
              <br />이 페이지는 포트폴리오 데모이며 실재하는 의료기관이 아닙니다. 금액 · 재료 ·
              일정은 구조를 보여주기 위한 예시입니다.
              <br />
              <Link to="/" style={{ textDecoration: "underline" }}>
                ← Portfolio로 돌아가기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * page
 * ───────────────────────────────────────────────────────────── */

export default function JeongbonPage() {
  const [halted, setHalted] = useState(false);
  const [haltedAt, setHaltedAt] = useState<string | null>(null);
  const [type, setType] = useState<"17" | "20">("17");
  const [grid, setGrid] = useState(false);
  const [marks, setMarks] = useState(0);

  /* 발행 판형 — 이 페이지가 붙어 있는 동안에만 루트 크기를 바꾼다 */
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.jbType = type;
    return () => {
      delete root.dataset.jbType;
    };
  }, [type]);

  useEffect(() => {
    const root = document.documentElement;
    if (halted) root.dataset.jbHalt = "1";
    else delete root.dataset.jbHalt;
    return () => {
      delete root.dataset.jbHalt;
    };
  }, [halted]);

  const toggleHalt = useCallback(() => {
    setHalted((h) => {
      if (!h) {
        const d = new Date();
        setHaltedAt(
          `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        );
      }
      return !h;
    });
  }, []);

  return (
    <div className={`jb-site${grid ? " show-grid" : ""}`}>
      <Link to="/" className="jb-back jb-mono">
        ← PORTFOLIO
      </Link>

      <div className="jb-strip-fixed jb-mono">
        <span className="jb-tool jb-tool-seg" aria-hidden="true">
          본문
        </span>
        <button
          type="button"
          className="jb-tool jb-tool-seg"
          onClick={() => setType(type === "17" ? "20" : "17")}
          aria-label={`본문 크기 — 현재 ${type}. 누르면 ${type === "17" ? "20" : "17"}로 바뀝니다`}
        >
          <b className={type === "17" ? "on" : ""}>17</b>/
          <b className={type === "20" ? "on" : ""}>20</b>
        </button>
        <button type="button" className="jb-tool" aria-pressed={halted} onClick={toggleHalt}>
          {halted ? "다시" : "멈춤"}
        </button>
        <button
          type="button"
          className="jb-tool"
          aria-pressed={grid}
          onClick={() => setGrid((g) => !g)}
          aria-label="판면 그리드 보기"
        >
          ◱
        </button>
      </div>

      <Colophon halted={halted} />
      <FeeSheet />
      <WatchList />
      <TimeSection halted={halted} onMarks={setMarks} />
      <ViewBox halted={halted} />
      <Adverse />
      <Protocol halted={halted} haltedAt={haltedAt} onToggleHalt={toggleHalt} />
      <Worksheet halted={halted} marks={marks} />
    </div>
  );
}
