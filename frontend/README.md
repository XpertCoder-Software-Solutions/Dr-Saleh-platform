# منصة د. صالح عبد الكريم — Frontend

React 19 + TypeScript + Vite + Tailwind CSS v4, talking to the NestJS backend (`Dr-Saleh-Platform-BackEnd`).

## Run

```bash
cp .env.example .env      # defaults work for local dev
npm install
npm run dev               # http://localhost:5173, proxies /api and /uploads to localhost:3000
```

`npm run build` type-checks and builds to `dist/`. `npm run lint` runs ESLint, `npm run format` runs Prettier (it also sorts Tailwind classes).

If port 3000 is taken on your machine (for example by another project), run the
backend on another port and point the dev server at it in `.env.local`:

```bash
VITE_DEV_BACKEND_URL=http://localhost:3100
```

The backend needs PostgreSQL and Redis and its migrations applied
(`npx prisma migrate deploy` in the backend repo). Without the backend the site
still renders, but every list shows its error state.

In production set `VITE_API_URL` to the full API URL including `/api`
(for example `https://api.drsaleh.com/api`) and add the site origin to the
backend's `CORS_ALLOWED_ORIGINS`.

## Structure

| Path | What's there |
|---|---|
| `src/api/client.ts` | axios instance: unwraps `{ success, message, data }`, refreshes the access token once on 401, then retries; `resolveAssetUrl()` for `/uploads/...` paths |
| `src/api/endpoints.ts` | typed calls per backend module |
| `src/types/api.ts` | response types (copied from the backend's `docs/frontend/dr-saleh-api.types.ts`) |
| `src/auth/` | `AuthProvider`, `useAuth()`, and `useCopy()` for gender-aware copy |
| `src/copy/strings.ts` | every gendered string, in three versions: guest (neutral), male, female |
| `src/styles/index.css` | Tailwind entry: design tokens in `@theme` (colors, fonts, radii, shadows, animations) and the brand utilities (`bg-navy`, `glass`, `dots`, `glow-card`, `text-sheen`…) |
| `src/components/ui/button.ts` | shared class strings: `buttonClass()`, inputs, section spacing, pill tabs |
| `src/components/` | header, footer, page hero, CTA band, course cover/card, icons, empty/error states |
| `src/app/router.tsx` | every route, lazy-loaded; `routes.ts` builds the URLs |
| `src/pages/` | public site: home, courses, books, store, articles, consultations, about, contact, legal, cart, checkout |
| `src/pages/account/` | student area: dashboard, my courses + lesson player, my books, orders (with shipping steps) + printable invoice, certificates, consultations, profile |
| `src/pages/admin/` | admin panel: dashboard, students, courses + lessons, catalog (books/products/categories/coupons), articles, orders (shipping, refunds, CSV export), consultation requests and schedule, settings |
| `src/lib/` | helpers: formatting, order/consultation status labels, CSV export, header-bell activity feed |

## Gendered copy

The design's rule: an account with gender `Female` sees feminine copy, `Male`
sees masculine, and guests (or accounts without gender) see neutral copy.
Add new strings to `src/copy/strings.ts` with all three versions and read them
with `const t = useCopy(); t('cta.start')`.

## Styling

Everything is Tailwind utilities in the components; there are no per-component CSS files.
Colors and sizes come from the design tokens, so prefer `text-ink`, `bg-surface`,
`rounded-card`, `shadow-pop` over raw values. Use `cn()` from `src/lib/cn.ts` to
combine conditional classes.

## Payments and orders

Orders become paid only through the payment gateway callback (Paymob); the admin
cannot mark an order paid by hand. From the admin orders page they can cancel an
unpaid order, record a refund, and for orders with physical items set the
shipping status (preparing → shipped → delivered), carrier and tracking number.
Students see those steps on their orders page and in the header bell.

## Deploying (Vercel)

The repo has a `vercel.json` (Vite build, every route rewritten to `index.html`
for client-side routing). In the Vercel project set:

- `VITE_API_URL` = the API URL including `/api` (for example `https://api.example.com/api`)

and add the Vercel domain to the backend's `CORS_ALLOWED_ORIGINS`.

## Checks before pushing

```bash
npm run typecheck && npm run lint && npm run build
```
