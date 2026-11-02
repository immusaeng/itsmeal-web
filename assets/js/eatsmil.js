/* ═══════════════════════════════════════════════════════════════════════
   이츠밀 홈페이지 — 공통 스크립트
   내비/푸터 주입 · Lenis 스무스 스크롤 · GSAP 리빌 · 카운터 · 패럴랙스
   ═══════════════════════════════════════════════════════════════════════ */

const SITE = {
  phone: '010-7656-0301',
  phoneHref: 'tel:01076560301',
  kakao: '#',
  email: 'contact@itsmeal.co.kr',
  nav: [
    { href: '/promise', label: '네 가지 약속',  key: 'promise' },
    { href: '/menu',    label: '이달의 식단',   key: 'menu' },
    { href: '/story',   label: '브랜드 스토리', key: 'story' },
    { href: '/archive', label: '카탈로그 · 서류', key: 'archive' },
  ],
}

const arrowSVG = '<svg viewBox="0 0 17 17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.5h12M9.5 3.5 14.5 8.5 9.5 13.5"/></svg>'

function buildNav(active) {
  const dark = document.documentElement.dataset.navDark === 'true'
  const links = SITE.nav.map(n =>
    `<a href="${n.href}" class="${active === n.key ? 'is-active' : ''}">${n.label}</a>`
  ).join('')

  const nav = document.createElement('header')
  nav.className = 'nav' + (dark ? ' is-dark' : '')
  nav.id = 'siteNav'
  nav.innerHTML = `
    <div class="nav__in">
      <a class="nav__logo" href="/" aria-label="이츠밀 홈">
        <img class="logo-navy" src="/assets/logos/mil2-navy.svg" alt="이츠밀">
        <img class="logo-white" src="/assets/logos/mil2-white.svg" alt="" aria-hidden="true">
      </a>
      <nav class="nav__menu">${links}</nav>
      <a class="nav__cta" href="/#contact">상담 신청 ${arrowSVG}</a>
      <button class="nav__burger" aria-label="메뉴 열기" aria-expanded="false"><span></span></button>
    </div>`

  const sheet = document.createElement('div')
  sheet.className = 'navSheet'
  sheet.innerHTML = SITE.nav.map(n => `<a href="${n.href}">${n.label}</a>`).join('') +
    `<a href="/#contact">상담 신청</a>`

  document.body.prepend(sheet)
  document.body.prepend(nav)

  const burger = nav.querySelector('.nav__burger')
  burger.addEventListener('click', () => {
    const open = sheet.classList.toggle('is-open')
    burger.setAttribute('aria-expanded', String(open))
  })
  sheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    sheet.classList.remove('is-open')
    burger.setAttribute('aria-expanded', 'false')
  }))

  return nav
}

function buildFoot() {
  const box = document.querySelector('[data-foot]')
  if (!box) return
  box.className = 'foot'
  box.innerHTML = `
    <div class="wrap">
      <div class="foot__top">
        <div>
          <img class="foot__logo" src="/assets/logos/mil2-white.svg" alt="이츠밀">
          <p class="foot__tag">아이들 밥상은 든든하게,<br>원장님의 운영 고민은 가볍게.</p>
        </div>
        <div>
          <h5>바로가기</h5>
          <ul>
            ${SITE.nav.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}
            <li><a href="/#contact">상담 · 견적 신청</a></li>
          </ul>
        </div>
        <div>
          <h5>문의</h5>
          <ul>
            <li><a href="${SITE.phoneHref}">${SITE.phone}</a></li>
            <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
            <li>평일 09:00 – 18:00</li>
          </ul>
        </div>
      </div>
      <div class="foot__bar">
        <span>이츠밀 · it's meal &nbsp;|&nbsp; 동원홈푸드 공식 파트너</span>
        <span><a href="/privacy">개인정보 처리방침</a> &nbsp;|&nbsp; © 2026 Eats Mil. All rights reserved.</span>
      </div>
    </div>`
}

/* ── 카운터 ───────────────────────────────────────────────────────── */
function initCounters() {
  const els = Array.from(document.querySelectorAll('[data-count]'))
  if (!els.length) return

  const run = el => {
    const to = parseFloat(el.dataset.count)
    const dec = parseInt(el.dataset.dec || '0', 10)
    const dur = 1500
    const t0 = performance.now()
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 4)
      const v = to * eased
      el.textContent = v.toLocaleString('ko-KR', {
        minimumFractionDigits: dec, maximumFractionDigits: dec,
      })
      if (p < 1) requestAnimationFrame(tick)
      else el.textContent = to.toLocaleString('ko-KR', {
        minimumFractionDigits: dec, maximumFractionDigits: dec,
      })
    }
    requestAnimationFrame(tick)
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    els.forEach(el => {
      el.textContent = parseFloat(el.dataset.count).toLocaleString('ko-KR')
    })
    return
  }

  els.forEach(el => { el.textContent = '0' }) // HTML에는 최종값이 들어 있고, 스크립트가 켜진 환경에서만 0부터 올라간다
  const pending = new Set(els)
  let ticking = false
  const check = () => {
    ticking = false
    const vh = window.innerHeight || document.documentElement.clientHeight
    pending.forEach(el => {
      const r = el.getBoundingClientRect()
      if (r.top < vh * 0.92) {
        run(el)
        pending.delete(el)
      }
    })
    if (!pending.size) {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearInterval(poll)
    }
  }
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(check)
  }
  const poll = setInterval(check, 320)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  check()
  setTimeout(check, 400)
  // 안전장치 — 어떤 이유로도 '0'이 남아 보이지 않게
  setTimeout(() => {
    pending.forEach(el => {
      el.textContent = parseFloat(el.dataset.count).toLocaleString('ko-KR')
    })
    pending.clear()
  }, 2600)
}

/* ── 스크롤 리빌 ───────────────────────────────────────────────────── */
function initReveal() {
  const items = Array.from(document.querySelectorAll('[data-reveal]'))
  if (!items.length) return
  const pending = new Set(items)
  let ticking = false

  const check = () => {
    ticking = false
    const vh = window.innerHeight || document.documentElement.clientHeight
    pending.forEach(el => {
      const r = el.getBoundingClientRect()
      // 화면 안에 들어왔거나 이미 지나간 요소도 노출 (되돌아올 때 빈 화면 방지)
      if (r.top < vh * 0.94) {
        el.classList.add('is-in')
        pending.delete(el)
      }
    })
    if (!pending.size) {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearInterval(poll)
    }
  }
  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(check)
  }
  // 스크롤 이벤트가 없는 환경(강제 점프·캡처 등)에서도 놓치지 않도록 주기 점검
  const poll = setInterval(check, 320)

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  check()
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(check, 120))
  setTimeout(check, 600)
}

/* ── 내비 상태 ─────────────────────────────────────────────────────── */
function initNavState(nav) {
  const solidAt = parseInt(document.documentElement.dataset.navSolid || '40', 10)
  const onScroll = () => {
    nav.classList.toggle('is-solid', window.scrollY > solidAt)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
}

/* ── 스무스 스크롤 + 패럴랙스 ───────────────────────────────────────── */
function initMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  let lenis = null
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.05, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    window.__lenis = lenis
  }

  // 같은 페이지 내 앵커 이동
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', ev => {
      const id = a.getAttribute('href')
      if (id.length < 2) return
      const t = document.querySelector(id)
      if (!t) return
      ev.preventDefault()
      if (lenis) lenis.scrollTo(t, { offset: -70 })
      else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' })
    })
  })

  if (!window.gsap || !window.ScrollTrigger) return
  gsap.registerPlugin(ScrollTrigger)
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(t => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  // 패럴랙스 — data-parallax="0.18"
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const amt = parseFloat(el.dataset.parallax) || 0.15
    const img = el.querySelector('img') || el
    gsap.fromTo(img,
      { yPercent: -amt * 50 },
      {
        yPercent: amt * 50,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      })
  })

  // 히어로 스케일 아웃
  const hero = document.querySelector('[data-hero-media]')
  if (hero) {
    gsap.to(hero, {
      scale: 1.12, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: document.querySelector('[data-hero]'), start: 'top top', end: 'bottom top', scrub: true },
    })
  }

  // 가로 스크롤 스트립
  document.querySelectorAll('[data-hscroll]').forEach(track => {
    const dist = () => track.scrollWidth - track.clientWidth
    if (dist() <= 4) return
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: track.parentElement, start: 'top 78%', end: 'bottom 20%', scrub: 1 },
    })
  })
}

/* ── 히어로 타이포 스태거 ──────────────────────────────────────────── */
function initHeroLoad() {
  const lines = document.querySelectorAll('[data-hero-line]')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!lines.length) return
  lines.forEach((el, i) => {
    el.style.transitionDelay = reduce ? '0ms' : `${180 + i * 110}ms`
  })
  requestAnimationFrame(() => {
    setTimeout(() => lines.forEach(el => el.classList.add('is-in')), 60)
  })
  const others = document.querySelectorAll('[data-hero-fade]')
  others.forEach((el, i) => {
    el.style.transitionDelay = reduce ? '0ms' : `${620 + i * 100}ms`
  })
  setTimeout(() => others.forEach(el => el.classList.add('is-in')), 80)
}

/* ── 부팅 ──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const active = document.body.dataset.page || ''
  const nav = buildNav(active)
  buildFoot()
  initNavState(nav)
  initReveal()
  initCounters()
  initHeroLoad()
  initMotion()
})
