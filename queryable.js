/**
    queryable.js    

    A tiny, self-contained, single file database parser that
    uses clear-text, human readable JSON for storage. 
    It supports a small, useful subset of MongoDB-like commands.

    The DB is a array of objects, which are stored as a 
    plaintext JSON string. It works in both node and the browser. 
    Its main difference from Mongo is that there are no collections.
    There is a queryable object, which is used for creating db_objects.
    You can have as many db_objects as you like, but have to keep 
    track of them yourself.

                            (c) 2014 
                          Greg Naughton
                        greg@naughton.org
                      https://github.com/gmn

    For more details, documentation, new releases and code see:
      https://github.com/gmn/queryable 
*/

(function(queryable) 
{
    'use strict';

    //////////////////////////////////////////////////
    //
    // utility functions, internal
    //

    var p = function(s) { console.log(s); };

    function type_of( t ) {
        var s = typeof t;
        switch( s ) {
        case "object":
            if ( t instanceof Date ) {
                return "date";
            }
            else if ( t instanceof Array ) {
                return "array";
            }
            else if ( t instanceof RegExp ) {
                return "regexp";
            }
        default:
            return s;
        }
    }

    function classof(o) {
        if (o === null) return "Null";
        if (o === undefined) return "Undefined";
        return Object.prototype.toString.call(o).slice(8,-1);
    }

    function detect_platform() {
        var platform = "unknown";
        try {
            if ( exports !== undefined )
                platform = "node_module";
        } catch(e) {
            try {
                if ( window !== undefined )
                    platform = "browser";
            } catch(e) {
            }
        }
        return platform;
    }

    function clip_all_leading(str, clip)
    {
        while ( str.length && str.charAt(0) === clip ) {
            str = str.substring(clip.length,str.length);
        }
        return str;
    }

    function _firstKey( O )
    {
        for ( var i in O ) {
            if ( O.hasOwnProperty(i) )
                return i;
        }
        return null;
    }

    // converts object {key1:val1,key2:val2,...} 
    // into array [{key:key1,value:val1},{key:key2,value:val2},...]
    // recurses, so: obj {key1:{key2:val2,key3:val3}} becomes:
    //  [{key:key1,value:[{key:key2,value:val2},{key:key3,value:val3}]}]
    function _getKeys( O ) 
    {
        var keys = [];
        if ( type_of(O) !== "object" )
            return null;
        for ( var i in O ) 
        {
            if ( O.hasOwnProperty(i) ) 
            {
                var _val = type_of(O[i]) === "object" ? 
                        _getKeys(O[i]) : O[i];

                if ( type_of(_val) === "array" && _val.length === 1 )
                    _val = _val[0]; // ditch the array if only 1 elt
                    
                keys.push( {key:i,value:_val} );
            }
        }
        return keys;
    }

    // takes an object and sorts it by its keys, alphabetically
    function sortObjectByKeys( O )
    {
        if ( typeof O !== "object" || (O instanceof Array) )
            return O;

        var keys = [];
        for ( var i in O ) {
            if ( O.hasOwnProperty(i) ) {
                keys.push( {key:i,value:O[i]} );
            }
        }
        if ( keys.length === 0 )
            return O;

        keys.sort( function(a,b) { return a.key < b.key ? -1 : 1; } );

        var nO = {};

        keys.forEach( function(item) {
            nO[item.key] = item.value;
        });

        return nO;
    }

    function addToFront( obj, _key, _value ) {
         if ( typeof obj !== "object" )
            return obj;

        // get existing keys
        var keys = [];
        for ( var key in obj ) {
            if ( obj.hasOwnProperty(key) ) {
                keys.push(key);
            }
        }

        // empty, return it
        if ( keys.length === 0 )
            return obj;

        var newObj = {};
        newObj[ _key ] = _value; // set in the front

        // now transfer the rest
        keys.forEach(function(key) {
            newObj[key] = obj[key];
        });
       
        return newObj;
    }

    // sorts in place
    function sortArrayOfObjectsByKeys( array_of_objs )
    {
        if ( type_of(array_of_objs) !== "array" )
            return array_of_objs;

        if ( array_of_objs.length === 0 )
            return array_of_objs;

        // sort each key
        array_of_objs.forEach(function(val,index,ary) {
            ary[index] = sortObjectByKeys(val);
        });

        // sort entire array by firstKey
        array_of_objs.sort(function(a,b){
            return _firstKey(a) < _firstKey(b) ? -1 : 1;
        });

        return array_of_objs;
    }


    //////////////////////////////////////////////////
    // 
    // Classes
    // 

    /**
     *
     * Class: db_result
     *
     */
    function db_result( arg ) 
    {
        this.length = 0;
        this.rows = [];

        // sort of a copy-constructor. If Array of Obj is passed in,
        //  we copy (not reference) it into rows
        if ( arguments.length === 1 && type_of(arg) === "array" ) 
        {
            for ( var i = 0, l = arg.length; i < l; i++ ) {
                this.push( arg[i] );
            }
        }
    }

    db_result.prototype = {
        push: function( O ) {
            if ( type_of(O) === "object" )
                this.rows.push(JSON.parse(JSON.stringify(O)));
            this.length = this.rows.length;
            return this;
        },

        /* 
         SELECT * FROM users WHERE status = "A" ORDER BY user_id ASC
           db.users.find( { status: "A" } ).sort( { user_id: 1 } )
         SELECT * FROM users WHERE status = "A" ORDER BY user_id DESC
           db.users.find( { status: "A" } ).sort( { user_id: -1 } ) 
        */
        sort: function( O ) {
            var key = _firstKey(O);
            var val = O[key];

            this.rows.sort(function(a,b) 
            {
                if ( !a[key] )
                    return -val;
                else if ( !b[key] )
                    return val;
                if ( typeof a[key] === "string" && typeof b[key] === "string" )
                    return a[key].localeCompare(b[key]) * val;
                else
                    return a[key] > b[key] ? val : -val;
            });

            return this;
        },

        limit: function( _l ) {
            var lim = Number(_l);
            if ( type_of(lim) !== "number" )
                return this;
            this.rows.splice( lim, this.rows.length - lim );
            this.length = this.rows.length;
            return this;
        },

        skip: function( s ) {
            var skp = Number(s);
            if ( type_of(skp) !== "number" )
                return this;
            this.rows.splice( 0, skp );
            this.length = this.rows.length;
            return this;
        },

        count: function() {
            return this.rows.length;
        },

        getArray: function() {
            return this.rows;
        },
        get_json: function(fmt) {
            if ( arguments.length === 0 )
                return JSON.stringify(this.rows);
            return JSON.stringify(this.rows,null,fmt);
        },
        print: function(fmt) {
            var f = arguments.length === 0 ? '  ' : fmt;
            console.log(this.get_json(f));
        }
    }; // db_result


    /**
     *
     * Class: db_object
     *  - returned by open()
     *  - contains entire database w/ accessor methods
     *
     */
    function db_object( config ) 
    {
        this.platform = config.platform;
        this.db_path = config.db_path;
        this.db_dir = config.db_dir;
        this.db_name = config.db_name;
        this.use_gzip = config.use_gzip || false;

        this.master = [];
        this._id = 0;


        // can populate db explicitly using a json string
        // - if {}.data set, will override the other loading methods 
        // - database will still save to named location, normally
        if ( config.data ) {
            if ( type_of( config.data ) == "array" ) 
                this.master = config.data ;
            else if ( type_of( config.data) == "string" )
                this.master = JSON.parse( config.data );
            else 
                console.log( "queryable: error: Could not determine input data type\n" );
            
            finish_db_setup.call(this);
        }

        //
        // read in db if it's there
        //
        // BROWSER
        else if ( this.platform === "browser" )
        {
            var name = this.db_name.trim();
            this.db_name = ( !name || name.length===0 || name === "test.db" ) ? 'queryable' : name;

            if ( window.localStorage && localStorage.hasOwnProperty( this.db_name ) ) {
                var string = localStorage[this.db_name];
                this.master = JSON.parse( string );
            }

            finish_db_setup.call(this);
        }

        // SERVER
        else if ( this.platform === "node_module" )
        {
            var fs = require('fs');

            // presence of .gz extension sets use_gzip
            if ( this.db_path.lastIndexOf('.gz') === this.db_path.length-3 ) 
                this.use_gzip = true;

            // if db_path exists, load it
            if ( fs.existsSync( this.db_path ) ) 
            {
                var was_gzip = false;

                // try to open with gzip; note: presence of gzbz is no longer guaranteed
                if ( this.use_gzip ) 
                {
                    try {
                        var gzbz = require('gzbz');
                        var gunzip = new gzbz.Gunzip;        
                        gunzip.init( {encoding:'utf8'} );
                        var gzdata = fs.readFileSync(this.db_path,{encoding:"binary",flag:'r'});
                        var inflated = gunzip.inflate( gzdata, "binary" );
                        gunzip.end();

                        // convert into master format
                        this.master = JSON.parse( inflated );
                        finish_db_setup.call(this);
                        return;
                    } catch(e) {
                        this.use_gzip = false;
                        console.log( "warning: tried to open as gzip without gzbz module present. Trying normal." );
                        was_gzip = true;
                    }
                }

                try {
                    // normal, no gzip
                    var data = fs.readFileSync(this.db_path,{encoding:"utf8",flag:'r'});

                    // convert into master format
                    this.master = JSON.parse( data );
                    finish_db_setup.call(this);
                } catch(e) {
                    var msg = 'error: "' + this.db_path + '" failed to open.';
                    console.log( msg );
                    process.exit(-1);
                }
            }
        }

        function finish_db_setup() 
        {
            if ( this.master.length > 0 ) 
            {
                // next _id is 1 greater than highest _id
                var highest = 0;
                var any_missing = false;
                this.master.forEach(function(row) {
                    if ( row['_id'] === undefined )
                        any_missing = true;
                    else if ( row['_id'] > highest ) {
                        highest = row['_id'];
                    }
                });

                // rows w/o _id need to have one added 
                if ( any_missing ) {
                    for ( var i = 0, l = this.master.length; i < l; i++ ) {
                        if ( this.master[i]['_id'] === undefined ) {
                            this.master[i] = addToFront( this.master[i], '_id', ++highest );
                        }
                    }
                }
            
                this._id = highest;
                
                // sort in place ?
                // - sort each object
                // ...
                // - sort by _id, ensuring consistent state of ascending _id
                this.master = this.master.sort(function(a,b){return a._id - b._id});
            }
        } // finish_db_setup
    }
    db_object.prototype = {

        //////////////////////////////////////////////////
        //
        // public methods
        //

        /**
         * save()
         * - return: true on successful write
         * - takes: 
         *    arg1 (Optional): filemode (String or Number), or Callback
         *    arg2 (Optional): callback function (optional)
         */
        save: function(arg1, arg2) 
        {
            var _mode = undefined;
            var callback = undefined;

            // sanity check arguments
            if ( arguments.length === 1 ) {
              if ( type_of(arg1) === "function" ) {
                  callback = arg1;
              } else {
                  var num = Number(arg1);
                  if ( !isNaN(num) ) {
                      _mode = num;
                  } else {
                      throw new Error("save: accepts 0, 1 or 2 arguments, eg.: save(), save(mode), save(mode,callback), or save(callback)" );
                  }
              }
            } else if ( arguments.length === 2 ) {
                if ( type_of(arg2) !== "function" )
                    throw new Error("save: usage: save(mode, callback)" );
                callback = arg2;

                var num = Number(arg1);
                if ( !isNaN(num) ) {
                    _mode = num;
                } else {
                    throw new Error("save: accepts 0, 1 or 2 arguments, eg.: save(), save(mode), save(mode,callback), or save(callback)" );
                }
            }


            if ( this.platform === "node_module" ) 
            {
                var mode = _mode || 438; // 0666;
                var fs = require('fs');

                // if parent application quits suddenly, write may be voided. 
                // writes must be ensured. perhaps a better way to do this?  Best possible case: 
                //  have both async writes and ensured writes, even on sudden process.exit() 
                var use_async = false;
                var gzip_lvl = 1; // 5 is middle. bias heavily towards speed since using gzip makes this I/O bound 

                if ( this.use_gzip ) {
                    try {
                        if ( use_async ) {
                            var ostream = fs.createWriteStream( this.db_path );                    
                            var zlib = require('zlib');
                            var Stream = require('stream');
                            var in_stream = new Stream();
                            in_stream.pipe(zlib.createGzip()).pipe(ostream);
                            in_stream.emit('data', JSON.stringify(this.master) );
                            in_stream.emit('end');
                        } else {
                            var gzbz = require('gzbz');
                            var gzip = new gzbz.Gzip();
                            gzip.init( {encoding:"binary", level: gzip_lvl /* 1<=level<=9 */} );
                            var gz1 = gzip.deflate( JSON.stringify(this.master) );
                            var gz2 = gzip.end(); // important to capture end!
                            var gzdata = gz1 + gz2;
                            fs.writeFileSync( this.db_path, gzdata, {encoding:"binary",mode:mode,flag:'w'} );
                        }
                        return this.__return( true, callback );
                    } catch(e) {
                        return this.__return( e, callback );
                    }
                }

                try {
                    fs.writeFileSync( this.db_path, JSON.stringify(this.master), {encoding:"utf8",mode:mode,flag:'w'} );
                } catch(e) {
                    throw new Error( "save: failed writing: \""+this.db_path+'" '+e.toString() );
                }

            } else if ( this.platform === "browser" ) {
                localStorage[this.db_name] = JSON.stringify(this.master);
            }

            return this.__return( true, callback );
        }, // save

        /**
         * insert()
         * - return: the number of rows inserted. 
         * - takes: 
         *    arg1: Object or Array of Objects to insert
         *    arg2 (Optional): Callback 
         * - throws Error on malformed insert
         */
        insert: function( Arg, callback ) 
        {
            if ( arguments.length !== 1 && arguments.length !==2 )
                throw new Error("insert: accepts 1 or 2 arguments: insert(row [,callback])");

            var that = this;

            function insert_one( obj )
            {
                if ( type_of(obj) !== 'object' ) 
                    throw new Error("insert: row element must be Object");
                // _id magically placed on the front of new object-rows
                if ( !obj["_id"] ) 
                    obj = addToFront( obj, '_id', ++that._id );
                that.master.push(obj);
                return 1;
            }

            var num_rows = 0;
            if ( type_of( Arg ) === "array" ) {
                for ( var i = 0, l = Arg.length; i < l; i++ ) {
                    num_rows += insert_one( Arg[i] );
                }
            } else if ( type_of( Arg ) === "object" ) {
                num_rows += insert_one(Arg);
            } else {
                throw new Error("insert: accepts Object or Array of Objects");
            }

            return this.__return(num_rows, callback);
        }, // insert

        /**
         * update()
         * - return: number of rows altered
         * - takes:
         *    arg1: query Object
         *    arg2: update Object
         *    arg3 (Optional): options Object
         *    arg4 (Optional): callback Function
         * - options:
         *    upsert - If true, creates a new row if none matches.
         *              Default is false
         *    multi  - If true, updates multiple rows matching query.
         *              Default is to limit update to only one document. 
         */
        update: function( query, _update, options, callback ) 
        {
            if ( arguments.length < 2 )
                throw new Error("usage: update(query,update,[options],[callback])");

            if ( type_of(query) !== "object" || type_of(_update) !== "object" )
                throw new Error("usage: update(query,update,[options],[callback])");

            if ( arguments.length === 3 && type_of(options) !== "object" )
                throw new Error("usage: update(query,update,[options],[callback])");

            var set = _update['$set'];
            if ( !set )
                throw new Error("usage: update(query,update,[options],[callback])");

            // these are the rows we're updating
            var res = this.do_query( query );

            var do_multi = false, do_upsert = false;

            if ( options ) {
                do_multi = options['multi'] ? options['multi'] : false;
                do_upsert = options['upsert'] ? options['upsert'] : false;
            }

            // chance to upsert
            if ( res.length === 0 && do_upsert ) {
                this.insert( set );
                return this.__return( 1, callback );
            }

            var rows_altered = 0;

            // foreach row of the matching result
            for ( var i = 0, l = res.length; i < l; i++ ) {
                var row = res[i];
                // foreach key/value in $set, update a row
                var did_change = false;
                for ( var j in set ) {
                    if ( set.hasOwnProperty(j) ) {
                        var key = j;
                        var value = set[j];
                        if ( !row[key] || row[key] !== value ) {
                            row[key] = value;
                            did_change = true;
                        }
                    }
                }
                if ( did_change )
                    ++rows_altered;
                if ( !do_multi ) 
                    break; // do 1 row only 
            }

            return this.__return(rows_altered, callback);
        }, // update

        /**
         * find()
         * - return: db_result
         * - takes: 
         *    arg1 (Optional): match Object, 
         *    arg2 (Optional): callback Function
         */
        find: function( match, callback ) 
        {
            if ( !match )
                match = {};
            if ( arguments.length > 2 || type_of(match)!=="object" )
                throw new Error( "find: usage: find([match],[callback])" );
            var res = this.do_query( match );
            var dbres = new db_result( res );
            return this.__return( dbres, callback );
        }, // find

        /*
         * distinct()
         * - about: eliminates duplicate rows from the result
         * - return: db_result
         * - takes: 
         *    arg1: key to get distinct set of, String
         *    arg2 (Optional): clause to limit set to match against, Object
         *    arg3 (Optional): callback Function
         * - examples: distinct('key'), distinct('key',{price:{$gt:10}})
         */
        distinct: function( str, clause, callback ) 
        {
            if ( str === undefined )
                throw new Error("usage: distinct(key,[clause],[callback])");
            if ( clause ) {
              var res = this.do_query(clause);
            } else {
              var res = this.do_query();
            }

            var set_wo = [];
            var maybe = [];
            for ( var i = 0, l = res.length; i < l; i++ ) {
                // every row that has key gets put in an array to be thinned
                if ( res[i][str] !== undefined ) {
                    maybe.push(res[i]);
                // every row that doesn't have key goes to set_wo[]
/*              } else {
                    set_wo.push(res[i]); */
                }
            }

            var distinct_set = [];
            for ( var i = 0, l = maybe.length; i < l; i++ ) {
                if ( !(distinct_set.some(function(x){return x[str] === maybe[i][str]})) )
                    distinct_set.push( maybe[i] );
            }

            // FIXME: I dont know why you'd put rows in the return set that
            //        dont contain the key... wtf was I thinking?
            //var dbres = new db_result( set_wo.concat(distinct_set) );

            var dbres = new db_result( distinct_set );
            res = null;
            return this.__return(dbres, callback);
        }, // distinct

        /** 
         * remove()
         * - return: number rows altered 
         * - takes:
         *    arg1 (Optional): constraints
         *    arg2 (Optional): callback, Function
         */
        remove: function( constraints, callback ) 
        {
            if ( arguments.length === 0 )
                var constraints = {};
            if ( type_of(constraints) !== "object" )
                throw new Error("usage: remove( [constraints], [callback] )" );

            // get the rows to remove
            var rows = this.do_query( constraints );
            if ( rows.length === 0 )
                return this.__return( 0, callback );
        
            var rmids = [];

            // collect row _id's
            for ( var i = 0, l = rows.length; i < l; i++ ) {
                var id = rows[i]['_id']; 
                if ( !id )
                    continue;
                rmids.push( id );
            }

            if ( rmids.length === 0 )
                return this.__return( 0, callback );

            var rows_altered = 0;
            var new_master = this.master.filter(function(row) {
                for ( var i = 0, l = rmids.length; i < l; i++ ) {
                    if ( row['_id'] && row['_id'] === rmids[i] ) {
                        ++rows_altered;
                        return false;
                    } 
                }    
                return true;
            });

            if ( rows_altered > 0 )
                this.master = new_master;
            
            return this.__return( rows_altered, callback );
        }, // remove


        get_json: function() {
            return JSON.stringify( this.master );
        }, // get_json

        print: function(fmt) {
            var f = arguments.length === 0 ? '  ' : fmt;
            console.log( JSON.stringify(this.master,null,f) );
        }, // print
    
        now: function() 
        {
            var n = new Date();

            if ( n.toISOString && typeof n.toISOString === "function" ) {
                return n.toISOString();
            }

            return n.getFullYear() + '-' + 
                    (n.getMonth()+1) + '-' + 
                    n.getDate() + 'T' + 
                    n.toUTCString().replace( /.*(\d\d:\d\d:\d\d).*/, "$1" ) + '.000Z';
        }, // now

        // returns date object set to ISO string input
        toDate: function( isostring )
        {
            return new Date( isostring );
        }, // toDate

        count: function() {
            return this.master.length;
        }, // count

        renormalize: function() 
        {
            // sort each row elements
            for ( var i = 0, l = this.master.length; i < l; i++ ) {
                this.master[i] = sortObjectByKeys(this.master[i]);
            }

            // sort entirety by _id
            this.master.sort( function(a,b){ return a._id - b._id } );

            // renumber starting at 1
            for ( var i = 0, l = this.master.length; i < l; i++ ) {
                this.master[i]._id = 1 + i;
            }
        }, // renormalize


        //////////////////////////////////////////////////
        //
        // private methods (not returned in constructor)
        //

        __return: function( arg, callback ) {
            if ( callback )
                return callback(arg);
            return arg;
        },

        // query matching functions
        detect_clause_type: function( key, value )
        {
            switch ( type_of(value) )
            {
            case "boolean":
            case "date":
            case "number":
            case "string": // NORMAL | SUBDOCUMENT_MATCH
            case "regexp":
                return key.indexOf('.') === -1 ? "CLAUSE_NORMAL" : "CLAUSE_SUBDOCUMENT_MATCH";
            case "object": // CONDITIONAL | SUBDOCUMENT
                var fk = _firstKey(value);
                switch(fk) {
                case '$gt': 
                case '$gte': 
                case '$lt': 
                case '$lte': 
                case '$exists':
                case '$ne':
                    return "CLAUSE_CONDITIONAL";
                default:
                    return "CLAUSE_SUBDOCUMENT";
                }
                break;
            case "array": // OR | ARRAY
                return key === '$or' ? "CLAUSE_OR" : "CLAUSE_ARRAY";
            default:
                break;
            }
            return "CLAUSE_UNKNOWN";

        }, // this.detect_clause_type

        matching_rows_NORMAL: function( test, rows )
        {
            var res = [];
            var i = 0;

            // for all rows
        next_row:
            for ( var l = rows.length; i < l; i++ )
            {
                var row = rows[i];

                // for each unique key in the row
                for ( var key in row )
                {
                    // matches our query key
                    if ( row.hasOwnProperty(key) && key === test.key ) 
                    {
                        // RegExps: equiv to SQL "like" statement
                        if ( type_of( test.value ) === "regexp" ) {
                            var sval = row[key] + '';
                            if ( sval.match( test.value ) ) {
                                res.push( row );
                                continue next_row;
                            }
                        // compare number, date, string statements directly
                        } else {
                            if ( row[key] === test.value ) {
                                res.push( row );
                                continue next_row;
                            }
                        }
                    } // key match

                } // each row key
    
            } // each row

            return res;
        }, // matching_rows_NORMAL

        matching_rows_CONDITIONAL: function( test, rows )
        {
            var res = [];
            var i = 0;
            var cond = _firstKey(test.value);

        next_row:
            // foreach row
            for ( var l = rows.length; i < l; i++ )
            {
                var row = rows[i];

                if ( cond === '$exists' ) {
                    if ( test.value[cond] ) {   /* true */
                        if ( row[test.key] ) {
                            res.push( row );
                            continue next_row;
                        }
                    } else {                    /* false */
                        if ( ! row[test.key] ) {
                            res.push( row );
                            continue next_row;
                        }
                    }
                    continue next_row;
                }


                // add rows that don't contain test.key
                if ( cond === '$ne' ) {
                    // see if row contains test.key at all, if not add it
                    if ( ! row[test.key] ) {
                        res.push(row);
                        continue next_row;
                    // else do -ne test against row's matching key
                    } else if ( row[test.key] !== test.value['$ne'] ) {
                        res.push(row);
                        continue next_row;
                    }
                }


                // for every unique key in row
                for ( var key in row )
                {
                    // key matches
                    if ( row.hasOwnProperty(key) && key === test.key ) 
                    {
                        switch ( cond ) {
                        case '$lt':
                            if ( row[key] < test.value[cond] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$lte':
                            if ( row[key] <= test.value[cond] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$gt':
                            if ( row[key] > test.value[cond] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$gte':
                            if ( row[key] >= test.value[cond] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$ne':
                            if ( row[key] !== test.value[cond] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        default:
                            break;
                        }
                    } // key match
                } // each key in row
            } // each row

            // remove the key:value from test object
            if ( cond )
                delete test.value[cond];

            return res;
        }, // matching_rows_CONDITIONAL

        matching_rows_OR: function( array, rows )
        {
            var res = [];
            var i = 0;
        next_row:
            for ( var l = rows.length; i < l; i++ )
            {
                var row = rows[i];

                for ( var j = 0, la = array.length; j < la; j++ ) 
                {
                    var eltkey = _firstKey( array[j] );
                    var eltval = array[j][eltkey];
                    var test = { key:eltkey, value:eltval };

                    var clausetype = this.detect_clause_type( eltkey, eltval );

                    switch ( clausetype )
                    {
                    case "CLAUSE_NORMAL":
                        if ( type_of( test.value ) === "regexp" ) {
                            if ( row[test.key] && row[test.key].match( test.value ) ) {
                                res.push( row );
                                continue next_row;
                            }
                        } else {
                            if ( row[test.key] === test.value ) {
                                res.push( row );
                                continue next_row;
                            }
                        }
                        break;
                    case "CLAUSE_CONDITIONAL":
                        switch( _firstKey(test.value) ) {
                        case '$gt':
                            if ( row[test.key] > test.value['$gt'] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$gte':
                            if ( row[test.key] >= test.value['$gte'] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$lt':
                            if ( row[test.key] < test.value['$lt'] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$lte':
                            if ( row[test.key] <= test.value['$lte'] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        case '$exists':
                            if ( row[test.key] !== undefined && test.value['$exists'] ) {
                                res.push(row);
                                continue next_row;
                            } else if ( row[test.key] === undefined && !test.value['$exists'] ) {
                                res.push(row);
                                continue next_row;
                            }
                            break;
                        }
                        break;
                    default:
                        break;
                    }
                }
            }
            return res;
        }, // matching_rows_OR

        do_query: function( clauses )
        {
            var result = this.master;

            // CLAUSE_EMPTY
            if ( !clauses || (type_of(clauses)==="object" && _firstKey(clauses)===null) ) {
                return result;
            }

            // 
        next_clause:
            for ( var clause in clauses ) 
            {
                if ( ! clauses.hasOwnProperty(clause) )
                    continue next_clause;

                var clausetype = this.detect_clause_type(clause,clauses[clause]);
                switch ( clausetype )
                {
                case "CLAUSE_NORMAL": // simple key/value 
                    result = this.matching_rows_NORMAL( { key: clause, value: clauses[clause] }, result );
                    break;
                case "CLAUSE_CONDITIONAL":
                    while ( _firstKey(clauses[clause]) !== null ) {
                        result = this.matching_rows_CONDITIONAL( { key: clause, value: clauses[clause] }, result );
                    }
                    break;
                case "CLAUSE_OR":
                    result = this.matching_rows_OR( clauses[clause], result );
                    break;
                default:
                    break;
                }
            }

            return result;
        }, // do_query

        sortMaster: function ()
        {
            sortArrayOfObjectsByKeys( this.master );
        }

    }; // db_object.prototype


    /**
        - MAIN MODULE INTERFACE 
        - opens physical database (new one is created if non-existent)
        - returns handle to new db_object
    */
    queryable.open = function ( config )
    {
        // private variables
        var that = this;

        // object parameters
        this.platform = detect_platform();

        switch ( this.platform ) {
        case "node_module":
            var path        = require('path');
            var fs          = require('fs');
            this.db_name    = 'test.db';
            this.db_dir     = path.resolve(__dirname);
            this.db_path    = 0;

            // defaults to off; can be set by either: the useGzip() method or config{}
            // also: sets to ON automatically if file opened has *.gz extension
            this.use_gzip   = false; 

            return server_open( config );

        case "browser":
            var _name = '';
            var data = undefined;
            if ( type_of(config) === "string" )
                _name = config;
            else if ( type_of(config) === "object" ) {
                _name = ( config && config.db_name ) ? config.db_name : '';
                if ( config.string )
                    data = config.string;
                else if ( config.data )
                    data = config.data;
            }

            if ( data ) 
                return new db_object( {"platform":"browser",db_name:_name,data:data} );
            else
                return new db_object( {"platform":"browser",db_name:_name} );

        default:
            p( "unknown platform" );
            return queryable;
        }

        function server_open( config )
        {
            var parm_list = ['db_name','db_dir','db_path','use_gzip'];

            // assume it is either (in this order): path, fullpath, filename
            if ( arguments.length > 0 && typeof config === "string" ) 
            {
                try {
                    // is file 
                    var data = fs.readFileSync(config,{encoding:"utf8",flag:'r'}); // throws if Directory or File doesn't exist

                    // fullpath
                    that.db_path = path.resolve(config);
                    // name
                    that.db_name = clip_all_leading( that.db_path.substring( that.db_path.lastIndexOf('/'), that.db_path.length ), '/' );
                    // dir
                    that.db_dir = that.db_path.substring(0, that.db_path.lastIndexOf( that.db_name ));

                } 
                catch(e) 
                {
                    switch ( e.code ) 
                    {
                    case "ENOENT":
                        // file not exists: get db_name, db_dir
                        that.db_path = path.resolve(config); 
                        that.db_name = clip_all_leading( that.db_path.substring( that.db_path.lastIndexOf('/'), that.db_path.length ), '/' );
                        that.db_dir = that.db_path.substring(0, that.db_path.lastIndexOf( that.db_name ));
                        break;
                    case "EISDIR":
                        // is a directory: get db_dir
                        that.db_dir = path.resolve(config);
                        break;
                    default:
                        // who knows
                        break;
                    }
                }
            }

            // overwrite from user-supplied config settings
            else if ( arguments.length > 0 && typeof config === "object" ) 
            {
                for ( var i = 0; i < parm_list.length; i++ ) 
                {
                    if ( config[parm_list[i]] ) {
                        if ( parm_list[i] === "db_path" ) 
                            config[parm_list[i]] = path.resolve( config[parm_list[i]] );
                        else if ( parm_list[i] === "db_dir" )
                            config[parm_list[i]] = path.resolve( config[parm_list[i]] );
                        else if ( parm_list[i] === 'db_name' )
                            config[parm_list[i]] = clip_all_leading( config[parm_list[i]], '/' );
                        
                        that[parm_list[i]] = config[parm_list[i]];
                    }
                }

                // if db_path supplied, check that db_name and db_dir match, or else db_name and db_dir override, and path must be reset
                if ( config.db_path ) {
                    var _n = clip_all_leading( that.db_path.substring( that.db_path.lastIndexOf('/'), that.db_path.length ), '/' );
                    var _d = that.db_path.substring(0, that.db_path.lastIndexOf( _n ));
                    var _any_changed = 0;
                    if ( _n !== that.db_name ) {
                        that.db_name = _n;
                        ++_any_changed;
                    }
                    if ( _d !== that.db_dir ) {
                        that.db_dir = _d;
                        ++_any_changed;
                    }
                    if ( _any_changed ) {
                        that.db_path = 0; 
                    }
                }
            }

            // set db_path, if we didn't get it yet
            if ( ! that.db_path ) {
                if ( that.db_dir && that.db_dir[that.db_dir.length-1] === '/' )
                    that.db_path = that.db_dir + that.db_name;
                else
                    that.db_path = that.db_dir + '/' + that.db_name;
            }
    
            var rows = config && config.data ? config.data : undefined;

            return new db_object( {db_path:that.db_path,db_dir:that.db_dir,db_name:that.db_name,"platform":that.platform,use_gzip:that.use_gzip,data:rows} );
        } // server_open()

    }; // queryable.open

    queryable.useGzip = function() {
        if ( arguments.length > 0 ) {
            this.use_gzip = arguments[0];
        }
    }

    try {
        if ( window )
            window.queryable = queryable;
    } catch(e) {
    }

    return queryable;

})(typeof exports === "undefined" ? {} : exports);
