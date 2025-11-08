// backend/resultResolver.js
const { recordResult } = require('./aiLearner');
const { backup } = require('./cloudBackup');
const { broadcastSignal } = require('./telegramFull');
const { insertResult } = require('./db');
const { info, warn } = require('./logger');

async function resolveSignal(signal, finalPrice){
  try{
    const entry = signal.entry;
    const dir = signal.direction;
    const win = dir === 'CALL' ? (finalPrice > entry) : (finalPrice < entry);
    signal.result = win ? 'WIN' : 'LOSS';
    signal.finalPrice = finalPrice;
    signal.settled_ts = Math.floor(Date.now()/1000);
    await backup(signal);
    insertResult(signal);
    recordResult(signal);
    try{ await broadcastSignal({ ...signal, notes: 'Result notification', result: signal.result }); }catch(e){ warn('Telegram result failed'); }
    info(`Resolved: ${signal.pair} => ${signal.result}`);
    return signal;
  }catch(e){ warn('resolveSignal error: ' + e.message); throw e; }
}

module.exports = { resolveSignal };
