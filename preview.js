// Live-preview client for the super-admin Website editor. It runs ONLY when the
// page is loaded inside the editor's iframe (?cmsPreview=1 + framed) — real
// visitors never trigger it. It applies draft copy posted from the admin panel
// over the same data-cms tags the edge middleware rewrites, so unsaved edits
// preview instantly. Baseline is the already-saved copy the edge injected, so a
// blank field restores what the visitor currently sees.
(function () {
  if (!/[?&]cmsPreview=1/.test(location.search) || window.parent === window) return

  var ALLOWED = /^https:\/\/([a-z0-9-]+\.)?(pages\.dev|modax\.app)$|^http:\/\/localhost(:\d+)?$/i

  // Capture the element's own (edge-injected) content once, so resets restore it.
  function orig(el, kind, attr) {
    var slot = '__cms_' + kind + (attr ? '_' + attr : '')
    if (el[slot] === undefined) el[slot] = attr ? el.getAttribute(attr) : el.innerHTML
    return el[slot]
  }
  function esc(s) { return String(s).replace(/&(?![a-z#])/gi, '&amp;') }

  function apply(content) {
    content = content || {}
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var k = el.getAttribute('data-cms'), o = orig(el, 'html')
      var v = content[k]
      el.innerHTML = (typeof v === 'string' && v.trim()) ? v : o
    })
    document.querySelectorAll('[data-cms-list]').forEach(function (el) {
      var k = el.getAttribute('data-cms-list'), o = orig(el, 'list')
      var v = content[k]
      if (typeof v === 'string' && v.trim()) {
        el.innerHTML = v.split('\n').map(function (l) { return l.trim() }).filter(Boolean)
          .map(function (l) { return '<li>' + esc(l) + '</li>' }).join('')
      } else el.innerHTML = o
    })
    document.querySelectorAll('[data-cms-attr]').forEach(function (el) {
      var spec = el.getAttribute('data-cms-attr') || '', i = spec.indexOf(':')
      if (i < 1) return
      var attr = spec.slice(0, i), k = spec.slice(i + 1), o = orig(el, 'attr', attr)
      var v = content[k]
      if (typeof v === 'string' && v.trim()) el.setAttribute(attr, v)
      else if (o != null) el.setAttribute(attr, o)
    })
  }

  window.addEventListener('message', function (e) {
    if (!ALLOWED.test(e.origin) || !e.data || e.data.type !== 'cms-preview') return
    apply(e.data.content)
  })

  // Tell the editor we're listening (survives onload/attach races).
  try { window.parent.postMessage({ type: 'cms-preview-ready' }, '*') } catch (_) {}
})()
