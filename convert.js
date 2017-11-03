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
const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')

const { detect, RecordIdForms } = require('./detect')



const _RECORD_TYPE_CODE_TO_API_RECORD_TYPE = {
  'a': 'authorities',
  'b': 'bibs',
  'n': 'invoices',
  'i': 'items',
  'o': 'orders',
  'p': 'patrons'
}

function convertRecordTypeCodeToApiRecordType(recordTypeCode) {
  const recordType = _RECORD_TYPE_CODE_TO_API_RECORD_TYPE[recordTypeCode]
  if (!recordType) {
    throw new Error(`The API does not support records of type ${recordTypeCode}`)
  }
  return recordType
}


const _API_RECORD_TYPE_TO_RECORD_TYPE_CODE = {
  'authorities': 'a',
  'bibs': 'b',
  'invoices': 'n',
  'items': 'i',
  'orders': 'o',
  'patrons': 'p',
}

function convertApiRecordTypeToRecordTypeCode(apiRecordType) {
  const recordTypeCode = _API_RECORD_TYPE_TO_RECORD_TYPE_CODE[apiRecordType]
  if (!recordTypeCode) {
    throw new Error(`Cannot convert record type to a record type char: ${apiRecordType}`)
  }
  return recordTypeCode
}



function convert({ id, to, from, recordTypeCode, initialPeriod = false, strongKeysForVirtualRecords = false, context = {} }) {
  const detectedFrom = from || detect(id)
  if (!detectedFrom) {
    throw new Error(`Cannot detect the form of record id: ${id}`)
  }
  if (detectedFrom === to && to !== RecordIdForms.WEAK_RECORD_KEY && to !== RecordIdForms.STRONG_RECORD_KEY) {
    return id
  }
  switch (from) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertFromRecordNumber({ id, to, initialPeriod, recordTypeCode, strongKeysForVirtualRecords, context })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertFromWeakRecordKey({ id, to, initialPeriod, recordTypeCode, strongKeysForVirtualRecords, context })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertFromStrongRecordKey({ id, to, initialPeriod, recordTypeCode, strongKeysForVirtualRecords, context })
    case RecordIdForms.DATABASE_ID:
      return _convertFromDatabaseId({ id, to, initialPeriod, strongKeysForVirtualRecords, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertFromRelativeV4ApiUrl({ id, to, initialPeriod, strongKeysForVirtualRecords, context })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertFromAbsoluteV4ApiUrl({ id, to, initialPeriod, strongKeysForVirtualRecords, context })
  }
  throw new Error(`Cannot convert from ${from.toString()} to ${to.toString()} for record id ${id}`)
}


function _convertFromRecordNumber({ id, to, initialPeriod, recordTypeCode, strongKeysForVirtualRecords, context }) {
  const [ recNum, campusCode ] = id.split('@', 2)
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return id
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeCode, recNum, campusCode, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeCode, recNum, campusCode })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeCode, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from record number to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromWeakRecordKey({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const match = /^\.?([boicaprnveltj])([1-9]\d{5,6})(@([a-z0-9]{1,5}))?$/.exec(id)
  const recordTypeCode = match[1]
  const recNum = match[2]
  const campusCode = match[4] || ''
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      // Have to deal with weak record key -> weak record key so we can strip or add initial period
      return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords, context })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeCode, recNum, campusCode, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeCode, recNum, campusCode, context })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeCode, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from weak record key to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromStrongRecordKey({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const match = /^\.?([boicaprnveltj])([1-9]\d{5,6})[0-9x](@([a-z0-9]{1,5}))?$/.exec(id)
  const recordTypeCode = match[1]
  const recNum = match[2]
  const campusCode = match[4] || ''
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeCode, recNum, campusCode, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeCode, recNum, campusCode })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeCode, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from strong record key to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromDatabaseId({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const bigIntId = BigInt(id)
  const campusId = bigIntId.shiftRight(48).and(0xFFFF).toJSNumber()
  if (campusId !== 0) {
    throw new Error('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
  }
  const recordTypeCode = String.fromCodePoint(bigIntId.shiftRight(32).and(0xFFFF).toJSNumber())
  const recNum = bigIntId.and(0xFFFFFFFF).toString()
  const campusCode = ''
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeCode, recNum, campusCode })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeCode, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from database id to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromRelativeV4ApiUrl({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const [ version, apiRecordType, recordNumber ] = id.split('/', 3)
  const [ recNum, campusCode ] = recordNumber.split('@', 2)
  const recordTypeCode = convertApiRecordTypeToRecordTypeCode(apiRecordType)
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeCode, recNum, campusCode, context })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeCode, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from relative v4 API URL to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromAbsoluteV4ApiUrl({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const match = (
    /^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?$/
    .exec(id)
  )
  const apiRecordType = match[1]
  const recNum = match[2]
  const campusCode = match[4] || ''
  const recordTypeCode = convertApiRecordTypeToRecordTypeCode(apiRecordType)
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeCode, recNum, campusCode, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeCode, recNum, campusCode })
    default:
      throw new Error(`Cannot convert from absolute v4 API URL to ${to.toString()} for record id ${id}`)
  }
}


function _convertToRecordNumber({ recNum, campusCode }) {
  return [
    recNum,
    campusCode ? `@` : '',
    campusCode ? campusCode : '',
  ].join('')
}


function _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode }) {
  if (!recordTypeCode) {
    throw new Error('recordTypeCode is required when converting to a weak record key')
  }
  return [
    initialPeriod ? '.' : '',
    recordTypeCode,
    recNum,
    campusCode ? `@` : '',
    campusCode ? campusCode : '',
  ].join('')
}


function _convertToStrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode, strongKeysForVirtualRecords, checkDigit }) {
  if (!recordTypeCode) {
    throw new Error('recordTypeCode is required when converting to a strong record key')
  }
  if (!campusCode || strongKeysForVirtualRecords) {
    return [
      initialPeriod ? '.' : '',
      recordTypeCode,
      recNum,
      checkDigit || calcCheckDigit(recNum),
      campusCode ? `@` : '',
      campusCode ? campusCode : '',
    ].join('')
  } else {
    return _convertToWeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
  }
}


function _convertToDatabaseId({ recordTypeCode, recNum, campusCode }) {
  if (!recordTypeCode) {
    throw new Error('recordTypeCode is required when converting to a database id')
  }
  if (campusCode) {
    throw new Error('Cannot use convert to convert to database ids for virtual records. Must use convertAsync instead')
  }
  return (
    BigInt(recordTypeCode.codePointAt(0)).shiftLeft(32)
    .add(BigInt(recNum))
    .toString()
  )
}


function _convertToRelativeV4ApiUrl({ recordTypeCode, recNum, campusCode }) {
  if (!recordTypeCode) {
    throw new Error('recordTypeCode is required when converting to a relative v4 API URL')
  }
  return [
    'v4',
    convertRecordTypeCodeToApiRecordType(recordTypeCode),
    _convertToRecordNumber({ recNum, campusCode })
  ].join('/')
}


function _convertToAbsoluteV4ApiUrl({ recordTypeCode, recNum, campusCode, context }) {
  const { sierraApiHost, sierraApiPath } = context
  if (!recordTypeCode) {
    throw new Error('recordTypeCode is required when converting to an absolute v4 API URL')
  }
  const host = sierraApiHost || process.env['SIERRA_API_HOST']
  if (!host) {
    throw new Error('SIERRA_API_HOST must be set in the process environment to be able to convert to an absolute v4 API URL')
  }
  return [
    'https://',
    host,
    sierraApiPath || process.env['SIERRA_API_PATH'] || '/iii/sierra-api/',
    'v4/',
    convertRecordTypeCodeToApiRecordType(recordTypeCode),
    '/',
    _convertToRecordNumber({ recNum, campusCode })
  ].join('')
}


module.exports = {
  convert,
  convertRecordTypeCodeToApiRecordType,
  convertApiRecordTypeToRecordTypeCode,
}
