// public/app.js (polls /health; minimal UI)
const serverTimeEl = document.getElementById('serverTime');
const activeEl = document.getElementById('active');
const historyEl = document.getElementById('history');

async function refresh(){
  try{
    const r = await fetch('/health'); const j = await r.json();
    serverTimeEl.innerText = 'Server: ' + (j.server_time || '-');
  }catch(e){}
}
setInterval(refresh, 2000); refresh();
