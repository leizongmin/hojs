/**
 * ho global
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import path from 'path';
import fs from 'fs';
import {Namespace} from 'lei-ns';
import createDebug from 'debug';
import config from 'lei-config';


// global namespace
global.$HO = new Namespace();
global.$HO$ = $HO.data;
export default $HO$;

// debug
$HO('utils.createDebug', name => createDebug('ho:' + name));
$HO('debug', $HO$.utils.createDebug('global'));

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
