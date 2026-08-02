import { useCallback, useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";
import { PARTS, PART_BY_ID, VIEWS, type PartId, type ViewId } from "./data";
import { addOutlines, buildAssembly, type Built } from "./geometry";

/*
 * CAD 뷰포트.
 *
 * 01 UMBRA·02 KONTAKT의 분해는 미리 렌더된 영상 프레임이다. 픽셀이라서
 * 부품을 집을 수도, 이름을 붙일 수도, 되감을 수도 없다. 여기서는 12개
 * 부품이 각각 객체라서 셋 다 된다:
 *
 *   가로 드래그 → 회전      세로 드래그 / 스크럽 → 결합 ↔ 분해 (양방향)
 *   클릭        → 부품 선택  지시선이 3D 좌표를 따라 매 프레임 다시 그려진다
 *   단면 토글   → 클리핑 평면 + 스텐실 캡. 잘린 면에 45° 해칭이 들어간다
 *
 * 터치에서는 세로 드래그를 가로채지 않는다 — 페이지가 안 굴러가는 것보다
 * 스크럽 트랙을 쓰는 편이 낫다.
 */

type Api = {
  setExplode(v: number, animate?: boolean): void;
  setSelected(id: PartId | null): void;
  setSection(on: boolean): void;
  setView(v: ViewId): void;
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/* 0.08~0.34 구간에서 지시선이 서서히 켜진다 */
const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 라벨 폭. 지시선의 수평 선반이 한 줄로 맞아야 도면처럼 읽힌다. */
const LABEL_W = 200;
const LABEL_GAP = 46;
const PAD = 18;

export default function Viewport() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const readoutRef = useRef<HTMLSpanElement | null>(null);
  const trackRef = useRef<HTMLInputElement | null>(null);
  const apiRef = useRef<Api | null>(null);

  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [section, setSection] = useState(false);
  const [view, setView] = useState<ViewId>("iso");
  const [playing, setPlaying] = useState(false);

  /* 섹션이 가까워질 때만 three(≈600KB)를 받는다 */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    /* 마운트 시점에 이미 사거리 안이면 관찰자를 기다리지 않는다. IO의 첫
       콜백은 다음 프레임에 오는데, 배경 탭처럼 프레임이 안 도는 상황에서는
       그 프레임이 영영 오지 않는다. */
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight + 700 && r.bottom > -700) {
      setArmed(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setArmed(true);
      return;
    }

    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "700px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    const layer = layerRef.current;
    const svg = svgRef.current;
    if (!canvas || !host || !layer || !svg) return;

    let alive = true;
    let raf = 0;
    let built: Built | null = null;
    let teardown: (() => void) | null = null;

    (async () => {
      let THREE: typeof THREE_NS;
      try {
        THREE = await import("three");
      } catch {
        if (alive) setFailed(true);
        return;
      }
      if (!alive) return;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        stencil: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.localClippingEnabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const scene = new THREE.Scene();
      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 600);

      /*
       * 금속에는 환경맵이 필요하다. metalness가 높은 재질은 반사할 게 없으면
       * 조명을 아무리 세게 넣어도 새까맣게 나온다 — 첫 렌더가 정확히 그랬다.
       * RoomEnvironment는 파일을 안 받고 코드로 만드는 스튜디오 박스라
       * 에셋 0KB 원칙을 깨지 않는다.
       */
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.85;
      pmrem.dispose();

      scene.add(new THREE.HemisphereLight(0xffffff, 0xa8b4c0, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 1.1);
      key.position.set(40, 60, 55);
      const fill = new THREE.DirectionalLight(0xdce6f2, 0.4);
      fill.position.set(-50, 18, -35);
      scene.add(key, fill);

      built = await buildAssembly(THREE, PARTS);
      if (!alive) {
        built.dispose();
        renderer.dispose();
        return;
      }
      const asm = built;
      scene.add(asm.root);

      const outlines = addOutlines(THREE, asm, 0x14181d, 0.72);

      /* ── 중심선 ────────────────────────────────────────────
       * 바닥 격자를 깔았다가 걷어냈다. 동축 조립체에서 격자는 아무 말도
       * 하지 않고, 분해가 커지면 맨 아래 부품이 바닥을 뚫는다. 도면이 이
       * 자리에 쓰는 건 일점쇄선 중심선이다 — 열두 부품이 축 하나를
       * 공유한다는 사실 자체가 이 제품의 주장이라 선 하나가 곧 설명이다.
       */
      const axis = (() => {
        const pat = [1.0, 0.42, 0.42, 0.14, 0.14, 0.42]; // 긴 획·틈·점·틈
        const pts: number[] = [];
        let y = 0;
        let i = 0;
        while (y < 1) {
          const len = pat[i % pat.length] * 0.045;
          if (i % 2 === 0) {
            pts.push(0, y, 0, 0, Math.min(1, y + len), 0);
          }
          y += len;
          i++;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const m = new THREE.LineBasicMaterial({
          color: 0x1b4dd8,
          transparent: true,
          opacity: 0.42,
        });
        const line = new THREE.LineSegments(g, m);
        scene.add(line);
        return { line, geo: g, mat: m };
      })();

      /* ── 단면: 클리핑 평면 + 스텐실 캡 ────────────────────
       * 면을 그냥 자르면 속이 빈 껍데기로 보인다. 스텐실로 잘린 자리를
       * 다시 메우고 45° 해칭을 얹어야 도면의 단면이 된다. */
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
      const planes = [plane];

      const hatch = (() => {
        const s = 26;
        const c = document.createElement("canvas");
        c.width = c.height = s;
        const g = c.getContext("2d");
        if (g) {
          g.fillStyle = "#8e9aa6";
          g.fillRect(0, 0, s, s);
          g.strokeStyle = "#26303a";
          g.lineWidth = 2.4;
          g.beginPath();
          for (let i = -s; i < s * 2; i += 9) {
            g.moveTo(i, -2);
            g.lineTo(i + s + 2, s + 2);
          }
          g.stroke();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        /* 배율이 낮으면 부품 하나에 사선이 한 줄만 걸려 해칭으로 안 읽힌다 */
        tex.repeat.set(48, 48);
        return tex;
      })();

      const stencilGroup = new THREE.Group();
      stencilGroup.visible = false;
      scene.add(stencilGroup);

      const stencilMats: THREE_NS.Material[] = [];
      const allMeshes = Object.values(asm.parts).flatMap((p) => p.meshes);

      for (const mesh of allMeshes) {
        for (const [side, op] of [
          [THREE.BackSide, THREE.IncrementWrapStencilOp],
          [THREE.FrontSide, THREE.DecrementWrapStencilOp],
        ] as const) {
          const m = new THREE.MeshBasicMaterial({
            depthWrite: false,
            depthTest: false,
            colorWrite: false,
            stencilWrite: true,
            stencilFunc: THREE.AlwaysStencilFunc,
            side,
            stencilFail: op,
            stencilZFail: op,
            stencilZPass: op,
            clippingPlanes: planes,
          });
          stencilMats.push(m);
          const proxy = new THREE.Mesh(mesh.geometry, m);
          proxy.renderOrder = 1;
          /* 원본과 같은 자리에 서 있어야 하므로 부품 그룹을 따라간다 */
          proxy.userData.follow = mesh;
          stencilGroup.add(proxy);
        }
      }

      const capMat = new THREE.MeshBasicMaterial({
        map: hatch,
        /* 잘린 면은 카메라가 어느 쪽에 있든 보여야 한다 */
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      });
      const cap = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), capMat);
      cap.renderOrder = 2;
      cap.visible = false;
      scene.add(cap);

      const allMats = allMeshes.map((m) => m.material as THREE_NS.Material);
      const uniqueMats = [...new Set(allMats)];

      /* ── 상태 ─────────────────────────────────────────── */
      const rm = reduced();
      let t = 0; // 실제 분해량
      let tTarget = 0;
      let az = VIEWS[0].az;
      let el = VIEWS[0].el;
      let azTarget = az;
      let elTarget = el;
      let sel: PartId | null = null;
      let sectionOn = false;
      let W = 1;
      let H = 1;

      const setMatClipping = (on: boolean) => {
        uniqueMats.forEach((m) => {
          m.clippingPlanes = on ? planes : null;
          m.needsUpdate = true;
        });
        Object.values(outlines.materials).forEach((m) => {
          m.clippingPlanes = on ? planes : null;
          m.needsUpdate = true;
        });
      };

      /* ── 지시선 DOM 캐시 ──────────────────────────────── */
      const labelEls = new Map<PartId, HTMLElement>();
      const lineEls = new Map<PartId, SVGPolylineElement>();
      const dotEls = new Map<PartId, SVGCircleElement>();
      layer.querySelectorAll<HTMLElement>("[data-part]").forEach((n) => {
        labelEls.set(n.dataset.part as PartId, n);
      });
      svg.querySelectorAll<SVGPolylineElement>("polyline[data-part]").forEach((n) => {
        lineEls.set(n.dataset.part as PartId, n);
      });
      svg.querySelectorAll<SVGCircleElement>("circle[data-part]").forEach((n) => {
        dotEls.set(n.dataset.part as PartId, n);
      });

      const v3 = new THREE.Vector3();
      const capLook = new THREE.Vector3();
      type Slot = { id: PartId; sx: number; sy: number; y: number; side: "L" | "R" };

      /* 좁은 화면에서는 좌우 라벨 열이 모델을 다 덮는다. 고른 하나만 남긴다. */
      const narrow = window.matchMedia("(max-width: 720px)");

      const layoutCallouts = () => {
        const vis = narrow.matches ? 0 : ramp(t, 0.07, 0.3);
        const slots: Slot[] = [];

        /*
         * 앵커의 좌우 방향을 카메라에서 뽑는다. 부품에 고정 좌표로 박아 두면
         * 모델을 반 바퀴 돌리는 순간 앵커가 라벨 반대쪽 면으로 넘어가고,
         * 지시선이 모델을 가로질러 옆 부품의 선과 엉킨다.
         * 카메라의 오른쪽 벡터는 방위각만으로 정해진다: (cos az, 0, -sin az).
         */
        const rx = Math.cos(az);
        const rz = -Math.sin(az);

        for (const p of PARTS) {
          const sgn = p.side === "R" ? 1 : -1;
          v3.set(
            p.at[0] + p.explode[0] * t + p.anchorX + rx * p.anchorR * sgn,
            p.at[1] + p.explode[1] * t + p.anchorY,
            p.at[2] + p.explode[2] * t + rz * p.anchorR * sgn,
          ).project(cam);
          slots.push({
            id: p.id,
            sx: (v3.x * 0.5 + 0.5) * W,
            sy: (-v3.y * 0.5 + 0.5) * H,
            y: 0,
            side: p.side,
          });
        }

        /* 좌우 각각 앵커 높이 순으로 세우고, 겹치면 아래로 민다 */
        for (const side of ["L", "R"] as const) {
          const col = slots.filter((s) => s.side === side).sort((a, b) => a.sy - b.sy);
          const top = PAD + LABEL_GAP / 2;
          const bottom = H - PAD - LABEL_GAP / 2;
          let prev = -Infinity;
          for (let i = 0; i < col.length; i++) {
            const room = bottom - (col.length - 1 - i) * LABEL_GAP;
            let y = Math.min(Math.max(col[i].sy, top), Math.max(room, top));
            if (y < prev + LABEL_GAP) y = prev + LABEL_GAP;
            col[i].y = y;
            prev = y;
          }
        }

        for (const s of slots) {
          const label = labelEls.get(s.id);
          const line = lineEls.get(s.id);
          const dot = dotEls.get(s.id);
          if (!label || !line || !dot) continue;

          const on = sel === s.id ? 1 : vis;
          const shelfX = s.side === "L" ? PAD + LABEL_W : W - PAD - LABEL_W;
          const elbowX = s.side === "L" ? shelfX + 20 : shelfX - 20;
          const labelX = s.side === "L" ? PAD : W - PAD - LABEL_W;

          label.style.transform = `translate3d(${labelX}px, ${s.y - LABEL_GAP / 2}px, 0)`;
          label.style.opacity = String(on);
          label.style.pointerEvents = on > 0.5 ? "auto" : "none";

          line.setAttribute(
            "points",
            `${s.sx.toFixed(1)},${s.sy.toFixed(1)} ${elbowX.toFixed(1)},${s.y.toFixed(1)} ${shelfX.toFixed(1)},${s.y.toFixed(1)}`,
          );
          line.style.opacity = String(on * 0.85);
          dot.setAttribute("cx", s.sx.toFixed(1));
          dot.setAttribute("cy", s.sy.toFixed(1));
          dot.style.opacity = String(on);
        }
      };

      const applyTransforms = () => {
        for (const p of PARTS) {
          const g = asm.parts[p.id].group;
          g.position.set(
            p.at[0] + p.explode[0] * t,
            p.at[1] + p.explode[1] * t,
            p.at[2] + p.explode[2] * t,
          );
        }
        /* 스텐실 프록시는 원본 메시의 월드 변환을 그대로 베낀다 */
        if (sectionOn) {
          for (const proxy of stencilGroup.children as THREE_NS.Mesh[]) {
            const src = proxy.userData.follow as THREE_NS.Mesh;
            src.updateWorldMatrix(true, false);
            proxy.matrix.copy(src.matrixWorld);
            proxy.matrixAutoUpdate = false;
            proxy.matrixWorldNeedsUpdate = true;
          }
        }
      };

      const resize = () => {
        const r = host.getBoundingClientRect();
        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height));
        renderer.setSize(W, H, false);
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      };

      const frame = () => {
        raf = requestAnimationFrame(frame);

        const ease = rm ? 1 : 0.16;
        t += (tTarget - t) * ease;
        az += (azTarget - az) * ease;
        el += (elTarget - el) * ease;
        if (Math.abs(tTarget - t) < 0.0004) t = tTarget;

        /* 분해할수록 시야를 넓힌다 — 도면이 축척을 바꾸는 것과 같다 */
        const fh = lerp(25, 48, t);
        const aspect = W / H;
        const fw = fh * aspect;
        cam.left = -fw / 2;
        cam.right = fw / 2;
        cam.top = fh / 2;
        cam.bottom = -fh / 2;
        cam.updateProjectionMatrix();

        const ty = lerp(4.6, 5.2, t);
        const dist = 140;
        cam.position.set(
          Math.sin(az) * Math.cos(el) * dist,
          ty + Math.sin(el) * dist,
          Math.cos(az) * Math.cos(el) * dist,
        );
        cam.lookAt(0, ty, 0);

        /* 중심선은 조립체보다 조금씩만 더 나온다 — 도면의 관용구다 */
        const span = lerp(24, 46, t);
        axis.line.scale.y = span;
        axis.line.position.y = ty - span / 2;

        applyTransforms();

        if (sectionOn) {
          cap.position.set(0, ty, 0);
          cap.lookAt(capLook.copy(cap.position).add(plane.normal));
        }
        renderer.render(scene, cam);

        if (readoutRef.current) {
          readoutRef.current.textContent = `${Math.round(t * 100)}%`;
        }
        layoutCallouts();
      };

      /* ── 입력 ─────────────────────────────────────────── */
      const ray = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      let drag = false;
      let moved = 0;
      let px = 0;
      let py = 0;
      let vertical = false;

      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        drag = true;
        moved = 0;
        px = e.clientX;
        py = e.clientY;
        vertical = e.pointerType === "mouse";
        canvas.setPointerCapture(e.pointerId);
        canvas.classList.add("jn-grabbing");
      };
      const onMove = (e: PointerEvent) => {
        if (!drag) return;
        const dx = e.clientX - px;
        const dy = e.clientY - py;
        px = e.clientX;
        py = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        azTarget -= dx * 0.008;
        if (vertical) {
          /* 위로 끌면 분해, 아래로 끌면 결합 */
          tTarget = clamp01(tTarget - dy / (host.clientHeight * 0.62));
          if (trackRef.current) trackRef.current.value = String(Math.round(tTarget * 100));
        }
      };
      const onUp = (e: PointerEvent) => {
        if (!drag) return;
        drag = false;
        canvas.releasePointerCapture(e.pointerId);
        canvas.classList.remove("jn-grabbing");
        if (moved > 6) return;

        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, cam);
        const hits = ray.intersectObjects(allMeshes, false);
        const id = (hits[0]?.object.userData.partId as PartId | undefined) ?? null;
        setSelected((cur) => (cur === id ? null : id));
      };

      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();
      applyTransforms();
      setMatClipping(false);
      raf = requestAnimationFrame(frame);
      setReady(true);

      apiRef.current = {
        setExplode(v) {
          tTarget = clamp01(v);
          if (rm) t = tTarget;
        },
        setSelected(id) {
          sel = id;
          for (const p of PARTS) {
            const m = outlines.materials[p.id];
            const isSel = id === p.id;
            m.color.setHex(isSel ? 0x1b4dd8 : 0x14181d);
            m.opacity = id ? (isSel ? 1 : 0.16) : 0.72;
          }
        },
        setSection(on) {
          sectionOn = on;
          setMatClipping(on);
          stencilGroup.visible = on;
          cap.visible = on;
          /* 절단면은 +Z를 깎는다. 뒤통수를 보고 있으면 잘린 게 안 보이므로
             그때만 카메라를 앞쪽으로 돌려 놓는다. */
          if (on && Math.cos(azTarget) < 0.25) azTarget = VIEWS[0].az;
        },
        setView(v) {
          const found = VIEWS.find((x) => x.id === v) ?? VIEWS[0];
          azTarget = found.az;
          elTarget = found.el;
        },
      };

      teardown = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        outlines.dispose();
        stencilMats.forEach((m) => m.dispose());
        capMat.dispose();
        cap.geometry.dispose();
        hatch.dispose();
        axis.geo.dispose();
        axis.mat.dispose();
        envRT.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      alive = false;
      apiRef.current = null;
      teardown?.();
      built?.dispose();
    };
  }, [armed]);

  /* 상태 → 엔진 */
  useEffect(() => {
    apiRef.current?.setSelected(selected);
  }, [selected, ready]);
  useEffect(() => {
    apiRef.current?.setSection(section);
  }, [section, ready]);
  useEffect(() => {
    apiRef.current?.setView(view);
  }, [view, ready]);

  /* 재생 — 결합에서 분해까지 한 번 훑고 멈춘다 */
  useEffect(() => {
    if (!playing) return;
    if (reduced()) {
      apiRef.current?.setExplode(1);
      if (trackRef.current) trackRef.current.value = "100";
      setPlaying(false);
      return;
    }
    const from = Number(trackRef.current?.value ?? 0) / 100;
    const to = from > 0.85 ? 0 : 1;
    const t0 = performance.now();
    const dur = 2200 * Math.abs(to - from);
    let raf = 0;
    const step = (now: number) => {
      const u = dur <= 0 ? 1 : clamp01((now - t0) / dur);
      const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      const v = lerp(from, to, e);
      apiRef.current?.setExplode(v);
      if (trackRef.current) trackRef.current.value = String(Math.round(v * 100));
      if (u < 1) raf = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const onTrack = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    apiRef.current?.setExplode(Number(e.target.value) / 100);
  }, []);

  const sp = selected ? PART_BY_ID[selected] : null;

  return (
    <div className="jn-vp-wrap">
      <div className="jn-vp" ref={hostRef}>
        <canvas ref={canvasRef} className="jn-canvas" aria-hidden="true" />

        {/* 지시선 레이어 — 3D 좌표를 투영한 값으로 매 프레임 다시 그린다 */}
        <div className="jn-callouts" ref={layerRef} aria-hidden={!ready}>
          <svg className="jn-leaders" ref={svgRef} preserveAspectRatio="none">
            {PARTS.map((p) => (
              <g key={p.id}>
                <polyline data-part={p.id} className="jn-leader" points="" />
                <circle data-part={p.id} className="jn-dot" r="3.2" />
              </g>
            ))}
          </svg>

          {PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              data-part={p.id}
              className={`jn-label${selected === p.id ? " is-on" : ""} jn-${p.side}`}
              onClick={() => setSelected((c) => (c === p.id ? null : p.id))}
            >
              <span className="jn-balloon">{p.no}</span>
              <span className="jn-lname">{p.ko}</span>
              <span className="jn-len">{p.en}</span>
            </button>
          ))}
        </div>

        {!ready && !failed && <p className="jn-vp-msg">모델을 세우는 중…</p>}
        {failed && <p className="jn-vp-msg">이 브라우저에서는 3D 뷰포트를 열 수 없습니다.</p>}
      </div>

      {/*
       * 조작부. 캔버스 위에 띄웠다가 내렸다 — 분해가 끝까지 가면 맨 아래
       * 부품(원두 받이)이 그대로 패널 뒤로 들어갔다. 도킹하면 모델이 쓸 수
       * 있는 세로가 온전해지고, 실제 CAD도 툴바를 띄우지 않는다.
       */}
      <div className="jn-hud">
        <div className="jn-hud-in">
          <div className="jn-hud-scrub">
            <button
              type="button"
              className="jn-play"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? "정지" : "분해 재생"}
            >
              {playing ? "■" : "▶"}
            </button>
            <label className="jn-track">
              <span className="jn-track-a">결합</span>
              <input
                ref={trackRef}
                type="range"
                min={0}
                max={100}
                defaultValue={0}
                onChange={onTrack}
                aria-label="분해 정도"
              />
              <span className="jn-track-b">분해</span>
            </label>
            <span className="jn-readout">
              <span ref={readoutRef}>0%</span>
            </span>
          </div>

          <div className="jn-hud-views">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`jn-vbtn${view === v.id ? " is-on" : ""}`}
                onClick={() => setView(v.id)}
              >
                {v.label}
                <em>{v.en}</em>
              </button>
            ))}
            <button
              type="button"
              className={`jn-vbtn jn-sect${section ? " is-on" : ""}`}
              onClick={() => setSection((v) => !v)}
            >
              단면
              <em>SECTION</em>
            </button>
          </div>
        </div>
      </div>

      {/*
       * 주기란. 오버레이로 띄우면 모델을 가리고, 선택할 때마다 나타났다
       * 사라지면 레이아웃이 흔들린다. 자리를 미리 잡아 두고 내용만 바꾼다.
       */}
      <div className="jn-note" aria-live="polite">
        {sp ? (
          <>
            <p className="jn-note-h">
              <span className="jn-balloon">{sp.no}</span>
              {sp.ko}
              <em>{sp.spec}</em>
            </p>
            <p className="jn-note-b">{sp.note}</p>
          </>
        ) : (
          <p className="jn-vp-hint">
            가로로 끌면 회전 · 세로로 끌면 분해 · 부품을 누르면 여기에 설명이 나옵니다
          </p>
        )}
      </div>
    </div>
  );
}
