import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));
export async function browser() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*', '--no-first-run', '--disable-gpu', `--user-data-dir=/tmp/chrome-${port}`, 'about:blank'], {stdio: 'ignore'});
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); } }
  return {
    async page({width = 1440, height = 900, mobile = false} = {}) {
      const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json();
      const ws = new WebSocket(t.webSocketDebuggerUrl);
      await new Promise(r => ws.addEventListener('open', r));
      let id = 0; const pending = new Map();
      ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const {res, rej} = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } });
      const s = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, {res, rej}); ws.send(JSON.stringify({id: i, method, params})); });
      await s('Page.enable'); await s('Runtime.enable');
      await s('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile});
      return {
        async goto(url, wait = 700) { await s('Page.navigate', {url}); await sleep(wait + 600); },
        async eval(expr) { const r = await s('Runtime.evaluate', {expression: expr, returnByValue: true, awaitPromise: true}); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails)); return r.result.value; },
        async shot(file, full = false) { const r = await s('Page.captureScreenshot', {format: 'png', captureBeyondViewport: full}); writeFileSync(file, Buffer.from(r.data, 'base64')); },
        async mouse(type, x, y) { await s('Input.dispatchMouseEvent', {type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1}); },
        async click(x, y) { await this.mouse('mouseMoved', x, y); await this.mouse('mousePressed', x, y); await this.mouse('mouseReleased', x, y); },
        async key(key, code) { await s('Input.dispatchKeyEvent', {type: 'keyDown', key, code}); await s('Input.dispatchKeyEvent', {type: 'keyUp', key, code}); },
        async resize(w, h) { await s('Emulation.setDeviceMetricsOverride', {width: w, height: h, deviceScaleFactor: 1, mobile}); await sleep(300); },
        async close() { ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`); }
      };
    },
    close() { proc.kill(); }
  };
}
