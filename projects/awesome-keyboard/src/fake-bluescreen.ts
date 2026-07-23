import { BrowserWindow } from 'electron';
import { createMathQuestions } from './minigame-data';

export const fakeBluescreenDocument = (): string => {
  const questions = createMathQuestions();
  const data = JSON.stringify(questions).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#0078d7;color:#fff;font-family:"Segoe UI",sans-serif}
main{width:780px;margin:8vh auto}.face{font-size:112px;font-weight:300}h1{font-size:28px;font-weight:400;line-height:1.45}
.panel{margin-top:42px;padding:24px;border:2px solid #fff}label{display:block;font-size:18px}
input{margin-top:12px;width:220px;padding:8px;font-size:24px;border:0}.meta{margin-top:35px;font-size:14px}
</style></head><body><main><div class="face">:(</div>
<h1>Your keyboard ran into a problem and needs your help to recover.</h1>
<div class="panel"><label id="prompt"></label><input id="answer" type="number" autofocus>
<p id="progress"></p></div><p class="meta">Hold Escape for 3 seconds for emergency exit.</p>
</main><script>
const questions=${data};let current=0,escapeTimer;
const prompt=document.querySelector('#prompt'),answer=document.querySelector('#answer'),progress=document.querySelector('#progress');
function show(){prompt.textContent='Recovery check: '+questions[current].text+' = ?';progress.textContent='Check '+(current+1)+' of 3';answer.value='';answer.focus()}
answer.addEventListener('keydown',e=>{if(e.key==='Enter'){if(Number(answer.value)===questions[current].answer){current++;if(current===3){window.close();return}show()}else{progress.textContent='Incorrect. Check '+(current+1)+' of 3';answer.select()}}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&!escapeTimer)escapeTimer=setTimeout(()=>window.close(),3000)});
addEventListener('keyup',e=>{if(e.key==='Escape'){clearTimeout(escapeTimer);escapeTimer=null}});show();
</script></body></html>`;
};

export const openFakeBluescreen = (
  onCreated?: (window: BrowserWindow) => void,
): Promise<void> => new Promise((resolve) => {
  const window = new BrowserWindow({
    fullscreen: true,
    focusable: true,
    alwaysOnTop: true,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  onCreated?.(window);
  window.on('closed', resolve);
  void window.loadURL(`data:text/html;charset=utf-8,${
    encodeURIComponent(fakeBluescreenDocument())
  }`);
});
