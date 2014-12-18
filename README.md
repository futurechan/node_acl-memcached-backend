Memcached Backend for NODE ACL
===================

This is a Memcached backend for [acl](https://github.com/OptimalBits/node_acl "node_acl")

##Status

[![BuildStatus](https://secure.travis-ci.org/futurechan/node_acl-memcached-backend.png?branch=master)](https://travis-ci.org/futurechan/node_acl-memcached-backend) [![DependencyStatus](https://david-dm.org/futurechan/node_acl-memcached-backend.png?branch=master)](https://david-dm.org/futurechan/node_acl-memcached-backend.png?branch=master)


##Installation

Using npm:

```javascript
npm install acl-memcached-backend
```

##Examples

```javascript
var acl = require('acl')
    , Backend = require('acl-memcached-backend')
	, Memcached = require('memcached')
	, client = new Memcached('localhost:11211')
	, backend = new Backend(client, 28800)
    , acl = new acl(backend)
;

acl.allow([
	{
		roles:['someRole'], 
		allows:[
			{resources:'/resource', permissions:['get', 'post', 'put']},
			{resources:'/resource', permissions:['get', 'post', 'put']}
		]
	}
])
```

