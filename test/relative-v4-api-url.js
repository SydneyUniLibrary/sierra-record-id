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


describe('RelativeV4ApiUrl', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.relativeV4ApiUrl())(1)[0]
    expect(new RelativeV4ApiUrl(id)[Symbol.toStringTag]).to.equal('RelativeV4ApiUrl')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record parts',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl({ recordTypeCode, recNum })
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(recNum)
        expect(relativeV4ApiUrl.campusCode).to.be.null
      }
    )

    chaiProperty(
      'builds from virtual record parts',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl({ recordTypeCode, recNum, campusCode })
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'parses arbitrary relative v4 api urls',
      arbitrary.relativeV4ApiUrl(),
      relativeV4ApiUrlAsString => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(relativeV4ApiUrlAsString)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV4ApiUrl.toString()).to.equal(relativeV4ApiUrlAsString)
      }
    )

    chaiProperty(
      'parses arbitrary relative v4 api urls with leading/trailing whitespace',
      arbitrary.relativeV4ApiUrl(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( relativeV4ApiUrlAsString, foreSpaces, aftSpaces ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(`${foreSpaces}${relativeV4ApiUrlAsString}${aftSpaces}`)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.instanceOf(RecordId)
        expect(relativeV4ApiUrl.toString()).to.equal(relativeV4ApiUrlAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new RelativeV4ApiUrl(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, campusCode ) => {
        expect(() => new RelativeV4ApiUrl({ recordTypeCode, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode ) => {
        expect(() => new RelativeV4ApiUrl({ recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.relativeV4ApiUrl(),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const recordNumber = relativeV4ApiUrl.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(recordNumber.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.relativeV4ApiUrl(),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const weakRecordKey = relativeV4ApiUrl.convertTo(WeakRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.relativeV4ApiUrl(),
      jsv.bool,
      ( id, initialPeriod ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const weakRecordKey = relativeV4ApiUrl.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.relativeV4ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const strongRecordKey = relativeV4ApiUrl.convertTo(StrongRecordKey)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(relativeV4ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, actually converts to a weak key',
      arbitrary.relativeV4ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const weakRecordKey = relativeV4ApiUrl.convertTo(StrongRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(weakRecordKey.checkDigit).to.be.undefined
        expect(weakRecordKey.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, forced to be a strong key',
      arbitrary.relativeV4ApiUrl(),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const strongRecordKey = relativeV4ApiUrl.convertTo(StrongRecordKey, { strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(relativeV4ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record for non-virtual records, with initial period option',
      arbitrary.relativeV4ApiUrl({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const strongRecordKey = relativeV4ApiUrl.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(relativeV4ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.relativeV4ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const databaseId = relativeV4ApiUrl.convertTo(DatabaseId)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(databaseId.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.relativeV4ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        expect(() => relativeV4ApiUrl.convertTo(DatabaseId)).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.relativeV4ApiUrl(),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        expect(relativeV4ApiUrl.convertTo(RelativeV4ApiUrl)).to.equal(relativeV4ApiUrl)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.relativeV4ApiUrl({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const absoluteV4ApiUrl = relativeV4ApiUrl.convertTo(AbsoluteV4ApiUrl, { apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with api host and path from process env',
      arbitrary.relativeV4ApiUrl({ apiCompatibleOnly: true }),
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
          const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
          const absoluteV4ApiUrl = relativeV4ApiUrl.convertTo(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(relativeV4ApiUrl.recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(relativeV4ApiUrl.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'to relative v5 api url',
      arbitrary.relativeV4ApiUrl(),
      ( id ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const relativeV5ApiUrl = relativeV4ApiUrl.convertTo(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(relativeV5ApiUrl.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with explicit api host and path',
      arbitrary.relativeV4ApiUrl({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        const absoluteV5ApiUrl = relativeV4ApiUrl.convertTo(AbsoluteV5ApiUrl, { apiHost, apiPath })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(relativeV4ApiUrl.recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(relativeV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with api host and path from process env',
      arbitrary.relativeV4ApiUrl({ apiCompatibleOnly: true }),
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
          const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
          const absoluteV5ApiUrl = relativeV4ApiUrl.convertTo(AbsoluteV5ApiUrl)
          expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
          expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV5ApiUrl.recordTypeCode).to.equal(relativeV4ApiUrl.recordTypeCode)
          expect(absoluteV5ApiUrl.recNum).to.equal(relativeV4ApiUrl.recNum)
          expect(absoluteV5ApiUrl.campusCode).to.equal(relativeV4ApiUrl.campusCode)
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
        const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = new RelativeV4ApiUrl({ recordTypeCode, recNum })
        const relativeV4ApiUrlAsString = relativeV4ApiUrl.toString()
        expect(relativeV4ApiUrlAsString).to.be.a('string')
        expect(relativeV4ApiUrlAsString).to.match(/^\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        expect(relativeV4ApiUrlAsString).to.equal(`/v4/${apiRecordType}/${recNum}`)
        expect(relativeV4ApiUrlAsString).to.equal(`${relativeV4ApiUrl}`)
      }
    )

    chaiProperty(
      'for virtual records',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = new RelativeV4ApiUrl({ recordTypeCode, recNum, campusCode })
        const relativeV4ApiUrlAsString = relativeV4ApiUrl.toString()
        expect(relativeV4ApiUrlAsString).to.be.a('string')
        expect(relativeV4ApiUrlAsString).to.match(/^\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(relativeV4ApiUrlAsString).to.equal(`/v4/${apiRecordType}/${recNum}@${campusCode}`)
        expect(relativeV4ApiUrlAsString).to.equal(`${relativeV4ApiUrl}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns self for arbitrary relative v4 api urls',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const relativeV4ApiUrl = new RelativeV4ApiUrl(id)
        expect(relativeV4ApiUrl.validate()).to.equal(relativeV4ApiUrl)
        expect(() => new RelativeV4ApiUrl(id, { validate: true })).to.not.throw
      }
    )

  })

})
