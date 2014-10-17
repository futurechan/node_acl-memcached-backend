/**
  Memcahced Backend.
  Implementation of the storage backend using Memcahced
*/
"use strict";

var contract = require('./contract');
var async = require('async');
var _ = require('lodash');

function MemcachedBackend(client, lifetime){
  this.client=client;
  this.lifetime=lifetime;
}

MemcachedBackend.prototype = {
 /**
     Begins a transaction.
  */
  begin : function(){
    // returns a transaction object(just an array of functions will do here.)
    return [];
  },

  /**
     Ends a transaction (and executes it)
  */
  end : function(transaction, cb){
    contract(arguments).params('array', 'function').end();
    async.series(transaction,function(err){
      cb(err instanceof Error? err : undefined);
    });
  },

  /**
    Cleans the whole storage.
  */
  clean : function(cb){
    contract(arguments).params('function').end();
    this.db.collections(function(err, collections) {
      if (err instanceof Error) return cb(err);
      async.forEach(collections,function(coll,innercb){
        coll.drop(function(){innercb()}); // ignores errors
      },cb);
    });
  },

  /**
     Gets the contents at the bucket's key.
  */
  get : function(bucket, key, cb){
    contract(arguments)
        .params('string', 'string|number', 'function')
        .end();
		
    key = this.bucketKey(bucket, key);
	
	this.client.get(key, cb);
  },

  /**
    Returns the union of the values in the given keys.
  */
  union : function(bucket, keys, cb){
    contract(arguments)
      .params('string', 'array', 'function')
      .end();

    keys = this.bucketKey(bucket, keys);
	
	this.client.getMulti(keys, function (err, data) {
	  if(err) return cb(err);
	  
	  var docs = _.values(data)
	  
	  if( ! docs.length ) return cb(undefined, []);
	  
	  var keyArrays = [];
	  docs.forEach(function(doc){
	    keyArrays.push.apply(keyArrays, _.keys(doc));
	  });
	  
	  cb(undefined, _.without(_.union(keyArrays),"key","_id"));
	});
  },

  /**
    Adds values to a given key inside a bucket.
  */
  add : function(transaction, bucket, key, values){
    contract(arguments)
        .params('array', 'string', 'string|number','string|array|number')
        .end();

    if(key=="key") throw new Error("Key name 'key' is not allowed.");
    var self=this;
	
	key = this.bucketKey(bucket, key);
	
    transaction.push(function(cb){
      values = makeArray(values);
	  
	  self.client.get(key,function(err, data){
		if(err) cb(err);
	  	  
		self.client.set(key, _.union(values, data), self.lifetime, cb);      	  
	  })
    });
  },

  /**
     Delete the given key(s) at the bucket
  */
  del : function(transaction, bucket, keys){
    contract(arguments)
        .params('array', 'string', 'string|array')
        .end();
    keys = makeArray(keys);
    var self= this;

    transaction.push(function(cb){
		var dels = _(keys).forEach(function(key){
			return function(callback){
				 self.client.del(key, callback);
			}
		})
	
		async.parallel(dels, cb);
    });
  },

  /**
    Removes values from a given key inside a bucket.
  */
  remove : function(transaction, bucket, key, values){
    contract(arguments)
        .params('array', 'string', 'string|number','string|array')
        .end();

    var self=this;
    key = this.bucketKey(bucket, key);
    values = makeArray(values);
    
    transaction.push(function(cb){
      self.client.get(key, function(err,data){
		if(err) cb(err);
		self.replace(key, _.difference(data, values), self.lifetime, cb);
	  })	  
    });
  },
  
  bucketKey : function(bucket, keys){
    var self = this;
    if(Array.isArray(keys)){
      return keys.map(function(key){
        return '_'+bucket+'@'+key;
      });
    }else{
      return '_'+bucket+'@'+keys;
    }
  }
}

function makeArray(arr){
  return Array.isArray(arr) ? arr : [arr];
}

exports = module.exports = MemcachedBackend;