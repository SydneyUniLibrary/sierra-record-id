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


const chai = require('chai')
const expect = chai.expect
const jsv = require('jsverify')

const {
  RecordId, RecordNumber, WeakRecordKey, StrongRecordKey, DatabaseId,
  RelativeV4ApiUrl, AbsoluteV4ApiUrl
} = require('..')

const { arbitrary, chaiProperty } = require('../test-support')
const { ALWAYS, NEVER, SOMETIMES } = arbitrary


describe('RecordId', function () {

  describe('detect', function () {

    chaiProperty(
      'detects record numbers',
      arbitrary.recordNumber(),
      id => expect(RecordId.detect(id)).to.equal(RecordNumber)
    )

    chaiProperty(
      'detects weak record keys',
      arbitrary.weakRecordKey({ ambiguous: arbitrary.NEVER }),
      id => expect(RecordId.detect(id)).to.equal(WeakRecordKey)
    )

    chaiProperty(
      'detects strong record keys',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.NEVER }),
      id => expect(RecordId.detect(id)).to.equal(StrongRecordKey)
    )

    chaiProperty(
      'detects database ids',
      arbitrary.databaseId(),
      id => expect(RecordId.detect(id)).to.equal(DatabaseId)
    )

    chaiProperty(
      'detects relative v4 api urls',
      arbitrary.relativeV4ApiUrl(),
      id => expect(RecordId.detect(id)).to.equal(RelativeV4ApiUrl)
    )

    chaiProperty(
      'detects absolute v4 api urls',
      arbitrary.absoluteV4ApiUrl(),
      id => expect(RecordId.detect(id)).to.equal(AbsoluteV4ApiUrl)
    )

    chaiProperty(
      'throws for ambiguous weak record keys',
      arbitrary.weakRecordKey({ ambiguous: arbitrary.ALWAYS }),
      id => expect(() => RecordId.detect(id)).to.throw(/ambiguous record key/i)
    )

    chaiProperty(
      'throws for ambiguous strong record keys',
      arbitrary.strongRecordKey({ ambiguous: arbitrary.ALWAYS }),
      id => expect(() => RecordId.detect(id)).to.throw(/ambiguous record key/i)
    )

    const invalidRecordIds = [
      undefined,
      null,
      '',
      "something random, but don't count on it!"
    ]
    for (const id of invalidRecordIds) {
      const idStrDescr = typeof id === 'string' ? `"${id}"` : `${id}`
      it(`throws for ${idStrDescr}`, function () {
        expect(() => RecordId.detect(id)).to.throw(/not determine what kind of record id/i)
      })
    }

  })


  describe('fromString', function () {

    chaiProperty(
      'detects and parses record numbers',
      arbitrary.recordNumber(),
      id => expect(RecordId.fromString(id)).to.be.a('RecordNumber')
    )

    chaiProperty(
      'detects and parses unambiguous weak record keys',
      arbitrary.weakRecordKey({ ambiguous: NEVER }),
      id => expect(RecordId.fromString(id)).to.be.a('WeakRecordKey')
    )

    chaiProperty(
      'throws when given ambiguous weak record keys',
      arbitrary.weakRecordKey({ ambiguous: ALWAYS }),
      id => expect(() => { RecordId.fromString(id) }).to.throw(/ambiguous record key/i)
    )

    chaiProperty(
      'detects and parses unambiguous strong record keys numbers',
      arbitrary.strongRecordKey({ ambiguous: NEVER }),
      id => expect(RecordId.fromString(id)).to.be.a('StrongRecordKey')
    )

    chaiProperty(
      'throws when given ambiguous strong record keys',
      arbitrary.strongRecordKey({ ambiguous: ALWAYS }),
      id => expect(() => { RecordId.fromString(id) }).to.throw(/ambiguous record key/i)
    )

    chaiProperty(
      'detects and parses database ids',
      arbitrary.databaseId(),
      id => expect(RecordId.fromString(id)).to.be.a('DatabaseId')
    )

    chaiProperty(
      'detects and parses relative v4 api urls',
      arbitrary.relativeV4ApiUrl(),
      id => expect(RecordId.fromString(id)).to.be.a('RelativeV4ApiUrl')
    )

    chaiProperty(
      'detects and parses absolute v4 api urls',
      arbitrary.absoluteV4ApiUrl(),
      id => expect(RecordId.fromString(id)).to.be.a('AbsoluteV4ApiUrl')
    )

    const invalidRecordIds = [
      undefined,
      null,
      '',
      "something random, but don't count on it!"
    ]
    for (const id of invalidRecordIds) {
      const idStrDescr = typeof id === 'string' ? `"${id}"` : `${id}`
      it(`throws for ${idStrDescr}`, function () {
        expect(() => RecordId.fromString(id)).to.throw(/not determine what kind of record id/i)
      })
    }

  })

})
