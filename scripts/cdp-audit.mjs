// Headless browser audit of InstaGro — catch crashes and dead buttons
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const port = 9335;
const userDir = fs.mkdtempSync(os.tmpdir() + "/gd-audit-");
const proc = spawn(EDGE, [`--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`, "--headless=new", "--disable-gpu", "--no-sandbox", "about:blank"], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));

let wsUrl = null;
for (let i = 0; i < 30; i++) {
  try { const j = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); wsUrl = j.webSocketDebuggerUrl; if (wsUrl) break; } catch {}
  await sleep(500);
}
if (!wsUrl) { console.log("CDP FAILED"); proc.kill(); process.exit(1); }

const ws = new WebSocket(wsUrl);
let msgId = 0; const pending = new Map(); const errors = [];
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
  else if (m.method === "Runtime.exceptionThrown") errors.push("EXCEPTION: " + (m.params.exceptionDetails?.exception?.description || "").slice(0, 300));
};
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

const { targetId } = await send("Target.createTarget", { url: "about:blank" });
const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
const ssend = (m, p = {}) => send(m, p, sessionId);
const evalJs = async expr => { try { return (await ssend("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.value; } catch { return null; } };

await ssend("Page.enable"); await ssend("Runtime.enable");
await ssend("Page.navigate", { url: "https://green-duty.vercel.app/login" });
await sleep(6000);
await evalJs(`localStorage.setItem("gd_user", JSON.stringify({id:"u_audit",name:"Audit User",email:"audit@test.local",avatarUrl:"/logo.png",role:"guest",accountType:"guest",points:0,badges:[],joinedAt:new Date().toISOString()})); "ok"`);

// 1. Feed
await ssend("Page.navigate", { url: "https://green-duty.vercel.app/feed" });
await sleep(7000);
const feedOk = await evalJs(`document.body.innerText.includes('InstaGro') && !document.body.innerText.includes('This page could')`);
console.log("FEED LOADS:", feedOk);

// 2. Messages page
await ssend("Page.navigate", { url: "https://green-duty.vercel.app/feed/messages" });
await sleep(7000);
const msgOk = await evalJs(`!document.body.innerText.includes('This page could')`);
console.log("MESSAGES PAGE LOADS:", msgOk);
const msgText = await evalJs(`document.body.innerText.slice(0, 150)`);
console.log("MESSAGES BODY:", JSON.stringify(msgText));

// 3. Story creator opens?
await ssend("Page.navigate", { url: "https://green-duty.vercel.app/feed" });
await sleep(6000);
await evalJs(`[...document.querySelectorAll('*')].find(e => e.textContent === 'Your story')?.click(); "ok"`);
await sleep(2500);
const storyOk = await evalJs(`document.body.innerText.includes('Create story')`);
console.log("STORY CREATOR OPENS:", storyOk);

console.log("--- ERRORS ---");
errors.slice(0, 10).forEach(e => console.log(e));
if (errors.length === 0) console.log("(no exceptions)");
proc.kill();
process.exit(0);
