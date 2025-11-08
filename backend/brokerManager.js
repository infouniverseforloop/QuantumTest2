// backend/brokerManager.js
const { info, warn } = require('./logger');
const quotexAdapter = require('./quotexAdapter');

let activeAdapters = [];

async function initAdapters(){
  activeAdapters = [];
  if((process.env.USE_REAL_QUOTEX||'false') === 'true'){
    const ok = await quotexAdapter.init();
    if(ok){ info('Quotex adapter ready'); activeAdapters.push({ name:'quotex', adapter:quotexAdapter }); }
    else warn('Quotex adapter failed init');
  } else info('Quotex adapter disabled by env');
  if(activeAdapters.length === 0) warn('No adapters active — safe-mode (no live signals)');
  return activeAdapters;
}

function getAdapters(){ return activeAdapters.slice(); }

module.exports = { initAdapters, getAdapters };
