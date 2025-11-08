// backend/manipulationDetector.js
function detectSpike(candles, factor=3.0){
  if(!candles || candles.length < 20) return false;
  const last = candles[candles.length-1];
  const vols = candles.slice(-30).map(c=>c.volume||1);
  const avg = vols.reduce((a,b)=>a+b,0)/vols.length;
  return ((last.volume||1) > avg * factor);
}
function detectGap(candles){
  if(!candles || candles.length < 5) return false;
  const last = candles[candles.length-1], prev = candles[candles.length-2];
  if(Math.abs(last.close - prev.close) / (prev.close || 1) > 0.01) return true;
  return false;
}
function detectManipulation(candles){
  if(detectSpike(candles, parseFloat(process.env.MANIP_SPIKE_FACTOR||'4'))) return true;
  if(detectGap(candles)) return true;
  return false;
}
module.exports = { detectManipulation, detectSpike, detectGap };
