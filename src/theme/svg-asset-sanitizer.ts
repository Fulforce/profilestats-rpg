import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import type { Element as XmlElement } from "@xmldom/xmldom";
import { ThemeValidationError } from "./theme-error.js";
import type { ThemeSvgAsset } from "./types.js";

const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "defs",
  "path",
  "circle",
  "ellipse",
  "rect",
  "line",
  "polyline",
  "polygon",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask"
]);
const ALLOWED_ATTRIBUTES = new Set([
  "id",
  "viewBox",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "d",
  "points",
  "fill",
  "fill-opacity",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-opacity",
  "opacity",
  "transform",
  "gradientUnits",
  "gradientTransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "clip-path",
  "mask"
]);
const SAFE_VALUE = /^[#(),.%+\-\w\s]+$/;

export function sanitizeSvgAsset(
  source: string,
  assetPath: string,
  namespace: string
): ThemeSvgAsset {
  rejectUnsafeXml(source, assetPath);
  const errors: string[] = [];
  const document = new DOMParser({
    onError: (level, message) => {
      if (level !== "warning") errors.push(message);
    }
  }).parseFromString(source, "image/svg+xml");
  const root = document.documentElement;

  if (errors.length > 0 || !root || root.tagName !== "svg") {
    invalid(assetPath, "must be a well-formed SVG document");
  }

  const viewBox = root.getAttribute("viewBox") ?? "0 0 100 100";
  if (!/^\s*-?\d+(?:\.\d+)?(?:\s+-?\d+(?:\.\d+)?){3}\s*$/.test(viewBox)) {
    invalid(assetPath, "must have a numeric viewBox");
  }

  const idMap = collectIds(root, namespace, assetPath);
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === 1) {
      sanitizeElement(child as XmlElement, idMap, assetPath);
    } else if (child.nodeType !== 3 || child.nodeValue?.trim()) {
      root.removeChild(child);
    }
  }
  const serializer = new XMLSerializer();
  const content = Array.from(root.childNodes)
    .filter((node) => node.nodeType === 1)
    .map((node) => serializer.serializeToString(node))
    .join("");

  return { content, viewBox: viewBox.trim().replace(/\s+/g, " ") };
}

function rejectUnsafeXml(source: string, path: string): void {
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source)) {
    invalid(path, "contains an unsafe XML declaration or entity");
  }
}

function collectIds(root: XmlElement, namespace: string, path: string): Map<string, string> {
  const ids = new Map<string, string>();
  for (const element of [root, ...descendants(root)]) {
    const id = element.getAttribute("id");
    if (!id) continue;
    if (!/^[A-Za-z_][\w:.-]*$/.test(id) || ids.has(id)) {
      invalid(path, `contains an invalid or duplicate id: ${id}`);
    }
    ids.set(id, `${namespace}-${id}`);
  }
  return ids;
}

function sanitizeElement(element: XmlElement, ids: Map<string, string>, path: string): void {
  if (!ALLOWED_ELEMENTS.has(element.tagName)) {
    invalid(path, `contains prohibited element <${element.tagName}>`);
  }

  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name;
    let value = attribute.value;
    if (name.startsWith("on") || !ALLOWED_ATTRIBUTES.has(name)) {
      invalid(path, `contains prohibited attribute ${name}`);
    }
    if (/https?:|data:|javascript:|@import/i.test(value)) {
      invalid(path, `contains an external or active reference in ${name}`);
    }
    if (name === "id") {
      value = ids.get(value) ?? value;
    } else {
      value = value.replace(/url\(#([^)]+)\)/g, (_match, id: string) => {
        const replacement = ids.get(id);
        if (!replacement) invalid(path, `references unknown id: ${id}`);
        return `url(#${replacement})`;
      });
    }
    if (!SAFE_VALUE.test(value)) {
      invalid(path, `contains unsupported characters in ${name}`);
    }
    element.setAttribute(name, value);
  }

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 1) {
      sanitizeElement(child as XmlElement, ids, path);
    } else if (child.nodeType !== 3 || child.nodeValue?.trim()) {
      element.removeChild(child);
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

function invalid(path: string, message: string): never {
  throw new ThemeValidationError([{ path, message }]);
}
