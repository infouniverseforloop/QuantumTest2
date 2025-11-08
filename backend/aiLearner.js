// backend/aiLearner.js
const fs = require('fs');
const path = require('path');
const { info } = require('./logger');
const FILE = path.join(__dirname, '..', 'data', 'ai_learner.json');

function ensure(){ const dir = path.dirname(FILE); if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive:true }); if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ weight:1.0, history:[] }, null, 2)); }
function load(){ ensure(); try{ return JSON.parse(fs.readFileSync(FILE)); }catch(e){ return { weight:1.0, history:[] }; } }
function save(o){ fs.writeFileSync(FILE, JSON.stringify(o, null, 2)); }

function getWeight(){ const d = load(); return d.weight || 1.0; }

function recordResult(signal){
  const d = load();
  d.history = d.history || [];
  d.history.push({ t:new Date().toISOString(), id: signal.id, pair: signal.pair, conf: signal.confidence, result: signal.result });
  if(d.history.length > 500) d.history = d.history.slice(-500);
  const recent = d.history.slice(-80);
  const wins = recent.filter(r=>r.result==='WIN').length;
  const losses = recent.filter(r=>r.result==='LOSS').length;
  if(losses > wins + 6) d.weight = Math.max(0.5, (d.weight||1.0) * 0.96);
  else if(wins > losses + 6) d.weight = Math.min(1.8, (d.weight||1.0) * 1.03);
  save(d);
  info('aiLearner weight updated: ' + d.weight);
}

module.exports = { getWeight, recordResult };
