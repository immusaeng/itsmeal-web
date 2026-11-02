/* ═══════════════════════════════════════════════════════════════════════
   이츠밀 — 공통 크롬 + 제철 도감 렌더 + 인쇄/이미지 내려받기
   의존: assets/data/season.js, vendor/html-to-image.js (PNG 저장 시)
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 내비 동작 (마크업은 tools/build-static.mjs가 HTML에 써 넣는다) ───────── */
function rsNav() {
  const nav = document.getElementById('siteNav')
  const sheet = document.querySelector('.navSheet')
  const burger = nav && nav.querySelector('.nav__burger')
  if (!nav) return
  if (sheet && burger) {
    burger.addEventListener('click', () => {
      const open = sheet.classList.toggle('is-open')
      burger.setAttribute('aria-expanded', String(open))
    })
    sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      sheet.classList.remove('is-open')
      burger.setAttribute('aria-expanded', 'false')
    }))
  }
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 30)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
}

/* ── 리빌 ──────────────────────────────────────────────────────────── */
function rsReveal() {
  const items = Array.from(document.querySelectorAll('[data-reveal]'))
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-in'))
    return
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    })
  }, { rootMargin: '0px 0px -6% 0px' })
  items.forEach(el => io.observe(el))

  /* 안전장치 — 관찰자가 어떤 이유로든 놓친 요소는 반드시 보이게 */
  const sweep = () => items.forEach(el => {
    if (!el.classList.contains('is-in')) el.classList.add('is-in')
  })
  setTimeout(sweep, 1200)
  window.addEventListener('load', () => setTimeout(sweep, 300))
}

/* ── 유틸 ──────────────────────────────────────────────────────────── */
const MONTH_NOW = new Date().getMonth() + 1
const pad2 = n => String(n).padStart(2, '0')

/* ═══════════════════════════════════════════════════════════════════
   제철 표 — 한 행을 그린다
   ═══════════════════════════════════════════════════════════════════ */
function seasonCells(mode, months, peak) {
  let out = ''
  for (let m = 1; m <= 12; m++) {
    let cls = 'cell'
    if (mode === 'veg') {
      if (months.length === 12 && months.indexOf(1) === 0) cls += ' year'
      else if (months.indexOf(m) > -1) cls += ' on'
    } else {
      if (peak && peak.indexOf(m) > -1) cls += ' on'
      else if (months.indexOf(m) > -1) cls += ' mid'
    }
    if (m === MONTH_NOW) cls += ' now'
    out += `<td class="${cls}"></td>`
  }
  return out
}

function vegRowHTML(r) {
  const orig = r.prov + (r.district ? ' ' + r.district : '')
  return `<tr data-season="veg">
    <td class="t-item" title="${r.item}">${r.item}</td>
    <td class="t-orig" title="${orig}">${r.district ? '<b>' + r.prov + '</b> ' + r.district : r.prov}</td>
    ${seasonCells('veg', r.months, null)}
    <td class="t-note${r.year ? ' is-year' : ''}">${r.note}</td>
  </tr>`
}

function seaRowHTML(r) {
  return `<tr data-season="sea">
    <td class="t-item" title="${r.item}">${r.item}</td>
    <td class="t-orig" title="${r.label}"><b>${r.group}</b> ${r.label.replace(/^[^·]*·\s*/, '')}</td>
    ${seasonCells('sea', r.run, r.peak)}
    <td class="t-note">${r.note}</td>
  </tr>`
}

/* 표 본문 (그룹 헤더 + 행) */
function buildSeasonBody(kind) {
  const S = window.SEASON
  let html = ''
  if (kind === 'veg') {
    S.vegGroups.forEach(g => {
      const rows = S.veg.filter(r => r.group === g)
      if (!rows.length) return
      html += `<tr class="grp" id="g-${encodeURIComponent(g)}"><td colspan="15">
        <span class="grp__k">${g}<em>${rows.length}개 산지</em></span>
      </td></tr>` + rows.map(vegRowHTML).join('')
    })
  } else {
    S.seaGroups.forEach(g => {
      const rows = S.sea.filter(r => r.group === g)
      if (!rows.length) return
      html += `<tr class="grp" id="sg-${encodeURIComponent(g)}"><td colspan="15">
        <span class="grp__k">${g === '국산' ? '국산 · 연근해' : g === '원양' ? '원양 · 조업' : '수입 · 냉동'}<em>${rows.length}품목</em></span>
      </td></tr>` + rows.map(seaRowHTML).join('')
    })
  }
  return html
}

/* ═══════════════════════════════════════════════════════════════════
   12개월 분포 막대
   ═══════════════════════════════════════════════════════════════════ */
function buildMonthBar() {
  const S = window.SEASON
  const vegSeasonal = S.veg.filter(r => !r.year)
  const counts = []
  for (let m = 1; m <= 12; m++) {
    const v = vegSeasonal.filter(r => r.months.indexOf(m) > -1).length
    const s = S.sea.filter(r => r.peak.indexOf(m) > -1).length
    counts.push({ m, v, s, total: v + s })
  }
  const max = Math.max(...counts.map(c => c.total), 1)
  const peakV = Math.max(...counts.map(c => c.v))
  return counts.map(c => {
    const h = Math.max(4, Math.round((c.total / max) * 100))
    const isPeak = c.v >= peakV * 0.86
    return `<div class="mBar__c${isPeak ? ' is-peak' : ''}${c.m === MONTH_NOW ? ' is-now' : ''}">
      <span class="mBar__col"><span class="mBar__bar" style="height:${h}%"></span></span>
      <span class="mBar__n">${c.total}</span>
      <span class="mBar__m">${c.m}</span>
    </div>`
  }).join('')
}

/* 이번 달 칩 */
function buildNowChips() {
  const S = window.SEASON
  const veg = S.veg.filter(r => r.months.indexOf(MONTH_NOW) > -1 && !r.year)
  const sea = S.sea.filter(r => (r.peak.length ? r.peak : r.run).indexOf(MONTH_NOW) > -1)
  const uniq = list => [...new Set(list.map(r => r.item))]

  const vegRows = S.vegGroups.map(g => {
    const items = uniq(veg.filter(r => r.group === g))
    if (!items.length) return ''
    return `<div class="chipRow">
      <span class="chipRow__k">${g}</span>
      <span class="chips">${items.map(i => `<span class="chip">${i}</span>`).join('')}</span>
    </div>`
  }).join('')

  const seaChips = uniq(sea).map(i => `<span class="chip chip--sea">${i}</span>`).join('')

  return {
    vegHTML: vegRows || '<p class="small">이 달에는 따로 표시된 제철 품목이 없습니다.</p>',
    seaHTML: `<div class="chipRow"><span class="chipRow__k">수산물</span><span class="chips">${seaChips}</span></div>`,
    vegCount: uniq(veg).length,
    seaCount: uniq(sea).length,
  }
}

/* ═══════════════════════════════════════════════════════════════════
   페이지 부팅
   ═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  rsNav()
  rsReveal()

  const page = document.body.dataset.page

  /* 이번 달 표기 — 페이지 공통 */
  document.querySelectorAll('[data-month-label]').forEach(el => { el.textContent = MONTH_NOW })

  /* ── 제철 도감 ─────────────────────────────────────────────── */
  if (page === 'season') {
    const vegBody = document.getElementById('vegBody')
    const seaBody = document.getElementById('seaBody')
    if (vegBody) vegBody.innerHTML = buildSeasonBody('veg')
    if (seaBody) seaBody.innerHTML = buildSeasonBody('sea')

    const mbar = document.getElementById('monthBar')
    if (mbar) mbar.innerHTML = buildMonthBar()

    const now = buildNowChips()
    const nowVeg = document.getElementById('nowVeg')
    const nowSea = document.getElementById('nowSea')
    if (nowVeg) nowVeg.innerHTML = now.vegHTML
    if (nowSea) nowSea.innerHTML = now.seaHTML

    const vc = document.getElementById('vegCount')
    const sc = document.getElementById('seaCount')
    const ac = document.getElementById('allCount')
    if (vc) vc.textContent = window.SEASON.veg.length
    if (sc) sc.textContent = window.SEASON.sea.length
    if (ac) ac.textContent = window.SEASON.veg.length + window.SEASON.sea.length

    const nc = document.getElementById('nowTotal')
    if (nc) nc.textContent = now.vegCount + now.seaCount
  }

  /* ── 자료실 허브 ───────────────────────────────────────────── */
  if (page === 'hub') {
    const S = window.SEASON

    const ac = document.getElementById('allCount')
    if (ac) ac.textContent = S.veg.length + S.sea.length

    const mbar = document.getElementById('hubMonthBar')
    if (mbar) mbar.innerHTML = buildMonthBar()

    const box = document.getElementById('hubNow')
    if (box) {
      const uniq = l => [...new Set(l.map(r => r.item))]
      const monthVeg = S.veg.filter(r => !r.year && r.months.indexOf(MONTH_NOW) > -1)
      const monthSea = S.sea.filter(r => (r.peak.length ? r.peak : r.run).indexOf(MONTH_NOW) > -1)

      const vegChips = uniq(monthVeg).map(i => `<span class="chip">${i}</span>`).join('')
      const seaChips = uniq(monthSea).map(i => `<span class="chip chip--sea">${i}</span>`).join('')

      box.innerHTML = `
        <div class="chipRow">
          <span class="chipRow__k">채소</span>
          <span class="chips">${vegChips || '<span class="small">이 달에는 따로 표시된 품목이 없습니다.</span>'}</span>
        </div>
        <div class="chipRow">
          <span class="chipRow__k">수산물</span>
          <span class="chips">${seaChips || '<span class="small">—</span>'}</span>
        </div>`
    }
  }

  /* ── A4 종이 스케일 ───────────────────────────────────────── */
  const stage = document.querySelector('.paperStage')
  const inner = document.querySelector('.paperStage__in')
  if (stage && inner) {
    const fit = () => {
      const avail = stage.clientWidth
      const s = Math.min(1, avail / 794)
      inner.style.setProperty('--ps', s.toFixed(4))
      stage.style.height = s < 1 ? (inner.scrollHeight * s + 40) + 'px' : ''
    }
    fit()
    window.addEventListener('resize', fit, { passive: true })
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit)
    setTimeout(fit, 400)
  }

  rsBindActions()
})

/* ═══════════════════════════════════════════════════════════════════
   인쇄 · 이미지 저장
   ═══════════════════════════════════════════════════════════════════ */
function rsToast(msg, ms) {
  let t = document.getElementById('rsToast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'rsToast'
    t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(10px);z-index:300;' +
      'padding:11px 18px;border-radius:999px;background:rgba(20,37,28,.93);color:#FAF8F3;font-size:13px;font-weight:700;' +
      'letter-spacing:-.01em;box-shadow:0 18px 30px -20px rgba(0,0,0,.6);opacity:0;transition:opacity .3s,transform .35s cubic-bezier(.22,1,.36,1);pointer-events:none'
    document.body.appendChild(t)
  }
  t.textContent = msg
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)' })
  clearTimeout(t._h)
  t._h = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)' }, ms || 2400)
}

function rsBindActions() {
  document.querySelectorAll('[data-share]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = location.origin + location.pathname + '?utm_source=share&utm_medium=button&utm_campaign=' + (document.body.dataset.page || 'resource')
      const data = { title: document.title, text: '급식 현장에서 바로 쓰는 자료예요.', url }
      if (navigator.share) {
        try { await navigator.share(data); if (window.gaEvent) window.gaEvent('resource_share', { method: 'native' }) } catch (e) { /* 사용자가 공유 창을 닫음 */ }
        return
      }
      try { await navigator.clipboard.writeText(url); if (window.gaEvent) window.gaEvent('resource_share', { method: 'copy' }); rsToast('링크를 복사했습니다. 카톡이나 문자에 붙여 넣으세요.') }
      catch (e) { rsToast('링크를 복사하지 못했습니다. 주소창의 주소를 공유해 주세요.', 3600) }
    })
  })

  document.querySelectorAll('button[data-print]').forEach(btn => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.print
      if (kind) document.body.dataset.print = kind
      setTimeout(() => window.print(), 60)
    })
  })

  document.querySelectorAll('[data-png]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const which = btn.dataset.png
      if (!window.htmlToImage) { rsToast('이미지 도구를 불러오지 못했습니다. 인쇄 → PDF로 저장해 주세요.'); return }
      const old = btn.innerHTML
      btn.disabled = true
      btn.innerHTML = '이미지 만드는 중…'
      try {
        const { node, width, name } = await rsBuildShot(which)
        await document.fonts.ready
        const dataUrl = await window.htmlToImage.toPng(node, {
          pixelRatio: 2,
          width,
          backgroundColor: '#FAF8F3',
          style: { transform: 'none' },
        })
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = name + '.png'
        a.click()
        rsToast('PNG로 저장했습니다.')
      } catch (err) {
        console.error(err)
        rsToast('이미지 저장에 실패했습니다. 인쇄 → PDF로 저장해 주세요.', 3600)
      } finally {
        btn.disabled = false
        btn.innerHTML = old
        const host = document.getElementById('capHost')
        if (host) host.remove()
      }
    })
  })
}

/* 캡처용 지면을 만들어 DOM에 붙이고 노드를 돌려준다 */
async function rsBuildShot(which) {
  const today = new Date()
  const stamp = `${today.getFullYear()}${pad2(today.getMonth() + 1)}${pad2(today.getDate())}`

  if (which === 'paper') {
    const paper = document.querySelector('.paper')
    if (!paper) throw new Error('paper not found')
    return { node: paper, width: 794, name: '이츠밀_위생관리점검표_' + stamp }
  }

  const host = document.createElement('div')
  host.id = 'capHost'
  host.className = 'capHost'

  const S = window.SEASON

  if (which === 'season') {
    const mbar = buildMonthBar()
    host.innerHTML = `
      <div class="capHead">
        <div>
          <h3>제철 도감 — 채소 · 수산물</h3>
          <p>산지별 출하 시기를 12개월 격자로 정리했습니다. 진한 칸은 제철, 수산물은 조업·유통 기간을 함께 표시했습니다.</p>
        </div>
        <div class="capHead__side">
          <img src="assets/logos/mil2-navy.svg" alt="이츠밀">
          <span>이츠밀 · ${today.getFullYear()}. ${pad2(today.getMonth() + 1)}.</span>
          <span>채소 ${S.veg.length}행 · 수산물 ${S.sea.length}품목</span>
        </div>
      </div>
      <div class="mBar">${mbar}</div>
      <div class="mBar__cap" style="margin-bottom:18px">
        <span><i></i>제철 품목 수</span>
        <span><i class="now"></i>${MONTH_NOW}월 (지금)</span>
      </div>
      <table class="tblSeason">
        <colgroup><col class="c-item"><col class="c-orig">
          ${Array.from({ length: 12 }, () => '<col class="c-m">').join('')}
          <col class="c-note">
        </colgroup>
        <thead><tr>
          <th class="h-item">품목</th><th class="h-orig">주요 산지</th>
          ${Array.from({ length: 12 }, (_, i) => `<th class="${i + 1 === MONTH_NOW ? 'is-now' : ''}">${i + 1}월</th>`).join('')}
          <th class="h-note">출하 시기</th>
        </tr></thead>
        <tbody>${buildSeasonBody('veg')}</tbody>
      </table>
      <div style="height:26px"></div>
      <table class="tblSeason">
        <colgroup><col class="c-item"><col class="c-orig">
          ${Array.from({ length: 12 }, () => '<col class="c-m">').join('')}
          <col class="c-note">
        </colgroup>
        <thead><tr>
          <th class="h-item">수산물</th><th class="h-orig">구분 · 산지</th>
          ${Array.from({ length: 12 }, (_, i) => `<th class="${i + 1 === MONTH_NOW ? 'is-now' : ''}">${i + 1}월</th>`).join('')}
          <th class="h-note">메모</th>
        </tr></thead>
        <tbody>${buildSeasonBody('sea')}</tbody>
      </table>
      <div class="capFoot">
        <span>진한 칸 = 성수기 · 제철 / 연한 칸 = 조업·유통 기간</span>
        <span>이츠밀이 자체 조사·정리했습니다. 해마다 기상에 따라 달라지니 실제 발주 전 그해 작황과 시세를 함께 보세요.</span>
        <span><img class="capQr" src="assets/qr/qr-season.svg" alt=""> itsmeal.co.kr</span>
      </div>`

    document.body.appendChild(host)
    await new Promise(r => setTimeout(r, 60))
    return { node: host, width: 1600, name: '이츠밀_제철도감_' + stamp }
  }

  if (which === 'tips') {
    const tips = Array.from(document.querySelectorAll('.tip')).map(t => t.outerHTML).join('')
    host.innerHTML = `
      <div class="capHead">
        <div>
          <h3>현장에서 자주 놓치는 위생 10가지</h3>
          <p>현장에서 놓치기 쉬운 항목만 골랐습니다. 잘못된 예와 바꿔야 할 한 가지를 나란히 두었습니다.</p>
        </div>
        <div class="capHead__side">
          <img src="assets/logos/mil2-navy.svg" alt="이츠밀">
          <span>이츠밀 · ${today.getFullYear()}. ${pad2(today.getMonth() + 1)}.</span>
          <span>10개 항목 · 개인위생 · 검수보관 · 세척소독</span>
        </div>
      </div>
      ${tips}
      <div class="capFoot">
        <span>이츠밀 정리 — 급식 위생 교육 요약</span>
        <span><img class="capQr" src="assets/qr/qr-tips.svg" alt=""> itsmeal.co.kr</span>
      </div>`
    document.body.appendChild(host)
    await new Promise(r => setTimeout(r, 60))
    return { node: host, width: 1600, name: '이츠밀_위생안전팁_' + stamp }
  }

  throw new Error('unknown target')
}
