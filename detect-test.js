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

const { detect, RecordIdKind } = require('.')
const { arbitrary, chaiProperty } = require('./test-support')


describe('detect', function () {

  chaiProperty(
    'detects record numbers',
    arbitrary.recordNumber(),
    id => expect(detect(id)).to.equal(RecordIdKind.RECORD_NUMBER)
  )

  chaiProperty(
    'detects weak record keys',
    arbitrary.weakRecordKey({ ambiguous: arbitrary.NEVER }),
    id => expect(detect(id)).to.equal(RecordIdKind.WEAK_RECORD_KEY)
  )

  chaiProperty(
    'detects strong record keys',
    arbitrary.strongRecordKey({ ambiguous: arbitrary.NEVER }),
    id => expect(detect(id)).to.equal(RecordIdKind.STRONG_RECORD_KEY)
  )

  chaiProperty(
    'detects ambiguous weak record keys',
    arbitrary.weakRecordKey({ ambiguous: arbitrary.ALWAYS }),
    id => expect(detect(id)).to.equal(RecordIdKind.AMBIGUOUS_RECORD_KEY)
  )

  chaiProperty(
    'detects ambiguous strong record keys',
    arbitrary.strongRecordKey({ ambiguous: arbitrary.ALWAYS }),
    id => expect(detect(id)).to.equal(RecordIdKind.AMBIGUOUS_RECORD_KEY)
  )

  chaiProperty(
    'detects database ids',
    arbitrary.databaseId(),
    id => expect(detect(id)).to.equal(RecordIdKind.DATABASE_ID)
  )

  chaiProperty(
    'detects relative v4 api urls',
    arbitrary.relativeV4ApiUrl(),
    id => expect(detect(id)).to.equal(RecordIdKind.RELATIVE_V4_API_URL)
  )

  chaiProperty(
    'detects absolute v4 api urls',
    arbitrary.absoluteV4ApiUrl(),
    id => expect(detect(id)).to.equal(RecordIdKind.ABSOLUTE_V4_API_URL)
  )

  describe('copes with invalid record ids', function () {
    const invalidRecordIds = [
      undefined,
      null,
      '',
      "something random, but don't count on it!"
    ]
    for (const id of invalidRecordIds) {
      it(`should return undefined when given ${id}`, function () {
        expect(detect(id)).to.be.undefined
      })
    }
  })

})
