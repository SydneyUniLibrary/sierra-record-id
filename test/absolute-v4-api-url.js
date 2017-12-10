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


describe('AbsoluteV4ApiUrl', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.absoluteV4ApiUrl())(1)[0]
    expect(new AbsoluteV4ApiUrl(id)[Symbol.toStringTag]).to.equal('AbsoluteV4ApiUrl')
  })


  describe('constructor', function () {

    chaiProperty(
      'builds from non-virtual record parts',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( apiHost, apiPath, recordTypeCode, recNum ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiHost, apiPath, recordTypeCode, recNum })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(recNum)
        expect(absoluteV4ApiUrl.campusCode).to.be.null
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
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiHost, apiPath, recordTypeCode, recNum, campusCode })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(campusCode)
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
          const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiPath, recordTypeCode, recNum, campusCode })
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(campusCode)
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
          const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiHost, recordTypeCode, recNum, campusCode })
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
          expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(campusCode)
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
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiHost, recordTypeCode, recNum, campusCode })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal('/iii/sierra-api/')
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'parses arbitrary absolute v4 api urls',
      arbitrary.absoluteV4ApiUrl(),
      absoluteV4ApiUrlAsString => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(absoluteV4ApiUrlAsString)
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV4ApiUrl.toString()).to.equal(absoluteV4ApiUrlAsString)
      }
    )

    chaiProperty(
      'parses arbitrary absolute v4 api urls with leading/trailing whitespace',
      arbitrary.absoluteV4ApiUrl(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( absoluteV4ApiUrlAsString, foreSpaces, aftSpaces ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(`${foreSpaces}${absoluteV4ApiUrlAsString}${aftSpaces}`)
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl).to.be.instanceOf(AbsoluteV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RelativeV4ApiUrl)
        expect(absoluteV4ApiUrl).to.be.instanceOf(RecordId)
        expect(absoluteV4ApiUrl.toString()).to.equal(absoluteV4ApiUrlAsString)
      }
    )

    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.recordNumber(), arbitrary.weakRecordKey(), arbitrary.strongRecordKey(),
        arbitrary.databaseId(), arbitrary.relativeV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new AbsoluteV4ApiUrl(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'if apiHost part is missing and SIERRA_API_HOST is undefined',
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiPath, recordTypeCode, recNum, campusCode ) => {
        expect(() => new AbsoluteV4ApiUrl({ apiPath, recordTypeCode, recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recordTypeCode part is missing',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recNum, campusCode ) => {
        expect(() => new AbsoluteV4ApiUrl({ apiHost, apiPath, recNum, campusCode })).to.throw(/cannot construct/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recordTypeCode, campusCode ) => {
        expect(() => new AbsoluteV4ApiUrl({ apiHost, apiPath, recordTypeCode, campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.absoluteV4ApiUrl(),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const recordNumber = absoluteV4ApiUrl.convertTo(RecordNumber)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(recordNumber.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.absoluteV4ApiUrl(),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const weakRecordKey = absoluteV4ApiUrl.convertTo(WeakRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.absoluteV4ApiUrl(),
      jsv.bool,
      ( id, initialPeriod ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const weakRecordKey = absoluteV4ApiUrl.convertTo(WeakRecordKey, { initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(weakRecordKey.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.absoluteV4ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const strongRecordKey = absoluteV4ApiUrl.convertTo(StrongRecordKey)
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(absoluteV4ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, actually converts to a weak key',
      arbitrary.absoluteV4ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const weakRecordKey = absoluteV4ApiUrl.convertTo(StrongRecordKey)
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(weakRecordKey.checkDigit).to.be.undefined
        expect(weakRecordKey.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, forced to be a strong key',
      arbitrary.absoluteV4ApiUrl(),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const strongRecordKey = absoluteV4ApiUrl.convertTo(StrongRecordKey, { strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(absoluteV4ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to strong record for non-virtual records, with initial period option',
      arbitrary.absoluteV4ApiUrl({ virtual: NEVER }),
      jsv.bool,
      ( id, initialPeriod ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const strongRecordKey = absoluteV4ApiUrl.convertTo(StrongRecordKey, { initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(absoluteV4ApiUrl.recNum))
        expect(strongRecordKey.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.absoluteV4ApiUrl({ virtual: NEVER }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const databaseId = absoluteV4ApiUrl.convertTo(DatabaseId)
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(databaseId.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.absoluteV4ApiUrl({ virtual: ALWAYS }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        expect(() => absoluteV4ApiUrl.convertTo(DatabaseId)).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.absoluteV4ApiUrl({ apiCompatibleOnly: true }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const relativeV4ApiUrl = absoluteV4ApiUrl.convertTo(RelativeV4ApiUrl)
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.absoluteV4ApiUrl(),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        expect(absoluteV4ApiUrl.convertTo(AbsoluteV4ApiUrl)).to.equal(absoluteV4ApiUrl)
      }
    )

    chaiProperty(
      'to relative v5 api url',
      arbitrary.absoluteV4ApiUrl({ apiCompatibleOnly: true }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const relativeV5ApiUrl = absoluteV4ApiUrl.convertTo(RelativeV5ApiUrl)
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(relativeV5ApiUrl.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with no api host and path given',
      arbitrary.absoluteV4ApiUrl({ apiCompatibleOnly: true }),
      ( id ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const absoluteV5ApiUrl = absoluteV4ApiUrl.convertTo(AbsoluteV5ApiUrl)
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl.apiHost).to.equal(absoluteV4ApiUrl.apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(absoluteV4ApiUrl.apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with explicit api host and path',
      arbitrary.absoluteV4ApiUrl({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, apiHost, apiPath ) => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        const absoluteV5ApiUrl = absoluteV4ApiUrl.convertTo(AbsoluteV5ApiUrl, { apiHost, apiPath })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(absoluteV4ApiUrl.recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(absoluteV4ApiUrl.recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(absoluteV4ApiUrl.campusCode)
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
        const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiHost, apiPath, recordTypeCode, recNum })
        const absoluteV4ApiUrlAsString = absoluteV4ApiUrl.toString()
        expect(absoluteV4ApiUrlAsString).to.be.a('string')
        expect(absoluteV4ApiUrlAsString).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        expect(absoluteV4ApiUrlAsString).to.equal(`https://${apiHost}${apiPath}v4/${apiRecordType}/${recNum}`)
        expect(absoluteV4ApiUrlAsString).to.equal(`${absoluteV4ApiUrl}`)
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
        const apiRecordType = RelativeV4ApiUrl.convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl({ apiHost, apiPath, recordTypeCode, recNum, campusCode})
        const absoluteV4ApiUrlAsString = absoluteV4ApiUrl.toString()
        expect(absoluteV4ApiUrlAsString).to.be.a('string')
        expect(absoluteV4ApiUrlAsString).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(absoluteV4ApiUrlAsString).to.equal(`https://${apiHost}${apiPath}v4/${apiRecordType}/${recNum}@${campusCode}`)
        expect(absoluteV4ApiUrlAsString).to.equal(`${absoluteV4ApiUrl}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns self for arbitrary absolute v4 api urls',
      arbitrary.absoluteV4ApiUrl(),
      id => {
        const absoluteV4ApiUrl = new AbsoluteV4ApiUrl(id)
        expect(absoluteV4ApiUrl.validate()).to.equal(absoluteV4ApiUrl)
        expect(() => new AbsoluteV4ApiUrl(id, { validate: true })).to.not.throw
      }
    )

  })

})
