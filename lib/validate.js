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


const { detect } = require('./detect')
const { RecordIdKind } = require('./kind')
const { parse } = require('./parse')

const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')


function validate(id, kind, options) {
  if (typeof kind === 'object' && !options) {
    //noinspection AssignmentToFunctionParameterJS
    options = kind
    //noinspection AssignmentToFunctionParameterJS
    kind = undefined
  }
  //noinspection AssignmentToFunctionParameterJS
  kind = kind || detect(id)
  if (kind) {
    switch (kind) {
      case RecordIdKind.RECORD_NUMBER:
        return validate.recordNumber(id, options)
      case RecordIdKind.WEAK_RECORD_KEY:
        return validate.weakRecordKey(id, options)
      case RecordIdKind.STRONG_RECORD_KEY:
        return validate.strongRecordKey(id, options)
      case RecordIdKind.AMBIGUOUS_RECORD_KEY:
        return
      case RecordIdKind.DATABASE_ID:
        return validate.databaseId(id, options)
      case RecordIdKind.RELATIVE_V4_API_URL:
        return validate.relativeV4ApiUrl(id, options)
      case RecordIdKind.ABSOLUTE_V4_API_URL:
        return validate.absoluteV4ApiUrl(id, options)
      default:
        throw new Error(`Cannot validate record id kind: ${String(kind)}`)
    }
  }
}


validate.recordTypeCode = (recordTypeCode, { apiCompatibleOnly = false } = {}) => {
  if (apiCompatibleOnly) {
    return /^[abniop]$/.test(recordTypeCode)
  } else {
    return /^[boicaprnveltj]$/.test(recordTypeCode)
  }
}


validate.recNum = recNum => {
  const x = Number(recNum)
  return x >= 100000 && x <= 9999999
}


validate.apiRecordType = apiRecordType => {
  return /^(authorities|bibs|invoices|items|orders|patrons)$/.test(apiRecordType)
}


validate.recordNumber = id => {
  const parseResult = parse(id, RecordIdKind.RECORD_NUMBER)
  if (parseResult) {
    return validate.recNum(parseResult.recNum)
  }
  return false
}


validate.weakRecordKey = (id, { apiCompatibleOnly = false } = {}) => {
  const parseResult = parse(id, RecordIdKind.WEAK_RECORD_KEY)
  if (parseResult) {
    return (
      validate.recordTypeCode(parseResult.recordTypeCode, { apiCompatibleOnly })
      && validate.recNum(parseResult.recNum)
    )
  }
  return false
}


validate.strongRecordKey = (id, { apiCompatibleOnly = false } = {}) => {
  const parseResult = parse(id, RecordIdKind.STRONG_RECORD_KEY)
  if (parseResult) {
    const expectedCheckDigit = calcCheckDigit(parseResult.recNum)
    return (
      validate.recordTypeCode(parseResult.recordTypeCode, { apiCompatibleOnly })
      && validate.recNum(parseResult.recNum)
      && expectedCheckDigit === parseResult.checkDigit
    )
  }
  return false
}


validate.databaseId = (id, { apiCompatibleOnly = false } = {}) => {
  const parseResult = parse(id, RecordIdKind.DATABASE_ID)
  if (parseResult) {
    return (
      validate.recordTypeCode(parseResult.recordTypeCode, { apiCompatibleOnly })
      && validate.recNum(parseResult.recNum)
    )
  }
  return false
}


validate.relativeV4ApiUrl = id => {
  const parseResult = parse(id, RecordIdKind.RELATIVE_V4_API_URL)
  if (parseResult) {
    return (
      validate.apiRecordType(parseResult.apiRecordType)
      && validate.recNum(parseResult.recNum)
    )
  }
  return false
}


validate.absoluteV4ApiUrl = (id, { apiHost, apiPath } = {}) => {
  const parseResult = parse(id, RecordIdKind.ABSOLUTE_V4_API_URL)
  if (parseResult) {
    //noinspection AssignmentToFunctionParameterJS
    apiHost = apiHost || process.env['SIERRA_API_HOST']
    if (!apiHost) {
      throw new Error("apiHost option is undefined and SIERRA_API_HOST is not defined in the process's environment")
    }
    //noinspection AssignmentToFunctionParameterJS
    apiPath = apiPath || process.env['SIERRA_API_PATH'] || '/iii/sierra-api/'
    return (
      parseResult.apiHost === apiHost
      && parseResult.apiPath === apiPath
      && validate.apiRecordType(parseResult.apiRecordType)
      && validate.recNum(parseResult.recNum)
    )
  }
  return false
}


module.exports = {
  validate
}
