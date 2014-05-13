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


## In the Works

1. Better documentation; Website.
 
2. Feature Roadmap: which features will be implemented next, roughly in order.

3. Sample projects built on queryable demonstrating features and functionality.


## Contact 

Mail: greg@naughton.org for questions, comments, bugs
