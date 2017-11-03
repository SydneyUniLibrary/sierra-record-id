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
const chai = require('chai')
const expect = chai.expect
const jsv = require('jsverify')
const { URL } = require('url')

const { convertRecordTypeCodeToApiRecordType } = require('.')
const { arbitrary, chaiProperty } = require('./test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary

const { make } = require('.')


describe('make', function () {

  describe('recordNumber', function () {

    chaiProperty(
      'makes non-virtual record numbers',
      arbitrary.recNum(),
      recNum => {
        const recordNumber = make.recordNumber({ recNum })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[1-9]\d{5,6}$/)
        expect(recordNumber).to.equal(recNum)
      }
    )

    chaiProperty(
      'makes virtual record numbers',
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recNum, campusCode ) => {
        const recordNumber = make.recordNumber({ recNum, campusCode })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(recordNumber).to.equal(`${recNum}@${campusCode}`)
      }
    )

  })


  describe('weakRecordKey', function () {

    chaiProperty(
      'makes non-virtual record number, without an initial period by default',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const weakRecordKey = make.weakRecordKey({ recordTypeCode, recNum })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}$/)
        expect(weakRecordKey).to.equal(`${recordTypeCode}${recNum}`)
        expect(weakRecordKey).to.equal(
          make.weakRecordKey({ recordTypeCode, recNum, initialPeriod: false })
        )
      }
    )

    chaiProperty(
      'makes virtual record number, without an initial period by default',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = make.weakRecordKey({ recordTypeCode, recNum, campusCode })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(weakRecordKey).to.equal(`${recordTypeCode}${recNum}@${campusCode}`)
        expect(weakRecordKey).to.equal(
          make.weakRecordKey({ recordTypeCode, recNum, campusCode, initialPeriod: false })
        )
      }
    )

    chaiProperty(
      'makes non-virtual record number, with an initial period when told to',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const weakRecordKey = make.weakRecordKey({ recordTypeCode, recNum, initialPeriod: true })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}$/)
        expect(weakRecordKey).to.equal(`.${recordTypeCode}${recNum}`)
      }
    )

    chaiProperty(
      'makes virtual record number, with an initial period when told to',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const weakRecordKey = make.weakRecordKey({ recordTypeCode, recNum, campusCode, initialPeriod: true })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(weakRecordKey).to.equal(`.${recordTypeCode}${recNum}@${campusCode}`)
      }
    )

  })


  describe('strongRecordKey', function () {

    chaiProperty(
      'makes non-virtual record number, without an initial period by default',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      ( recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = (
          make.strongRecordKey({ recordTypeCode, recNum, checkDigit })
        )
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        expect(strongRecordKey).to.equal(`${recordTypeCode}${recNum}${checkDigit}`)
        expect(strongRecordKey).to.equal(
          make.strongRecordKey({ recordTypeCode, recNum, checkDigit, initialPeriod: false })
        )
      }
    )

    chaiProperty(
      'makes virtual record number, without an initial period by default',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey = (
          make.strongRecordKey({ recordTypeCode, recNum, checkDigit, campusCode })
        )
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        expect(strongRecordKey).to.equal(`${recordTypeCode}${recNum}${checkDigit}@${campusCode}`)
        expect(strongRecordKey).to.equal(
          make.strongRecordKey({ recordTypeCode, recNum, checkDigit, campusCode, initialPeriod: false })
        )
      }
    )

    chaiProperty(
      'makes non-virtual record number, with an initial period when told to',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      ( recordTypeCode, recNum, checkDigit ) => {
        const strongRecordKey = (
          make.strongRecordKey({ recordTypeCode, recNum, checkDigit, initialPeriod: true })
        )
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        expect(strongRecordKey).to.equal(`.${recordTypeCode}${recNum}${checkDigit}`)
      }
    )

    chaiProperty(
      'makes virtual record number, with an initial period when told to',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CHECK_DIGIT,
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, checkDigit, campusCode ) => {
        const strongRecordKey = (
          make.strongRecordKey({ recordTypeCode, recNum, checkDigit, campusCode, initialPeriod: true })
        )
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        expect(strongRecordKey).to.equal(`.${recordTypeCode}${recNum}${checkDigit}@${campusCode}`)
      }
    )

  })


  describe('databaseId', function () {

    chaiProperty(
      'makes database ids for non-virtual record numbers',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const databaseId = make.databaseId({ recordTypeCode, recNum })
        expect(databaseId).to.be.a('string')
        expect(databaseId).to.match(/^\d{12,20}$/)
        const databaseIdAsBigInt = BigInt(databaseId)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF)).to.eql(BigInt(recNum))
        expect(databaseIdAsBigInt.shiftRight(32).and(0xFFFF)).to.eql(BigInt(recordTypeCode.codePointAt(0)))
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF)).to.eql(BigInt.zero)
      }
    )

    chaiProperty(
      'makes database ids for virtual record numbers',
      arbitrary.ALL_RECORD_TYPE_CODE,
      arbitrary.recNum(),
      jsv.integer(1, 0xFFFF),
      ( recordTypeCode, recNum, campusId ) => {
        const databaseId = make.databaseId({ recordTypeCode, recNum, campusId })
        expect(databaseId).to.be.a('string')
        expect(databaseId).to.match(/^\d{12,20}$/)
        const databaseIdAsBigInt = BigInt(databaseId)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF)).to.eql(BigInt(recNum))
        expect(databaseIdAsBigInt.shiftRight(32).and(0xFFFF)).to.eql(BigInt(recordTypeCode.codePointAt(0)))
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF)).to.eql(BigInt(campusId))
      }
    )

  })


  describe('relative v4 api url', function () {

    chaiProperty(
      'makes relative v4 api urls for non-virtual record numbers',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( recordTypeCode, recNum ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make.relativeV4ApiUrl({ apiRecordType, recNum })
        expect(relativeV4ApiUrl).to.be.a('string')
        expect(relativeV4ApiUrl).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        expect(relativeV4ApiUrl).to.equal(`v4/${apiRecordType}/${recNum}`)
      }
    )

    chaiProperty(
      'makes relative v4 api urls for virtual record numbers',
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( recordTypeCode, recNum, campusCode ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const relativeV4ApiUrl = make.relativeV4ApiUrl({ apiRecordType, recNum, campusCode })
        expect(relativeV4ApiUrl).to.be.a('string')
        expect(relativeV4ApiUrl).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(relativeV4ApiUrl).to.equal(`v4/${apiRecordType}/${recNum}@${campusCode}`)
      }
    )

  })

  describe('absolute v4 api url', function () {

    chaiProperty(
      'makes absolute v4 api urls for non-virtual record numbers',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      ( apiHost, apiPath, recordTypeCode, recNum ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = make.absoluteV4ApiUrl({ apiHost, apiPath, apiRecordType, recNum })
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        expect(absoluteV4ApiUrl).to.equal(`https://${apiHost}${apiPath}v4/${apiRecordType}/${recNum}`)
      }
    )

    chaiProperty(
      'makes absolute v4 api urls for virtual record numbers',
      arbitrary.API_HOST,
      arbitrary.API_PATH,
      arbitrary.API_COMPATIBLE_TYPE_CODE,
      arbitrary.recNum(),
      arbitrary.CAMPUS_CODE,
      ( apiHost, apiPath, recordTypeCode, recNum, campusCode ) => {
        const apiRecordType = convertRecordTypeCodeToApiRecordType(recordTypeCode)
        const absoluteV4ApiUrl = make.absoluteV4ApiUrl({ apiHost, apiPath, apiRecordType, recNum, campusCode })
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        expect(absoluteV4ApiUrl).to.equal(`https://${apiHost}${apiPath}v4/${apiRecordType}/${recNum}@${campusCode}`)
      }
    )

  })

})
