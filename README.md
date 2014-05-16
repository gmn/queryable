# Queryable JS

Queryable - A tiny, self-contained, single file database, written in pure Javascript, which aims to support a functional subset of MongoDB-like commands. It works seamlessly in both the client (browser) and the server (node.js).  Just include it in your project and go.  The database format is stored as human-readable JSON, one file per each database.

## Examples

To use queryable.js in node.js, simply do:
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


# Full List of Commands

## Supported Methods
| *object* | command | status | comment/example |
| --- | --- | --- | --- |
| **queryable** | | | the return of `require('queryable')` |
| | `open();` | implemented | returns db_object |
| | `useGzip(boolean);` | implemented | force use of gzip. Useful for gzipped files lacking '.gz' extension; defaults to false |
| **db_object** | | | the return of `queryable.open()` |
| | save() | implemented | writes to current system (either file-system or browser) |
| | insert(vals_obj) | implemented | inserts vals_obj onto end of table; if vals_obj is an array, will treat contents as array of objects and insert each, one at a time |
| | update(match, newval) | implemented | finds rows that match `match` and set to `newval` |
| | find(match, callback) | implemented | returns db_result unless callback is present, then db_result passed to it |
| | distinct(string,clause) | implemented | finds all rows, eliminates duplicate values of certain key. `db.distinct('name')` or `db.distinct('name',{age:{$lt:35}})` |
| | remove() | implemented | `db.remove( {name:/[A-Z](.*)/} )"` |
| | get_json() | implemented | returns json string of entire db |
| | print(fmt) | implemented | spits out tabular json to stdout |
| | now() | implemented | returns Date().toISOString of the present moment; useful for date fields |
| | toDate(arg) | implemented | returns new Date(arg) |
| | count() | implemented | returns table length |
| **db_result** | | | |
| | sort() | implemented | &nbsp; |
| | limit(integer) | implemented | &nbsp; |
| | skip(integer) | implemented | intege |
| | count() | implemented | returns length of result set |
| | getArray() | implemented | &nbsp; |
| | get_json() | implemented | &nbsp; |
| | print(fmt) | implemented | debug print to stdout |

## Query Operators
| Name | Status | comment/example |
| --- | --- | --- |
| $gt | implemented | `db.find( {a:{$gt:5} );` |
| $gte | implemented | `db.find( {a:{$gte:100} );` |
| $in | not implemented | selects the documents where a field equals any value in an array |
| $lt | implemented | |
| $lte | implemented | |
| $ne | not implemented | Matches all values that are not equal to the value specified in the query | 
| $nin | not implemented | |
| | | |
| $or | implemented | `db.find( {$or:{n:1,y:2}} ) //return all results where (n == 1) or (y == 2)` |
| $and | not implemented | |
| $not | not implemented | |
| $nor | not implemented | |
| | | |
| $exists | implemented | `db.find( {name: {$exists:true} } ) // return all results where the name field exists` |
| $type | not implemented | |
| | | |
| $mod | no plans | |
| $regex | no plans | |
| $text | no plans | |
| $where | no plans | &nbsp; |

## Update Operators
| Name | Status | comment/example |
| --- | --- | --- |
| $inc | not implemented | Increments the value of the field by the specified amount. |
| $mul | not implemented | Multiplies the value of the field by the specified amount. |
| $rename | not implemented | Renames a field. |
| $setOnInsert | not implemented | Sets the value of a field upon document creation during an upsert. Has no effect on update operations that modify existing documents. |
| $set | implemented | Sets the value of a field in an existing document. |
| $unset | not implemented | Removes the specified field from an existing document. |
| $min | not implemented | Only updates if the existing field value is less than the specified value. |
| $max | not implemented | Only updates if the existing field value is greater than the specified value. |
| $currentDate | implemented | **use now()** |


## In the Works

1. Better documentation (still working on it); Website (not quite yet).
 
2. Feature Roadmap: which features will be implemented next, roughly in order.
  * callbacks
  * $in and $nin
  * $unset (remove key from rows)
  * $rename (rename key in rows)
  * $not
  * $ne
  * update().limit()
  * remove().limit()

3. Sample projects built on queryable demonstrating features and functionality.
  * [Arcane Vocabulary Tutor](http://lit-tundra-5131.herokuapp.com/)
  * [basic browser example](https://raw.githubusercontent.com/gmn/queryable/master/examples/browser.html)


## Contact 

Mail: greg@naughton.org for questions, comments, bugs
