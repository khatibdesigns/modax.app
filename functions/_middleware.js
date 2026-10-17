// Edge CMS injection. On every HTML response, fetch the super-admin-edited copy
// from the MODAX API (edge-cached ~60s) and rewrite the tagged elements in place
// for the request's language (/ar → Arabic, else English) — SEO-clean, no flash.
// If a key is unset or the API is unreachable, the copy baked into the HTML shows.
//
//   data-cms="key"            → replace inner content (text/HTML)
//   data-cms-list="key"       → build a <ul>: one <li> per newline in the value
//   data-cms-attr="attr:key"  → set an attribute (e.g. src, or a meta's content)
const SITE_API = 'https://api.modax.app/public/site'

async function fetchContent() {
  try {
    const r = await fetch(SITE_API, { cf: { cacheTtl: 60, cacheEverything: true } })
    if (!r.ok) return null
    const data = await r.json()
    return data && typeof data.content === 'object' ? data.content : null
  } catch { return null }
}

const esc = (s) => String(s).replace(/&(?![a-z#])/gi, '&amp;')

export async function onRequest(context) {
  // www.modax.app is now a custom domain on this same project, so without this
  // it serves a second complete copy of the site — two hosts competing for the
  // same rankings on a site that has none yet to spare. One canonical host,
  // everything else 301s to it with path and query intact.
  //
  // Matched on the exact hostname rather than a /^www\./ pattern so that
  // *.pages.dev preview deployments keep working: a blanket redirect to the
  // apex would make every preview URL un-previewable.
  const reqUrl = new URL(context.request.url)
  if (reqUrl.hostname === 'www.modax.app') {
    reqUrl.hostname = 'modax.app'
    return Response.redirect(reqUrl.toString(), 301)
  }

  const response = await context.next()
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return response

  const content = await Promise.race([
    fetchContent(),
    new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
  ])
  if (!content) return response

  const path = new URL(context.request.url).pathname
  const locale = path === '/ar' || path.startsWith('/ar/') ? 'ar' : 'en'
  const map = (content[locale] && typeof content[locale] === 'object') ? content[locale] : {}
  if (!Object.keys(map).length) return response

  return new HTMLRewriter()
    .on('[data-cms]', {
      element(el) {
        const v = map[el.getAttribute('data-cms')]
        if (typeof v === 'string' && v) el.setInnerContent(v, { html: true })
      },
    })
    .on('[data-cms-list]', {
      element(el) {
        const v = map[el.getAttribute('data-cms-list')]
        if (typeof v === 'string' && v.trim()) {
          const html = v.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `<li>${esc(l)}</li>`).join('')
          if (html) el.setInnerContent(html, { html: true })
        }
      },
    })
    .on('[data-cms-attr]', {
      element(el) {
        const spec = el.getAttribute('data-cms-attr') || ''
        const idx = spec.indexOf(':')
        if (idx < 1) return
        const attr = spec.slice(0, idx)
        const v = map[spec.slice(idx + 1)]
        if (typeof v === 'string' && v) el.setAttribute(attr, v)
      },
    })
    .transform(response)
}
