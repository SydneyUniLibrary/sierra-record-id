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
const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')
const expect = require('chai').expect
const jsv = require('jsverify')
const sinon = require('sinon')

const {
  AbsoluteV4ApiUrl, DatabaseId, RecordId, RecordNumber, RelativeV4ApiUrl, StrongRecordKey, WeakRecordKey
} = require('..')

const { arbitrary, chaiProperty } = require('../test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary


describe('DatabaseId', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.databaseId())(1)[0]
    expect(new DatabaseId(id)[Symbol.toStringTag]).to.equal('DatabaseId')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record number parts',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const databaseId = new DatabaseId({ recordTypeCode, recNum })
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId).to.be.instanceOf(DatabaseId)
        expect(databaseId).to.be.instanceOf(RecordId)
        expect(databaseId.recordTypeCode).to.equal(recordTypeCode)
        expect(databaseId.recNum).to.equal(recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'builds from virtual record number parts',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      jsv.integer(1, 0xFFFF),
      ( recordTypeCode, recNum, campusId ) => {
        const databaseId = new DatabaseId({ recordTypeCode, recNum, campusId })
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId).to.be.instanceOf(DatabaseId)
        expect(databaseId).to.be.instanceOf(RecordId)
        expect(databaseId.recordTypeCode).to.equal(recordTypeCode)
        expect(databaseId.recNum).to.equal(recNum)
        expect(databaseId.campusId).to.equal(campusId)
      }
    )

    chaiProperty(
      'parses arbitrary database ids',
      arbitrary.databaseId(),
      databaseIdAsString => {
        const databaseId = new DatabaseId(databaseIdAsString)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId).to.be.instanceOf(DatabaseId)
        expect(databaseId).to.be.instanceOf(RecordId)
        expect(databaseId.toString()).to.equal(databaseIdAsString)
      }
    )

    chaiProperty(
      'parses arbitrary database ids with leading/trailing whitespace',
      arbitrary.databaseId(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( databaseIdAsString, foreSpaces, aftSpaces ) => {
        const databaseId = new DatabaseId(`${foreSpaces}${databaseIdAsString}${aftSpaces}`)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId).to.be.instanceOf(DatabaseId)
        expect(databaseId).to.be.instanceOf(RecordId)
        expect(databaseId.toString()).to.equal(databaseIdAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new DatabaseId(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.ALL_RECORD_TYPE_CODE,
      jsv.integer(1, 0xFFFF),
      ( recordTypeCode, campusId ) => {
        expect(() => new DatabaseId({ recordTypeCode, campusId })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.recNum(),
      jsv.integer(1, 0xFFFF),
      ( recNum, campusId ) => {
        expect(() => new DatabaseId({ recNum, campusId })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if campusCode is given but campusId is not',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        expect(() => new DatabaseId({ recordTypeCode, recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    // Rule: Cannot use the convert function to convert from a database id for a virtual record.
    //       Must be the convertAsync function instead.
    //       So all the tests below are only for non-virtual records.

    chaiProperty(
      'to record number',
      arbitrary.databaseId({ virtual: NEVER }),
      ( id ) => {
        const databaseId = new DatabaseId(id)
        const recordNumber = databaseId.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(databaseId.recNum)
        expect(recordNumber.campusCode).to.be.null
      }
    )

    chaiProperty(
      'to weak record key, without initial period by default',
      arbitrary.databaseId({ virtual: NEVER }),
      ( id ) => {
        const databaseId = new DatabaseId(id)
        const weakRecordKey = databaseId.convertTo(WeakRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(databaseId.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(databaseId.recNum)
        expect(weakRecordKey.campusCode).to.be.null
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.databaseId({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const databaseId = new DatabaseId(id)
        const weakRecordKey = databaseId.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(databaseId.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(databaseId.recNum)
        expect(weakRecordKey.campusCode).to.be.null
      }
    )

    chaiProperty(
      'to strong record key, without initial period by default',
      arbitrary.databaseId({ virtual: NEVER }),
      ( id ) => {
        const databaseId = new DatabaseId(id)
        const strongRecordKey = databaseId.convertTo(StrongRecordKey)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(databaseId.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(databaseId.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(strongRecordKey.recNum))
        expect(strongRecordKey.campusCode).to.be.null
      }
    )

    chaiProperty(
      'to strong record key, with initial period option',
      arbitrary.databaseId({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const databaseId = new DatabaseId(id)
        const strongRecordKey = databaseId.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(databaseId.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(databaseId.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(strongRecordKey.recNum))
        expect(strongRecordKey.campusCode).to.be.null
      }
    )

    // database id -> database id is the exception to the rule
    chaiProperty(
      'to database id',
      arbitrary.databaseId(),
      ( id ) => {
        const databaseId = new DatabaseId(id)
        expect(databaseId.convertTo(DatabaseId)).to.equal(databaseId)
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.databaseId({ virtual: NEVER, apiCompatibleOnly: true }),
      ( id ) => {
        const databseId = new DatabaseId(id)
        const relativeV4ApiUrl = databseId.convertTo(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(databseId.recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(databseId.recNum)
        expect(relativeV4ApiUrl.campusCode).to.be.null
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.databaseId({ virtual: NEVER, apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const databaseId = new DatabaseId(id)
        const absoluteV4ApiUrl = databaseId.convertTo(AbsoluteV4ApiUrl, { apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(databaseId.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(databaseId.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.be.null
      }
    )

    chaiProperty(
      'to absolute v4 api url, with api host and path from process env',
      arbitrary.databaseId({ virtual: NEVER, apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        let sandbox = sinon.createSandbox()
        try {
          sandbox.stub(process, 'env').value({
            ...process.env,
            'SIERRA_API_HOST': apiHost,
            'SIERRA_API_PATH': apiPath
          })
          const databaseId = new DatabaseId(id)
          const absoluteV4ApiUrl = databaseId.convertTo(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(databaseId.recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(databaseId.recNum)
          expect(absoluteV4ApiUrl.campusCode).to.be.null
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'throws for virtual records',
      arbitrary.databaseId({ virtual: ALWAYS, apiCompatibleOnly: true }),
      id => {
        const databaseId = new DatabaseId(id)
        expect(() => databaseId.convertTo(RecordNumber)).
          to.throw(/cannot use convertTo to convert from database ids for virtual records/i)
        expect(() => databaseId.convertTo(WeakRecordKey)).
          to.throw(/cannot use convertTo to convert from database ids for virtual records/i)
        expect(() => databaseId.convertTo(StrongRecordKey)).
          to.throw(/cannot use convertTo to convert from database ids for virtual records/i)
        // database id -> database id is the exception to the rule
        expect(() => databaseId.convertTo(RelativeV4ApiUrl)).
          to.throw(/cannot use convertTo to convert from database ids for virtual records/i)
        expect(() => databaseId.convertTo(AbsoluteV4ApiUrl)).
          to.throw(/cannot use convertTo to convert from database ids for virtual records/i)
      }
    )

  })


  describe('toString', function () {

    chaiProperty(
      'for non-virtual record numbers',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const databaseId = new DatabaseId({ recordTypeCode, recNum })
        const databaseIdAsString = databaseId.toString()
        expect(databaseIdAsString).to.be.a('string')
        expect(databaseIdAsString).to.match(/^\d{12,20}$/)
        expect(databaseIdAsString).to.equal(`${databaseId}`)
        const databaseIdAsBigInt = BigInt(databaseIdAsString)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF)).to.eql(BigInt(recNum))
        expect(databaseIdAsBigInt.shiftRight(32).and(0xFFFF)).to.eql(BigInt(recordTypeCode.codePointAt(0)))
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF)).to.eql(BigInt.zero)
      }
    )

    chaiProperty(
      'for virtual record numbers',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      jsv.integer(1, 0xFFFF),
      ( recordTypeCode, recNum, campusId ) => {
        const databaseId = new DatabaseId({ recordTypeCode, recNum, campusId })
        const databaseIdAsString = databaseId.toString()
        expect(databaseIdAsString).to.be.a('string')
        expect(databaseIdAsString).to.match(/^\d{12,20}$/)
        expect(databaseIdAsString).to.equal(`${databaseId}`)
        const databaseIdAsBigInt = BigInt(databaseIdAsString)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF)).to.eql(BigInt(recNum))
        expect(databaseIdAsBigInt.shiftRight(32).and(0xFFFF)).to.eql(BigInt(recordTypeCode.codePointAt(0)))
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF)).to.eql(BigInt(campusId))
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns this for arbitrary database ids',
      arbitrary.databaseId(),
      id => {
        const databaseId = new DatabaseId(id)
        expect(databaseId.validate()).to.equal(databaseId)
        expect(() => new DatabaseId(id, { validate: true})).to.not.throw
      }
    )

    chaiProperty(
      'throws for invalid record type codes',
      arbitrary.recNum(),
      arbitrary.INVALID_RECORD_TYPE_CODE,
      ( recNum, invalidRecordTypeCode ) => {
        const parts = { recordTypeCode: invalidRecordTypeCode, recNum }
        expect(() => new DatabaseId(parts).validate()).to.throw(/recordTypeCode part is invalid/i)
        expect(() => new DatabaseId(parts, { validate: true })).to.throw(/recordTypeCode part is invalid/i)
      }
    )

    chaiProperty(
      'throws for invalid rec nums',
      arbitrary.INVALID_REC_NUM,
      arbitrary.recordTypeCode(),
      ( invalidRecNum, recordTypeCode ) => {
        const parts = { recordTypeCode, recNum: invalidRecNum }
        expect(() => new DatabaseId(parts).validate()).to.throw(/recNum part is out of range/i)
        expect(() => new DatabaseId(parts, { validate: true })).to.throw(/recNum part is out of range/i)
      }
    )

    chaiProperty(
      'throws for invalid campus ids',
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      jsv.oneof([ jsv.integer(Number.MIN_SAFE_INTEGER, -1), jsv.integer(0xFFFF, Number.MAX_SAFE_INTEGER) ]),
      ( recNum, recordTypeCode, invalidCampusId ) => {
        const parts = { recordTypeCode, recNum, campusId: invalidCampusId }
        expect(() => new DatabaseId(parts).validate()).to.throw(/campusId part is out of range/i)
        expect(() => new DatabaseId(parts, { validate: true })).to.throw(/campusId part is out of range/i)
      }
    )

    describe('api compatible only', function () {

      chaiProperty(
        'returns self for arbitrary api-compatible database ids',
        arbitrary.databaseId({ apiCompatibleOnly: true }),
        id => {
          const databaseId = new DatabaseId(id)
          expect(databaseId.validate({ apiCompatibleOnly: true })).to.equal(databaseId)
          expect(() => new DatabaseId(id, { validate: { apiCompatibleOnly: true } })).to.not.throw
        }
      )

      chaiProperty(
        'throws for record type codes that are not api-compatible',
        arbitrary.recNum(),
        arbitrary.API_INCOMPATIBLE_RECORD_TYPE_CODE,
        ( recNum, invalidRecordTypeCode ) => {
          const parts = { recordTypeCode: invalidRecordTypeCode, recNum }
          expect(() => new DatabaseId(parts).validate({ apiCompatibleOnly: true })).to.throw(
            /recordTypeCode part is invalid or is not api-compatible/i)
          expect(() => new DatabaseId(parts, { validate: { apiCompatibleOnly: true } })).to.throw(
            /recordTypeCode part is invalid or is not api-compatible/i)
        }
      )

    })

  })

})
