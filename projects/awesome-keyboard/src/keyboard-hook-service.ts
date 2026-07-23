import { app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let child: ChildProcess | null = null;

const getBlockerPath = (): string => {
  const devPath = path.join(app.getAppPath(), 'native', 'keyboard-blocker.exe');
  if (fs.existsSync(devPath)) return devPath;
  return path.join(process.resourcesPath, 'keyboard-blocker.exe');
};

export const installHook = (onExit: () => void): void => {
  if (child) return;

  try {
    const exePath = getBlockerPath();
    child = spawn(exePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });

    let buffer = '';

    child.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      if (buffer.includes('READY')) {
        buffer = buffer.replace('READY', '');
      }
      if (buffer.includes('EXIT')) {
        child = null;
        onExit();
      }
    });

    child.on('error', () => {
      child = null;
    });

    child.on('exit', () => {
      child = null;
    });
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
