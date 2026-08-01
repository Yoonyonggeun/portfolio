import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { asset } from "./assets";
import { VENUES } from "./data";

/*
 * Embla 캐러셀. 직접 만든 슬라이더와 다른 점은 드래그의 감이다 —
 * 관성, 저항, 스냅이 전부 물리값으로 계산된다. wheel-gestures 플러그인을
 * 붙이면 트랙패드 가로 스와이프까지 먹는다.
 */
export default function Venues() {
  const [emblaRef, embla] = useEmblaCarousel(
    { align: "start", loop: false, dragFree: false, containScroll: "trimSnaps" },
    [WheelGesturesPlugin({ forceWheelAxis: "x" })],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!embla) return;
    const sync = () => setSelected(embla.selectedScrollSnap());
    setSnaps(embla.scrollSnapList());
    sync();
    embla.on("select", sync).on("reInit", () => {
      setSnaps(embla.scrollSnapList());
      sync();
    });
  }, [embla]);

  const to = useCallback((i: number) => embla?.scrollTo(i), [embla]);

  return (
    <section className="nk-sec nk-venues" id="venues">
      <div className="nk-wrap nk-venues-head">
        <div>
          <p className="nk-kicker">Venues · 상영관</p>
          <h2 className="nk-h2">걸어서 갈 수 있는 거리</h2>
          <p className="nk-lead">세 곳 모두 을지로3가역에서 도보 7분 안입니다. 밤새 오가셔도 됩니다.</p>
        </div>
        <div className="nk-venues-nav">
          <button type="button" onClick={() => embla?.scrollPrev()} aria-label="이전 상영관">
            ←
          </button>
          <button type="button" onClick={() => embla?.scrollNext()} aria-label="다음 상영관">
            →
          </button>
        </div>
      </div>

      <div className="nk-embla" ref={emblaRef}>
        <div className="nk-embla-track">
          {VENUES.map((v, i) => (
            <article className="nk-venue" key={v.id} data-active={selected === i ? "1" : "0"}>
              <figure className="nk-venue-fig">
                <img src={asset(v.still)} alt="" loading="lazy" decoding="async" />
                <figcaption>
                  {v.hall} · {v.seats}석
                </figcaption>
              </figure>
              <div className="nk-venue-body">
                <h3>{v.name}</h3>
                <p className="nk-venue-addr">{v.address}</p>
                <p className="nk-venue-note">{v.note}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="nk-wrap nk-dots">
        {snaps.map((_, i) => (
          <button
            key={i}
            type="button"
            className="nk-dot"
            data-on={selected === i ? "1" : "0"}
            onClick={() => to(i)}
            aria-label={`${VENUES[i]?.name ?? i + 1} 보기`}
          />
        ))}
      </div>
    </section>
  );
}
