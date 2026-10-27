if (req.method === 'POST') {
let body = '';
req.on('data', chunk => {
body += chunk.toString();
});

req.on('end', () => {
try {
const rawData = JSON.parse(body || '{}');
console.log('TikFinity Data Masuk:', rawData);

// Ambil nama atau teks daripada pelbagai kemungkinan parameter TikFinity
const senderName = rawData.nickname || rawData.uniqueId || rawData.user || rawData.username || rawData.comment || 'Tetamu';
const commentText = rawData.comment || rawData.text || rawData.message || rawData.data || senderName;

// Cipta paket yang menyamar sebagai format asal TikTok connector supaya Hatchable faham
const packet = JSON.stringify({
event: rawData.event || 'chat',
uniqueId: rawData.uniqueId || senderName,
nickname: senderName,
comment: commentText,
giftName: rawData.giftName || '',
...rawData
});

// Hantar terus ke skrin Haruka / Hatchable
wss.clients.forEach(client => {
if (client.readyState === WebSocket.OPEN) {
client.send(packet);
}
});

res.writeHead(200, { 'Content-Type': 'application/json' });
res.end(JSON.stringify({ status: 'ok' }));
} catch (err) {
console.error('Ralat JSON:', err);
res.writeHead(400);
res.end('Error');
}
});
return;
}
