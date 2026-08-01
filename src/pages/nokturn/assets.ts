/*
 * 에셋 해결 순서: 로컬 번들 → 원격 CDN.
 *
 * `src/pages/nokturn/media/` 안에 파일이 있으면 Vite가 번들에 넣고 그 URL을 쓴다.
 * 비어 있으면 CDN을 그대로 참조한다. 즉 `npm run assets` 한 번만 돌리면 저장소가
 * 완전히 자급자족하게 되고, 안 돌려도 배포본은 정상 동작한다. 코드는 그대로다.
 *
 * CDN에 올라간 파일은 원본이 아니라 웹용으로 다시 인코딩한 것이다
 * (히어로 15초 영상 24MB → 485KB, 포스터 6장 합계 125KB).
 */

const OPT = "https://d2ol7oe51mr4n9.cloudfront.net/user_3EWnZzTSAsTHSEPmy7uQdn8lIfH/";
const RAW = "https://d8j0ntlcm91z4.cloudfront.net/user_3EWnZzTSAsTHSEPmy7uQdn8lIfH/";

export const REMOTE = {
  // 라인업 포스터 (2:3, 620×930 webp)
  "poster-lastcar": `${OPT}0daa784d-9d88-41de-82e1-a66bd756b2f1.webp`,
  "poster-noise": `${OPT}2cfb5cc3-82cf-4df3-966f-42f31c9a4fc6.webp`,
  "poster-hanoi": `${OPT}984743f3-10d3-41a1-8173-01994b788665.webp`,
  "poster-dog": `${OPT}19a4c7a0-459b-4227-a063-d618b7c5555b.webp`,
  "poster-neon": `${OPT}d9e18e14-ef8d-43e4-bf3c-5562f8afe5f8.webp`,
  "poster-summer": `${OPT}5e21cae1-ea20-4aee-92df-18906d12b2c4.webp`,

  // 지면 이미지 (16:9)
  "still-hall": `${RAW}hf_20260801_115011_62c9c1f8-7c86-4c13-89ba-b6bda9957b97_min.webp`,
  "still-roof": `${RAW}hf_20260801_112444_6884da88-331a-46a2-88e1-f7cd2ce63546_min.webp`,
  "still-dawn": `${RAW}hf_20260801_112448_b9c2f898-3084-4a75-b4cc-2994fe106115_min.webp`,
  "still-proj": `${RAW}hf_20260801_112450_08b28ebb-8f9c-4209-aada-d99badf4c191_min.webp`,

  // 필름 (15초 히어로 + 12초 프리뷰)
  "film-hero": `${OPT}8249c28c-4c96-41d7-a6f2-4118b7fc5ee0.mp4`,
  "clip-lastcar": `${OPT}7e575d9b-bee8-4a78-87aa-15da8e536315.mp4`,
  "clip-noise": `${OPT}174f0903-87cc-423d-b158-9dbf56bdcf14.mp4`,
  "clip-neon": `${OPT}8710c7ae-6d32-41c5-ac11-a9e722490e54.mp4`,
} as const;

export type AssetKey = keyof typeof REMOTE;

/* eager:true + query:'?url' → 파일이 있으면 빌드 타임에 URL로 치환된다. */
const bundled = import.meta.glob("./media/*.{webp,mp4,jpg,png}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const local: Record<string, string> = {};
for (const [path, url] of Object.entries(bundled)) {
  const name = path.split("/").pop()?.replace(/\.[^.]+$/, "");
  if (name) local[name] = url;
}

export function asset(key: AssetKey): string {
  return local[key] ?? REMOTE[key];
}

/** 로컬 파일이 하나라도 있으면 true — README/푸터에서 자급자족 여부를 표시할 때 쓴다. */
export const selfHosted = Object.keys(local).length > 0;
