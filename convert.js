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



const _RECORD_TYPE_CHAR_TO_API_RECORD_TYPE = {
  'a': 'authorities',
  'b': 'bibs',
  'n': 'invoices',
  'i': 'items',
  'o': 'orders',
  'p': 'patrons'
}

function convertRecordTypeCharToApiRecordType(recordTypeChar) {
  const recordType = _RECORD_TYPE_CHAR_TO_API_RECORD_TYPE[recordTypeChar]
  if (!recordType) {
    throw new Error(`The API does not support records of type ${recordTypeChar}`)
  }
  return recordType
}


const _API_RECORD_TYPE_TO_RECORD_TYPE_CHAR = {
  'authorities': 'a',
  'bibs': 'b',
  'invoices': 'n',
  'items': 'i',
  'orders': 'o',
  'patrons': 'p',
}

function convertApiRecordTypeToRecordTypeChar(apiRecordType) {
  const recordTypeChar = _API_RECORD_TYPE_TO_RECORD_TYPE_CHAR[apiRecordType]
  if (!recordTypeChar) {
    throw new Error(`Cannot convert record type to a record type char: ${apiRecordType}`)
  }
  return recordTypeChar
}



function convert({ id, to, from, recordTypeChar, initialPeriod = false, strongKeysForVirtualRecords = false, context = {} }) {
  const detectedFrom = from || detect(id)
  if (!detectedFrom) {
    throw new Error(`Cannot detect the form of record id: ${id}`)
  }
  if (detectedFrom === to && to !== RecordIdForms.WEAK_RECORD_KEY && to !== RecordIdForms.STRONG_RECORD_KEY) {
    return id
  }
  switch (from) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertFromRecordNumber({ id, to, initialPeriod, recordTypeChar, strongKeysForVirtualRecords, context })
    case RecordIdForms.DATABASE_ID:
      return _convertFromDatabaseId({ id, to, initialPeriod, strongKeysForVirtualRecords, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertFromRelativeV4ApiUrl({ id, to, initialPeriod, strongKeysForVirtualRecords, context })
  }
  throw new Error(`Cannot convert from ${from.toString()} to ${to.toString()} for record id ${id}`)
}


function _convertFromRecordNumber({ id, to, initialPeriod, recordTypeChar, strongKeysForVirtualRecords, context }) {
  const [ recNum, campusCode ] = id.split('@', 2)
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return id
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeChar, recNum, campusCode, context })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeChar, recNum, campusCode })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeChar, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from record number to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromDatabaseId({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const bigIntId = BigInt(id)
  const campusId = bigIntId.shiftRight(48).and(0xFFFF).toJSNumber()
  if (campusId !== 0) {
    throw new Error('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
  }
  const recordTypeChar = String.fromCodePoint(bigIntId.shiftRight(32).and(0xFFFF).toJSNumber())
  const recNum = bigIntId.and(0xFFFFFFFF).toString()
  const campusCode = ''
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.RELATIVE_V4_API_URL:
      return _convertToRelativeV4ApiUrl({ recordTypeChar, recNum, campusCode })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeChar, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from database id to ${to.toString()} for record id ${id}`)
  }
}


function _convertFromRelativeV4ApiUrl({ id, to, initialPeriod, strongKeysForVirtualRecords, context }) {
  const [ version, apiRecordType, recordNumber ] = id.split('/', 3)
  const [ recNum, campusCode ] = recordNumber.split('@', 2)
  const recordTypeChar = convertApiRecordTypeToRecordTypeChar(apiRecordType)
  switch (to) {
    case RecordIdForms.RECORD_NUMBER:
      return _convertToRecordNumber({ recNum, campusCode })
    case RecordIdForms.WEAK_RECORD_KEY:
      return _convertToWeakRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode })
    case RecordIdForms.STRONG_RECORD_KEY:
      return _convertToStrongRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode, strongKeysForVirtualRecords })
    case RecordIdForms.DATABASE_ID:
      return _convertToDatabaseId({ recordTypeChar, recNum, campusCode, context })
    case RecordIdForms.ABSOLUTE_V4_API_URL:
      return _convertToAbsoluteV4ApiUrl({ recordTypeChar, recNum, campusCode, context })
    default:
      throw new Error(`Cannot convert from relative v4 API URL to ${to.toString()} for record id ${id}`)
  }
}


function _convertToRecordNumber({ recNum, campusCode }) {
  return [
    recNum,
    campusCode ? `@` : '',
    campusCode ? campusCode : '',
  ].join('')
}


function _convertToWeakRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode }) {
  if (!recordTypeChar) {
    throw new Error('recordTypeChar is required when converting to a weak record key')
  }
  return [
    initialPeriod ? '.' : '',
    recordTypeChar,
    recNum,
    campusCode ? `@` : '',
    campusCode ? campusCode : '',
  ].join('')
}


function _convertToStrongRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode, strongKeysForVirtualRecords, checkDigit }) {
  if (!recordTypeChar) {
    throw new Error('recordTypeChar is required when converting to a strong record key')
  }
  if (!campusCode || strongKeysForVirtualRecords) {
    return [
      initialPeriod ? '.' : '',
      recordTypeChar,
      recNum,
      checkDigit || calcCheckDigit(recNum),
      campusCode ? `@` : '',
      campusCode ? campusCode : '',
    ].join('')
  } else {
    return _convertToWeakRecordKey({ initialPeriod, recordTypeChar, recNum, campusCode })
  }
}


function _convertToDatabaseId({ recordTypeChar, recNum, campusCode }) {
  if (!recordTypeChar) {
    throw new Error('recordTypeChar is required when converting to a database id')
  }
  if (campusCode) {
    throw new Error('Cannot use convert to convert to database ids for virtual records. Must use convertAsync instead')
  }
  return (
    BigInt(recordTypeChar.codePointAt(0)).shiftLeft(32)
    .add(BigInt(recNum))
    .toString()
  )
}


function _convertToRelativeV4ApiUrl({ recordTypeChar, recNum, campusCode }) {
  if (!recordTypeChar) {
    throw new Error('recordTypeChar is required when converting to a relative v4 API URL')
  }
  return [
    'v4',
    convertRecordTypeCharToApiRecordType(recordTypeChar),
    _convertToRecordNumber({ recNum, campusCode })
  ].join('/')
}


function _convertToAbsoluteV4ApiUrl({ recordTypeChar, recNum, campusCode, context }) {
  const { sierraApiHost, sierraApiPath } = context
  if (!recordTypeChar) {
    throw new Error('recordTypeChar is required when converting to an absolute v4 API URL')
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
    convertRecordTypeCharToApiRecordType(recordTypeChar),
    '/',
    _convertToRecordNumber({ recNum, campusCode })
  ].join('')
}


module.exports = {
  convert,
  convertRecordTypeCharToApiRecordType,
  convertApiRecordTypeToRecordTypeChar,
}
