/*
 * 중쇠 48 — 부품 지오메트리를 코드로 만든다.
 *
 * GLB를 안 쓴다. 01 UMBRA가 880KB짜리 model.glb를 받아오는데, 그 방식으로는
 * 부품 하나를 집어 이름을 붙일 수가 없다 — 메시가 통짜로 들어오기 때문이다.
 * 여기서는 12개 부품을 회전체(Lathe)와 압출(Extrude)로 각각 만들어서
 * 부품마다 id·앵커·재질을 들고 있게 한다. 그래서 분해 상태에서 클릭이 되고
 * 지시선이 붙는다. 다운로드 용량은 0이다.
 *
 * three를 static import하지 않는다. 이 모듈은 THREE 네임스페이스를 인자로
 * 받으므로 자체적으로는 아무것도 끌어오지 않고, 뷰포트가 화면에 가까워질 때
 * 한 번만 동적으로 받은 것을 넘겨 준다.
 */

import type * as THREE_NS from "three";
import type { Part, PartId } from "./data";

type T = typeof THREE_NS;
type Group = THREE_NS.Group;
type BufferGeometry = THREE_NS.BufferGeometry;
type Material = THREE_NS.Material;

/** (반지름, 높이) 폴리라인을 Y축으로 돌린다. */
function lathe(THREE: T, pts: [number, number][], seg = 96): BufferGeometry {
  return new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    seg,
  );
}

/**
 * 원뿔면 위에 이를 두른다. 회전체로는 절대 못 만드는 부분이라 — 회전체는
 * 정의상 축 둘레로 균일하다 — 버의 이만 따로 박아 넣는다.
 */
function coneTeeth(
  THREE: T,
  o: {
    count: number;
    rTop: number;
    yTop: number;
    rBot: number;
    yBot: number;
    w: number;
    depth: number;
    /** 이가 축을 향해 눕는 각(라디안). 실제 버는 살짝 비틀려 있다. */
    twist: number;
    /** 원뿔의 안쪽 면에 붙일 때 true */
    inward?: boolean;
  },
): BufferGeometry[] {
  const { count, rTop, yTop, rBot, yBot, w, depth, twist, inward } = o;
  const h = Math.hypot(rBot - rTop, yBot - yTop);
  /* 원뿔 모선이 Y축과 이루는 각 */
  const slope = Math.atan2(rBot - rTop, yBot - yTop);
  const rMid = (rTop + rBot) / 2;
  const yMid = (yTop + yBot) / 2;

  const out: BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const g = new THREE.BoxGeometry(depth, h * 0.98, w);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler(0, 0, 0, "YZX");

    /* 모선에 눕히고(Z축 회전) → 비틀고(Y) → 둘레로 돌린다 */
    e.set(0, twist, inward ? -slope : slope);
    q.setFromEuler(e);
    m.compose(
      new THREE.Vector3(Math.cos(a) * rMid, yMid, -Math.sin(a) * rMid),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a).multiply(q),
      new THREE.Vector3(1, 1, 1),
    );
    g.applyMatrix4(m);
    out.push(g);
  }
  return out;
}

/** 손끝이 걸리는 널링. 얇은 판을 둘레로 두른다. */
function knurl(
  THREE: T,
  o: { count: number; r: number; y: number; h: number; w: number; depth: number },
): BufferGeometry[] {
  const out: BufferGeometry[] = [];
  for (let i = 0; i < o.count; i++) {
    const a = (i / o.count) * Math.PI * 2;
    const g = new THREE.BoxGeometry(o.depth, o.h, o.w);
    g.translate(o.r, o.y, 0);
    g.rotateY(a);
    out.push(g);
  }
  return out;
}

/** 볼베어링 한 벌: 바깥 레이스 + 안쪽 레이스 + 볼. */
function bearing(THREE: T, ro: number, ri: number, h: number) {
  const t = 0.22;
  const outer = lathe(THREE, [
    [ro - t, h / 2],
    [ro, h / 2],
    [ro, -h / 2],
    [ro - t, -h / 2],
    [ro - t, h / 2],
  ]);
  const inner = lathe(THREE, [
    [ri, h / 2],
    [ri + t, h / 2],
    [ri + t, -h / 2],
    [ri, -h / 2],
    [ri, h / 2],
  ]);
  const rBall = (ro - t + ri + t) / 2;
  const balls: BufferGeometry[] = [];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const g = new THREE.SphereGeometry(Math.min(h * 0.36, (ro - ri - t * 2) / 2 + 0.02), 12, 8);
    g.translate(Math.cos(a) * rBall, 0, -Math.sin(a) * rBall);
    balls.push(g);
  }
  return { outer, inner, balls };
}

export type BuiltPart = {
  id: PartId;
  group: Group;
  meshes: THREE_NS.Mesh[];
};

export type Built = {
  root: Group;
  parts: Record<PartId, BuiltPart>;
  dispose(): void;
};

export async function buildAssembly(THREE: T, PARTS: Part[]): Promise<Built> {
  const { mergeGeometries } = await import("three/examples/jsm/utils/BufferGeometryUtils.js");

  const geos: BufferGeometry[] = [];
  const mats: Material[] = [];

  const keep = <G extends BufferGeometry>(g: G) => {
    geos.push(g);
    return g;
  };
  const merge = (list: BufferGeometry[]) => {
    const m = mergeGeometries(list, false);
    list.forEach((g) => g.dispose());
    return keep(m as BufferGeometry);
  };

  const mat = (o: THREE_NS.MeshStandardMaterialParameters) => {
    const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
    mats.push(m);
    return m;
  };

  /*
   * 검정 아노다이즈드는 쓰지 않는다. 02 KONTAKT(#17191c)·03 KLANG(#1d1d1f)·
   * 04 AURUM(#060605)이 이미 근사흑 세 편이고, 셋 다 금속 질감이다.
   * 여기는 생지 아노다이즈드(무광 은색) — 밝은 도면 용지 위에서 형상이
   * 읽히고, 파랑은 제도선에만 남겨 둘 수 있다.
   */
  const M = {
    alu: mat({ color: 0xb9c0c6, roughness: 0.38, metalness: 0.55 }),
    aluDark: mat({ color: 0x6c757d, roughness: 0.5, metalness: 0.45 }),
    steel: mat({ color: 0xd8dde1, roughness: 0.16, metalness: 0.92 }),
    sus: mat({ color: 0xc2c9cf, roughness: 0.22, metalness: 0.88 }),
    wood: mat({ color: 0x7d5233, roughness: 0.62, metalness: 0.0 }),
    poly: mat({ color: 0x3b4248, roughness: 0.68, metalness: 0.06 }),
  };

  const root = new THREE.Group();
  const parts = {} as Record<PartId, BuiltPart>;

  const makePart = (p: Part, build: (g: Group) => void): BuiltPart => {
    const group = new THREE.Group();
    group.name = p.id;
    build(group);

    const meshes: THREE_NS.Mesh[] = [];
    group.traverse((o) => {
      const m = o as THREE_NS.Mesh;
      if (m.isMesh) {
        m.userData.partId = p.id;
        meshes.push(m);
      }
    });

    group.position.set(...p.at);
    root.add(group);

    const bp: BuiltPart = { id: p.id, group, meshes };
    parts[p.id] = bp;
    return bp;
  };

  const byId = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, Part>;

  /*
   * noOutline: 널링에는 외곽선을 얹지 않는다. 56~72개 판재에 전부 선을
   * 그으면 도면이 아니라 철망이 된다. 버의 이는 반대로 선이 있어야
   * 이가 이로 읽히므로 그대로 둔다.
   */
  const add = (g: Group, geo: BufferGeometry, m: Material, noOutline = false) => {
    const mesh = new THREE.Mesh(keep(geo), m);
    if (noOutline) mesh.userData.noOutline = true;
    g.add(mesh);
    return mesh;
  };

  /* 01 핸들 노브 — 월넛 배럴 */
  makePart(byId.knob, (g) => {
    add(
      g,
      lathe(THREE, [
        [0.0, -1.2],
        [0.5, -1.2],
        [0.79, -0.86],
        [0.86, 0.0],
        [0.77, 0.86],
        [0.48, 1.2],
        [0.0, 1.2],
      ]),
      M.wood,
    );
    add(
      g,
      lathe(THREE, [
        [0.0, -1.42],
        [0.3, -1.42],
        [0.3, -1.14],
        [0.0, -1.14],
      ]),
      M.sus,
    );
  });

  /* 02 크랭크 암 — 유일하게 회전체가 아닌 부품 */
  makePart(byId.crank, (g) => {
    const s = new THREE.Shape();
    s.moveTo(-0.72, 0.44);
    s.lineTo(4.86, 0.26);
    s.quadraticCurveTo(5.68, 0.26, 5.68, 0.0);
    s.quadraticCurveTo(5.68, -0.26, 4.86, -0.26);
    s.lineTo(-0.72, -0.44);
    s.quadraticCurveTo(-1.02, -0.44, -1.02, 0.0);
    s.quadraticCurveTo(-1.02, 0.44, -0.72, 0.44);
    const arm = new THREE.ExtrudeGeometry(s, { depth: 0.34, bevelEnabled: false });
    arm.translate(0, 0, -0.17);
    add(g, arm, M.sus);

    /* 축을 무는 허브와 노브가 앉는 보스. 둘 다 축이 Y다. */
    add(
      g,
      lathe(THREE, [
        [0.33, -0.62],
        [0.66, -0.62],
        [0.66, 0.62],
        [0.33, 0.62],
        [0.33, -0.62],
      ]),
      M.alu,
    );
    const boss = lathe(THREE, [
      [0.0, 0.0],
      [0.3, 0.0],
      [0.3, 0.62],
      [0.0, 0.62],
    ]);
    boss.translate(5.4, 0, 0);
    add(g, boss, M.sus);
  });

  /* 03 상부 캡 */
  makePart(byId.cap, (g) => {
    add(
      g,
      lathe(THREE, [
        [0.34, -0.62],
        [1.44, -0.62],
        [1.44, 0.22],
        [1.26, 0.42],
        [1.26, 0.62],
        [0.34, 0.62],
        [0.34, -0.62],
      ]),
      M.alu,
    );
    add(g, merge(knurl(THREE, { count: 40, r: 1.44, y: -0.2, h: 0.72, w: 0.1, depth: 0.07 })), M.alu, true);
  });

  /* 04 · 09 베어링 */
  const putBearing = (p: Part, ro: number, ri: number, h: number) =>
    makePart(p, (g) => {
      const b = bearing(THREE, ro, ri, h);
      add(g, b.outer, M.steel);
      add(g, b.inner, M.steel);
      add(g, merge(b.balls), M.steel);
    });
  putBearing(byId.bearingTop, 1.0, 0.3, 0.62);
  putBearing(byId.bearingBot, 0.9, 0.26, 0.58);

  /* 05 중쇠 — 이 페이지의 이름값 */
  makePart(byId.shaft, (g) => {
    add(
      g,
      lathe(
        THREE,
        [
          [0.0, -4.8],
          [0.24, -4.8],
          [0.24, -4.3],
          [0.3, -4.24],
          [0.3, -1.5],
          [0.46, -1.44],
          [0.46, -1.1],
          [0.3, -1.04],
          [0.3, 4.2],
          [0.26, 4.3],
          [0.26, 4.8],
          [0.0, 4.8],
        ],
        48,
      ),
      M.sus,
    );
  });

  /* 06 그라인드 챔버 */
  makePart(byId.body, (g) => {
    add(
      g,
      lathe(THREE, [
        [2.3, -4.7],
        [2.62, -4.7],
        [2.62, 4.18],
        [2.72, 4.28],
        [2.72, 4.7],
        [2.26, 4.7],
        [2.26, 4.3],
        [2.38, 4.18],
        [2.38, -3.1],
        [2.3, -3.02],
        [2.3, -4.7],
      ]),
      M.alu,
    );
    /* 손이 감기는 자리에만 널링을 준다 */
    add(
      g,
      merge(knurl(THREE, { count: 64, r: 2.6, y: -0.6, h: 3.4, w: 0.085, depth: 0.055 })),
      M.aluDark,
      true,
    );
  });

  /* 07 암쇠 · 링 버 — 구멍이 뚫린 쪽, 돌지 않는다 */
  makePart(byId.ringBurr, (g) => {
    add(
      g,
      lathe(THREE, [
        [0.9, 1.5],
        [2.5, 1.5],
        [2.5, -1.5],
        [2.3, -1.5],
        [0.9, 1.5],
      ]),
      M.steel,
    );
    add(
      g,
      merge(
        coneTeeth(THREE, {
          count: 30,
          rTop: 0.98,
          yTop: 1.42,
          rBot: 2.28,
          yBot: -1.42,
          w: 0.19,
          depth: 0.1,
          twist: 0.13,
          inward: true,
        }),
      ),
      M.steel,
    );
  });

  /* 08 수쇠 · 코니컬 버 — 뾰족한 쪽, 축에 물려 돈다 */
  makePart(byId.coneBurr, (g) => {
    add(
      g,
      lathe(THREE, [
        [0.31, 1.45],
        [0.42, 1.45],
        [2.38, -1.35],
        [2.38, -1.45],
        [0.31, -1.45],
        [0.31, 1.45],
      ]),
      M.steel,
    );
    add(
      g,
      merge(
        coneTeeth(THREE, {
          count: 24,
          rTop: 0.5,
          yTop: 1.36,
          rBot: 2.3,
          yBot: -1.28,
          w: 0.2,
          depth: 0.1,
          twist: -0.14,
        }),
      ),
      M.steel,
    );
  });

  /* 10 예압 스프링 — 유격을 없앤다 */
  makePart(byId.spring, (g) => {
    const pts: THREE_NS.Vector3[] = [];
    const turns = 4.5;
    const n = 220;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = u * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.62, -0.4 + u * 0.8, -Math.sin(a) * 0.62));
    }
    add(
      g,
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.085, 8, false),
      M.sus,
    );
  });

  /* 11 클릭 다이얼 — 손끝으로 세는 값이 곧 마이크론 */
  makePart(byId.dial, (g) => {
    add(
      g,
      lathe(THREE, [
        [1.1, -0.65],
        [2.48, -0.65],
        [2.6, -0.52],
        [2.6, 0.52],
        [2.48, 0.65],
        [1.1, 0.65],
        [1.1, -0.65],
      ]),
      M.aluDark,
    );
    add(
      g,
      merge(knurl(THREE, { count: 48, r: 2.58, y: 0, h: 1.02, w: 0.095, depth: 0.06 })),
      M.aluDark,
      true,
    );
    /* 클릭 눈금 — 10클릭마다 한 칸 */
    add(
      g,
      merge(knurl(THREE, { count: 9, r: 2.62, y: 0.42, h: 0.24, w: 0.14, depth: 0.05 })),
      M.steel,
      true,
    );
  });

  /* 12 원두 받이 */
  makePart(byId.cup, (g) => {
    add(
      g,
      lathe(THREE, [
        [0.0, -3.1],
        [2.44, -3.1],
        [2.62, -2.9],
        [2.62, 2.78],
        [2.62, 3.1],
        [2.38, 3.1],
        [2.38, 2.78],
        [2.38, -2.72],
        [2.24, -2.62],
        [0.0, -2.62],
      ]),
      M.alu,
    );
    add(
      g,
      merge(knurl(THREE, { count: 56, r: 2.6, y: -0.9, h: 2.2, w: 0.085, depth: 0.055 })),
      M.aluDark,
      true,
    );
    /* 물리는 나사산 두 줄 */
    add(
      g,
      lathe(THREE, [
        [2.38, 2.3],
        [2.46, 2.38],
        [2.38, 2.46],
        [2.38, 2.3],
      ]),
      M.aluDark,
    );
  });

  return {
    root,
    parts,
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

/**
 * CAD 아웃라인. 이게 없으면 그냥 3D 렌더로 보이고, 있으면 도면으로 읽힌다.
 * 임계각을 크게 잡아 회전체의 실루엣 링만 남긴다 — 96분할 원통의 세로선이
 * 전부 살아나면 철망처럼 보인다.
 */
export function addOutlines(THREE: T, built: Built, color: number, opacity: number) {
  /* 선택 시 한 부품의 선만 살리려면 재질이 부품마다 따로 있어야 한다 */
  const materials = {} as Record<PartId, THREE_NS.LineBasicMaterial>;
  const created: THREE_NS.LineSegments[] = [];

  for (const p of Object.values(built.parts)) {
    const lineMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    materials[p.id] = lineMat;
    for (const mesh of p.meshes) {
      if (mesh.userData.noOutline) continue;
      const eg = new THREE.EdgesGeometry(mesh.geometry, 24);
      const ls = new THREE.LineSegments(eg, lineMat);
      ls.userData.outline = true;
      ls.renderOrder = 3;
      mesh.add(ls);
      created.push(ls);
    }
  }

  return {
    materials,
    dispose() {
      created.forEach((l) => l.geometry.dispose());
      Object.values(materials).forEach((m) => m.dispose());
    },
  };
}
