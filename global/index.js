/**
 * ho global
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import {Namespace} from 'lei-ns';
import createDebug from 'debug';


// global namespace
global.$HO = new Namespace();
global.$HO$ = $HO.data;

// debug
$HO('utils.createDebug', name => createDebug('ho:' + name));
$HO('debug', $HO$.utils.createDebug('global'));

// log
$HO('log', (...args) => console.log(...args));

export default $HO$;
