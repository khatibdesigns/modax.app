// Edge CMS injection. On every HTML response, fetch the super-admin-edited
// marketing copy from the MODAX API (edge-cached ~60s) and rewrite the elements
// tagged `data-cms="<key>"` in place — SEO-clean, no flash. If a key is unset or
// the API is unreachable, the copy baked into the HTML shows unchanged.
const SITE_API = 'https://api.modax.app/public/site'

async function fetchContent() {
  try {
    const r = await fetch(SITE_API, { cf: { cacheTtl: 60, cacheEverything: true } })
    if (!r.ok) return null
    const data = await r.json()
    return data && typeof data.content === 'object' ? data.content : null
  } catch { return null }
}

export async function onRequest(context) {
  const response = await context.next()
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('text/html')) return response

  // Never let a slow/down API block the page — fall back to the baked-in copy.
  const content = await Promise.race([
    fetchContent(),
    new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
  ])
  if (!content || !Object.keys(content).length) return response

  return new HTMLRewriter()
    .on('[data-cms]', {
      element(el) {
        const key = el.getAttribute('data-cms')
        const val = key ? content[key] : null
        if (typeof val === 'string' && val) el.setInnerContent(val, { html: true })
      },
    })
    .transform(response)
}
