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


// Separated out from record-id.js to resolve cyclic dependency between RecordId and its subclasses.


const { RecordId } = require('./record-id')
const { RecordNumber } = require('./record-number')
const { WeakRecordKey } = require('./weak-record-key')
const { StrongRecordKey } = require('./strong-record-key')
const { DatabaseId } = require('./database-id')
const { RelativeV4ApiUrl } = require('./relative-v4-api-url')
const { AbsoluteV4ApiUrl } = require('./absolute-v4-api-url')


const CODE_POINT_0 = '0'.codePointAt(0)
const CODE_POINT_9 = '9'.codePointAt(0)
const CODE_POINT_LOWER_A = 'a'.codePointAt(0)
const CODE_POINT_LOWER_X = 'x'.codePointAt(0)
const CODE_POINT_LOWER_Z = 'z'.codePointAt(0)
const CODE_POINT_PERIOD = '.'.codePointAt(0)


function detectRecordKeyStrength(recordIdString) {
  let kind
  const recordIdStringLength = recordIdString.length
  const firstRecordIdStringCodePoint = recordIdString.codePointAt(0)
  const indexOfFirstAt = recordIdString.indexOf('@')
  const sliceStart = firstRecordIdStringCodePoint === CODE_POINT_PERIOD ? 2 : 1
  const sliceEnd = indexOfFirstAt === -1 ? recordIdStringLength : indexOfFirstAt
  const recordNum = recordIdString.slice(sliceStart, sliceEnd)
  const recordNumLength = recordNum.length
  const lastRecordNumCodePoint = recordNum.codePointAt(recordNumLength - 1)
  if (lastRecordNumCodePoint === CODE_POINT_LOWER_X) {
    kind = StrongRecordKey
  } else if (recordNumLength === 6) {
    kind = WeakRecordKey
  } else if (recordNumLength === 7) {
    throw new Error(`Ambiguous record key, cannot tell if it is strong or weak: ${recordIdString}`)
  } else if (recordNumLength === 8) {
    kind = StrongRecordKey
  }
  return kind
}


RecordId.detect = function (recordIdString) {
  let kind
  if (recordIdString) {
    const trimmedRecordIdString = recordIdString.trim()
    const firstCodePoint = trimmedRecordIdString.codePointAt(0)
    if (firstCodePoint === CODE_POINT_PERIOD) {
      kind = detectRecordKeyStrength(trimmedRecordIdString)
    } else if (trimmedRecordIdString.startsWith('https://')) {
      kind = AbsoluteV4ApiUrl
    } else if (trimmedRecordIdString.startsWith('/v4/')) {
      kind = RelativeV4ApiUrl
    } else if (firstCodePoint >= CODE_POINT_LOWER_A && firstCodePoint <= CODE_POINT_LOWER_Z) {
      kind = detectRecordKeyStrength(trimmedRecordIdString)
    } else if (firstCodePoint >= CODE_POINT_0 && firstCodePoint <= CODE_POINT_9) {
      if (/^\d{12,}/.test(trimmedRecordIdString)) {
        kind = DatabaseId
      } else {
        kind = RecordNumber
      }
    }
  }
  if (!kind) {
    throw new Error(`Could not determine what kind of record id this is: ${recordIdString}`)
  }
  return kind
}
