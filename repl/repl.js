/**
 * ho REPL
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import REPL from 'repl';
import path from 'path';
import fs from 'fs';
import {inspect} from 'util';
import clc from 'cli-color';
import {$HO, $HO$} from '../global';
let debug = $HO$.utils.debug('repl');


debug('starting ho REPL...');


$HO('repl', REPL.start({
  prompt: clc.yellow('HO') + clc.green('> '),
  replMode: REPL.REPL_MODE_STRICT,
  useGlobal: false,
}));


let formatPath = f => f.replace(/\\/g, '/').replace(/^\/+/, '').trim();

let reload = f => {
  let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
  debug(`reload('${f}' as '${rf}')`);
  if (require.cache[rf]) {
    delete require.cache[rf];
  } else {
    debug(`  - '${rf}' does not in cache`);
  }
  require(rf);
  $HO$.repl.displayPrompt();
};
$HO$.repl.defineCommand('rl', {
  help: 'HO: reload file from WEB_DIR',
  action: reload,
});

$HO$.repl.defineCommand('l', {
  help: 'HO: load file from WEB_DIR',
  action: f => {
    let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
    debug(`load('${f}' as '${rf}')`);
    require(rf);
    $HO$.repl.displayPrompt();
  },
});

$HO$.repl.defineCommand('rmp', {
  help: 'HO: remove package',
  action: n => {
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
    $HO$.repl.displayPrompt();
  },
});

$HO$.repl.defineCommand('rlp', {
  help: 'HO: reload packkage',
  action: (n, ret = true) => {
    repl.removePackage(n);
    debug(`reloadPackage('${n}')`);
    let m = require(n);
    $HO$.repl.displayPrompt();
  },
});

$HO$.repl.defineCommand('cc', {
  help: 'HO: clear cache',
  action: () => {
    let c = 0;
    for (let i in require.cache) {
      c++;
      delete require.cache[i];
    }
    debug(`clearCache(${c})`);
    $HO$.repl.displayPrompt();
  },
});

$HO$.repl.defineCommand('i', {
  help: 'HO: inspect object',
  action: n => {
    let data = eval(n);
    if (typeof data === 'function') {
      console.log(clc.green(data.toString()));
    } else {
      console.log(inspect(data, {
        colors: true,
        depth: 10,
        showHidden: true,
      }));
    }
    $HO$.repl.displayPrompt();
  },
});

$HO$.repl.defineCommand('w', {
  help: 'HO: watch file',
  action: f => {
    let rf = path.resolve($HO$.WEB_DIR, formatPath(f));
    debug(`watch('${f}' as '${rf}')`);
    fs.watch(rf, (e) => {
      debug(`file ${e}: ${f}`);
      reload(f);
    });
  }
});


$HO$.repl.on('exit', () => {
  $HO$.log(`REPL exit`);
  process.exit();
});

process.on('exit', code => {
  $HO$.log(`process exit with code ${code}`);
});

process.on('uncaughtException', err => {
  $HO$.log(`uncaughtException: ${err.stack}`);
  $HO$.repl.displayPrompt();
});


// HOOK require()
{
  let SYMBOL_EXTENSIONS = Symbol('require');
  global[SYMBOL_EXTENSIONS] = {};

  let appDir = $HO$.APP_DIR + '/';
  let modulesDir = $HO$.APP_DIR + '/node_modules/';
  let wrapExtensionLoader = loader => {
    return (module, f) => {
      debug(`require('${f}')`);
      let m = loader(module, f);
      if (f.indexOf(modulesDir) !== 0 && f.indexOf(appDir) === 0) {
        debug(`  - deleteCache('${f}')`);
        delete require.cache[f];
      }
      return m;
    };
  }

  for (let i in require.extensions) {
    global[SYMBOL_EXTENSIONS][i] = require.extensions[i];
    require.extensions[i] = wrapExtensionLoader(require.extensions[i]);
  }
}


reload('index');
$HO$.event.on('web server listening', port => {
  $HO$.repl.displayPrompt();
});