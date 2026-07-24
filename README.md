# AI Product Film — Portfolio

AI 생성 에셋으로 만든 스크롤 필름 제품 상세페이지 포트폴리오.

- `/` 포트폴리오 메인
- `/work/klang` KLANG Pro (애플 제품 페이지 인터랙션 미믹)
- `/work/kontakt` KONTAKT ONE (7씬 스크롤 스크럽)

## 배포 (5분)

1. GitHub에 새 저장소 만들기 (예: `product-film-portfolio`)
2. 이 폴더에서:
   ```bash
   git init && git add -A && git commit -m "initial"
   git branch -M main
   git remote add origin https://github.com/<아이디>/<저장소>.git
   git push -u origin main
   ```
3. vercel.com → Add New Project → 방금 올린 저장소 Import → 설정 그대로 Deploy
   (Vite 자동 감지, `vercel.json`에 SPA 라우팅 설정 포함되어 있음)

## 로컬 실행

```bash
npm install
npm run dev
```

## 커스텀 포인트

- 스튜디오 이름/연락처: `src/pages/Home.tsx` 상단 `STUDIO`, `CONTACT`
- UMBRA 추가 시: `src/pages/Home.tsx`의 projects 배열 + 라우트 추가
