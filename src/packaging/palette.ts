import * as fs from 'fs-extra';
import * as path from 'path';
import convert from 'color-convert';

export interface PaletteColor {
  name: string;
  hex: string;
}

export async function generatePalettes(colors: PaletteColor[], outputDir: string): Promise<void> {
  // Sort for determinism
  colors.sort((a, b) => a.name.localeCompare(b.name));

  // Generate ASE (Adobe Swatch Exchange) - binary format
  const aseBuffer = createASEPalette(colors);
  await fs.writeFile(path.join(outputDir, 'palette.ase'), aseBuffer);

  // Generate GPL (GIMP Palette)
  const gplContent = createGPLPalette(colors);
  await fs.writeFile(path.join(outputDir, 'palette.gpl'), gplContent);

  // Generate JSON
  const jsonContent = JSON.stringify({ colors }, null, 2);
  await fs.writeFile(path.join(outputDir, 'palette.json'), jsonContent);
}

function createASEPalette(colors: PaletteColor[]): Buffer {
  // ASE is a binary format; simplified implementation
  // Real ASE has header, blocks, etc.
  // For now, placeholder - in practice, use a library or implement properly
  const buffers: Buffer[] = [];

  // ASE header
  const header = Buffer.alloc(12);
  header.write('ASEF', 0, 4, 'ascii'); // signature
  header.writeUInt16BE(1, 4); // version major
  header.writeUInt16BE(0, 6); // version minor
  header.writeUInt32BE(colors.length, 8); // number of blocks
  buffers.push(header);

  for (const color of colors) {
    // Color block
    const blockType = Buffer.alloc(2);
    blockType.writeUInt16BE(1, 0); // color block
    buffers.push(blockType);

    const nameLen = Buffer.alloc(2);
    nameLen.writeUInt16BE(color.name.length + 1, 0);
    buffers.push(nameLen);

    const nameBuf = Buffer.from(color.name + '\0', 'utf8');
    buffers.push(nameBuf);

    // Color mode: RGB
    const mode = Buffer.from('RGB ', 'ascii');
    buffers.push(mode);

    // RGB values (0-1)
    const rgb = convert.hex.rgb(color.hex);
    const r = Buffer.alloc(4);
    r.writeFloatBE(rgb[0] / 255, 0);
    buffers.push(r);
    const g = Buffer.alloc(4);
    g.writeFloatBE(rgb[1] / 255, 0);
    buffers.push(g);
    const b = Buffer.alloc(4);
    b.writeFloatBE(rgb[2] / 255, 0);
    buffers.push(b);

    // Type: global
    const type = Buffer.alloc(2);
    type.writeUInt16BE(0, 0);
    buffers.push(type);
  }

  return Buffer.concat(buffers);
}

function createGPLPalette(colors: PaletteColor[]): string {
  let content = 'GIMP Palette\nName: Fabric Palette\n#\n';
  for (const color of colors) {
    const rgb = convert.hex.rgb(color.hex);
    content += `${rgb[0]} ${rgb[1]} ${rgb[2]}\t${color.name}\n`;
  }
  return content;
}