# AI Product Film — Portfolio

AI 생성 에셋으로 만든 스크롤 필름 상세페이지·브랜드 사이트 포트폴리오.

- `/` 포트폴리오 메인
- `/work/nokturn` **NOKTURN** — 제3회 서울 국제 심야 단편영화제 (제품이 아닌 첫 작업)
- `/work/aurum` AURUM Calibre 04 (프레임 스크럽 + 3레이어 X-ray)
- `/work/klang` KLANG Pro (애플 제품 페이지 인터랙션 미믹)
- `/work/kontakt` KONTAKT ONE (7씬 스크롤 스크럽)
- `/work/umbra` UMBRA GLIDE 01 (3막 스크럽 + 3D 인스펙터)

## 로컬 실행

```bash
npm install
npm run dev
```

## NOKTURN — 인터랙션 라이브러리 스택

앞선 작업들이 직접 만든 CSS 트랜지션 위주였던 것과 달리, 이 페이지는 실제
애니메이션 라이브러리가 각자 잘하는 일을 하도록 짰다.

| 라이브러리 | 버전 | 하는 일 |
| --- | --- | --- |
| `gsap` / `ScrollTrigger` | 3.15 | 상영시간표 pin + scrub, 히어로 패럴랙스, 노트 진입 |
| `gsap/SplitText` | 3.15 | 히어로 제목 줄 단위 마스크 리빌 (`mask: "lines"`, `autoSplit`) |
| `gsap/Flip` | 3.15 | 부문 필터 전환 시 카드 그리드 재배치 |
| `@gsap/react` | 2.1 | `useGSAP()` — 스코프·정리·의존성 |
| `lenis` | 1.3 | 관성 스크롤 (gsap.ticker에 동기화) |
| `motion` | 12.4 | 상세 오버레이 스프링 + `AnimatePresence` |
| `embla-carousel-react` | 8.6 | 상영관 캐러셀 (+ wheel-gestures 플러그인) |
| View Transitions API | 네이티브 | 테마 전환 원형 확산 |

GSAP 3.13부터 SplitText·Flip을 포함한 전 플러그인이 무상 라이선스로 풀렸고
공개 npm 레지스트리에 올라와 있다 — 별도 계정 없이 설치된다.

### 눈여겨볼 장치

- **스크롤 = 시각.** 상영시간표 구역은 화면에 고정되고, 아래로 스크롤하면
  표가 가로로 밀리면서 시계가 22:00에서 04:00까지 흘러간다. 스크롤 동작과
  콘텐츠(밤의 길이)가 같은 축을 공유한다.
- **얼어붙는 이름 열.** 표를 밀어도 상영관 이름은 왼쪽에 남는다. transform이
  아니라 뷰포트의 native `scrollLeft`를 움직여서 CSS `position: sticky`가
  그대로 먹게 했다.
- **속도에 반응하는 마퀴.** 스크롤 방향이 바뀌면 마퀴도 뒤집히고, 빠르게
  스크롤할수록 빨라진다 (`ScrollTrigger.getVelocity()` → `timeScale`).
- **호버 프리뷰.** 포스터 위에서 12초 클립이 재생된다. 비디오는 포인터가
  올라온 뒤에야 로드한다(`preload="none"` + 지연 마운트).
- **테마.** 다크 = 심야(기본), 라이트 = 새벽. 토글을 누른 좌표에서 원이
  퍼지며 바뀐다. 첫 페인트 FOUC는 `index.html`의 인라인 스크립트가 막는다.
  NOKTURN은 방문자가 직접 고른 적이 없을 때만 심야로 연다 — 명시적 선택이
  언제나 이긴다.

전 구간 `prefers-reduced-motion`을 존중한다. 켜져 있으면 Lenis를 붙이지 않고,
pin·scrub·마퀴·호버 비디오를 끄고, 카드 메타는 처음부터 보이게 둔다.

## 에셋

NOKTURN의 이미지·영상은 기본적으로 CDN을 참조한다. 원본이 아니라 웹용으로
다시 인코딩한 것이다 (15초 히어로 24MB → 485KB, 포스터 6장 합계 125KB).

저장소 안으로 가져오려면:

```bash
npm run assets
```

`src/pages/nokturn/media/` 로 내려받고, `assets.ts`의 `import.meta.glob`이
자동으로 CDN 대신 로컬 번들을 쓴다. **코드는 한 줄도 바뀌지 않는다.**
되돌리려면 `media/` 안의 파일만 지우면 된다.

> 이 저장소를 만든 실행 환경은 이그레스 정책상 해당 CDN에 접근할 수 없어
> `npm run assets`를 돌리지 못했다. 네트워크가 열린 곳에서 한 번 실행하면
> 완전히 자급자족하는 저장소가 된다.

## 배포

vercel.com → Add New Project → 저장소 Import → 설정 그대로 Deploy
(Vite 자동 감지, `vercel.json`에 SPA 라우팅 설정 포함)

## 커스텀 포인트

- 스튜디오 이름/연락처: `src/pages/Home.tsx` 상단 `STUDIO`, `CONTACT`
- 영화제 데이터(작품·상영 회차·관람권): `src/pages/nokturn/data.ts`
- 작업 추가: `src/pages/Home.tsx`의 `projects` 배열 + `src/App.tsx` 라우트

## 주의

모든 작업물은 포트폴리오용 가상 프로젝트다. 실존하는 제품·브랜드·영화제·
작품·감독이 아니며, 이미지와 영상은 전부 AI로 생성했다. 사양·가격·상영
정보는 예시다.
