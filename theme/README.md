# Vance & Hyde — Designer Menswear Shopify Theme

A premium, fully editable Online Store 2.0 theme for a designer menswear brand, built following the shopify-premium-builder playbook: strategy → design system → conversion-engineered pages → editable theme code → launch QA.

## Strategy (Phase 0–1)

**Customer:** men 28–50 who've outgrown fast fashion and are willing to pay 2–3x for pieces that last — they're shopping on *fit, material honesty, and longevity*, not trend. They're skeptical of marketing fluff and respond to specifics (fabric weight, construction detail, real customer measurements).

**Positioning:** "Tailoring for the way you actually live" — considered, mill-woven, made to be kept. Not streetwear, not fast fashion, not stuffy heritage menswear. The brand voice is confident and specific, never hype-y.

**Sitemap → conversion goal per page:**
| Page | Job |
|---|---|
| Home | Route to category/bestsellers, establish premium positioning fast |
| Collection | Help choose (filters, flags) |
| Product | Close the sale (full playbook applied — see below) |
| Cart | Recover momentum, surface free-shipping threshold |
| About/Page | Build trust via brand story |

**Top objections mapped to page placement:** worth-the-price → benefit specifics in PDP description blocks; will-it-fit → size guide drawer + true-to-size copy; can-I-trust-this-store → reviews with photos and merchant replies; shipping cost/time → reassurance line under Add to Bag + free-shipping progress bar in cart.

## Design system (Phase 2)

- **Color:** warm neutral ramp (off-white `#FAF9F7` / soft near-black `#1A1A18`) carries ~70% of the UI. A deep olive brand scheme (`#2C332B`) marks identity moments (brand story, newsletter). A single burgundy accent (`#7A2E2E`) is reserved almost exclusively for Add to Bag / Checkout / Subscribe — the only saturated color on most screens, so the eye always knows where to click. All three schemes are merchant-editable in Theme Settings → Colors and pass WCAG AA contrast at default values.
- **Type:** distinctive serif display (`type_heading_font`, default Playfair Display) for headlines, paired with a neutral sans (`type_body_font`, default Urbanist) for body/UI — the "distinctive display + workhorse body" pairing strategy. Fluid modular scale via `clamp()`. Both swappable via the theme editor's font picker.
- **Spacing:** 4px scale (`--space-1` … `--space-32`) drives every margin/padding. Section rhythm (`section_spacing_desktop/mobile`) is a global, editable setting.
- **Radius & shadow:** tokenized to 1 radius setting + a 3-step shadow scale, referenced everywhere — no ad hoc values in the CSS.

## What's built

- **Header** — sticky, hides on scroll-down/shows on scroll-up, shrinks with a shadow once scrolled; slide-in mobile menu; expandable search.
- **Announcement bar** — merchant-editable rotating messages.
- **Hero** — full-bleed, editorial asymmetry available, all copy/image/buttons as blocks.
- **Shop by category** — image tiles with hover zoom.
- **Featured collection** — product grid pulling any collection.
- **Editorial image + text** — brand story module with 5/7 asymmetric split option and 3 color schemes.
- **Testimonials, UGC gallery, Newsletter** — all block-based.
- **Product page** — gallery with zoom + thumbnails, color swatches / size buttons (sold-out states shown, not hidden), sticky mobile Add-to-Bag, reassurance + delivery lines, accordions (description/materials/shipping), size guide drawer, cross-sell ("Complete the look"), Product/Offer JSON-LD, live price/variant updates without reload.
- **Product reviews** — star breakdown, photo-ready review blocks, merchant reply support.
- **Collection page** — native Shopify filtering/sorting in a slide-in drawer, responsive product grid.
- **Cart** — slide-over drawer (default) with a free-shipping progress bar, AJAX quantity controls, and a full `/cart` page fallback.
- **Footer** — editable link columns, social links, real payment-method icons.
- **Motion** — scroll-reveal on key sections, hover lifts on cards, 150–300ms transitions throughout; `prefers-reduced-motion` respected everywhere, plus a theme-setting kill switch.

Everything above — every heading, image, link, color, spacing value, and section order — is editable in the Shopify theme editor. Nothing is hardcoded into a page template; every page is a stack of sections built from `templates/*.json`.

## Deploying

```bash
# from the theme/ directory
shopify theme dev --store your-store.myshopify.com     # live preview
shopify theme check                                     # lint before pushing
shopify theme push                                      # push to a new/existing theme
```

Then in the theme editor: upload a logo (Theme Settings → Logo), pick real product photography (see note below), and connect the "Shop by category" tiles and "Featured collection" section to real collections.

## Known gaps / fast follows (Phase 5 — iterate after launch)

- **Photography is the #1 lever left.** This theme is built for photos it doesn't yet have — swap in consistent, well-lit, on-brand imagery before judging the "premium" feel; great layout around weak photos still reads cheap.
- Predictive/instant search is a plain search form today — wire up Shopify's Predictive Search API or an app if search volume justifies it.
- Copy (`locales/en.default.json`) covers the core strings; most UI text is currently hardcoded English rather than run through the `t:` filter — fine for a single-language launch, worth localizing before expanding markets.
- Once real traffic exists: install heatmap/recording tooling and revisit the PDP fold, cart drawer, and collection filters against real behavior rather than assumption — don't redesign further from taste alone.

## File map

```
config/            settings_schema.json, settings_data.json (design tokens)
layout/theme.liquid
sections/          one file per editable page module
snippets/           product-card, price, icons, cart-drawer, size-guide-drawer, design-tokens
assets/             theme.css, theme.js
templates/          *.json section stacks per page type
locales/en.default.json
```
