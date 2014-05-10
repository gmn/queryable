# Queryable JS

Queryable - A tiny, self-contained, single file database, written in pure Javascript, which aims to support a functional subset of MongoDB-like commands. It works seamlessly in both the client (browser) and the server (node.js).  Just include it in your project and go.  The database format is stored as human-readable JSON, one file per each database.

## Examples

To use queryable.js in node.js, simply do:
```js
var queryable = require( 'queryable' );     // or path to JS

var db = queryable.open( path_to_db );      // ** There are multiple ways 
                                            //    to open a db, but the 
                                            //    simplest is a string:  

db.insert( {key:"Anything you want"} );     //    the path and filename to where you want it. Eg.: "/tmp/my_data.db"

var db2 = queryable.open( "another.db" );   // ** Multiple databases can be opened at once; each is fully independent.
db2.insert( {subarray:[1,2,'buckle',{'my':'shoe'}]} );

var result = db.find( /regex/ );            // ** Find() command works like MongoDB
                                            // ** Returns db_result, which has a length property and _data[] array
                                            //    as well as chainable methods like: .sort(), .limit(), .skip(), ..
```
See examples in the 'examples' folder.


## In the Works

1. Better documentation; Website.
 
2. Feature Roadmap: which features will be implemented next, roughly in order.

3. Sample projects built on queryable demonstrating features and functionality.


## Contact 

Mail: greg AT naughton.org for questions, comments
