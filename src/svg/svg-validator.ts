import { Buffer } from "node:buffer";
import { DOMParser } from "@xmldom/xmldom";
import type { Element as XmlElement } from "@xmldom/xmldom";

const MAX_SVG_BYTES = 1024 * 1024;
const PROHIBITED_ELEMENTS = new Set([
  "script",
  "foreignObject",
  "animate",
  "animateMotion",
  "animateTransform",
  "set"
]);

export function validateGeneratedSvg(svg: string): void {
  if (Buffer.byteLength(svg, "utf8") >= MAX_SVG_BYTES) {
    throw new Error(`Generated SVG must be smaller than ${MAX_SVG_BYTES} bytes.`);
  }
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(svg)) {
    throw new Error("Generated SVG contains an unsafe XML declaration or entity.");
  }

  const errors: string[] = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") errors.push(message);
    }
  }).parseFromString(svg, "image/svg+xml");
  const root = document.documentElement;
  if (errors.length > 0 || !root || root.tagName !== "svg") {
    throw new Error("Generated SVG is not well-formed XML.");
  }

  for (const element of [root, ...descendants(root)]) {
    if (PROHIBITED_ELEMENTS.has(element.tagName)) {
      throw new Error(`Generated SVG contains prohibited element <${element.tagName}>.`);
    }
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith("on")) {
        throw new Error(`Generated SVG contains prohibited attribute ${attribute.name}.`);
      }
      if (
        attribute.name !== "xmlns" &&
        /https?:|data:|javascript:|@import/i.test(attribute.value)
      ) {
        throw new Error(`Generated SVG contains an external or active reference.`);
      }
    }
  }
}

function descendants(root: XmlElement): XmlElement[] {
  const result: XmlElement[] = [];
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType !== 1) continue;
    result.push(child as XmlElement, ...descendants(child as XmlElement));
  }
  return result;
}
