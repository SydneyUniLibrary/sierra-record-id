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
const chai = require('chai')
const expect = chai.expect
const jsv = require('jsverify')
const { URL } = require('url')
const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')

const { convert, RecordIdForms } = require('.')
const { convertRecordTypeCharToApiRecordType } = require('./convert')
const { arbitrary, chaiProperty } = require('./test-support')

const { ALWAYS, NEVER, SOMETIMES } = arbitrary



const _TEST_RECORD_METADATA_TABLE = (function () {
  let lastCampusId
  let lastCampusCode
  return Object.freeze({
    mapFromCampusCode: (campusCode) => {
      if (lastCampusCode !== campusCode) {
        lastCampusId = jsv.random(0, 0xFFFF)
        lastCampusCode = campusCode
      }
      return lastCampusId
    },
    mapFromDatabaseId: (databaseId) => {
      const campusId = BigInt(databaseId).shiftRight(48).and(0xFFFF).toJSNumber()
      if (lastCampusId !== campusId) {
        lastCampusId = campusId
        lastCampusCode = jsv.sampler(arbitrary.campusCode, 1)
      }
      return lastCampusCode
    },
  })
})()


describe('convert', function () {

  describe('from record number', function () {

    function unpack(id) {
      const re = /^(\d+)(@.+)?$/
      expect(id).to.match(re)
      let match = re.exec(id)
      return {
        recNum: match[1],
        virtPart: match[2] || '',
      }
    }

    chaiProperty(
      'to record number',
      arbitrary.recordNumber(),
      id => {
        const recordNumber = convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.RECORD_NUMBER })
        expect(recordNumber).to.equal(id)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const weakRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.WEAK_RECORD_KEY, recordTypeChar })
        const { recNum, virtPart } = unpack(id)
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.equal(`${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to weak record key with initial period',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const weakRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.WEAK_RECORD_KEY, recordTypeChar,
                          initialPeriod: true })
        const { recNum, virtPart } = unpack(id)
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.equal(`.${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.recordNumber({ virtual: NEVER }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar })
        const expectedCheckDigit = calcCheckDigit(id)
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.equal(`${recordTypeChar}${id}${expectedCheckDigit}`)
      }
    )

    chaiProperty(
      'to strong record key for virtual records',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar })
        const { recNum, virtPart } = unpack(id)
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to forced strong record key for virtual records',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar,
                          strongKeysForVirtualRecords: true })
        const { recNum, virtPart } = unpack(id)
        const expectedCheckDigit = calcCheckDigit(recNum)
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${expectedCheckDigit}${virtPart}`)
      }
    )

    chaiProperty(
      'to strong record with initial period for non-virtual records',
      arbitrary.recordNumber({ virtual: NEVER}),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                 convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar,
                           initialPeriod: true })
        const { recNum, virtPart } = unpack(id)
        const expectedCheckDigit = calcCheckDigit(recNum)
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.equal(`.${recordTypeChar}${recNum}${expectedCheckDigit}${virtPart}`)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const databaseId =
          convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.DATABASE_ID, recordTypeChar,
            context: { recordMetadataTable: _TEST_RECORD_METADATA_TABLE } })
        const { recNum, virtPart } = unpack(id)
        const campusCode = virtPart.slice(1)
        const expectedCampusId = campusCode ? _TEST_RECORD_METADATA_TABLE.mapFromCampusCode(campusCode) : 0
        let databaseIdAsBigInt = BigInt(databaseId)
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF).toJSNumber()).to.equal(expectedCampusId)
        expect(String.fromCodePoint(databaseIdAsBigInt.shiftRight(32).and(0xFFFF).toJSNumber())).to.equal(recordTypeChar)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF).toJSNumber()).to.equal(Number(recNum))
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar({ apiCompatibleOnly: true }),
      ( id, recordTypeChar ) => {
        const relativeV4ApiUrl =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.RELATIVE_V4_API_URL, recordTypeChar })
        const { recNum, virtPart } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(relativeV4ApiUrl).to.be.a('string')
        expect(relativeV4ApiUrl).to.equal(`v4/${expectedRecordType}/${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar({ apiCompatibleOnly: true }),
      ( id, recordTypeChar ) => {
        const absoluteV4ApiUrl =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.ABSOLUTE_V4_API_URL, recordTypeChar,
                          context: { sierraApiHost: 'some.library' } })
        const { recNum, virtPart } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.equal(`https://some.library/iii/sierra-api/v4/${expectedRecordType}/${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url, throws if SIERRA_API_HOST is not set',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar({ apiCompatibleOnly: true }),
      ( id, recordTypeChar ) => {
        const fn =
          () => convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.ABSOLUTE_V4_API_URL, recordTypeChar })
        expect(fn).to.throw(/SIERRA_API_HOST must be set/)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe.skip('from weak record key', function () {

  })


  //---------------------------------------------------------------------------


  describe.skip('from strong record key', function () {

  })


  //---------------------------------------------------------------------------


  describe('from database id', function () {

    chaiProperty(
      'to database id',
      arbitrary.databaseId(),
      id => {
        const recordNumber =
                convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.DATABASE_ID })
        expect(recordNumber).to.equal(id)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe('from relative v4 api url', function () {

    chaiProperty(
      'to relative v4 api url',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const relativeV4ApiUrl =
                convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.RELATIVE_V4_API_URL })
        expect(relativeV4ApiUrl).to.equal(id)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe('from absolute v4 api url', function () {

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.absoluteV4ApiUrl(),
      id => {
        const absoluteV4ApiUrl =
                convert({ id, from: RecordIdForms.ABSOLUTE_V4_API_URL, to: RecordIdForms.ABSOLUTE_V4_API_URL })
        expect(() => new URL(id)).to.not.throw()
        expect(absoluteV4ApiUrl).to.equal(id)
      }
    )

  })

})
