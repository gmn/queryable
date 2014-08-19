
var p = function(s) { console.log(s); };
var json = JSON.stringify;
var queryable = require('../queryable');
var db = queryable.open();
db.insert( [{movie:"Jaws",director:"Stephen Spielberg"},{movie:"Stalker",director:"Andrej Tarkovski",rating:"5/5"},{movie:"Caddy Shack",rating:"4/5"}] );

var res = db.find();
p(json(res));

res = db.find( {director:{$exists:true}} );
p("\n// director exists true\n"+json(res));

res = db.find( {director:{$exists:false}} );
p("\n// director exists false\n"+json(res));

res = db.find( {rating:{$exists:true}} );
p("\n// rating exists true\n"+json(res));

res = db.find( {rating:{$exists:false}} );
p("\n// rating exists false\n"+json(res));
