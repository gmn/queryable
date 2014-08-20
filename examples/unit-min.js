
//---------------------------------------------------------------
function UnitTest() {
    this.num_tests = 0;
    this.num_failed = 0;
    this.fs = require('fs');
    var that = this;
}

UnitTest.prototype = {
    stringify: JSON.stringify,
    p: function(s) { console.log(s); },
    po: function(s) { process.stdout.write(s); },
    exe: function(str) { this.p(' '+ str + ' --> ' + eval(str) ); },

    ob_eq: function ( A, B ) {
        return this.stringify(A) === (B + '').trim();
    },

    test: function(str,ans) { 
        ++this.num_tests;
        this.po( "test: \"" + str + '" => '+ans );
        var ret = eval(str);
        if ( this.ob_eq( ret, ans ) ) {
            this.p( " -- Passed" );
        } else {
            this.p( " -- Failed \n"+ans+"\n"+this.stringify(ret) );
            ++this.num_failed;

            var debug = function() {
                eval(str);
            };
            debug();
        }
    },

    // dont evaluate, just compare
    testEq: function(str,ans) {
        ++this.num_tests;
        this.po( "test: \"" + str + '" => '+ans );
        if ( typeof str !== "String" && isNaN(str) )
            str = this.stringify(str);
        if ( str === ans ) {
            this.p( " -- Passed" );
        } else {
            this.p( " -- Failed \n"+ans+"\n"+str );
            ++this.num_failed;
        }
    },

    report: function() {
        this.p( "\n=======================\n * " + this.num_tests + " tests passed successfully" );
        if ( this.num_failed > 0 ) 
            this.p( " ** There were "+this.num_failed+" errors!!!" );
        this.p( "=======================\n" );
    }
};
//---------------------------------------------------------------

debugger;

var db_name = "QUERYABLE-UNITTEST.db";
var U = new UnitTest();
process.on('exit',function() { U.report(); });

if ( U.fs.existsSync( db_name ) ) {
    U.p( '"'+db_name+'" found. Removing...' );
    U.fs.unlink( db_name );
}

var i = 0;
var e = U.fs.existsSync( db_name );
while ( e ) {
    if ( i++ >= 10 ) 
        break;
    e = U.fs.existsSync( db_name );
}
if ( U.fs.existsSync( db_name ) === false ) {
    U.p( '"'+db_name+'" doesn\'t exist. creating...' );
}
else
    U.p( "STILL EXISTS" );

var queryable = require('../queryable.min.js');
var db = queryable.open( db_name );

U.p( "\nPATHS: " );

U.p( "\nINSERT TESTS:" );
U.test( "db.insert({a:1})", 1 );
U.test( "db.insert([{a:2,b:2},{a:3,b:3,c:3}])", 2 );
U.test( "db.insert({a:4,b:4,c:4,d:4})", 1 );
U.test( "db.insert([{b:5,c:5,d:5},{c:6,d:6},{c:7}])", 3 );

U.p( "\nFIND TESTS:" );
U.p( "simple find:" );
U.test( "db.find({a:1})", '{"length":1,"rows":[{"_id":1,"a":1}]}' );
U.p( "simple $gt:" );
U.test( "db.find({b:{'$gt':4}})", '{"length":1,"rows":[{"_id":5,"b":5,"c":5,"d":5}]}' );
U.p( "simple $lt:" );
U.test( "db.find({b:{'$lt':4}})", '{"length":2,"rows":[{"_id":2,"a":2,"b":2},{"_id":3,"a":3,"b":3,"c":3}]}' );
U.p( "simple $gte:" );
U.test( "db.find({b:{'$gte':4}})", '{"length":2,"rows":[{"_id":4,"a":4,"b":4,"c":4,"d":4},{"_id":5,"b":5,"c":5,"d":5}]}' );
U.p( "simple $lte:" );
U.test( "db.find({b:{'$lte':4}})", '{"length":3,"rows":[{"_id":2,"a":2,"b":2},{"_id":3,"a":3,"b":3,"c":3},{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );
U.p( "reverse sort, numeric:" );
U.test( "db.find({b:{'$gte':4}}).sort({'_id':-1})", '{"length":2,"rows":[{"_id":5,"b":5,"c":5,"d":5},{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );
U.test( "db.insert({name:'Paul'})", 1 );
U.test( "db.insert({name:'Carol'})", 1 );
U.test( "db.insert({name:'Zach'})", 1 );

U.p( "\nALPHABETICAL SORT:" );
U.test( "db.find({name:/(.*)/}).sort({name:1})", '{"length":3,"rows":[{"_id":9,"name":"Carol"},{"_id":8,"name":"Paul"},{"_id":10,"name":"Zach"}]}' );
U.p( "$exists:true:" );
U.test( "db.find({name:{'$exists':true}}).sort({name:-1})", '{"length":3,"rows":[{"_id":10,"name":"Zach"},{"_id":8,"name":"Paul"},{"_id":9,"name":"Carol"}]}' );
U.p( "\n$exists:false && $exists:false:" );
U.test( "db.find({name:{'$exists':false},'a':{'$exists':false},'b':{'$exists':false}}).sort({_id:-1})", '{"length":2,"rows":[{"_id":7,"c":7},{"_id":6,"c":6,"d":6}]}' );

U.p( "\nAND $exists:true:" );
U.test( "db.find({a:{$exists:true},b:{$exists:true},c:{$exists:true},d:{$exists:true}})", '{"length":1,"rows":[{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );
U.p( "\nOR:" );
U.test( "db.find({$or:[{d:{$exists:true}},{c:{$exists:true}}]}).sort({_id:-1})", '{"length":5,"rows":[{"_id":7,"c":7},{"_id":6,"c":6,"d":6},{"_id":5,"b":5,"c":5,"d":5},{"_id":4,"a":4,"b":4,"c":4,"d":4},{"_id":3,"a":3,"b":3,"c":3}]}' );

U.p( "\nAND CONDITIONAL:" );
U.test( "db.find({b:{$gt:3},c:{$lte:5},d:{$lt:6},b:{$gte:5}})", '{"length":1,"rows":[{"_id":5,"b":5,"c":5,"d":5}]}' );

U.p("\n\n==========================");
U.p( JSON.stringify(db.find()) );
U.p("==========================\n\n");


U.p( "\nNOT-EQUAL::" );
U.test( "db.find({b:{$ne:4}})", '{"length":9,"rows":[{"_id":1,"a":1},{"_id":2,"a":2,"b":2},{"_id":3,"a":3,"b":3,"c":3},{"_id":5,"b":5,"c":5,"d":5},{"_id":6,"c":6,"d":6},{"_id":7,"c":7},{"_id":8,"name":"Paul"},{"_id":9,"name":"Carol"},{"_id":10,"name":"Zach"}]}' );
U.test( "db.find({b:{$ne:5}})", '{"length":9,"rows":[{"_id":1,"a":1},{"_id":2,"a":2,"b":2},{"_id":3,"a":3,"b":3,"c":3},{"_id":4,"a":4,"b":4,"c":4,"d":4},{"_id":6,"c":6,"d":6},{"_id":7,"c":7},{"_id":8,"name":"Paul"},{"_id":9,"name":"Carol"},{"_id":10,"name":"Zach"}]}' );
U.test( "db.find({a:{$ne:3},b:{$ne:2},c:{$ne:6}})", '{"length":7,"rows":[{"_id":1,"a":1},{"_id":4,"a":4,"b":4,"c":4,"d":4},{"_id":5,"b":5,"c":5,"d":5},{"_id":7,"c":7},{"_id":8,"name":"Paul"},{"_id":9,"name":"Carol"},{"_id":10,"name":"Zach"}]}' );



U.p( "\nOR CONDITIONAL:" );
U.test( "db.find( {a:{$exists:true},b:{$lt:3},a:{$gte:1} } )", '{"length":1,"rows":[{"_id":2,"a":2,"b":2}]}' );
U.test( "db.find( {b:{$gt:4},c:{$gte:5},d:{$lte:6}})", '{"length":1,"rows":[{"_id":5,"b":5,"c":5,"d":5}]}' );
U.test( "db.find( {a:3,b:{$gt:2},c:{$lt:7}} )", '{"length":1,"rows":[{"_id":3,"a":3,"b":3,"c":3}]}' );

U.p( "\nAND/OR CONDITIONAL COMBINED:" );
U.test( "db.find( { c:{$lt:6}, $or: [{a:{$gt:5}},{b:{$lte:4}}] } )", '{"length":2,"rows":[{"_id":3,"a":3,"b":3,"c":3},{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );

U.p( "\nREMOVE: ");
U.test( "db.remove( {name:/[A-Z](.*)/} )", 3 );
U.test( "db.find().count()", 7 );
U.test( "db.remove( {a:{$gt:1},b:{$gt:2},c:{$exists:true},d:{$exists:false}} )", 1 );
U.test( "db.count()", 6 ); // count can be called from db object or result object
U.test( "db.remove( {c:{$exists:true}} )", 4 );

U.p( "\nUPDATE: ");
U.test( "db.update( {b:{$exists:true}}, {$set:{awesome:true}}, {multi:true} )", 1 );
U.test( "db.update( {}, {$set:{everything:1}}, {multi:true} )", 2 );
U.p(db.get_json());
U.test( "db.update( {not:'here'}, {$set:{put:'anyway'}}, {upsert:true} )", 1 );
U.p(db.get_json());

U.p( "\nLIMIT: ");
U.test( "db.remove()", 3 );

var names = ["Dan","Fred","Amy","Ivette","Justin","Phoebe"];
for ( var i = 0; i < 100; i++ ) {
    db.insert( {person_id:1000+i,name:names[Math.floor(Math.random()*names.length)]} );
}
var ph = 0;
names.forEach(function(n){
    var r = db.find({name:n}).count();
    U.p( ' --> adding: '+ n + ' ' + r );
    if ( n === "Phoebe" ) ph = r;
});
for ( var lim = 0; lim <= ph+1; lim++ ) {
    if ( lim === ph+1 )
        U.test( "db.find( {name:'Phoebe'} ).limit("+lim+").count()", lim-1 );
    else
        U.test( "db.find( {name:'Phoebe'} ).limit("+lim+").count()", lim );
}

/*
    SKIP
*/

U.p( "\nSKIP: ");
db.remove(); 
var A = [];
for ( A = [], i = 0; i < 100; i++ ) {
    A.push({'i':i});
}
db.insert(A);
U.test("A=[];db.find().skip(40).limit(20).rows.forEach(function(o){A.push(o['i']);});A;", '[40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59]' );

/*
    DISTINCT
*/
U.p( "\nDISTINCT: " );
db.remove();
U.test( "db.find()" , '{"length":0,"rows":[]}' );
db = queryable.open();
db.insert( {tableName:'whatever'} );
A = [];
for ( A = [], i = 0; i < 4; i++ ) {
    A.push( {'a': i%2} );
}
db.insert(A);
U.test("db.find();",'{"length":5,"rows":[{"_id":1,"tableName":"whatever"},{"_id":2,"a":0},{"_id":3,"a":1},{"_id":4,"a":0},{"_id":5,"a":1}]}');
U.test("db.distinct('a');",'{"length":2,"rows":[{"_id":2,"a":0},{"_id":3,"a":1}]}');
db.insert([{'a':2},{'a':3}]);
U.test("db.distinct('a',{'a':{$lt:1}});",'{"length":1,"rows":[{"_id":2,"a":0}]}');
U.test("db.distinct('a',{$or:[{'tableName':{$exists:true}},{'a':{$lt:1}}]});",'{"length":1,"rows":[{"_id":2,"a":0}]}');
U.test("db.distinct('a',{$or:[{'tableName':{$exists:true}},{'a':{$gte:2}}]});",'{"length":2,"rows":[{"_id":6,"a":2},{"_id":7,"a":3}]}');
db.insert([{'a':2},{'a':3}]);
U.test("db.distinct('a',{$or:[{'tableName':{$exists:true}},{'a':{$gte:2}}]});",'{"length":2,"rows":[{"_id":6,"a":2},{"_id":7,"a":3}]}');
var db4 = queryable.open( {data:[{n:'jared'},{n:'martha'},{n:'jim'},{n:'nolan'},{n:'jim'},{n:'jared'}]});
U.test("db4.distinct('n',{n:/^j/});", '{"length":2,"rows":[{"_id":1,"n":"jared"},{"_id":3,"n":"jim"}]}' );

/*
CALLBACKS
*/
U.p("\nCALLBACKS:");
// FIND
db.find(null, function(res) {
  U.testEq( res, '{"length":9,"rows":[{"_id":1,"tableName":"whatever"},{"_id":2,"a":0},{"_id":3,"a":1},{"_id":4,"a":0},{"_id":5,"a":1},{"_id":6,"a":2},{"_id":7,"a":3},{"_id":8,"a":2},{"_id":9,"a":3}]}' );
});

db.remove();
db.find(null, function(res) {
  U.testEq( res, '{"length":0,"rows":[]}' );
});

// INSERT
db = queryable.open();
for ( var i = 0; i < 4; i++ ) {
  db.insert( {k:i}, function(res) {
      U.testEq(res, 1);
  } );
}

// UPDATE
db.update( {k:0}, {$set:{k:4}}, null, function(res) {
  U.testEq(res, 1);
});

// DISTINCT
db.distinct( 'k', null, function(res) {
  U.testEq(res, '{"length":4,"rows":[{"_id":1,"k":4},{"_id":2,"k":1},{"_id":3,"k":2},{"_id":4,"k":3}]}' );
});
db.distinct( 'k', {k:{$gt:2}}, function(res) {
  U.testEq(res, '{"length":2,"rows":[{"_id":1,"k":4},{"_id":4,"k":3}]}' );
});

// REMOVE
db.remove( {k:{$gt:0}}, function(res) {
  U.testEq( res, 4 );
});
