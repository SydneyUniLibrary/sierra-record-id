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
const { arbitraries, testSierraConfig } = require('./test-support')

chai.use(require('chai-string'));


describe('test-support arbitraries', function () {
  jsv.property('recordNumber', arbitraries.recordNumber, x => /^\d{6,7}(@[a-z0-9]{1,5})?$/.test(x))
  jsv.property('weakRecordKey', arbitraries.weakRecordKey, x => /^.?[a-z]\d{6,7}(@[a-z0-9]{1,5})?$/.test(x))
  jsv.property('strongRecordKey', arbitraries.strongRecordKey, x => /^.?[a-z]\d{6,7}[x0-9](@[a-z0-9]{1,5})?$/.test(x))
  jsv.property('databaseId', arbitraries.databaseId, x => /^\d{12,}$/.test(x))
  jsv.property('v4RelativeApiUrl', arbitraries.relativeV4ApiUrl, x => /^v4\/[a-z]+\/\d{6,7}(@[a-z0-9]{1,5})?$/.test(x))
  jsv.property('v4AbsoluteApiUrl', arbitraries.absoluteV4ApiUrl, x => {
    expect(x).to.startWith(testSierraConfig.baseUrl)
    expect(x).to.match(/v4\/[a-z]+\/\d{6,7}(@[a-z0-9]{1,5})?$/)
    return true
  })
})
