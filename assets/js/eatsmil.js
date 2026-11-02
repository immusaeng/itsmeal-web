/* ═══════════════════════════════════════════════════════════════════════
   이츠밀 홈페이지 — 공통 스크립트
   내비 동작 · Lenis 스무스 스크롤 · GSAP 리빌 · 카운터 · 패럴랙스
   ═══════════════════════════════════════════════════════════════════════ */

/* ── 내비 동작 (마크업은 build-static.mjs가 HTML에 써 넣는다) ───────────── */
function initNav() {
  const nav = document.getElementById('siteNav')
  const sheet = document.querySelector('.navSheet')
  const burger = nav && nav.querySelector('.nav__burger')
  if (!nav || !sheet || !burger) return nav
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
/* ── 모바일 하단 바: 상담 폼이 화면에 있으면 숨기고, 현재 지면 표시 ─────── */
/* ── 추천 식단 제목의 '월'은 방문한 달로 맞춘다(식단표 내용은 동원이팜 자료가 오면 직접 갱신) ── */
function initMonthLabel() {
  const m = new Date().getMonth() + 1 + '월'
  document.querySelectorAll('[data-month-label]').forEach(el => { el.textContent = m })
}

function initMbar() {
  const bar = document.getElementById('mbar')
  if (!bar) return
  const here = location.pathname.replace(/\/$/, '') || '/'
  bar.querySelectorAll('a').forEach(a => { if ((a.getAttribute('href') || '') === here) a.classList.add('is-active') })
  const form = document.getElementById('contact')
  if (form && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => bar.classList.toggle('is-hidden', e.isIntersecting)), { threshold: 0.25 }).observe(form)
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMbar()
  initMonthLabel()
  const nav = initNav()
  if (nav) initNavState(nav)
  initReveal()
  initCounters()
  initHeroLoad()
  initMotion()
})
