import Ajv from 'ajv';
import * as fs from 'fs-extra';

export interface ManifestData {
  seed: number;
  spec_version: string;
  effective_config: any;
  files: { path: string; type: string; checksum?: string }[];
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
          path: { type: 'string' },
          type: { type: 'string' },
          checksum: { type: 'string' }
        },
        required: ['path', 'type']
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
  files: { path: string; type: string }[],
  outputPath: string,
  generatedAt?: string
): Promise<void> {
  const manifest: ManifestData = {
    seed,
    spec_version: specVersion,
    effective_config: effectiveConfig,
    files: [...files].sort((a, b) => a.path.localeCompare(b.path)),
    generated_at: generatedAt ?? new Date().toISOString(),
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
