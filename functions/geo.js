// Cloudflare Pages Function — same-origin /geo. Visitor country (ISO-2) from
// Cloudflare edge geolocation. No external service, no PII stored.
export function onRequest(context) {
  const req = context.request
  const country = req.cf?.country || req.headers.get('cf-ipcountry') || null
  return new Response(JSON.stringify({ country }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  })
}
