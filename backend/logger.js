// backend/logger.js
const colors = { cyan:'\x1b[36m', green:'\x1b[32m', yellow:'\x1b[33m', red:'\x1b[31m', gray:'\x1b[90m', reset:'\x1b[0m' };
function ts(){ return new Date().toISOString().replace('T',' ').split('.')[0]; }
function info(m){ console.log(`${colors.cyan}[${ts()}] [INFO]${colors.reset} ${m}`); }
function ok(m){ console.log(`${colors.green}[${ts()}] [OK]${colors.reset} ${m}`); }
function warn(m){ console.log(`${colors.yellow}[${ts()}] [WARN]${colors.reset} ${m}`); }
function err(m){ console.log(`${colors.red}[${ts()}] [ERR]${colors.reset} ${m}`); }
function dbg(m){ if(process.env.DEBUG==='true') console.log(`${colors.gray}[${ts()}] [DBG] ${m}${colors.reset}`); }
module.exports = { info, ok, warn, err, dbg };
