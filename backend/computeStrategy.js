// backend/computeStrategy.js
const { computeSignal } = require('./strategyCore');
const { detectManipulation } = require('./manipulationDetector');
const { getWeight } = require('./aiLearner');
const { info } = require('./logger');

async function computeSignalForPair(pair, candles, opts={}){
  if(!candles || candles.length < 120) return { status:'hold', reason:'insufficient' };
  if(detectManipulation(candles)) return { status:'hold', reason:'manipulation' };
  const base = computeSignal(pair, candles, opts);
  if(!base || base.status !== 'ok') return { status:'hold', reason:'no-signal' };
  try{
    const w = getWeight();
    base.confidence = Math.min(99, Math.round(base.confidence * w));
  }catch(e){ /* ignore */ }
  const minConf = parseInt(process.env.MIN_CONFIDENCE||'80',10);
  if(base.confidence < minConf) return { status:'hold', reason:'low_conf', confidence: base.confidence };
  info(`computeSignalForPair: ${pair} ${base.direction} conf:${base.confidence}`);
  return base;
}

module.exports = { computeSignalForPair };
