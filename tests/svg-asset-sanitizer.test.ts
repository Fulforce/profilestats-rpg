import { describe, expect, it } from "vitest";
import { sanitizeSvgAsset } from "../src/theme/svg-asset-sanitizer.js";

describe("sanitizeSvgAsset", () => {
  it("namespaces IDs and local references", () => {
    const asset = sanitizeSvgAsset(
      '<svg viewBox="0 0 10 10"><defs><linearGradient id="paint"><stop offset="0" stop-color="#ffffff"/></linearGradient></defs><path id="shape" d="M0 0 L10 10" fill="url(#paint)"/></svg>',
      "character.svg",
      "safe-character"
    );

    expect(asset.viewBox).toBe("0 0 10 10");
    expect(asset.content).toContain('id="safe-character-paint"');
    expect(asset.content).toContain('id="safe-character-shape"');
    expect(asset.content).toContain("url(#safe-character-paint)");
    expect(asset.content).not.toContain('id="paint"');
  });

  it.each([
    "<svg><script>alert(1)</script></svg>",
    '<svg><path onload="alert(1)" d="M0 0"/></svg>',
    '<svg><image href="https://example.com/image.png"/></svg>',
    '<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>',
    "<svg><foreignObject><div>unsafe</div></foreignObject></svg>",
    '<svg><animate attributeName="x"/></svg>'
  ])("rejects active or external SVG content", (source) => {
    expect(() => sanitizeSvgAsset(source, "hostile.svg", "safe")).toThrow();
  });
});
