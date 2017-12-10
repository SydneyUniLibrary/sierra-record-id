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


describe('RelativeV5ApiUrl', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.relativeV5ApiUrl())(1)[0]
    expect(new RelativeV5ApiUrl(id)[Symbol.toStringTag]).to.equal('RelativeV5ApiUrl')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record parts',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl({ recordTypeCode, recNum })
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl).to.be.instanceOf(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(recNum)
        expect(relativeV5ApiUrl.campusCode).to.be.null
      }
    )

    chaiProperty(
      'builds from virtual record parts',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl({ recordTypeCode, recNum, campusCode })
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl).to.be.instanceOf(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(recNum)
        expect(relativeV5ApiUrl.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'parses arbitrary relative v5 api urls',
      arbitrary.relativeV5ApiUrl(),
      relativeV5ApiUrlAsString => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(relativeV5ApiUrlAsString)
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl).to.be.instanceOf(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV5ApiUrl.toString()).to.equal(relativeV5ApiUrlAsString)
      }
    )

    chaiProperty(
      'parses arbitrary relative v5 api urls with leading/trailing whitespace',
      arbitrary.relativeV5ApiUrl(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( relativeV5ApiUrlAsString, foreSpaces, aftSpaces ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(`${foreSpaces}${relativeV5ApiUrlAsString}${aftSpaces}`)
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl).to.be.instanceOf(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV5ApiUrl.toString()).to.equal(relativeV5ApiUrlAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.absoluteV5ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new RelativeV5ApiUrl(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, campusCode ) => {
        expect(() => new RelativeV5ApiUrl({ recordTypeCode, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode ) => {
        expect(() => new RelativeV5ApiUrl({ recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.relativeV5ApiUrl(),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const recordNumber = relativeV5ApiUrl.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(recordNumber.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.relativeV5ApiUrl(),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const weakRecordKey = relativeV5ApiUrl.convertTo(WeakRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.relativeV5ApiUrl(),
      jsv.bool,
      ( id, initialPeriod ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const weakRecordKey = relativeV5ApiUrl.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.relativeV5ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const strongRecordKey = relativeV5ApiUrl.convertTo(StrongRecordKey)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(relativeV5ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, actually converts to a weak key',
      arbitrary.relativeV5ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const weakRecordKey = relativeV5ApiUrl.convertTo(StrongRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(weakRecordKey.checkDigit).to.be.undefined
        expect(weakRecordKey.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, forced to be a strong key',
      arbitrary.relativeV5ApiUrl(),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const strongRecordKey = relativeV5ApiUrl.convertTo(StrongRecordKey, { strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(relativeV5ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record for non-virtual records, with initial period option',
      arbitrary.relativeV5ApiUrl({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const strongRecordKey = relativeV5ApiUrl.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(relativeV5ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.relativeV5ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const databaseId = relativeV5ApiUrl.convertTo(DatabaseId)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(databaseId.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.relativeV5ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        expect(() => relativeV5ApiUrl.convertTo(DatabaseId)).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.relativeV5ApiUrl(),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const relativeV4ApiUrl = relativeV5ApiUrl.convertTo(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.relativeV5ApiUrl({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const absoluteV4ApiUrl = relativeV5ApiUrl.convertTo(AbsoluteV4ApiUrl, { apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with api host and path from process env',
      arbitrary.relativeV5ApiUrl({ apiCompatibleOnly: true }),
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
          const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
          const absoluteV4ApiUrl = relativeV5ApiUrl.convertTo(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(relativeV5ApiUrl.recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(relativeV5ApiUrl.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'to relative v5 api url',
      arbitrary.relativeV5ApiUrl(),
      ( id ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        expect(relativeV5ApiUrl.convertTo(RelativeV5ApiUrl)).to.equal(relativeV5ApiUrl)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with explicit api host and path',
      arbitrary.relativeV5ApiUrl({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        const absoluteV5ApiUrl = relativeV5ApiUrl.convertTo(AbsoluteV5ApiUrl, { apiHost, apiPath })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(relativeV5ApiUrl.recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(relativeV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with api host and path from process env',
      arbitrary.relativeV5ApiUrl({ apiCompatibleOnly: true }),
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
          const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
          const absoluteV5ApiUrl = relativeV5ApiUrl.convertTo(AbsoluteV5ApiUrl)
          expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
          expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV5ApiUrl.recordTypeCode).to.equal(relativeV5ApiUrl.recordTypeCode)
          expect(absoluteV5ApiUrl.recNum).to.equal(relativeV5ApiUrl.recNum)
          expect(absoluteV5ApiUrl.campusCode).to.equal(relativeV5ApiUrl.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

  })


  describe('toString', function () {

    chaiProperty(
      'for non-virtual records',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const apiRecordType = RelativeV5ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV5ApiUrl = new RelativeV5ApiUrl({ recordTypeCode, recNum })
        const relativeV5ApiUrlAsString = relativeV5ApiUrl.toString()
        expect(relativeV5ApiUrlAsString).to.be.a('string')
        expect(relativeV5ApiUrlAsString).to.match(/^\/v5\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        expect(relativeV5ApiUrlAsString).to.equal(`/v5/${apiRecordType}/${recNum}`)
        expect(relativeV5ApiUrlAsString).to.equal(`${relativeV5ApiUrl}`)
      }
    )

    chaiProperty(
      'for virtual records',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const apiRecordType = RelativeV5ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV5ApiUrl = new RelativeV5ApiUrl({ recordTypeCode, recNum, campusCode })
        const relativeV5ApiUrlAsString = relativeV5ApiUrl.toString()
        expect(relativeV5ApiUrlAsString).to.be.a('string')
        expect(relativeV5ApiUrlAsString).to.match(/^\/v5\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(relativeV5ApiUrlAsString).to.equal(`/v5/${apiRecordType}/${recNum}@${campusCode}`)
        expect(relativeV5ApiUrlAsString).to.equal(`${relativeV5ApiUrl}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns self for arbitrary relative v5 api urls',
      arbitrary.relativeV5ApiUrl(),
      id => {
        const relativeV5ApiUrl = new RelativeV5ApiUrl(id)
        expect(relativeV5ApiUrl.validate()).to.equal(relativeV5ApiUrl)
        expect(() => new RelativeV5ApiUrl(id, { validate: true })).to.not.throw
      }
    )

  })

})
