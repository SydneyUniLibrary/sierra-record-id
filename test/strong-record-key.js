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
  AbsoluteV4ApiUrl, AbsoluteV5ApiUrl, DatabaseId, RecordId, RecordNumber,
  RelativeV4ApiUrl, RelativeV5ApiUrl, StrongRecordKey, WeakRecordKey
} = require('..')

const { arbitrary, chaiProperty } = require('../test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary


describe('StrongRecordKey', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.strongRecordKey())(1)[0]
    expect(new StrongRecordKey(id)[Symbol.toStringTag]).to.equal('StrongRecordKey')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record number parts',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      ( initialPeriod, recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, checkDigit })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey).to.be.instanceOf(StrongRecordKey)
        expect(strongRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(strongRecordKey).to.be.instanceOf(RecordId)
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(recNum)
        expect(strongRecordKey.checkDigit).to.equal(checkDigit)
        expect(strongRecordKey.campusCode).to.be.null
      }
    )

    chaiProperty(
      'builds from virtual record number parts',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, checkDigit, campusCode })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey).to.be.instanceOf(StrongRecordKey)
        expect(strongRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(strongRecordKey).to.be.instanceOf(RecordId)
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(recNum)
        expect(strongRecordKey.checkDigit).to.equal(checkDigit)
        expect(strongRecordKey.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'initialPeriod defaults to false',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      jsv.oneof([ jsv.constant(null), arbitrary.CAMPUS_CODE ]),
      ( recordTypeCode, recNum, campusCode ) => {
        const strongRecordKey = new StrongRecordKey({ recordTypeCode, recNum, campusCode })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey).to.be.instanceOf(StrongRecordKey)
        expect(strongRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(strongRecordKey).to.be.instanceOf(RecordId)
        expect(strongRecordKey.initialPeriod).to.equal(false)
      }
    )

    chaiProperty(
      'calculates the check digit if its missing from parts',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      jsv.oneof([ jsv.constant(null), arbitrary.CAMPUS_CODE ]),
      ( initialPeriod, recordTypeCode, recNum, campusCode ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, campusCode })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey).to.be.instanceOf(StrongRecordKey)
        expect(strongRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(strongRecordKey).to.be.instanceOf(RecordId)
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(recNum))
        expect(strongRecordKey.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'parses arbitrary strong record keys',
      arbitrary.strongRecordKey(),
      strongRecordKeyAsString => {
        const strongRecordKey = new StrongRecordKey(strongRecordKeyAsString)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey).to.be.instanceOf(StrongRecordKey)
        expect(strongRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(strongRecordKey).to.be.instanceOf(RecordId)
        expect(strongRecordKey.toString()).to.equal(strongRecordKeyAsString)
      }
    )

    chaiProperty(
      'parses arbitrary strong record keys with leading/trailing whitespace',
      arbitrary.strongRecordKey(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( strongRecordKeyAsString, foreSpaces, aftSpaces ) => {
        const strongRecordKey = new StrongRecordKey(`${foreSpaces}${strongRecordKeyAsString}${aftSpaces}`)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey).to.be.instanceOf(StrongRecordKey)
        expect(strongRecordKey).to.be.instanceOf(WeakRecordKey)
        expect(strongRecordKey).to.be.instanceOf(RecordId)
        expect(strongRecordKey.toString()).to.equal(strongRecordKeyAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey({ ambiguous: NEVER }), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new StrongRecordKey(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, checkDigit, campusCode ) => {
        expect(() => new StrongRecordKey({ recordTypeCode, checkDigit, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode, checkDigit ) => {
        expect(() => new StrongRecordKey({ recNum, checkDigit, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.strongRecordKey(),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const recordNumber = strongRecordKey.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(strongRecordKey.recNum)
        expect(recordNumber.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.strongRecordKey(),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const weakRecordKey = strongRecordKey.convertTo(WeakRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(strongRecordKey.initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(strongRecordKey.recNum)
        expect(weakRecordKey.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.strongRecordKey(),
      jsv.bool,
      ( id, initialPeriod ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const weakRecordKey = strongRecordKey.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(strongRecordKey.recNum)
        expect(weakRecordKey.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to strong record key',
      arbitrary.strongRecordKey(),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        expect(strongRecordKey.convertTo(StrongRecordKey)).to.equal(strongRecordKey)
      }
    )

    chaiProperty(
      'to strong record key, with initial period option',
      arbitrary.strongRecordKey({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const strongRecordKey1 = new StrongRecordKey(id)
        const strongRecordKey2 = strongRecordKey1.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey2).to.be.a('StrongRecordKey')
        expect(strongRecordKey2.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey2.recordTypeCode).to.equal(strongRecordKey1.recordTypeCode)
        expect(strongRecordKey2.recNum).to.equal(strongRecordKey1.recNum)
        expect(strongRecordKey2.checkDigit).to.equal(strongRecordKey1.checkDigit)
        expect(strongRecordKey2.campusCode).to.equal(strongRecordKey1.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.strongRecordKey({ virtual: NEVER }),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const databaseId = strongRecordKey.convertTo(DatabaseId)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(databaseId.recNum).to.equal(strongRecordKey.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.strongRecordKey({ virtual: ALWAYS }),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        expect(() => strongRecordKey.convertTo(DatabaseId)).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const relativeV4ApiUrl = strongRecordKey.convertTo(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(strongRecordKey.recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const absoluteV4ApiUrl = strongRecordKey.convertTo(AbsoluteV4ApiUrl, { apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(strongRecordKey.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with api host and path from process env',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
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
          const strongRecordKey = new StrongRecordKey(id)
          const absoluteV4ApiUrl = strongRecordKey.convertTo(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(strongRecordKey.recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(strongRecordKey.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'to relative v5 api url',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
      ( id ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const relativeV5ApiUrl = strongRecordKey.convertTo(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(strongRecordKey.recNum)
        expect(relativeV5ApiUrl.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with explicit api host and path',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const strongRecordKey = new StrongRecordKey(id)
        const absoluteV5ApiUrl = strongRecordKey.convertTo(AbsoluteV5ApiUrl, { apiHost, apiPath })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(strongRecordKey.recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(strongRecordKey.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with api host and path from process env',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
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
          const strongRecordKey = new StrongRecordKey(id)
          const absoluteV5ApiUrl = strongRecordKey.convertTo(AbsoluteV5ApiUrl)
          expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
          expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV5ApiUrl.recordTypeCode).to.equal(strongRecordKey.recordTypeCode)
          expect(absoluteV5ApiUrl.recNum).to.equal(strongRecordKey.recNum)
          expect(absoluteV5ApiUrl.campusCode).to.equal(strongRecordKey.campusCode)
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
      arbitrary.CHECK_DIGIT,
      ( recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = new StrongRecordKey({ recordTypeCode, recNum, checkDigit })
        const strongRecordKeyAsString = strongRecordKey.toString()
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        expect(strongRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}${checkDigit}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for non-virtual record numbers with initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      ( recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod: true, recordTypeCode, recNum, checkDigit })
        const strongRecordKeyAsString = strongRecordKey.toString()
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        expect(strongRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}${checkDigit}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for non-virtual record numbers with initial period override as false',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      ( initialPeriod, recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, checkDigit })
        const strongRecordKeyAsString = strongRecordKey.toString({ initialPeriod: false })
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        expect(strongRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}${checkDigit}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for non-virtual record numbers with initial period override as true',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      ( initialPeriod, recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, checkDigit })
        const strongRecordKeyAsString = strongRecordKey.toString({ initialPeriod: true })
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        expect(strongRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}${checkDigit}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers without initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey = new StrongRecordKey({ recordTypeCode, recNum, checkDigit, campusCode })
        const strongRecordKeyAsString = strongRecordKey.toString()
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        expect(strongRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}${checkDigit}@${campusCode}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers with initial periods',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey =
          new StrongRecordKey({ initialPeriod: true, recordTypeCode, recNum, checkDigit, campusCode })
        const strongRecordKeyAsString = strongRecordKey.toString()
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        expect(strongRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}${checkDigit}@${campusCode}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers with initial period override as false',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, checkDigit, campusCode })
        const strongRecordKeyAsString = strongRecordKey.toString({ initialPeriod: false })
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        expect(strongRecordKeyAsString).to.equal(`${recordTypeCode}${recNum}${checkDigit}@${campusCode}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

    chaiProperty(
      'for virtual record numbers with initial period override as true',
      jsv.bool,
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey = new StrongRecordKey({ initialPeriod, recordTypeCode, recNum, checkDigit, campusCode })
        const strongRecordKeyAsString = strongRecordKey.toString({ initialPeriod: true })
        expect(strongRecordKeyAsString).to.be.a('string')
        expect(strongRecordKeyAsString).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        expect(strongRecordKeyAsString).to.equal(`.${recordTypeCode}${recNum}${checkDigit}@${campusCode}`)
        expect(strongRecordKeyAsString).to.equal(`${strongRecordKey}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns this for arbitrary strong record keys with valid check digits',
      arbitrary.strongRecordKey(),
      id => {
        const strongRecordKey = new StrongRecordKey(id)
        expect(strongRecordKey.validate()).to.equal(strongRecordKey)
        expect(() => new StrongRecordKey(id, { validate: true })).to.not.throw
      }
    )

    chaiProperty(
      'throws for arbitrary strong record keys with invalid check digits',
      jsv.bool,
      arbitrary.recNum(),
      arbitrary.recordTypeCode(),
      arbitrary.CAMPUS_CODE,
      ( initialPeriod, recNum, recordTypeCode, campusCode ) => {
        const correctCheckDigit = calcCheckDigit(recNum)
        const wrongCheckDigit = correctCheckDigit === 'x' ? '1' : 'x'
        const parts = { initialPeriod, recNum, recordTypeCode, checkDigit: wrongCheckDigit, campusCode }
        expect(() => new StrongRecordKey(parts).validate()).to.throw(/checkDigit part is invalid/i)
        expect(() => new StrongRecordKey(parts, { validate: true })).to.throw(/checkDigit part is invalid/i)
      }
    )

    chaiProperty(
      'throws for invalid record type codes',
      arbitrary.INVALID_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( invalidRecordTypeCode, recNum, campusCode ) => {
        const checkDigit = calcCheckDigit(recNum)
        const parts = { recordTypeCode: invalidRecordTypeCode, recNum, checkDigit, campusCode }
        expect(() => new StrongRecordKey(parts).validate()).to.throw(/recordTypeCode part is invalid/i)
        expect(() => new StrongRecordKey(parts, { validate: true })).to.throw(/recordTypeCode part is invalid/i)
      }
    )

    chaiProperty(
      'throws for invalid rec nums',
      arbitrary.recordTypeCode(),
      arbitrary.INVALID_REC_NUM,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, invalidRecNum, campusCode ) => {
        const checkDigit = calcCheckDigit(invalidRecNum)
        const parts = { recordTypeCode, recNum: invalidRecNum, checkDigit, campusCode }
        expect(() => new StrongRecordKey(parts).validate()).to.throw(/recNum part is out of range/i)
        expect(() => new StrongRecordKey(parts, { validate: true })).to.throw(/recNum part is out of range/i)
      }
    )

    describe('api compatible only', function () {

      chaiProperty(
        'returns this for arbitrary api-compatible strong record keys',
        arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
        id => {
          const strongRecordKey = new StrongRecordKey(id)
          expect(strongRecordKey.validate({ apiCompatibleOnly: true })).to.equal(strongRecordKey)
          expect(() => new StrongRecordKey(id, { validate: { apiCompatibleOnly: true } })).to.not.throw
        }
      )

      chaiProperty(
        'throws for record type codes that are not api-compatible',
        arbitrary.API_INCOMPATIBLE_RECORD_TYPE_CODE,
        arbitrary.recNum(),
        arbitrary.CHECK_DIGIT,
        arbitrary.CAMPUS_CODE,
        ( recNum, invalidRecordTypeCode, checkDigit, campusCode ) => {
          const parts = { recordTypeCode: invalidRecordTypeCode, recNum, checkDigit, campusCode }
          expect(() => new StrongRecordKey(parts).validate({ apiCompatibleOnly: true })).to.throw(
            /recordTypeCode part is invalid or is not api-compatible/i)
          expect(() => new StrongRecordKey(parts, { validate: { apiCompatibleOnly: true } })).to.throw(
            /recordTypeCode part is invalid or is not api-compatible/i)
        }
      )

    })

  })

})
