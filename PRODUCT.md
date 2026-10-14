# Product

<!-- impeccable:product-schema 1 -->

> Written 2026-10-14 from repository evidence and earlier sessions with the owner; device split, affiliate placement and evidence confirmed by the owner the same day.

## Platform

web

## Users

- **Primary:** Vietnamese online shoppers who buy on Shopee, Lazada and TikTok Shop and want to pay the right price. Non-technical people (the owner names artists, accountants, architects): they will not read instructions, tune settings or understand jargon. **Phones and desktops equally** (confirmed): links are copied from the marketplace app on a phone or from the website on a laptop; both must be first-class.
- **Job:** "The thing I want: what does it cost right now, is that a good price, and when should I buy?"
- **Secondary:** deal hunters who also use the DealHunter Assistant Chrome extension (voucher drops, flash sales, check-ins on time).

## Product Purpose

Paste a product link, see the real current price read from the marketplace, keep its price history, compare the same product across marketplaces, and get told (web notification or Zalo) when it drops or reaches the price you want. Success: a visitor gets a real answer for their own product within seconds, without signing up, and comes back because the alerts and history are trustworthy.

## Positioning

Prices are read directly from the marketplace pages and kept as a history of real checks: no estimated prices, no fake "was" prices, no sample data. A visitor can try it immediately as a guest; signing in (Google) only keeps their list across devices.

## Operating Context

- Entry: the visitor copies a link from the Shopee / Lazada / TikTok Shop app or website (share → copy link) and pastes it.
- Guests get a server-issued guest session automatically; Google sign-in migrates guest data to the member account.
- Alerts: in-app notifications and Zalo (ZNS) once the user links a phone number with a 6-digit code.
- Companion: the DealHunter Assistant Chrome extension (receives the web sign-in; shows a price badge on marketplace product pages).
- Domain: `dealhunter.io.vn`.

## Capabilities and Constraints

- Routes: `/` (home: paste link, try as guest), `/tracking` (tracked products), `/tracking/[id]` (product: price history chart, target price alert, cross-marketplace comparison, vouchers, match suggestions), `/notifications`, `/settings` (account, Zalo link, language).
- Stack: Next.js 14 App Router, React 18, Tailwind 3, TanStack Query, Recharts, lucide-react. Bilingual dictionaries (`lib/i18n`, Vietnamese default, English).
- Price reading is asynchronous: a new tracking gets its first price from the worker shortly after it is created; the UI must show real progress, never a made-up price.
- Monetisation: every "Buy on <marketplace>" action goes through the owner's affiliate link (`AffiliateURL` from the API when affiliate is configured, otherwise the canonical link). It is the revenue action, so it is present and plainly visible on every product, without ads or pressure tactics (confirmed).
- No mock data in product code (owner rule).

## Brand Commitments

- Name **DealHunter**; tagline in use: «Săn đúng giá trước khi mua» / «Săn đúng giá. Mua đúng lúc.»
- Logo: a wolf head in deep pine and teal with a magnifying glass over a price tag (`public/logo.png`, `public/icon*.png`).
- Brand colours from the logo: deep pine `#0A3832`, teal `#1A9988`, white. The logo is flat, sharp-cut vector art with no gradients or shadows; its price tag (cut corner, round hole) is a brand shape. The site must match the logo (owner request). Typeface in use: Be Vietnam Pro (chosen for Vietnamese diacritics).
- Voice: plain Vietnamese a non-technical person understands at once; no jargon, no hype.

## Evidence on Hand

- Real: the product's own interface and the user's own tracked products and prices (only when the visitor has them).
- **Absent and must not be fabricated (confirmed: none exists):** user counts, testimonials, reviews, press, partner logos, savings statistics, sample products or prices.

## Product Principles

1. A real answer for the visitor's own product beats any explanation of the product.
2. Every number on screen is read from a marketplace or the visitor's own data; when there is no number yet, say so.
3. Plain words for non-technical shoppers; one obvious action per screen.
4. Trust before conversion: buying through DealHunter is offered, never pushed.

## Accessibility & Inclusion

Vietnamese-first with full diacritics at every size; readable on low-end Android phones over mobile data; visible focus and real buttons/links; respects reduced motion.
