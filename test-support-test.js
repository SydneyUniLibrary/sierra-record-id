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

const { arbitrary, chaiProperty } = require('./test-support')


chai.use(require('chai-string'))


describe('test-support arbitrary', function () {

  describe('recordNumber', function () {

    chaiProperty(
      'defaults',
      arbitrary.recordNumber(),
      id => expect(id).to.match(/^[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'virtual never',
      arbitrary.recordNumber({ virtual: arbitrary.NEVER }),
      id => expect(id).to.match(/^[1-9]\d{5,6}$/)
    )

    chaiProperty(
      'virtual always',
      arbitrary.recordNumber({ virtual: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
    )

    chaiProperty(
      'virtual sometimes',
      arbitrary.recordNumber({ virtual: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 6',
      arbitrary.recordNumber({ size: 6 }),
      id => expect(id).to.match(/^[1-9]\d{5}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 6, virtual never',
      arbitrary.recordNumber({ size: 6, virtual: arbitrary.NEVER }),
      id => expect(id).to.match(/^[1-9]\d{5}$/)
    )

    chaiProperty(
      'size 6, virtual always',
      arbitrary.recordNumber({ size: 6, virtual: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^[1-9]\d{5}@[a-z0-9]{1,5}$/)
    )

    chaiProperty(
      'size 6, virtual sometimes',
      arbitrary.recordNumber({ size: 6, virtual: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^[1-9]\d{5}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 7',
      arbitrary.recordNumber({ size: 7 }),
      id => expect(id).to.match(/^[1-9]\d{6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 7, virtual never',
      arbitrary.recordNumber({ size: 7, virtual: arbitrary.NEVER }),
      id => expect(id).to.match(/^[1-9]\d{6}$/)
    )

    chaiProperty(
      'size 7, virtual always',
      arbitrary.recordNumber({ size: 7, virtual: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^[1-9]\d{6}@[a-z0-9]{1,5}$/)
    )

    chaiProperty(
      'size 7, virtual sometimes',
      arbitrary.recordNumber({ size: 7, virtual: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^[1-9]\d{6}(@[a-z0-9]{1,5})?$/)
    )

  })


  //---------------------------------------------------------------------------


  describe('weakRecordKey', function () {

    chaiProperty(
      'defaults',
      arbitrary.weakRecordKey(),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'virtual never',
      arbitrary.weakRecordKey({ virtual: arbitrary.NEVER }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}$/)
    )

    chaiProperty(
      'virtual always',
      arbitrary.weakRecordKey({ virtual: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}@[a-z0-9]{1,5}$/)
    )

    chaiProperty(
      'virtual sometimes',
      arbitrary.weakRecordKey({ virtual: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 6',
      arbitrary.weakRecordKey({ size: 6 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 7',
      arbitrary.weakRecordKey({ size: 7 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'initial period always',
      arbitrary.weakRecordKey({ initialPeriod: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'initial period never',
      arbitrary.weakRecordKey({ initialPeriod: arbitrary.NEVER }),
      id => expect(id).to.match(/^[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'initial period sometimes',
      arbitrary.weakRecordKey({ initialPeriod: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous always',
      arbitrary.weakRecordKey({ ambiguous: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous never',
      arbitrary.weakRecordKey({ ambiguous: arbitrary.NEVER }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous sometimes',
      arbitrary.weakRecordKey({ ambiguous: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'api compatible only',
      arbitrary.weakRecordKey({ apiCompatibleOnly: true }),
      id => expect(id).to.match(/^\.?[abniop][1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

  })


  //---------------------------------------------------------------------------


  describe('strongRecordKey', function () {

    chaiProperty(
      'defaults',
      arbitrary.strongRecordKey(),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 6',
      arbitrary.strongRecordKey({ size: 6 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 7',
      arbitrary.strongRecordKey({ size: 7 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous always',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}[0-9](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous never',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.NEVER }),
      id => expect(id).to.match(/^\.?[boicaprnveltj]([1-9]\d{5}x|[1-9]\d{6}[0-9x])(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous sometimes',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous always, size 6',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.ALWAYS, size: 6 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}[0-9](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous never, size 6',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.NEVER, size: 6 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}x(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous sometimes, size 6',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.SOMETIMES, size: 6 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    it('ambiguous always, size 7', function () {
      expect(() => arbitrary.strongRecordKey({ ambiguous: arbitrary.ALWAYS, size: 7 })).
        to.throw(/Ambiguous 7 digit strong record keys are impossible/i)
    })

    chaiProperty(
      'ambiguous never, size 7',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.NEVER, size: 7 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'ambiguous sometimes, size 7',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.SOMETIMES, size: 7 }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'virtual never',
      arbitrary.strongRecordKey({ virtual: arbitrary.NEVER }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x]$/)
    )

    chaiProperty(
      'virtual always',
      arbitrary.strongRecordKey({ virtual: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x]@[a-z0-9]{1,5}$/)
    )

    chaiProperty(
      'virtual sometimes',
      arbitrary.strongRecordKey({ virtual: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'initial period always',
      arbitrary.strongRecordKey({ initialPeriod: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^\.[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'initial period never',
      arbitrary.strongRecordKey({ initialPeriod: arbitrary.NEVER }),
      id => expect(id).to.match(/^[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'initial period sometimes',
      arbitrary.strongRecordKey({ initialPeriod: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^\.?[boicaprnveltj][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )


    chaiProperty(
      'api compatible only',
      arbitrary.strongRecordKey({ apiCompatibleOnly: true }),
      id => expect(id).to.match(/^\.?[abniop][1-9]\d{5,6}[0-9x](@[a-z0-9]{1,5})?$/)
    )

  })


  //---------------------------------------------------------------------------


  describe('databaseId', function () {

    function unpack(id) {
      expect(id).to.be.a('string')
      const bigIntId = BigInt(id)
      return {
        campusId: bigIntId.shiftRight(48).and(0xFFFF).toJSNumber(),
        recordTypeCode: String.fromCodePoint(bigIntId.shiftRight(32).and(0xFFFF).toJSNumber()),
        recNum: bigIntId.and(0xFFFFFFFF).toJSNumber()
      }
    }

    chaiProperty(
      'defaults',
      arbitrary.databaseId(),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.be.within(0, 0xFFFF)
        expect(recordTypeCode).to.match(/^[boicaprnveltj]$/)
        expect(recNum).to.be.within(100000, 9999999)
      }
    )

    chaiProperty(
      'virtual never',
      arbitrary.databaseId({ virtual: arbitrary.NEVER }),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.equal(0)
        expect(recordTypeCode).to.match(/^[boicaprnveltj]$/)
        expect(recNum).to.be.within(100000, 9999999)
      }
    )

    chaiProperty(
      'virtual always',
      arbitrary.databaseId({ virtual: arbitrary.ALWAYS }),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.be.within(1, 0xFFFF)
        expect(recordTypeCode).to.match(/^[boicaprnveltj]$/)
        expect(recNum).to.be.within(100000, 9999999)
      }
    )

    chaiProperty(
      'virtual sometimes',
      arbitrary.databaseId({ virtual: arbitrary.SOMETIMES }),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.be.within(0, 0xFFFF)
        expect(recordTypeCode).to.match(/^[boicaprnveltj]$/)
        expect(recNum).to.be.within(100000, 9999999)
      }
    )

    chaiProperty(
      'size 6',
      arbitrary.databaseId({ size: 6 }),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.be.within(0, 0xFFFF)
        expect(recordTypeCode).to.match(/^[boicaprnveltj]$/)
        expect(recNum).to.be.within(100000, 999999)
      }
    )

    chaiProperty(
      'size 7',
      arbitrary.databaseId({ size: 7 }),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.be.within(0, 0xFFFF)
        expect(recordTypeCode).to.match(/^[boicaprnveltj]$/)
        expect(recNum).to.be.within(1000000, 9999999)
      }
    )

    chaiProperty(
      'api compatible only',
      arbitrary.databaseId({ apiCompatibleOnly: true }),
      id => {
        const { campusId, recordTypeCode, recNum  } = unpack(id)
        expect(campusId).to.be.within(0, 0xFFFF)
        expect(recordTypeCode).to.match(/^[abniop]$/)
        expect(recNum).to.be.within(100000, 9999999)
      }
    )

  })


  //---------------------------------------------------------------------------


  describe('relativeV4ApiUrl', function () {

    chaiProperty(
      'defaults',
      arbitrary.relativeV4ApiUrl(),
      id => expect(id).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'virtual never',
      arbitrary.relativeV4ApiUrl({ virtual: arbitrary.NEVER }),
      id => expect(id).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
    )

    chaiProperty(
      'virtual always',
      arbitrary.relativeV4ApiUrl({ virtual: arbitrary.ALWAYS }),
      id => expect(id).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
    )

    chaiProperty(
      'virtual sometimes',
      arbitrary.relativeV4ApiUrl({ virtual: arbitrary.SOMETIMES }),
      id => expect(id).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 6',
      arbitrary.relativeV4ApiUrl({ size: 6 }),
      id => expect(id).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5}(@[a-z0-9]{1,5})?$/)
    )

    chaiProperty(
      'size 7',
      arbitrary.relativeV4ApiUrl({ size: 7 }),
      id => expect(id).to.match(/^v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{6}(@[a-z0-9]{1,5})?$/)
    )

  })


  //---------------------------------------------------------------------------


  describe('absoluteV4ApiUrl', function () {

    chaiProperty(
      'defaults',
      arbitrary.absoluteV4ApiUrl(),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
      }
    )

    chaiProperty(
      'virtual never',
      arbitrary.absoluteV4ApiUrl({ virtual: arbitrary.NEVER }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}$/)
      }
    )

    chaiProperty(
      'virtual always',
      arbitrary.absoluteV4ApiUrl({ virtual: arbitrary.ALWAYS }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}@[a-z0-9]{1,5}$/)
      }
    )

    chaiProperty(
      'virtual sometimes',
      arbitrary.absoluteV4ApiUrl({ virtual: arbitrary.SOMETIMES }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
      }
    )

    chaiProperty(
      'size 6',
      arbitrary.absoluteV4ApiUrl({ size: 6 }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5}(@[a-z0-9]{1,5})?$/)
      }
    )

    chaiProperty(
      'size 7',
      arbitrary.absoluteV4ApiUrl({ size: 7 }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{6}(@[a-z0-9]{1,5})?$/)
      }
    )

    chaiProperty(
      'explicit api host',
      arbitrary.absoluteV4ApiUrl({ sierraApiHost: 'some.library' }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/some\.library\/[-/%._~!$&'()*+,;=:@a-zA-Z0-9]+\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
      }
    )

    chaiProperty(
      'explicit api path',
      arbitrary.absoluteV4ApiUrl({ sierraApiPath: '/test/sierra-api-beta/' }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/[-%._~!$&'()*+,;=a-zA-Z0-9]+\/test\/sierra-api-beta\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
      }
    )

    chaiProperty(
      'explicit host and api path',
      arbitrary.absoluteV4ApiUrl({ sierraApiHost: 'some.library', sierraApiPath: '/test/sierra-api-beta/' }),
      id => {
        expect(() => new URL(id)).to.not.throw()
        expect(id).to.match(/^https:\/\/some\.library\/test\/sierra-api-beta\/v4\/(authorities|bibs|invoices|items|orders|patrons)\/[1-9]\d{5,6}(@[a-z0-9]{1,5})?$/)
      }
    )

  })

})
