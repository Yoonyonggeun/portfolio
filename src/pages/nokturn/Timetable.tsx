import { useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "motion/react";
import {
  DAYS,
  FILMS,
  PROGRAMMES,
  SCREENINGS,
  TIMELINE_MINUTES,
  TIMELINE_START,
  VENUES,
} from "./data";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * 1시간의 가로 폭은 CSS에서 clamp(260px, 24vw, 420px)로 정한다 — 여기서
 * 고정 px로 박으면 넓은 화면에서 여섯 시간이 전부 들어와 버리고, 그러면
 * 가로로 밀 거리가 0이 되어 '스크롤 = 시간' 장치 자체가 죽는다.
 * 어느 뷰포트에서도 밤이 화면보다 길어야 한다.
 */
const LABEL_W = 148;

function fmt(minutesFromStart: number) {
  const total = (TIMELINE_START + minutesFromStart) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function Timetable() {
  const [day, setDay] = useState(1);
  const [clock, setClock] = useState(fmt(0));

  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const rows = VENUES.map((v) => ({
    venue: v,
    items: SCREENINGS.filter((s) => s.day === day && s.venue === v.id),
  }));

  /*
   * 섹션을 고정해 두고 스크롤을 가로 이동으로 바꾼다. 단순한 가로 스크롤이
   * 아니라, 진행도가 그대로 '시각'이 된다 — 아래로 스크롤하면 22:00에서
   * 04:00까지 밤이 흘러간다. 시간표라는 내용과 스크롤이라는 동작이 같은 축을
   * 공유하는 셈이다.
   *
   * 좁은 화면과 prefers-reduced-motion에서는 pin을 걸지 않고 네이티브 가로
   * 스크롤로 떨어뜨린다. 작은 화면에서 pin은 거의 항상 최악이다.
   */
  useGSAP(
    () => {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;
      // 좁은 화면·저모션에서는 pin 없이 손가락으로 미는 네이티브 가로 스크롤.
      if (reduced || window.innerWidth < 900) return;

      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      if (distance() <= 0) return;

      /*
       * 트랙을 transform으로 밀지 않고 뷰포트의 native scrollLeft를 움직인다.
       * 이유가 둘 있다:
       *  1) transform은 레이아웃엔 영향이 없지만 스크롤 오버플로 영역에는
       *     영향을 준다. 이름 열을 반대로 밀어 고정하려 했더니 scrollWidth가
       *     같이 늘어나 거리 계산이 스스로를 먹는 되먹임이 생겼다.
       *  2) native 스크롤이면 이름 열을 CSS `position: sticky; left: 0`으로
       *     얼릴 수 있다. 모바일 폴백과도 같은 메커니즘을 쓰게 된다.
       */
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: () => `+=${distance() + window.innerHeight * 0.6}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: () => {
          viewport.scrollLeft = 0;
        },
        onUpdate: (self) => {
          viewport.scrollLeft = self.progress * distance();
          setClock(fmt(Math.round(self.progress * TIMELINE_MINUTES)));
        },
      });
    },
    { scope: rootRef, dependencies: [day, reduced] },
  );

  return (
    <section className="nk-sec nk-tt" id="timetable" ref={rootRef}>
      <div className="nk-wrap nk-tt-head">
        <div>
          <p className="nk-kicker">Schedule · 상영시간표</p>
          <h2 className="nk-h2">22:00 — 04:00</h2>
        </div>

        <div className="nk-tt-right">
          <div className="nk-tt-clock" aria-hidden="true">
            {clock}
          </div>
          <div className="nk-daytabs" role="tablist" aria-label="상영일">
            {DAYS.map((d) => (
              <button
                key={d.n}
                type="button"
                role="tab"
                aria-selected={day === d.n}
                className="nk-daytab"
                onClick={() => setDay(d.n)}
              >
                <b>{d.label}</b>
                <i>{d.dow}</i>
                {d.tag && <em>{d.tag}</em>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="nk-tt-viewport" ref={viewportRef}>
        <div
          className="nk-tt-track"
          ref={trackRef}
          style={{ "--label": `${LABEL_W}px` } as React.CSSProperties}
        >
          {/* 시간 눈금 */}
          <div className="nk-tt-axis">
            <span className="nk-tt-axis-pad" />
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="nk-tt-tick">
                {fmt(i * 60)}
              </span>
            ))}
          </div>

          {rows.map(({ venue, items }) => (
            <div className="nk-tt-row" key={venue.id}>
              <div className="nk-tt-label">
                <b>{venue.name}</b>
                <i>
                  {venue.hall} · {venue.seats}석
                </i>
              </div>

              <div className="nk-tt-lane">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="nk-tt-grid" style={{ left: `calc(${i} * var(--hour))` }} />
                ))}

                {items.map((s) => {
                  const prog = PROGRAMMES.find((p) => p.id === s.programme);
                  if (!prog) return null;
                  const titles = prog.films
                    .map((id) => FILMS.find((f) => f.id === id)?.titleKo)
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <article
                      key={`${s.venue}-${s.programme}-${s.start}`}
                      className="nk-tt-block"
                      data-sold={s.soldOut ? "1" : "0"}
                      style={{
                        left: `calc(${s.start} / 60 * var(--hour))`,
                        width: `calc(${prog.runtime + 25} / 60 * var(--hour))`,
                      }}
                    >
                      <span className="nk-tt-time">
                        {fmt(s.start)}
                        <i>{s.round}회차</i>
                      </span>
                      <b className="nk-tt-name">
                        {prog.code} · {prog.title}
                      </b>
                      <span className="nk-tt-films">{titles}</span>
                      <span className="nk-tt-tags">
                        {s.gv && <em className="gv">GV</em>}
                        {s.soldOut ? <em className="sold">매진</em> : <em className="ok">예매</em>}
                      </span>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="nk-wrap nk-tt-foot">
        회차 사이 25분은 입·퇴장 및 환기 시간입니다. GV 회차는 상영 후 약 20분간 진행됩니다.
      </p>
    </section>
  );
}
