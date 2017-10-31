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
const sierraRecordId = require('./index')
const detect = sierraRecordId.detect
const RecordIdForms = sierraRecordId.RecordIdForms
const { arbitraries, testSierraConfig } = require('./test-support')


describe('detect', function () {

  jsv.property('detects record numbers', arbitraries.recordNumber, x => {
    expect(detect(x)).to.equal(RecordIdForms.RECORD_NUMBER)
    return true
  })
  jsv.property('detects weak record keys', arbitraries.unambiguousWeakRecordKey, x => {
    expect(detect(x)).to.equal(RecordIdForms.WEAK_RECORD_KEY)
    return true
  })
  jsv.property('detects ambiguous record keys', arbitraries.ambiguousRecordKey, x => {
    expect(detect(x)).to.equal(RecordIdForms.AMBIGUOUS_RECORD_KEY)
    return true
  })
  jsv.property('detects strong record keys', arbitraries.unambiguousStrongRecordKey, x => {
    expect(detect(x)).to.equal(RecordIdForms.STRONG_RECORD_KEY)
    return true
  })
  jsv.property('detects database ids', arbitraries.databaseId, x => {
    expect(detect(x)).to.equal(RecordIdForms.DATABASE_ID)
    return true
  })
  jsv.property('detects relative v4 api urls', arbitraries.relativeV4ApiUrl, x => {
    expect(detect(x)).to.equal(RecordIdForms.RELATIVE_V4_API_URL)
    return true
  })
  jsv.property('detects absolute v4 api urls', arbitraries.absoluteV4ApiUrl, x => {
    expect(detect(x)).to.equal(RecordIdForms.ABSOLUTE_V4_API_URL)
    return true
  })

  describe('copes with invalid record ids', function () {
    const invalidRecordIds = [
      undefined,
      null,
      '',
      'something random, but see the warning above!'
    ]
    for (const form of invalidRecordIds) {
      it(`should return undefined when given ${form}`, function () {
        expect(detect(form)).to.be.undefined
      })
    }
  })

})
