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


describe('AbsoluteV5ApiUrl', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.absoluteV5ApiUrl())(1)[0]
    expect(new AbsoluteV5ApiUrl(id)[Symbol.toStringTag]).to.equal('AbsoluteV5ApiUrl')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record parts',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( apiHost, apiPath, recordTypeCode, recNum ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiHost, apiPath, recordTypeCode, recNum })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(recNum)
        expect(absoluteV5ApiUrl.campusCode).to.be.null
      }
    )

    chaiProperty(
      'builds from virtual record parts',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recordTypeCode, recNum, campusCode ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiHost, apiPath, recordTypeCode, recNum, campusCode })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'apiHost defaults to SIERRA_API_HOST if it is defined',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      jsv.oneof([ jsv.constant(null), arbitrary.CAMPUS_CODE ]),
      ( apiHost, apiPath, recordTypeCode, recNum, campusCode ) => {
        let sandbox = sinon.createSandbox()
        try {
          sandbox.stub(process, 'env').value({
            ...process.env,
            'SIERRA_API_HOST': apiHost
          })
          const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiPath, recordTypeCode, recNum, campusCode })
          expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
          expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
          expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
          expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
          expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
          expect(absoluteV5ApiUrl.recNum).to.equal(recNum)
          expect(absoluteV5ApiUrl.campusCode).to.equal(campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'apiPath defaults to SIERRA_API_PATH if it is defined',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      jsv.oneof([ jsv.constant(null), arbitrary.CAMPUS_CODE ]),
      ( apiHost, apiPath, recordTypeCode, recNum, campusCode ) => {
        let sandbox = sinon.createSandbox()
        try {
          sandbox.stub(process, 'env').value({
            ...process.env,
            'SIERRA_API_PATH': apiPath
          })
          const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiHost, recordTypeCode, recNum, campusCode })
          expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
          expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
          expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
          expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
          expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
          expect(absoluteV5ApiUrl.recNum).to.equal(recNum)
          expect(absoluteV5ApiUrl.campusCode).to.equal(campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'apiPath defaults to /iii/sierra-api/ if SIERRA_API_PATH is undefined',
      arbitrary.API_HOST,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      jsv.oneof([ jsv.constant(null), arbitrary.CAMPUS_CODE ]),
      ( apiHost, recordTypeCode, recNum, campusCode ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiHost, recordTypeCode, recNum, campusCode })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal('/iii/sierra-api/')
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'parses arbitrary absolute v5 api urls',
      arbitrary.absoluteV5ApiUrl(),
      absoluteV5ApiUrlAsString => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(absoluteV5ApiUrlAsString)
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV5ApiUrl.toString()).to.equal(absoluteV5ApiUrlAsString)
      }
    )

    chaiProperty(
      'parses arbitrary absolute v5 api urls with leading/trailing whitespace',
      arbitrary.absoluteV5ApiUrl(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( absoluteV5ApiUrlAsString, foreSpaces, aftSpaces ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(`${foreSpaces}${absoluteV5ApiUrlAsString}${aftSpaces}`)
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV5ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV5ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV5ApiUrl.toString()).to.equal(absoluteV5ApiUrlAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.relativeV5ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new AbsoluteV5ApiUrl(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'if apiHost part is missing and SIERRA_API_HOST is undefined',
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiPath, recordTypeCode, recNum, campusCode ) => {
        expect(() => new AbsoluteV5ApiUrl({ apiPath, recordTypeCode, recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recNum, campusCode ) => {
        expect(() => new AbsoluteV5ApiUrl({ apiHost, apiPath, recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recordTypeCode, campusCode ) => {
        expect(() => new AbsoluteV5ApiUrl({ apiHost, apiPath, recordTypeCode, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.absoluteV5ApiUrl(),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const recordNumber = absoluteV5ApiUrl.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(recordNumber.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.absoluteV5ApiUrl(),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const weakRecordKey = absoluteV5ApiUrl.convertTo(WeakRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.absoluteV5ApiUrl(),
      jsv.bool,
      ( id, initialPeriod ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const weakRecordKey = absoluteV5ApiUrl.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.absoluteV5ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const strongRecordKey = absoluteV5ApiUrl.convertTo(StrongRecordKey)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(absoluteV5ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, actually converts to a weak key',
      arbitrary.absoluteV5ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const weakRecordKey = absoluteV5ApiUrl.convertTo(StrongRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(weakRecordKey.checkDigit).to.be.undefined
        expect(weakRecordKey.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, forced to be a strong key',
      arbitrary.absoluteV5ApiUrl(),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const strongRecordKey = absoluteV5ApiUrl.convertTo(StrongRecordKey, { strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(absoluteV5ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record for non-virtual records, with initial period option',
      arbitrary.absoluteV5ApiUrl({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const strongRecordKey = absoluteV5ApiUrl.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(absoluteV5ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.absoluteV5ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const databaseId = absoluteV5ApiUrl.convertTo(DatabaseId)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(databaseId.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.absoluteV5ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        expect(() => absoluteV5ApiUrl.convertTo(DatabaseId)).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.absoluteV5ApiUrl({ apiCompatibleOnly: true }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const relativeV4ApiUrl = absoluteV5ApiUrl.convertTo(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with no api host and path given',
      arbitrary.absoluteV5ApiUrl({ apiCompatibleOnly: true }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const absoluteV4ApiUrl = absoluteV5ApiUrl.convertTo(AbsoluteV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(absoluteV5ApiUrl.apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(absoluteV5ApiUrl.apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.absoluteV5ApiUrl({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const absoluteV4ApiUrl = absoluteV5ApiUrl.convertTo(AbsoluteV4ApiUrl, { apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to relative v5 api url',
      arbitrary.absoluteV5ApiUrl({ apiCompatibleOnly: true }),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        const relativeV5ApiUrl = absoluteV5ApiUrl.convertTo(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(absoluteV5ApiUrl.recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(absoluteV5ApiUrl.recNum)
        expect(relativeV5ApiUrl.campusCode).to.equal(absoluteV5ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url',
      arbitrary.absoluteV5ApiUrl(),
      ( id ) => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        expect(absoluteV5ApiUrl.convertTo(AbsoluteV5ApiUrl)).to.equal(absoluteV5ApiUrl)
      }
    )

  })


  describe('toString', function () {

    chaiProperty(
      'for non-virtual records',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( apiHost, apiPath, recordTypeCode, recNum ) => {
        const apiRecordType = RelativeV5ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiHost, apiPath, recordTypeCode, recNum })
        const absoluteV5ApiUrlAsString = absoluteV5ApiUrl.toString()
        expect(absoluteV5ApiUrlAsString).to.be.a('string')
        expect(absoluteV5ApiUrlAsString).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v5\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        expect(absoluteV5ApiUrlAsString).to.equal(`https://${apiHost}${apiPath}v5/${apiRecordType}/${recNum}`)
        expect(absoluteV5ApiUrlAsString).to.equal(`${absoluteV5ApiUrl}`)
      }
    )

    chaiProperty(
      'for virtual records',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recordTypeCode, recNum, campusCode ) => {
        const apiRecordType = RelativeV5ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl({ apiHost, apiPath, recordTypeCode, recNum, campusCode})
        const absoluteV5ApiUrlAsString = absoluteV5ApiUrl.toString()
        expect(absoluteV5ApiUrlAsString).to.be.a('string')
        expect(absoluteV5ApiUrlAsString).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v5\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(absoluteV5ApiUrlAsString).to.equal(`https://${apiHost}${apiPath}v5/${apiRecordType}/${recNum}@${campusCode}`)
        expect(absoluteV5ApiUrlAsString).to.equal(`${absoluteV5ApiUrl}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns self for arbitrary absolute v5 api urls',
      arbitrary.absoluteV5ApiUrl(),
      id => {
        const absoluteV5ApiUrl = new AbsoluteV5ApiUrl(id)
        expect(absoluteV5ApiUrl.validate()).to.equal(absoluteV5ApiUrl)
        expect(() => new AbsoluteV5ApiUrl(id, { validate: true })).to.not.throw
      }
    )

  })

})
