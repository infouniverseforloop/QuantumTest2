// backend/cloudBackup.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { info, warn } = require('./logger');
const FIRE_URL = (process.env.FIREBASE_DB_URL||'').replace(/\/$/,'');
const DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DIR, 'backup_signals.json');
function ensure(){ if(!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive:true }); if(!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([])); }
async function backup(sig){
  try{
    ensure();
    const arr = JSON.parse(fs.readFileSync(FILE));
    arr.unshift({ t:new Date().toISOString(), sig });
    if(arr.length>1000) arr.pop();
    fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));
    if(FIRE_URL) { await axios.post(`${FIRE_URL}/signals.json`, sig); info('Backup: to Firebase'); } else info('Backup: saved locally');
  }catch(e){ warn('Backup failed: '+e.message); }
}
module.exports = { backup };
