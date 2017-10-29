# sierra-record-id
Translates between the various forms of identifying a record in Sierra.




## How to use

```
npm install 'SydneyUniLibrary/sierra-record-id#v1.0'
```

### How to set up for virtual records

If you need to translate to or from database ids for virtual records, you will need to set up access to the Sierra database. Follow the instruction on [how to use sierra-db-as-promised](https://github.com/SydneyUniLibrary/sierra-db-as-promised#how-to-use). If you don't do this, then `sierra-record-id` will throw an exception if you try to translate to or from a database id for a virtual record.

### How to set up for Sierra API URIs

If you need to translate to or from API URIs you will need to configure the Sierra's host name. You do this in a way that is compatible with [sierra-api-as-promised](https://github.com/SydneyUniLibrary/sierra-api-as-promised). In other words, if you have already set up `sierra-api-as-promised` you are already set up for using Sierra API URIs with `sierra-record-id`.

At a minimum, you need to set `SIERRA_API_HOST` in your process's environment.

You can do that in any manner you choose. However if you create a .env file in the root directory of your project like the following, `sierra-record-id` will read it and set up your process's environment for you.

```
SIERRA_API_HOST=sierra.library.edu
```

Note that this needs to be the name of Sierra's application server, and not Sierra' database server.




## Nomenclature

`sierra-record-id` using the following nomenclature/terminology to refer to the different forms of identifying a Sierra record.

Term                | Example            | Virtual record example  | Notes
--------------------|--------------------|-------------------------|-------------
Record number       | `3696836`          | `587634@abcde`          | (1)
Week record key     | `i3696836`         | `i587634@abcde`         | (2) (3)
Strong record key   | `i36968365`        | `i5876345@abcde`        | (2) (3) (4)
Database id         | `450975262916`     | `28192594886437`        | (5) (6)
Relative v4 API URL | `v4/items/3696836` | `v4/items/587634@abcde` | (7)
Absolute v4 API URL | `https://sierra.library.edu/iii/sierra-api/v4/items/3696836` | `https://sierra.library.edu/iii/sierra-api/v4/items/587634@abcde` | (8)

Notes:

(1) This is called a record id in the Sierra API documentation (although sometimes Sierra produces a record id that is actually an absolute v4 API URL). These are ambigious by themselves, because they do not identify the record type.

(2) Record keys, both week and strong, can also start with a full stop/period. For example: .i36968365, .i3696836, .i587634@abcde

(3) A strong record key includes a final check digit, while a week record key does not. The terminology comes from the fact that the validity of a record key with a check digit can be verified, and is therefore stronger against corruption and typos than a week record key.

(4) Strong virtual record keys are only theortical and included just for completeness. Sierra (as of v3.3) never actually produces strong virtual record keys. Whenever it produces a strong record key when the record is not virtual, it produces a week record key when the record is virtual.

(5) These are the ids from Sierra's database. They are not the record ids from Sierra's API, which here are called record numbers.

(6) The database ids for virtual records contain a 16-bit campus id. This campus id correlates with the '@abcde' part of a record number. The mapping between the '@abcde' part of a record number and a campus id is only available in Sierra's database. This is why you need to set up access to Sierra's database if you want to translate to or from database ids for virtual records.

(7) There is not initial forward slash in relative v4 API URLs. The Sierra API documentation suggests that relative v4 API URLs do start with a forward slash. But according to [specification for URLs](https://tools.ietf.org/html/rfc3986) combining the base `https://sierra.library.edu/iii/sierra-api/` with `/v4/items/3696836` gives `https://sierra.library.edu/v4/items/3696836`. Whereas combining the base `https://sierra.library.edu/iii/sierra-api/` with `v4/items/3696836` gives `https://sierra.library.edu/iii/sierra-api/v4/items/3696836`. So in `sierra-record-id` there is no initial forward slash on relative v4 API URLs.

(8) These would be the examples if `SIERRA_API_HOST` is `sierra.library.edu`.
