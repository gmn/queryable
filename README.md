# Queryable JS

Queryable - A tiny, self-contained, single file database, written in pure Javascript, which aims to support a functional subset of MongoDB-like commands. It works seamlessly in both the client (browser) and the server (node.js).  Just include it in your project and go.  The database format is stored as human-readable JSON. One main difference with mongo is there are no collections. One db_object is returned per each call to queryable.open();

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

<span style="color:#080">implemented</span>
# Full List of Commands

## Supported Methods
| *object* | command | status | comment/example |
| --- | --- | --- | --- |
| **queryable** | | | the return of `require('queryable')` |
| | `open();` | <span style="color:#080">implemented</span> | returns db_object |
| | `useGzip(boolean);` | <span style="color:#080">implemented</span> | force use of gzip. Useful for gzipped files lacking '.gz' extension; defaults to false |
| **db_object** | | | the return of `queryable.open()` |
| | save() | <span style="color:#080">implemented</span> | writes to current system (either file-system or browser) |
| | insert(vals_obj) | <span style="color:#080">implemented</span> | inserts vals_obj onto end of table; if vals_obj is an array, will treat contents as array of objects and insert each, one at a time |
| | update(match, newval) | <span style="color:#080">implemented</span> | finds rows that match `match` and set to `newval` |
| | find(match, callback) | <span style="color:#080">implemented</span> | returns db_result unless callback is present, then db_result passed to it |
| | distinct(string,clause) | <span style="color:#080">implemented</span> | finds all rows, eliminates duplicate values of certain key. `db.distinct('name')` or `db.distinct('name',{age:{$lt:35}})` |
| | remove() | <span style="color:#080">implemented</span> | `db.remove( {name:/[A-Z](.*)/} )"` |
| | get_json() | <span style="color:#080">implemented</span> | returns json string of entire db |
| | print(fmt) | <span style="color:#080">implemented</span> | spits out tabular json to stdout |
| | now() | <span style="color:#080">implemented</span> | returns Date().toISOString of the present moment; useful for date fields |
| | toDate(arg) | <span style="color:#080">implemented</span> | returns new Date(arg) |
| | count() | <span style="color:#080">implemented</span> | returns table length |
| **db_result** | | | |
| | sort() | <span style="color:#080">implemented</span> | &nbsp; |
| | limit(integer) | <span style="color:#080">implemented</span> | &nbsp; |
| | skip(integer) | <span style="color:#080">implemented</span> | intege |
| | count() | <span style="color:#080">implemented</span> | returns length of result set |
| | getArray() | <span style="color:#080">implemented</span> | &nbsp; |
| | get_json() | <span style="color:#080">implemented</span> | &nbsp; |
| | print(fmt) | <span style="color:#080">implemented</span> | debug print to stdout |

## Query Operators
| Name | Status | comment/example |
| --- | --- | --- |
| $gt | <span style="color:#080">implemented</span> | `db.find( {a:{$gt:5} );` |
| $gte | <span style="color:#080">implemented</span> | `db.find( {a:{$gte:100} );` |
| $in | <span style="color:#F70">not implemented</span> | selects the documents where a field equals any value in an array |
| $lt | <span style="color:#080">implemented</span> | |
| $lte | <span style="color:#080">implemented</span> | |
| $ne | <span style="color:#080">implemented</span> | Matches all values that are not equal to the value specified in the query `db.find( {a:{$ne:2},b{$ne:3}} ); // select * from table where (a != 2) && (b != 3)` | 
| $nin | <span style="color:#F70">not implemented</span> | |
| | | |
| $or | <span style="color:#080">implemented</span> | `db.find( {$or:[{n:1},{y:{$gte:3}}]} ) //return all results where (n == 1) or (y >= 3)` |
| $and | <span style="color:#F70">not implemented</span> | |
| $not | <span style="color:#F70">not implemented</span> | |
| $nor | <span style="color:#F70">not implemented</span> | |
| | | |
| $exists | <span style="color:#080">implemented</span> | `db.find( {name: {$exists:true} } ) // return all results where the name field exists` |
| $type | <span style="color:#F70">not implemented</span> | |
| | | |
| $mod | <span style="color:#800">no plans</span> | |
| $regex | <span style="color:#800">no plans</span> | |
| $text | <span style="color:#800">no plans</span> | |
| $where | <span style="color:#800">no plans</span> | &nbsp; |

## Update Operators
| Name | Status | comment/example |
| --- | --- | --- |
| $inc | <span style="color:#F70">not implemented</span> | Increments the value of the field by the specified amount. |
| $mul | <span style="color:#F70">not implemented</span> | Multiplies the value of the field by the specified amount. |
| $rename | <span style="color:#F70">not implemented</span> | Renames a field. |
| $setOnInsert | <span style="color:#F70">not implemented</span> | Sets the value of a field upon document creation during an upsert. Has no effect on update operations that modify existing documents. |
| $set | <span style="color:#080">implemented</span> | Sets the value of a field in an existing document. |
| $unset | <span style="color:#F70">not implemented</span> | Removes the specified field from an existing document. |
| $min | <span style="color:#F70">not implemented</span> | Only updates if the existing field value is less than the specified value. |
| $max | <span style="color:#F70">not implemented</span> | Only updates if the existing field value is greater than the specified value. |
| $currentDate | <span style="color:#080">implemented</span> | Use **db.now()** instead |


## In the Works

1. Better documentation (still working on it); Website (not quite yet).
 
2. Feature Roadmap: which features will be implemented next, roughly in order.
  * callbacks
  * $in and $nin
  * $unset (remove key from rows)
  * $rename (rename key in rows)
  * $not
  * update().limit()
  * remove().limit()

3. Sample projects built on queryable demonstrating features and functionality.
  * [Arcane Vocabulary Tutor](http://lit-tundra-5131.herokuapp.com/)
  * [basic browser example](https://raw.githubusercontent.com/gmn/queryable/master/examples/browser.html)


## Contact 

Mail: greg@naughton.org for questions, comments, bugs
