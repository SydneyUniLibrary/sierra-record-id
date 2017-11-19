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


class WeakRecordKey extends RecordId {

  static _parse(recordIdString) {
    const match = /^\s*(\.?)([boicaprnveltj])([1-9]\d{5,6})(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        initialPeriod: match[1] === '.',
        recordTypeCode: match[2],
        recNum: match[3],
        campusCode: match[5] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a weak record key`)
    }
  }

  static _normaliseParts(parts) {
    if (parts.recNum === undefined) {
      throw new Error('Cannot construct a WeakRecordKey without a recNum part')
    }
    if (parts.recordTypeCode === undefined) {
      throw new Error('Cannot construct a WeakRecordKey without a recordTypeCode part')
    }
    parts.initialPeriod = parts.initialPeriod || false
    parts.campusCode = parts.campusCode || null
    return parts
  }

  get [Symbol.toStringTag]() {
    return 'WeakRecordKey'
  }

  get initialPeriod() {
    return this.parts.initialPeriod
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
        ? `${ p }${ this.recordTypeCode }${ this.recNum }@${ this.campusCode }`
        : `${ p }${ this.recordTypeCode }${ this.recNum }`
      )
    }
    return this._str
  }

  validate({ apiCompatibleOnly = false } = {}) {
    this._validateRecNum()
    this._validateRecordTypeChar({ apiCompatibleOnly })
    this._validateCampusCode()
    return this
  }

}


module.exports = {
  WeakRecordKey
}
