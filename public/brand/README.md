# PartnerHub brand assets

The owner approved the regenerated transparent PNGs on 18 October 2026 as replacements for the previous opaque logos. These are PartnerHub brand artwork, not event/sponsor fixture images. Generated artwork closely follows the references but is not pixel-identical.

- partnerhub-wordmark-transparent-hd.png: 2172 x 724 horizontal logo for desktop public/account headers, role sidebars, footers and repository README.
- partnerhub-mark-transparent-hd.png: 1254 x 1254 compact symbol for narrow public/account headers. src/app/icon.png is an exact copy for the Next.js favicon convention.
- LogoMark and LogoWordmark in src/lib/ui/icons.tsx share these PNGs, using SVG viewports to clip unused outer space at display time without stretching the artwork.
- Links provide the accessible PartnerHub name; nested decorative artwork is aria-hidden. Avoid duplicating the wordmark with extra PartnerHub text or the superseded P logo.
- Both PNGs retain RGBA transparency. White people inside the symbol are intentional artwork, not a background. Previous opaque partnerhub-wordmark.png and partnerhub-mark.png are removed at the owner's request. Do not infer legal/trademark review from logo use.

Branding changes do not alter roles, navigation destinations, demo data, billing or backend behavior.

Regression coverage in tests/workspace/branding.test.mjs pins the selected artwork bytes, dimensions, RGBA encoding, favicon copy and removal of old assets. branding-browser-check.mjs checks decoded dimensions, transparent backgrounds, favicon delivery, responsive headers, all-role sidebar logos, footer branding, accessible destinations, unchanged records and no overflow at 1440/768/390/320px.
