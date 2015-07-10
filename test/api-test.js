var assert = require('assert');
var net = require('net');
var http = require('http');
var streamPair = require('stream-pair');
var thing = require('handle-thing');

var httpDeceiver = require('../');

describe('HTTP Deceiver', function() {
  var handle;
  var pair;
  var socket;
  var deceiver;

  beforeEach(function() {
    pair = streamPair.create();
    handle = thing.create(pair.other);
    socket = new net.Socket({ handle: handle });

    // For v0.8
    socket.readable = true;
    socket.writable = true;

    deceiver = httpDeceiver.create(socket);
  });


  it('should emit request', function(done) {
    var server = http.createServer();
    server.emit('connection', socket);

    server.on('request', function(req, res) {
      assert.equal(req.method, 'PUT');
      assert.equal(req.url, '/hello');
      assert.deepEqual(req.headers, { a: 'b' });

      done();
    });

    deceiver.emitRequest({
      method: 'PUT',
      path: '/hello',
      headers: {
        a: 'b'
      }
    });
  });

  it('should emit response', function(done) {
    var agent = new http.Agent();
    agent.createConnection = function createConnection() {
      return socket;
    };
    var client = http.request({
      method: 'POST',
      path: '/ok',
      agent: agent
    }, function(res) {
      assert.equal(res.statusCode, 421);
      assert.deepEqual(res.headers, { a: 'b' });

      done();
    });

    process.nextTick(function() {
      deceiver.emitResponse({
        status: 421,
        reason: 'F',
        headers: {
          a: 'b'
        }
      });
    });
  });
});
