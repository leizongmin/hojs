/**
 * ho REPL
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import REPL from 'repl';
import path from 'path';
import fs from 'fs';
import $HO$ from '../global';


$HO$.log('starting ho REPL...');


global.repl = {};

let formatPath = f => f.replace(/\\/g, '/').replace(/^\/+/, '').trim();

repl.reload = f => {
  let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
  $HO$.log(`reload('${f}' as '${rf}')`);
  if (require.cache[rf]) {
    delete require.cache[rf];
  } else {
    $HO$.log(`  - '${rf}' does not in cache`);
  }
  require(rf);
};

repl.load = f => {
  let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
  $HO$.log(`load('${f}' as '${rf}')`);
  require(rf);
};

repl.removePackage = n => {
  let f = require.resolve(n);
  let ss = f.split('/node_modules/');
  let s = ss.pop().split('/')[0];
  let d = ss.join('/node_modules/') + '/' + s + '/';
  $HO$.log(`removePackage('${n}'): main=${f}, path=${d}`);
  for (let i in require.cache) {
    if (i.indexOf(d) === 0) {
      $HO$.log(`  - delete cache '${i}'`);
      delete require.cache[i];
    }
  }
};

repl.reloadPackage = (n, ret = true) => {
  repl.removePackage(n);
  $HO$.log(`reloadPackage('${n}')`);
  let m = require(n);
  return ret ? m : 'ok';
};

repl.exit = () => {
  $HO$.log('exit');
  process.exit();
};


repl.load('index');
$HO('repl', REPL.start({
  replMode: REPL.REPL_MODE_STRICT,
  useGlobal: true,
}));
