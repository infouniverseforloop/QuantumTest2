// backend/strategyCore.js
function sma(arr, n){ if(!arr || arr.length < n) return null; return arr.slice(-n).reduce((a,b)=>a+b,0)/n; }

function rsiCalc(closes, p=14){
  if(!closes || closes.length < p+1) return 50;
  let gains=0, losses=0;
  for(let i=closes.length-p;i<closes.length;i++){
    const d = closes[i] - closes[i-1];
    if(d>0) gains+=d; else losses+=Math.abs(d);
  }
  const avgG = gains/p, avgL = (losses/p) || 1e-8;
  const rs = avgG/avgL;
  return 100 - (100/(1+rs));
}

function detectOB(candles){
  if(!candles || candles.length<12) return false;
  const last = candles[candles.length-2];
  const body = Math.abs(last.close-last.open);
  const avgBody = candles.slice(-12).reduce((a,b)=>a+Math.abs(b.close-b.open),0)/12 || 1e-8;
  return body > avgBody*1.5;
}

function computeSignal(pair, candles, opts={}){
  if(!candles || candles.length < 120) return { status:'hold', reason:'insufficient' };
  const closes = candles.map(c=>c.close);
  const sma5 = sma(closes,5), sma20 = sma(closes,20);
  const rsi = rsiCalc(closes,14);
  const last = candles[candles.length-1], prev = candles[candles.length-2];
  const ob = detectOB(candles);
  let score = 50;
  const bullish = sma5 && sma20 && sma5 > sma20 && last.close > prev.close;
  const bearish = sma5 && sma20 && sma5 < sma20 && last.close < prev.close;
  if(bullish) score += 14;
  if(bearish) score -= 14;
  if(rsi < 30) score += 8;
  if(rsi > 70) score -= 8;
  if(ob) score += 6;
  const recentRange = candles.slice(-14).map(c=>Math.abs(c.high-c.low)).reduce((a,b)=>a+b,0)/14 || 0.0002;
  const atr = recentRange;
  const callThr = parseInt(process.env.CONF_THRESHOLD_CALL||'70',10);
  const putThr = parseInt(process.env.CONF_THRESHOLD_PUT||'30',10);
  const direction = score >= callThr ? 'CALL' : (score <= putThr ? 'PUT' : (bullish?'CALL':'PUT'));
  const conf = Math.max(10, Math.min(99, Math.round(score)));
  const sl = +(direction==='CALL' ? (last.close - atr * parseFloat(process.env.SL_ATR_MULT||'1.2')) : (last.close + atr * parseFloat(process.env.SL_ATR_MULT||'1.2')));
  const tp = +(direction==='CALL' ? (last.close + atr * parseFloat(process.env.TP_ATR_MULT||'2.0')) : (last.close - atr * parseFloat(process.env.TP_ATR_MULT||'2.0')));
  return {
    status:'ok',
    pair,
    direction,
    confidence: conf,
    entry: last.close,
    sl: +sl.toFixed(pair.includes('JPY')?2:5),
    tp: +tp.toFixed(pair.includes('JPY')?2:5),
    entry_ts: Math.floor(Date.now()/1000),
    expiry_ts: Math.floor(Date.now()/1000) + parseInt(process.env.BINARY_EXPIRY_SECONDS||'60',10),
    notes: `rsi:${Math.round(rsi)}|ob:${!!ob}`
  };
}

module.exports = { computeSignal };
