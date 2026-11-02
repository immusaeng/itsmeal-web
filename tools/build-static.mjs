// 내비·푸터·이달의 식단·자료 카드를 HTML에 직접 써 넣는 로컬 스크립트.
// 의존성 없음(Node만). Cloudflare Pages는 이 스크립트를 실행하지 않고, 결과 HTML을 그대로 배포한다.
//
//   node tools/build-static.mjs           HTML의 <!--gen:NAME-->…<!--/gen:NAME--> 구간을 다시 생성
//   node tools/build-static.mjs --check   생성 결과와 파일이 다르면 실패(커밋 전 확인용)
//
// 입력: 아래 SITE, assets/data/dw-months.js(현재 달은 current:true)
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHECK = process.argv.includes('--check')

// ── 사이트 공통 값(내비 순서·라벨, 문의처) ─────────────────────────────────────────
const SITE = {
  phone: '010-7656-0301',
  phoneHref: 'tel:01076560301',
  email: 'contact@itsmeal.co.kr',
  // 푸터 사업자 표기(운영자가 공개를 승인한 항목만: 상호·사업자등록번호·영업신고)
  biz: '상호 이츠밀 · 사업자등록번호 193-23-02385 · 영업신고 제2026-0325042호 (식품소분·판매업, 집단급식소 식품판매업)',
  nav: [
    { href: '/promise', label: '네 가지 약속', key: 'promise' },
    { href: '/menu', label: '이달의 식단', key: 'menu' },
    { href: '/story', label: '브랜드 스토리', key: 'story' },
    { href: '/archive', label: '카탈로그 · 서류', key: 'archive' },
  ],
}

// 페이지별로 생성할 구간
const PAGES = {
  'index.html': ['nav', 'foot', 'home-float'],
  'promise.html': ['nav', 'foot'],
  'story.html': ['nav', 'foot'],
  'privacy.html': ['nav', 'foot'],
  '404.html': ['nav', 'foot'],
  'menu.html': ['nav', 'foot', 'm-full', 'm-week', 'm-key', 'wk-board'],
  'archive.html': ['nav', 'foot', 'arc-tabs', 'arc-grid'],
}

// ── 데이터 ─────────────────────────────────────────────────────────────────────
const sandbox = { window: {} }
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/data/dw-months.js'), 'utf8'), sandbox)
const MONTHS = sandbox.window.DW_MONTHS
const DOCS = sandbox.window.DW_DOCS
const cur = MONTHS.find(m => m.current) ?? MONTHS[0]

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const abs = p => (p.startsWith('/') ? p : '/' + p)
const arrow = '<svg viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5h12M9.5 3.5 14.5 8.5 9.5 13.5"/></svg>'

// ── 템플릿 ─────────────────────────────────────────────────────────────────────
const nav = (active, dark) => `
<header class="nav${dark ? ' is-dark' : ''}" id="siteNav">
  <div class="nav__in">
    <a class="nav__logo" href="/" aria-label="이츠밀 홈">
      <img class="logo-navy" src="/assets/logos/mil2-navy.svg" alt="이츠밀">
      <img class="logo-white" src="/assets/logos/mil2-white.svg" alt="" aria-hidden="true">
    </a>
    <nav class="nav__menu">${SITE.nav.map(n => `<a href="${n.href}" class="${active === n.key ? 'is-active' : ''}">${n.label}</a>`).join('')}</nav>
    <a class="nav__cta" href="/#contact">상담 신청 ${arrow}</a>
    <button class="nav__burger" aria-label="메뉴 열기" aria-expanded="false"><span></span></button>
  </div>
</header>
<div class="navSheet">${SITE.nav.map(n => `<a href="${n.href}">${n.label}</a>`).join('')}<a href="/#contact">상담 신청</a></div>
`

const foot = () => `
<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <div>
        <img class="foot__logo" src="/assets/logos/mil2-white.svg" alt="이츠밀">
        <p class="foot__tag">아이들 밥상은 든든하게,<br>원장님의 운영 고민은 가볍게.</p>
      </div>
      <div>
        <h5>바로가기</h5>
        <ul>
          ${SITE.nav.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('\n          ')}
          <li><a href="/#contact">상담 · 견적 신청</a></li>
        </ul>
      </div>
      <div>
        <h5>문의</h5>
        <ul>
          <li><a href="${SITE.phoneHref}">${SITE.phone}</a></li>
          <li><!--email_off--><a href="mailto:${SITE.email}">${SITE.email}</a><!--/email_off--></li>
          <li>평일 09:00 – 18:00</li>
        </ul>
      </div>
    </div>
    <p class="foot__biz">${SITE.biz}</p>
    <div class="foot__bar">
      <span>이츠밀 · it's meal &nbsp;|&nbsp; 동원홈푸드 공식 파트너</span>
      <span><a href="/privacy">개인정보 처리방침</a> &nbsp;|&nbsp; © 2026 it's meal. All rights reserved.</span>
    </div>
  </div>
</footer>
`

const DAY = { MON: '월', TUE: '화', WED: '수', THU: '목', FRI: '금' }
const board = () => '\n' + (cur.menu ?? []).map(row => `        <div class="wk__col">
          <div class="wk__d"><b>${DAY[row.d]}요일</b><span>${row.d}</span></div>
          <div class="wk__slot"><span class="wk__k">오전 간식</span><span class="wk__sn">${esc(row.am)}</span></div>
          <div class="wk__slot wk__main"><span class="wk__k">점심 · 예시</span><div class="wk__rice">${esc(row.rice)}</div><div class="wk__soup">${esc(row.soup)}</div><div class="wk__side">${row.side.split('·').map(s => `<span>${esc(s.trim())}</span>`).join('')}</div></div>
          <div class="wk__slot"><span class="wk__k">오후 간식</span><span class="wk__sn">${esc(row.pm)}</span></div>
        </div>`).join('\n') + '\n      '

const months = [...new Set(DOCS.map(d => d.month))]
const tabs = () => `
        <button class="monthTab on" data-m="all">전체</button>
        ${months.map(m => `<button class="monthTab" data-m="${m}">${parseInt(m.split('-')[1], 10)}월</button>`).join('\n        ')}
      `
const cards = () => '\n' + DOCS.map(d => `      <div class="doc" data-month="${d.month}">
        <button class="doc__paper" data-zoom="${esc(abs(d.cover))}" data-title="${esc(d.title)}" style="border:0;padding:9px">
          <img src="${esc(abs(d.cover))}" alt="${esc(d.title)}">
          <span class="doc__zoom">크게 보기</span>
        </button>
        <div><div class="doc__k">${esc(d.title)}</div><div class="doc__d">${esc(d.sub)} · ${esc(d.kind)} ${d.pages}p</div></div>
      </div>`).join('\n') + '\n    '

const [yy, mm] = cur.id.split('-')
const GEN = (name, page) => ({
  nav: () => nav(page.active, page.dark),
  foot,
  'home-float': () => `${cur.label} 식단표 보기`,
  'm-full': () => `${cur.full} 기준`,
  'm-week': () => `${cur.label} ${cur.weekLabel ?? ''}`.trim(),
  'm-key': () => `Week 1 — ${yy}. ${Number(mm)}.`,
  'wk-board': board,
  'arc-tabs': tabs,
  'arc-grid': cards,
})[name]()

// ── CSS·JS 주소에 내용 해시(?v=) 붙이기 ─────────────────────────────────────────
// Cloudflare의 브라우저 캐시(최대 4시간)가 배포 직후 옛 CSS·JS를 붙잡지 않도록, 파일이 바뀌면 주소가 바뀌게 한다.
// 줄바꿈(CRLF/LF) 차이로 해시가 흔들리지 않게 LF로 맞춰 계산한다.
const verCache = new Map()
const ver = rel => {
  if (!verCache.has(rel)) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\r\n').join('\n')
    verCache.set(rel, crypto.createHash('sha1').update(text).digest('hex').slice(0, 8))
  }
  return verCache.get(rel)
}
const ASSET_REF = /((?:href|src)=")(\/?)(assets\/(?:css|js)\/[^"?#]+)(\?v=[^"]*)?(")/g
const versionAssets = html => html.replace(ASSET_REF, (_m, a, slash, rel, _q, z) => `${a}${slash}${rel}?v=${ver(rel)}${z}`)

// ── 실행 ───────────────────────────────────────────────────────────────────────
let bad = 0
for (const [file, names] of Object.entries(PAGES)) {
  const p = path.join(ROOT, file)
  const src = fs.readFileSync(p, 'utf8').split('\r\n').join('\n')
  const page = {
    active: (src.match(/<body data-page="([^"]*)"/) ?? [])[1] ?? '',
    dark: /<html[^>]*data-nav-dark="true"/.test(src),
  }
  let out = src
  for (const name of names) {
    const re = new RegExp(`<!--gen:${name}-->[\\s\\S]*?<!--/gen:${name}-->`)
    if (!re.test(out)) throw new Error(`${file}: 표식 <!--gen:${name}--> 없음`)
    out = out.replace(re, () => `<!--gen:${name}-->${GEN(name, page)}<!--/gen:${name}-->`)
  }
  out = versionAssets(out)
  if (out !== src) {
    if (CHECK) { console.log(`변경 필요: ${file}`); bad++ } else { fs.writeFileSync(p, out); console.log(`갱신: ${file}`) }
  }
}
if (CHECK) { if (bad) process.exit(1); console.log('모든 생성 구간이 최신입니다.') }
