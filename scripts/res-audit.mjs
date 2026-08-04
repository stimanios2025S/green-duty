import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9337;
const userDir = fs.mkdtempSync(os.tmpdir() + "/gd-res-");
const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, "--headless=new", "--disable-gpu", "--no-sandbox", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let wsUrl = null;
for (let i = 0; i < 30; i++) {
  try { const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); wsUrl = j.webSocketDebuggerUrl; if (wsUrl) break; } catch {}
  await sleep(500);
}
if (!wsUrl) { console.log("CDP FAILED"); proc.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
let msgId = 0; const pending = new Map();
function send(method, params = {}, sessionId) {
  return new Promise((resolve, reject) => {
    const id = ++msgId; pending.set(id, { resolve, reject });
    const msg = { id, method, params }; if (sessionId) msg.sessionId = sessionId;
    ws.send(JSON.stringify(msg));
  });
}
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
};
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const ssend = (m, p = {}) => send(m, p, sessionId);
const evalJs = async expr => { try { return (await ssend("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.value; } catch { return null; } };

await ssend("Page.enable"); await ssend("Runtime.enable");
await ssend("Page.navigate", { url: "https://green-duty.vercel.app/login" });
await sleep(6000);
await evalJs(`localStorage.setItem("gd_user", JSON.stringify({id:"u_res",name:"Res User",email:"res@test.local",avatarUrl:"/logo.png",role:"guest",accountType:"guest",points:0,badges:[],joinedAt:new Date().toISOString()})); "ok"`);

async function audit(label, width, height) {
  await ssend("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: width < 768 });
  await ssend("Page.navigate", { url: "https://green-duty.vercel.app/feed" });
  await sleep(6000);
  const info = await evalJs(`(() => {
    const vw = window.innerWidth;
    const culprits = [];
    document.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        culprits.push(el.tagName + '.' + (el.className || '').toString().slice(0, 60) + ' [L' + Math.round(r.left) + ' R' + Math.round(r.right) + ']');
      }
    });
    return JSON.stringify({ vw, overflowX: document.documentElement.scrollWidth > vw, culprits: culprits.slice(0, 5) });
  })()`);
  console.log(`${label} (${width}x${height}):`, info);
}

await audit("iPhone", 390, 844);
await audit("Tablet", 768, 1024);
await audit("Desktop", 1280, 800);

proc.kill();
process.exit(0);
