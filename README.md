Queryable JS
------------

Queryable - A tiny, single file database written in Javascript, that emulates a functional subset of mongodb commands. It works in both browser and server. The database itself is stored as a json string. Unlike mongo there are no collections; a separate db is simply returned by each call to open(). Essentially, queryable facilitates structured querying of an array of objects.


## Examples

### Some examples of using queryable.js in node.js:

```js
var queryable = require( 'queryable' );

// There are multiple ways to open a db.
// The simplest is to provide a full path to where you want your database file.
var db = queryable.open( "~/code/mydata.db" );

// ..or you can simply name it, which will start an empty db with this name:
var db = queryable.open( "Database_Name" ); 

// You can load from a json object that is an Array of Objects.
var db = queryable.open( {db_name:"name",data: [{key:val,key2:val2},{key:val},...] } );

// insert any type of key:value pairs you want
db.insert( {key:"keys can be Anything", comment:"fields don't have to match"} );

// Like collections, many independent db can be open at the same time
var db2 = queryable.open( "~/another.db" );

// It handles any value types
db2.insert( {subarray:[1,2,'buckle',{'my':'shoe'}]} );

// find() works like Mongo; RegExp's are fine
var res = db.find( {key:/regex/} );

// SELECT * WHERE (age = 40);
var res = db.find( {age:40} );

// all rows where age is over 40
// supports: $gt, $lt, $gte, $lte, $ne, $exists
var res = db.find( {age: {'$gt':40}} );

// the first 10 rows where age is over 40 and 'name' exists, sorted by name
var res = db.find({age:{$gt:40},name:{'$exists':true}}).sort({name:1}).limit(10);

// find() returns db_result, which has a length property and rows[] array
// as well as chainable methods like: .sort(), .limit(), .skip(), ..
console.log( 'got ' + res.length + ' rows' );


/*
 * a real example - populate from string
 */
// literal data can be a string or an object 
var json_string = '[
  {"name":"Cathy"},
  {"name":"Carol","sex":"f"},
  {"name":"John","sex":"m"},
  {"name":"Cornelius","sex":"m"}]';

var queryable = require('queryable');

var db = queryable.open({db_name:"MyDatabase",data:json_string}); 

// delete a row
db.remove({name:'Cathy'});

// get names that start with 'C'
db.find({name:/^C/}, function(res) {
  console.log( db.db_name + ' contains these names that start with C:' );
  res.rows.forEach(function(x){
    console.log(' ' + x.name);
  });
});

/* outputs:
MyDatabase contains these names that start with C:
 Carol
 Cornelius
*/
```

Callbacks work now too (finally):

```js
  db.distinct('name',{age:{$lte:35}},function(res) {
    res.rows.forEach(function(row){
      console.log( row.name );
    });
  });
```

See the 'examples' folder for more examples of usage.

## Install
To install using npm: 

```
npm install queryable
```
To install in your project, appending to your project's `package.json`: 

```
npm install queryable --save
```

To install using git:

```
~$ git clone https://github.com/gmn/queryable.git
```

## Test

To run unit-tests: 

```
npm test
```


## API

### The queryable.open() function
There are essentially 3 forms of open(): no args, a single string, a single object. The most concise way to specify what you want is to use a `config` object, and specify each param individually. Failing that, merely providing a fullpath string, where you want your database to live, is sufficient in most cases.

#### queryable.open()
* `db_name` = defaults to '*test.db*' in node, '*queryable*' in web browser
* `db_dir`  = default is current working directory: (eg. /home/kooldude)
* `db_path` = concatenation of: (db_dir + db_name) (eg. /home/kooldude/test.db)

#### queryable.open(string)
* First it tries string as a fullpath; if file is found: `db_name`, `db_dir`, and `db_path` are set.
* If a file isn't found, it tries string as a directory where it will create the database using the default `db_name`.
* If it isn't a directory or an existing file, string is assumed to be a fullpath where the file will be saved to. `db_path`, `db_dir`, and `db_name` are set from that.

#### queryable.open(object)
If argument is an object, these configuration variable are looked for in it:
* **db_name**       If none supplied, it either takes one from db_path or defaults to '*queryable*' or '*test.db*' in the browser or in node respectively.
* **db_path**       The fullpath where the database lives. Irrelevant in the browser. The database file is written to db_path everytime save() is called, and read from it in open() if an existing file is discovered at the location.
* **db_dir**        Defaults to current working directory if db_path or db_dir are not supplied.
* **use_gzip**      Can manually specify file is of type gzip. This is useful for files lacking the '.gz' extension. Note: currently gzbz must be present for this to work.
* **data**          If this is set, the database can be populated outright by an argument to data. data can be string or json. It must be in the form of an **Array of Zero or More Objects of Any Kind**.


## Full List of Commands

### Supported Methods
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

### Query Operators
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

### Update Operators
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
  * [X] callbacks
  * [] .findOne() 
  * [] better documentation for update() 
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
  * [Simple Browser Example](http://naughton.org/queryable-demo/) (sourceode [here](https://raw.githubusercontent.com/gmn/queryable/master/examples/browser.html))
  * [Arcane Vocabulary Tutor](http://lit-tundra-5131.herokuapp.com/)


## License
(The MIT License)

Copyright 2014 Greg Naughton. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## Contact 
Mail: greg@naughton.org for questions, comments, bugs
