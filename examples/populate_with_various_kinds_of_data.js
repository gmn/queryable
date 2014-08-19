
// a string
var str = '[{"name":"Cathy"},{"name":"Carol","sex":"f"},{"name":"John","sex":"m"}]';

// an object
var obj = [{"name":"Cathy"},{"name":"Carol","sex":"f"},{"name":"John","sex":"m"}];

var queryable = require( '../queryable.js' );

// open, populating (loading) from a string
var db = queryable.open( {"data":str} );

console.log( "populating from String:" );
db.print(1);
db.find().sort( {"name":-1} ).print(3);

// 
console.log( "\npopulating from Object: " );

db = queryable.open( {"data":obj} );
db.print("\t");
db.find({sex:{$exists:true}}).sort( {"sex":-1} ).print();

//--------------- populate entire object from config --------------
obj = {"db_name":"MyCrazyDBName","data":[{"name":"Greg","age":41},{"name":"Ivette","age":35},{"name":"Tucker","age":36}]};
db = queryable.open(obj);
console.log( "Database name is: " + db.db_name + ' and has these people in it:' );
db.find().rows.forEach(function(i){
    console.log(' -> ' + i.name + ' - ' + i.age);
});
