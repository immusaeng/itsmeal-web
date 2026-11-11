// POST /api/contact — 상담 신청 접수.
// 1) D1에 먼저 저장(메일이 실패해도 문의는 남는다) 2) Resend로 담당자에게 알림 메일.
// 필요한 바인딩/변수: DB(D1), RESEND_API_KEY(secret), CONTACT_TO, CONTACT_FROM

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const clean = (v, max) => String(v ?? '').trim().slice(0, max)
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequestPost({ request, env }) {
  let b
  try { b = await request.json() } catch { return json({ error: 'bad_request' }, 400) }

  if (b.website) return json({ ok: true }) // 허니팟: 봇에게는 성공처럼 보이게 한다

  const f = {
    org: clean(b.org, 100),
    name: clean(b.name, 50),
    phone: clean(b.phone, 30),
    size: clean(b.size, 30),
    memo: clean(b.memo, 2000),
  }
  // 소개해 주신 분: 스키마 변경(마이그레이션) 없이 문의 내용 맨 앞에 붙여 저장한다.
  const ref = clean(b.ref, 100)
  if (ref) f.memo = `[소개해 주신 분] ${ref}\n${f.memo}`.trim()
  // /care(어르신 시설) 페이지에서 넘어온 문의 표시
  const care = b.src === 'care'
  if (care) f.memo = `[노인시설 문의]\n${f.memo}`.trim()
  if (!f.org || f.phone.replace(/\D/g, '').length < 9 || b.consent !== 'y') return json({ error: 'invalid' }, 422)

  // 같은 IP에서 10분에 5건 초과 차단. IP 원문은 저장하지 않고 해시만 둔다.
  const ipHash = await sha256(request.headers.get('cf-connecting-ip') ?? 'unknown')
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM inquiries WHERE ip_hash = ? AND created_at > datetime('now', '-10 minutes')"
  ).bind(ipHash).first()
  if (recent.n >= 5) return json({ error: 'rate_limited' }, 429)

  const row = await env.DB.prepare(
    'INSERT INTO inquiries (org, name, phone, size, memo, ip_hash) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(f.org, f.name, f.phone, f.size, f.memo, ipHash).run()

  let mailed = 0
  if (env.RESEND_API_KEY && env.CONTACT_TO && env.CONTACT_FROM) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          from: env.CONTACT_FROM,
          to: env.CONTACT_TO.split(',').map(s => s.trim()),
          subject: `[이츠밀 상담 신청${care ? ' · 노인시설' : ''}] ${f.org} · ${f.phone}`,
          html: `<table cellpadding="6" style="font:14px/1.6 sans-serif">
            <tr><td><b>시설명</b></td><td>${esc(f.org)}</td></tr>
            <tr><td><b>담당자</b></td><td>${esc(f.name)}</td></tr>
            <tr><td><b>연락처</b></td><td>${esc(f.phone)}</td></tr>
            <tr><td><b>시설 규모</b></td><td>${esc(f.size)}</td></tr>
            ${ref ? `<tr><td><b>소개해 주신 분</b></td><td style="background:#fff3cd">${esc(ref)}</td></tr>` : ''}
            <tr><td valign="top"><b>문의 내용</b></td><td>${esc(f.memo).replace(/\n/g, '<br>')}</td></tr></table>`,
        }),
      })
      mailed = res.ok ? 1 : 0
    } catch { /* 저장은 끝났으므로 메일 실패는 사용자에게 알리지 않는다 */ }
    if (mailed) await env.DB.prepare('UPDATE inquiries SET mail_sent = 1 WHERE id = ?').bind(row.meta.last_row_id).run()
  }

  return json({ ok: true })
}
