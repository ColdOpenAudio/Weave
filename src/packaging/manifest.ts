import Ajv from 'ajv';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ManifestData {
  seed: number;
  spec_version: string;
  effective_config: any;
  files: { name: string; type: string; checksum?: string }[];
  generated_at: string;
  version: string;
}

const MANIFEST_SCHEMA = {
  type: 'object',
  properties: {
    seed: { type: 'number' },
    spec_version: { type: 'string' },
    effective_config: { type: 'object' },
    files: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          checksum: { type: 'string' }
        },
        required: ['name', 'type']
      }
    },
    generated_at: { type: 'string' },
    version: { type: 'string' }
  },
  required: ['seed', 'spec_version', 'effective_config', 'files', 'generated_at', 'version']
};

const ajv = new Ajv({ allErrors: true, strict: true });
const validateManifest = ajv.compile(MANIFEST_SCHEMA);

export async function generateManifest(
  seed: number,
  specVersion: string,
  effectiveConfig: any,
  files: { name: string; type: string }[],
  outputPath: string
): Promise<void> {
  const manifest: ManifestData = {
    seed,
    spec_version: specVersion,
    effective_config: effectiveConfig,
    files,
    generated_at: new Date().toISOString(),
    version: '1.0'
  };

  // Validate
  const valid = validateManifest(manifest);
  if (!valid) {
    throw new Error(`Manifest validation failed: ${JSON.stringify(validateManifest.errors)}`);
  }

  // Write
  await fs.writeJson(outputPath, manifest, { spaces: 2 });
}

export async function validateManifestFile(manifestPath: string): Promise<boolean> {
  const manifest = await fs.readJson(manifestPath);
  return validateManifest(manifest);
}