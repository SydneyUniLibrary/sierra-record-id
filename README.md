# sierra-record-id
Translates between the various forms of identifying a record in Sierra.




## How to use

```
npm install 'SydneyUniLibrary/sierra-record-id#v1.0'
```

### How to set up for virtual records

If you need to translate to or from database ids for virtual records, you will need to set up access to the Sierra database. Follow the instruction on [how to use sierra-db-as-promised](https://github.com/SydneyUniLibrary/sierra-db-as-promised#how-to-use). If you don't do this, then `sierra-record-id` will throw an exception if you try to translate to or from the database id for a virtual record.

### How to set up for Sierra API URLs

If you need to translate to or from API URLs you will need to configure Sierra's host name. You do this in a way that is compatible with [sierra-api-as-promised](https://github.com/SydneyUniLibrary/sierra-api-as-promised). In other words, if you have already set up `sierra-api-as-promised` you are already set up for using Sierra API URIs with `sierra-record-id`.

At a minimum, you need to set `SIERRA_API_HOST` in your process's environment.

You can do that in any manner you choose. However if you create a .env file in the root directory of your project like the following, `sierra-record-id` will read it and set up your process's environment for you.

```
SIERRA_API_HOST=sierra.library.edu
```

Note that this needs to be the name of Sierra's application server, and not Sierra's database server.




## Nomenclature

`sierra-record-id` uses the following nomenclature/terminology to refer to the different forms of identifying a record in Sierra.

Term                | Example            | Virtual record example  | Notes
--------------------|--------------------|-------------------------|-------------
Record number       | `3696836`          | `587634@abcde`          | (1) (2)
Weak record key     | `i3696836`         | `i587634@abcde`         | (3) (4)
Strong record key   | `i36968365`        | `i5876345@abcde`        | (3) (4) (5)
Database id         | `450975262916`     | `28192594886437`        | (6) (7)
Relative v4 API URL | `v4/items/3696836` | `v4/items/587634@abcde` | (8)
Absolute v4 API URL | `https://sierra.library.edu/iii/sierra-api/v4/items/3696836` | `https://sierra.library.edu/iii/sierra-api/v4/items/587634@abcde` | (8)

Notes:

(1) Record numbers are ambigious by themselves, because they do not identify the record type. If you want to traslate from a record number, you will need to specifiy what type of record it is.

(2) A record number is called a record id in the Sierra API documentation. Although sometimes Sierra produces a record id that is actually an absolute v4 API URL. 

(3) Record keys, both weak and strong, can also start with a period. For example: `.i36968365`, `.i3696836`, `.i587634@abcde`.

(4) A strong record key includes a final check digit, while a weak record key does not. This terminology comes from the fact that the validity of a record key with a check digit can be verified, and is therefore stronger against corruption and typos than a weak record key.

(5) Strong virtual record keys are only theortical and included just for completeness. Sierra (as of v3.3) never actually produces strong virtual record keys. Whenever it produces a strong record key when the record is not virtual, it produces a weak record key when the record is virtual.

(6) These are the ids from Sierra's database. They are not the record ids from Sierra's API, which here are called record numbers.

(7) The database ids for virtual records contain a 16-bit campus id. This campus id correlates with the `@abcde` part of a record number. The mapping between the `@abcde` part of a record number and a campus id is only available in Sierra's database. This is why you need to set up access to Sierra's database if you want to translate to or from database ids for virtual records.

(8) There is not initial forward slash in relative v4 API URLs. The Sierra API documentation suggests that relative v4 API URLs do start with a forward slash. But according to [the specification for URLs](https://tools.ietf.org/html/rfc3986), combining the base `https://sierra.library.edu/iii/sierra-api/` with `/v4/items/3696836` gives `https://sierra.library.edu/v4/items/3696836`. Whereas combining the base `https://sierra.library.edu/iii/sierra-api/` with `v4/items/3696836` gives `https://sierra.library.edu/iii/sierra-api/v4/items/3696836`. So in `sierra-record-id` there is no initial forward slash on relative v4 API URLs so they can be properly combined with the Sierra API base URL.

(9) These would be the examples if `SIERRA_API_HOST` is `sierra.library.edu`.




## API


### detect

Take heed that detecting is not validation. If you give `sierra-record-id` a string that is not a valid record id,
it could incorrectly detect it.  

```
const { detect, RecordIdForms } = require('@SydneyUniLibrary/sierra-record-id')

detect(3696836) // => RecordIdForms.RECORD_NUMBER
detect('3696836') // => RecordIdForms.RECORD_NUMBER
detect('o369683') // => RecordIdForms.WEAK_RECORD_KEY
detect('i3696836') // => RecordIdForms.AMBIGUOUS_RECORD_KEY
detect('i36968367') // => RecordIdForms.STRONG_RECORD_KEY
detect(450975262916) // => RecordIdForms.DATABASE_ID
detect('450975262916') // => RecordIdForms.DATABASE_ID
detect('v4/items/3696836') // => RecordIdForms.RELATIVE_V4_API_URL
detect('https://sierra.library.edu/iii/sierra-api/v4/items/3696836') // => RecordIdForms.ABSOLUTE_V4_API_URL
```

`detect` correctly detects record keys that have the initial period, for example `.o369683` and `.i36968367`. It also
correctly detects virtual records like `587634@abcde`, `i587634@abcde`, `.i5876345@abcde` and `v4/items/587634@abcde`.

#### Ambiguous record keys

Because record numbers can be 6 or 7 digits, `i3696836` is ambiguous. It could be a weak record key for the 7 digit
record number `3696836`, or it could be a strong key for the 6 digit record number `369683` with `6` being the check digit.

The previous paragraph notwithstanding, if the key for a 6 digit record number has an `x` check digit 
(for example `o100007x`), `detect` will detect it as being strong and not as being ambiguous.

#### Detection logic

`detect` detects the form of the record id as follows (in order, after trimming whitespace):

1. If the form starts with `.`, then it is a record key and `detect` calls `detectRecordKeyStrength`.
2. If the form starts with `https://` and contains `/v4/`, then it is an absolute v4 API URL.
3. If the form starts with `v4/`, then it is a relative v4 API URL.
4. If the form starts with a letter, then it is a record key and `detect` calls `detectRecordKeyStrength`.
5. If the form is a string 12 or more digits, then it is a database id.
6. If the from starts with a digit, then it is a record number.
7. Otherwise the form is unknown.

You can detect a database id without having to set up `sierra-db-as-promised`.
Similarly yYou can also detect an API URL without having to set up `SIERRA_API_HOST`.

#### Detecting the strength of a record key

`detectRecordKeyStrength` (which `detect` calls) detects the strength of a record key as follows:

1. `detectRecordKeyStrength` strips that off any virtual record part (like `@abcde`), any initial period,
   and the record type character.
2. If what's left ends in `x`, then the record key is strong.
3. If what's left is a string of 8 digits, then the record key is strong.
4. If what's left is a string of 6 digits, then the record key is weak.
5. Otherwise the record key is ambiguous.

`detectRecordKeyStrength` does not attempt to validate the check digit in a record key.




## License

Copyright (c) 2017  The University of Sydney Library

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
