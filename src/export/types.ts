export interface ExportOptions {
  format: string; // e.g., 'pdf', 'eps', 'tiff', 'png', 'jpg' - extensible
  colorPolicy: 'web' | 'print'; // RGB vs CMYK
  dpi?: number; // For raster (default 300)
  enableSeparations?: boolean; // Output spot layers separately
  outputDir: string;
  seed: number; // For naming
}

export interface SeparationLayer { name: string; svg: string; } // For spot sets