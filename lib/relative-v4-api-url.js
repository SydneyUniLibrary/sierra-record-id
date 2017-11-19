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


const { RecordId } = require('./record-id')


const _RECORD_TYPE_CODE_TO_API_RECORD_TYPE = {
  'a': 'authorities',
  'b': 'bibs',
  'n': 'invoices',
  'i': 'items',
  'o': 'orders',
  'p': 'patrons'
}

const _API_RECORD_TYPE_TO_RECORD_TYPE_CODE = {
  'authorities': 'a',
  'bibs': 'b',
  'invoices': 'n',
  'items': 'i',
  'orders': 'o',
  'patrons': 'p',
}


class RelativeV4ApiUrl extends RecordId {

  static convertRecordTypeCodeToApiRecordType(recordTypeCode) {
    const apiRecordType = _RECORD_TYPE_CODE_TO_API_RECORD_TYPE[recordTypeCode]
    if (!apiRecordType) {
      throw new Error(`The API does not support records of type ${recordTypeCode}`)
    }
    return apiRecordType
  }

  static convertApiRecordTypeToRecordTypeCode(apiRecordType) {
    const recordTypeCode = _API_RECORD_TYPE_TO_RECORD_TYPE_CODE[apiRecordType]
    if (!recordTypeCode) {
      throw new Error(`Cannot convert record type to a record type char: ${apiRecordType}`)
    }
    return recordTypeCode
  }

  static _parse(recordIdString) {
    const match = /^\s*\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        recordTypeCode: this.convertApiRecordTypeToRecordTypeCode(match[1]),
        recNum: match[2],
        campusCode: match[4] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a relative v4 api url`)
    }
  }

  static _normaliseParts(parts) {
    if (parts.recNum === undefined) {
      throw new Error('Cannot construct a RelativeV4ApiUrl without a recNum part')
    }
    if (parts.recordTypeCode === undefined) {
      throw new Error('Cannot construct a RelativeV4ApiUrl without a recordTypeCode part')
    }
    parts.campusCode = parts.campusCode || null
    return parts
  }

  get [Symbol.toStringTag]() {
    return 'RelativeV4ApiUrl'
  }

  get recordTypeCode() {
    return this.parts.recordTypeCode
  }

  get recNum() {
    return this.parts.recNum
  }

  get campusCode() {
    return this.parts.campusCode
  }

  toString() {
    if (!this._str) {
      const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(this.recordTypeCode)
      this._str = (
        this.campusCode
        ? `/v4/${ apiRecordType }/${ this.recNum }@${ this.campusCode }`
        : `/v4/${ apiRecordType }/${ this.recNum }`
      )
    }
    return this._str
  }

  validate() {
    this._validateRecNum()
    this._validateCampusCode()
    if (!/^[abniop]$/.test(this.recordTypeCode)) {
      throw new Error(`recordTypeCode part is invalid or not API-compatible: ${this.parts.recordTypeCode}`)
    }
    return this
  }

}


module.exports = {
  RelativeV4ApiUrl
}
