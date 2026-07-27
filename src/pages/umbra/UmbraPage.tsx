import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./umbra.css";

const A = "/assets/umbra";
const ROT_N = 121;
const ASM_N = 121;

const frameSrc = (dir: string, i: number) =>
  `${A}/${dir}/f_${String(i + 1).padStart(3, "0")}.webp`;

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 프레임 시퀀스를 통째로 프리로드한다. 실패한 프레임은 건너뛴다. */
function loadFrames(dir: string, n: number) {
  const imgs: HTMLImageElement[] = Array.from({ length: n });
  const done = new Promise<void>((resolve) => {
    let settled = 0;
    for (let i = 0; i < n; i++) {
      const im = new Image();
      im.src = frameSrc(dir, i);
      im.onload = im.onerror = () => {
        if (++settled === n) resolve();
      };
      imgs[i] = im;
    }
  });
  return { imgs, done };
}

const seg = (p: number, a: number, b: number) =>
  Math.min(1, Math.max(0, (p - a) / (b - a)));

/* ---------- reveal on intersection ---------- */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("um-show");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.2 },
    );
    el.querySelectorAll(".um-reveal").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ---------- 스크롤 필름 (회전 → 티어다운 → 분해 / 재조립) ---------- */
function useScrubFilms() {
  const secA = useRef<HTMLElement | null>(null);
  const secB = useRef<HTMLElement | null>(null);
  const cvA = useRef<HTMLCanvasElement | null>(null);
  const cvB = useRef<HTMLCanvasElement | null>(null);
  const ovRot = useRef<HTMLDivElement | null>(null);
  const ovTear = useRef<HTMLDivElement | null>(null);
  const ovDis = useRef<HTMLDivElement | null>(null);
  const ovAsm = useRef<HTMLDivElement | null>(null);
  const ovFinale = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvasA = cvA.current;
    const canvasB = cvB.current;
    const sectionA = secA.current;
    const sectionB = secB.current;
    if (!canvasA || !canvasB || !sectionA || !sectionB) return;

    const ctxA = canvasA.getContext("2d");
    const ctxB = canvasB.getContext("2d");
    if (!ctxA || !ctxB) return;

    const reduced = prefersReduced();
    let alive = true;
    let raf = 0;
    let curA = 0;
    let curB = 0;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const cv of [canvasA, canvasB]) {
        cv.width = window.innerWidth * dpr;
        cv.height = window.innerHeight * dpr;
      }
    };
    size();
    window.addEventListener("resize", size);

    const rot = loadFrames("frames_rot", ROT_N);
    const asm = loadFrames("frames_asm", ASM_N);

    /* contain 방식으로 프레임을 화면 중앙에 맞춘다 */
    const drawFit = (
      ctx: CanvasRenderingContext2D,
      cv: HTMLCanvasElement,
      img: HTMLImageElement | undefined,
      alpha = 1,
    ) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      const s = Math.min(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
      const w = img.naturalWidth * s;
      const h = img.naturalHeight * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      ctx.globalAlpha = 1;
    };

    const progress = (sec: HTMLElement) => {
      const r = sec.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    };

    const show = (el: HTMLElement | null, on: boolean) =>
      el?.classList.toggle("um-show", on);

    /* 필름 A: 회전 0–0.52 → 암전(TEARDOWN) 0.52–0.60 → 분해 0.60–1.0 */
    const renderA = (p: number) => {
      ctxA.clearRect(0, 0, canvasA.width, canvasA.height);
      if (p <= 0.52) {
        const t = seg(p, 0, 0.52);
        drawFit(ctxA, canvasA, rot.imgs[Math.min(ROT_N - 1, Math.floor(t * (ROT_N - 1)))]);
        if (p > 0.48) {
          ctxA.fillStyle = `rgba(5,5,5,${seg(p, 0.48, 0.52)})`;
          ctxA.fillRect(0, 0, canvasA.width, canvasA.height);
        }
      } else if (p > 0.6) {
        const t = seg(p, 0.6, 1);
        /* 조립 시퀀스를 거꾸로 재생하면 분해가 된다 */
        drawFit(
          ctxA,
          canvasA,
          asm.imgs[Math.round((1 - t) * (ASM_N - 1))],
          Math.min(1, seg(p, 0.6, 0.63) * 1.5),
        );
      }
      show(ovRot.current, p >= 0.03 && p <= 0.45);
      show(ovTear.current, p >= 0.52 && p <= 0.62);
      show(ovDis.current, p >= 0.66 && p <= 0.95);
    };

    /* 필름 B: 재조립 0–0.85 → 홀드 + 피날레 */
    const renderB = (p: number) => {
      ctxB.clearRect(0, 0, canvasB.width, canvasB.height);
      const t = seg(p, 0, 0.85);
      drawFit(ctxB, canvasB, asm.imgs[Math.min(ASM_N - 1, Math.round(t * (ASM_N - 1)))]);
      show(ovAsm.current, p >= 0.02 && p <= 0.55);
      show(ovFinale.current, p >= 0.86);
    };

    const tick = () => {
      if (!alive) return;
      const ta = progress(sectionA);
      const tb = progress(sectionB);
      if (reduced) {
        curA = ta;
        curB = tb;
      } else {
        curA += (ta - curA) * 0.13;
        curB += (tb - curB) * 0.13;
        if (Math.abs(ta - curA) < 0.0004) curA = ta;
        if (Math.abs(tb - curB) < 0.0004) curB = tb;
      }
      renderA(curA);
      renderB(curB);
      raf = requestAnimationFrame(tick);
    };

    rot.done.then(() => {
      if (alive) raf = requestAnimationFrame(tick);
    });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);

  return { secA, secB, cvA, cvB, ovRot, ovTear, ovDis, ovAsm, ovFinale };
}

/* ---------- 3D 인스펙터 (뷰포트 진입 시 three.js 지연 로드) ---------- */
function Inspect3D() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [failed, setFailed] = useState(false);

  /* three(≈600KB)와 GLB(≈880KB)는 섹션이 가까워질 때만 받는다 */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    const el = canvasRef.current;
    if (!el) return;

    let alive = true;
    let raf = 0;
    let cleanupInput: (() => void) | undefined;
    let dispose: (() => void) | undefined;

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const bin = await fetch(`${A}/model.glb`).then((r) => {
          if (!r.ok) throw new Error(`glb ${r.status}`);
          return r.arrayBuffer();
        });
        if (!alive) return;

        const renderer = new THREE.WebGLRenderer({
          canvas: el,
          antialias: true,
          alpha: true,
        });
        const scene = new THREE.Scene();
        const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        cam.position.set(0, 0.4, 3.2);

        const key = new THREE.DirectionalLight(0xffffff, 1.15);
        key.position.set(2, 3, 2);
        const rim = new THREE.DirectionalLight(0xdfe9ff, 2.2);
        rim.position.set(-3, 1.4, -2.5);
        const under = new THREE.PointLight(0x7fe3c3, 1.6, 10);
        under.position.set(0, -1.6, 0.6);
        scene.add(key, rim, under, new THREE.AmbientLight(0x11221c, 0.9));

        const pivot = new THREE.Group();
        scene.add(pivot);

        await new Promise<void>((resolve, reject) => {
          new GLTFLoader().parse(
            bin,
            "",
            (g) => {
              const m = g.scene;
              m.traverse((o) => {
                const mesh = o as import("three").Mesh;
                if (mesh.isMesh) {
                  mesh.material = new THREE.MeshStandardMaterial({
                    color: 0x15171a,
                    roughness: 0.55,
                    metalness: 0.25,
                  });
                }
              });
              const box = new THREE.Box3().setFromObject(m);
              const c = box.getCenter(new THREE.Vector3());
              const sz = box.getSize(new THREE.Vector3());
              m.position.sub(c);
              const sc = 1.9 / Math.max(sz.x, sz.y, sz.z);
              m.scale.setScalar(sc);
              m.position.multiplyScalar(sc);
              pivot.add(m);
              resolve();
            },
            reject,
          );
        });
        if (!alive) {
          renderer.dispose();
          return;
        }

        let rx = 0.25;
        let ry = 0.7;
        let vx = 0;
        let vy = 0.004;
        let drag = false;
        let px = 0;
        let py = 0;

        const onDown = (e: PointerEvent) => {
          drag = true;
          el.setPointerCapture(e.pointerId);
          el.classList.add("um-grabbing");
          px = e.clientX;
          py = e.clientY;
          vx = 0;
          vy = 0;
        };
        const onMove = (e: PointerEvent) => {
          if (!drag) return;
          vy = (e.clientX - px) * 0.005;
          vx = (e.clientY - py) * 0.005;
          ry += vy;
          rx += vx;
          px = e.clientX;
          py = e.clientY;
        };
        const onUp = () => {
          drag = false;
          el.classList.remove("um-grabbing");
        };
        el.addEventListener("pointerdown", onDown);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
        cleanupInput = () => {
          el.removeEventListener("pointerdown", onDown);
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);
        };
        dispose = () => renderer.dispose();

        const frame = () => {
          if (!alive) return;
          const r = el.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (el.width !== r.width * dpr || el.height !== r.height * dpr) {
            renderer.setPixelRatio(dpr);
            renderer.setSize(r.width, r.height, false);
            cam.aspect = r.width / Math.max(1, r.height);
            cam.updateProjectionMatrix();
          }
          if (!drag) {
            /* 손을 떼면 천천히 자전하며 기본 각도로 되돌아온다 */
            ry += vy;
            rx += vx;
            vy += (0.004 - vy) * 0.02;
            vx *= 0.95;
            rx += (0.25 - rx) * 0.01;
          }
          rx = Math.max(-1.2, Math.min(1.2, rx));
          pivot.rotation.set(rx, ry, 0);
          renderer.render(scene, cam);
          raf = requestAnimationFrame(frame);
        };
        frame();
      } catch {
        if (alive) setFailed(true);
      }
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cleanupInput?.();
      dispose?.();
    };
  }, [armed]);

  return (
    <section className="um-inspect" ref={hostRef} id="inspect">
      <div className="um-eyebrow" style={{ marginBottom: 24 }}>
        Inspect the form — drag any direction
      </div>
      {failed ? (
        <p className="um-fallback">3D model unavailable in this build.</p>
      ) : (
        <>
          <canvas className="um-gl" ref={canvasRef} />
          <div className="um-hint">DRAG TO ROTATE · FULL 360°</div>
        </>
      )}
    </section>
  );
}

/* ---------- 레이어 4종 ---------- */
type Layer = {
  img: string;
  alt: string;
  eyebrow: string;
  title: React.ReactNode;
  stats: [string, string][];
  benefit: React.ReactNode;
  flip?: boolean;
};

const layers: Layer[] = [
  {
    img: `${A}/detail_upper.webp`,
    alt: "AeroKnit upper, top-down front view",
    eyebrow: "Layer 01 — Upper",
    title: "AeroKnit shell that breathes at pace.",
    stats: [
      ["+38%", "Airflow vs knit avg"],
      ["62 g", "Shell weight"],
    ],
    benefit: (
      <>
        Zonal knit opens over the toebox where heat builds — you can see the perforation
        field from above — and locks the midfoot where you load.{" "}
        <b>Dry socks at kilometer 10. That&apos;s the whole point.</b>
      </>
    ),
  },
  {
    img: `${A}/detail_insole.webp`,
    alt: "Insole top surface",
    eyebrow: "Layer 02 — Insole",
    title: "The insole most brands don't bother designing.",
    stats: [
      ["0 slip", "Wet & dry grip"],
      ["91%", "Moisture wicking"],
    ],
    benefit: (
      <>
        This is the surface your foot actually lives on: micro-siped top cloth grips your
        sock in both directions, anti-microbial foam kills odor at the source.{" "}
        <b>Your foot stays planted; the shoe does the moving.</b>
      </>
    ),
    flip: true,
  },
  {
    img: `${A}/detail_midsole.webp`,
    alt: "Mint midsole core profile",
    eyebrow: "Layer 03 — Midsole",
    title: "Mint core: soft landing, hard launch.",
    stats: [
      ["78%", "Energy return"],
      ["31 mm", "Heel stack"],
    ],
    benefit: (
      <>
        Supercritical foam compresses on impact and fires back on toe-off. The faceted
        sidewall isn&apos;t styling — it&apos;s where the foam is tuned to flex.{" "}
        <b>Cushion that doesn&apos;t tax your push.</b>
      </>
    ),
  },
  {
    img: `${A}/detail_sole.webp`,
    alt: "Outsole traction pattern, bottom view",
    eyebrow: "Layer 04 — Outsole",
    title: "Traction you can read from here.",
    stats: [
      ["800 km", "Tread rated"],
      ["Wet grip", "Directional lugs"],
    ],
    benefit: (
      <>
        Directional lugs bite wet asphalt on landing and release clean on push-off — this
        is the full contact patch, nothing hidden. <b>Grip in, propulsion out.</b>
      </>
    ),
    flip: true,
  },
];

function LayerSection({ l }: { l: Layer }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section className={`um-part${l.flip ? " um-flip" : ""}`} ref={ref}>
      <div className="um-art um-reveal">
        <img src={l.img} alt={l.alt} loading="lazy" />
      </div>
      <div className="um-reveal">
        <div className="um-eyebrow">{l.eyebrow}</div>
        <h3>{l.title}</h3>
        <div className="um-stat">
          {l.stats.map(([n, cap]) => (
            <div key={cap}>
              <b>{n}</b>
              <span>{cap}</span>
            </div>
          ))}
        </div>
        <p className="um-benefit">{l.benefit}</p>
        <div className="um-demonote">Concept demo — specifications are illustrative</div>
      </div>
    </section>
  );
}

/* ---------- 오퍼 ---------- */
function OfferSection() {
  const ref = useReveal<HTMLElement>();
  return (
    <section className="um-offer" ref={ref} id="offer">
      <div className="um-eyebrow um-reveal">Launch offer</div>
      <div className="um-stylecode um-reveal">STYLE UMB-GL01-BLK/MNT</div>
      <div className="um-pricebox um-reveal">
        <div className="um-was">MSRP $189.00</div>
        <div className="um-now">$139.00</div>
        <span className="um-save">SAVE $50 — LAUNCH PRICE</span>
        <div className="um-ref">Carbon-plate racers run $250+. This isn&apos;t that game.</div>
      </div>
      <div className="um-guarantees um-reveal">
        <div>
          <b>30-day run guarantee</b>Run in them. Outside. Return anyway.
        </div>
        <div>
          <b>Free shipping &amp; returns</b>Both directions, no questions.
        </div>
        <div>
          <b>800 km tread warranty</b>Wear through early, we replace.
        </div>
      </div>
      <button type="button" className="um-cta um-reveal" aria-disabled="true">
        NOTIFY ME AT LAUNCH
      </button>
      <div className="um-scarcity um-reveal">
        First drop limited to <b>500 pairs</b> · BLK/MNT colorway only
      </div>
    </section>
  );
}

/* ---------- page ---------- */
export default function UmbraPage() {
  const film = useScrubFilms();
  const agencyRef = useReveal<HTMLElement>();

  return (
    <div className="um-site">
      <nav className="um-nav" aria-label="UMBRA GLIDE 01">
        <Link to="/" className="um-nav-title" title="포트폴리오로 돌아가기">
          UMBRA
        </Link>
        <Link to="/" className="um-nav-back">
          ← Portfolio
        </Link>
      </nav>

      <section className="um-hero">
        <div className="um-code">UMBRA — RUNNING DIVISION — UMB-GL01</div>
        <h1>
          Your shoes give up
          <br />
          at kilometer <span>8</span>.
        </h1>
        <p className="um-hook">
          Foam compresses. Airflow dies. Grip fades. Most running shoes are built to look
          fast, not to finish.{" "}
          <b>So we rebuilt every layer — and we&apos;ll take one apart in front of you.</b>
        </p>
        <div className="um-scrolldn">SCROLL — CHAPTER 01</div>
      </section>

      <section className="um-scrub um-film-a" ref={film.secA} aria-label="Chapter 01 — teardown film">
        <div className="um-stage">
          <canvas ref={film.cvA} aria-hidden="true" />
          <div className="um-ov um-ov-rot" ref={film.ovRot}>
            <div className="um-eyebrow">Glide 01</div>
            <h2>214 g of engineered calm.</h2>
            <p>Every gram audited. Every seam heat-welded. Nothing here is decoration.</p>
          </div>
          <div className="um-ov um-bare um-ov-tear" ref={film.ovTear}>
            <div className="um-eyebrow" style={{ marginBottom: 14 }}>
              Chapter 02
            </div>
            <div className="um-big">TEARDOWN</div>
          </div>
          <div className="um-ov um-ov-dis" ref={film.ovDis}>
            <h2>
              Claims are cheap.
              <br />
              Cross-sections aren&apos;t.
            </h2>
            <p>Four layers. No filler. Judge each one on its own — starting now.</p>
          </div>
        </div>
      </section>

      {layers.map((l) => (
        <LayerSection key={l.eyebrow} l={l} />
      ))}

      <section className="um-scrub um-film-b" ref={film.secB} aria-label="Chapter 03 — reassembly film">
        <div className="um-stage">
          <canvas ref={film.cvB} aria-hidden="true" />
          <div className="um-ov um-bare um-ov-asm" ref={film.ovAsm}>
            <div className="um-eyebrow" style={{ marginBottom: 10 }}>
              Chapter 03
            </div>
            <h2>Four honest layers. One shoe.</h2>
          </div>
          <div className="um-ov um-bare um-ov-finale" ref={film.ovFinale}>
            <div className="um-eyebrow" style={{ marginBottom: 10 }}>
              Reassembled
            </div>
            <div className="um-name">UMBRA GLIDE 01</div>
            <div className="um-pr">
              <s>$189.00</s>
              <b>$139.00</b>
            </div>
          </div>
        </div>
      </section>

      <OfferSection />
      <Inspect3D />

      <section className="um-agency" ref={agencyRef}>
        <p className="um-reveal">
          Nothing on this page exists.
          <br />
          The shoe, the film, the teardown, the 3D — generated and built by an AI pipeline
          in one day.
        </p>
        <p
          className="um-reveal"
          style={{
            marginTop: 28,
            fontSize: "clamp(1rem,2vw,1.25rem)",
            color: "var(--um-dim)",
          }}
        >
          Imagine what it does for a product that&apos;s real. Yours.
        </p>
        <div className="um-brand um-reveal">IMAGINELINE</div>
        <div className="um-sub um-reveal">
          AI product films × scroll experiences for brands that ship
        </div>
      </section>

      <footer className="um-foot">
        <span>UMBRA — CONCEPT DEMO BY IMAGINELINE</span>
        <Link to="/">← Portfolio로 돌아가기</Link>
        <span>SCROLL FILM · AI PIPELINE</span>
      </footer>
    </div>
  );
}
