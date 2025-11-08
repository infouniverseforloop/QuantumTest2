// backend/db.js
const fs = require('fs');
const path = require('path');
const { info, warn } = require('./logger');
const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'signals_store.json');
function ensure(){ if(!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive:true }); if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ signals:[], results:[] }, null, 2)); }
function insertSignal(sig){ try{ ensure(); const o = JSON.parse(fs.readFileSync(FILE)); o.signals.unshift(sig); if(o.signals.length>500) o.signals = o.signals.slice(0,500); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); info('DB: signal saved'); }catch(e){ warn('DB insertSignal failed'); } }
function insertResult(res){ try{ ensure(); const o = JSON.parse(fs.readFileSync(FILE)); o.results.unshift(res); if(o.results.length>500) o.results = o.results.slice(0,500); fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); info('DB: result saved'); }catch(e){ warn('DB insertResult failed'); } }
function listRecent(n=100){ try{ ensure(); const o = JSON.parse(fs.readFileSync(FILE)); return { signals: o.signals.slice(0,n), results: o.results.slice(0,n) }; }catch(e){ warn('DB listRecent fail'); return { signals:[], results:[] }; } }
module.exports = { insertSignal, insertResult, listRecent };
