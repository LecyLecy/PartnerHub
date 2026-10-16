import assert from "node:assert/strict";
import test from "node:test";
import {
  brandingError,
  emptyBranding,
  isBranding,
  logoFileError,
  logoMaxBytes,
} from "../../src/features/event/event-branding.ts";

test("logos accept bounded raster files and reject empty/unsupported/oversize", () => {
  assert.equal(logoFileError(new Blob(["test"], { type: "image/png" })), null);
  assert.match(logoFileError(new Blob([], { type: "image/png" })), /kosong/);
  assert.match(
    logoFileError(new Blob(["<svg/>"], { type: "image/svg+xml" })),
    /SVG/,
  );
  assert.match(
    logoFileError(
      new Blob([new Uint8Array(logoMaxBytes + 1)], { type: "image/png" }),
    ),
    /2 MB/,
  );
});

test("brand identity is optional, but actual placements require names", () => {
  assert.equal(brandingError(emptyBranding()), null);
  assert.match(
    brandingError({
      ...emptyBranding(),
      organizationLogo: {
        name: "logo.png",
        file: new Blob(["test"], { type: "image/png" }),
      },
    }),
    /nama organisasi/,
  );
  assert.match(
    brandingError({
      ...emptyBranding(),
      sponsors: [{ id: "1", name: " ", logo: null }],
    }),
    /nama setiap sponsor/,
  );
  assert.match(
    brandingError({
      ...emptyBranding(),
      sponsors: Array.from({ length: 7 }, (_, i) => ({
        id: `${i}`,
        name: "Sponsor",
        logo: null,
      })),
    }),
    /6 sponsor/,
  );
});

test("stored branding rejects incorrect shapes, unsafe asset references and duplicate entries", () => {
  assert.equal(isBranding(emptyBranding()), true);
  assert.equal(isBranding({}), false);
  assert.equal(
    isBranding({
      ...emptyBranding(),
      eventLogo: { name: "logo", file: "https://untrusted.example/logo" },
    }),
    false,
  );
  assert.equal(
    isBranding({
      ...emptyBranding(),
      sponsors: [
        { id: "1", name: "One", logo: null },
        { id: "1", name: "Two", logo: null },
      ],
    }),
    false,
  );
});
