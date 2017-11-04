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


const RecordIdKind = Object.freeze({
  RECORD_NUMBER: Symbol('RECORD_NUMBER'),
  WEAK_RECORD_KEY: Symbol('WEAK_RECORD_KEY'),
  STRONG_RECORD_KEY: Symbol('STRONG_RECORD_KEY'),
  AMBIGUOUS_RECORD_KEY: Symbol('AMBIGUOUS_RECORD_KEY'),
  DATABASE_ID: Symbol('DATABASE_ID'),
  RELATIVE_V4_API_URL: Symbol('RELATIVE_V4_API_URL'),
  ABSOLUTE_V4_API_URL: Symbol('ABSOLUTE_V4_API_URL'),
})


module.exports = {
  RecordIdKind
}
