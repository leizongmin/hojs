'use strict';

/**
 * hojs
 *
 * @author Zongmin Lei <leizongmin@gmail.com>
 */

import assert from 'assert';
import validator from 'validator';

export default function (registerType) {

  registerType('Boolean', {
    checker: (v) => typeof v === 'boolean' || (typeof v === 'string' && validator.isBoolean(v)),
    formatter: (v) => String(v).toLowerCase() === 'true' ? true : false,
    description: 'boolean',
    isDefault: true,
  });

  registerType('Date', {
    checker: (v) => v instanceof Date || (typeof v === 'string' && validator.isDate(v)),
    formatter: (v) => new Date(v),
    description: 'date',
    isDefault: true,
  });

  registerType('String', {
    checker: (v) => typeof v === 'string',
    description: 'string',
    isDefault: true,
  });

  registerType('TrimString', {
    checker: (v) => typeof v === 'string',
    formatter: (v) => v.trim(),
    description: 'auto trim string',
  });

  registerType('Number', {
    checker: (v, p) => {
      const ok = !isNaN(v);
      if (ok && p) {
        if ('min' in p && !(v >= p.min)) return false;
        if ('max' in p && !(v <= p.max)) return false;
      }
      return ok;
    },
    formatter: (v) => Number(v),
    paramsChecker: (params) => {
      if ('max' in params) {
        assert(typeof params.max === 'number', `params.max expected a number but get ${params.max}(${typeof params.max})`);
      }
      if ('min' in params) {
        assert(typeof params.min === 'number', `params.min expected a number but get ${params.min}(${typeof params.min})`);
      }
      if ('max' in params && 'min' in params) {
        assert(params.min < params.max, `params.min must less than params.max`);
      }
      return true;
    },
    description: 'number',
    isDefault: true,
  });

  registerType('Integer', {
    checker: (v) => validator.isInt(String(v)),
    formatter: (v) => Number(v),
    description: 'integer',
    isDefault: true,
  });

  registerType('Float', {
    checker: (v) => validator.isFloat(String(v)),
    formatter: (v) => Number(v),
    description: 'float',
    isDefault: true,
  });

  registerType('Object', {
    checker: (v) => v && typeof v === 'object',
    description: 'object',
    isDefault: true,
  });

  registerType('Array', {
    checker: (v) => Array.isArray(v),
    description: 'array',
    isDefault: true,
  });

  registerType('JSON', {
    checker: (v) => typeof v === 'string' && validator.isJSON(v),
    formatter: (v) => v.trim(),
    description: 'string is valid JSON',
    isDefault: true,
  });

  registerType('Any', {
    checker: (v) => true,
    description: 'can be any type',
    isDefault: true,
  });

  registerType('MongoId', {
    checker: (v) => validator.isMongoId(String(v)),
    description: 'string is a valid hex-encoded representation of a MongoDB ObjectId',
    isDefault: true,
  });

  registerType('Email', {
    checker: (v) => typeof v === 'string' && validator.isEmail(v),
    formatter: (v) => v.trim(),
    description: 'string is an email',
    isDefault: true,
  });

  registerType('Domain', {
    checker: (v) => typeof v === 'string' && validator.isFQDN(v),
    formatter: (v) => v.trim(),
    description: 'string is a fully qualified domain name (e.g. domain.com)',
    isDefault: true,
  });

  registerType('Alpha', {
    checker: (v) => typeof v === 'string' && validator.isAlpha(v),
    description: 'string contains only letters (a-zA-Z).',
    isDefault: true,
  });

  registerType('AlphaNumeric', {
    checker: (v) => typeof v === 'string' && validator.isAlphanumeric(v),
    description: 'string contains only letters and numbers',
    isDefault: true,
  });

  registerType('Ascii', {
    checker: (v) => typeof v === 'string' && validator.isAscii(v),
    description: 'string contains ASCII chars only',
    isDefault: true,
  });

  registerType('Base64', {
    checker: (v) => typeof v === 'string' && validator.isBase64(v),
    formatter: (v) => v.trim(),
    description: 'string is base64 encoded',
    isDefault: true,
  });

  registerType('URL', {
    checker: (v) => typeof v === 'string' && validator.isURL(v),
    formatter: (v) => v.trim(),
    description: 'string is an URL',
    isDefault: true,
  });

};
