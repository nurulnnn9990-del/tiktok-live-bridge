const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

// 1. Cipta pelayan HTTP
const server = http.createServer((req, res) => {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
res.writeHead(204);
res.end();
return;
}

// Menerima data Webhook daripada TikFinity
if (req.method === 'POST') {
let body = '';
req.on('data', chunk => {
body += chunk.toString();
});

req.on('end', () => {
try {
const data = JSON.parse(body || '{}');
console.log('TikFinity Data:', JSON.stringify(data));

// Ekstrak nama pengguna & teks
const name = data.nickname || data.uniqueId || data.username || data.name || 'Visitor';
const comment = data.comment || data.text || data.message || name;

// Format data padanan tepat untuk sistem Haruka Hatchable
const messagePayload = JSON.stringify({
type: 'chat',
event: 'chat',
nickname: name,
uniqueId: name,
comment: comment,
text: comment,
name: name
});

// Hantar ke semua sambungan Hatchable yang sedang bersambung
let count = 0;
wss.clients.forEach(client => {
if (client.readyState === WebSocket.OPEN) {
client.send(messagePayload);
count++;
}
});

console.log(`Berjaya hantar mesej [${name}] ke ${count} paparan Hatchable.`);
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ status: 'ok', sentTo: count }));
} catch (err) {
console.error('Ralat Parsing Webhook:', err);
res.writeHead(400, { 'Content-Type': 'text/plain' });
res.end('Bad Request');
}
});
return;
}

// Ujian pelayan dibuka di pelayar biasa
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('TikTok Live Bridge Server is LIVE and READY!');
});

// 2. Cipta pelayan WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
console.log('>>> Web Hatchable berjaya disambung! <<<');

// Hantar isyarat selamat datang supaya Hatchable tahu pelayan aktif
ws.send(JSON.stringify({ type: 'connected', message: 'Bridge Ready' }));

ws.on('message', (msg) => {
console.log('Mesej dari Hatchable:', msg.toString());
});

ws.on('close', () => {
console.log('>>> Sambungan Hatchable ditutup. <<<');
});

ws.on('error', (err) => {
console.error('WebSocket Error:', err);
});
});

// 3. Hidupkan pelayan
server.listen(PORT, () => {
console.log(`Bridge Server aktif di port ${PORT}...`);
});
