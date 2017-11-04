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

const { arbitrary, chaiProperty } = require('../test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary

const { convertRecordTypeCodeToApiRecordType, make, parse, RecordIdKind } = require('..')


describe('parse', function () {

  describe('recordNumber', function() {

    chaiProperty(
      'parses non-virtual record numbers',
      arbitrary.recNum(),
      expectedRecNum => {
        const recordNumber = make(RecordIdKind.RECORD_NUMBER, { recNum: expectedRecNum })
        const parseResult = parse(recordNumber, RecordIdKind.RECORD_NUMBER)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recNum).to.equal(expectedRecNum)
        expect(parseResult.campusCode).to.equal(null)
        expect(parseResult).to.eql(parse(recordNumber))
        expect(parseResult).to.eql(parse.recordNumber(recordNumber))
      }
    )

    chaiProperty(
      'parses virtual record numbers',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( expectedRecNum, expectedCampusCode ) => {
        const recordNumber = make(RecordIdKind.RECORD_NUMBER, { recNum: expectedRecNum, campusCode: expectedCampusCode })
        const parseResult = parse(recordNumber, RecordIdKind.RECORD_NUMBER)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recNum).to.equal(expectedRecNum)
        expect(parseResult.campusCode).to.equal(expectedCampusCode)
        expect(parseResult).to.eql(parse(recordNumber))
        expect(parseResult).to.eql(parse.recordNumber(recordNumber))
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.weakRecordKey(), arbitrary.strongRecordKey(), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => {
        expect(parse(id, RecordIdKind.RECORD_NUMBER)).to.be.undefined
        expect(parse.recordNumber(id)).to.be.undefined
      }
    )

  })


  describe('weakRecordKey', function() {

    chaiProperty(
      'parses non-virtual weak record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      ( initialPeriod, recNum, recordTypeCode ) => {
        const weakRecordKey = make(RecordIdKind.WEAK_RECORD_KEY, { initialPeriod, recordTypeCode, recNum })
        const parseResult = parse(weakRecordKey, RecordIdKind.WEAK_RECORD_KEY)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recordTypeCode).to.equal(recordTypeCode)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(null)
        expect(parseResult).to.eql(parse.weakRecordKey(weakRecordKey))
      }
    )

    chaiProperty(
      'parses virtual weak record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recNum, recordTypeCode, campusCode ) => {
        const weakRecordKey = make(RecordIdKind.WEAK_RECORD_KEY, { initialPeriod, recordTypeCode, recNum, campusCode })
        const parseResult = parse(weakRecordKey, RecordIdKind.WEAK_RECORD_KEY)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recordTypeCode).to.equal(recordTypeCode)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(campusCode)
        expect(parseResult).to.eql(parse.weakRecordKey(weakRecordKey))
      }
    )

    chaiProperty(
      'detects and parses arbitrary unambiguous weak records keys',
      arbitrary.weakRecordKey({ ambiguous: NEVER }),
      weakRecordKey => expect(parse(weakRecordKey)).to.not.be.undefined
    )

    chaiProperty(
      'returns undefined for ambiguous strong records keys',
      arbitrary.weakRecordKey({ ambiguous: ALWAYS }),
      weakRecordKey => expect(parse(weakRecordKey)).to.be.undefined
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.strongRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => {
        expect(parse(id, RecordIdKind.WEAK_RECORD_KEY)).to.be.undefined
        expect(parse.weakRecordKey(id)).to.be.undefined
      }
    )

  })


  describe('strongRecordKey', function() {

    chaiProperty(
      'parses non-virtual strong record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      ( initialPeriod, recNum, recordTypeCode ) => {
        const strongRecordKey = make(RecordIdKind.STRONG_RECORD_KEY, { initialPeriod, recordTypeCode, recNum: recNum,
                                                                       checkDigit: calcCheckDigit(recNum) })
        const parseResult = parse(strongRecordKey, RecordIdKind.STRONG_RECORD_KEY)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recordTypeCode).to.equal(recordTypeCode)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(null)
        expect(parseResult).to.eql(parse.strongRecordKey(strongRecordKey))
      }
    )

    chaiProperty(
      'parses virtual strong record keys',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recNum, recordTypeCode, campusCode ) => {
        const strongRecordKey = make(RecordIdKind.STRONG_RECORD_KEY, { initialPeriod, recordTypeCode, recNum,
                                                                       checkDigit: calcCheckDigit(recNum), campusCode })
        const parseResult = parse(strongRecordKey, RecordIdKind.STRONG_RECORD_KEY)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recordTypeCode).to.equal(recordTypeCode)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(campusCode)
        expect(parseResult).to.eql(parse.strongRecordKey(strongRecordKey))
      }
    )

    chaiProperty(
      'detects and parses arbitrary unambiguous strong records keys',
      arbitrary.strongRecordKey({ ambiguous: NEVER }),
      strongRecordKey => expect(parse(strongRecordKey)).to.not.be.undefined
    )

    chaiProperty(
      'returns undefined for ambiguous strong records keys',
      arbitrary.strongRecordKey({ ambiguous: ALWAYS }),
      strongRecordKey => expect(parse(strongRecordKey)).to.be.undefined
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => {
        expect(parse(id, RecordIdKind.STRONG_RECORD_KEY)).to.be.undefined
        expect(parse.strongRecordKey(id)).to.be.undefined
      }
    )

  })


  describe('databaseId', function() {

    chaiProperty(
      'parses non-virtual database ids',
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      ( recNum, recordTypeCode ) => {
        const databaseId = make(RecordIdKind.DATABASE_ID, { recordTypeCode, recNum })
        const parseResult = parse(databaseId, RecordIdKind.DATABASE_ID)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recordTypeCode).to.equal(recordTypeCode)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusId).to.equal(0)
        expect(parseResult).to.eql(parse(databaseId))
        expect(parseResult).to.eql(parse.databaseId(databaseId))
      }
    )

    chaiProperty(
      'parses virtual database ids',
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      jsv.integer(1, 0xFFFF),
      ( recNum, recordTypeCode, campusId ) => {
        const databaseId = make(RecordIdKind.DATABASE_ID, { recordTypeCode, recNum, campusId })
        const parseResult = parse(databaseId, RecordIdKind.DATABASE_ID)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.recordTypeCode).to.equal(recordTypeCode)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusId).to.equal(campusId)
        expect(parseResult).to.eql(parse(databaseId))
        expect(parseResult).to.eql(parse.databaseId(databaseId))
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => {
        expect(parse(id, RecordIdKind.DATABASE_ID)).to.be.undefined
        expect(parse.databaseId(id)).to.be.undefined
      }
    )

  })


  describe('relativeV4ApiUrl', function() {

    chaiProperty(
      'parses non-virtual relative v4 api urls',
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      ( recNum, recordTypeCode ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make(RecordIdKind.RELATIVE_V4_API_URL, { apiRecordType, recNum })
        const parseResult = parse(relativeV4ApiUrl, RecordIdKind.RELATIVE_V4_API_URL)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.apiRecordType).to.equal(apiRecordType)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(null)
        expect(parseResult).to.eql(parse(relativeV4ApiUrl))
        expect(parseResult).to.eql(parse.relativeV4ApiUrl(relativeV4ApiUrl))
      }
    )

    chaiProperty(
      'parses virtual relative v4 api urls',
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.CAMPUS_CODE,
      ( recNum, recordTypeCode, campusCode ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make(RecordIdKind.RELATIVE_V4_API_URL, { apiRecordType, recNum, campusCode })
        const parseResult = parse(relativeV4ApiUrl, RecordIdKind.RELATIVE_V4_API_URL)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.apiRecordType).to.equal(apiRecordType)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(campusCode)
        expect(parseResult).to.eql(parse(relativeV4ApiUrl))
        expect(parseResult).to.eql(parse.relativeV4ApiUrl(relativeV4ApiUrl))
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => {
        expect(parse(id, RecordIdKind.RELATIVE_V4_API_URL)).to.be.undefined
        expect(parse.relativeV4ApiUrl(id)).to.be.undefined
      }
    )

  })


  describe('absoluteV4ApiUrl', function() {

    chaiProperty(
      'parses non-virtual absolute v4 api urls',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      ( apiHost, apiPath, recNum, recordTypeCode ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = make(RecordIdKind.ABSOLUTE_V4_API_URL, { apiRecordType, recNum, apiHost, apiPath })
        const parseResult = parse(absoluteV4ApiUrl, RecordIdKind.ABSOLUTE_V4_API_URL)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.apiRecordType).to.equal(apiRecordType)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(null)
        expect(parseResult.apiHost).to.equal(apiHost)
        expect(parseResult.apiPath).to.equal(apiPath)
        expect(parseResult).to.eql(parse(absoluteV4ApiUrl))
        expect(parseResult).to.eql(parse.absoluteV4ApiUrl(absoluteV4ApiUrl))
      }
    )

    chaiProperty(
      'parses non-virtual absolute v4 api urls',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recNum(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recNum, recordTypeCode, campusCode ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = make(RecordIdKind.ABSOLUTE_V4_API_URL, { apiRecordType, recNum, campusCode, apiHost, apiPath })
        const parseResult = parse(absoluteV4ApiUrl, RecordIdKind.ABSOLUTE_V4_API_URL)
        expect(parseResult).to.be.a('Object')
        expect(parseResult.apiRecordType).to.equal(apiRecordType)
        expect(parseResult.recNum).to.equal(recNum)
        expect(parseResult.campusCode).to.equal(campusCode)
        expect(parseResult.apiHost).to.equal(apiHost)
        expect(parseResult.apiPath).to.equal(apiPath)
        expect(parseResult).to.eql(parse(absoluteV4ApiUrl))
        expect(parseResult).to.eql(parse.absoluteV4ApiUrl(absoluteV4ApiUrl))
      }
    )

    chaiProperty(
      'returns undefined for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.relativeV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      { tests: 1000 },
      id => {
        expect(parse(id, RecordIdKind.ABSOLUTE_V4_API_URL)).to.be.undefined
        expect(parse.absoluteV4ApiUrl(id)).to.be.undefined
      }
    )

  })

})
