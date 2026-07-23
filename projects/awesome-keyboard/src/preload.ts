import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CLOSE_WINDOW,
  IPC_DRAW_MINIGAME,
  IPC_MINIMIZE_WINDOW,
  IPC_RUN_MINIGAME,
  IPC_TYPE_CHARACTER,
  SloppyKeyboardApi,
} from './contracts';

const api: SloppyKeyboardApi = {
  typeCharacter: (character) =>
    ipcRenderer.invoke(IPC_TYPE_CHARACTER, character),
  drawMinigame: () => ipcRenderer.invoke(IPC_DRAW_MINIGAME),
  runMinigame: (id) => ipcRenderer.invoke(IPC_RUN_MINIGAME, id),
  closeWindow: () => ipcRenderer.send(IPC_CLOSE_WINDOW),
  minimizeWindow: () => ipcRenderer.send(IPC_MINIMIZE_WINDOW),
};

contextBridge.exposeInMainWorld('sloppyKeyboard', api);
