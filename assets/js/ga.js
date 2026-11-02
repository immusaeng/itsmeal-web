/* Google Analytics 4 — 측정 ID는 공개 값. 미리보기(pages.dev)·로컬은 집계하지 않는다.
   상담 폼 입력값은 전송하지 않는다(이벤트에는 페이지 이름만 담는다). */
(function () {
  var ID = 'G-TH6J7GJC7D'
  if (/\.pages\.dev$|^localhost$|^127\./.test(location.hostname)) return
  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false })
  var s = document.createElement('script')
  s.async = true
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID
  document.head.appendChild(s)

  var page = function () { return document.body.dataset.page || 'home' }
  window.gaEvent = function (name, params) { gtag('event', name, Object.assign({ loc: page() }, params || {})) }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('a[href^="tel:"], a[href^="mailto:"], button[data-print], [data-png]')
    if (!t) return
    if (t.matches('a[href^="tel:"]')) window.gaEvent('click_tel')
    else if (t.matches('a[href^="mailto:"]')) window.gaEvent('click_email')
    else if (t.matches('button[data-print]')) window.gaEvent('resource_print', { resource: page() })
    else window.gaEvent('resource_png', { resource: page() })
  })
})()
