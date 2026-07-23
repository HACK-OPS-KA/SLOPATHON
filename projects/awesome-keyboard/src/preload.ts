import { contextBridge, ipcRenderer } from 'electron';
import {
  IPC_CLOSE_WINDOW,
  IPC_TYPE_CHARACTER,
  SloppyKeyboardApi,
} from './contracts';

const api: SloppyKeyboardApi = {
  typeCharacter: (character) =>
    ipcRenderer.invoke(IPC_TYPE_CHARACTER, character),
  closeWindow: () => ipcRenderer.send(IPC_CLOSE_WINDOW),
};

contextBridge.exposeInMainWorld('sloppyKeyboard', api);
