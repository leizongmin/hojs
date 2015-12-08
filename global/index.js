/**
 * ho global
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import path from 'path';
import fs from 'fs';
import {EventEmitter} from 'events';
import {Namespace} from 'lei-ns';
import createDebug from 'debug';
import config from 'lei-config';


// global namespace
let $HO = global.$HO = new Namespace();
let $HO$ = global.$HO$ = $HO.data;
export {$HO, $HO$};

// envent listener
$HO('event', new EventEmitter());
$HO$.event.setMaxListeners(0);

// debug
$HO('utils.debug', name => createDebug('ho:' + name));
$HO('debug', $HO$.utils.debug('global'));

// log
$HO('log', (...args) => console.log(...args));

$HO('APP_DIR', path.resolve(__dirname, '..'));
$HO('WEB_DIR', path.resolve(__dirname, '../web'));

// load config
config.init({
  envName: 'NODE_ENV',
  path: path.resolve($HO$.APP_DIR, './config'),
  defaultName: 'default',
});
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
config.load();
$HO('config', config);
