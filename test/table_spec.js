var Table = require('../lib/table');

describe('Table', function(){
  var q;
  var mockAdapter = {
    query: function(query, params, callback){
      q = {query: query, params: params};
      callback();
    }
  };
  var table = new Table({tableName: 'spec', adapter: mockAdapter});

  beforeEach(function(){
  });
  afterEach(function(){
  });

  it('insert', function(){
    table.insert({name: 'Tanaka'}, function(){
      expect(q.query).toBe('INSERT INTO spec (`name`,`updated_at`,`created_at`) VALUES (?,NOW(),NOW())');
      expect(q.params).toEqual(['Tanaka']);
    });
  });

  it('update', function(){
    table.update({id: 1}, {name: 'Tanaka'}, function(){
      expect(q.query).toBe('UPDATE spec SET `name` = ?,`updated_at` = NOW() WHERE (`id` = ?)');
      expect(q.params).toEqual(['Tanaka', 1]);
    });
  });

  it('update special', function(){
    table.update({company: {$: 'IS NULL'}}, {work: 'nothing'}, function(){
      expect(q.query).toBe('UPDATE spec SET `work` = ?,`updated_at` = NOW() WHERE (`company` IS NULL)');
      expect(q.params).toEqual(['nothing']);
    });
  });

  it('update null', function(){
    table.update({id: 1}, {work: null}, function(){
      expect(q.query).toBe('UPDATE spec SET `work` = NULL,`updated_at` = NOW() WHERE (`id` = ?)');
      expect(q.params).toEqual([1]);
    });
  });

  it('find', function(){
    table.find({type: 'active', $limit: 3}, function(){
      expect(q.query).toBe('SELECT * FROM spec WHERE (`type` = ? AND TRUE) LIMIT 3');
      expect(q.params).toEqual(['active']);
    });
  });

  it('delete', function(){
    table.delete({age: {$: '< 20'}, gender: 'male'}, function(){
      expect(q.query).toBe('DELETE FROM spec WHERE (`age` < 20 AND `gender` = ?)');
      expect(q.params).toEqual(['male']);
    });
  });
});

