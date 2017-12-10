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


const { AbsoluteV4ApiUrl } = require('./absolute-v4-api-url')
const { RelativeV5ApiUrl } = require('./relative-v5-api-url')


class AbsoluteV5ApiUrl extends AbsoluteV4ApiUrl {

  static _parse(recordIdString) {
    const match = /^\s*https:\/\/([-%._~!$&'()*+,;=a-zA-Z0-9]+)(\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/)v5\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        apiHost: match[1],
        apiPath: match[2],
        recordTypeCode: RelativeV5ApiUrl.convertApiRecordTypeToRecordTypeCode(match[3]),
        recNum: match[4],
        campusCode: match[6] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a absolute v4 api url`)
    }
  }


  get [Symbol.toStringTag]() {
    return 'AbsoluteV5ApiUrl'
  }


  toString() {
    if (!this._str) {
      const apiRecordType = RelativeV5ApiUrl.convertRecordTypeCodeToApiRecordType(this.recordTypeCode)
      this._str = (
        this.campusCode
          ? `https://${ this.apiHost }${ this.apiPath }v5/${ apiRecordType }/${ this.recNum }@${ this.campusCode }`
          : `https://${ this.apiHost }${ this.apiPath }v5/${ apiRecordType }/${ this.recNum }`
      )
    }
    return this._str
  }

}


module.exports = {
  AbsoluteV5ApiUrl
}
