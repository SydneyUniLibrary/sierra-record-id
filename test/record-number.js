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


describe('RecordNumber', function () {

  it('has a Symbol.toStringTag getter', function () {
    let id = jsv.sampler(arbitrary.recordNumber())(1)[0]
    expect(new RecordNumber(id)[Symbol.toStringTag]).to.equal('RecordNumber')
  })


  describe('constructor', function() {

    chaiProperty(
      'builds from non-virtual record parts',
      arbitrary.recNum(),
      recNum => {
        const recordNumber = new RecordNumber({ recNum })
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber).to.be.instanceOf(RecordNumber)
        expect(recordNumber).to.be.instanceOf(RecordId)
        expect(recordNumber.recNum).to.equal(recNum)
        expect(recordNumber.campusCode).to.be.null
      }
    )

    chaiProperty(
      'builds from virtual record parts',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode ) => {
        const recordNumber = new RecordNumber({ recNum, campusCode })
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber).to.be.instanceOf(RecordNumber)
        expect(recordNumber).to.be.instanceOf(RecordId)
        expect(recordNumber.recNum).to.equal(recNum)
        expect(recordNumber.campusCode).to.equal(campusCode)
      }
    )

    chaiProperty(
      'parses arbitrary record numbers',
      arbitrary.recordNumber(),
      recordNumberAsString => {
        const recordNumber = new RecordNumber(recordNumberAsString)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber).to.be.instanceOf(RecordNumber)
        expect(recordNumber).to.be.instanceOf(RecordId)
        expect(recordNumber.toString()).to.equal(recordNumberAsString)
      }
    )

    chaiProperty(
      'parses arbitrary record numbers with leading/trailing whitespace',
      arbitrary.recordNumber(),
      arbitrary.whitespaceString(),
      arbitrary.whitespaceString(),
      ( recordNumberAsString, foreSpaces, aftSpaces ) => {
        const recordNumber = new RecordNumber(`${foreSpaces}${recordNumberAsString}${aftSpaces}`)
        expect(recordNumber).to.be.a('RecordNumber')
        expect(recordNumber).to.be.instanceOf(RecordNumber)
        expect(recordNumber).to.be.instanceOf(RecordId)
        expect(recordNumber.toString()).to.equal(recordNumberAsString)
      }
    )


    chaiProperty(
      'throws for anything else',
      jsv.oneof([
        arbitrary.weakRecordKey(), arbitrary.strongRecordKey(), arbitrary.databaseId(),
        arbitrary.relativeV4ApiUrl(), arbitrary.absoluteV4ApiUrl(), arbitrary.COMPLETELY_INVALID_ID,
      ]),
      id => {
        expect(() => new RecordNumber(id)).to.throw(/cannot construct|cannot parse/i)
      }
    )

    chaiProperty(
      'throws if recNum part is missing',
      arbitrary.CAMPUS_CODE,
      campusCode => {
        expect(() => new RecordNumber({ campusCode })).to.throw(/cannot construct/i)
      }
    )

  })


  describe('convertTo', function () {

    chaiProperty(
      'to record number',
      arbitrary.recordNumber(),
      id => {
        const recordNumber = new RecordNumber(id)
        expect(recordNumber.convertTo(RecordNumber)).to.equal(recordNumber)
      }
    )

    chaiProperty(
      'to weak record key, without initial period by default',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode(),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const weakRecordKey = recordNumber.convertTo(WeakRecordKey, { recordTypeCode })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(recordNumber.recNum)
        expect(weakRecordKey.campusCode).to.equal(recordNumber.campusCode)
        expect(weakRecordKey.toString()).to.equal(
          recordNumber.convertTo(WeakRecordKey, { recordTypeCode, initialPeriod: false }).toString()
        )
      }
    )

    chaiProperty(
      'throws when to weak record key without being given a record type code',
      arbitrary.recordNumber(),
      ( id ) => {
        const recordNumber = new RecordNumber(id)
        expect(() => recordNumber.convertTo(WeakRecordKey)).to.throw(/recordTypeCode option is required/i)
      }
    )

    chaiProperty(
      'to weak record key, with initial period option',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode(),
      jsv.bool,
      ( id, recordTypeCode, initialPeriod ) => {
        const recordNumber = new RecordNumber(id)
        const weakRecordKey = recordNumber.convertTo(WeakRecordKey, { recordTypeCode, initialPeriod })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.equal(initialPeriod)
        expect(weakRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(recordNumber.recNum)
        expect(weakRecordKey.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.recordNumber({ virtual: NEVER }),
      arbitrary.recordTypeCode(),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const strongRecordKey = recordNumber.convertTo(StrongRecordKey, { recordTypeCode })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(recordNumber.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(recordNumber.recNum))
        expect(strongRecordKey.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, actually converts to a weak key',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeCode(),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const weakRecordKey = recordNumber.convertTo(StrongRecordKey, { recordTypeCode })
        expect(weakRecordKey).to.be.a('WeakRecordKey')
        expect(weakRecordKey.initialPeriod).to.be.false
        expect(weakRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(weakRecordKey.recNum).to.equal(recordNumber.recNum)
        expect(weakRecordKey.checkDigit).to.be.undefined
        expect(weakRecordKey.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to strong record key for virtual records, forced to be a strong key',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode(),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const strongRecordKey = recordNumber.convertTo(StrongRecordKey, { recordTypeCode, strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.be.false
        expect(strongRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(recordNumber.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(recordNumber.recNum))
        expect(strongRecordKey.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to strong record for non-virtual records, with initial period option',
      arbitrary.recordNumber({ virtual: NEVER}),
      arbitrary.recordTypeCode(),
      jsv.bool,
      ( id, recordTypeCode, initialPeriod ) => {
        const recordNumber = new RecordNumber(id)
        const strongRecordKey = recordNumber.convertTo(StrongRecordKey, { recordTypeCode, initialPeriod })
        expect(strongRecordKey).to.be.a('StrongRecordKey')
        expect(strongRecordKey.initialPeriod).to.equal(initialPeriod)
        expect(strongRecordKey.recordTypeCode).to.equal(recordTypeCode)
        expect(strongRecordKey.recNum).to.equal(recordNumber.recNum)
        expect(strongRecordKey.checkDigit).to.equal(calcCheckDigit(recordNumber.recNum))
        expect(strongRecordKey.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.recordNumber({ virtual: NEVER }),
      arbitrary.recordTypeCode(),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const databaseId = recordNumber.convertTo(DatabaseId, { recordTypeCode })
        expect(databaseId).to.be.a('DatabaseId')
        expect(databaseId.recordTypeCode).to.equal(recordTypeCode)
        expect(databaseId.recNum).to.equal(recordNumber.recNum)
        expect(databaseId.campusId).to.equal(0)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeCode(),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        expect(() => recordNumber.convertTo(DatabaseId, { recordTypeCode })).to.throw(
          /cannot use convertTo to convert virtual records ids to database ids/i
        )
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const relativeV4ApiUrl = recordNumber.convertTo(RelativeV4ApiUrl, { recordTypeCode })
        expect(relativeV4ApiUrl).to.be.a('RelativeV4ApiUrl')
        expect(relativeV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(relativeV4ApiUrl.recNum).to.equal(recordNumber.recNum)
        expect(relativeV4ApiUrl.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with explicit api host and path',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, recordTypeCode, apiHost, apiPath ) => {
        const recordNumber = new RecordNumber(id)
        const absoluteV4ApiUrl = recordNumber.convertTo(AbsoluteV4ApiUrl, { recordTypeCode, apiHost, apiPath })
        expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
        expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV4ApiUrl.recNum).to.equal(recordNumber.recNum)
        expect(absoluteV4ApiUrl.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to absolute v4 api url, with api host and path from process env',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, recordTypeCode, apiHost, apiPath ) => {
        let sandbox = sinon.createSandbox()
        try {
          sandbox.stub(process, 'env').value({
            ...process.env,
            'SIERRA_API_HOST': apiHost,
            'SIERRA_API_PATH': apiPath
          })
          const recordNumber = new RecordNumber(id)
          const absoluteV4ApiUrl = recordNumber.convertTo(AbsoluteV4ApiUrl, { recordTypeCode })
          expect(absoluteV4ApiUrl).to.be.a('AbsoluteV4ApiUrl')
          expect(absoluteV4ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV4ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV4ApiUrl.recordTypeCode).to.equal(recordTypeCode)
          expect(absoluteV4ApiUrl.recNum).to.equal(recordNumber.recNum)
          expect(absoluteV4ApiUrl.campusCode).to.equal(recordNumber.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

    chaiProperty(
      'to relative v5 api url',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      ( id, recordTypeCode ) => {
        const recordNumber = new RecordNumber(id)
        const relativeV5ApiUrl = recordNumber.convertTo(RelativeV5ApiUrl, { recordTypeCode })
        expect(relativeV5ApiUrl).to.be.a('RelativeV5ApiUrl')
        expect(relativeV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(relativeV5ApiUrl.recNum).to.equal(recordNumber.recNum)
        expect(relativeV5ApiUrl.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with explicit api host and path',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, recordTypeCode, apiHost, apiPath ) => {
        const recordNumber = new RecordNumber(id)
        const absoluteV5ApiUrl = recordNumber.convertTo(AbsoluteV5ApiUrl, { recordTypeCode, apiHost, apiPath })
        expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
        expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
        expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
        expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
        expect(absoluteV5ApiUrl.recNum).to.equal(recordNumber.recNum)
        expect(absoluteV5ApiUrl.campusCode).to.equal(recordNumber.campusCode)
      }
    )

    chaiProperty(
      'to absolute v5 api url, with api host and path from process env',
      arbitrary.recordNumber(),
      arbitrary.recordTypeCode({ apiCompatibleOnly: true }),
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      ( id, recordTypeCode, apiHost, apiPath ) => {
        let sandbox = sinon.createSandbox()
        try {
          sandbox.stub(process, 'env').value({
            ...process.env,
            'SIERRA_API_HOST': apiHost,
            'SIERRA_API_PATH': apiPath
          })
          const recordNumber = new RecordNumber(id)
          const absoluteV5ApiUrl = recordNumber.convertTo(AbsoluteV5ApiUrl, { recordTypeCode })
          expect(absoluteV5ApiUrl).to.be.a('AbsoluteV5ApiUrl')
          expect(absoluteV5ApiUrl.apiHost).to.equal(apiHost)
          expect(absoluteV5ApiUrl.apiPath).to.equal(apiPath)
          expect(absoluteV5ApiUrl.recordTypeCode).to.equal(recordTypeCode)
          expect(absoluteV5ApiUrl.recNum).to.equal(recordNumber.recNum)
          expect(absoluteV5ApiUrl.campusCode).to.equal(recordNumber.campusCode)
        } finally {
          sandbox.restore()
        }
      }
    )

  })


  describe('toString', function () {

    chaiProperty(
      'for non-virtual records',
      arbitrary.recNum(),
      recNum => {

        const recordNumber = new RecordNumber({ recNum })
        const recordNumberString = recordNumber.toString()
        expect(recordNumberString).to.be.a('string')
        expect(recordNumberString).to.match(/^[1-9]\d{5,6}$/)
        expect(recordNumberString).to.equal(recNum)
        expect(recordNumberString).to.equal(recNum)
        expect(recordNumberString).to.equal(`${recordNumber}`)
      }
    )

    chaiProperty(
      'for virtual records',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode ) => {
        const recordNumber = new RecordNumber({ recNum, campusCode })
        const recordNumberString = recordNumber.toString()
        expect(recordNumberString).to.be.a('string')
        expect(recordNumberString).to.match(/^[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(recordNumberString).to.equal(`${recNum}@${campusCode}`)
        expect(recordNumberString).to.equal(`${recordNumber}`)
      }
    )

  })


  describe('validate', function () {

    chaiProperty(
      'returns this for arbitrary record numbers',
      arbitrary.recordNumber(),
      id => {
        const recordNumber = new RecordNumber(id)
        expect(recordNumber.validate()).to.equal(recordNumber)
      }
    )

    chaiProperty(
      'throws for invalid rec nums',
      arbitrary.INVALID_REC_NUM,
      invalidRecNum => {
        const recordNumber = new RecordNumber({ recNum: invalidRecNum })
        expect(() => recordNumber.validate()).to.throw(/recNum part is out of range/i)
        expect(() => new RecordNumber({ recNum: invalidRecNum }, { validate: true })).to.throw(/recNum part is out of range/i)
      }
    )

  })

})
