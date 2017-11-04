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


const { RecordIdKind } = require('./kind')



const CODE_POINT_0 = '0'.codePointAt(0)
const CODE_POINT_9 = '9'.codePointAt(0)
const CODE_POINT_LOWER_A = 'a'.codePointAt(0)
const CODE_POINT_LOWER_X = 'x'.codePointAt(0)
const CODE_POINT_LOWER_Z = 'z'.codePointAt(0)
const CODE_POINT_PERIOD = '.'.codePointAt(0)


function detect(recordIdString) {
  let kind
  if (recordIdString) {
    const trimmedRecordIdString = recordIdString.trim()
    const firstCodePoint = trimmedRecordIdString.codePointAt(0)
    if (firstCodePoint === CODE_POINT_PERIOD) {
      kind = detectRecordKeyStrength(trimmedRecordIdString)
    } else if (trimmedRecordIdString.startsWith('https://')) {
      kind = RecordIdKind.ABSOLUTE_V4_API_URL
    } else if (trimmedRecordIdString.startsWith('v4/')) {
      kind = RecordIdKind.RELATIVE_V4_API_URL
    } else if (firstCodePoint >= CODE_POINT_LOWER_A && firstCodePoint <= CODE_POINT_LOWER_Z) {
      kind = detectRecordKeyStrength(trimmedRecordIdString)
    } else if (firstCodePoint >= CODE_POINT_0 && firstCodePoint <= CODE_POINT_9) {
      if (/^\d{12,}/.test(trimmedRecordIdString)) {
        kind = RecordIdKind.DATABASE_ID
      } else {
        kind = RecordIdKind.RECORD_NUMBER
      }
    }
  }
  return kind
}


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
    kind = RecordIdKind.STRONG_RECORD_KEY
  } else if (recordNumLength === 6) {
    kind = RecordIdKind.WEAK_RECORD_KEY
  } else if (recordNumLength === 7) {
    kind = RecordIdKind.AMBIGUOUS_RECORD_KEY
  } else if (recordNumLength === 8) {
    kind = RecordIdKind.STRONG_RECORD_KEY
  }
  return kind
}


module.exports = {
  detect,
  detectRecordKeyStrength,
}
