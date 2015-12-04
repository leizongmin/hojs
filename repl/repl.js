/**
 * ho REPL
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import REPL from 'repl';
import path from 'path';
import fs from 'fs';
import {$HO, $HO$} from '../global';
let debug = $HO$.utils.debug('repl');


debug('starting ho REPL...');


global.repl = {};

let formatPath = f => f.replace(/\\/g, '/').replace(/^\/+/, '').trim();

repl.reload = f => {
  let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
  debug(`reload('${f}' as '${rf}')`);
  if (require.cache[rf]) {
    delete require.cache[rf];
  } else {
    debug(`  - '${rf}' does not in cache`);
  }
  require(rf);
};

repl.load = f => {
  let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
  debug(`load('${f}' as '${rf}')`);
  require(rf);
};

repl.removePackage = n => {
  let f = require.resolve(n);
  let ss = f.split('/node_modules/');
  let s = ss.pop().split('/')[0];
  let d = ss.join('/node_modules/') + '/' + s + '/';
  debug(`removePackage('${n}'): main=${f}, path=${d}`);
  for (let i in require.cache) {
    if (i.indexOf(d) === 0) {
      debug(`  - delete cache '${i}'`);
      delete require.cache[i];
    }
  }
};

repl.reloadPackage = (n, ret = true) => {
  repl.removePackage(n);
  debug(`reloadPackage('${n}')`);
  let m = require(n);
  return ret ? m : 'ok';
};

repl.exit = () => {
  process.exit();
};

process.on('exit', code => {
  $HO$.log(`process exit with code ${code}`);
});

repl.load('index');
$HO('repl', REPL.start({
  replMode: REPL.REPL_MODE_STRICT,
  useGlobal: true,
}));
