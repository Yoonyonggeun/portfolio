#!/usr/bin/env node
/*
 * NOKTURN 에셋을 저장소 안으로 가져온다.
 *
 *   npm run assets
 *
 * 받아오는 파일은 이미 웹용으로 인코딩된 것들이라(포스터 6장 합계 125KB,
 * 15초 히어로 485KB) 별도 변환 도구가 필요 없다. 받고 나면
 * src/pages/nokturn/media/ 안에 들어가고, assets.ts의 import.meta.glob이
 * 자동으로 CDN 대신 로컬 번들을 쓴다 — 코드는 한 줄도 안 바뀐다.
 *
 * 되돌리려면 media/ 안의 파일만 지우면 된다.
 */
import { mkdir, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OPT = "https://d2ol7oe51mr4n9.cloudfront.net/user_3EWnZzTSAsTHSEPmy7uQdn8lIfH/";
const RAW = "https://d8j0ntlcm91z4.cloudfront.net/user_3EWnZzTSAsTHSEPmy7uQdn8lIfH/";

/* assets.ts의 REMOTE와 키가 1:1로 대응해야 한다. */
const FILES = {
  "poster-lastcar.webp": `${OPT}0daa784d-9d88-41de-82e1-a66bd756b2f1.webp`,
  "poster-noise.webp": `${OPT}2cfb5cc3-82cf-4df3-966f-42f31c9a4fc6.webp`,
  "poster-hanoi.webp": `${OPT}984743f3-10d3-41a1-8173-01994b788665.webp`,
  "poster-dog.webp": `${OPT}19a4c7a0-459b-4227-a063-d618b7c5555b.webp`,
  "poster-neon.webp": `${OPT}d9e18e14-ef8d-43e4-bf3c-5562f8afe5f8.webp`,
  "poster-summer.webp": `${OPT}5e21cae1-ea20-4aee-92df-18906d12b2c4.webp`,

  "still-hall.webp": `${RAW}hf_20260801_115011_62c9c1f8-7c86-4c13-89ba-b6bda9957b97_min.webp`,
  "still-roof.webp": `${RAW}hf_20260801_112444_6884da88-331a-46a2-88e1-f7cd2ce63546_min.webp`,
  "still-dawn.webp": `${RAW}hf_20260801_112448_b9c2f898-3084-4a75-b4cc-2994fe106115_min.webp`,
  "still-proj.webp": `${RAW}hf_20260801_112450_08b28ebb-8f9c-4209-aada-d99badf4c191_min.webp`,

  "film-hero.mp4": `${OPT}8249c28c-4c96-41d7-a6f2-4118b7fc5ee0.mp4`,
  "clip-lastcar.mp4": `${OPT}7e575d9b-bee8-4a78-87aa-15da8e536315.mp4`,
  "clip-noise.mp4": `${OPT}174f0903-87cc-423d-b158-9dbf56bdcf14.mp4`,
  "clip-neon.mp4": `${OPT}8710c7ae-6d32-41c5-ac11-a9e722490e54.mp4`,
};

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "src", "pages", "nokturn", "media");

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

async function main() {
  await mkdir(outDir, { recursive: true });

  const existing = new Set(await readdir(outDir).catch(() => []));
  const force = process.argv.includes("--force");

  let total = 0;
  let fetched = 0;

  for (const [name, url] of Object.entries(FILES)) {
    if (existing.has(name) && !force) {
      console.log(`  skip   ${name}  (이미 있음 — 다시 받으려면 --force)`);
      continue;
    }
    process.stdout.write(`  fetch  ${name} … `);
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`실패 (HTTP ${res.status})`);
      process.exitCode = 1;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(outDir, name), buf);
    total += buf.byteLength;
    fetched += 1;
    console.log(kb(buf.byteLength));
  }

  console.log(
    fetched
      ? `\n${fetched}개 파일, 합계 ${kb(total)} → src/pages/nokturn/media/\n다음 빌드부터 CDN 대신 로컬 번들을 씁니다.`
      : "\n받을 파일이 없습니다.",
  );
}

main().catch((err) => {
  console.error("\n에셋을 받지 못했습니다:", err.message);
  console.error("네트워크가 CDN을 막고 있다면 CDN 참조 그대로도 사이트는 동작합니다.");
  process.exit(1);
});
