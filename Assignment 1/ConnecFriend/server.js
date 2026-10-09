// Zero-dependency static server plus a small RFC 6455 WebSocket relay.
// Chat history is persisted so offline recipients receive messages on reconnect.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const historyFile = path.join(root, 'messages.db.json');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
const sockets = new Set();
let history = [];
try { history = JSON.parse(fs.readFileSync(historyFile, 'utf8')); if (!Array.isArray(history)) history = []; } catch { history = []; }

function frame(text) {
  const payload = Buffer.from(text);
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  if (payload.length < 65536) { const h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(payload.length, 2); return Buffer.concat([h, payload]); }
  const h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(payload.length), 2); return Buffer.concat([h, payload]);
}
function send(client, value) { if (!client.socket.destroyed) client.socket.write(frame(JSON.stringify(value))); }
function broadcastPresence() { const users = [...new Set([...sockets].map(client => client.userId))]; for (const peer of sockets) send(peer, { type: 'presence', users }); }
function saveHistory() { fs.writeFile(historyFile, JSON.stringify(history, null, 2), () => {}); }
function handle(client, value) {
  if (value.type === 'reset') { history = []; saveHistory(); for (const peer of sockets) send(peer, { type: 'reset' }); return; }
  if (value.type === 'message' && value.message && value.message.fromId === client.userId) {
    const m = value.message;
    if (!m.id || !m.toId || typeof m.text !== 'string' || !m.text.trim()) return;
    if (!history.some(existing => existing.id === m.id)) { history.push(m); saveHistory(); }
    for (const peer of sockets) if (peer.userId === m.fromId || peer.userId === m.toId) send(peer, { type: 'message', message: m });
  } else if (value.type === 'read' && value.fromId === client.userId) {
    const ids = new Set(value.ids || []);
    history = history.map(m => ids.has(m.id) && m.toId === client.userId ? { ...m, read: true } : m);
    saveHistory();
    for (const peer of sockets) if (peer.userId === value.toId) send(peer, { type: 'read', ids: [...ids] });
  }
}
function upgrade(req, socket) {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname !== '/socket' || !/^u\d+$/.test(url.searchParams.get('user') || '')) { socket.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  if (!key || req.headers.upgrade?.toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const client = { socket, userId: url.searchParams.get('user'), buffer: Buffer.alloc(0) };
  sockets.add(client);
  send(client, { type: 'history', messages: history.filter(m => m.fromId === client.userId || m.toId === client.userId) });
  broadcastPresence();
  socket.on('data', chunk => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    while (client.buffer.length >= 2) {
      const opcode = client.buffer[0] & 0x0f, masked = (client.buffer[1] & 0x80) !== 0;
      let size = client.buffer[1] & 0x7f, offset = 2;
      if (size === 126) { if (client.buffer.length < 4) break; size = client.buffer.readUInt16BE(2); offset = 4; }
      else if (size === 127) { if (client.buffer.length < 10) break; const wide = client.buffer.readBigUInt64BE(2); if (wide > 1_000_000n) return socket.destroy(); size = Number(wide); offset = 10; }
      const maskBytes = masked ? 4 : 0;
      if (client.buffer.length < offset + maskBytes + size) break;
      const mask = masked ? client.buffer.subarray(offset, offset + 4) : null; offset += maskBytes;
      const body = Buffer.from(client.buffer.subarray(offset, offset + size));
      client.buffer = client.buffer.subarray(offset + size);
      if (masked) for (let i = 0; i < body.length; i++) body[i] ^= mask[i % 4];
      if (opcode === 8) { socket.end(); return; }
      if (opcode === 9) { socket.write(Buffer.concat([Buffer.from([0x8a, body.length]), body])); continue; }
      if (opcode === 1) { try { handle(client, JSON.parse(body.toString('utf8'))); } catch { /* Ignore malformed frames. */ } }
    }
  });
  socket.on('close', () => { sockets.delete(client); broadcastPresence(); });
  socket.on('error', () => { sockets.delete(client); broadcastPresence(); });
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(data);
  });
});
server.on('upgrade', upgrade);
server.listen(3000, () => console.log('ConnecFriend is ready at http://localhost:3000 (chat socket on /socket)'));
