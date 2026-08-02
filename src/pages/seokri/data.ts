/*
 * 석리 石理 / SEOKRI — 대형 포세린 슬래브 · 테라조 패널 (가상 브랜드)
 *
 * 이름은 '돌의 결'이라는 뜻이다. 이 페이지의 척추가 표면이 아니라 절단면인
 * 이유가 이름에 들어 있다 — 결은 겉이 아니라 속을 갈라야 보인다.
 *
 * 소재 사진은 넉 장뿐이다. 컬러웨이·마감·조명·줄눈은 전부 CSS로 파생한다.
 * 각도를 하나 더 찍는 순간 무늬 이음매가 컷마다 어긋나기 때문이다.
 * (여러 각도로 같은 소재를 찍는 것이 AI 이미지의 대표적 실패 지점이다.)
 */

export type Tone = "웜" | "뉴트럴" | "쿨";
export type Finish = "폴리시" | "허니드" | "그레인";

export type Material = {
  code: string;
  ko: string;
  en: string;
  /* 실제 촬영한 매크로 넉 장 중 어느 것을 바탕으로 쓰는지 */
  base: "sw-veined" | "sw-terrazzo" | "sw-grain" | "sw-bone";
  /* 컬러웨이 파생 — CSS filter 문자열. 사진을 더 찍지 않고 색을 만든다. */
  tint: string;
  finish: Finish;
  tone: Tone;
  /* 두께(mm) */
  gauge: number[];
  /* 관통무늬(풀바디)인가, 표면 프린트인가. 이 페이지의 분류 축 1번. */
  fullBody: boolean;
  size: string;
  note: string;
};

/* 4장의 매크로에서 12개 품목을 파생한다 — 컷은 늘지 않는다. */
export const MATERIALS: Material[] = [
  {
    code: "SK-101",
    ko: "백운",
    en: "BAEKUN",
    base: "sw-veined",
    tint: "none",
    finish: "허니드",
    tone: "뉴트럴",
    gauge: [12, 20],
    fullBody: true,
    size: "1200×2400",
    note: "결이 두께를 관통합니다. 모서리를 갈아도 흰 속이 드러나지 않습니다.",
  },
  {
    code: "SK-102",
    ko: "백운 · 담묵",
    en: "BAEKUN DAMMUK",
    base: "sw-veined",
    tint: "saturate(0.45) brightness(0.82) hue-rotate(-8deg)",
    finish: "허니드",
    tone: "쿨",
    gauge: [12],
    fullBody: true,
    size: "1200×2400",
    note: "같은 원석의 저채도 컬러웨이. 결의 밀도는 같고 명도만 내려갑니다.",
  },
  {
    code: "SK-103",
    ko: "백운 · 폴리시",
    en: "BAEKUN POLISHED",
    base: "sw-veined",
    tint: "contrast(1.18) saturate(1.1) brightness(1.04)",
    finish: "폴리시",
    tone: "뉴트럴",
    gauge: [12, 20],
    fullBody: true,
    size: "1200×2400 · 1600×3200",
    note: "연마하면 결의 대비가 올라갑니다. 반사가 생겨 조명 각도에 민감해집니다.",
  },
  {
    code: "SK-201",
    ko: "골재",
    en: "GOLJAE",
    base: "sw-terrazzo",
    tint: "none",
    finish: "폴리시",
    tone: "웜",
    gauge: [12, 20],
    fullBody: true,
    size: "1200×2400",
    note: "골재가 바디 전체에 박혀 있어 어느 면을 잘라도 같은 분포가 나옵니다.",
  },
  {
    code: "SK-202",
    ko: "골재 · 회",
    en: "GOLJAE HOE",
    base: "sw-terrazzo",
    tint: "saturate(0.3) brightness(0.92)",
    finish: "허니드",
    tone: "뉴트럴",
    gauge: [12],
    fullBody: true,
    size: "1200×2400",
    note: "매트릭스만 회색으로 바꾼 컬러웨이. 골재 색은 그대로입니다.",
  },
  {
    code: "SK-203",
    ko: "골재 · 홍",
    en: "GOLJAE HONG",
    base: "sw-terrazzo",
    tint: "saturate(1.35) hue-rotate(-10deg) brightness(1.02)",
    finish: "폴리시",
    tone: "웜",
    gauge: [12, 20],
    fullBody: true,
    size: "1200×2400",
    note: "산화철 안료를 더한 매트릭스. 테라코타 골재와 톤이 붙습니다.",
  },
  {
    code: "SK-301",
    ko: "현무",
    en: "HYEONMU",
    base: "sw-grain",
    tint: "none",
    finish: "그레인",
    tone: "쿨",
    gauge: [12, 20],
    fullBody: false,
    size: "1200×2400",
    note: "표면 프린트입니다. 요철이 깊어 저각 조명에서 질감이 가장 크게 변합니다.",
  },
  {
    code: "SK-302",
    ko: "현무 · 재",
    en: "HYEONMU JAE",
    base: "sw-grain",
    tint: "brightness(1.28) saturate(0.5)",
    finish: "그레인",
    tone: "뉴트럴",
    gauge: [12],
    fullBody: false,
    size: "1200×2400",
    note: "같은 요철에 밝은 유약을 얹은 컬러웨이.",
  },
  {
    code: "SK-303",
    ko: "현무 · 흑",
    en: "HYEONMU HEUK",
    base: "sw-grain",
    tint: "brightness(0.62) saturate(0.4)",
    finish: "그레인",
    tone: "쿨",
    gauge: [12, 20],
    fullBody: false,
    size: "1200×2400 · 1600×3200",
    note: "가장 어두운 컬러웨이. 줄눈색을 밝게 쓰면 격자가 도드라집니다.",
  },
  {
    code: "SK-401",
    ko: "골편",
    en: "GOLPYEON",
    base: "sw-bone",
    tint: "none",
    finish: "허니드",
    tone: "웜",
    gauge: [6, 12],
    fullBody: true,
    size: "1200×2400 · 1600×3200",
    note: "가장 조용한 면. 6mm 박판이 있어 벽면 덧방 시공에 씁니다.",
  },
  {
    code: "SK-402",
    ko: "골편 · 미",
    en: "GOLPYEON MI",
    base: "sw-bone",
    tint: "sepia(0.18) saturate(1.2) brightness(0.98)",
    finish: "허니드",
    tone: "웜",
    gauge: [6, 12],
    fullBody: true,
    size: "1200×2400",
    note: "한 단계 더 따뜻한 컬러웨이. 원목 마감과 붙였을 때의 기본값입니다.",
  },
  {
    code: "SK-403",
    ko: "골편 · 폴리시",
    en: "GOLPYEON POLISHED",
    base: "sw-bone",
    tint: "contrast(1.12) brightness(1.05)",
    finish: "폴리시",
    tone: "뉴트럴",
    gauge: [12],
    fullBody: true,
    size: "1200×2400",
    note: "연마 마감. 무늬가 옅어 반사만 남습니다.",
  },
];

/* 좌측 필터 파사드의 축. 드롭다운이 아니라 전부 펼쳐진 체크리스트다 —
   실측한 이 바닥의 공통 문법(축 3~5개, 축당 옵션 5~13개). */
export const FACETS = [
  { key: "finish", label: "마감", options: ["폴리시", "허니드", "그레인"] },
  { key: "tone", label: "톤", options: ["웜", "뉴트럴", "쿨"] },
  { key: "gauge", label: "두께", options: ["6", "12", "20"] },
  { key: "body", label: "무늬", options: ["관통무늬", "표면 프린트"] },
] as const;
export type FacetKey = (typeof FACETS)[number]["key"];

/* 색온도 4단. 그레이징 라이트 시뮬레이터의 두 번째 축이다. */
export const KELVIN = [
  { k: "3000K", label: "전구색", tint: "rgba(255,176,92,0.20)", warm: 1 },
  { k: "4000K", label: "주백색", tint: "rgba(255,214,168,0.10)", warm: 0.5 },
  { k: "5700K", label: "주광색", tint: "rgba(196,220,255,0.10)", warm: 0 },
  { k: "야간", label: "간접광", tint: "rgba(40,44,72,0.30)", warm: 0.2 },
] as const;

/* 배열. CSS repeat + gap으로 파생한다 — 사진을 찍지 않는다. */
export const BONDS = [
  { id: "stack", label: "스택본드", offset: 0 },
  { id: "running", label: "러닝본드", offset: 50 },
  { id: "third", label: "3분할", offset: 33.33 },
] as const;

export const GROUTS = [
  { id: "bone", label: "본화이트", hex: "#e6e0d5" },
  { id: "sand", label: "샌드", hex: "#c2b7a4" },
  { id: "char", label: "차콜", hex: "#4a463f" },
] as const;

/* 기술 정보. 이 업종 상세의 실측 항목 그대로 — 수치는 전부 DOM으로 얹는다. */
export const TECH = [
  { k: "흡수율", v: "≤ 0.05 %", std: "KS L 1001 / ISO 10545-3" },
  { k: "파괴하중", v: "≥ 1,300 N", std: "ISO 10545-4" },
  { k: "내마모도", v: "PEI IV", std: "ISO 10545-7" },
  { k: "동해저항", v: "합격", std: "ISO 10545-12" },
  { k: "미끄럼저항", v: "R10 (그레인 R11)", std: "DIN 51130" },
  { k: "내오염성", v: "Class 5", std: "ISO 10545-14" },
  { k: "열팽창계수", v: "6.5 × 10⁻⁶ /K", std: "ISO 10545-8" },
  { k: "휨강도", v: "≥ 38 N/mm²", std: "ISO 10545-4" },
];

export const DOWNLOADS = [
  { k: "2026 컬렉션 카탈로그", t: "PDF", s: "18.4 MB" },
  { k: "고해상 소재 이미지", t: "ZIP", s: "212 MB" },
  { k: "심리스 텍스처 (4K)", t: "ZIP", s: "96 MB" },
  { k: "시험성적서 일괄", t: "PDF", s: "4.1 MB" },
  { k: "시공 가이드", t: "PDF", s: "7.8 MB" },
  { k: "BIM · CAD 라이브러리", t: "ZIP", s: "31 MB" },
];
