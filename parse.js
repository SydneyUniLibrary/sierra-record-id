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



function parseRecordNumber(id) {
  const match = /^([1-9]\d{5,6})(@([a-z0-9]{1,5}))?$/.exec(id)
  if (match) {
    return {
      recNum: match[1],
      campusCode: match[3] || null,
    }
  }
}


function parseWeakRecordKey(id) {
  const match = /^\.?([boicaprnveltj])([1-9]\d{5,6})(@([a-z0-9]{1,5}))?$/.exec(id)
  if (match) {
    return {
      recordTypeCode: match[1],
      recNum: match[2],
      campusCode: match[4] || null,
    }
  }
}


function parseStrongRecordKey(id) {
  const match = /^\.?([boicaprnveltj])([1-9]\d{5,6})([0-9x])(@([a-z0-9]{1,5}))?$/.exec(id)
  if (match) {
    return {
      recordTypeCode: match[1],
      recNum: match[2],
      checkDigit: match[3],
      campusCode: match[5] || null,
    }
  }
}


function parseDatabaseId(id) {
  if (/^\d{12,20}$/.test(id)) {
    const idAsBigInt = BigInt(id)
    return {
      campusId: idAsBigInt.shiftRight(48).and(0xFFFF).toJSNumber(),
      recordTypeCode: String.fromCodePoint(idAsBigInt.shiftRight(32).and(0xFFFF).toJSNumber()),
      recNum: idAsBigInt.and(0xFFFFFFFF).toString()
    }
  }
}


function parseRelativeV4ApiUrl(id) {
  const match = /^v4\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?$/.exec(id)
  if (match) {
    return {
      apiRecordType: match[1],
      recNum: match[2],
      campusCode: match[4] || null,
    }
  }
}


function parseAbsoluteV4ApiUrl(id) {
  const match = /^https:\/\/([-%._~!$&'()*+,;=a-zA-Z0-9]+)(\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/)v4\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@([a-z0-9]{1,5}))?$/.exec(id)
  if (match) {
    return {
      apiHost: match[1],
      apiPath: match[2],
      apiRecordType: match[3],
      recNum: match[4],
      campusCode: match[6] || null,
    }
  }
}


module.exports = {

  parse: Object.freeze({
    recordNumber: parseRecordNumber,
    weakRecordKey: parseWeakRecordKey,
    strongRecordKey: parseStrongRecordKey,
    databaseId: parseDatabaseId,
    relativeV4ApiUrl: parseRelativeV4ApiUrl,
    absoluteV4ApiUrl: parseAbsoluteV4ApiUrl,
  })

}
