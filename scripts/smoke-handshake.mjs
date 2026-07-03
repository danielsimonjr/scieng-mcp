import { spawn } from "node:child_process";

const INIT = JSON.stringify({
  jsonrpc: "2.0", id: 1, method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "smoke", version: "0" } },
}) + "\n";

const p = spawn("node", ["bundle/index.mjs"], { stdio: ["pipe", "pipe", "inherit"] });
let out = "";
const timer = setTimeout(() => { p.kill(); console.error("SMOKE FAIL: no handshake in 15s"); process.exit(1); }, 15000);
p.stdout.on("data", (d) => {
  out += String(d);
  if (out.includes('"serverInfo"')) {
    clearTimeout(timer); p.kill();
    console.log("SMOKE PASS: serverInfo received");
    process.exit(0);
  }
});
p.on("exit", (code) => {
  if (!out.includes('"serverInfo"')) { clearTimeout(timer); console.error(`SMOKE FAIL: exited ${code} without serverInfo`); process.exit(1); }
});
p.stdin.write(INIT);
