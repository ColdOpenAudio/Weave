import fs from 'fs';
import path from 'path';
import process from 'process';
import Ajv from 'ajv';

function fail(msg: string, code = 1): never {
  console.error(msg);
  process.exit(code);
}

function mergeConfigs(base: any, preset: any): any {
  if (typeof base !== 'object' || base === null || typeof preset !== 'object' || preset === null) {
    return preset; // scalars or arrays replace
  }
  if (Array.isArray(base) || Array.isArray(preset)) {
    return preset; // arrays replace
  }
  const result = { ...base };
  for (const key in preset) {
    if (preset[key] === null) {
      fail(`Preset cannot set key '${key}' to null (deletion not allowed)`, 2);
    }
    if (key === 'spec_version') {
      fail(`Preset cannot override 'spec_version'`, 2);
    }
    if (!(key in base)) {
      fail(`Preset cannot introduce new top-level key '${key}'`, 2);
    }
    result[key] = mergeConfigs(base[key], preset[key]);
  }
  return result;
}

async function run() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === 'help' || cmd === '--help') {
    console.log('Usage:');
    console.log('  node dist/index.js validate-base <configPath>');
    console.log('  node dist/index.js validate-preset <presetPath>');
    console.log('  node dist/index.js validate-effective --base <basePath> --preset <presetPath>');
    console.log('  node dist/index.js help');
    process.exit(0);
  }

  if (cmd === 'validate-base') {
    const cfgArg = argv[1];
    if (!cfgArg) fail('No config path provided for validate-base', 2);

    const repoRoot = process.cwd();
    const resolved = path.resolve(repoRoot, cfgArg);
    if (!resolved.startsWith(repoRoot)) fail('Config path must be inside repository', 2);

    let rawCfg: string;
    try {
      rawCfg = fs.readFileSync(resolved, 'utf8');
    } catch (err) {
      fail(`Failed to read config: ${String(err)}`, 2);
    }

    let cfgObj: unknown;
    try {
      cfgObj = JSON.parse(rawCfg);
    } catch (err) {
      fail(`Failed to parse JSON: ${String(err)}`, 2);
    }

    const schemaPath = path.resolve(repoRoot, 'configs', 'schema.base.json');
    let schemaRaw: string;
    try {
      schemaRaw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      fail(`Failed to read schema: ${String(err)}`, 2);
    }

    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(schemaRaw);
    } catch (err) {
      fail(`Failed to parse schema JSON: ${String(err)}`, 2);
    }

    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(schemaObj as object);
    const valid = validate(cfgObj);
    if (!valid) {
      console.error('Config validation failed:');
      console.error(validate.errors);
      process.exit(2);
    }

    console.log('Config is valid according to schema.base.json');
    process.exit(0);
  }

  if (cmd === 'validate-preset') {
    const cfgArg = argv[1];
    if (!cfgArg) fail('No preset path provided for validate-preset', 2);

    const repoRoot = process.cwd();
    const resolved = path.resolve(repoRoot, cfgArg);
    if (!resolved.startsWith(repoRoot)) fail('Preset path must be inside repository', 2);

    let rawCfg: string;
    try {
      rawCfg = fs.readFileSync(resolved, 'utf8');
    } catch (err) {
      fail(`Failed to read preset: ${String(err)}`, 2);
    }

    let cfgObj: unknown;
    try {
      cfgObj = JSON.parse(rawCfg);
    } catch (err) {
      fail(`Failed to parse JSON: ${String(err)}`, 2);
    }

    const schemaPath = path.resolve(repoRoot, 'configs', 'schema.preset.json');
    let schemaRaw: string;
    try {
      schemaRaw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      fail(`Failed to read schema: ${String(err)}`, 2);
    }

    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(schemaRaw);
    } catch (err) {
      fail(`Failed to parse schema JSON: ${String(err)}`, 2);
    }

    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(schemaObj as object);
    const valid = validate(cfgObj);
    if (!valid) {
      console.error('Preset validation failed:');
      console.error(validate.errors);
      process.exit(2);
    }

    console.log('Preset is valid according to schema.preset.json');
    process.exit(0);
  }

  if (cmd === 'validate-effective') {
    let basePath = '';
    let presetPath = '';
    for (let i = 1; i < argv.length; i++) {
      if (argv[i] === '--base' && i + 1 < argv.length) {
        basePath = argv[i + 1];
        i++;
      } else if (argv[i] === '--preset' && i + 1 < argv.length) {
        presetPath = argv[i + 1];
        i++;
      } else {
        fail(`Unknown argument: ${argv[i]}`, 2);
      }
    }
    if (!basePath || !presetPath) fail('Both --base and --preset paths are required for validate-effective', 2);

    const repoRoot = process.cwd();

    // Load base
    const baseResolved = path.resolve(repoRoot, basePath);
    if (!baseResolved.startsWith(repoRoot)) fail('Base path must be inside repository', 2);
    let baseRaw: string;
    try {
      baseRaw = fs.readFileSync(baseResolved, 'utf8');
    } catch (err) {
      fail(`Failed to read base config: ${String(err)}`, 2);
    }
    let baseObj: any;
    try {
      baseObj = JSON.parse(baseRaw);
    } catch (err) {
      fail(`Failed to parse base JSON: ${String(err)}`, 2);
    }

    // Load preset
    const presetResolved = path.resolve(repoRoot, presetPath);
    if (!presetResolved.startsWith(repoRoot)) fail('Preset path must be inside repository', 2);
    let presetRaw: string;
    try {
      presetRaw = fs.readFileSync(presetResolved, 'utf8');
    } catch (err) {
      fail(`Failed to read preset: ${String(err)}`, 2);
    }
    let presetObj: any;
    try {
      presetObj = JSON.parse(presetRaw);
    } catch (err) {
      fail(`Failed to parse preset JSON: ${String(err)}`, 2);
    }

    // Merge
    const effectiveObj = mergeConfigs(baseObj, presetObj);

    // Validate against base schema
    const schemaPath = path.resolve(repoRoot, 'configs', 'schema.base.json');
    let schemaRaw: string;
    try {
      schemaRaw = fs.readFileSync(schemaPath, 'utf8');
    } catch (err) {
      fail(`Failed to read schema: ${String(err)}`, 2);
    }
    let schemaObj: unknown;
    try {
      schemaObj = JSON.parse(schemaRaw);
    } catch (err) {
      fail(`Failed to parse schema JSON: ${String(err)}`, 2);
    }

    const ajv = new Ajv({ allErrors: true, strict: true });
    const validate = ajv.compile(schemaObj as object);
    const valid = validate(effectiveObj);
    if (!valid) {
      console.error('Effective config validation failed:');
      console.error(validate.errors);
      process.exit(2);
    }

    console.log('Effective config is valid according to schema.base.json');
    process.exit(0);
  }

  fail(`Unknown command: ${cmd}`);
}

run().catch((e) => fail(`Unhandled error: ${String(e)}`, 99));
