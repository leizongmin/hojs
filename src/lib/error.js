'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import utils from 'lei-utils';

export var MissingRequiredParameterErorr = utils.customError('MissingRequiredParameterErorr', {code: -2, type: 'missing_required_parameter'});

export var ParameterTypeError = utils.customError('ParameterTypeError', {code: -3, type: 'parameter_error'});
