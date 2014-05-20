Queryable JS
-----------

Queryable - A tiny, single file database written in Javascript, that emulates a functional subset of mongodb commands. It works in both browser and server (node.js). The database itself is stored as a json string. Unlike mongo there are no collections; A separate db is simply returned by each call to open(). Essentially, queryable facilitates structured querying of an array of objects.
## Examples

### Some examples of using queryable.js in node.js:

```js
var queryable = require( 'queryable' );     

var db = queryable.open( path_to_db );      // ** There are multiple ways to open a db.
                                            //    The simplest is a string of the path
                                            //    and filename to where you want it. Eg. "/tmp/my_data.db"

var db = queryable.open( "Database_Name" ); 
var db = queryable.open( {db_name:"name",data: JSONObject } ); // loads from json object, that is Array of Objects
                                            //    eg. [{name:1},{name:2}, ...]

db.insert( {key:"Anything you want", comment:"fields don't have to match",keys:"keys can be anything"} );

var db2 = queryable.open( "another.db" );   // ** Multiple databases can be opened at once; each is fully independent.

db2.insert( {subarray:[1,2,'buckle',{'my':'shoe'}]} ); // will insert the whole object, no sweat

var res = db.find( /regex/ );               // ** Find() command works like Mongo
var res = db.find( {key: {'$gt':4}} );      //    all where key > 4
var res = db.find({name:{'$exists':true}}).sort({name:-1})  // only rows where 'name' exists, and sort by name DESC

                                            // ** Returns db_result, which has a length property and _data[] array
                                            //    as well as chainable methods like: .sort(), .limit(), .skip(), ..
```
See the 'examples' folder for more examples of usage.

# API

## The queryable.open() function
There are essentially 3 forms of open(): no args, a single string, a single object. The most concise way to specify what you want is to use a `config` object, and specify each param individually. Failing that, merely providing a fullpath string, where you want your database to live, is sufficient in most cases.

### queryable.open()
* `db_name` = defaults to 'test.db' in node, 'queryable' in web browser
* `db_dir`  = default is current working directory: (eg. /home/kooldude)
* `db_path` = concatenation of: (db_dir + db_name) (eg. /home/kooldude/test.db)

### queryable.open(string)
* First it tries string as a fullpath; if file is found: db_name,db_dir,and db_path are set.
* If a file isn't found, it tries string as a directory, where it will create the database using the default db_name.
* If it isn't a directory or an existing file, string is assumed to be a fullpath with no file yet saved. db_path, db_dir, and db_name are set from that.

### queryable.open(object)
* if argument is an object, these configuration variable are looked for in it:
  * **db_name**       If none supplied, it either takes one from db_path or defaults to *'queryable'* or *'test.db'* in the browser or in node respectively.
  * **db_path**       The fullpath where the database lives. Irrelevant in the browser. The database file is written to db_path everytime save() is called, and read from it in open() if an existing file is discovered at the location.
  * **db_dir**        Defaults to current working directory if db_path or db_dir are not supplied.
  * **use_gzip**      Can manually specify file is of type gzip. This is useful for files lacking the '.gz' extension. Note: currently gzbz must be present for this to work.
  * **data**          If this is set, the database can be populated outright by an argument to data. data can be string or json. It must be in the form of **Array of Zero or More Objects of Any Kind**.


# Full List of Commands

## Supported Methods
| *object* | command | status | comment/example |
| --- | --- | --- | --- |
| **queryable** | | | the return of `require('queryable')` |
| | `open();` | implemented | returns db_object |
| | `useGzip(boolean);` | implemented | force use of gzip. Useful for gzipped files lacking '.gz' extension; defaults to false |
| **db_object** | | | the return of `queryable.open()` |
| | `save()` | implemented | writes to current system (either file-system or browser) |
| | `insert(vals_obj)` | implemented | inserts vals_obj onto end of table; if vals_obj is an array, will treat contents as array of objects and insert each, one at a time |
| | update(match, newval) | implemented | finds rows that match `match` and set to `newval` |
| | `find(match, callback)` | implemented | returns db_result unless callback is present, then db_result passed to it |
| | `distinct(string,clause)` | implemented | finds all rows, eliminates duplicate values of certain key. `db.distinct('name')` or `db.distinct('name',{age:{$lt:35}})` |
| | `remove()` | implemented | `db.remove( {name:/[A-Z](.*)/} )` |
| | `get_json()` | implemented | returns json string of entire db |
| | `print(fmt)` | implemented | spits out tabular json to stdout |
| | `now()` | implemented | returns Date().toISOString of the present moment; useful for date fields |
| | `toDate(arg)` | implemented | returns new Date(arg) |
| | `count()` | implemented | returns table length |
| **db_result** | | | |
| | `sort()` | implemented | &nbsp; |
| | `limit(integer)` | implemented | limits the result set to `integer` results |
| | `skip(integer)` | implemented | shaves off the first `integer` rows of the result set |
| | `count()` | implemented | returns length of result set |
| | `getArray()` | implemented | &nbsp; |
| | `get_json()` | implemented | &nbsp; |
| | `print(fmt)` | implemented | debug print to stdout |

## Query Operators
| Name | Status | comment/example |
| --- | --- | --- |
| $gt | implemented | `db.find( {a:{$gt:5} );` |
| $gte | implemented | `db.find( {a:{$gte:100} );` |
| $in | *not impl* | selects the documents where a field equals any value in an array |
| $lt | implemented | |
| $lte | implemented | |
| $ne | implemented | Matches all values that are not equal to the value specified in the query `db.find( {a:{$ne:2},b{$ne:3}} ); // select * from table where (a != 2) && (b != 3)` | 
| $nin | *not impl* | |
| | | |
| $or | implemented | `db.find( {$or:[{n:1},{y:{$gte:3}}]} ) //return all results where (n == 1) or (y >= 3)` |
| $and | *not impl* | |
| $not | *not impl* | |
| $nor | *not impl* | |
| | | |
| $exists | implemented | `db.find( {name: {$exists:true} } ) // return all results where the name field exists` |
| $type | *not impl* | |
| | | |
| $mod | no plans | |
| $regex | no plans | |
| $text | no plans | |
| $where | no plans | &nbsp; |

## Update Operators
| Name | Status | comment/example |
| --- | --- | --- |
| $inc | *not impl* | Increments the value of the field by the specified amount. |
| $mul | *not impl* | Multiplies the value of the field by the specified amount. |
| $rename | *not impl* | Renames a field. |
| $setOnInsert | *not impl* | Sets the value of a field upon document creation during an upsert. Has no effect on update operations that modify existing documents. |
| $set | implemented | Sets the value of a field in an existing document. |
| $unset | *not impl* | Removes the specified field from an existing document. |
| $min | *not impl* | Only updates if the existing field value is less than the specified value. |
| $max | *not impl* | Only updates if the existing field value is greater than the specified value. |
| $currentDate | *kindof impl* | Use **db.now()** instead for now |


## In the Works

1. Better documentation (still working on it); Website (not quite yet).
 
2. Feature Roadmap: which features will be implemented next, roughly in order.
  * [X] better documentation for open() 
  * [] better documentation for update() 
  * [] callbacks
  * [] $in, $nin
  * [] $and, $not, $nor
  * [] $inc, $mul 
  * [] $unset 
  * [] $rename 
  * [] update().limit()
  * [] remove().limit()
  * [] $min, $max
  * [] $currentDate    (db.now() already accomplishes this, though could alias it to $currentDate)
  * [] queryable.min.js
  * [] cleanup

3. Sample projects built on queryable demonstrating features and functionality.
  * [Arcane Vocabulary Tutor](http://lit-tundra-5131.herokuapp.com/)
  * [basic browser example](https://raw.githubusercontent.com/gmn/queryable/master/examples/browser.html)

## Install
To install: 

    ```
    npm install queryable
    ```
To install in your project and save in its `package.json`: 

    ```
    npm install queryable --save
    ```

## Test

To run unit-tests: 

    ```
    npm test
    ```

## Licence

(The MIT License)

Copyright 2014 No Genius Software. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contact 

Mail: greg@naughton.org for questions, comments, bugs
