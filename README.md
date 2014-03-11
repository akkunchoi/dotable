# dotable

A thin sql wrapper corresponding to any table for node.js.


```
$ npm install dotable
```

## code

```javascript
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : '',
  password : '',
  database : ''
});

connection.connect();

var Table = require('./lib/table');

var User = new Table({tableName: 'users', adapter: connection});
User.find({}, function(err, users){
  console.log(users);
});

connection.end();
```
