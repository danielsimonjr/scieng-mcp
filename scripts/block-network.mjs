// Refuses every socket connect, DNS lookup and fetch of this process and of its worker threads.
// Each attempt is appended to the file named by SCIENG_TEST_NET_LOG. Load it with node --import.
import net from "node:net";
import dns from "node:dns";
import { appendFileSync } from "node:fs";

const LOG = process.env.SCIENG_TEST_NET_LOG;

function record(kind, detail) {
  if (LOG) appendFileSync(LOG, new Date().toISOString() + " " + kind + " " + detail + "\n");
}

function refused(kind) {
  return Object.assign(new Error("network refused by the test (" + kind + ")"), { code: "ETESTREFUSED" });
}

net.Socket.prototype.connect = function connectRefused(...args) {
  record("socket.connect", JSON.stringify(args.filter((a) => typeof a !== "function")));
  process.nextTick(() => this.destroy(refused("socket.connect")));
  return this;
};

dns.lookup = (host, ...rest) => {
  const callback = rest[rest.length - 1];
  record("dns.lookup", String(host));
  process.nextTick(() => callback(refused("dns.lookup")));
};

dns.promises.lookup = async (host) => {
  record("dns.promises.lookup", String(host));
  throw refused("dns.promises.lookup");
};

globalThis.fetch = async (input) => {
  record("fetch", String(input && input.url ? input.url : input));
  throw refused("fetch");
};
