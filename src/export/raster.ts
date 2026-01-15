import sharp from 'sharp';

import * as fs from 'fs-extra';

export async function exportRaster(svg: string, format: string, outputPath: string, dpi: number = 300): Promise<void> {

  let sharpInstance = sharp(Buffer.from(svg), { density: dpi }).toFormat(format as any);

  if (format === 'jpg') {

    sharpInstance = sharpInstance.jpeg({ quality: 80 });

  } else if (format === 'tiff') {

    sharpInstance = sharpInstance.tiff({ compression: 'lzw' });

  } else if (format === 'png') {

    sharpInstance = sharpInstance.png();

  } else if (format === 'webp') {

    sharpInstance = sharpInstance.webp({ quality: 80 });

  }

  const buffer = await sharpInstance.withMetadata({ density: dpi }).toBuffer();

  await fs.writeFile(outputPath, buffer);

}
