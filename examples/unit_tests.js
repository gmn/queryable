
//---------------------------------------------------------------
function UnitTest() {
    this.num_tests = 0;
    this.num_failed = 0;
    this.fs = require('fs');
    var that = this;
//    process.on('exit',function() { this.report(); });
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
                debugger;
                eval(str);
            };
            debug();
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
//console.log(e.toString()+' '+i);

if ( U.fs.existsSync( db_name ) === false ) {
    U.p( '"'+db_name+'" doesn\'t exist. creating...' );
}
else
    U.p( "STILL EXISTS" );

//process.exit(0);

var queryable = require('../queryable');
var db = queryable.open( db_name );
//db.save();

U.p( "\nPATHS: " );

U.p( "\nINSERT TESTS:" );
U.test( "db.insert({a:1})", 1 );
U.test( "db.insert({a:2,b:2})", 2 );
U.test( "db.insert({a:3,b:3,c:3})", 3 );
U.test( "db.insert({a:4,b:4,c:4,d:4})", 4 );
U.test( "db.insert({b:5,c:5,d:5})", 5 );
U.test( "db.insert({c:6,d:6})", 6 );
U.test( "db.insert({c:7})", 7 );

U.p( "\nFIND TESTS:" );
U.p( "simple find:" );
U.test( "db.find({a:1})", '{"length":1,"_data":[{"_id":1,"a":1}]}' );
U.p( "simple $gt:" );
U.test( "db.find({b:{'$gt':4}})", '{"length":1,"_data":[{"_id":5,"b":5,"c":5,"d":5}]}' );
U.p( "simple $lt:" );
U.test( "db.find({b:{'$lt':4}})", '{"length":2,"_data":[{"_id":2,"a":2,"b":2},{"_id":3,"a":3,"b":3,"c":3}]}' );
U.p( "simple $gte:" );
U.test( "db.find({b:{'$gte':4}})", '{"length":2,"_data":[{"_id":4,"a":4,"b":4,"c":4,"d":4},{"_id":5,"b":5,"c":5,"d":5}]}' );
U.p( "simple $lte:" );
U.test( "db.find({b:{'$lte':4}})", '{"length":3,"_data":[{"_id":2,"a":2,"b":2},{"_id":3,"a":3,"b":3,"c":3},{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );
U.p( "reverse sort, numeric:" );
U.test( "db.find({b:{'$gte':4}}).sort({'_id':-1})", '{"length":2,"_data":[{"_id":5,"b":5,"c":5,"d":5},{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );
U.test( "db.insert({name:'Paul'})", 8 );
U.test( "db.insert({name:'Carol'})", 9 );
U.test( "db.insert({name:'Zach'})", 10 );
U.p( "\nALPHABETICAL SORT:" );
U.test( "db.find({name:/(.*)/}).sort({name:1})", '{"length":3,"_data":[{"_id":9,"name":"Carol"},{"_id":8,"name":"Paul"},{"_id":10,"name":"Zach"}]}' );
U.p( "$exists:true:" );
U.test( "db.find({name:{'$exists':true}}).sort({name:-1})", '{"length":3,"_data":[{"_id":10,"name":"Zach"},{"_id":8,"name":"Paul"},{"_id":9,"name":"Carol"}]}' );
U.p( "\n$exists:false && $exists:false:" );
U.test( "db.find({name:{'$exists':false},'a':{'$exists':false},'b':{'$exists':false}}).sort({_id:-1})", '{"length":2,"_data":[{"_id":7,"c":7},{"_id":6,"c":6,"d":6}]}' );

U.p( "\nAND $exists:true:" );
U.test( "db.find({a:{$exists:true},b:{$exists:true},c:{$exists:true},d:{$exists:true}})", '{"length":1,"_data":[{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );
U.p( "\nOR:" );
U.test( "db.find({$or:[{d:{$exists:true}},{c:{$exists:true}}]}).sort({_id:-1})", '{"length":5,"_data":[{"_id":7,"c":7},{"_id":6,"c":6,"d":6},{"_id":5,"b":5,"c":5,"d":5},{"_id":4,"a":4,"b":4,"c":4,"d":4},{"_id":3,"a":3,"b":3,"c":3}]}' );

U.p( "\nAND CONDITIONAL:" );
U.test( "db.find({b:{$gt:3},c:{$lte:5},d:{$lt:6},b:{$gte:5}})", '{"length":1,"_data":[{"_id":5,"b":5,"c":5,"d":5}]}' );

U.p( "\nOR CONDITIONAL:" );
U.test( "db.find( {a:{$exists:true},b:{$lt:3},a:{$gte:1} } )", '{"length":1,"_data":[{"_id":2,"a":2,"b":2}]}' );
U.test( "db.find( {b:{$gt:4},c:{$gte:5},d:{$lte:6}})", '{"length":1,"_data":[{"_id":5,"b":5,"c":5,"d":5}]}' );
U.test( "db.find( {a:3,b:{$gt:2},c:{$lt:7}} )", '{"length":1,"_data":[{"_id":3,"a":3,"b":3,"c":3}]}' );

U.p( "\nAND/OR CONDITIONAL COMBINED:" );
U.test( "db.find( { c:{$lt:6}, $or: [{a:{$gt:5}},{b:{$lte:4}}] } )", '{"length":2,"_data":[{"_id":3,"a":3,"b":3,"c":3},{"_id":4,"a":4,"b":4,"c":4,"d":4}]}' );

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
for ( var A =[], i = 0; i < 100; i++ ) {
    A.push({'i':i});
}
db.insert(A);
U.test("A=[];db.find(/.*/).skip(40).limit(20)._data.forEach(function(o){A.push(o['i']);});A;", '[40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59]' );

/*
    DISTINCT
*/
U.p( "\nDISTINCT: " );

