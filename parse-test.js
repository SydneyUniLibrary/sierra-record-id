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


const chai = require('chai')
const expect = chai.expect
const jsv = require('jsverify')
const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')

const { arbitrary, chaiProperty } = require('./test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary

const { convertRecordTypeCodeToApiRecordType, make, parse, RecordIdKind } = require('.')


describe('parse', function () {

  describe('recordNumber', function() {

    chaiProperty(
      'parses non-virtual record numbers',
      arbitrary.recNum(),
      expectedRecNum => {
        const recordNumber = make(RecordIdKind.RECORD_NUMBER, { recNum: expectedRecNum })
        const { recNum, campusCode } = parse.recordNumber(recordNumber)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(null)
      }
    )

    chaiProperty(
      'parses virtual record numbers',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( expectedRecNum, expectedCampusCode ) => {
        const recordNumber = make(RecordIdKind.RECORD_NUMBER, { recNum: expectedRecNum, campusCode: expectedCampusCode })
        const { recNum, campusCode } = parse.recordNumber(recordNumber)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(expectedCampusCode)
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.weakRecordKey(), arbitrary.strongRecordKey(), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => expect(parse.recordNumber(id)).to.be.undefined
    )

  })


  describe('weakRecordKey', function() {

    chaiProperty(
      'parses non-virtual weak record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      ( initialPeriod, expectedRecNum, expectedRecordTypeCode ) => {
        const weakRecordKey = make(RecordIdKind.WEAK_RECORD_KEY, {
          initialPeriod,
          recordTypeCode: expectedRecordTypeCode,
          recNum: expectedRecNum,
        })
        const { recordTypeCode, recNum, campusCode } = parse.weakRecordKey(weakRecordKey)
        expect(recordTypeCode).to.equal(expectedRecordTypeCode)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(null)
      }
    )

    chaiProperty(
      'parses virtual weak record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, expectedRecNum, expectedRecordTypeCode, expectedCampusCode ) => {
        const weakRecordKey = make(RecordIdKind.WEAK_RECORD_KEY, {
          initialPeriod,
          recordTypeCode: expectedRecordTypeCode,
          recNum: expectedRecNum,
          campusCode: expectedCampusCode,
        })
        const { recordTypeCode, recNum, campusCode } = parse.weakRecordKey(weakRecordKey)
        expect(recordTypeCode).to.equal(expectedRecordTypeCode)
        expect(recNum).to.equal(expectedRecNum )
        expect(campusCode).to.equal(expectedCampusCode )
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.strongRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => expect(parse.weakRecordKey(id)).to.be.undefined
    )

  })


  describe('strongRecordKey', function() {

    chaiProperty(
      'parses non-virtual strong record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      ( initialPeriod, expectedRecNum, expectedRecordTypeCode ) => {
        const strongRecordKey = make(RecordIdKind.STRONG_RECORD_KEY, {
          initialPeriod,
          recordTypeCode: expectedRecordTypeCode,
          recNum: expectedRecNum,
          checkDigit: calcCheckDigit(expectedRecNum),
        })
        const { recordTypeCode, recNum, campusCode } = parse.strongRecordKey(strongRecordKey)
        expect(recordTypeCode).to.equal(expectedRecordTypeCode)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(null)
      }
    )

    chaiProperty(
      'parses virtual strong record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, expectedRecNum, expectedRecordTypeCode, expectedCampusCode ) => {
        const strongRecordKey = make(RecordIdKind.STRONG_RECORD_KEY, {
          initialPeriod,
          recordTypeCode: expectedRecordTypeCode,
          recNum: expectedRecNum,
          checkDigit: calcCheckDigit(expectedRecNum),
          campusCode: expectedCampusCode,
        })
        const { recNum, campusCode } = parse.strongRecordKey(strongRecordKey)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(expectedCampusCode)
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => expect(parse.strongRecordKey(id)).to.be.undefined
    )

  })


  describe('databaseId', function() {

    chaiProperty(
      'parses non-virtual database ids',
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      ( expectedRecNum, expectedRecordTypeCode ) => {
        const databaseId = make(RecordIdKind.DATABASE_ID, {
          recordTypeCode: expectedRecordTypeCode,
          recNum: expectedRecNum,
        })
        const { recordTypeCode, recNum, campusId } = parse.databaseId(databaseId)
        expect(recordTypeCode).to.equal(expectedRecordTypeCode)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusId).to.equal(0)
      }
    )

    chaiProperty(
      'parses virtual database ids',
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      jsv.integer(1, 0xFFFF),
      ( expectedRecNum, expectedRecordTypeCode, expectedCampusId ) => {
        const databaseId = make(RecordIdKind.DATABASE_ID, {
          recordTypeCode: expectedRecordTypeCode,
          recNum: expectedRecNum,
          campusId: expectedCampusId,
        })
        const { recordTypeCode, recNum, campusId } = parse.databaseId(databaseId)
        expect(recordTypeCode).to.equal(expectedRecordTypeCode)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusId).to.equal(expectedCampusId)
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => expect(parse.databaseId(id)).to.be.undefined
    )

  })


  describe('relativeV4ApiUrl', function() {

    chaiProperty(
      'parses non-virtual relative v4 api urls',
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      ( expectedRecNum, recordTypeCode ) => {
        const expectedApiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make(RecordIdKind.RELATIVE_V4_API_URL, {
          apiRecordType: expectedApiRecordType,
          recNum: expectedRecNum,
        })
        const { apiRecordType, recNum, campusCode } = parse.relativeV4ApiUrl(relativeV4ApiUrl)
        expect(apiRecordType).to.equal(expectedApiRecordType)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(null)
      }
    )

    chaiProperty(
      'parses virtual relative v4 api urls',
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.CAMPUS_CODE,
      ( expectedRecNum, recordTypeCode, expectedCampusCode ) => {
        const expectedApiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make(RecordIdKind.RELATIVE_V4_API_URL, {
          apiRecordType: expectedApiRecordType,
          recNum: expectedRecNum,
          campusCode: expectedCampusCode,
        })
        const { apiRecordType, recNum, campusCode } = parse.relativeV4ApiUrl(relativeV4ApiUrl)
        expect(apiRecordType).to.equal(expectedApiRecordType)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(expectedCampusCode)
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => expect(parse.relativeV4ApiUrl(id)).to.be.undefined
    )

  })


  describe('absoluteV4ApiUrl', function() {

    chaiProperty(
      'parses non-virtual absolute v4 api urls',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      ( expectedApiHost, expectedApiPath, expectedRecNum, recordTypeCode ) => {
        const expectedApiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make(RecordIdKind.ABSOLUTE_V4_API_URL, {
          apiRecordType: expectedApiRecordType,
          recNum: expectedRecNum,
          apiHost: expectedApiHost,
          apiPath: expectedApiPath,
        })
        const { apiRecordType, recNum, campusCode, apiHost, apiPath } = parse.absoluteV4ApiUrl(relativeV4ApiUrl)
        expect(apiRecordType).to.equal(expectedApiRecordType)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(null)
        expect(apiHost).to.equal(expectedApiHost)
        expect(apiPath).to.equal(expectedApiPath)
      }
    )

    chaiProperty(
      'parses non-virtual absolute v4 api urls',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.CAMPUS_CODE,
      ( expectedApiHost, expectedApiPath, expectedRecNum, recordTypeCode, expectedCampusCode ) => {
        const expectedApiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make(RecordIdKind.ABSOLUTE_V4_API_URL, {
          apiRecordType: expectedApiRecordType,
          recNum: expectedRecNum,
          campusCode: expectedCampusCode,
          apiHost: expectedApiHost,
          apiPath: expectedApiPath,
        })
        const { apiRecordType, recNum, campusCode, apiHost, apiPath } = parse.absoluteV4ApiUrl(relativeV4ApiUrl)
        expect(apiRecordType).to.equal(expectedApiRecordType)
        expect(recNum).to.equal(expectedRecNum)
        expect(campusCode).to.equal(expectedCampusCode)
        expect(apiHost).to.equal(expectedApiHost)
        expect(apiPath).to.equal(expectedApiPath)
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.relativeV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => expect(parse.absoluteV4ApiUrl(id)).to.be.undefined
    )

  })

})
