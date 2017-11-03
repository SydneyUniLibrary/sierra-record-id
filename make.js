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



function makeRecordNumber({ recNum, campusCode }) {
  if (campusCode) {
    return `${ recNum }@${ campusCode }`
  } else {
    return String(recNum)
  }
}


function makeWeakRecordKey({ recordTypeCode, recNum, campusCode, initialPeriod = false }) {
  if (campusCode) {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }@${ campusCode }`
  } else {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }`
  }
}


function makeStrongRecordKey({ recordTypeCode, recNum, checkDigit, campusCode, initialPeriod = false }) {
  if (campusCode) {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }${ checkDigit }@${ campusCode }`
  } else {
    return `${ initialPeriod ? '.' : '' }${ recordTypeCode }${ recNum }${ checkDigit }`
  }
}


function makeDatabaseId({ recordTypeCode, recNum, campusId }) {
  return (
    (campusId ? BigInt(campusId).and(0xFFFF).shiftLeft(48) : BigInt.zero)
    .add(BigInt(recordTypeCode.codePointAt(0)).and(0xFFFF).shiftLeft(32))
    .add(BigInt(recNum).and(0xFFFFFFFF))
    .toString()
  )
}


function makeRelativeV4ApiUrl({ apiRecordType, recNum, campusCode }) {
  if (campusCode) {
    return `v4/${ apiRecordType }/${recNum}@${campusCode}`
  } else {
    return `v4/${ apiRecordType }/${recNum}`
  }
}


function makeAbsoluteV4ApiUrl({ apiRecordType, recNum, campusCode, apiHost, apiPath }) {
  //noinspection AssignmentToFunctionParameterJS
  apiHost = apiHost || process.env['SIERRA_API_HOST']
  //noinspection AssignmentToFunctionParameterJS
  apiPath = apiPath || process.env['SIERRA_API_PATH'] || '/iii/sierra-api/'
  if (campusCode) {
    return `https://${apiHost}${apiPath}v4/${ apiRecordType }/${recNum}@${campusCode}`
  } else {
    return `https://${apiHost}${apiPath}v4/${ apiRecordType }/${recNum}`
  }
}


module.exports = {

  make: Object.freeze({

    recordNumber: makeRecordNumber,
    weakRecordKey: makeWeakRecordKey,
    strongRecordKey: makeStrongRecordKey,
    databaseId: makeDatabaseId,
    relativeV4ApiUrl: makeRelativeV4ApiUrl,
    absoluteV4ApiUrl: makeAbsoluteV4ApiUrl,

  })

}
