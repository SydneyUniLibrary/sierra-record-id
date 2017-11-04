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

const { RecordIdKind } = require('./kind')


function make(kind, parts) {
  switch (kind) {
    case RecordIdKind.RECORD_NUMBER:
      return make.recordNumber(parts.recNum, parts.campusCode)
    case RecordIdKind.WEAK_RECORD_KEY:
      return make.weakRecordKey(parts.recordTypeCode, parts.recNum, parts.campusCode, parts.initialPeriod)
    case RecordIdKind.STRONG_RECORD_KEY:
      return make.strongRecordKey(parts.recordTypeCode, parts.recNum, parts.checkDigit, parts.campusCode, parts.initialPeriod)
    case RecordIdKind.DATABASE_ID:
      return make.databaseId(parts.recordTypeCode, parts.recNum, parts.campusId)
    case RecordIdKind.RELATIVE_V4_API_URL:
      return make.relativeV4ApiUrl(parts.apiRecordType, parts.recNum, parts.campusCode)
    case RecordIdKind.ABSOLUTE_V4_API_URL:
      return make.absoluteV4ApiUrl(parts.apiRecordType, parts.recNum, parts.campusCode, parts.apiHost, parts.apiPath)
    default:
      throw new Error(`Invalid record kind: ${String(kind)}`)
  }
}


make.recordNumber = (recNum, campusCode) => {
  if (campusCode) {
    return `${ recNum }@${ campusCode }`
  } else {
    return String(recNum)
  }
}


make.weakRecordKey = (recordTypeCode, recNum, campusCode, initialPeriod = false) => {
  if (campusCode) {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }@${ campusCode }`
  } else {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }`
  }
}


make.strongRecordKey = (recordTypeCode, recNum, checkDigit, campusCode, initialPeriod = false) => {
  if (campusCode) {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }${ checkDigit }@${ campusCode }`
  } else {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }${ checkDigit }`
  }
}


make.databaseId = (recordTypeCode, recNum, campusId) => {
  return (
    (campusId ? BigInt(campusId).and(0xFFFF).shiftLeft(48) : BigInt.zero)
    .add(BigInt(recordTypeCode.codePointAt(0)).and(0xFFFF).shiftLeft(32))
    .add(BigInt(recNum).and(0xFFFFFFFF))
    .toString()
  )
}


make.relativeV4ApiUrl = (apiRecordType, recNum, campusCode) => {
  if (campusCode) {
    return `v4/${ apiRecordType }/${recNum}@${campusCode}`
  } else {
    return `v4/${ apiRecordType }/${recNum}`
  }
}


make.absoluteV4ApiUrl = (apiRecordType, recNum, campusCode, apiHost, apiPath) => {
  //noinspection AssignmentToFunctionParameterJS
  apiHost = apiHost || process.env['SIERRA_API_HOST']
  if (!apiHost) {
    throw new Error("apiHost parameter is undefined and SIERRA_API_HOST is not defined in the process's environment")
  }
  //noinspection AssignmentToFunctionParameterJS
  apiPath = apiPath || process.env['SIERRA_API_PATH'] || '/iii/sierra-api/'
  if (campusCode) {
    return `https://${apiHost}${apiPath}v4/${ apiRecordType }/${recNum}@${campusCode}`
  } else {
    return `https://${apiHost}${apiPath}v4/${ apiRecordType }/${recNum}`
  }
}


module.exports = {
  make
}
