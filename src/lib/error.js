'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import utils from 'lei-utils';

export var MissingRequiredParameterErorr = utils.customError('MissingRequiredParameterErorr', {code: -2});

export var ParameterTypeError = utils.customError('ParameterTypeError', {code: -3});
