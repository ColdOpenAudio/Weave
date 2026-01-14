const convert = require('color-convert');

export function applyColorPolicy(svg: string, policy: 'web' | 'print'): string {

  if (policy === 'web') return svg; // RGB

  // For print, SVG is RGB, but for PDF conversion, can set colorspace.

  // Placeholder: no change, as conversion happens in export

  return svg;

}