import { app } from 'electron';
import { spawn, execSync, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let child: ChildProcess | null = null;

const exePath = (): string => {
  const dev = path.join(app.getAppPath(), 'native', 'keyboard-blocker.exe');
  const res = path.join(process.resourcesPath, 'keyboard-blocker.exe');
  if (fs.existsSync(dev)) return dev;
  return res;
};

const buildIfMissing = (): boolean => {
  if (fs.existsSync(exePath())) return true;
  try {
    execSync('node scripts/build-native.js', { cwd: app.getAppPath(), stdio: 'ignore', timeout: 30000 });
    return fs.existsSync(exePath());
  } catch {
    return false;
  }
};

export const installHook = (onExit: () => void): void => {
  if (child) return;

  if (!buildIfMissing()) return;

  try {
    child = spawn(exePath(), [], { stdio: ['pipe', 'pipe', 'pipe'] });

    let buffer = '';

    child.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      if (buffer.includes('EXIT')) {
        child = null;
        onExit();
      }
    });

    child.on('error', () => { child = null; });
    child.on('exit', () => { child = null; });
  } catch {
    child = null;
  }
};

export const uninstallHook = (): void => {
  if (child) {
    child.kill();
    child = null;
  }
};
