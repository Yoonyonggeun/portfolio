import type { AssetKey } from "./assets";

/*
 * 가상의 영화제 데이터. 표기 관례는 실제 한국 단편영화제(전주·부천·서울독립 등)의
 * 것을 따랐다: 부문 / 감독 / 제작국가 / 제작연도 / 러닝타임 / 관람등급 / 자막,
 * 단편은 낱개가 아니라 '상영 프로그램'으로 묶여 회차별로 걸리고, 일부 회차에만
 * GV(관객과의 대화)가 붙는다.
 */

export const FESTIVAL = {
  edition: "제3회",
  nameKo: "서울 국제 심야 단편영화제",
  nameEn: "Seoul International Nocturne Short Film Festival",
  short: "NOKTURN",
  dates: "2026. 11. 13 (금) — 11. 16 (월)",
  window: "22:00 — 04:00",
  tagline: "해가 진 뒤에만 상영합니다.",
  lead:
    "상영은 밤 10시에 시작해 새벽 4시에 끝납니다. 나흘 동안 네 나라의 단편 여섯 편을 세 곳의 극장에서 겁니다. 첫차가 다닐 때까지 아무도 집에 가지 않습니다.",
  // 시계는 실시간으로 이 시각까지 카운트다운한다.
  opensAt: "2026-11-13T22:00:00+09:00",
} as const;

export type Rating = "전체관람가" | "12세이상관람가" | "15세이상관람가" | "청소년관람불가";
export type Section = "국제경쟁" | "심야극장" | "한국단편" | "실험·확장";

export type Film = {
  id: string;
  no: string;
  titleKo: string;
  titleEn: string;
  director: string;
  country: string;
  year: number;
  runtime: number;
  section: Section;
  genre: string;
  rating: Rating;
  subtitle: string;
  /** 한 줄 소개 — 카드 뒷면과 상세에 쓴다. */
  logline: string;
  note: string;
  poster: AssetKey;
  /** 12초 프리뷰. 있는 작품만 카드 호버에서 재생된다. */
  clip?: AssetKey;
  badge?: "개막작" | "폐막작" | "화제작";
  accent: string;
};

export const FILMS: Film[] = [
  {
    id: "lastcar",
    no: "01",
    titleKo: "막차",
    titleEn: "The Last Train",
    director: "서지완",
    country: "한국",
    year: 2026,
    runtime: 19,
    section: "한국단편",
    genre: "드라마",
    rating: "15세이상관람가",
    subtitle: "한국어 대사, 영어 자막",
    logline: "청소 용역 김순자 씨는 매일 마지막 지하철에서 스무 정거장을 잔다.",
    note:
      "카메라는 한 번도 움직이지 않는다. 대신 창밖의 터널 조명이 20분 동안 그녀의 얼굴 위를 지나간다. 감독은 이 영화를 '앉은 채로 꾸는 꿈'이라고 불렀다.",
    poster: "poster-lastcar",
    clip: "clip-lastcar",
    badge: "개막작",
    accent: "#8fb9a8",
  },
  {
    id: "noise",
    no: "02",
    titleKo: "소음의 방",
    titleEn: "Room Tone",
    director: "이시가키 하루",
    country: "일본",
    year: 2025,
    runtime: 23,
    section: "심야극장",
    genre: "호러",
    rating: "청소년관람불가",
    subtitle: "일본어 대사, 한국어·영어 자막",
    logline: "옆방에서 나는 소리를 3년 동안 녹음해 온 남자가, 마침내 그 방의 문을 연다.",
    note:
      "23분 중 실제로 무언가가 일어나는 시간은 40초뿐이다. 나머지는 전부 기다림이다. 지난해 부천에서 상영 도중 세 명이 퇴장했다.",
    poster: "poster-noise",
    clip: "clip-noise",
    accent: "#c8443c",
  },
  {
    id: "hanoi",
    no: "03",
    titleKo: "하노이 04:00",
    titleEn: "Hanoi 04:00",
    director: "쩐 미 린",
    country: "베트남 · 프랑스",
    year: 2026,
    runtime: 16,
    section: "국제경쟁",
    genre: "다큐멘터리",
    rating: "12세이상관람가",
    subtitle: "베트남어 대사, 한국어·영어 자막",
    logline: "새벽 4시, 쌀국수 국물이 끓기 시작하면 도시의 하루가 두 번째로 시작된다.",
    note:
      "16mm 필름 세 롤로 찍었다. 감독은 같은 교차로에서 마흔한 번의 새벽을 찍은 뒤 그중 하루만 남겼다.",
    poster: "poster-hanoi",
    accent: "#3f9c9c",
  },
  {
    id: "dog",
    no: "04",
    titleKo: "고요한 개",
    titleEn: "A Quiet Dog",
    director: "시그룬 올라프스도티르",
    country: "아이슬란드",
    year: 2025,
    runtime: 11,
    section: "실험·확장",
    genre: "실험",
    rating: "전체관람가",
    subtitle: "대사 없음",
    logline: "개 한 마리가 용암 벌판 위에 서 있다. 11분 동안 아무 일도 일어나지 않는다.",
    note:
      "단 한 컷. 흑백 16mm. 필름이 다 돌아가면 영화가 끝난다. 이 작품은 상영 중 퇴장을 권장하지 않는다 — 마지막 40초를 보지 않으면 아무것도 본 것이 아니다.",
    poster: "poster-dog",
    accent: "#9aa0a6",
  },
  {
    id: "neon",
    no: "05",
    titleKo: "네온 헤븐",
    titleEn: "Neon Heaven",
    director: "베아트리스 하말류",
    country: "브라질",
    year: 2026,
    runtime: 14,
    section: "국제경쟁",
    genre: "뮤지컬",
    rating: "15세이상관람가",
    subtitle: "포르투갈어 대사, 한국어·영어 자막",
    logline: "상파울루의 옥상에서, 해고당한 여섯 명이 밤새 춤을 춘다.",
    note:
      "14분 전체가 한 곡이다. 컷은 세 번뿐. 나머지는 전부 카메라가 춤추는 사람을 따라다닌다.",
    poster: "poster-neon",
    clip: "clip-neon",
    badge: "화제작",
    accent: "#d94fa0",
  },
  {
    id: "summer",
    no: "06",
    titleKo: "여름의 잔해",
    titleEn: "Debris of Summer",
    director: "카미유 베르티에",
    country: "프랑스",
    year: 2025,
    runtime: 21,
    section: "국제경쟁",
    genre: "드라마",
    rating: "12세이상관람가",
    subtitle: "프랑스어 대사, 한국어·영어 자막",
    logline: "여름이 끝나기 이틀 전, 두 사람은 차 지붕 위에서 라디오 주파수를 맞춘다.",
    note:
      "유통기한이 12년 지난 슈퍼8 필름으로 찍었다. 화면에 번지는 얼룩은 후보정이 아니라 실제로 감광유제가 상한 자국이다.",
    poster: "poster-summer",
    badge: "폐막작",
    accent: "#d8a26a",
  },
];

export const SECTIONS: Section[] = ["국제경쟁", "심야극장", "한국단편", "실험·확장"];

/* ── 상영 프로그램 ─────────────────────────────────────────────
 * 단편은 낱개로 걸리지 않는다. 두세 편을 묶어 한 회차로 상영한다.
 */
export type Programme = {
  id: string;
  code: string;
  title: string;
  films: string[];
  runtime: number;
};

export const PROGRAMMES: Programme[] = [
  { id: "P1", code: "심야 1", title: "잠들지 못하는 도시", films: ["lastcar", "hanoi"], runtime: 35 },
  { id: "P2", code: "심야 2", title: "문 뒤의 소리", films: ["noise", "dog"], runtime: 34 },
  { id: "P3", code: "심야 3", title: "춤추는 밤", films: ["neon", "summer"], runtime: 35 },
];

export type Venue = {
  id: string;
  name: string;
  hall: string;
  address: string;
  seats: number;
  note: string;
  still: AssetKey;
};

export const VENUES: Venue[] = [
  {
    id: "V1",
    name: "노크턴 극장",
    hall: "1관",
    address: "서울 중구 을지로 14길",
    seats: 88,
    note: "1974년에 문을 연 단관극장. 필름 영사기가 아직 돌아간다. 좌석은 전부 원형 그대로다.",
    still: "still-hall",
  },
  {
    id: "V2",
    name: "충무로 아카이브",
    hall: "지하 2관",
    address: "서울 중구 충무로 3가",
    seats: 42,
    note: "필름 보관고를 개조한 42석짜리 소극장. 온도가 낮으니 겉옷을 챙겨 오시길 권합니다.",
    still: "still-proj",
  },
  {
    id: "V3",
    name: "옥상 스크리닝",
    hall: "루프탑",
    address: "서울 중구 을지로 3가 · 8층 옥상",
    seats: 120,
    note: "야외 상영. 우천 시 노크턴 극장 1관으로 대체 상영합니다. 담요는 현장에서 빌려드립니다.",
    still: "still-roof",
  },
];

/* ── 상영 시간표 ───────────────────────────────────────────────
 * start는 22:00 기준 경과 분. 시간표는 22:00~04:00(360분)을 가로축으로 그린다.
 */
export type Screening = {
  day: number;
  venue: string;
  programme: string;
  start: number;
  round: number;
  gv?: boolean;
  soldOut?: boolean;
};

export const DAYS = [
  { n: 1, label: "11.13", dow: "금", tag: "개막" },
  { n: 2, label: "11.14", dow: "토", tag: "" },
  { n: 3, label: "11.15", dow: "일", tag: "" },
  { n: 4, label: "11.16", dow: "월", tag: "폐막" },
];

export const TIMELINE_START = 22 * 60; // 22:00
export const TIMELINE_MINUTES = 360; // 06시간

export const SCREENINGS: Screening[] = [
  { day: 1, venue: "V1", programme: "P1", start: 0, round: 1, gv: true, soldOut: true },
  { day: 1, venue: "V1", programme: "P2", start: 130, round: 2 },
  { day: 1, venue: "V2", programme: "P3", start: 40, round: 1 },
  { day: 1, venue: "V3", programme: "P1", start: 90, round: 2 },

  { day: 2, venue: "V1", programme: "P3", start: 0, round: 1, soldOut: true },
  { day: 2, venue: "V1", programme: "P1", start: 120, round: 3 },
  { day: 2, venue: "V1", programme: "P2", start: 240, round: 3, gv: true },
  { day: 2, venue: "V2", programme: "P2", start: 60, round: 2 },
  { day: 2, venue: "V3", programme: "P3", start: 30, round: 2 },

  { day: 3, venue: "V1", programme: "P2", start: 20, round: 4 },
  { day: 3, venue: "V1", programme: "P3", start: 150, round: 4, gv: true },
  { day: 3, venue: "V2", programme: "P1", start: 0, round: 4, soldOut: true },
  { day: 3, venue: "V2", programme: "P3", start: 110, round: 5 },
  { day: 3, venue: "V3", programme: "P2", start: 70, round: 5 },

  { day: 4, venue: "V1", programme: "P1", start: 0, round: 5 },
  { day: 4, venue: "V1", programme: "P3", start: 110, round: 6, gv: true },
  { day: 4, venue: "V2", programme: "P2", start: 45, round: 6 },
  { day: 4, venue: "V3", programme: "P1", start: 150, round: 6 },
];

export type Pass = {
  id: string;
  name: string;
  price: string;
  unit: string;
  perks: string[];
  note: string;
  featured?: boolean;
};

export const PASSES: Pass[] = [
  {
    id: "single",
    name: "1회차 관람권",
    price: "7,000",
    unit: "원 / 1회차",
    perks: ["상영 프로그램 1회차", "당일 현장 발권 가능"],
    note: "회차별 잔여석은 상영 시작 30분 전부터 현장에서 판매합니다.",
  },
  {
    id: "night",
    name: "올나잇 패스",
    price: "18,000",
    unit: "원 / 1일",
    perks: ["당일 전 회차 관람", "극장 간 이동 가능", "새벽 라면 1회 교환권"],
    note: "가장 많이 팔리는 권종입니다. 22시부터 04시까지 세 극장을 자유롭게 오갈 수 있습니다.",
    featured: true,
  },
  {
    id: "full",
    name: "나흘치 배지",
    price: "52,000",
    unit: "원 / 4일",
    perks: ["전 회차 관람", "GV 우선 입장", "폐막식 초청", "도록 1부"],
    note: "선착순 200매. 배지는 개막 당일 노크턴 극장 매표소에서 수령합니다.",
  },
];

/* 스크롤에 맞춰 한 장씩 넘어가는 프로그램 노트. */
export const NOTES = [
  {
    kicker: "01 — 왜 밤인가",
    title: "밤에 보는 영화는 다른 영화다",
    body:
      "같은 필름도 오후 2시와 새벽 2시에 다르게 보입니다. 피로한 눈은 방어를 덜 합니다. 우리는 그 상태를 노리고 상영표를 짰습니다.",
  },
  {
    kicker: "02 — 왜 단편인가",
    title: "11분짜리 영화에는 도망칠 곳이 없다",
    body:
      "장편은 지루한 20분을 견디게 할 수 있습니다. 단편은 그럴 수 없습니다. 올해 여섯 편은 전부 첫 30초에 승부를 겁니다.",
  },
  {
    kicker: "03 — 상영 원칙",
    title: "중간 입장은 받지 않습니다",
    body:
      "상영이 시작되면 문을 잠급니다. 11분짜리 영화에 3분 늦게 들어오는 것은 그 영화를 보지 않은 것과 같습니다. 대신 다음 회차 좌석을 드립니다.",
  },
  {
    kicker: "04 — 끝나고 나서",
    title: "첫차까지 로비를 엽니다",
    body:
      "04시에 마지막 상영이 끝나면 05시 반 첫차까지 1관 로비에 앉아 계셔도 됩니다. 커피와 라면을 팝니다. 대부분의 이야기는 거기서 나옵니다.",
  },
];
