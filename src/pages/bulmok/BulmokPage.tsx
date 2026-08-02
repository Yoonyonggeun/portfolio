import { useState } from "react";
import { Link } from "react-router-dom";
import AirflowDiagram from "./AirflowDiagram";
import { CAMPAIGN, FAQ, GAUGES, REWARDS, SCHEDULE, SPEC, TABS, type TabId } from "./data";
import "./bulmok.css";

/*
 * 불목 S1 — 크라우드펀딩 실전 상세페이지 (09)
 *
 * 앞의 여덟 편은 전부 브랜드 랜딩이었다. 정작 제일 많이 팔리는 물건 —
 * 와디즈 스토리(= 상세페이지) — 을 보여주는 샘플이 하나도 없었다.
 * 그래서 이 페이지는 '잘 만든 랜딩'이 아니라 '에디터 안에서 작동하는
 * 상세페이지'를 목표로 한다.
 *
 * 조판은 우리가 고른 게 아니라 실측해서 따랐다:
 *   와디즈 content-width 1280 / gap 48 / 좌 스토리 740 / 우 리워드 478
 *   이미지 가로 1024px 이하 · 본문 왼쪽 정렬 강제 · 통이미지 금지
 *   공식 스토리 순서 01 도입부 → 02 제작 계기 → 03 특징 → 04 상세 →
 *   05 구성 → 06 이벤트 → 07 메이커 소개
 *
 * 훅은 상단 바의 스위치 하나다. '와디즈 스토리'가 기본이고, '확장 랜딩'을
 * 켜면 에디터가 받을 수 없는 것들이 살아난다 — 유로 도해가 흐르고, 두께
 * 구성기가 반응하고, 블록이 고정폭 컬럼을 넘어간다. 그게 곧 ESSENTIAL과
 * SIGNATURE의 차이라 말로 설명할 필요가 없어진다.
 */

const A = "/assets/bulmok";
const won = (n: number) => n.toLocaleString("ko-KR");

type Mode = "story" | "wide";

/*
 * 에디터가 받는 것과 못 받는 것.
 * 와디즈 메이커센터 공식 문서에서 확인한 항목만 적는다 — 추측 0.
 */
const CAN = [
  "텍스트 (왼쪽 정렬 강제, 가운데 정렬 금지)",
  "이미지 — 가로 1024px 이하 권장",
  "JPG · JPEG · PNG · GIF",
  "외부 영상 URL (유튜브 등)",
];
const CANT = [
  "통이미지 — 이미지와 텍스트는 반드시 분리",
  "영상형 이미지(GIF 등) 안의 텍스트",
  "스크롤 스크럽 · 3D 인스펙터 · 호버",
  "선택하면 값이 바뀌는 표 · 계산기",
  "고정 사이드바 · 앵커 내비 · 카드 그리드",
];

/*
 * 제작 회계. 이 상세페이지가 무엇으로 만들어졌는지를 숫자로 닫는다.
 * 세 렌즈가 공통으로 지목한 킬리스크 — "인터랙션 0인 이미지 한 줄이라
 * 기술력 후퇴로 보인다" — 를 뒤집는 자리다. 파는 건 결과물이 아니라
 * 컷을 찍어내는 시스템이다.
 */
const ACCT = [
  { k: "AI 스틸", v: "9", u: "컷" },
  { k: "코드로 그린 컷", v: "13", u: "컷" },
  { k: "촬영", v: "0", u: "컷" },
  { k: "에셋 총량", v: "164", u: "KB" },
  { k: "최대 이미지 폭", v: "1024", u: "px" },
];

export default function BulmokPage() {
  const [mode, setMode] = useState<Mode>("story");
  const [tab, setTab] = useState<TabId>("story");
  const [pick, setPick] = useState<string>("base");
  const [gauge, setGauge] = useState<string>("05");
  const [open, setOpen] = useState<number | null>(0);

  const wide = mode === "wide";
  const g = GAUGES.find((x) => x.id === gauge) ?? GAUGES[1];

  return (
    <div className="bm-site" data-mode={mode}>
      {/* ── 포폴 크롬 ─────────────────────────────────────── */}
      <div className="bm-bar bm-ui">
        <div className="bm-bar-in">
          <Link to="/" className="bm-back">
            ← Product Film
          </Link>
          {/* 한 줄이면 충분하다. 방문자는 와디즈를 이미 안다. */}
          <p className="bm-bar-note">
            <b>FILM 09 · 불목 S1</b> — 와디즈 스토리에 그대로 올라가는 상세페이지
          </p>
          <div className="bm-switch" role="group" aria-label="보기 방식">
            <button aria-pressed={!wide} onClick={() => setMode("story")}>
              와디즈 스토리
            </button>
            <button aria-pressed={wide} onClick={() => setMode("wide")}>
              확장 랜딩
            </button>
          </div>
        </div>
      </div>

      {/*
       * 여기 있던 '제약 브리핑'을 걷어냈다. 방문자가 페이지에서 제일 먼저
       * 만나는 게 "와디즈 에디터는 이런 걸 못 받습니다"라는 강의였는데,
       * 타겟인 크라우드펀딩 메이커는 그걸 이미 안다. 그들에게 필요한 건
       * 설명이 아니라 잘 만든 상세페이지 자체다.
       *
       * 05에서 배운 걸 다시 밟았던 자리다 — 정보 구조까지 낯설게 만들면
       * "전달이 안 된다"는 반응이 나온다. 규격 목록과 실측 근거는 버리지
       * 않고 맨 아래 제작 회계로 옮겼다. 근거는 작업 뒤에 놓여야 근거다.
       */}

      {/* ── 플랫폼 고정 크롬 ───────────────────────────────
          메이커가 배치를 바꿀 수 없는 구역. 항목명과 순서까지 정해져 있다. */}
      <div className="bm-plat">
        <div className="bm-wrap">
          <div className="bm-head">
            <div>
              <p className="bm-crumb">{CAMPAIGN.category}</p>
              <p className="bm-maker">{CAMPAIGN.maker}</p>
              <h1 className="bm-title">{CAMPAIGN.title}</h1>
              <p className="bm-sub">{CAMPAIGN.subtitle}</p>
              <div className="bm-heroshot">
                <img
                  src={`${A}/hero.webp`}
                  alt="사다리꼴로 조립된 불목 S1. 티타늄 표면에 열변색 무늬가 떠 있다."
                  width={1024}
                  height={576}
                />
              </div>
            </div>

            <div className="bm-summary">
              <p className="bm-stat">
                <b>
                  {CAMPAIGN.rate}
                  <i>%</i>
                </b>
                <span className="bm-badge bm-ui">달성</span>
              </p>
              <div className="bm-meter" aria-hidden="true">
                <span style={{ width: "100%" }} />
              </div>
              <dl className="bm-facts">
                <div>
                  <dt>모인금액</dt>
                  <dd>{won(CAMPAIGN.raised)}원</dd>
                </div>
                <div>
                  <dt>목표금액</dt>
                  <dd>{won(CAMPAIGN.goal)}원</dd>
                </div>
                <div>
                  <dt>서포터</dt>
                  <dd>{won(CAMPAIGN.supporters)}명</dd>
                </div>
                <div>
                  <dt>남은 기간</dt>
                  <dd>{CAMPAIGN.daysLeft}일</dd>
                </div>
                <div>
                  <dt>펀딩 기간</dt>
                  <dd>{CAMPAIGN.period}</dd>
                </div>
                <div>
                  <dt>결제 예정일</dt>
                  <dd>{CAMPAIGN.settleAt}</dd>
                </div>
                <div>
                  <dt>발송 시작</dt>
                  <dd>{CAMPAIGN.shipAt}</dd>
                </div>
              </dl>
              {/* 05에서 세운 원칙 — 실적 숫자는 예시임을 반드시 밝힌다.
                  카운트업 애니메이션도 쓰지 않는다. */}
              <p className="bm-demo">
                자체 기획 컨셉입니다. 실존하는 브랜드·제품·펀딩이 아니며 달성률과 금액은 조판을
                보여주기 위한 예시 수치입니다.
              </p>
            </div>
          </div>

          {/* 탭 전환은 좌측 컬럼만 갈아끼운다 — 실측 그대로.
              우측 리워드 패널과 위 달성률 블록은 그대로 남는다. */}
          <div className="bm-tabs bm-ui" role="tablist" aria-label="프로젝트 상세">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 본체 ───────────────────────────────────────────── */}
      <div className="bm-wrap">
        <div className="bm-body">
          <main className="bm-story">
            {tab === "story" && (
              <Story
                wide={wide}
                gauge={g}
                setGauge={setGauge}
                open={open}
                setOpen={setOpen}
              />
            )}
            {tab === "policy" && <Policy />}
            {tab === "reward" && <RewardInfo />}
          </main>

          <aside className="bm-rail" aria-label="리워드 선택">
            {REWARDS.map((r) => (
              <button
                key={r.id}
                className="bm-rw"
                aria-pressed={pick === r.id}
                onClick={() => setPick(r.id)}
              >
                <span className="bm-rw-stock">{r.stock}</span>
                <span className="bm-rw-name">
                  <em>[{r.tier}]</em> {r.name}
                  {"best" in r && r.best ? <i className="bm-rw-flag bm-ui">인기</i> : null}
                </span>
                <span className="bm-rw-price">
                  <b>{won(r.price)}원</b>
                  <s>{won(r.list)}원</s>
                </span>
                <ul>
                  {r.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </button>
            ))}
            <button className="bm-cta">이 리워드로 펀딩하기</button>
            {/* 아웃도어 브랜드 실측 문법 — 화기 경고는 CTA 바로 아래 인라인 */}
            <p className="bm-railnote">
              ⚠ 화기 제품입니다. 실내·텐트 안·데크 위 직접 사용을 금합니다. 국립공원 등 화기
              사용이 제한된 장소에서는 쓸 수 없습니다.
            </p>
          </aside>
        </div>
      </div>

      {/* ── 제작 회계 ───────────────────────────────────────
          액자의 마지막 칸. 여기까지 와야 '80만원짜리 포맷'이 아니라
          '컷을 찍어내는 시스템'으로 읽힌다. */}
      <section className="bm-acct">
        <div className="bm-acct-in">
          <h2>이 상세페이지는 무엇으로 만들어졌나</h2>
          <dl className="bm-acct-grid">
            {ACCT.map((a) => (
              <div key={a.k}>
                <dt>{a.k}</dt>
                <dd>
                  {a.v}
                  <i>{a.u}</i>
                </dd>
              </div>
            ))}
          </dl>
          <p>
            상세페이지가 길어질수록 컷이 필요합니다. 그런데 컷의 절반 이상은 원래 사진이 아니라
            도해입니다 — 치수도, 공기 흐름, 사양표, 일정, 구성 안내. 그걸 전부 코드로 그리면
            컷이 늘어도 촬영도 생성도 늘지 않습니다. 위의 유로 단면이 그 예입니다. 이미지
            모델에 두 번 시켰다가 매번 '앞판을 뺀 상태'가 나와서 SVG로 직접 그렸고, 결과적으로
            2KB에 어느 배율에서도 선이 살아 있고 확장 모드에서는 공기가 흐릅니다.
          </p>

          {/* 규격 목록은 작업 뒤에 놓는다. 앞에 놓으면 강의가 되고
              뒤에 놓으면 근거가 된다. */}
          <div className="bm-can bm-ui">
            <section className="yes">
              <h3>에디터가 받는 것</h3>
              <ul>
                {CAN.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
            <section className="no">
              <h3>못 받는 것 — 그래서 확장 랜딩에만 있는 것</h3>
              <ul>
                {CANT.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          </div>

          <p className="bm-acct-cite">
            규격은 와디즈 메이커센터 공식 문서에서 확인했습니다. 컬럼 폭 740px · 거터 48px ·
            리워드 레일 478px은 2026년 8월 현재 실제 캠페인 페이지를 1600×1000 뷰포트에서 직접
            계측한 값입니다 — 부모 요소의 클래스명이
            <code> flex-row-start-48 content-width-1280</code>입니다.
          </p>

          <p>
            <Link to="/">← 다른 작업 보기</Link>
          </p>
        </div>
      </section>
    </div>
  );
}

/* 컷마다 붙는 제작 주석. 확장 모드에서만 보인다. */
function Tag({ kind, note, d = 0 }: { kind: "ai" | "svg"; note: string; d?: number }) {
  return (
    <p className="bm-tag" style={{ ["--td" as string]: `${d * 0.04}s` }}>
      <b data-k={kind}>{kind === "ai" ? "AI STILL" : "SVG"}</b>
      <span>{note}</span>
    </p>
  );
}

/* ── 스토리 탭 ─────────────────────────────────────────────
 * 와디즈 공식 순서 01~07을 따른다. 이미지 블록과 왼쪽 정렬 텍스트
 * 블록이 교대로 세로로만 쌓이고, 섹션 구분은 오직 여백으로 한다.
 * 카드 그리드·다단·사이드바·앵커 내비는 한 개도 없다.
 */
function Story({
  wide,
  gauge,
  setGauge,
  open,
  setOpen,
}: {
  wide: boolean;
  gauge: (typeof GAUGES)[number];
  setGauge: (id: string) => void;
  open: number | null;
  setOpen: (i: number | null) => void;
}) {
  return (
    <>
      {/* 01 도입부 — 실측 문법: 2행 대구 헤드라인 */}
      <section className="bm-blk">
        <p className="bm-no">01</p>
        <h2 className="bm-h">
          장작을 태우면 연기가 납니다.
          <br />
          그 연기도 연료입니다.
        </h2>
        <p className="bm-p">
          모닥불에서 눈이 매운 이유는 나무가 다 타지 않아서입니다. 400~600℃에서 나무는 가스를
          내놓는데, 그 가스가 타려면 600℃가 넘는 온도와 산소가 동시에 있어야 합니다. 보통의
          화로는 둘 중 하나가 모자랍니다. 그래서 <b>탈 수 있는 것이 연기로 빠져나갑니다.</b>
        </p>
        <p className="bm-p">
          불목 S1은 벽을 두 장으로 만들어 그 사이로 공기를 끌어올립니다. 올라오는 동안 데워진
          공기가 불 바로 위에서 다시 뿜어져 나오고, 거기서 연기가 한 번 더 탑니다.
        </p>
        <div className="bm-fig">
          <img
            src={`${A}/burn.webp`}
            alt="어둠 속에서 타는 불목 S1. 내벽 상단 구멍 열을 따라 푸른 화염 띠가 안쪽으로 뻗는다."
            width={1024}
            height={576}
            loading="lazy"
          />
          <p className="bm-cap">
            구멍 줄을 따라 안쪽으로 뻗는 푸른 띠가 2차 연소입니다. 아래 주황색 불이 1차 연소입니다.
          </p>
        <Tag kind="ai" note="1024×576 · 10KB · 어둠 기준선에서 2차 연소만 광원" d={0} />
          </div>
      </section>

      <hr className="bm-hr" />

      {/* 02 제작 계기 */}
      <section className="bm-blk">
        <p className="bm-no">02</p>
        <h2 className="bm-h">이중연소 화로는 이미 많습니다. 다만 무겁습니다.</h2>
        <p className="bm-p">
          시중의 이중연소 화로는 대부분 스테인리스 원통 두 개를 겹쳐 만듭니다. 잘 작동하지만
          부피가 그대로 남습니다. 접히지 않으니 배낭에 넣을 수 없고, 결국 차에 싣는 장비가 됩니다.
        </p>
        <p className="bm-p">
          그래서 원통을 포기했습니다. 판 다섯 장을 슬롯으로 물려 사각 기둥을 세우고, 각 판을 두 겹
          접어 벽 사이의 틈을 만들었습니다. 원통이 하던 일을 <b>접히는 판이 하게</b> 만든 것이
          이 제품의 전부입니다.
        </p>
        <div className="bm-fig">
          <img
            src={`${A}/parts.webp`}
            alt="분해된 불목 S1 부품 일곱 개를 격자로 늘어놓은 오버헤드 컷."
            width={1024}
            height={576}
            loading="lazy"
          />
          <p className="bm-cap">측판 4 · 바닥판 1 · 그릴 1 · 재받이 1. 나사도 경첩도 없습니다.</p>
        <Tag kind="ai" note="1024×576 · 16KB · 오버헤드 놀링, 룩 컷 img2img 정합" d={1} />
          </div>
      </section>

      <hr className="bm-hr" />

      {/* 03 특징 — 숫자와 함께 */}
      <section className="bm-blk">
        <p className="bm-no">03</p>
        <h2 className="bm-h">벽 사이 3.5mm가 하는 일</h2>
        <p className="bm-p">
          아래 그림은 불목 S1을 세로로 자른 단면입니다. 바닥 틈으로 들어온 찬 공기가 두 벽
          사이를 타고 오르며 데워지고, 내벽 상단의 <b>Ø4mm 구멍 24개</b>로 챔버 안에 뿜어져
          나옵니다. 연기가 지나가는 바로 그 높이입니다.
        </p>

        <div className="bm-dia bm-bleed">
          <AirflowDiagram />
          <p className="bm-dia-legend bm-ui">
            <span>
              <i style={{ background: "#8e9bb5" }} /> ① 바닥 흡기
            </span>
            <span>
              <i style={{ background: "#6d86e8" }} /> ② 벽 사이 예열
            </span>
            <span>
              <i style={{ background: "#6d86e8" }} /> ③ 2차 연소
            </span>
            <span>
              <i style={{ background: "#c0603a" }} /> ④ 1차 연소
            </span>
          </p>
          <Tag kind="svg" note="2.1KB · 좌표는 렌더 실루엣에서 따옴 · 확장 모드에서 흐름" />
        </div>

        {!wide && (
          <p className="bm-only">
            <b>에디터 제약</b> — 와디즈 스토리는 텍스트·이미지·외부 영상 URL만 받습니다. 위
            도해는 지금 정지한 그림입니다. 상단에서 <b>확장 랜딩</b>으로 바꾸면 공기가 실제로
            흐릅니다.
          </p>
        )}

        <div className="bm-fig">
          <img
            src={`${A}/inside.webp`}
            alt="앞판을 뺀 불목 S1 내부. 내벽 상단을 따라 뚫린 2차 연소구가 보인다."
            width={1024}
            height={576}
            loading="lazy"
          />
          <p className="bm-cap">앞판을 뺀 상태. 내벽 위쪽을 따라 뚫린 줄이 2차 연소구입니다.</p>
        <Tag kind="ai" note="1024×576 · 11KB · 종단면 2회 실패 후 채택한 내부 컷" d={2} />
          </div>
      </section>

      <hr className="bm-hr" />

      {/* 04 상세 — 이미지 세로 스택이 가장 길게 이어지는 구간 */}
      <section className="bm-blk">
        <p className="bm-no">04</p>
        <h2 className="bm-h">접으면 11mm</h2>
        <p className="bm-p">
          판 다섯 장을 겹치면 두께가 <b>11mm</b>입니다. A5 봉투에 들어가고, 배낭 등판 주머니에
          꽂힙니다. 조립에 공구가 필요 없고, 슬롯 방향만 맞추면 20초쯤 걸립니다.
        </p>
        <div className="bm-fig">
          <img
            src={`${A}/folded.webp`}
            alt="완전히 접혀 다섯 장으로 겹쳐진 티타늄 판을 눈높이에서 본 컷."
            width={1024}
            height={576}
            loading="lazy"
          />
        <Tag kind="ai" note="1024×576 · 13KB · 두께를 읽히게 하는 저각" d={3} />
          </div>
        <div className="bm-fig">
          <img
            src={`${A}/pack.webp`}
            alt="캔버스 슬리브에 들어간 접힌 판과, 옆에 한 장이 따로 놓인 오버헤드 컷."
            width={1024}
            height={576}
            loading="lazy"
          />
          <p className="bm-cap">기본 구성에 캔버스 슬리브가 포함됩니다.</p>
        <Tag kind="ai" note="1024×576 · 21KB · 스케일 단서로 낱장 1개 동반" d={4} />
          </div>

        <p className="bm-p">
          표면의 무늬는 도장이 아닙니다. 티타늄이 열을 받으면 산화막이 생기는데, 그 두께에 따라
          빛이 갈려 파랑·보라·금색이 뜹니다. <b>가공 열이 판마다 달라 같은 무늬가 두 번 나오지
          않습니다.</b> 칠이 아니라 산화막이라 벗겨지지도 않습니다.
        </p>
        <div className="bm-fig">
          <img
            src={`${A}/tint.webp`}
            alt="티타늄 표면 극접사. 브러시 결 위로 금색·장미색·인디고 열변색 띠가 번져 있다."
            width={640}
            height={640}
            loading="lazy"
          />
        <Tag kind="ai" note="640×640 · 34KB · 열변색 매크로" d={5} />
          </div>

        <p className="bm-p">
          다 태우고 나면 재가 적게 남습니다. 가스까지 태우기 때문입니다. 아래는 통나무 손가락
          굵기 여섯 개를 태운 뒤의 재받이입니다.
        </p>
        <div className="bm-fig">
          <img
            src={`${A}/ash.webp`}
            alt="티타늄 재받이 안에 회백색 재가 얇게 깔린 컷. 타다 만 검은 덩어리가 없다."
            width={640}
            height={640}
            loading="lazy"
          />
          <p className="bm-cap">타다 만 검은 덩어리가 남지 않습니다.</p>
        <Tag kind="ai" note="640×640 · 12KB · 완전연소의 증거 컷" d={6} />
          </div>
      </section>

      <hr className="bm-hr" />

      {/* 05 구성 — 두께 선택. 확장 모드에서만 살아난다. */}
      <section className="bm-blk">
        <p className="bm-no">05</p>
        <h2 className="bm-h">판 두께를 고른다는 것</h2>
        <p className="bm-p">
          얇으면 가볍고 빨리 데워지지만 반복 가열에 휩니다. 두꺼우면 오래 가지만 무겁고 예열이
          깁니다. 이번 리워드는 그 사이의 <b>0.5t</b>입니다.
        </p>

        <div className="bm-gauge">
          <div className="bm-gauge-row bm-ui">
            {GAUGES.map((x) => (
              <button
                key={x.id}
                aria-pressed={gauge.id === x.id}
                disabled={!wide}
                onClick={() => setGauge(x.id)}
              >
                <b>{x.t}</b>
                <span>{x.label}</span>
              </button>
            ))}
          </div>
          <dl className="bm-gauge-out">
            <div>
              <dt>본체 중량</dt>
              <dd>{gauge.weight} g</dd>
            </div>
            <div>
              <dt>수납 두께</dt>
              <dd>{gauge.packed} mm</dd>
            </div>
            <div>
              <dt>예상 수명</dt>
              <dd style={{ fontSize: "0.86rem" }}>{gauge.life}</dd>
            </div>
          </dl>
          <p className="bm-cap">{gauge.note}</p>
        </div>

        {!wide && (
          <p className="bm-only">
            <b>에디터 제약</b> — 위 표는 지금 눌리지 않습니다. 와디즈 안에서는 이런 선택형 표가
            이미지 한 장으로 들어가고, 세 가지 두께를 보여주려면 이미지를 세 장 넣어야 합니다.
            <b> 확장 랜딩</b>에서는 눌러서 바꿉니다.
          </p>
        )}
      </section>

      <hr className="bm-hr" />

      {/* 06 제품 상세 사이즈·스펙 — 본문은 1컬럼인데 표만 그리드로 이탈한다 */}
      <section className="bm-blk">
        <p className="bm-no">06</p>
        <h2 className="bm-h">제품 사양</h2>
        <dl className="bm-spec">
          {SPEC.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="bm-cap">
          치수는 ±1mm, 중량은 ±5g의 공차가 있습니다. 표기 사양은 데모 예시입니다.
        </p>
      </section>

      <hr className="bm-hr" />

      {/* 07 일정 */}
      <section className="bm-blk">
        <p className="bm-no">07</p>
        <h2 className="bm-h">일정</h2>
        <div className="bm-sched">
          {SCHEDULE.map((s) => (
            <div key={s.d}>
              <span className="bm-num">{s.d}</span>
              <span>{s.t}</span>
            </div>
          ))}
        </div>
        <p className="bm-p">
          레이저 가공은 국내 업체에 발주합니다. 판 절단과 절곡은 3주, 열처리와 검수에 1주를
          잡았습니다. 일정이 밀리면 새소식으로 먼저 알립니다.
        </p>
      </section>

      <hr className="bm-hr" />

      {/* 08 배송 */}
      <section className="bm-blk">
        <p className="bm-no">08</p>
        <h2 className="bm-h">배송 안내</h2>
        <p className="bm-p">
          발송 방법은 택배(CJ대한통운)이며 배송비는 리워드 금액에 포함돼 있습니다. 제주·도서산간은
          추가 4,000원이 발생합니다. 배송지 오기재로 반송된 경우 재발송은 1회까지 무상입니다.
        </p>
      </section>

      <hr className="bm-hr" />

      {/* 09 A/S */}
      <section className="bm-blk">
        <p className="bm-no">09</p>
        <h2 className="bm-h">리워드 특이사항과 A/S</h2>
        <p className="bm-p">
          <b>하자가 아닌 경우</b> — 열변색 무늬의 개체 차이, 사용 중 생기는 그을음, 반복 가열로
          인한 미세한 휨은 티타늄의 성질이며 하자가 아닙니다.
        </p>
        <p className="bm-p">
          <b>A/S 정책</b> — 수령 후 1년간 제조 결함에 한해 무상 교환합니다. 슬롯 파손, 판 절단면
          균열이 여기 해당합니다. 낙하·변형·개조로 인한 손상은 유상입니다.
        </p>
      </section>

      <hr className="bm-hr" />

      {/* 10 FAQ */}
      <section className="bm-blk">
        <p className="bm-no">10</p>
        <h2 className="bm-h">자주 묻는 질문</h2>
        <div className="bm-faq">
          {FAQ.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="bm-num">Q{i + 1}</span>
                    <span>{f.q}</span>
                  </button>
                </h3>
                {isOpen && <p>{f.a}</p>}
              </div>
            );
          })}
        </div>
      </section>

      <hr className="bm-hr" />

      {/* 11 메이커 소개 */}
      <section className="bm-blk">
        <p className="bm-no">11</p>
        <h2 className="bm-h">만든 사람</h2>
        <p className="bm-p">
          불목은 금속 판재 가공을 하던 두 사람이 시작한 브랜드입니다. 캠핑을 다니며 "이건 왜
          안 접히지"를 반복해서 말하다가, 접히는 걸 만들기로 했습니다. 첫 제품이 불목 S1입니다.
        </p>
        <p className="bm-cap">
          이 페이지는 포트폴리오용 자체 기획 컨셉입니다. 실존하는 브랜드·제품·펀딩이 아니며
          이미지는 전부 AI로 생성했습니다.
        </p>
      </section>
    </>
  );
}

/* ── 환불·정책 탭 ─────────────────────────────────────────
 * 실측 결과 이건 메이커가 쓰는 글이 아니라 별도 URL(/fundingInfo/)의
 * 플랫폼 고정 탭이다. 문체가 전부 '~해요' 종결인 것까지 재현했다.
 */
function Policy() {
  return (
    <div className="bm-policy">
      <h3>결제 취소 및 환불 안내</h3>
      <p>
        프로젝트 종료 전까지 언제든 결제 취소가 가능해요. 종료 후에는 리워드 제작이 시작되기 때문에
        단순 변심에 의한 취소가 제한될 수 있어요.
      </p>
      <h3>공통 환불 불가 유형</h3>
      <ul>
        <li>서포터의 사용·소비로 리워드의 가치가 뚜렷하게 감소한 경우</li>
        <li>시간이 지나 다시 판매하기 곤란할 정도로 가치가 떨어진 경우</li>
        <li>복제가 가능한 리워드의 포장을 훼손한 경우</li>
        <li>주문 제작 리워드로, 취소 시 메이커에게 회복할 수 없는 손해가 발생하는 경우</li>
        <li>서포터의 귀책으로 리워드가 멸실되거나 훼손된 경우</li>
        <li>리워드 수령 후 7일이 지난 경우</li>
      </ul>
      <h3>리워드 특성상 단순변심 환불이 불가한 경우</h3>
      <ul>
        <li>화기 제품 특성상 1회라도 불을 붙인 경우</li>
        <li>표면에 그을음이나 열변색이 추가로 생긴 경우</li>
        <li>슬롯 결합부를 공구로 변형한 경우</li>
      </ul>
      <p className="bm-cap" style={{ marginTop: 28 }}>
        위 문안은 실제 플랫폼의 고정 고지 블록 구조를 재현한 예시입니다.
      </p>
    </div>
  );
}

/* ── 리워드 정보 탭 ───────────────────────────────────────
 * 실측 문법: 본문은 1컬럼인데 리워드 구성 요약만 표 하나로 등장한다.
 */
function RewardInfo() {
  return (
    <div className="bm-policy">
      <h3>리워드 구성 요약</h3>
      <dl className="bm-spec" style={{ marginTop: 18 }}>
        {REWARDS.map((r) => (
          <div key={r.id}>
            <dt>
              [{r.tier}] {r.name}
            </dt>
            <dd>
              {won(r.price)}원 · {r.items.length}종
            </dd>
          </div>
        ))}
      </dl>
      <h3>공통 안내</h3>
      <ul>
        <li>모든 리워드에 캔버스 슬리브가 포함됩니다.</li>
        <li>본체 세트는 측판 4장 · 바닥판 1장으로 구성됩니다.</li>
        <li>열변색 무늬는 지정할 수 없으며 개체마다 다릅니다.</li>
      </ul>
      <p className="bm-cap" style={{ marginTop: 28 }}>
        가격과 구성은 조판을 보여주기 위한 데모 예시입니다.
      </p>
    </div>
  );
}
