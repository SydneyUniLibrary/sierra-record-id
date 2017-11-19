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


const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')
const expect = require('chai').expect
const jsv = require('jsverify')
const sinon = require('sinon')

const {
  AbsoluteV4ApiUrl, DatabaseId, RecordId, RecordNumber, RelativeV4ApiUrl, StrongRecordKey, WeakRecordKey
} = require('..')

const { arbitrary, chaiProperty } = require('../test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary


describe('WeakRecordKey', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.weakRecordKey())(1)[0]
    expect(new WeakRecordKey(id)[Symbol.toStringTag]).to.equal('WeakRecordKey')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record number parts',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( initialPeriod, recordTypeCode, recNum ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod, recordTypeCode, recNum })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(weakRecordKey).to.be.instanceOf(RecordId)
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(recNum)
        expect(weakRecordKey.campusCode).to.be.null
      }
    )

    chaiProperty(
      'builds from virtual record number parts',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(weakRecordKey).to.be.instanceOf(RecordId)
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(recNum)
        expect(weakRecordKey.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'initialPeriod defaults to false',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      jsv.oneof([ jsv.constant(null), arbitrary.CAMPUS_CODE ]),
      ( recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = new WeakRecordKey({ recordTypeCode, recNum, campusCode })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(weakRecordKey).to.be.instanceOf(RecordId)
        expect(weakRecordKey.initialPeriod).to.equal(false)
      }
    )

    chaiProperty(
      'parses arbitrary weak record keys',
      arbitrary.weakRecordKey(),
      weakRecordKeyAsString => {
        const weakRecordKey = new WeakRecordKey(weakRecordKeyAsString)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(weakRecordKey).to.be.instanceOf(RecordId)
        expect(weakRecordKey.toString()).to.equal(weakRecordKeyAsString)
      }
    )

    chaiProperty(
      'parses arbitrary weak record keys with leading/trailing whitespace',
      arbitrary.weakRecordKey(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( weakRecordKeyAsString, foreSpaces, aftSpaces ) => {
        const weakRecordKey = new WeakRecordKey(`${foreSpaces}${weakRecordKeyAsString}${aftSpaces}`)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(weakRecordKey).to.be.instanceOf(RecordId)
        expect(weakRecordKey.toString()).to.equal(weakRecordKeyAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.strongRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new WeakRecordKey(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, campusCode ) => {
        expect(() => new WeakRecordKey({ recordTypeCode, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode ) => {
        expect(() => new WeakRecordKey({ recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.weakRecordKey(),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const recordNumber = weakRecordKey.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(weakRecordKey.recNum)
        expect(recordNumber.campusCode).to.equal(weakRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.weakRecordKey(),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        expect(weakRecordKey.convertTo(WeakRecordKey)).to.equal(weakRecordKey)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.weakRecordKey(),
      jsv.bool,
      ( id, initialPeriod ) => {
        const weakRecordKey1 = new WeakRecordKey(id)
        const weakRecordKey2 = weakRecordKey1.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey2).to.be.a('WeakRecordKey')
        expect(weakRecordKey2.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey2.recNum).to.equal(weakRecordKey1.recNum)
        expect(weakRecordKey2.campusCode).to.equal(weakRecordKey1.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.weakRecordKey({ virtual: NEVER }),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const strongRecordKey = weakRecordKey.convertTo(StrongRecordKey)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(weakRecordKey.initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(weakRecordKey.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(weakRecordKey.recNum))
        expect(strongRecordKey.campusCode).to.equal(weakRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, actually converts to a weak key',
      arbitrary.weakRecordKey({ virtual: ALWAYS }),
      ( id ) => {
        const weakRecordKey1 = new WeakRecordKey(id)
        const weakRecordKey2 = weakRecordKey1.convertTo(StrongRecordKey)
        expect(weakRecordKey2).to.be.a('WeakRecordKey')
        expect(weakRecordKey2.initialPeriod).to.equal(weakRecordKey1.initialPeriod)
        expect(weakRecordKey2.recordTypeCode).to.equal(weakRecordKey1.recordTypeCode)
        expect(weakRecordKey2.recNum).to.equal(weakRecordKey1.recNum)
        expect(weakRecordKey2.checkDigit).to.be.undefined
        expect(weakRecordKey2.campusCode).to.equal(weakRecordKey1.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, forced to be a strong key',
      arbitrary.weakRecordKey(),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const strongRecordKey = weakRecordKey.convertTo(StrongRecordKey, { strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(weakRecordKey.initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(weakRecordKey.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(weakRecordKey.recNum))
        expect(strongRecordKey.campusCode).to.equal(weakRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to strong record for non-virtual records, with initial period option',
      arbitrary.weakRecordKey({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const strongRecordKey = weakRecordKey.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(weakRecordKey.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(weakRecordKey.recNum))
        expect(strongRecordKey.campusCode).to.equal(weakRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.weakRecordKey({ virtual: NEVER }),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const databaseId = weakRecordKey.convertTo(DatabaseId)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
        expect(databaseId.recNum).to.equal(weakRecordKey.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.weakRecordKey({ virtual: ALWAYS }),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        expect(() => weakRecordKey.convertTo(DatabaseId)).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
      ( id ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const relativeV4ApiUrl = weakRecordKey.convertTo(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(weakRecordKey.recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(weakRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const weakRecordKey = new WeakRecordKey(id)
        const absoluteV4ApiUrl = weakRecordKey.convertTo(AbsoluteV4ApiUrl, { apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(weakRecordKey.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(weakRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with api host and path from process env',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
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
          const weakRecordKey = new WeakRecordKey(id)
          const absoluteV4ApiUrl = weakRecordKey.convertTo(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(weakRecordKey.recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(weakRecordKey.recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(weakRecordKey.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

  })


  describe('toString', function () {

    chaiProperty(
      'for non-virtual record numbers without initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const weakRecordKey = new WeakRecordKey({ recordTypeCode, recNum })
        const weakRecordKeyAsString = weakRecordKey.toString()
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}$/)
        expect(weakRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for non-virtual record numbers with initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod: true, recordTypeCode, recNum })
        const weakRecordKeyAsString = weakRecordKey.toString()
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}$/)
        expect(weakRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for non-virtual record numbers with initial period override as false',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( initialPeriod, recordTypeCode, recNum ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod, recordTypeCode, recNum })
        const weakRecordKeyAsString = weakRecordKey.toString({ initialPeriod: false })
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}$/)
        expect(weakRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for non-virtual record numbers with initial period override as true',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( initialPeriod, recordTypeCode, recNum ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod, recordTypeCode, recNum })
        const weakRecordKeyAsString = weakRecordKey.toString({ initialPeriod: true })
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}$/)
        expect(weakRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers without initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = new WeakRecordKey({ recordTypeCode, recNum, campusCode })
        const weakRecordKeyAsString = weakRecordKey.toString()
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(weakRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}@${campusCode}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers with initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod: true, recordTypeCode, recNum, campusCode })
        const weakRecordKeyAsString = weakRecordKey.toString()
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(weakRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}@${campusCode}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers with initial period override as false',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
        const weakRecordKeyAsString = weakRecordKey.toString({ initialPeriod: false })
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(weakRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}@${campusCode}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers with initial period override as true',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = new WeakRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
        const weakRecordKeyAsString = weakRecordKey.toString({ initialPeriod: true })
        expect(weakRecordKeyAsString).to.be.a('string')
        expect(weakRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(weakRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}@${campusCode}`)
        expect(weakRecordKeyAsString).to.equal(`${weakRecordKey}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns this for arbitrary weak record keys',
      arbitrary.weakRecordKey(),
      id => {
        const weakRecordKey = new WeakRecordKey(id)
        expect(weakRecordKey.validate()).to.equal(weakRecordKey)
        expect(() => new WeakRecordKey(id, { validate: true })).to.not.throw
      }
    )

    chaiProperty(
      'throws for invalid record type codes',
      arbitrary.recNum(),
      arbitrary.INVALID_RECORD_TYPE_CODE,
      ( recNum, invalidRecordTypeCode ) => {
        const parts = { recordTypeCode: invalidRecordTypeCode, recNum }
        expect(() => new WeakRecordKey(parts).validate()).to.throw(/recordTypeCode part is invalid/i)
        expect(() => new WeakRecordKey(parts, { validate: true })).to.throw(/recordTypeCode part is invalid/i)
      }
    )

    chaiProperty(
      'throws for invalid rec nums',
      arbitrary.INVALID_REC_NUM,
      arbitrary.recordTypeCode(),
      ( invalidRecNum, recordTypeCode ) => {
        const parts = { recordTypeCode, recNum: invalidRecNum }
        expect(() => new WeakRecordKey(parts).validate()).to.throw(/recNum part is out of range/i)
        expect(() => new WeakRecordKey(parts, { validate: true })).to.throw(/recNum part is out of range/i)
      }
    )

    describe('api compatible only', function () {

      chaiProperty(
        'returns this for arbitrary api-compatible weak record keys',
        arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
        id => {
          const weakRecordKey = new WeakRecordKey(id)
          expect(weakRecordKey.validate({ apiCompatibleOnly: true })).to.equal(weakRecordKey)
          expect(() => new WeakRecordKey(id, { validate: { apiCompatibleOnly: true } })).to.not.throw
        }
      )

      chaiProperty(
        'throws for record type codes that are not api-compatible',
        arbitrary.recNum(),
        arbitrary.API_INCOMPATIBLE_RECORD_TYPE_CODE,
        ( recNum, invalidRecordTypeCode ) => {
          const parts = { recordTypeCode: invalidRecordTypeCode, recNum }
          expect(() => new WeakRecordKey(parts).validate({ apiCompatibleOnly: true })).to.throw(
            /recordTypeCode part is invalid or is not api-compatible/i)
          expect(() => new WeakRecordKey(parts, { validate: { apiCompatibleOnly: true } })).to.throw(
            /recordTypeCode part is invalid or is not api-compatible/i)
        }
      )

    })

  })

})
