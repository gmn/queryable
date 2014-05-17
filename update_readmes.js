// this script updates the readme attribute of the package.json, from README.md

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
// write readme and diff against it, then remove it
var pkg_readme = './1234wxyz_tmp.txt';

var finish_callback = function(s) { 
  process.stdout.write(s); 
  fs.unlinkSync( pkg_readme ); 

  if ( s.trim().length > 0 ) {
    // write newer package.json using README.md 
    process.stdout.write( "writing: \"backup.package.json\"\n" );
    fs.writeFileSync('backup.package.json',f,{encoding:'utf8'});
    o.readme = README;
    process.stdout.write( "overwriting: \"package.json\"\n" );
    fs.writeFileSync( "package.json", JSON.stringify(o,null,'  '), {encoding:'utf8'} );
  } else {
    process.stdout.write( "no change\n" );
  }
};

// write file to diff
fs.writeFileSync( pkg_readme, packageREADME, {encoding:'utf8'} );

// do diff and then finish
system( finish_callback, "diff README.md " + pkg_readme );

