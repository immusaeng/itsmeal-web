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
  phone: '010-4811-2944',
  phoneHref: 'tel:01048112944',
  phone2: '010-7656-0301',
  phone2Href: 'tel:01076560301',
  email: 'contact@itsmeal.co.kr',
  // 푸터 사업자 표기(운영자가 공개를 승인한 항목만: 상호·사업자등록번호·영업신고)
  biz: '상호 이츠밀 · 사업자등록번호 193-23-02385 · 영업신고 제2026-0325042호 (식품소분·판매업, 집단급식소 식품판매업)',
  rep: '대표자 이수현',
  addr: '전남광주통합특별시 광산구 첨단중앙로124번길',
  nav: [
    {
      href: '/resources', label: '급식 자료실', key: 'resources',
      children: [
        { href: '/resource-season', label: '제철 도감', desc: '식단 짜기 전, 이번 달 제철 확인' },
        { href: '/resource-hygiene-check', label: '위생관리 점검표', desc: '출력해서 매일 체크하는 A4 한 장' },
        { href: '/resource-hygiene-tips', label: '자주 놓치는 위생 10가지', desc: '조리실 게시 · 신규 조리원 교육용' },
        { href: '/menu', label: '이달의 식단', desc: '월~금 간식 식단표와 구성 예시' },
      ],
    },
    { href: '/promise', label: '네 가지 약속', key: 'promise' },
    { href: '/story', label: '브랜드 스토리', key: 'story' },
    { href: '/archive', label: '카탈로그 · 월간 자료', key: 'archive' },
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
  'resources.html': ['nav', 'foot'],
  'resource-season.html': ['nav', 'foot', 'season-veg', 'season-sea'],
  'resource-hygiene-check.html': ['nav', 'foot'],
  'resource-hygiene-tips.html': ['nav', 'foot'],
}

// 자료 3장과 이달의 식단은 내비의 '현장 자료'(resources)로 표시한다
const NAV_ALIAS = { season: 'resources', check: 'resources', tips: 'resources', menu: 'resources' }

// ── 데이터 ─────────────────────────────────────────────────────────────────────
const sandbox = { window: {} }
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/data/dw-months.js'), 'utf8'), sandbox)
const MONTHS = sandbox.window.DW_MONTHS
const DOCS = sandbox.window.DW_DOCS
const cur = MONTHS.find(m => m.current) ?? MONTHS[0]

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const abs = p => (p.startsWith('/') ? p : '/' + p)
const arrow = '<svg viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5h12M9.5 3.5 14.5 8.5 9.5 13.5"/></svg>'

// 제철 도감 표: 검색·공유 미리보기에도 내용이 보이도록 HTML에 써 둔다(런타임 JS가 같은 행을 다시 그리며 '이번 달'만 더한다)
const SEASON_BOX = { window: {} }
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/data/season.js'), 'utf8'), SEASON_BOX)
const SEASON = SEASON_BOX.window.SEASON
const sCells = (mode, months, peak) => Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  let cls = 'cell'
  if (mode === 'veg') { if (months.length === 12 && months.indexOf(1) === 0) cls += ' year'; else if (months.indexOf(m) > -1) cls += ' on' }
  else if (peak && peak.indexOf(m) > -1) cls += ' on'
  else if (months.indexOf(m) > -1) cls += ' mid'
  return `<td class="${cls}"></td>`
}).join('')
const sVeg = r => `<tr data-season="veg"><td class="t-item" title="${esc(r.item)}">${esc(r.item)}</td><td class="t-orig" title="${esc(r.prov + (r.district ? ' ' + r.district : ''))}">${r.district ? '<b>' + esc(r.prov) + '</b> ' + esc(r.district) : esc(r.prov)}</td>${sCells('veg', r.months, null)}<td class="t-note${r.year ? ' is-year' : ''}">${esc(r.note)}</td></tr>`
const sSea = r => `<tr data-season="sea"><td class="t-item" title="${esc(r.item)}">${esc(r.item)}</td><td class="t-orig" title="${esc(r.label)}"><b>${esc(r.group)}</b> ${esc(r.label.replace(/^[^·]*·s*/, ''))}</td>${sCells('sea', r.run, r.peak)}<td class="t-note">${esc(r.note)}</td></tr>`
const sBody = kind => (kind === 'veg' ? SEASON.vegGroups : SEASON.seaGroups).map(g => {
  const rows = (kind === 'veg' ? SEASON.veg : SEASON.sea).filter(r => r.group === g)
  if (!rows.length) return ''
  const head = kind === 'veg' ? `${g}<em>${rows.length}개 산지</em>` : `${g === '국산' ? '국산 · 연근해' : g === '원양' ? '원양 · 조업' : '수입 · 냉동'}<em>${rows.length}품목</em>`
  return `<tr class="grp" id="${kind === 'veg' ? 'g' : 'sg'}-${encodeURIComponent(g)}"><td colspan="15"><span class="grp__k">${head}</span></td></tr>` + rows.map(kind === 'veg' ? sVeg : sSea).join('')
}).join('')

// ── 템플릿 ─────────────────────────────────────────────────────────────────────
const chev = '<svg class="nav__chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 4.5 3 3 3-3"/></svg>'
const navItem = (n, active) => n.children
  ? `<div class="nav__dd"><a href="${n.href}" class="nav__ddT${active === n.key ? ' is-active' : ''}">${n.label}${chev}</a><div class="nav__ddM">${n.children.map(c => `<a href="${c.href}"><b>${c.label}</b><span>${c.desc}</span></a>`).join('')}</div></div>`
  : `<a href="${n.href}" class="${active === n.key ? 'is-active' : ''}">${n.label}</a>`
const sheetItems = () => SITE.nav.map(n => n.children
  ? `<span class="navSheet__h">${n.label}</span>${n.children.map(c => `<a class="navSheet__c" href="${c.href}">${c.label}</a>`).join('')}`
  : `<a href="${n.href}">${n.label}</a>`).join('')
const flatNav = () => SITE.nav.flatMap(n => n.children ? n.children : [n])
const mbar = () => `<nav class="mbar" id="mbar" aria-label="빠른 메뉴">
  <a href="/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg><span>홈</span></a>
  <a href="/resources"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg><span>급식 자료실</span></a>
  <a href="${SITE.phoneHref}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg><span>전화</span></a>
  <a class="mbar__cta" href="/#contact"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg><span>상담 신청</span></a>
</nav>
`
const nav = (active, dark) => `
<header class="nav${dark ? ' is-dark' : ''}" id="siteNav">
  <div class="nav__in">
    <a class="nav__logo" href="/" aria-label="이츠밀 홈">
      <img class="logo-navy" src="/assets/logos/mil2-navy.svg" alt="이츠밀">
      <img class="logo-white" src="/assets/logos/mil2-white.svg" alt="" aria-hidden="true">
    </a>
    <nav class="nav__menu">${SITE.nav.map(n => navItem(n, active)).join('')}</nav>
    <a class="nav__cta" href="/#contact">상담 신청 ${arrow}</a>
    <button class="nav__burger" aria-label="메뉴 열기" aria-expanded="false"><span></span></button>
  </div>
</header>
<div class="navSheet">${sheetItems()}<a href="/#contact">상담 신청</a></div>
${mbar()}`

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
          ${flatNav().map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('\n          ')}
          <li><a href="/#contact">상담 · 견적 신청</a></li>
        </ul>
      </div>
      <div>
        <h5>문의</h5>
        <ul>
          <li><a class="foot__tel" href="${SITE.phoneHref}">${SITE.phone}</a></li>
          <li><a href="${SITE.phone2Href}">${SITE.phone2}</a></li>
          <li><!--email_off--><a href="mailto:${SITE.email}">${SITE.email}</a><!--/email_off--></li>
          <li>평일 09:00 – 18:00</li>
        </ul>
      </div>
    </div>
    <p class="foot__biz">${SITE.biz}<br>${SITE.rep} · ${SITE.addr}</p>
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
          <img src="${esc(abs(d.cover))}" alt="${esc(d.title)}" loading="lazy" decoding="async">
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
  'season-veg': () => sBody('veg'),
  'season-sea': () => sBody('sea'),
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
    active: NAV_ALIAS[(src.match(/<body data-page="([^"]*)"/) ?? [])[1]] ?? (src.match(/<body data-page="([^"]*)"/) ?? [])[1] ?? '',
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
