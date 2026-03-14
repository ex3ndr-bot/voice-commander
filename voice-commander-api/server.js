const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const PORT = process.env.PORT || 7778;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const COMMANDS_FILE = path.join(DATA_DIR, "commands.json");
const PERSONAS_FILE = path.join(DATA_DIR, "personas.json");
const SHORTCUTS_FILE = path.join(DATA_DIR, "shortcuts.json");
function ensureDir(dir){ fs.mkdirSync(dir,{recursive:true}); }
function readJson(file, fallback){ try { if(!fs.existsSync(file)){ fs.writeFileSync(file, JSON.stringify(fallback,null,2)); return fallback; } const raw = fs.readFileSync(file,"utf8"); return raw.trim()?JSON.parse(raw):fallback; } catch (err) { console.error("readJson error", file, err); return fallback; } }
function writeJson(file, data){ fs.writeFileSync(file, JSON.stringify(data,null,2)); }
ensureDir(DATA_DIR);
if(!fs.existsSync(COMMANDS_FILE)) writeJson(COMMANDS_FILE, []);
if(!fs.existsSync(PERSONAS_FILE)) writeJson(PERSONAS_FILE, [
  { id:"default", name:"Default Operator", style:"balanced", prompt:"Direct, helpful, concise desktop command assistant.", isDefault:true, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { id:"executive", name:"Executive", style:"formal", prompt:"Clear, structured, efficiency-focused responses.", isDefault:false, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() },
  { id:"hacker", name:"Hacker", style:"terse", prompt:"Fast, blunt, technical actions and summaries.", isDefault:false, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() }
]);
if(!fs.existsSync(SHORTCUTS_FILE)) writeJson(SHORTCUTS_FILE, { pushToTalk:"Ctrl+Shift+Space", openHistory:"Ctrl+Shift+H", quickNote:"Ctrl+Shift+N", cancelCommand:"Escape" });
const MIME = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"application/javascript; charset=utf-8", ".json":"application/json; charset=utf-8" };
function send(res,status,data,type="application/json; charset=utf-8"){ res.writeHead(status,{ "Content-Type": type, "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,POST,PUT,OPTIONS", "Access-Control-Allow-Headers":"Content-Type" }); res.end(type.indexOf("application/json") !== -1 ? JSON.stringify(data) : data); }
function parseBody(req){ return new Promise((resolve,reject)=>{ let body=""; req.on("data", chunk=>{ body += chunk; if(body.length > 1e6){ reject(new Error("Body too large")); req.destroy(); } }); req.on("end", ()=>{ if(!body) return resolve({}); try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON body")); } }); req.on("error", reject); }); }
function getCommands(){ return readJson(COMMANDS_FILE, []); }
function setCommands(v){ writeJson(COMMANDS_FILE, v); }
function getPersonas(){ return readJson(PERSONAS_FILE, []); }
function setPersonas(v){ writeJson(PERSONAS_FILE, v); }
function getShortcuts(){ return readJson(SHORTCUTS_FILE, {}); }
function setShortcuts(v){ writeJson(SHORTCUTS_FILE, v); }
function detectType(text){ const t = String(text || "").toLowerCase(); if(t.includes("search")||t.includes("find")||t.includes("look up")) return "search"; if(t.includes("open")||t.includes("launch")||t.includes("start")) return "open_app"; if(t.includes("timer")||t.includes("alarm")||t.includes("remind")) return "set_timer"; if(t.includes("note")||t.includes("remember")||t.includes("write down")) return "take_note"; return "general"; }
function simulatedResult(command){ const text = command.text || ""; switch(command.type){ case "search": return { summary:"Searched for: " + text.replace(/^search\s*/i, ""), detail:"Found 3 likely matches and ranked them by relevance.", items:["Top result prepared","Secondary result matched keywords","Suggested follow-up query added"] }; case "open_app": return { summary:"Prepared app launch for: " + text.replace(/^open\s*/i, ""), detail:"Desktop action simulated successfully.", items:["Application resolved from local app index","Launch intent queued"] }; case "set_timer": return { summary:"Timer created from command: " + text, detail:"Reminder scheduled in simulated automation engine.", items:["Timer stored","Notification path verified"] }; case "take_note": return { summary:"Note captured.", detail:"Saved note text: " + text, items:["Note persisted to command history payload"] }; default: return { summary:"Processed command: " + text, detail:"Generic desktop action simulation completed.", items:["Intent classified","Execution simulated","Result recorded"] }; } }
function processLater(id){ const delay = 900 + Math.floor(Math.random()*800); setTimeout(()=>{ const items = getCommands(); const idx = items.findIndex(c=>c.id===id); if(idx===-1) return; items[idx] = { ...items[idx], status:"completed", completedAt:new Date().toISOString(), result: simulatedResult(items[idx]) }; setCommands(items); }, delay); }
function buildStats(items){ const total = items.length; const completed = items.filter(x=>x.status==="completed").length; const failed = items.filter(x=>x.status==="failed").length; const successRate = total ? Math.round((completed/total)*100) : 0; const usage = {}; for(const item of items){ const key = item.type || "general"; usage[key] = (usage[key] || 0) + 1; } const entries = Object.entries(usage).sort((a,b)=>b[1]-a[1]); const top = entries.length ? entries[0] : ["none", 0]; return { totalCommands: total, completed, failed, successRate, mostUsed: { type: top[0], count: top[1] } }; }
function serveStatic(res, pathname){ let file = path.join(PUBLIC_DIR, pathname === "/" ? "index.html" : pathname.replace(/^\//, "")); if(!file.startsWith(PUBLIC_DIR)) return send(res,404,{error:"Not found"}); if(fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,"index.html"); if(!fs.existsSync(file)) file = path.join(PUBLIC_DIR,"index.html"); try { const ext = path.extname(file).toLowerCase(); send(res,200,fs.readFileSync(file), MIME[ext] || "application/octet-stream"); } catch (err) { send(res,500,{error:"Failed to serve file",detail:String(err.message||err)}); } }
const server = http.createServer(async (req,res)=>{ const url = new URL(req.url, "http://" + req.headers.host); const p = url.pathname; if(req.method === "OPTIONS") return send(res,204,""); try {
  if(p==="/api/health" && req.method==="GET") return send(res,200,{ ok:true, service:"voice-commander-api", port:Number(PORT), timestamp:new Date().toISOString() });
  if(p==="/api/command" && req.method==="POST"){ const body = await parseBody(req); const text = String(body.text || "").trim(); if(!text) return send(res,400,{error:"text is required"}); const items = getCommands(); const command = { id:"cmd_" + Date.now() + "_" + Math.random().toString(36).slice(2,8), text, type: body.type || detectType(text), status:"processing", personaId: body.personaId || "default", createdAt:new Date().toISOString(), result:null }; items.unshift(command); setCommands(items); processLater(command.id); return send(res,202,{ ok:true, command }); }
  if(p==="/api/history" && req.method==="GET") return send(res,200,{ items:getCommands() });
  if(p==="/api/personas" && req.method==="GET") return send(res,200,{ items:getPersonas() });
  if(p==="/api/personas" && req.method==="POST"){ const body = await parseBody(req); const items = getPersonas(); const now = new Date().toISOString(); if(body.id){ const idx = items.findIndex(x=>x.id===body.id); if(idx===-1) return send(res,404,{error:"Persona not found"}); items[idx] = { ...items[idx], ...body, updatedAt: now }; if(body.isDefault){ for(const item of items){ if(item.id !== body.id) item.isDefault = false; } } setPersonas(items); return send(res,200,{ ok:true, item: items[idx] }); } const item = { id:"persona_" + Date.now(), name: body.name || "New Persona", style: body.style || "custom", prompt: body.prompt || "", isDefault: !!body.isDefault, createdAt: now, updatedAt: now }; if(item.isDefault){ for(const existing of items){ existing.isDefault = false; } } items.push(item); setPersonas(items); return send(res,201,{ ok:true, item }); }
  if(p==="/api/stats" && req.method==="GET") return send(res,200,buildStats(getCommands()));
  if(p==="/api/shortcuts" && req.method==="GET") return send(res,200,getShortcuts());
  if(p==="/api/shortcuts" && req.method==="PUT"){ const body = await parseBody(req); const next = { ...getShortcuts(), ...body }; setShortcuts(next); return send(res,200,{ ok:true, item: next }); }
  return serveStatic(res, p);
} catch (err) { console.error("request failed", err); return send(res,500,{ error:"Internal server error", detail:String(err.message||err) }); } });
server.listen(PORT, ()=>console.log("Voice Commander API running on http://localhost:" + PORT));
