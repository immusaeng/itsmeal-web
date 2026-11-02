/* ═══════════════════════════════════════════════════════════════════════
   동원홈푸드 월별 자료 — 데이터 소스
   ---------------------------------------------------------------------
   동원홈푸드/이팜키즈는 매월 식단표·간식 소개·레시피북을 갱신합니다.
   새 달 자료가 오면 아래 MONTHS 배열 맨 앞에 한 블록만 추가하면
   홈 · 이달의 식단 · 카탈로그 · 서류가 동시에 갱신됩니다.

   필드 설명
   - id        : 정렬·URL 해시에 쓰는 키 ('2026-11')
   - label     : 화면 표기 ('11월')
   - full      : 긴 표기 ('2026년 11월')
   - current   : true면 '이번 달' 배지
   - menu      : 통합 식단표 (요일별 오전간식/점심/오후간식)
   - menuDoc   : 통합 식단표 원본 이미지 (없으면 null)
   - snacks    : 간식 상품 소개 (품목·상품코드·알레르기·열량)
   - snackDoc  : 간식 소개서 원본 이미지
   - recipe    : 수제 간식 레시피북 { name, img }
   - note      : 해당 월 특이사항
   ═══════════════════════════════════════════════════════════════════════ */

const DW_MONTHS = [
  {
    id: '2026-11',
    label: '11월',
    full: '2026년 11월',
    current: true,
    weekLabel: '첫째 주', // 이 달 menu가 담고 있는 주차
    note: '동원이팜 간식 식단표 · 매주 월~금 요일별 구성',
    menuDoc: 'assets/web/dw-snack-nov.jpg',
    menu: [
      { d: 'MON', am: '참치마요구운주먹밥', rice: '현미밥', soup: '미역국', side: '닭갈비 · 콩나물무침 · 계란말이 · 오이무침', pm: '리이브제주감귤주스' },
      { d: 'TUE', am: '제철 과일', rice: '잡곡밥', soup: '육개장', side: '계란찜 · 시금치나물 · 멸치볶음 · 무생채', pm: '오프룻딸기알로에' },
      { d: 'WED', am: '슈크림패스츄리', rice: '치즈김밥', soup: '어묵국', side: '어묵볶음 · 단무지 · 샐러드 · 브로콜리무침', pm: '액티비아스무디요거트(골드키위사과)' },
      { d: 'THU', am: '새하얀구운란', rice: '카레라이스', soup: '된장국', side: '두부조림 · 양배추샐러드 · 오이무침 · 숙주나물', pm: '덴마크드링킹요구르트 납작복숭아' },
      { d: 'FRI', am: '시카고피자데리야끼치즈', rice: '흑미밥', soup: '된장국', side: '불고기 · 숙주나물 · 김구이 · 시금치나물', pm: '덴마크테이크얼라이브 망고주스' },
    ],
    snacks: [
      { name: '미숫가루우유', brand: '동원 · 덴마크', spec: '300mL', code: '194523', allergy: '2, 5', kcal: '190Kcal / 5g' },
      { name: '하루야채', brand: '애치와이 · 켈로우', spec: '200mL', code: '181955', allergy: '12', kcal: '70Kcal / 2g' },
      { name: '클래식소시지빵', brand: '아티제', spec: '70g', code: '194549', allergy: '1,2,5,6,12,15,16,18(굴)', kcal: '205Kcal / 6g' },
    ],
    snackDoc: 'assets/web/dw-snack-oct.jpg',
    recipe: null,
  },
  {
    id: '2026-10',
    label: '10월',
    full: '2026년 10월',
    note: '10월의 추천 간식 · 「애호박채덕전」',
    menuDoc: null,
    menu: null,
    snacks: [
      { name: '미숫가루우유', brand: '동원 · 덴마크', spec: '300mL', code: '194523', allergy: '2, 5', kcal: '190Kcal / 5g' },
      { name: '하루야채', brand: '애치와이', spec: '200mL', code: '181955', allergy: '12', kcal: '70Kcal / 2g' },
      { name: '클래식소시지빵', brand: '아티제', spec: '70g', code: '194549', allergy: '1,2,5,6,12,15,16,18(굴)', kcal: '205Kcal / 6g' },
    ],
    snackDoc: 'assets/web/dw-snack-oct.jpg',
    recipe: { name: '애호박채덕전', img: 'assets/dw/recipe-10-1.jpg' },
  },
  {
    id: '2026-09',
    label: '9월',
    full: '2026년 9월',
    note: '키즈 통합 식단표 · 오전간식 / 점심 / 오후간식 2회',
    menuDoc: 'assets/dw/menu-09.jpg',
    menu: [
      { d: 'MON', am: '흰죽 · 귀리닭가슴살죽', rice: '보리밥', soup: '시래기된장국', side: '표고소불고기 · 오이볶음 · 배추김치', pm: '브로콜리소고기유부초밥' },
      { d: 'TUE', am: '크래미양배추죽', rice: '차조밥', soup: '맑은청경채국', side: '소고기마늘종굴소스볶음 · 어묵볶음 · 열무김치', pm: '햄치즈김가루주먹밥' },
      { d: 'WED', am: '김치콩나물죽', rice: '잡곡밥', soup: '맑은해물순두부국', side: '취나물소고기볶음 · 느타리당근볶음 · 배추김치', pm: '수제약밥' },
      { d: 'THU', am: '흑임자죽', rice: '퀴노아밥', soup: '들깨무챗국', side: '소고기단호박찜 · 아욱나물 · 배추김치', pm: '잡채덮밥' },
      { d: 'FRI', am: '단호박죽', rice: '차조밥', soup: '미역국', side: '닭갈비 · 콩나물무침 · 계란말이', pm: '제철 과일 · 요거트' },
    ],
    snacks: [],
    snackDoc: 'assets/dw/menu-09.jpg',
    recipe: { name: '치킨 새콤 샌드위치', img: 'assets/dw/recipe-09-1.jpg' },
  },
  {
    id: '2026-08',
    label: '8월',
    full: '2026년 8월',
    note: '키움 돌봄센터 간식 상품 소개서 · 간식 식단 소개',
    menuDoc: null,
    menu: null,
    snacks: [
      { name: '초당옥수수크림소보루', brand: '삼립', spec: '105g', code: '194302', allergy: '1, 2, 5, 6', kcal: '375Kcal / 6g' },
      { name: '불고기크림브리또', brand: '남향푸드', spec: '125g', code: '153139', allergy: '2, 5, 6, 15, 16', kcal: '310Kcal / 13g' },
      { name: '고소한치즈떡볶이', brand: '동원 · 덴마크', spec: '160g', code: '165425', allergy: '1,2,5,6,12,15,16', kcal: '390Kcal / 6g' },
    ],
    snackDoc: 'assets/dw/kium-08.jpg',
    recipe: { name: '돈장조림버터밥전', img: 'assets/dw/recipe-08-1.jpg' },
  },
  {
    id: '2026-06',
    label: '6월',
    full: '2026년 6월',
    note: '6월의 추천 간식 · 「모닝방게란방」',
    menuDoc: null,
    menu: null,
    snacks: [],
    snackDoc: null,
    recipe: { name: '모닝방게란방', img: 'assets/dw/recipe-06.jpg' },
  },
];

/* 카탈로그 · 서류 페이지용 문서 목록 — 월별로 자동 그룹핑 */
const DW_DOCS = [
  { id: 'recipe-10', month: '2026-10', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 10월 · 애호박채덕전', pages: 1, cover: 'assets/dw/recipe-10-1.jpg' },
  { id: 'kium-10', month: '2026-10', kind: '이미지', title: '키움 돌봄센터 간식 상품 소개서', sub: '2026년 10월 · 간식 식단 소개', pages: 1, cover: 'assets/dw/kium-10.jpg' },
  { id: 'recipe-09', month: '2026-09', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 9월 · 치킨 새콤 샌드위치', pages: 1, cover: 'assets/dw/recipe-09-1.jpg' },
  { id: 'menu-09', month: '2026-09', kind: '이미지', title: '키즈 통합 식단표', sub: '2026년 9월 · 점심 및 간식', pages: 1, cover: 'assets/dw/menu-09.jpg' },
  { id: 'recipe-08', month: '2026-08', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 8월 · 돈장조림버터밥전', pages: 1, cover: 'assets/dw/recipe-08-1.jpg' },
  { id: 'kium-08', month: '2026-08', kind: '이미지', title: '키움 돌봄센터 간식 상품 소개서', sub: '2026년 8월 · 간식 식단 소개', pages: 1, cover: 'assets/dw/kium-08.jpg' },
  { id: 'recipe-07', month: '2026-07', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 7월 · 수제두부피자', pages: 1, cover: 'assets/dw/recipe-07-1.jpg' },
  { id: 'kium-07', month: '2026-07', kind: '이미지', title: '키움 돌봄센터 간식 상품 소개서', sub: '2026년 7월 · 간식 식단 소개', pages: 1, cover: 'assets/dw/kium-07.jpg' },
  { id: 'recipe-06', month: '2026-06', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 6월 · 모닝방게란방', pages: 1, cover: 'assets/dw/recipe-06.jpg' },
  { id: 'kium-06', month: '2026-06', kind: '이미지', title: '키움 돌봄센터 간식 상품 소개서', sub: '2026년 6월 · 간식 식단 소개', pages: 1, cover: 'assets/dw/kium-06.jpg' },
  { id: 'recipe-05', month: '2026-05', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 5월 · 제주식 고기국수', pages: 1, cover: 'assets/dw/recipe-05-1.jpg' },
  { id: 'kium-05', month: '2026-05', kind: '이미지', title: '키움 돌봄센터 간식 상품 소개서', sub: '2026년 5월 · 간식 식단 소개', pages: 1, cover: 'assets/dw/kium-05.jpg' },
  { id: 'recipe-04', month: '2026-04', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 4월 · 소세지묵은지꼬마김밥', pages: 1, cover: 'assets/dw/recipe-04-1.jpg' },
  { id: 'recipe-03', month: '2026-03', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 3월 · 오꼬노미야끼', pages: 1, cover: 'assets/dw/recipe-03-1.jpg' },
  { id: 'leaflet-03', month: '2026-03', kind: '이미지', title: '동원이팜 이달의 간식 상품 소개 리플렛', sub: '2026년 3월 · 이달의 상품 소개', pages: 1, cover: 'assets/dw/leaflet-03.jpg' },
  { id: 'recipe-02', month: '2026-02', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 2월 · 새우크림리조또', pages: 1, cover: 'assets/dw/recipe-02-1.jpg' },
  { id: 'recipe-01', month: '2026-01', kind: '이미지', title: '동원이팜 수제 간식 레시피 BOOK', sub: '2026년 1월 · 베이컨감자채전', pages: 1, cover: 'assets/dw/recipe-01-1.jpg' },
];

window.DW_MONTHS = DW_MONTHS;
window.DW_DOCS = DW_DOCS;
