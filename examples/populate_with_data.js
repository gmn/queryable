
var queryable = require( '../queryable.js' );
var s = '[{"name":"Cathy"},{"name":"Carol","sex":"f"},{"name":"John","sex":"m"}]';
var o = JSON.parse( s );
var db = queryable.open( {"data":s} );
console.log( "populating from String:" );
db.print(1);

db.find(/.*/).sort( {"name":-1} ).print(3);
console.log( "\npopulating from Object: " );

db = queryable.open( {"data":o} );
db.print("\t");
db.find({sex:{$exists:true}}).sort( {"sex":-1} ).print();

//--------------- populate entire object from config --------------
var o = {"db_name":"GregsDB","data":'[{"name":"greg","age":41},{"name":"Ivette","age":35},{"name":"Tucker","age":36}]'};

var db = queryable.open(o);

var r = db.find(/.*/);
r._data.forEach(function(i){
    console.log(i.name + ' ' + i.age);
});
