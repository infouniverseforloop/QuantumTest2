// backend/telegramFull.js
const axios = require('axios');
const { info, warn } = require('./logger');

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT = process.env.TELEGRAM_CHAT_ID || '';
const API = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId, text, extra={}){
  if(!TOKEN) { warn('Telegram token missing'); return false; }
  try{
    await axios.post(`${API}/sendMessage`, { chat_id: chatId, text, parse_mode:'HTML', ...extra }, { timeout:10000 });
    return true;
  }catch(e){ warn('Telegram send error: ' + (e.response && e.response.data ? JSON.stringify(e.response.data) : e.message)); return false; }
}

function formatSignal(sig){
  const owner = process.env.OWNER_NAME || 'Owner';
  const when = new Date((sig.entry_ts||Math.floor(Date.now()/1000))*1000).toLocaleString();
  const expiry = sig.expiry_ts ? new Date(sig.expiry_ts*1000).toLocaleString() : '-';
  return `<b>Quantum Apex — Signal</b>\nOwner: <b>${owner}</b>\nPair: <b>${sig.pair}</b>\nType: <b>${sig.direction}</b>\nConfidence: <b>${sig.confidence}%</b>\nEntry: <code>${sig.entry}</code> at ${when}\nSL: <code>${sig.sl}</code> | TP: <code>${sig.tp}</code>\nExpiry: ${expiry}\nNotes: ${sig.notes || '-'}`;
}

async function broadcastSignal(sig){
  if(!CHAT) { warn('No TELEGRAM_CHAT_ID configured'); return false; }
  const msg = formatSignal(sig);
  const ok = await sendMessage(CHAT, msg);
  if(ok) info('Telegram: signal sent');
  return ok;
}

module.exports = { broadcastSignal, formatSignal };
