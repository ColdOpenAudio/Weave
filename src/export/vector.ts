import puppeteer from 'puppeteer';

import * as fs from 'fs-extra';

export async function exportPDF(svg: string, outputPath: string): Promise<void> {

  const browser = await puppeteer.launch({ headless: true });

  const page = await browser.newPage();

  const html = `<html><body style="margin:0;padding:0;">${svg}</body></html>`;

  await page.setContent(html);

  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });

  await browser.close();

}

export async function exportEPS(svg: string, outputPath: string): Promise<void> {

  // TODO: Implement EPS export, e.g., via puppeteer to PS or inkscape

  throw new Error('EPS export not implemented');

}