# itsmeal-web

이츠밀(it's meal) 홈페이지 — itsmeal.co.kr. 빌드 없는 정적 HTML/CSS/JS를 Cloudflare Pages가 저장소 루트 그대로 배포한다.
`main`에 커밋하면 1~2분 뒤 반영된다.

**지켜야 할 것**: `index.html`은 루트 · `wrangler.*`·`package.json`·프레임워크·빌드 금지 · 키/비밀번호/개인정보 커밋 금지(저장소는 Public) · 공개 메일은 `contact@itsmeal.co.kr`만.

## 구조

```
index.html promise.html menu.html story.html archive.html
assets/css|js|fonts|logos|web|products|dw   시안 자산
assets/data/dw-months.js                    월별 식단·자료 (current:true 인 달이 자동 노출)
assets/docs/itsmeal-catalog.pdf             카탈로그
functions/api/contact.js                    POST /api/contact → D1 저장 + Resend 메일
db/schema.sql                               inquiries 테이블
```

## 월 바꾸기

1. `assets/data/dw-months.js`의 `DW_MONTHS` 맨 앞에 새 달 블록 추가, 이전 달의 `current: true` 제거
2. 원본 이미지를 `assets/dw/`에 넣고 `DW_DOCS`에 카드 추가

## 상담 폼 설정 (Cloudflare 대시보드, 파일로는 설정하지 않음)

Pages → itsmeal-web → 설정:
- 바인딩: D1 데이터베이스 **`DB`** (콘솔에서 `db/schema.sql` 실행)
- 변수: `CONTACT_TO`(수신 주소), `CONTACT_FROM`(예: `이츠밀 <contact@itsmeal.co.kr>`)
- 시크릿: `RESEND_API_KEY` (이츠밀 전용 Sending access 키)

## 로컬 확인

```bash
npx wrangler@4.156.1 pages dev . --d1 DB=local-only
```
