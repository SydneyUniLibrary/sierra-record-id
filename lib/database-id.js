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

const { RecordId } = require('./record-id')


class DatabaseId extends RecordId {

  static _convertFrom(mergedParts) {
    if (!mergedParts.campusId && mergedParts.campusCode) {
      throw new Error('Cannot use convertTo to convert virtual records ids to database ids')
    }
    return new DatabaseId(mergedParts)
  }

  static _parse(recordIdString) {
    const match = /^\s*(\d{12,20})\s*$/.exec(recordIdString)
    if (match) {
      const idAsBigInt = BigInt(match[1])
      return {
        campusId: idAsBigInt.shiftRight(48).and(0xFFFF).toJSNumber(),
        recordTypeCode: String.fromCodePoint(idAsBigInt.shiftRight(32).and(0xFFFF).toJSNumber()),
        recNum: idAsBigInt.and(0xFFFFFFFF).toString()
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a database id`)
    }
  }

  static _normaliseParts(parts) {
    if (parts.recNum === undefined) {
      throw new Error('Cannot construct a DatabaseId without a recNum part')
    }
    if (parts.recordTypeCode === undefined) {
      throw new Error('Cannot construct a DatabaseId without a recordTypeCode part')
    }
    if (!parts.campusId && parts.campusCode) {
      // This is a symptom of a record id for a virtual record being converted to a database id
      // or a database id being constructed from the parts of a record id for a virtual record.
      // Neither is possible because we can't translate a campus code into a campus id without a potential db lookup.
      // Its only possible using the convertToAsync method of the record id being converted from.
      throw new Error('Cannot construct a DatabaseId with a campusCode part but without a campusId part')
    }
    parts.campusId = parts.campusId || 0
    return parts
  }

  get [Symbol.toStringTag]() {
    return 'DatabaseId'
  }

  get recordTypeCode() {
    return this.parts.recordTypeCode
  }

  get recNum() {
    return this.parts.recNum
  }

  get campusId() {
    return this.parts.campusId
  }

  convertTo(to, options) {
    if (to === DatabaseId) {
      return this
    }
    if (this.parts.campusId && !this.parts.campusCode) {
      throw new Error('Cannot use convertTo to convert from database ids for virtual records')
    }
    return super.convertTo(to, options)
  }

  toString() {
    if (this._str === undefined) {
      this._str = (
        (this.campusId ? BigInt(this.campusId).and(0xFFFF).shiftLeft(48) : BigInt.zero)
        .add(BigInt(this.recordTypeCode.codePointAt(0)).and(0xFFFF).shiftLeft(32))
        .add(BigInt(this.recNum).and(0xFFFFFFFF))
        .toString()

      )
    }
    return this._str
  }

  validate({ apiCompatibleOnly = false } = {}) {
    this._validateRecNum()
    this._validateRecordTypeChar({ apiCompatibleOnly })
    if (this.campusId < 0 || this.campusId > 0xFFFF) {
      throw new Error(`campusId part is out of range: ${this.campusId}`)
    }
    return this
  }


}


module.exports = {
  DatabaseId
}
