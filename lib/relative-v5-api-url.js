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


const { RelativeV4ApiUrl } = require('./relative-v4-api-url')


class RelativeV5ApiUrl extends RelativeV4ApiUrl {

  static _parse(recordIdString) {
    const match = /^\s*\/v5\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        recordTypeCode: this.convertApiRecordTypeToRecordTypeCode(match[1]),
        recNum: match[2],
        campusCode: match[4] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a relative v5 api url`)
    }
  }

  get [Symbol.toStringTag]() {
    return 'RelativeV5ApiUrl'
  }

  toString() {
    if (!this._str) {
      const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(this.recordTypeCode)
      this._str = (
        this.campusCode
          ? `/v5/${ apiRecordType }/${ this.recNum }@${ this.campusCode }`
          : `/v5/${ apiRecordType }/${ this.recNum }`
      )
    }
    return this._str
  }

}


module.exports = {
  RelativeV5ApiUrl
}
