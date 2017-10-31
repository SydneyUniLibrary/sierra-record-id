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


const jsv = require('jsverify')


function chaiProperty(name, ...rest) {
  const prop = rest.pop()
  jsv.property(name, ...rest, (...values) => {
    prop(...values)
    return true
  })
}


const testSierraConfig = Object.freeze({
  apiHost: 'sierra.library.usyd.edu.au',
  path: '/iii/sierra-api/',
  baseUrl: 'https://sierra.library.usyd.edu.au/iii/sierra-api/'
})


function arbitraryFromGenerator(gen) {
  return jsv.bless({ generator: gen })
}

function arbitraryFromFunction(fn) {
  return arbitraryFromGenerator(jsv.generator.bless(fn))
}

function joinArbitraries(sep, ...arbitraries) {
  return arbitraryFromGenerator(
    jsv.generator.combine(...arbitraries.map(a => a.generator), (...parts) => parts.join(sep))
  )
}

function fixedSizeArrayGenerator(len, gen) {
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

function variableSizeArrayGenerator(minLen, maxLen, gen) {
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


const digitChar = jsv.elements('0123456789'.split(''))
const lowerAlphaDigitChar = jsv.elements('abcdefghijklmnopqrstuvwxyz0123456789'.split(''))

const databaseId = arbitraryFromGenerator(variableSizeArrayGenerator(12, 17, digitChar.generator).map(_1 => _1.join('')))

const possibleInitialPeriod = jsv.elements([ '', '.' ])
const recordTypeChar = jsv.elements([ 'b', 'o', 'i', 'c', 'a', 'p', 'r', 'n', 'v', 'e', 'l', 't', 'j' ])
const recNum6 = arbitraryFromGenerator(fixedSizeArrayGenerator(6, digitChar.generator).map(_1 => _1.join('')))
const recNum7 = arbitraryFromGenerator(fixedSizeArrayGenerator(7, digitChar.generator).map(_1 => _1.join('')))
const checkDigit = arbitraryFromFunction(() => { let x = jsv.random(0, 10); return x === 10 ? 'x' : String(x) })
const virtualRecordPart = arbitraryFromGenerator(
    variableSizeArrayGenerator(1, 5, lowerAlphaDigitChar.generator).map(_1 => `@${_1.join('')}`))
const possibleVirtualRecordPart = jsv.oneof([virtualRecordPart, jsv.constant('')])
const recordNumber6 = joinArbitraries('', recNum6, possibleVirtualRecordPart)
const recordNumber7 = joinArbitraries('', recNum7, possibleVirtualRecordPart)
const recordNumber = jsv.oneof([ recordNumber6, recordNumber7 ])
const weakRecordKey6 = joinArbitraries('', possibleInitialPeriod, recordTypeChar, recNum6, possibleVirtualRecordPart)
const weakRecordKey7 = joinArbitraries('', possibleInitialPeriod, recordTypeChar, recNum7, possibleVirtualRecordPart)
const weakRecordKey = jsv.oneof([ weakRecordKey6, weakRecordKey7 ])
const strongRecordKey6 = joinArbitraries('', possibleInitialPeriod, recordTypeChar, recNum6, checkDigit, possibleVirtualRecordPart)
const strongRecordKey7 = joinArbitraries('', possibleInitialPeriod, recordTypeChar, recNum7, checkDigit, possibleVirtualRecordPart)
const strongRecordKey = jsv.oneof([ strongRecordKey6, strongRecordKey7 ])

const ambiguousRecordKey = jsv.oneof([
    weakRecordKey7,
    joinArbitraries('', possibleInitialPeriod, recordTypeChar, recNum6, digitChar, possibleVirtualRecordPart)
])
const unambiguousWeakRecordKey = weakRecordKey6
const unambiguousStrongRecordKey = jsv.oneof([
    strongRecordKey7,
    joinArbitraries('', possibleInitialPeriod, recordTypeChar, recNum6, jsv.constant('x'), possibleVirtualRecordPart)
])

const recordType = jsv.elements(['authorities', 'bibs', 'invoices', 'items', 'orders', 'patrons'])
const relativeV4ApiUrl = joinArbitraries('/', jsv.constant('v4'), recordType, recordNumber)
const absoluteV4ApiUrl = joinArbitraries('', jsv.constant(testSierraConfig.baseUrl), relativeV4ApiUrl)


const arbitraries = Object.freeze({
  recordNumber6,
  recordNumber7,
  recordNumber,
  weakRecordKey6,
  weakRecordKey7,
  weakRecordKey,
  strongRecordKey6,
  strongRecordKey7,
  strongRecordKey,
  ambiguousRecordKey,
  unambiguousWeakRecordKey,
  unambiguousStrongRecordKey,
  databaseId,
  relativeV4ApiUrl,
  absoluteV4ApiUrl,
})

module.exports = {
  arbitraries,
  chaiProperty,
  testSierraConfig
}
