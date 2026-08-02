import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LEDGER, PARTS, SPEC_GROUPS } from "./data";
import DetailGap from "./DetailGap";
import Viewport from "./Viewport";
import "./jungsoe.css";

/*
 * 중쇠 48 / JUNGSOE 48 — 수동 커피 그라인더 (11)
 *
 * 01 UMBRA와 02 KONTAKT가 이미 '분해 → 재조립'을 했다. 둘 다 미리 렌더한
 * 영상 프레임을 스크롤로 훑는 방식이라 부품이 픽셀이고, 그래서 이름도
 * 지시선도 붙지 않는다. 이 편은 같은 소재를 정반대로 만든다:
 *
 *   분해가 객체다        12개 부품이 각각 id·재질·앵커를 가진 three 객체다
 *   조작이 스크롤이 아니다 드래그와 스크럽 트랙으로 양방향, 사용자가 운전한다
 *   설명이 형상에 붙는다  지시선이 3D 좌표를 따라 매 프레임 다시 그려진다
 *   에셋이 0KB다         GLB를 안 받는다. 지오메트리를 코드가 만든다
 *
 * 시리즈에서 갈아 끼운 축 (07에서 얻은 원칙 — 최소 둘은 반드시 바꾼다):
 *   ✗ max-width 중앙 래퍼   → 도면 시트 + 하단 상주 표제란, 좌우 여백 규칙
 *   ✗ translateY / clip-path → SVG stroke-dashoffset 선 그리기 + 순수 페이드
 *   ✗ Plex Mono·DM Mono      → Saira Condensed + Spline Sans Mono
 *   ✗ 시리즈에 없던 채도 높은 파랑을 유일한 액센트로
 */

const A = "/assets/jungsoe";
const EMAIL = "yoon5ye@gmail.com";
const CONTACT = `mailto:${EMAIL}?subject=${encodeURIComponent("프로젝트 문의")}`;

const SHEETS = [
  { id: "s1", no: "1", ko: "표제", en: "TITLE", scale: "—" },
  { id: "s2", no: "2", ko: "분해도", en: "EXPLODED VIEW", scale: "1:1" },
  { id: "s3", no: "3", ko: "확대도", en: "DETAIL B", scale: "8:1" },
  { id: "s4", no: "4", ko: "분쇄부", en: "BURR SET", scale: "2:1" },
  { id: "s5", no: "5", ko: "사양", en: "SPECIFICATION", scale: "—" },
  { id: "s6", no: "6", ko: "제작 회계", en: "LEDGER", scale: "—" },
] as const;

/*
 * 리빌. 05·06의 translateY도, 07의 clip-path 와이프도, 10의 광학 전이도
 * 아니다 — 도면이 그려지듯 선이 왼쪽에서 오른쪽으로 그어지고, 글자는
 * 자리를 지킨 채 잉크만 올라온다. 이동량은 0px이다.
 */
function useDrawn<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = [...root.querySelectorAll<HTMLElement>(".jn-rv")];
    const draw = (n: HTMLElement) => n.setAttribute("data-drawn", "");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(draw);
      return;
    }
    let io: IntersectionObserver;
    try {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            draw(e.target as HTMLElement);
            io.unobserve(e.target);
          }),
        { threshold: 0.12 },
      );
      targets.forEach((n) => io.observe(n));
    } catch {
      targets.forEach(draw);
      return;
    }
    return () => io.disconnect();
  }, []);
  return ref;
}

/** 섹션 머리의 치수선. 화면에 들어오면 좌→우로 그어진다. */
function Rule({ eyebrow, en }: { eyebrow: string; en: string }) {
  return (
    <div className="jn-rule jn-rv">
      <span className="jn-rule-ko">{eyebrow}</span>
      <svg className="jn-rule-line" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="4" x2="100" y2="4" />
      </svg>
      <span className="jn-rule-en">{en}</span>
    </div>
  );
}

export default function JungsoePage() {
  const root = useDrawn<HTMLDivElement>();
  const [sheet, setSheet] = useState(0);

  /* 표제란은 실제 도면처럼 지금 보고 있는 시트를 표시한다 */
  useEffect(() => {
    const nodes = SHEETS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (es) => {
        const hit = es
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!hit) return;
        const i = SHEETS.findIndex((s) => s.id === hit.target.id);
        if (i >= 0) setSheet(i);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  const cur = SHEETS[sheet];

  return (
    <div className="jn-site" ref={root}>
      {/* 09에서 배운 대로 상단은 한 줄이다. 제약 설명도 제작 노트도 여기 없다. */}
      <header className="jn-top">
        <Link to="/" className="jn-back">
          ← PRODUCT FILM
        </Link>
        <span className="jn-top-t">FILM 11 · 중쇠 48 — 손으로 가는 커피 그라인더</span>
      </header>

      {/* ── SHEET 1 · 표제 ─────────────────────────────────── */}
      <section className="jn-hero" id="s1">
        <div className="jn-hero-txt">
          <p className="jn-eyebrow jn-rv">중쇠 48 · JUNGSOE 48</p>
          <h1 className="jn-h1 jn-rv">
            축이 흔들리면
            <br />
            입자가 흔들린다
          </h1>
          <p className="jn-lead jn-rv">
            원두는 두 개의 쇠 사이에서 부서진다. 그 사이 간격이 매번 같아야 맛이 같다.
            간격을 지키는 건 날이 아니라, 날을 물고 있는 축이다.
          </p>
          <dl className="jn-hero-spec jn-rv">
            <div>
              <dt>버</dt>
              <dd>Ø48 코니컬</dd>
            </div>
            <div>
              <dt>지지</dt>
              <dd>볼베어링 2점</dd>
            </div>
            <div>
              <dt>조절</dt>
              <dd>90클릭 · 25μm</dd>
            </div>
            <div>
              <dt>무게</dt>
              <dd>512g</dd>
            </div>
          </dl>
        </div>
        <figure className="jn-hero-fig jn-rv">
          <img src={`${A}/hero.webp`} alt="중쇠 48 본체 3/4 컷" width={1024} height={1280} />
          <figcaption>ASSY-00 · 조립 상태</figcaption>
        </figure>
      </section>

      {/* ── SHEET 2 · 분해도 (훅) ──────────────────────────── */}
      <section className="jn-sec jn-sec-vp" id="s2">
        <div className="jn-sec-head">
          <Rule eyebrow="분해도" en="EXPLODED VIEW · ASSY-00" />
          <h2 className="jn-h2 jn-rv">열두 조각으로 세워 놓고 본다</h2>
          <p className="jn-sec-lead jn-rv">
            가로로 끌면 돌아가고, 세로로 끌면 벌어진다. 부품을 누르면 왜 거기 있는지가
            선을 타고 나온다.
          </p>
        </div>
        <Viewport />
      </section>

      {/* ── SHEET 3 · 확대도 ───────────────────────────────── */}
      <section className="jn-sec" id="s3">
        <div className="jn-sec-head">
          <Rule eyebrow="확대도" en="DETAIL B · BURR GAP" />
          <h2 className="jn-h2 jn-rv">손끝으로 세는 값이 곧 마이크론</h2>
        </div>
        <div className="jn-rv">
          <DetailGap />
        </div>
      </section>

      {/* ── SHEET 4 · 분쇄부 ───────────────────────────────── */}
      <section className="jn-sec" id="s4">
        <div className="jn-sec-head">
          <Rule eyebrow="분쇄부" en="BURR SET · STS420J2" />
          <h2 className="jn-h2 jn-rv">원두는 잘리지 않는다. 부서진다</h2>
        </div>

        <div className="jn-pair">
          <figure className="jn-rv">
            <img src={`${A}/burr-pair.webp`} alt="수쇠와 암쇠 한 쌍" width={1024} height={768} />
            <figcaption>
              <b>08 · 07</b> 왼쪽이 뾰족한 수쇠, 오른쪽이 구멍 뚫린 암쇠. 둘 사이의
              좁아지는 통로가 분쇄실이다.
            </figcaption>
          </figure>
          <figure className="jn-rv">
            <img src={`${A}/burr-macro.webp`} alt="버 이의 접사" width={1024} height={768} />
            <figcaption>
              <b>매크로</b> 이는 자르는 각이 아니라 미는 각이다. 열이 덜 오른다.
            </figcaption>
          </figure>
        </div>

        <div className="jn-cols jn-rv">
          <p>
            칼날식은 원두를 때려서 쪼갠다. 큰 조각과 가루가 같이 나오고, 가루는 먼저
            타고 큰 조각은 끝까지 안 우러난다. 한 잔 안에서 탄 맛과 신 맛이 동시에
            나는 이유다.
          </p>
          <p>
            코니컬은 두 개의 쇠가 만드는 좁아지는 틈으로 원두를 밀어 넣는다. 틈보다 큰
            것은 지나가지 못하므로, 나오는 입자의 크기는 틈이 정한다. 날의 날카로움이
            아니라 <b>틈의 일정함</b>이 결과를 정한다는 뜻이다.
          </p>
        </div>

        <figure className="jn-wide jn-rv">
          <img src={`${A}/grounds.webp`} alt="받이에 담긴 분쇄된 원두" width={1600} height={900} />
          <figcaption>32클릭 · 800μm — 핸드드립 V60 기준</figcaption>
        </figure>
      </section>

      {/* ── SHEET 5 · 사양 ─────────────────────────────────── */}
      <section className="jn-sec" id="s5">
        <div className="jn-sec-head">
          <Rule eyebrow="사양" en="SPECIFICATION" />
        </div>

        <div className="jn-specs jn-rv">
          {SPEC_GROUPS.map((g) => (
            <div key={g.title} className="jn-spec-g">
              <h3>{g.title}</h3>
              <dl>
                {g.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className="jn-bom jn-rv">
          <h3>부품표 · BILL OF MATERIALS</h3>
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>명칭</th>
                <th>DESIGNATION</th>
                <th>재질 · 규격</th>
              </tr>
            </thead>
            <tbody>
              {PARTS.map((p) => (
                <tr key={p.id}>
                  <td>{p.no}</td>
                  <td>{p.ko}</td>
                  <td>{p.en}</td>
                  <td>{p.spec}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SHEET 6 · 제작 회계 ────────────────────────────── */}
      <section className="jn-sec jn-ledger" id="s6">
        <div className="jn-sec-head">
          <Rule eyebrow="제작 회계" en="PRODUCTION LEDGER" />
        </div>

        <div className="jn-cols jn-rv">
          <p>
            앞선 두 편(01 UMBRA · 02 KONTAKT)도 분해를 보여 줬다. 다만 그 분해는 미리
            렌더한 영상 프레임이라 부품이 픽셀이었다 — 집을 수도, 이름을 붙일 수도
            없었다. 이 편은 열두 부품을 각각 객체로 만들었고, 그래서 셋 다 된다.
          </p>
          <p>
            AI 렌더는 실사 컷을 맡았고 분해도는 한 장도 쓰지 않았다. 부품을 분리해
            달라는 지시를 AI는 매번 <b>앞판을 뺀 상태</b>로 그린다. 잘린 면이 아니라
            열린 면이다. 그래서 형상은 코드로 세웠다.
          </p>
        </div>

        <dl className="jn-ledger-list jn-rv">
          {LEDGER.map((l) => (
            <div key={l.k}>
              <dt>{l.k}</dt>
              <dd>{l.v}</dd>
            </div>
          ))}
        </dl>

        <p className="jn-disclaim jn-rv">
          중쇠 48은 포트폴리오용 가상 제품이다. 실존하는 브랜드가 아니며 사양은 예시다.
          이름은 표준국어대사전의 ‘중쇠’ — 맷돌의 위짝과 아래짝 한가운데 박는 쇠, 위짝은
          암쇠라 구멍이 뚫리고 아래짝은 수쇠라 뾰족하다 — 에서 그대로 가져왔다.
        </p>

        <div className="jn-cta jn-rv">
          <a className="jn-btn" href={CONTACT}>
            이런 페이지 문의하기
          </a>
          <Link className="jn-btn jn-btn-ghost" to="/">
            다른 작업 보기
          </Link>
        </div>
      </section>

      {/* 도면 액자 — 시트 테두리와 구역 표시 */}
      <div className="jn-frame" aria-hidden="true">
        <span className="jn-tick jn-tick-tl" />
        <span className="jn-tick jn-tick-tr" />
        <span className="jn-tick jn-tick-bl" />
        <span className="jn-tick jn-tick-br" />
      </div>

      {/* 표제란 — 실제 도면처럼 오른쪽 아래에 상주한다 */}
      <div className="jn-titleblock" aria-hidden="true">
        <div className="jn-tb-a">
          <b>JS-48</b>
          <span>중쇠 48 GRINDER</span>
        </div>
        <div className="jn-tb-b">
          <span>SHEET</span>
          <b>
            {cur.no}/{SHEETS.length}
          </b>
        </div>
        <div className="jn-tb-c">
          <span>{cur.en}</span>
          <b>{cur.scale}</b>
        </div>
      </div>
    </div>
  );
}
