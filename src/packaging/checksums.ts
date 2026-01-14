import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';

export interface ChecksumEntry {
  file: string;
  checksum: string;
}

export async function generateChecksums(files: string[], baseDir: string, outputPath: string): Promise<void> {
  const entries: ChecksumEntry[] = [];

  const uniqueFiles = Array.from(new Set(files)).sort((a, b) => a.localeCompare(b));
  for (const file of uniqueFiles) {
    const fullPath = path.resolve(baseDir, file);
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(fullPath);

    // Stream to hash to avoid loading large files into memory
    await pipeline(stream, hash);
    const checksum = hash.digest('hex');
    entries.push({ file, checksum });
  }

  // Write in SHA256SUMS format: checksum  filename
  const content = entries.map(entry => `${entry.checksum}  ${entry.file}`).join('\n') + '\n';
  await fs.writeFile(outputPath, content, 'utf8');
}

export async function validateChecksums(checksumsPath: string, baseDir: string): Promise<boolean> {
  const content = await fs.readFile(checksumsPath, 'utf8');
  const lines = content.trim().split('\n');

  for (const line of lines) {
    const [expectedChecksum, file] = line.split('  ');
    const fullPath = path.resolve(baseDir, file);
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(fullPath);

    await pipeline(stream, hash);
    const actualChecksum = hash.digest('hex');

    if (actualChecksum !== expectedChecksum) {
      return false;
    }
  }

  return true;
}
