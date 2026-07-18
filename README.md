# modax.app

Marketing site for **MODAX** — the modular CRM platform. Static, dependency-free,
and built to deploy on **Cloudflare Pages** with no build step.

## Structure

```
index.html      the page
styles.css      styles (light + dark via prefers-color-scheme)
favicon.svg     brand mark
_headers        Cloudflare Pages security + cache headers
robots.txt      / sitemap.xml
```

The app itself lives at **app.modax.app** — every CTA points there
(`/signup`, `/signin`). Update those links if the app is hosted elsewhere.

## Deploy on Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the `khatibdesigns/modax.app` repo.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Deploy. Then **Custom domains → Set up a custom domain → `modax.app`**
   (and `www.modax.app`). DNS is already on Cloudflare, so it verifies automatically.

Every push to `main` redeploys.

### App subdomain (for the CTAs to work)

Point **app.modax.app** at the deployed MODAX web app (a separate Pages/Workers
project or origin). Until then the `Start free` / `Sign in` buttons will 404.

## Local preview

No tooling needed — open `index.html`, or:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```
