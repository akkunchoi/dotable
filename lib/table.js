// A thin mysql wrapper

// use it for mysql.escapeId because mysql.escapeId is undefined
function escapeId(key){
  return '`' + key.replace('`', '') + '`';
}

/**
 * options: 
 *   tableName: String
 *   adapter: MysqlPool
 *   logger: Object
 */
var Table = function(options){
  this.options = options;
};
Table.prototype.getTableName = function(){
  return this.options.tableName;
};
Table.prototype.getAdapter = function(){
  return this.options.adapter;
};
// result = {}
//    includes insertId, affectedRows, serverStatus, warningCount, message, etc..
Table.prototype.insert = function(data, callback){
  var adapter = this.getAdapter();

  var keys = [];
  var values = [];
  var params = [];

  for (var i in data){
    keys.push(escapeId(i));
    values.push('?');
    params.push(data[i]);
  }

  keys.push(escapeId('updated_at'));
  keys.push(escapeId('created_at'));
  values.push('NOW()');
  values.push('NOW()');

  var query = 'INSERT INTO ' + this.getTableName() + ' ('+keys.join(',')+') ' +
    'VALUES (' + values.join(',') + ')';

  this.log(query, params);
  adapter.query(query, params, function(err, result){
    callback(err, result);
  });
};

// keyに$limit
// valueに{$: ...}で任意のSQL
function pp(data, queryType){
  var values = [], params = [], i
    , nullOp = queryType === 'update' ? '=' : 'IS';

  for (i in data){
    if (i.indexOf('$') === 0) continue;
    if (data[i] === null){
      values.push(escapeId(i) + ' ' + nullOp + ' NULL');
    }else if (typeof data[i] === 'object' && data[i].$){
      values.push(escapeId(i) + ' ' + data[i].$);
    }else{
      values.push(escapeId(i) + ' = ?');
      params.push(data[i]);
    }
  }
  return {values: values, params: params};
}

Table.prototype.update = function(cond_data, mod_data, callback){
  var adapter = this.getAdapter();

  mod_data.updated_at = {$: '= NOW()'};

  var v1 = pp(mod_data, 'update');
  var v2 = pp(cond_data);

  if (v2.values.length === 0){
    throw new Error('DANGEROUS QUERY');
  }

  var query = 'UPDATE ' + this.getTableName() + ' SET ' + 
    v1.values.join(',') + 
    ' WHERE (' + v2.values.join(' AND ')+ ')';

  var params = [];
  params = params.concat(v1.params);
  params = params.concat(v2.params);

  this.log(query, params);

  adapter.query(query, params, function(err, result){
    callback(err, result);
  });
};
Table.prototype.find = function(data, callback){
  var adapter = this.getAdapter();

  var v = pp(data);
  v.values.push('TRUE');

  var projection = '*';
  var query = 'SELECT ' + projection + ' FROM ' + this.getTableName() + 
    ' WHERE (' + v.values.join(' AND ')+ ')';

  if (data.$limit){
    query += ' LIMIT ' + data.$limit;
  }
  this.log(query, v.params);

  adapter.query(query, v.params, function(err, result){
    callback(err, result);
  });
};
Table.prototype.findOne = function(data, callback){
  data.$limit = 1;
  this.find(data, function(err, rows){
    if (err) return callback(err);
    if (!rows) return callback();
    callback(null, rows[0]);
  });
};
Table.prototype.delete = function(data, callback){
  var adapter = this.getAdapter();

  var v = pp(data);

  if (v.values.length === 0){
    throw new Error('DANGEROUS QUERY');
  }
  
  var query = 'DELETE FROM ' + this.getTableName() + 
    ' WHERE (' + v.values.join(' AND ')+ ')';

  this.log(query, v.params);
  adapter.query(query, v.params, function(err, result){
    callback(err, result);
  });
};
Table.prototype.existsTable = function(callback){
  var query = 'SHOW TABLES LIKE ?';
  var params = [this.getTableName()];
  this.log(query, params);
  this.getAdapter().query(query, params, function(err, rows){
    if (err) return callback(err, false);
    if (!rows || rows.length === 0) return callback('error', false);
    callback(null, true);
  });
};
Table.prototype.log = function(query, data){
  if (this.options.logger){
    this.options.logger.debug(query, data);
  }
};

module.exports = Table;

