// backend/signalEngine.js
const { info, warn } = require('./logger');
const brokerManager = require('./brokerManager');
const { computeSignalForPair } = require('./computeStrategy');
const { broadcastSignal } = require('./telegramFull');
const { backup } = require('./cloudBackup');
const { insertSignal } = require('./db');
const { resolveSignal } = require('./resultResolver');

const WATCH = (process.env.WATCH_SYMBOLS || 'EUR/USD,GBP/USD,USD/JPY,AUD/USD,USD/CAD,USD/CHF,NZD/USD').split(',').map(s=>s.trim());
const INTERVAL = parseInt(process.env.SCAN_INTERVAL_MS||'4000',10);
const MIN_CONF = parseInt(process.env.MIN_CONFIDENCE||'80',10);

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function start(){
  info('Initializing adapters...');
  const adapters = await brokerManager.initAdapters();
  info('Adapters ready: ' + adapters.map(a=>a.name).join(', '));
  info('Starting scan loop...');
  while(true){
    try{
      const active = brokerManager.getAdapters();
      if(!active || active.length === 0){
        warn('No adapters active — waiting...');
        await sleep(3000); continue;
      }
      for(const pair of WATCH){
        try{
          let candles = null;
          for(const a of active){
            try{
              const arr = await a.adapter.fetchRecentCandles(pair, 400);
              if(arr && arr.length){ candles = arr; break; }
            }catch(e){}
          }
          if(!candles) continue;
          const sig = await computeSignalForPair(pair, candles, { mode: process.env.MODE || 'normal' });
          if(sig && sig.status === 'ok'){
            if(sig.confidence >= MIN_CONF){
              sig.id = Date.now() + Math.floor(Math.random()*9999);
              insertSignal(sig);
              await backup(sig);
              await broadcastSignal(sig);
              info(`Emitted signal ${pair} ${sig.direction} conf:${sig.confidence}`);
              // wait until expiry then resolve
              const waitSec = Math.max(5, (sig.expiry_ts - Math.floor(Date.now()/1000)) + 2);
              await sleep(waitSec*1000 + 1000);
              // resolve using latest close
              let finalPrice = sig.entry;
              try{
                for(const a of active){
                  const arr = await a.adapter.fetchRecentCandles(pair, 3);
                  if(arr && arr.length){ finalPrice = arr[arr.length-1].close; break; }
                }
              }catch(e){}
              await resolveSignal(sig, finalPrice);
            }
          }
        }catch(e){ warn('Pair loop error: ' + e.message); }
      }
    }catch(e){ warn('Scan outer error: ' + e.message); }
    await sleep(INTERVAL);
  }
}

module.exports = { start };
