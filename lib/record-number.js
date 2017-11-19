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


class RecordNumber extends RecordId {

  static _parse(recordIdString) {
    const match = /^\s*([1-9]\d{5,6})(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        recNum: match[1],
        campusCode: match[3] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a record number`)
    }
  }

  static _normaliseParts(parts) {
    if (parts.recNum === undefined) {
      throw new Error('Cannot construct a RecordNumber without a recNum part')
    }
    parts.campusCode = parts.campusCode || null
    return parts
  }

  get [Symbol.toStringTag]() {
    return 'RecordNumber'
  }

  get recNum() {
    return this.parts.recNum
  }

  get campusCode() {
    return this.parts.campusCode
  }

  convertTo(to, options) {
    if (to === RecordNumber) {
      return this
    }
    if (!options || options.recordTypeCode === undefined) {
      throw new Error('recordTypeCode option is required')
    }
    return super.convertTo(to, options)
  }

  toString() {
    return (
      this.campusCode
      ? `${ this.recNum }@${ this.campusCode }`
      : `${ this.recNum }`
    )
  }

  validate() {
    this._validateRecNum()
    this._validateCampusCode()
    return this
  }

}


module.exports = {
  RecordNumber
}
