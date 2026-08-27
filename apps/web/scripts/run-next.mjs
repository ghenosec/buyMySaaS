import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('Informe o comando do Next.js');

const rootEnvironment = fileURLToPath(new URL('../../../.env', import.meta.url));
if (existsSync(rootEnvironment)) process.loadEnvFile(rootEnvironment);

process.env.NODE_ENV = command === 'dev' ? 'development' : 'production';

const nextBinary = fileURLToPath(
  new URL('../../../node_modules/next/dist/bin/next', import.meta.url),
);
const child = spawn(process.execPath, [nextBinary, command, ...args], {
  env: process.env,
  stdio: 'inherit',
});

child.on('error', (error) => {
  throw error;
});
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
