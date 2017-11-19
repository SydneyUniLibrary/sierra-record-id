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


// See lib/record-id-detect.js for RecordId.detect


/**
 * Creates a record id object by calling the constructor on a given subclass of RecordId and
 * passing the given recordIdStringOrParts and options to the constructor.
 *
 * @param {typeof RecordId} kind A RecordId subclass. Must be the class itself, not an instance or a string.
 * @param {...*} constructorArgs The arguments to pass to the constructor.
 * @returns {RecordId} The object returned by calling new on the given class.
 * @private
 */
function _createRecordId(kind, ...constructorArgs) {
  // This bit of arcane magic was taken from https://stackoverflow.com/a/8843181
  return new (Function.prototype.bind.apply(kind, [ null, ...constructorArgs ]))
}


class RecordId {

  static fromString(recordIdString) {
    const kind = RecordId.detect(recordIdString)
    return _createRecordId(kind, recordIdString)
  }


  constructor(recordIdStringOrParts, { validate = false } = {}) {
    this._parts = (
      typeof recordIdStringOrParts === 'string'
      ? new.target._parse(recordIdStringOrParts)
      : typeof recordIdStringOrParts === 'object' && recordIdStringOrParts !== null
      ? new.target._normaliseParts(recordIdStringOrParts)
      : undefined
    )
    if (!this._parts) {
      throw new Error(`Cannot construct a ${this[Symbol.toStringTag]} from a ${typeof recordIdStringOrParts}: ${recordIdStringOrParts}`)
    }
    this._kind = this[Symbol.toStringTag]
    if (validate) {
      if (typeof validate === 'boolean') {
        this.validate()
      } else {
        this.validate(validate)
      }
    }
  }


  get parts() {
    return this._parts
  }


  convertTo(to, options) {
    if (Object.getPrototypeOf(this) === to.prototype && options === undefined) {
      return this
    }
    const mergedParts = { ...this.parts, ...options }
    if (to._convertFrom === undefined) {
      return _createRecordId(to, mergedParts)
    } else {
      return to._convertFrom(mergedParts)
    }
  }

  async convertToAsync(to, options) {
    throw new Error('Not implemented')
  }


  toString() {
    throw new Error(`${this[Symbol.toStringTag]} does not provide its own toString method`)
  }


  validate() {
    throw new Error(`${this[Symbol.toStringTag]} does not provide its own validate method`)
  }


  _validateCampusCode() {
    if (!/^[a-z0-9]{0,5}$/.test(this.parts.campusCode)) {
      throw new Error(`campusCode part is invalid: ${this.parts.campusCode}`)
    }
  }


  _validateRecNum() {
    const x = Number(this.parts.recNum)
    if (x < 100000 || x > 9999999) {
      throw new Error(`recNum part is out of range: ${x}`)
    }
  }


  _validateRecordTypeChar({ apiCompatibleOnly = false } = {}) {
    if (apiCompatibleOnly) {
      if (!/^[abniop]$/.test(this.parts.recordTypeCode)) {
        throw new Error(`recordTypeCode part is invalid or is not api-compatible: ${this.parts.recordTypeCode}`)
      }
    } else {
      if (!/^[boicaprnveltj]$/.test(this.parts.recordTypeCode)) {
        throw new Error(`recordTypeCode part is invalid: ${this.parts.recordTypeCode}`)
      }
    }
  }

}


module.exports = {
  RecordId
}
