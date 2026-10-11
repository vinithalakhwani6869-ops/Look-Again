// Cross-platform production launcher.
//
// Works in Windows PowerShell (and POSIX shells) without inline env syntax:
// it builds the frontend, then starts the TS server with NODE_ENV=production
// so Express serves dist/ and /api from a single origin and port.
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';

function run(command, args, env) {
  return spawnSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    env,
    shell: isWindows,
  });
}

console.log('[LOOK AGAIN] Building frontend (vite build)...');
const build = run('npm', ['run', 'build']);
if (build.status !== 0) {
  console.error('[LOOK AGAIN] Build failed. Aborting.');
  process.exit(build.status ?? 1);
}

console.log('[LOOK AGAIN] Starting production server (NODE_ENV=production)...');
const child = spawn('npx', ['tsx', 'server.ts'], {
  stdio: 'inherit',
  cwd: root,
  env: { ...process.env, NODE_ENV: 'production' },
  shell: isWindows,
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('[LOOK AGAIN] Failed to start server:', err);
  process.exit(1);
});
