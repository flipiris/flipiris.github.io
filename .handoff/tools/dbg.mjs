import {spawn} from 'node:child_process';
const port = 9777;
const proc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--remote-allow-origins=*', '--no-first-run', '--disable-gpu', `--user-data-dir=/tmp/chrome-dbg`, 'about:blank'], {stdio: ['ignore', 'pipe', 'pipe']});
proc.stderr.on('data', d => console.log('ERR', String(d).slice(0, 300)));
await new Promise(r => setTimeout(r, 4000));
try { console.log(await (await fetch(`http://127.0.0.1:${port}/json/version`)).text()); } catch (e) { console.log('fetch fail', e.message); }
try { const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'}); console.log(r.status, (await r.text()).slice(0, 200)); } catch (e) { console.log('new fail', e.message); }
proc.kill();
