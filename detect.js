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


const RecordIdForms = Object.freeze({
  RECORD_NUMBER: Symbol('RECORD_NUMBER'),
  WEAK_RECORD_KEY: Symbol('WEAK_RECORD_KEY'),
  STRONG_RECORD_KEY: Symbol('STRONG_RECORD_KEY'),
  AMBIGUOUS_RECORD_KEY: Symbol('AMBIGUOUS_RECORD_KEY'),
  DATABASE_ID: Symbol('DATABASE_ID'),
  RELATIVE_V4_API_URL: Symbol('RELATIVE_V4_API_URL'),
  ABSOLUTE_V4_API_URL: Symbol('ABSOLUTE_V4_API_URL'),
})


const CODE_POINT_0 = '0'.codePointAt(0)
const CODE_POINT_9 = '9'.codePointAt(0)
const CODE_POINT_LOWER_A = 'a'.codePointAt(0)
const CODE_POINT_LOWER_X = 'x'.codePointAt(0)
const CODE_POINT_LOWER_Z = 'z'.codePointAt(0)
const CODE_POINT_PERIOD = '.'.codePointAt(0)


function detect(recordIdString) {
  let form = RecordIdForms.UNKNOWN_FORM
  //if (recordIdString) {
    const trimmedRecordIdString = recordIdString.trim()
    const firstCodePoint = trimmedRecordIdString.codePointAt(0)
    if (firstCodePoint === CODE_POINT_PERIOD) {
      form = detectRecordKeyStrength(trimmedRecordIdString)
    } else if (trimmedRecordIdString.startsWith('https://')) {
      form = RecordIdForms.ABSOLUTE_V4_API_URL
    } else if (trimmedRecordIdString.startsWith('v4/')) {
      form = RecordIdForms.RELATIVE_V4_API_URL
    } else if (firstCodePoint >= CODE_POINT_LOWER_A && firstCodePoint <= CODE_POINT_LOWER_Z) {
      form = detectRecordKeyStrength(trimmedRecordIdString)
    } else if (firstCodePoint >= CODE_POINT_0 && firstCodePoint <= CODE_POINT_9) {
      if (/^\d{12,}/.test(trimmedRecordIdString)) {
        form = RecordIdForms.DATABASE_ID
      } else {
        form = RecordIdForms.RECORD_NUMBER
      }
    }
  //}
  return form
}


function detectRecordKeyStrength(recordIdString) {
  let form = RecordIdForms.AMBIGUOUS_RECORD_KEY
  const recordIdStringLength = recordIdString.length
  const firstRecordIdStringCodePoint = recordIdString.codePointAt(0)
  const indexOfFirstAt = recordIdString.indexOf('@')
  const sliceStart = firstRecordIdStringCodePoint === CODE_POINT_PERIOD ? 2 : 1
  const sliceEnd = indexOfFirstAt === -1 ? recordIdStringLength : indexOfFirstAt
  const recordNum = recordIdString.slice(sliceStart, sliceEnd)
  const recordNumLength = recordNum.length
  const lastRecordNumCodePoint = recordNum.codePointAt(recordNumLength - 1)
  if (lastRecordNumCodePoint === CODE_POINT_LOWER_X) {
    form = RecordIdForms.STRONG_RECORD_KEY
  } else if (recordNumLength === 8) {
    form = RecordIdForms.STRONG_RECORD_KEY
  } else if (recordNumLength === 6) {
    form = RecordIdForms.WEAK_RECORD_KEY
  }
  return form
}


module.exports = {
  detect,
  detectRecordKeyStrength,
  RecordIdForms,
}
