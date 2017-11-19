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


const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')

const { WeakRecordKey } = require('./weak-record-key')


class StrongRecordKey extends WeakRecordKey {

  static _convertFrom(mergedParts) {
    if (mergedParts.strongKeysForVirtualRecords || !mergedParts.campusCode) {
      return new StrongRecordKey(mergedParts)
    } else {
      return new WeakRecordKey(mergedParts)
    }
  }

  static _parse(recordIdString) {
    const match = /^\s*(\.?)([boicaprnveltj])([1-9]\d{5,6})([0-9x])(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        initialPeriod: match[1] === '.',
        recordTypeCode: match[2],
        recNum: match[3],
        checkDigit: match[4],
        campusCode: match[6] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a strong record key`)
    }
  }

  static _normaliseParts(parts) {
    if (parts.recordTypeCode === undefined) {
      throw new Error('Cannot construct a StrongRecordKey without a recordTypeCode part')
    }
    if (parts.recNum === undefined) {
      throw new Error('Cannot construct a StrongRecordKey without a recNum part')
    }
    parts.initialPeriod = parts.initialPeriod || false
    parts.checkDigit = parts.checkDigit || calcCheckDigit(parts.recNum)
    parts.campusCode = parts.campusCode || null
    return parts
  }

  get [Symbol.toStringTag]() {
    return 'StrongRecordKey'
  }

  get checkDigit() {
    return this.parts.checkDigit
  }

  toString({ initialPeriod } = {}) {
    if (this._str === undefined) {
      const ip = (
        typeof initialPeriod === 'undefined'
          ? this.initialPeriod
          : initialPeriod
      )
      const p = ip ? '.' : ''
      this._str = (
        this.campusCode
          ? `${ p }${ this.recordTypeCode }${ this.recNum }${ this.checkDigit }@${ this.campusCode }`
          : `${ p }${ this.recordTypeCode }${ this.recNum }${ this.checkDigit }`
      )
    }
    return this._str
  }

  validate({ apiCompatibleOnly = false } = {}) {
    super.validate({ apiCompatibleOnly })
    if (this.checkDigit !== calcCheckDigit(this.recNum)) {
      throw new Error(`checkDigit part is invalid: ${this.checkDigit}`)
    }
    return this
  }

}


module.exports = {
  StrongRecordKey
}
