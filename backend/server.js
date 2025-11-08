// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { info } = require('./logger');
const signalEngine = require('./signalEngine');
const brokerManager = require('./brokerManager');

const app = express();
const PORT = parseInt(process.env.PORT || '5000',10);

app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/health', (req,res) => res.json({ ok:true, server_time: new Date().toISOString() }));
// debug test endpoint
app.post('/api/debug/force-test', express.json(), async (req,res) => {
  if((process.env.ALLOW_TEST||'false') !== 'true') return res.status(403).json({ ok:false, message:'test disabled' });
  const sig = req.body.signal || {
    pair: 'EUR/USD', direction: 'CALL', confidence: 90, entry: 1.0953,
    sl: 1.0940, tp: 1.0975, entry_ts: Math.floor(Date.now()/1000), expiry_ts: Math.floor(Date.now()/1000) + 60, mode:'normal', notes:'debug'
  };
  try{
    const { broadcastSignal } = require('./telegramFull');
    const { backup } = require('./cloudBackup');
    await backup(sig);
    await broadcastSignal(sig);
    res.json({ ok:true, sent:true });
  }catch(e){ res.status(500).json({ ok:false, err:e.message }); }
});

const server = http.createServer(app);
server.listen(PORT, async ()=>{
  info(`Quantum Apex listening on port ${PORT}`);
  await brokerManager.initAdapters();
  signalEngine.start().catch(e => console.error('Engine error', e));
});
