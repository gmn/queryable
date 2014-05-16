
var fs = require('fs');
var f = fs.readFileSync('package.json',{encoding:'utf8'});
var o = JSON.parse(f);
var packageREADME = o.readme;
var README = fs.readFileSync('README.md',{encoding:'utf8'});

/// expecting a CALLBACK(), and, space-separated string like an actual commandline
function system( callback, commandline )
{
  if ( arguments.length < 2 )
    return;

  var args = '';
  for ( var i = 1; i < arguments.length; i++ ) {
    if ( arguments[i] instanceof Array )
      args += ' ' + arguments[i].join(' ');
    else
      args += ' ' + arguments[i];
  }
  args = args.trim().split(/\s+/);
  
  var res = [];
  var spawn = require('child_process').spawn;
  var child = spawn( args[0], args.slice(1), { env: process.env });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', function (data) {
      res.push( data );
  });

  child.stderr.on('data', function (data) {
      process.stdout.write( 'stderr: ' + data );
  });

  child.on('close', function (code) {
      //return callback( JSON.stringify(res) );
      return callback(res.join(' ')); 
  });
}
var p = function(s) { process.stdout.write(s); };
//system( p, 'ls -ltr' );

//var cmd = JSON.parse('["' + packageREADME + '"]');
//process.stdout.write( cmd );

fs.writeFileSync( "package.json.README", packageREADME, {encoding:'utf8'} );
var cmd = "diff README.md package.json.README";
system( p, cmd );

// write package.json with README.md for o.readme
o.readme = README;
fs.writeFileSync( "package.json.newer", JSON.stringify(o,null,'  '), {encoding:'utf8'} );
