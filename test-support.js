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

const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')



const _DEFAULT_JSV_ASSERT_OPTIONS = Object.freeze({ tests: process.env['JSV_TESTS'] || 100 })

function chaiProperty(...jsverifyPropertyArgs) {
  const [ name, ...arbs ] = jsverifyPropertyArgs
  const propCheckFn = arbs.pop()
  const jsvAssertOptions = (
    typeof arbs[arbs.length - 1] === 'object'
    && typeof(arbs[arbs.length - 1].generator) !== 'function'
    ? Object.assign({}, _DEFAULT_JSV_ASSERT_OPTIONS, arbs.pop())
    : Object.assign({}, _DEFAULT_JSV_ASSERT_OPTIONS)  // Grr. jsv.assert mutates jsvAssertOptions
  )
  it(name, function () {
    jsv.assert(
      jsv.forall(...arbs, (...values) => {
        propCheckFn(...values)
        return true
      }),
      jsvAssertOptions
    )
  })
}


function _arbitraryFromGenerator(gen) {
  return jsv.bless({ generator: gen })
}

function _combineArbitraries(fn, ...arbitraries) {
  return _arbitraryFromGenerator(
    jsv.generator.combine(...arbitraries.map(a => a.generator), fn)
  )
}

function _joinArbitraries(sep, ...arbitraries) {
  return _combineArbitraries((...parts) => parts.join(sep), ...arbitraries)
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


const COMPLETELY_INVALID_ID = (
  jsv.oneof([
    jsv.oneof([
      jsv.bool,
      jsv.datetime,
      jsv.falsy,
      jsv.number,
      jsv.unit,
      jsv.dict(jsv.string),
      jsv.array(jsv.string),

    ]),
    jsv.suchthat(jsv.string, _1 => (
      ! /^\d{12,}$/.test(_1) &&
      ! /^\.?([boicaprnveltj])?[1-9]\d{5,6}([0-9x])?(@[a-z0-9]{1,5})?$/.test(_1) &&
      ! /^(https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/)?v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?/.test(_1)
    ))
  ])
)


const DIGIT_CHAR = jsv.elements([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' ])
const LOWER_ALPHA_DIGIT_CHAR = jsv.elements('abcdefghijklmnopqrstuvwxyz0123456789'.split(''))
const CHECK_DIGIT = jsv.elements([ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x' ])
const ALL_RECORD_TYPE_CODE = jsv.elements([ 'b', 'o', 'i', 'c', 'a', 'p', 'r', 'n', 'v', 'e', 'l', 't', 'j' ])
const API_COMPATIBLE_TYPE_CODE = jsv.elements([ 'a', 'b', 'n', 'i', 'o', 'p' ])
const V4_API_RECORD_TYPES = jsv.elements(['authorities', 'bibs', 'invoices', 'items', 'orders', 'patrons'])

const CAMPUS_CODE = (
  _arbitraryFromGenerator(_variableSizeArrayGenerator(1, 5, LOWER_ALPHA_DIGIT_CHAR.generator).map(_1 => _1.join('')))
)

const API_HOST = (
  jsv.nearray(jsv.elements("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~".split('')))
  .smap(_1 => _1.join(''), _1 => _1.split(''))
)

const API_PATH = (
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


function arbitraryInitialPeriod(when = SOMETIMES) {
  switch (when) {
    case ALWAYS:
      return jsv.constant('.')
    case NEVER:
      return jsv.unit
    case SOMETIMES:
      return jsv.oneof([arbitraryInitialPeriod(ALWAYS), jsv.unit])
    default:
      throw new Error(`initialPeriod is not ALWAYS, NEVER or SOMETIMES: ${when}`)
  }
}


function arbitraryRecordTypeCode(apiCompatibleOnly = false) {
  return apiCompatibleOnly ? API_COMPATIBLE_TYPE_CODE : ALL_RECORD_TYPE_CODE
}


function arbitraryRecNum(size = undefined) {
  if (size === undefined) {
    return jsv.oneof([arbitraryRecNum(6), arbitraryRecNum(7)])
  } else {
    return jsv.suchthat(
      _arbitraryFromGenerator(_fixedSizeArrayGenerator(size, DIGIT_CHAR.generator).map(_1 => _1.join(''))),
      _1 => !_1.startsWith('0')
    )
  }
}


function arbitraryVirtualRecordPart(when) {
  switch (when) {
    case ALWAYS:
      return CAMPUS_CODE.smap(_1 => `@${_1}`, _1 => _1.split(1))
    case NEVER:
      return jsv.unit
    case SOMETIMES:
      return jsv.oneof([arbitraryVirtualRecordPart(ALWAYS), jsv.unit])
    default:
      throw new Error(`virtual is not ALWAYS, NEVER or SOMETIMES: ${when}`)
  }
}



function arbitraryRecordNumber({ size = undefined, virtual = SOMETIMES } = {}) {
  return _joinArbitraries('', arbitraryRecNum(size), arbitraryVirtualRecordPart(virtual))
}


function arbitraryWeakRecordKey({ size = undefined, initialPeriod = SOMETIMES, virtual = SOMETIMES, ambiguous = SOMETIMES, apiCompatibleOnly = false } = {}) {
  if (size === undefined) {
    switch (ambiguous) {
      case ALWAYS:
        return arbitraryWeakRecordKey({ size: 7, initialPeriod, apiCompatibleOnly, virtual, ambiguous })
      case NEVER:
        return arbitraryWeakRecordKey({ size: 6, initialPeriod, apiCompatibleOnly, virtual, ambiguous })
      case SOMETIMES:
        return jsv.oneof([
          arbitraryWeakRecordKey({ size: 6, initialPeriod, apiCompatibleOnly, virtual, ambiguous }),
          arbitraryWeakRecordKey({ size: 7, initialPeriod, apiCompatibleOnly, virtual, ambiguous }),
        ])
      default:
        throw new Error(`ambiguous is not ALWAYS, NEVER or SOMETIMES: ${ambiguous}`)
    }
  } else if (ambiguous === SOMETIMES || (size === 6 && ambiguous === NEVER) || (size === 7 && ambiguous === ALWAYS)) {
    return _joinArbitraries(
      '',
      arbitraryInitialPeriod(initialPeriod),
      arbitraryRecordTypeCode(apiCompatibleOnly),
      arbitraryRecNum(size),
      arbitraryVirtualRecordPart(virtual),
    )
  } else {
    return jsv.unit
  }
}


function arbitraryStrongRecordKey({ size = undefined, initialPeriod = SOMETIMES, virtual = SOMETIMES, ambiguous = SOMETIMES, apiCompatibleOnly = false } = {}) {
  switch (size) {
    case undefined:
      if (ambiguous === ALWAYS) {
        return arbitraryStrongRecordKey({ size: 6, initialPeriod, virtual, ambiguous, apiCompatibleOnly })
      } else {
        return jsv.oneof(
          arbitraryStrongRecordKey({ size: 6, initialPeriod, virtual, ambiguous, apiCompatibleOnly }),
          arbitraryStrongRecordKey({ size: 7, initialPeriod, virtual, ambiguous, apiCompatibleOnly }),
        )
      }
    case 6:
      return jsv.suchthat(
        _combineArbitraries(
          ( ip, rtc, rn, vp ) => {
            const cd = calcCheckDigit(rn)
            return (
              ambiguous === NEVER && cd !== 'x'
              ? undefined
              : ambiguous === ALWAYS && cd === 'x'
              ? undefined
              : [ ip, rtc, rn, cd, vp ].join('')
            )
          },
          arbitraryInitialPeriod(initialPeriod),
          arbitraryRecordTypeCode(apiCompatibleOnly),
          arbitraryRecNum(size),
          arbitraryVirtualRecordPart(virtual),
        ),
        _1 => _1 !== undefined
      )
    case 7:
      if (ambiguous === ALWAYS) {
        throw new Error('Ambiguous 7 digit strong record keys are impossible')
      } else {
        return _combineArbitraries(
          ( ip, rtc, rn, vp ) => {
            const cd = calcCheckDigit(rn)
            return [ ip, rtc, rn, cd, vp ].join('')
          },
          arbitraryInitialPeriod(initialPeriod),
          arbitraryRecordTypeCode(apiCompatibleOnly),
          arbitraryRecNum(size),
          arbitraryVirtualRecordPart(virtual),
        )
      }

    default:
      throw new Error(`size is not undefined, 6 or 7: ${size}`)

  }
}


function arbitraryDatabaseId({ size = undefined, virtual = SOMETIMES, apiCompatibleOnly = false } = {}) {
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
      arbitraryRecordTypeCode(apiCompatibleOnly).generator,
      jsv.integer(...recNumRange).generator,
      (campusId, recordTypeCode, recNum) => (
        BigInt(campusId).shiftLeft(48)
        .add(BigInt(recordTypeCode.codePointAt(0)).shiftLeft(32))
        .add(BigInt(recNum))
        .toString()
      )
    )
  )
}


function arbitraryRelativeV4ApiUrl({ size = undefined, virtual = SOMETIMES } = {}) {
  return _joinArbitraries('/', jsv.constant('v4'), V4_API_RECORD_TYPES, arbitraryRecordNumber({ size, virtual }))
}


function arbitraryAbsoluteV4ApiUrl({ size = undefined, virtual = SOMETIMES, sierraApiHost = undefined, sierraApiPath = undefined } = {}) {
  const arbitraryHost = sierraApiHost === undefined ? API_HOST : jsv.constant(sierraApiHost)
  const arbitraryPath = sierraApiPath === undefined ? API_PATH : jsv.constant(sierraApiPath)
  return _joinArbitraries('', jsv.constant('https://'), arbitraryHost, arbitraryPath, arbitraryRelativeV4ApiUrl({ size, virtual }))
}


module.exports = {

  chaiProperty,

  arbitrary: Object.freeze({
    NEVER,
    SOMETIMES,
    ALWAYS,

    COMPLETELY_INVALID_ID,

    DIGIT_CHAR,
    LOWER_ALPHA_DIGIT_CHAR,
    CHECK_DIGIT,
    ALL_RECORD_TYPE_CODE,
    API_COMPATIBLE_TYPE_CODE,
    V4_API_RECORD_TYPES,
    CAMPUS_CODE,
    API_HOST,
    API_PATH,

    initialPeriod: arbitraryInitialPeriod,
    recordTypeCode: arbitraryRecordTypeCode,
    recNum: arbitraryRecNum,
    virtualRecordPart: arbitraryVirtualRecordPart,

    recordNumber: arbitraryRecordNumber,
    weakRecordKey: arbitraryWeakRecordKey,
    strongRecordKey: arbitraryStrongRecordKey,
    databaseId: arbitraryDatabaseId,
    relativeV4ApiUrl: arbitraryRelativeV4ApiUrl,
    absoluteV4ApiUrl: arbitraryAbsoluteV4ApiUrl,

  }),

}
