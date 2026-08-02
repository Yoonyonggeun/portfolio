/*
 * 중쇠 48 / JUNGSOE 48 — 수동 커피 그라인더 (11)
 *
 * 이름은 지어낸 말이 아니다. 표준국어대사전 '중쇠':
 *   맷돌의 위짝과 아래짝 한가운데 박는 쇠. 위짝의 것은 암쇠라 하여 구멍이
 *   뚫리고 아래짝은 수쇠라 하여 뾰족한데, 두 짝을 맞추면 위짝을 돌려도
 *   빠지지 않는다.
 *
 * 코니컬 버 그라인더가 정확히 이 구조라서 부품 이름을 새로 지을 필요가
 * 없었다 — 뾰족한 수쇠가 원뿔 버, 구멍 뚫린 암쇠가 링 버, 둘의 중심을
 * 잡아 주는 축이 중쇠다. 핸드밀의 1번 셀링포인트(축 흔들림)가 제품명
 * 안에 이미 들어 있다.
 *
 * 좌표계: Y가 조립축, 단위는 mm/10 (본체 외경 Ø52.4 → 반지름 2.62).
 * 조립 위치와 분해 벡터를 여기서 한 번만 정의하고 지오메트리·지시선·
 * 부품표가 전부 이 표를 읽는다.
 */

export type Vec3 = [number, number, number];

export type PartId =
  | "knob"
  | "crank"
  | "cap"
  | "bearingTop"
  | "shaft"
  | "body"
  | "ringBurr"
  | "coneBurr"
  | "bearingBot"
  | "spring"
  | "dial"
  | "cup";

export type Part = {
  id: PartId;
  /** 부품 번호. 도면 풍선(balloon)에 그대로 찍힌다. */
  no: string;
  ko: string;
  en: string;
  /** 재질·규격 한 줄. 부품표의 오른쪽 열. */
  spec: string;
  /** 이 부품이 왜 거기 있는지. 두 문장 넘기지 않는다. */
  note: string;
  /** 지시선이 붙는 쪽. 좌우를 미리 못 박아야 라벨이 안 겹친다. */
  side: "L" | "R";
  /** 조립 상태의 중심 좌표 */
  at: Vec3;
  /** t=1일 때 더해지는 분해 벡터 */
  explode: Vec3;
  /*
   * 지시선이 출발하는 점. 고정 좌표로 박으면 안 된다 — 모델을 돌리는 순간
   * 앵커가 라벨 반대쪽 면으로 넘어가 선이 모델을 가로지른다. 그래서 반지름과
   * 높이만 적고, 좌우 방향은 매 프레임 카메라 기준으로 정한다.
   */
  /** 부품 로컬 X (크랭크처럼 축에서 벗어난 부품만 쓴다) */
  anchorX: number;
  /** 라벨 쪽으로 밀어낼 반지름 */
  anchorR: number;
  anchorY: number;
};

/*
 * 순서 = 분해 시 위에서 아래로 읽는 순서. 부품표도 이 순서를 따른다.
 *
 * 중쇠(shaft)와 본체(body)만 축에서 벗어나 좌우로 빠진다. 둘 다 길이가
 * 9 이상이라 축 위에 세우면 서로를 관통해 버린다 — 긴 핀과 하우징을
 * 옆으로 빼는 건 실제 분해도의 관용구이기도 하다.
 */
export const PARTS: Part[] = [
  {
    id: "knob",
    no: "01",
    ko: "핸들 노브",
    en: "HANDLE KNOB",
    spec: "월넛 원목 · Ø17",
    note: "손가락 두 마디가 걸리는 배럴형. 금속 노브는 겨울에 차갑고 땀에 미끄러진다.",
    side: "R",
    at: [5.4, 13.4, 0],
    explode: [2.2, 10.5, 0],
    anchorX: 0,
    anchorR: 0.86,
    anchorY: 0.6,
  },
  {
    id: "crank",
    no: "02",
    ko: "크랭크 암",
    en: "CRANK ARM",
    spec: "STS304 · 유효 반경 54",
    note: "반경이 길수록 토크가 붙지만 가방에 안 들어간다. 54mm가 그 경계다.",
    side: "R",
    at: [0, 12.9, 0],
    explode: [0, 8.6, 0],
    anchorX: 3.4,
    anchorR: 0.3,
    anchorY: 0.2,
  },
  {
    id: "cap",
    no: "03",
    ko: "상부 캡",
    en: "TOP CAP",
    spec: "AL6061-T6 아노다이즈드",
    note: "축을 위에서 눌러 잡는다. 여기가 헐거우면 아래 베어링 두 개가 있어도 소용없다.",
    side: "R",
    at: [0, 11.78, 0],
    explode: [0, 6.6, 0],
    anchorX: 0,
    anchorR: 1.44,
    anchorY: 0.35,
  },
  {
    id: "bearingTop",
    no: "04",
    ko: "상부 베어링",
    en: "UPPER BEARING",
    spec: "686ZZ · Ø6 × Ø13 × 5",
    note: "축의 윗점을 잡는다. 아래 베어링과 76mm 떨어져 있어 지렛대가 길다.",
    side: "R",
    at: [0, 10.82, 0],
    explode: [0, 4.8, 0],
    anchorX: 0,
    anchorR: 1.0,
    anchorY: 0.2,
  },
  {
    id: "shaft",
    no: "05",
    ko: "중쇠 (주축)",
    en: "CENTER SHAFT",
    spec: "STS304 · Ø6 h7 연마",
    note: "이 페이지의 이름값. 위아래 두 점으로 잡혀 있어 원뿔 버가 돌아도 원의 중심이 안 흔들린다.",
    side: "R",
    at: [0, 7.4, 0],
    explode: [6.6, 2.2, 0],
    anchorX: 0,
    anchorR: 0.3,
    anchorY: 3.6,
  },
  {
    id: "body",
    no: "06",
    ko: "그라인드 챔버",
    en: "GRIND CHAMBER",
    spec: "AL6061-T6 · 두께 2.4",
    note: "링 버를 물고 있는 통. 벽이 얇으면 버가 미세하게 벌어져 굵기가 흔들린다.",
    side: "L",
    at: [0, 6.6, 0],
    explode: [-6.8, 2.6, 0],
    anchorX: 0,
    anchorR: 2.7,
    anchorY: 2.8,
  },
  {
    id: "ringBurr",
    no: "07",
    ko: "암쇠 · 링 버",
    en: "RING BURR",
    spec: "Ø48 · STS420J2 / HRC58",
    note: "구멍이 뚫린 쪽. 챔버에 고정되어 돌지 않는다. 안쪽 면이 원뿔로 파여 있다.",
    side: "L",
    at: [0, 5.45, 0],
    explode: [0, 5.6, 0],
    anchorX: 0,
    anchorR: 2.5,
    anchorY: 0.9,
  },
  {
    id: "coneBurr",
    no: "08",
    ko: "수쇠 · 코니컬 버",
    en: "CONE BURR",
    spec: "Ø48 · STS420J2 / HRC58",
    note: "뾰족한 쪽. 축에 물려 돌아간다. 원두는 잘리는 게 아니라 두 면 사이에서 부서진다.",
    side: "L",
    at: [0, 5.45, 0],
    explode: [0, 0.6, 0],
    anchorX: 0,
    anchorR: 2.3,
    anchorY: -1.0,
  },
  {
    id: "bearingBot",
    no: "09",
    ko: "하부 베어링",
    en: "LOWER BEARING",
    spec: "685ZZ · Ø5 × Ø11 × 5",
    note: "버 바로 아래를 잡는다. 하중이 걸리는 지점과 지지점 사이가 짧을수록 흔들림이 준다.",
    side: "L",
    at: [0, 3.22, 0],
    explode: [0, -1.4, 0],
    anchorX: 0,
    anchorR: 0.9,
    anchorY: -0.2,
  },
  {
    id: "spring",
    no: "10",
    ko: "예압 스프링",
    en: "PRELOAD SPRING",
    spec: "SUS304 WPB · 4.2N",
    note: "축을 위로 밀어 유격을 없앤다. 이게 없으면 클릭 값과 실제 간극이 어긋난다.",
    side: "L",
    at: [0, 2.5, 0],
    explode: [0, -3.0, 0],
    anchorX: 0,
    anchorR: 0.62,
    anchorY: 0.1,
  },
  {
    id: "dial",
    no: "11",
    ko: "클릭 다이얼",
    en: "ADJUSTMENT DIAL",
    spec: "90클릭 · 1클릭 = 25μm",
    note: "돌리면 축이 오르내려 두 버 사이가 벌어진다. 손끝으로 세는 값이 곧 마이크론이다.",
    side: "L",
    at: [0, 1.25, 0],
    explode: [0, -5.0, 0],
    anchorX: 0,
    anchorR: 2.6,
    anchorY: 0.1,
  },
  {
    id: "cup",
    no: "12",
    ko: "원두 받이",
    en: "CATCH CUP",
    spec: "AL6061-T6 · 30g",
    note: "나사산 두 줄로 물린다. 한 바퀴 반이면 열리고, 그대로 계량컵이 된다.",
    side: "L",
    at: [0, -2.5, 0],
    explode: [0, -9.4, 0],
    anchorX: 0,
    anchorR: 2.62,
    anchorY: -1.6,
  },
];

export const PART_BY_ID = Object.fromEntries(
  PARTS.map((p) => [p.id, p]),
) as Record<PartId, Part>;

/* ── 표준 투상 뷰 ────────────────────────────────────────────
 * 실제 도면이 쓰는 세 장이다. 자유 회전은 드래그로 따로 열려 있고,
 * 이 버튼들은 그 각도를 정확한 값으로 되돌린다.
 */
export type ViewId = "iso" | "front" | "under";

/*
 * 평면도는 넣지 않았다. 동축 조립체를 위에서 보면 원이 겹칠 뿐 아무것도
 * 안 보인다. 대신 앙각을 넣었다 — 암쇠의 안쪽 이는 이 각도에서만 드러난다.
 */
export const VIEWS: {
  id: ViewId;
  label: string;
  en: string;
  az: number;
  el: number;
}[] = [
  { id: "iso", label: "등각", en: "ISO", az: -0.62, el: 0.26 },
  { id: "front", label: "정면", en: "FRONT", az: 0, el: 0.02 },
  { id: "under", label: "앙각", en: "UNDERSIDE", az: -0.62, el: -0.44 },
];

/* ── 클릭 다이얼 ─────────────────────────────────────────────
 * 1클릭 25μm는 실제 코니컬 핸드밀이 쓰는 해상도대다. 여기서는 이 값이
 * 표시용 숫자로 끝나지 않고 3D의 버 간극을 실제로 벌린다.
 */
export const CLICK_UM = 25;
export const CLICK_MAX = 90;

export const BREWS: {
  id: string;
  label: string;
  clicks: number;
  grind: string;
}[] = [
  { id: "espresso", label: "에스프레소", clicks: 8, grind: "가장 곱게" },
  { id: "moka", label: "모카포트", clicks: 18, grind: "고운 모래" },
  { id: "v60", label: "핸드드립 V60", clicks: 32, grind: "굵은 설탕" },
  { id: "press", label: "프렌치프레스", clicks: 52, grind: "굵은 소금" },
  { id: "cold", label: "콜드브루", clicks: 72, grind: "거친 자갈" },
];

/* ── 사양 ───────────────────────────────────────────────────── */
export const SPEC_GROUPS: { title: string; rows: [string, string][] }[] = [
  {
    title: "분쇄부",
    rows: [
      ["버 형식", "코니컬 · 수쇠/암쇠 한 쌍"],
      ["버 지름", "Ø48"],
      ["버 재질", "STS420J2 열처리 HRC58"],
      ["조절 해상도", "90클릭 · 1클릭 25μm"],
      ["조절 범위", "0 – 2,250μm"],
    ],
  },
  {
    title: "구동부",
    rows: [
      ["주축", "STS304 Ø6 h7 연마"],
      ["베어링", "볼베어링 2점 (686ZZ / 685ZZ)"],
      ["지지 간격", "76mm"],
      ["크랭크 반경", "54mm"],
    ],
  },
  {
    title: "본체",
    rows: [
      ["재질", "AL6061-T6 아노다이즈드"],
      ["외경 × 높이", "Ø52.4 × 178mm"],
      ["무게", "512g"],
      ["1회 용량", "원두 30g"],
      ["체결", "2줄 나사 · 1.5회전"],
    ],
  },
];

/* ── 제작 회계 ───────────────────────────────────────────────
 * 09에서 배운 대로 근거는 페이지 뒤에 둔다. 앞에 놓으면 강의가 되고
 * 뒤에 놓으면 근거가 된다.
 */
export const LEDGER: { k: string; v: string }[] = [
  { k: "분해도 에셋", v: "0KB — 12개 부품 전부 코드가 만든다" },
  { k: "실사 컷", v: "webp 4장 · 152KB" },
  { k: "3D 런타임", v: "three.js, 섹션이 가까워질 때만 로드" },
  { k: "지시선", v: "3D 좌표를 매 프레임 화면 좌표로 투영한 SVG" },
  { k: "단면", v: "클리핑 평면 + 스텐실 캡 — 잘린 면을 실제로 막는다" },
];
