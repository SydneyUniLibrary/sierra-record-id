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

const { convertRecordTypeCodeToApiRecordType, detect, make, validate, RecordIdKind } = require('..')


const _ARBITRARY_INVALID_REC_NUM = jsv.oneof([ jsv.nat(0, 99999), jsv.integer(10000000, 0xFFFFFFFF) ])
const _ARBITRARY_INVALID_RECORD_TYPE_CODE = jsv.elements('dfghkmqsuwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''))
const _ARBITRARY_API_INCOMPATIBLE_RECORD_TYPE_CODE = jsv.elements([ 'c', 'r', 'v', 'e', 'l', 't', 'j' ])


describe('validate', function () {

  describe('recordNumber', function () {

    chaiProperty(
      'returns true for arbitrary record numbers',
      arbitrary.recordNumber(),
      id => {
        expect(validate.recordNumber(id)).to.be.true
        expect(validate(id, RecordIdKind.RECORD_NUMBER)).to.be.true
        expect(validate(id)).to.be.true
      }
    )

    chaiProperty(
      'returns false for invalid rec nums',
      _ARBITRARY_INVALID_REC_NUM,
      invalidRecNum => {
        const recordNumber = make.recordNumber({ recNum: invalidRecNum })
        expect(validate.recordNumber(recordNumber)).to.be.false
        expect(validate(recordNumber, RecordIdKind.RECORD_NUMBER)).to.be.false
      }
    )

    chaiProperty(
      'returns false for anything else',
      jsv.oneof([ arbitrary.weakRecordKey(), arbitrary.strongRecordKey(), arbitrary.databaseId(),
                  arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID ]),
      { tests: 1000 },
      id => {
        expect(validate.recordNumber(id)).to.be.false
        expect(validate(id, RecordIdKind.RECORD_NUMBER)).to.be.false
      }
    )

  })


  describe('weakRecordKey', function () {

    chaiProperty(
      'returns true for arbitrary weak record keys',
      arbitrary.weakRecordKey(),
      id => {
        expect(validate.weakRecordKey(id)).to.be.true
        expect(validate(id, RecordIdKind.WEAK_RECORD_KEY)).to.be.true
        if (detect(id) !== RecordIdKind.AMBIGUOUS_RECORD_KEY) {
          expect(validate(id)).to.be.true
        }
      }
    )

    chaiProperty(
      'returns false for invalid record type codes',
      arbitrary.recNum(),
      _ARBITRARY_INVALID_RECORD_TYPE_CODE,
      ( recNum, invalidRecordTypeCode ) => {
        const weakRecordKey = make(RecordIdKind.WEAK_RECORD_KEY, { recordTypeCode: invalidRecordTypeCode, recNum })
        expect(validate.weakRecordKey(weakRecordKey)).to.be.false
        expect(validate(weakRecordKey, RecordIdKind.WEAK_RECORD_KEY)).to.be.false
      }
    )

    chaiProperty(
      'returns false for anything else',
      jsv.oneof([ arbitrary.recordNumber(), arbitrary.strongRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
                  arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID ]),
      { tests: 1000 },
      id => {
        expect(validate.weakRecordKey(id)).to.be.false
        expect(validate(id, RecordIdKind.WEAK_RECORD_KEY)).to.be.false
      }
    )

    describe('api compatible only', function () {

      chaiProperty(
        'returns true for arbitrary api-compatible weak record keys',
        arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
        id => {
          expect(validate.weakRecordKey(id, { apiCompatibleOnly: true })).to.be.true
          expect(validate(id, RecordIdKind.WEAK_RECORD_KEY, { apiCompatibleOnly: true })).to.be.true
          if (detect(id) !== RecordIdKind.AMBIGUOUS_RECORD_KEY) {
            expect(validate(id, { apiCompatibleOnly: true })).to.be.true
          }
        }
      )

      chaiProperty(
        'returns false for record type codes that are not api-compatible',
        arbitrary.recNum(),
        _ARBITRARY_API_INCOMPATIBLE_RECORD_TYPE_CODE,
        ( recNum, invalidRecordTypeCode ) => {
          const weakRecordKey = make(RecordIdKind.WEAK_RECORD_KEY, { recordTypeCode: invalidRecordTypeCode, recNum })
          expect(validate.weakRecordKey(weakRecordKey, { apiCompatibleOnly: true })).to.be.false
          expect(validate(weakRecordKey, RecordIdKind.WEAK_RECORD_KEY, { apiCompatibleOnly: true })).to.be.false
        }
      )

    })

  })


  describe('strongRecordKey', function () {

    chaiProperty(
      'returns true for arbitrary strong record keys with valid check digits',
      arbitrary.strongRecordKey(),
      id => {
        expect(validate.strongRecordKey(id)).to.be.true
        expect(validate(id, RecordIdKind.STRONG_RECORD_KEY)).to.be.true
        if (detect(id) !== RecordIdKind.AMBIGUOUS_RECORD_KEY) {
          expect(validate(id)).to.be.true
        }
      }
    )

    chaiProperty(
      'returns false for arbitrary strong record keys with invalid check digits',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recNum, recordTypeCode, campusCode ) => {
        const correctCheckDigit = calcCheckDigit(recNum)
        const wrongCheckDigit = correctCheckDigit === 'x' ? '1' : 'x'
        const invalidStrongRecordKey = make(RecordIdKind.STRONG_RECORD_KEY, {
          recNum,
          recordTypeCode,
          checkDigit: wrongCheckDigit,
          campusCode,
          initialPeriod,
        })
        expect(validate.strongRecordKey(invalidStrongRecordKey)).to.be.false
        expect(validate(invalidStrongRecordKey, RecordIdKind.STRONG_RECORD_KEY)).to.be.false
      }
    )

    chaiProperty(
      'returns false for invalid record type codes',
      jsv.bool,
      arbitrary.recNum(),
      _ARBITRARY_INVALID_RECORD_TYPE_CODE,
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recNum, invalidRecordTypeCode, campusCode ) => {
        const checkDigit = calcCheckDigit(recNum)
        const invalidStrongRecordKey = make(RecordIdKind.STRONG_RECORD_KEY, {
          recNum,
          recordTypeCode: invalidRecordTypeCode,
          checkDigit,
          campusCode,
          initialPeriod,
        })
        expect(validate.strongRecordKey(invalidStrongRecordKey)).to.be.false
        expect(validate(invalidStrongRecordKey, RecordIdKind.STRONG_RECORD_KEY)).to.be.false
      }
    )

    chaiProperty(
      'returns false for anything else',
      jsv.oneof([ arbitrary.recordNumber(), arbitrary.weakRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
                  arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID ]),
      { tests: 1000 },
      id => {
        expect(validate.strongRecordKey(id)).to.be.false
        expect(validate(id, RecordIdKind.STRONG_RECORD_KEY)).to.be.false
      }
    )

    describe('api compatible only', function () {

      chaiProperty(
        'returns true for arbitrary api-compatible strong record keys',
        arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
        id => {
          expect(validate.strongRecordKey(id, { apiCompatibleOnly: true })).to.be.true
          expect(validate(id, RecordIdKind.STRONG_RECORD_KEY, { apiCompatibleOnly: true })).to.be.true
          if (detect(id) !== RecordIdKind.AMBIGUOUS_RECORD_KEY) {
            expect(validate(id, { apiCompatibleOnly: true })).to.be.true
          }
        }
      )

      chaiProperty(
        'returns false for record type codes that are not api-compatible',
        arbitrary.recNum(),
        _ARBITRARY_API_INCOMPATIBLE_RECORD_TYPE_CODE,
        ( recNum, invalidRecordTypeCode ) => {
          const checkDigit = calcCheckDigit(recNum)
          const strongRecordKey = make.strongRecordKey({ recordTypeCode: invalidRecordTypeCode, recNum, checkDigit })
          expect(validate.strongRecordKey(strongRecordKey, { apiCompatibleOnly: true })).to.be.false
          expect(validate(strongRecordKey, RecordIdKind.STRONG_RECORD_KEY, { apiCompatibleOnly: true })).to.be.false
        }
      )

    })

  })


  describe('databaseId', function () {

    chaiProperty(
      'returns true for arbitrary database ids',
      arbitrary.databaseId(),
      id => {
        expect(validate.databaseId(id)).to.be.true
        expect(validate(id, RecordIdKind.DATABASE_ID)).to.be.true
        expect(validate(id)).to.be.true
      }
    )

    chaiProperty(
      'returns false for invalid record type codes',
      arbitrary.recNum(),
      _ARBITRARY_INVALID_RECORD_TYPE_CODE,
      ( recNum, invalidRecordTypeCode ) => {
        const databaseId = make(RecordIdKind.DATABASE_ID, { recordTypeCode: invalidRecordTypeCode, recNum })
        expect(validate.databaseId(databaseId)).to.be.false
        expect(validate(databaseId, RecordIdKind.DATABASE_ID)).to.be.false
      }
    )

    chaiProperty(
      'returns false for invalid rec nums',
      _ARBITRARY_INVALID_REC_NUM,
      arbitrary.recordTypeCode(),
      ( invalidRecNum, recordTypeCode ) => {
        const databaseId = make(RecordIdKind.DATABASE_ID, { recordTypeCode, recNum: invalidRecNum })
        expect(validate.databaseId(databaseId)).to.be.false
        expect(validate(databaseId, RecordIdKind.DATABASE_ID)).to.be.false
      }
    )

    chaiProperty(
      'returns false for anything else',
      jsv.oneof([ arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
                  arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID ]),
      { tests: 1000 },
      id => {
        expect(validate.databaseId(id)).to.be.false
        expect(validate(id, RecordIdKind.DATABASE_ID)).to.be.false
      }
    )

    describe('api compatible only', function () {

      chaiProperty(
        'returns true for arbitrary api-compatible database ids',
        arbitrary.databaseId({ apiCompatibleOnly: true }),
        id => {
          expect(validate.databaseId(id, { apiCompatibleOnly: true })).to.be.true
          expect(validate(id, RecordIdKind.DATABASE_ID, { apiCompatibleOnly: true })).to.be.true
        }
      )

      chaiProperty(
        'returns false for record type codes that are not api-compatible',
        arbitrary.recNum(),
        _ARBITRARY_API_INCOMPATIBLE_RECORD_TYPE_CODE,
        ( recNum, invalidRecordTypeCode ) => {
          const databaseId = make(RecordIdKind.DATABASE_ID, { recordTypeCode: invalidRecordTypeCode, recNum })
          expect(validate.databaseId(databaseId, { apiCompatibleOnly: true })).to.be.false
          expect(validate(databaseId, RecordIdKind.DATABASE_ID, { apiCompatibleOnly: true })).to.be.false
        }
      )

    })

  })


  describe('relativeV4ApiUrl', function () {

    chaiProperty(
      'returns true for arbitrary relative v4 api urls',
      arbitrary.relativeV4ApiUrl(),
      id => {
        expect(validate.relativeV4ApiUrl(id)).to.be.true
        expect(validate(id, RecordIdKind.RELATIVE_V4_API_URL)).to.be.true
        expect(validate(id)).to.be.true
      }
    )

    chaiProperty(
      'returns false for anything else',
      jsv.oneof([ arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
                  arbitrary.databaseId(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID ]),
      { tests: 1000 },
      id => {
        expect(validate.relativeV4ApiUrl(id)).to.be.false
        expect(validate(id, RecordIdKind.RELATIVE_V4_API_URL)).to.be.false
      }
    )

  })


  describe('absoluteV4ApiUrl', function () {

    chaiProperty(
      'returns true for non-virtual absolute v4 api urls',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.recNum(),
      ( apiHost, apiPath, recordTypeCode, recNum )=> {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = make(RecordIdKind.ABSOLUTE_V4_API_URL, { apiRecordType, recNum, apiHost, apiPath })
        expect(validate.absoluteV4ApiUrl(absoluteV4ApiUrl, { apiHost, apiPath })).to.be.true
        expect(validate(absoluteV4ApiUrl, RecordIdKind.ABSOLUTE_V4_API_URL, { apiHost, apiPath })).to.be.true
        expect(validate(absoluteV4ApiUrl, { apiHost, apiPath })).to.be.true
      }
    )

    chaiProperty(
      'returns true for virtual absolute v4 api urls',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recordTypeCode, recNum, campusCode )=> {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = make(RecordIdKind.ABSOLUTE_V4_API_URL, { apiRecordType, recNum, campusCode, apiHost, apiPath })
        expect(validate.absoluteV4ApiUrl(absoluteV4ApiUrl, { apiHost, apiPath })).to.be.true
        expect(validate(absoluteV4ApiUrl, RecordIdKind.ABSOLUTE_V4_API_URL, { apiHost, apiPath })).to.be.true
        expect(validate(absoluteV4ApiUrl, { apiHost, apiPath })).to.be.true
      }
    )

    chaiProperty(
      'returns false for anything else',
      jsv.oneof([ arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
                  arbitrary.databaseId(), arbitrary.relativeV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID ]),
      { tests: 1000 },
      id => {
        expect(validate.absoluteV4ApiUrl(id)).to.be.false
        expect(validate(id, RecordIdKind.ABSOLUTE_V4_API_URL)).to.be.false
      }
    )

  })

})
