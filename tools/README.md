# tools/ — 로컬 전용 스크립트 (Cloudflare Pages는 실행하지 않음)

`build-static.mjs`: 내비·푸터·이달의 식단표·자료 카드를 **HTML에 직접 써 넣는다.**
검색엔진·AI·스크립트가 꺼진 환경에서도 이 내용이 보이게 하려는 것이며, 결과 HTML을 커밋하면 Pages는 지금처럼 빌드 없이 그대로 배포한다.
(Node만 필요, `package.json`·설치 없음.)

```bash
node tools/build-static.mjs            # <!--gen:NAME-->…<!--/gen:NAME--> 구간을 다시 생성
node tools/build-static.mjs --check    # 생성 결과와 파일이 다르면 실패 (커밋 전 확인)
```

## 언제 실행하나
- `assets/data/dw-months.js`를 고친 뒤(새 달 추가, 간식명 수정, `current` 이동, 자료 카드 추가)
- 내비 항목·푸터·문의처를 바꿀 때(스크립트 안 `SITE`와 템플릿)

**손으로 고치지 말 것**: `<!--gen:…-->`로 둘러싸인 구간은 다음 실행 때 덮어써진다. 내용을 바꾸려면 데이터나 스크립트를 고친다.

## 생성되는 구간
| 표식 | 페이지 | 내용 |
|---|---|---|
| `nav`, `foot` | 전 페이지(index, promise, menu, story, archive, privacy, 404) | 상단 내비, 하단 푸터 |
| `home-float` | index | "N월 식단표 보기" |
| `m-full`, `m-week`, `m-key`, `wk-board` | menu | 기준 월, 주차 제목, 주간 식단표 |
| `arc-tabs`, `arc-grid` | archive | 월 탭, 월간 자료 카드 |

새 페이지를 만들면 `<body data-page="…">` 바로 뒤에 `<!--gen:nav--><!--/gen:nav-->`, 푸터 자리에 `<!--gen:foot--><!--/gen:foot-->`를 넣고 스크립트의 `PAGES`에 파일을 추가한다.
