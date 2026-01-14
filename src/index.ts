import fs from 'fs';
import path from 'path';
import process from 'process';
import Ajv from 'ajv';

function fail(msg: string, code = 1): never {
	console.error(msg);
	process.exit(code);
}

async function run() {
	const argv = process.argv.slice(2);
	const cmd = argv[0];

	if (!cmd || cmd === 'help' || cmd === '--help') {
		console.log('Usage: node dist/index.js validate-base <configPath>');
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

	fail(`Unknown command: ${cmd}`);
}

run().catch((e) => fail(`Unhandled error: ${String(e)}`, 99));
