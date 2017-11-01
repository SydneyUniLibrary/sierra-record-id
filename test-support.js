/*
 * Copyright (C) 2017  The University of Sydney Library
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


'use strict'


const BigInt = require('big-integer')
const jsv = require('jsverify')


function chaiProperty(...jsverifyPropertyArgs) {
  const propCheckFn = jsverifyPropertyArgs.pop()
  jsv.property(...jsverifyPropertyArgs, (...values) => {
    propCheckFn(...values)
    return true
  })
}


function _arbitraryFromGenerator(gen) {
  return jsv.bless({ generator: gen })
}

function _arbitraryFromFunction(fn) {
  return _arbitraryFromGenerator(jsv.generator.bless(fn))
}

function _joinArbitraries(sep, ...arbitraries) {
  return _arbitraryFromGenerator(
    jsv.generator.combine(...arbitraries.map(a => a.generator), (...parts) => parts.join(sep))
  )
}

function _fixedSizeArrayGenerator(len, gen) {
  return jsv.generator.bless(
    (size) => {
      let arr = new Array(len)
      for (let i = 0; i < len; i++) {
        arr[i] = gen(size)
      }
      return arr
    }
  )
}

function _variableSizeArrayGenerator(minLen, maxLen, gen) {
  return jsv.generator.bless(
      (size) => {
        let len = jsv.random(minLen, maxLen)
        let arr = new Array(len)
        for (let i = 0; i < len; i++) {
          arr[i] = gen(size)
        }
        return arr
      }
  )
}


const NEVER = Symbol('NEVER')
const SOMETIMES = Symbol('SOMETIMES')
const ALWAYS = Symbol('ALWAYS')


const _DIGIT_CHAR = jsv.elements([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ])
const _LOWER_ALPHA_DIGIT_CHAR = jsv.elements('abcdefghijklmnopqrstuvwxyz0123456789'.split(''))
const _ALL_RECORD_TYPE_CHARS = jsv.elements([ 'b', 'o', 'i', 'c', 'a', 'p', 'r', 'n', 'v', 'e', 'l', 't', 'j' ])
const _API_COMPATIBLE_TYPE_CHARS = jsv.elements([ 'a', 'b', 'n', 'i', 'o', 'p' ])
const _CHECK_DIGIT = jsv.elements([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x' ])
const _V4_API_RECORD_TYPES = jsv.elements(['authorities', 'bibs', 'invoices', 'items', 'orders', 'patrons'])

const _ARBITRARY_HOST = (
  jsv.nearray(jsv.elements("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~".split('')))
  .smap(_1 => _1.join(''), _1 => _1.split(''))
)

const _ARBITRARY_PATH = (
  jsv.suchthat(
    jsv.nearray(jsv.elements("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:@/".split(''))),
    _1 => _1.length !== 1 && _1[0] !== '/'
  )
  .smap(
    _1 => {
      let s = _1.join('')
      /* Conditions are negated so the most common case (has / at neither start nor end) is tested first */
      if (!s.startsWith('/') && !s.endsWith('/')) {
        s = `/${s}/`
      } else if (!s.startsWith('/')) {
        s = `/${s}`
      } else if (!s.endsWith('/')) {
        s = `${s}/`
      }
      return s
    },
    _1 => (
      /* Don't know if original had a / at end or start, assume most common case of it having had neither. */
      _1.slice(1, -1).split('')
    )
  )
)



function _initialPeriod(when) {
  switch (when) {
    case ALWAYS:
      return jsv.constant('.')
    case NEVER:
      return jsv.unit
    case SOMETIMES:
      return jsv.oneof([_initialPeriod(ALWAYS), jsv.unit])
    default:
      throw new Error(`initialPeriod is not ALWAYS, NEVER or SOMETIMES: ${when}`)
  }
}


function _recordTypeChar(apiCompatibleOnly = false) {
  return apiCompatibleOnly ? _API_COMPATIBLE_TYPE_CHARS : _ALL_RECORD_TYPE_CHARS
}


const _DEFAULT_REC_NUM = jsv.oneof([_recNum(6), _recNum(7)])
function _recNum(size = undefined) {
  if (size === undefined) {
    return _DEFAULT_REC_NUM
  } else {
    return _arbitraryFromGenerator(_fixedSizeArrayGenerator(size, _DIGIT_CHAR.generator).map(_1 => _1.join('')))
  }
}


function _virtualRecordPart(when) {
  switch (when) {
    case ALWAYS:
      return _arbitraryFromGenerator(
        _variableSizeArrayGenerator(1, 5, _LOWER_ALPHA_DIGIT_CHAR.generator).map(_1 => `@${_1.join('')}`)
      )
    case NEVER:
      return jsv.unit
    case SOMETIMES:
      return jsv.oneof([_virtualRecordPart(ALWAYS), jsv.unit])
    default:
      throw new Error(`virtual is not ALWAYS, NEVER or SOMETIMES: ${when}`)
  }
}



function recordNumber({ size = undefined, virtual = SOMETIMES } = {}) {
  return _joinArbitraries('', _recNum(size), _virtualRecordPart(virtual))
}


function weakRecordKey({ size = undefined, initialPeriod = SOMETIMES, virtual = SOMETIMES, ambiguous = SOMETIMES, apiCompatibleOnly = false } = {}) {
  if (size === undefined) {
    switch (ambiguous) {
      case ALWAYS:
        return weakRecordKey({ size: 7, initialPeriod, apiCompatibleOnly, virtual, ambiguous })
      case NEVER:
        return weakRecordKey({ size: 6, initialPeriod, apiCompatibleOnly, virtual, ambiguous })
      case SOMETIMES:
        return jsv.oneof([
          weakRecordKey({ size: 6, initialPeriod, apiCompatibleOnly, virtual, ambiguous }),
          weakRecordKey({ size: 7, initialPeriod, apiCompatibleOnly, virtual, ambiguous }),
        ])
      default:
        throw new Error(`ambiguous is not ALWAYS, NEVER or SOMETIMES: ${ambiguous}`)
    }
  } else if (ambiguous === SOMETIMES || (size === 6 && ambiguous === NEVER) || (size === 7 && ambiguous === ALWAYS)) {
    return _joinArbitraries(
      '',
      _initialPeriod(initialPeriod),
      _recordTypeChar(apiCompatibleOnly),
      _recNum(size),
      _virtualRecordPart(virtual),
    )
  } else {
    return jsv.unit
  }
}


function strongRecordKey({ size = undefined, initialPeriod = SOMETIMES, virtual = SOMETIMES, ambiguous = SOMETIMES, apiCompatibleOnly = false } = {}) {
  switch (size) {
    case undefined:
      if (ambiguous === ALWAYS) {
        return strongRecordKey({ size: 6, initialPeriod, virtual, ambiguous, apiCompatibleOnly })
      } else {
        return jsv.oneof(
          strongRecordKey({ size: 6, initialPeriod, virtual, ambiguous, apiCompatibleOnly }),
          strongRecordKey({ size: 7, initialPeriod, virtual, ambiguous, apiCompatibleOnly }),
        )
      }
    case 6:
      const checkDigitGenerator = (
        ambiguous === ALWAYS ? _DIGIT_CHAR
        : ambiguous === NEVER ? jsv.constant('x')
        : _CHECK_DIGIT
      )
      return _joinArbitraries(
        '',
        _initialPeriod(initialPeriod),
        _recordTypeChar(apiCompatibleOnly),
        _recNum(size),
        checkDigitGenerator,
        _virtualRecordPart(virtual),
      )
    case 7:
      if (ambiguous === ALWAYS) {
        throw new Error('Ambiguous 7 digit strong record keys are impossible')
      } else {
        return _joinArbitraries(
          '',
          _initialPeriod(initialPeriod),
          _recordTypeChar(apiCompatibleOnly),
          _recNum(size),
          _CHECK_DIGIT,
          _virtualRecordPart(virtual),
        )
      }

    default:
      throw new Error(`size is not undefined, 6 or 7: ${size}`)

  }
}


function databaseId({ size = undefined, virtual = SOMETIMES, apiCompatibleOnly = false } = {}) {
  const virtualRange = (
    virtual === ALWAYS ? [ 1, 0xFFFF ]
    : virtual === NEVER ? [ 0, 0 ]
    : virtual === SOMETIMES ? [ 0, 0xFFFF ]
    : undefined
  )
  if (!virtualRange) {
    throw new Error(`virtual is not ALWAYS, NEVER or SOMETIMES: ${virtual}`)
  }
  const recNumRange = (
    size === undefined ? [ 100000, 9999999 ]
    : size === 6 ? [ 100000, 999999 ]
    : size === 7 ? [ 1000000, 9999999 ]
    : undefined
  )
  if (!recNumRange) {
    throw new Error(`size is not undefined, 6 or 7: ${size}`)
  }
  return _arbitraryFromGenerator(
    jsv.generator.combine(
      jsv.integer(...virtualRange).generator,
      _recordTypeChar(apiCompatibleOnly).generator,
      jsv.integer(...recNumRange).generator,
      (campusId, recordTypeChar, recNum) => (
        BigInt(campusId).shiftLeft(48)
        .add(BigInt(recordTypeChar.codePointAt(0)).shiftLeft(32))
        .add(BigInt(recNum))
        .toString()
      )
    )
  )
}


function relativeV4ApiUrl({ size = undefined, virtual = SOMETIMES } = {}) {
  return _joinArbitraries('/', jsv.constant('v4'), _V4_API_RECORD_TYPES, recordNumber({ size, virtual }))
}


function absoluteV4ApiUrl({ size = undefined, virtual = SOMETIMES, sierraApiHost = undefined, sierraApiPath = undefined } = {}) {
  const arbitraryHost = sierraApiHost === undefined ? _ARBITRARY_HOST : jsv.constant(sierraApiHost)
  const arbitraryPath = sierraApiPath === undefined ? _ARBITRARY_PATH : jsv.constant(sierraApiPath)
  return _joinArbitraries('', jsv.constant('https://'), arbitraryHost, arbitraryPath, relativeV4ApiUrl({ size, virtual }))
}


module.exports = {

  chaiProperty,

  arbitrary: Object.freeze({
    NEVER,
    SOMETIMES,
    ALWAYS,
    recordNumber,
    weakRecordKey,
    strongRecordKey,
    databaseId,
    relativeV4ApiUrl,
    absoluteV4ApiUrl,
  }),

}
