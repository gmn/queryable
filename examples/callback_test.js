// utility
var p = function(s) { console.log(s); };

var queryable = require( '../queryable.js' );
var db_name = './callback_test_db.json';
var db = queryable.open( db_name );

// these methods accept callbacks

// - db.insert()
db.insert( [
  {president:"George Washington",took_office:1789},
  {president:"John Adams",took_office:1797},
  {president:"Thomas Jefferson",took_office:1801},
  {president:"James Madison",took_office:1809}
], function(res) {
  p( "inserted " + res + ' rows' );
});

// this will fail
try {
  db.insert( "a string", function(res) {
    p( "inserted " + res + ' rows' );
  });
} catch(e) {
  p( e );
}
// so will this fail
try {
  db.insert( [{row1:1},{row2:1},"not-object"], function(res) {
    p( "inserted " + res + ' rows' );
  });
} catch(e) {
  p( e );
}
// so will this fail
try {
  db.insert( {row1:1},{row2:1}, function(res) {
    p( "inserted " + res + ' rows' );
  });
} catch(e) {
  p( e );
}

// - db.save()
try {
  db.save( function(res) {
    p( "save() returned " + res );
  });
} catch(e) {
  p( e );
}

// - db.find()
db.find( {president:{$exists:true},took_office:{$lte:1801}}, function(res) {
    if ( res.length === 0 ) {
        p( "no rows" );
    } else {
      p( "got " + res.length + ' rows' );
      res.rows.forEach( function( row ) {
          p( row.president + "\t" + row.took_office );
      });
    }
});
  
// - db.update()
db.update( {president:"Bob Dylan"}, {$set:{president:"Bob Dylan", took_office:1965}}, {upsert:true}, function(res) {
    p( res + ' row(s) updated' );
    p( JSON.stringify(db.master) );
});

// - db.distinct()
db.distinct( 'president', null, function(res) {
    p( JSON.stringify(res) );
});

// - db.remove
db.remove( {president:{$exists:false}}, function(res) {
    p( "remove returned: " + res );
    p( JSON.stringify(db.master) );
});



// cleanup
var fs = require('fs');
fs.unlink( db_name );
