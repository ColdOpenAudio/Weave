import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { JSDOM } from 'jsdom';
import { jsPDF } from 'jspdf';
import svg2pdf from 'svg2pdf.js';

export async function exportPDF(svg: string, outputPath: string): Promise<void> {
  const size = parseSvgSize(svg);
  const widthIn = size?.widthIn ?? 8.27;
  const heightIn = size?.heightIn ?? 11.69;
  const widthPt = widthIn * 72;
  const heightPt = heightIn * 72;

  const dom = new JSDOM(svg, { contentType: 'image/svg+xml' });
  const svgElement = dom.window.document.querySelector('svg');
  if (!svgElement) {
    throw new Error('PDF export failed: SVG root element not found.');
  }

  const pdf = new jsPDF({ unit: 'pt', format: [widthPt, heightPt] });
  await Promise.resolve(svg2pdf(svgElement as any, pdf as any, { x: 0, y: 0, width: widthPt, height: heightPt }));
  const pdfBuffer = pdf.output('arraybuffer');
  fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));

}

export async function exportEPS(svg: string, outputPath: string): Promise<void> {

  const gsCheck = spawnSync('gs', ['--version'], { stdio: 'ignore' });
  if (gsCheck.error || gsCheck.status !== 0) {
    throw new Error('EPS export requires Ghostscript (gs) installed and available on PATH.');
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'weave-eps-'));
  const tempPdf = path.join(tempDir, 'source.pdf');

  try {
    await exportPDF(svg, tempPdf);
    const result = spawnSync(
      'gs',
      ['-dSAFER', '-dBATCH', '-dNOPAUSE', '-sDEVICE=eps2write', `-sOutputFile=${outputPath}`, tempPdf],
      { stdio: 'ignore' }
    );
    if (result.error || result.status !== 0) {
      throw new Error('Ghostscript failed to generate EPS.');
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

}

function parseSvgSize(svg: string): { widthIn: number; heightIn: number } | null {
  const svgTagMatch = svg.match(/<svg[^>]*>/i);
  if (!svgTagMatch) return null;

  const svgTag = svgTagMatch[0];
  const widthAttr = matchAttribute(svgTag, 'width');
  const heightAttr = matchAttribute(svgTag, 'height');

  if (widthAttr && heightAttr) {
    const widthIn = parseLengthToInches(widthAttr);
    const heightIn = parseLengthToInches(heightAttr);
    if (widthIn && heightIn) {
      return { widthIn, heightIn };
    }
  }

  const viewBox = matchAttribute(svgTag, 'viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[,\s]+/).map((value) => Number.parseFloat(value));
    if (parts.length === 4 && parts.every((value) => !Number.isNaN(value))) {
      const widthPx = parts[2];
      const heightPx = parts[3];
      if (widthPx > 0 && heightPx > 0) {
        return { widthIn: widthPx / 96, heightIn: heightPx / 96 };
      }
    }
  }

  return null;
}

function matchAttribute(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? match[1] : null;
}

function parseLengthToInches(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  const match = trimmed.match(/^([0-9]*\.?[0-9]+)\s*(mm|cm|in|px|pt)?$/);
  if (!match) return null;
  const amount = Number.parseFloat(match[1]);
  if (Number.isNaN(amount)) return null;

  const unit = match[2] || 'px';
  switch (unit) {
    case 'in':
      return amount;
    case 'cm':
      return amount / 2.54;
    case 'mm':
      return amount / 25.4;
    case 'pt':
      return amount / 72;
    case 'px':
    default:
      return amount / 96;
  }
}
