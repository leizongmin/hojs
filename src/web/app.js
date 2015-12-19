/**
 * ho web
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import {$HO, $HO$} from '../global';
import path from 'path';
import project from 'rddx-express';

let debug = $HO$.utils.debug('web');

project.set('path', __dirname);
project.set('port', $HO$.config.get('web.port'));

if ($HO$.config.get('debug')) {
  project.set('mod reload', true);
  project.set('uncaught exception', true);
  project.set('repl', true);
}

// register module
project.register('init', './init.js');
project.register('router.default', './routes/index.js');


project.listen(err => {
  if (err) {
    console.log(`start failed: ${err}`);
    process.exit(1);
  } else {
    console.log(`server listening on port ${$HO$.config.get('web.port')}`);
  }
});
