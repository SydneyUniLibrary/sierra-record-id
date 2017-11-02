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
const { calcCheckDigit } = require('@sydneyunilibrary/sierra-record-check-digit')

const { convert, RecordIdForms } = require('.')
const { convertRecordTypeCharToApiRecordType, convertApiRecordTypeToRecordTypeChar } = require('./convert')
const { arbitrary, chaiProperty } = require('./test-support')

const { ALWAYS, NEVER, SOMETIMES } = arbitrary



describe('convert', function () {

  describe('from record number', function () {

    function unpack(id) {
      const re = /^([1-9]\d{5,6})(@[a-z0-9]{1,5})?$/
      expect(id).to.match(re)
      let match = re.exec(id)
      return {
        recNum: match[1],
        virtPart: match[2] || '',
      }
    }

    chaiProperty(
      'to record number',
      arbitrary.recordNumber(),
      id => {
        const recordNumber = convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.RECORD_NUMBER })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        expect(recordNumber).to.equal(id)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const weakRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.WEAK_RECORD_KEY, recordTypeChar })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recNum, virtPart } = unpack(id)
        expect(weakRecordKey).to.equal(`${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to weak record key with initial period',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const weakRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.WEAK_RECORD_KEY, recordTypeChar,
                          initialPeriod: true })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recNum, virtPart } = unpack(id)
        expect(weakRecordKey).to.equal(`.${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to strong record key for non-virtual records',
      arbitrary.recordNumber({ virtual: NEVER }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        const expectedCheckDigit = calcCheckDigit(id)
        expect(strongRecordKey).to.equal(`${recordTypeChar}${id}${expectedCheckDigit}`)
      }
    )

    chaiProperty(
      'to strong record key for virtual records',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
        const { recNum, virtPart } = unpack(id)
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to forced strong record key for virtual records',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar,
                          strongKeysForVirtualRecords: true })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
        const { recNum, virtPart } = unpack(id)
        const expectedCheckDigit = calcCheckDigit(recNum)
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${expectedCheckDigit}${virtPart}`)
      }
    )

    chaiProperty(
      'to strong record with initial period for non-virtual records',
      arbitrary.recordNumber({ virtual: NEVER}),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const strongRecordKey =
                 convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.STRONG_RECORD_KEY, recordTypeChar,
                           initialPeriod: true })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        const expectedCheckDigit = calcCheckDigit(id)
        expect(strongRecordKey).to.equal(`.${recordTypeChar}${id}${expectedCheckDigit}`)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.recordNumber({ virtual: NEVER }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const databaseId =
          convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.DATABASE_ID, recordTypeChar })
        expect(databaseId).to.be.a('string')
        expect(databaseId).to.match(/^\d+$/)
        const { recNum } = unpack(id)
        let databaseIdAsBigInt = BigInt(databaseId)
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF).toJSNumber()).to.equal(0)
        expect(String.fromCodePoint(databaseIdAsBigInt.shiftRight(32).and(0xFFFF).toJSNumber())).to.equal(recordTypeChar)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF).toString()).to.equal(recNum)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.recordNumber({ virtual: ALWAYS }),
      arbitrary.recordTypeChar(),
      ( id, recordTypeChar ) => {
        const fn =
          () => convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.DATABASE_ID, recordTypeChar })
        expect(fn).to.throw('Cannot use convert to convert to database ids for virtual records. Must use convertAsync instead')
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar({ apiCompatibleOnly: true }),
      ( id, recordTypeChar ) => {
        const relativeV4ApiUrl =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.RELATIVE_V4_API_URL, recordTypeChar })
        expect(relativeV4ApiUrl).to.be.a('string')
        expect(relativeV4ApiUrl).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recNum, virtPart } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(relativeV4ApiUrl).to.equal(`v4/${expectedRecordType}/${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar({ apiCompatibleOnly: true }),
      ( id, recordTypeChar ) => {
        const absoluteV4ApiUrl =
                convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.ABSOLUTE_V4_API_URL, recordTypeChar,
                          context: { sierraApiHost: 'some.library' } })
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recNum, virtPart } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(absoluteV4ApiUrl).to.equal(`https://some.library/iii/sierra-api/v4/${expectedRecordType}/${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url, throws if SIERRA_API_HOST is not set',
      arbitrary.recordNumber(),
      arbitrary.recordTypeChar({ apiCompatibleOnly: true }),
      ( id, recordTypeChar ) => {
        const fn =
          () => convert({ id, from: RecordIdForms.RECORD_NUMBER, to: RecordIdForms.ABSOLUTE_V4_API_URL, recordTypeChar })
        expect(fn).to.throw(/SIERRA_API_HOST must be set/i)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe('from weak record key', function () {

    function unpack(id) {
      const re = /^\.?([boicaprnveltj])([1-9]\d{5,6})(@[a-z0-9]{1,5})?$/
      expect(id).to.match(re)
      let match = re.exec(id)
      return {
        recordTypeChar: match[1],
        recNum: match[2],
        virtPart: match[3] || '',
      }
    }

    chaiProperty(
      'to record number',
      arbitrary.weakRecordKey(),
      id => {
        const recordNumber =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.RECORD_NUMBER })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recNum, virtPart } = unpack(id)
        expect(recordNumber).to.equal(`${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.weakRecordKey(),
      id => {
        const recordNumber =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.WEAK_RECORD_KEY })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        expect(recordNumber).to.equal(`${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to weak record key with initial period',
      arbitrary.weakRecordKey(),
      id => {
        const recordNumber =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.WEAK_RECORD_KEY, initialPeriod: true })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        expect(recordNumber).to.equal(`.${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to strong record key',
      arbitrary.weakRecordKey({ virtual: NEVER }),
      id => {
        const strongRecordKey =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.STRONG_RECORD_KEY })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        const expectedCheckDigit = calcCheckDigit(recNum)
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${expectedCheckDigit}${virtPart}`)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.weakRecordKey({ virtual: NEVER }),
      id => {
        const databaseId =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.DATABASE_ID })
        expect(databaseId).to.be.a('string')
        expect(databaseId).to.match(/^\d+$/)
        const { recordTypeChar, recNum } = unpack(id)
        let databaseIdAsBigInt = BigInt(databaseId)
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF).toJSNumber()).to.equal(0)
        expect(String.fromCodePoint(databaseIdAsBigInt.shiftRight(32).and(0xFFFF).toJSNumber())).to.equal(recordTypeChar)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF).toString()).to.equal(recNum)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.weakRecordKey({ virtual: ALWAYS }),
      id => {
        const fn =
          () => convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.DATABASE_ID })
        expect(fn).to.throw('Cannot use convert to convert to database ids for virtual records. Must use convertAsync instead')
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
      id => {
        const relativeV4ApiUrl =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.RELATIVE_V4_API_URL })
        expect(relativeV4ApiUrl).to.be.a('string')
        expect(relativeV4ApiUrl).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(relativeV4ApiUrl).to.equal(`v4/${expectedRecordType}/${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
      id => {
        const absoluteV4ApiUrl =
          convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.ABSOLUTE_V4_API_URL,
            context: { sierraApiHost: 'some.library' } })
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(absoluteV4ApiUrl).to.equal(`https://some.library/iii/sierra-api/v4/${expectedRecordType}/${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url, throws if SIERRA_API_HOST is not set',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
      id => {
        const fn =
          () => convert({ id, from: RecordIdForms.WEAK_RECORD_KEY, to: RecordIdForms.ABSOLUTE_V4_API_URL })
        expect(fn).to.throw(/SIERRA_API_HOST must be set/i)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe.skip('from strong record key', function () {

  })


  //---------------------------------------------------------------------------


  describe('from database id', function () {

    // Rule: Cannot use the convert function to convert from a database id for a virtual record.
    //       Must be the convertAsync function instead.
    //       So all the tests below are only for non-virtual record ids.

    function unpack(id) {
      expect(id).to.be.a('string')
      expect(id).to.match(/^\d+$/)
      const bigIntId = BigInt(id)
      return  {
        campusId: bigIntId.shiftRight(48).and(0xFFFF).toJSNumber(),
        recordTypeChar: String.fromCodePoint(bigIntId.shiftRight(32).and(0xFFFF).toJSNumber()),
        recNum: bigIntId.and(0xFFFFFFFF).toString()
      }
    }

    chaiProperty(
      'to record number',
      arbitrary.databaseId({ virtual: NEVER }),
      id => {
        const recordNumber =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.RECORD_NUMBER })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[1-9]\d{5,6}$/)
        const { recNum } = unpack(id)
        expect(recordNumber).to.equal(recNum)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.databaseId({ virtual: NEVER }),
      id => {
        const weakRecordKey =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.WEAK_RECORD_KEY })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}$/)
        const { recordTypeChar, recNum } = unpack(id)
        expect(weakRecordKey).to.equal(`${recordTypeChar}${recNum}`)
      }
    )

    chaiProperty(
      'to weak record key with initial period',
      arbitrary.databaseId({ virtual: NEVER }),
      id => {
        const weakRecordKey =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.WEAK_RECORD_KEY, initialPeriod: true })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}$/)
        const { recordTypeChar, recNum } = unpack(id)
        expect(weakRecordKey).to.equal(`.${recordTypeChar}${recNum}`)
      }
    )

    chaiProperty(
      'to strong record key',
      arbitrary.databaseId({ virtual: NEVER }),
      id => {
        const strongRecordKey =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.STRONG_RECORD_KEY })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        const { recordTypeChar, recNum } = unpack(id)
        const expectedCheckDigit = calcCheckDigit(recNum)
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${expectedCheckDigit}`)
      }
    )

    // database id -> database id is the exception to the rule
    chaiProperty(
      'to database id',
      arbitrary.databaseId(),
      id => {
        const databaseId =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.DATABASE_ID })
        expect(databaseId).to.be.a('string')
        expect(databaseId).to.match(/^\d+$/)
        expect(databaseId).to.equal(id)
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.databaseId({ virtual: NEVER, apiCompatibleOnly: true }),
      id => {
        const relativeV4ApiUrl =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.RELATIVE_V4_API_URL })
        expect(relativeV4ApiUrl).to.be.a('string')
        expect(relativeV4ApiUrl).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        const { recordTypeChar, recNum } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(relativeV4ApiUrl).to.equal(`v4/${expectedRecordType}/${recNum}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.databaseId({ virtual: NEVER, apiCompatibleOnly: true }),
      id => {
        const absoluteV4ApiUrl =
          convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.ABSOLUTE_V4_API_URL, context: { sierraApiHost: 'some.library' } })
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
        const { recordTypeChar, recNum } = unpack(id)
        const expectedRecordType = convertRecordTypeCharToApiRecordType(recordTypeChar)
        expect(absoluteV4ApiUrl).to.equal(`https://some.library/iii/sierra-api/v4/${expectedRecordType}/${recNum}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url, throws if SIERRA_API_HOST is not set',
      arbitrary.databaseId({ virtual: NEVER, apiCompatibleOnly: true }),
      id => {
        const fn = () => convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.ABSOLUTE_V4_API_URL })
        expect(fn).to.throw(/SIERRA_API_HOST must be set/i)
      }
    )

    chaiProperty(
      'throws for virtual records',
      arbitrary.databaseId({ virtual: ALWAYS, apiCompatibleOnly: true }),
      id => {
        expect(() => convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.RECORD_NUMBER })).
          to.throw('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
        expect(() => convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.WEAK_RECORD_KEY })).
          to.throw('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
        expect(() => convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.STRONG_RECORD_KEY })).
          to.throw('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
        // database id -> database id is the exception to the rule
        expect(() => convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.RELATIVE_V4_API_URL })).
          to.throw('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
        expect(() => convert({ id, from: RecordIdForms.DATABASE_ID, to: RecordIdForms.ABSOLUTE_V4_API_URL })).
          to.throw('Cannot use convert to convert from database ids for virtual records. Must use convertAsync instead')
      }
    )

  })


  //---------------------------------------------------------------------------


  describe('from relative v4 api url', function () {

    function unpack(id) {
      const re = /^v4\/(authorities|bibs|invoices|items|orders|patrons)\/([1-9]\d{5,6})(@[a-z0-9]{1,5})?$/
      expect(id).to.match(re)
      const match = re.exec(id)
      return {
        recordTypeChar: convertApiRecordTypeToRecordTypeChar(match[1]),
        recNum: match[2],
        virtPart: match[3] || '',
      }
    }

    chaiProperty(
      'to record number',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const recordNumber =
          convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.RECORD_NUMBER })
        expect(recordNumber).to.be.a('string')
        expect(recordNumber).to.match(/^[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recNum, virtPart } = unpack(id)
        expect(recordNumber).to.equal(`${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to weak record key',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const weakRecordKey =
          convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.WEAK_RECORD_KEY })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        expect(weakRecordKey).to.equal(`${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to weak record key with initial period',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const weakRecordKey =
          convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.WEAK_RECORD_KEY, initialPeriod: true })
        expect(weakRecordKey).to.be.a('string')
        expect(weakRecordKey).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        const { recordTypeChar, recNum, virtPart } = unpack(id)
        expect(weakRecordKey).to.equal(`.${recordTypeChar}${recNum}${virtPart}`)
      }
    )

    chaiProperty(
      'to strong record key',
      arbitrary.relativeV4ApiUrl({ virtual: NEVER }),
      id => {
        const strongRecordKey =
          convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.STRONG_RECORD_KEY })
        expect(strongRecordKey).to.be.a('string')
        expect(strongRecordKey).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
        const { recordTypeChar, recNum } = unpack(id)
        const expectedCheckDigit = calcCheckDigit(recNum)
        expect(strongRecordKey).to.equal(`${recordTypeChar}${recNum}${expectedCheckDigit}`)
      }
    )

    chaiProperty(
      'to database id',
      arbitrary.relativeV4ApiUrl({ virtual: NEVER }),
      id => {
        const databaseId =
          convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.DATABASE_ID })
        expect(databaseId).to.be.a('string')
        expect(databaseId).to.match(/^\d+$/)
        const { recordTypeChar, recNum } = unpack(id)
        let databaseIdAsBigInt = BigInt(databaseId)
        expect(databaseIdAsBigInt.shiftRight(48).and(0xFFFF).toJSNumber()).to.equal(0)
        expect(String.fromCodePoint(databaseIdAsBigInt.shiftRight(32).and(0xFFFF).toJSNumber())).to.equal(recordTypeChar)
        expect(databaseIdAsBigInt.and(0xFFFFFFFF).toString()).to.equal(recNum)
      }
    )

    chaiProperty(
      'to database id, throws for virtual records',
      arbitrary.relativeV4ApiUrl({ virtual: ALWAYS }),
      id => {
        const fn =
          () => convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.DATABASE_ID })
        expect(fn).to.throw('Cannot use convert to convert to database ids for virtual records. Must use convertAsync instead')
      }
    )

    chaiProperty(
      'to relative v4 api url',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const relativeV4ApiUrl =
                convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.RELATIVE_V4_API_URL })
        expect(relativeV4ApiUrl).to.equal(id)
      }
    )

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const absoluteV4ApiUrl =
          convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.ABSOLUTE_V4_API_URL,
            context: { sierraApiHost: 'some.library' } })
        expect(absoluteV4ApiUrl).to.be.a('string')
        expect(absoluteV4ApiUrl).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
        expect(absoluteV4ApiUrl).to.equal(`https://some.library/iii/sierra-api/${id}`)
      }
    )

    chaiProperty(
      'to absolute v4 api url, throws if SIERRA_API_HOST is not set',
      arbitrary.relativeV4ApiUrl(),
      id => {
        const fn =
          () => convert({ id, from: RecordIdForms.RELATIVE_V4_API_URL, to: RecordIdForms.ABSOLUTE_V4_API_URL })
        expect(fn).to.throw(/SIERRA_API_HOST must be set/i)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe('from absolute v4 api url', function () {

    chaiProperty(
      'to absolute v4 api url',
      arbitrary.absoluteV4ApiUrl(),
      id => {
        const absoluteV4ApiUrl =
                convert({ id, from: RecordIdForms.ABSOLUTE_V4_API_URL, to: RecordIdForms.ABSOLUTE_V4_API_URL })
        expect(() => new URL(id)).to.not.throw()
        expect(absoluteV4ApiUrl).to.equal(id)
      }
    )

  })

})
