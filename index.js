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


module.exports = {
  ...require('./lib/record-id'),
  ...require('./lib/record-number'),
  ...require('./lib/weak-record-key'),
  ...require('./lib/strong-record-key'),
  ...require('./lib/database-id'),
  ...require('./lib/relative-v4-api-url'),
  ...require('./lib/absolute-v4-api-url'),
  ...require('./lib/relative-v5-api-url'),
  ...require('./lib/absolute-v5-api-url'),
}


/*
 Separated out to resolve cyclic dependency between RecordId and its subclasses.
 Defines RecordId.detect
*/
require('./lib/record-id-detect')
