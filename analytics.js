/* ============================================================
   MODAX — GA4 + funnel-event + Google Ads conversion tracking.

   The site ran with no analytics of any kind until 17 Oct 2026, so there is
   no history to compare against: every number here starts on that date, and
   anything that looks like a trend before mid-November is noise.

   GA4 property 559397599, web stream 16147742629 — deliberately separate from
   khatibdesigns.com (G-HNDZLK8C8S), because two products in one property makes
   both reports useless.

   Mark these as key events in GA4 once data arrives: generate_lead first,
   then signup_click. Everything else is diagnostic, not a goal.

   Google Ads conversions stay dormant until ADS_ID and the matching labels are
   pasted in; GA4 keeps working either way. Blanking GA_ID disables the whole
   file safely — modaxTrack stays defined, so the contact form never throws.
   ============================================================ */
(function () {
  var GA_ID  = 'G-EMSQHMC6GT';                // modax.app web stream
  var ADS_ID = '';                            // ← e.g. 'AW-1234567890', only if Ads runs
  var ADS_LABELS = {                          // per-conversion labels from Google Ads
    generate_lead:  '',                       // contact form submitted  ← PRIMARY
    signup_click:   '',                       // tapped "Start free"     ← secondary
    demo_click:     '',                       // tapped "See it live"
    whatsapp_click: '',                       // any WhatsApp tap
    email_click:    ''                        // mailto CTA
  };

  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];

  // First-touch attribution, captured before anything else and held for the
  // session. This is what makes paid traffic answerable: without it a lead in
  // contact_leads is just a name, and there is no way to tell which campaign
  // — or which language — produced it.
  var attribution = {};
  try {
    var qs = new URLSearchParams(location.search);
    var stored = JSON.parse(sessionStorage.getItem('modax_attr') || '{}');
    UTM_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) stored[k] = v;
      if (stored[k]) attribution[k] = stored[k];
    });
    sessionStorage.setItem('modax_attr', JSON.stringify(stored));
  } catch (e) { /* private mode / storage blocked → attribution is just empty */ }

  // The locale is a first-class dimension here, not a nicety: MODAX sells into
  // a bilingual market and nobody yet knows whether Arabic or English brings
  // the buyers. Every event carries it so that question answers itself.
  var locale = location.pathname.indexOf('/ar') === 0 ? 'ar' : 'en';
  attribution.site_locale = locale;
  window.modaxAttribution = attribution;

  // Defined unconditionally — the contact form calls this on a successful
  // submit, and it must never throw just because GA is not configured yet.
  var ready = false;
  window.modaxTrack = function (name, params) {
    if (!ready) return;
    var p = params || {};
    p.site_locale = locale;
    UTM_KEYS.forEach(function (k) { if (attribution[k] && !p[k]) p[k] = attribution[k]; });
    window.gtag('event', name, p);
    var label = ADS_LABELS[name];
    if (ADS_ID && label) window.gtag('event', 'conversion', { send_to: ADS_ID + '/' + label });
  };

  if (!GA_ID) return;                         // not configured → stop here, no network calls
  ready = true;

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  // ---- consent (GDPR) ------------------------------------------------------
  // Consent Mode v2. In the EEA/UK/CH, analytics and ads storage stay denied
  // until the visitor accepts; elsewhere they default to granted. The banner is
  // shown only when the browser's timezone is European (GCC visitors never see
  // it) and can be reopened from the privacy page via khdConsent.open().
  // The choice is kept in localStorage 'khd_consent' ('granted' | 'denied').
  var EEA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'];
  var DENY  = { ad_storage: 'denied',  ad_user_data: 'denied',  ad_personalization: 'denied',  analytics_storage: 'denied' };
  var ALLOW = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  var withRegion = { region: EEA, wait_for_update: 500 };
  for (var k in DENY) withRegion[k] = DENY[k];
  gtag('consent', 'default', withRegion);
  gtag('consent', 'default', ALLOW);
  var saved = null;
  try { saved = localStorage.getItem('khd_consent'); } catch (e) { /* storage blocked */ }
  if (saved === 'granted') gtag('consent', 'update', ALLOW);
  if (saved === 'denied') gtag('consent', 'update', DENY);

  function choose(v) {
    try { localStorage.setItem('khd_consent', v); } catch (e) { /* storage blocked */ }
    gtag('consent', 'update', v === 'granted' ? ALLOW : DENY);
    var b = document.getElementById('khd-consent');
    if (b) b.parentNode.removeChild(b);
  }
  function banner() {
    if (document.getElementById('khd-consent')) return;
    var ar = (document.documentElement.lang || '').indexOf('ar') === 0;
    var t = ar
      ? { msg: 'نستخدم ملفات تعريف الارتباط من Google Analytics لفهم استخدام الموقع. لن نفعّلها إلا بموافقتك.', more: 'سياسة الخصوصية', yes: 'موافق', no: 'رفض' }
      : { msg: 'We use Google Analytics cookies to understand how this site is used. They stay off unless you agree.', more: 'Privacy policy', yes: 'Accept', no: 'Reject' };
    var d = document.createElement('div');
    d.id = 'khd-consent';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-label', ar ? 'ملفات تعريف الارتباط' : 'Cookies');
    d.dir = ar ? 'rtl' : 'ltr';
    d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;' +
      'background:#111;color:#f5f5f5;border:1px solid #333;border-radius:12px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.35);' +
      'font:14px/1.5 system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center';
    var p = document.createElement('p');
    p.style.cssText = 'margin:0;flex:1 1 260px';
    p.appendChild(document.createTextNode(t.msg + ' '));
    var a = document.createElement('a');
    a.href = '/privacy'; a.textContent = t.more;
    a.style.cssText = 'color:#ff9a4d;text-decoration:underline';
    p.appendChild(a);
    d.appendChild(p);
    [[t.no, 'denied'], [t.yes, 'granted']].forEach(function (x) {
      var btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = x[0];
      btn.style.cssText = 'font:inherit;font-weight:600;padding:8px 16px;border-radius:8px;cursor:pointer;min-height:40px;' +
        'border:1px solid #ff9a4d;' + (x[1] === 'granted' ? 'background:#ff9a4d;color:#111' : 'background:transparent;color:#f5f5f5');
      btn.addEventListener('click', function () { choose(x[1]); });
      d.appendChild(btn);
    });
    document.body.appendChild(d);
  }
  window.khdConsent = { open: banner, choose: choose };
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* old browser */ }
  var euTz = /^(Europe\/|Atlantic\/(Reykjavik|Canary|Madeira|Azores|Faroe))/.test(tz) &&
    !/^Europe\/(Istanbul|Moscow|Minsk|Kiev|Kyiv|Simferopol|Volgograd|Samara|Ulyanovsk|Astrakhan|Saratov|Kirov)$/.test(tz);
  if (!saved && euTz) {
    if (document.body) banner(); else document.addEventListener('DOMContentLoaded', banner);
  }


  var cfg = { anonymize_ip: true, site_locale: locale };
  if (attribution.utm_campaign) cfg.campaign_name   = attribution.utm_campaign;
  if (attribution.utm_source)   cfg.campaign_source = attribution.utm_source;
  if (attribution.utm_medium)   cfg.campaign_medium = attribution.utm_medium;
  gtag('config', GA_ID, cfg);
  if (ADS_ID) gtag('config', ADS_ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  // ---- funnel events -------------------------------------------------------
  // Order matters: the most specific test must win, because /signup and /try
  // links are also .btn elements that would match a looser rule below them.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    // Sign-in is an EXISTING customer, never a conversion. Caught first so it
    // can't be mistaken for acquisition by the app.modax.app rules below.
    var signin = t.closest('a[href*="app.modax.app/signin"]');
    if (signin) { window.modaxTrack('signin_click', { transport_type: 'beacon' }); return; }

    var signup = t.closest('a[href*="app.modax.app/signup"]');
    if (signup) {
      window.modaxTrack('signup_click', {
        transport_type: 'beacon',
        cta_location: signup.getAttribute('data-cms') || 'inline'
      });
      return;
    }

    var demo = t.closest('a[href*="app.modax.app/try"]');
    if (demo) {
      window.modaxTrack('demo_click', {
        transport_type: 'beacon',
        cta_location: demo.getAttribute('data-cms') || 'inline'
      });
      return;
    }

    var wa = t.closest('a[href*="wa.me"]');
    if (wa) { window.modaxTrack('whatsapp_click', { transport_type: 'beacon', link_url: wa.href }); return; }

    var mail = t.closest('a[href^="mailto:"]');
    if (mail) { window.modaxTrack('email_click', { transport_type: 'beacon' }); return; }

    var price = t.closest('a[href*="#pricing"]');
    if (price) { window.modaxTrack('view_pricing', { cta_location: price.closest('nav') ? 'nav' : 'inline' }); return; }

    // Only CTAs, not navigation. A .btn is a CTA wherever it sits; a bare
    // #contact link only counts outside nav and footer, which is where the
    // in-prose calls to action are and where the chrome links are not.
    var contact = t.closest('a[href*="#contact"]');
    if (contact) {
      var isBtn = contact.classList && contact.classList.contains('btn');
      if (isBtn || !contact.closest('nav, footer')) {
        window.modaxTrack('cta_contact', { cta_location: isBtn ? 'button' : 'inline' });
      }
      return;
    }

    var lang = t.closest('a[href="/ar/"], a[href="/"], a[href^="/ar"]');
    if (lang && lang.getAttribute('href') !== location.pathname) {
      window.modaxTrack('lang_switch', { to: lang.getAttribute('href').indexOf('/ar') === 0 ? 'ar' : 'en' });
    }
  }, true);

  // Did anyone even get as far as the form? If traffic arrives and this never
  // fires, the page is losing people above the fold and no amount of extra
  // traffic will fix it. Fires once per visit.
  try {
    var target = document.getElementById('contact');
    if (target && 'IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (entries, obs) {
        if (seen || !entries.some(function (en) { return en.isIntersecting })) return;
        seen = true;
        window.modaxTrack('view_contact_section', {});
        obs.disconnect();
      // threshold 0, not a fraction. The contact section is a tall block — on a
      // 254px-high window it reflows past 1300px — and a section taller than
      // 1/t of the viewport can never reach threshold t, so anything above 0
      // silently stops reporting on exactly the small screens most likely to
      // abandon. "Any part of it came into view" is the question anyway.
      }, { threshold: 0 }).observe(target);
    }
  } catch (e) { /* no IO → skip, nothing else depends on it */ }
})();
