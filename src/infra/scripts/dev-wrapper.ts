import { spawn } from 'child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const run = (cmd: string, args: string[]) =>
  spawn(cmd, args, { stdio: 'inherit' });
const runNpm = (name: string) => run(npm, ['run', name]);

let stopped = false;
const stop = (code = 0) => {
  if (stopped) return;
  stopped = true;
  if (child && !child.killed) child.kill();
  runNpm('services:stop').on('exit', () => process.exit(code));
};

const child = runNpm('start:dev');

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

child.on('exit', (code, signal) => stop(signal ? 0 : (code ?? 0)));
