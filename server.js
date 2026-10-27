const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

// 1. Cipta HTTP Server untuk terima Webhook dari TikFinity
const server = http.createServer((req, res) => {
// CORS Header supaya webhook tidak disekat
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
res.writeHead(204);
res.end();
return;
}

// Laluan Webhook untuk TikFinity
if (req.method === 'POST' && (req.url === '/api/webhook' || req.url === '/webhook')) {
let body = '';
req.on('data', chunk => {
body += chunk.toString();
});

req.on('end', () => {
try {
const data = JSON.parse(body || '{}');
console.log('Data diterima dari TikFinity:', data);

// Cari nama penonton daripada data yang dihantar
const targetName = data.username || data.nickname || data.name || data.comment || 'Penonton';

// Format mesej ke Hatchable
const payload = JSON.stringify({
event: 'write_name',
name: targetName,
text: targetName
});

// Hantar ke semua skrin Hatchable yang bersambung
let sentCount = 0;
wss.clients.forEach(client => {
if (client.readyState === WebSocket.OPEN) {
client.send(payload);
sentCount++;
}
});

console.log(`Nama "${targetName}" dihantar ke ${sentCount} skrin Hatchable.`);
res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ status: 'success', name: targetName }));
} catch (err) {
console.error('Ralat membaca JSON Webhook:', err);
res.writeHead(400, { 'Content-Type': 'text/plain' });
res.end('Invalid JSON');
}
});
} else {
// Paparan utama pelayan
res.writeHead(200, { 'Content-Type': 'text/plain' });
res.end('TikTok Live Bridge Server is Running Online!');
}
});

// 2. Cipta WebSocket Server untuk disambung oleh Hatchable
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
console.log('Web Hatchable berjaya disambung!');

ws.on('close', () => {
console.log('Sambungan Hatchable ditutup.');
});
});

// 3. Jalankan Server
server.listen(PORT, () => {
console.log(`Bridge Server sedang berjalan di port ${PORT}...`);
});
