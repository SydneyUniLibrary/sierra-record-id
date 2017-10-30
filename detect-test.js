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


const expect = require('chai').expect
const sierraRecordId = require('./index')
const detect = sierraRecordId.detect
const RecordIdForms = sierraRecordId.RecordIdForms


describe('detect', function () {

  const invalidRecordIds = [
    undefined,
    null,
    '',
    'something random, but see the warning above!'
  ]

  describe('coping with invalid record ids', function () {
    for (const form of invalidRecordIds) {
      it(`should return undefined when given ${form}`, function () {
        expect(detect(form)).to.be.undefined
      })
    }
  })

  const knownRecordNumbers = [
    '164905',
    '1666521',
    '560184@fhill',
    '1462119@9qut0'
  ]

  describe('detecting record numbers', function () {
    for (const form of knownRecordNumbers) {
      it(`should detect ${form} as a record number`, function () {
        expect(detect(form)).to.equal(RecordIdForms.RECORD_NUMBER)
      })
    }
  })

  const knownWeakRecordKeys = [
    'c154458',
    'i538329@still',
  ]

  describe('detecting weak record keys', function () {
    for (const form of knownWeakRecordKeys) {
      it(`should detect ${form} as a weak record key`, function () {
        expect(detect(form)).to.equal(RecordIdForms.WEAK_RECORD_KEY)
      })
      const dotForm = `.${form}`
      it(`should detect ${dotForm} as a weak record key`, function () {
        expect(detect(dotForm)).to.equal(RecordIdForms.WEAK_RECORD_KEY)
      })
    }
  })

  const ambiguousRecordKeys = [
    'o4105199',
    'p1308203@9cown',
  ]

  describe('detecting ambiguous record keys', function () {
    for (const form of ambiguousRecordKeys) {
      it(`should detect ${form} as an ambiguous record key`, function () {
        expect(detect(form)).to.equal(RecordIdForms.AMBIGUOUS_RECORD_KEY)
      })
      const dotForm = `.${form}`
      it(`should detect ${dotForm} as a strong record key`, function () {
        expect(detect(dotForm)).to.equal(RecordIdForms.AMBIGUOUS_RECORD_KEY)
      })
    }
  })

  const knownStrongRecordKeys = [
    'b33846327',
    'b47116523@mdill',
    'o100007x',
    'b1125421x',
    'i100993x@fhill',
    'i1799780x@9utsy',
  ]

  describe('detecting strong record keys', function () {
    for (const form of knownStrongRecordKeys) {
      it(`should detect ${form} as a stong record key`, function () {
        expect(detect(form)).to.equal(RecordIdForms.STRONG_RECORD_KEY)
      })
      const dotForm = `.${form}`
      it(`should detect ${dotForm} as a strong record key`, function () {
        expect(detect(dotForm)).to.equal(RecordIdForms.STRONG_RECORD_KEY)
      })
    }
  })

  const knownDatabaseIds = [
    '425201916762',
    '450973157841',
    '563400925525721',
    '18577829500548651'
  ]

  describe('detecting database ids', function () {
    for (const form of knownDatabaseIds) {
      it(`should detect ${form} as a database id`, function () {
        expect(detect(form)).to.equal(RecordIdForms.DATABASE_ID)
      })
    }
  })

  const knownRelativeV4ApiUrls = [
    'v4/authorities/1316635',
    'v4/bibs/526894',
    'v4/bibs/3434098',
    'v4/bibs/551912@mdill',
    'v4/bibs/1792259@9woll',
    'v4/invoices/1044142',
    'v4/items/118287',
    'v4/items/2385255',
    'v4/items/537251@nrill',
    'v4/items/5532493@9umel',
    'v4/orders/314855',
    'v4/orders/1321154',
    'v4/patrons/210978',
    'v4/patrons/1351172',
    'v4/patrons/352099@9unew',
    'v4/patrons/1024815@9umel',
  ]

  describe('detecting relative v4 api urls', function () {
    for (const form of knownRelativeV4ApiUrls) {
      it(`should detect ${form} as a relative v4 api url`, function () {
        expect(detect(form)).to.equal(RecordIdForms.RELATIVE_V4_API_URL)
      })
    }
  })

  describe('detecting absolute v4 api urls', function () {
    const baseUrl = 'https://sierra.library.usyd.edu.au/iii/sierra-api/'
    for (const relativeForm of knownRelativeV4ApiUrls) {
      const form = baseUrl + relativeForm
      it(`should detect ${form} as an absolute v4 api url`, function () {
        expect(detect(form)).to.equal(RecordIdForms.ABSOLUTE_V4_API_URL)
      })
    }
  })

})
