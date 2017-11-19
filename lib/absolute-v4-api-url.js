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


class AbsoluteV4ApiUrl extends RelativeV4ApiUrl {

  static _parse(recordIdString) {
    const match = /^\s*https:\/\/([-%._~!$&'()*+,;=a-zA-Z0-9]+)(\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/)v4\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?\s*$/.exec(recordIdString)
    if (match) {
      return {
        apiHost: match[1],
        apiPath: match[2],
        recordTypeCode: RelativeV4ApiUrl.convertApiRecordTypeToRecordTypeCode(match[3]),
        recNum: match[4],
        campusCode: match[6] || null,
      }
    } else {
      throw new Error(`Cannot parse the string "${recordIdString}" as a absolute v4 api url`)
    }
  }

  static _normaliseParts(parts) {
    if (parts.recNum === undefined) {
      throw new Error('Cannot construct a AbsoluteV4ApiUrl without a recNum part')
    }
    if (parts.recordTypeCode === undefined) {
      throw new Error('Cannot construct a AbsoluteV4ApiUrl without a recordTypeCode part')
    }
    parts.apiHost = parts.apiHost || process.env['SIERRA_API_HOST']
    if (parts.apiHost === undefined) {
      throw new Error('Cannot construct a AbsoluteV4ApiUrl without either a apiHost part or SIERRA_API_HOST being set')
    }
    parts.apiPath = parts.apiPath || process.env['SIERRA_API_PATH'] || '/iii/sierra-api/'
    parts.campusCode = parts.campusCode || null
    return parts
  }

  get [Symbol.toStringTag]() {
    return 'AbsoluteV4ApiUrl'
  }

  get apiHost() {
    return this.parts.apiHost
  }

  get apiPath() {
    return this.parts.apiPath
  }

  toString() {
    if (!this._str) {
      const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(this.recordTypeCode)
      this._str = (
        this.campusCode
          ? `https://${ this.apiHost }${ this.apiPath }v4/${ apiRecordType }/${ this.recNum }@${ this.campusCode }`
          : `https://${ this.apiHost }${ this.apiPath }v4/${ apiRecordType }/${ this.recNum }`
      )
    }
    return this._str
  }

  validate() {
    super.validate()
    if (!/^[-%._~!$&'()*+,;=a-zA-Z0-9]+$/.test(this.apiHost)) {
      throw new Error(`apiHost part is invalid: ${this.apiHost}`)
    }
    if (!/^\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/$/.test(this.apiPath) || /\/{2,}/.test(this.apiPath)) {
      throw new Error(`apiPath part is invalid: ${this.apiPath}`)
    }
    return this
  }
}


module.exports = {
  AbsoluteV4ApiUrl
}
