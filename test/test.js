
process.env.NODE_ENV = 'test';

var assert = require('assert');
var connect = require('connect');
var request = require('supertest');
var session = require('..');

describe('Cookie Session', function(){
  var cookie;

  describe('when options.signed = true', function(){
    describe('when app.keys are set', function(){
      it('should work', function(done){
        var app = connect();
        app.use(session({
          keys: ['a', 'b']
        }));
        app.use(function (req, res, next) {
          req.session.message = 'hi';
          res.end();
        })

        request(app.listen())
        .get('/')
        .expect(200, done);
      })
    })

    describe('when app.keys are not set', function(){
      it('should throw', function(){
        assert.throws(function () {
          session();
        });
      })
    })
  })

  describe('when options.signed = false', function(){
    describe('when app.keys are not set', function(){
      it('should work', function(done){
        var app = connect();
        app.use(session({
          signed: false
        }));
        app.use(function (req, res, next) {
          req.session.message = 'hi';
          res.end();
        })

        request(app.listen())
        .get('/')
        .expect(200, done);
      })
    })
  })

  describe('when options.secure = true', function(){
    describe('when connection not secured', function(){
      it('should not Set-Cookie', function(done) {
        var app = App({ secure: true });
        app.use(function (req, res, next) {
          process.nextTick(function(){
            req.session.message = 'hello!';
            res.end('greetings');
          })
        })

        request(app)
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        })
      })
    })
  })

  describe('when the session contains a ;', function(){
    it('should still work', function(done){
      var app = App();
      app.use(function (req, res, next) {
        if (req.method === 'POST') {
          req.session.string = ';';
          res.statusCode = 204;
          res.end();
        } else {
          res.end(req.session.string);
        }
      })

      var server = app.listen();
      request(server)
      .post('/')
      .expect(204, function(err, res){
        if (err) return done(err);
        var cookie = res.headers['set-cookie'];
        request(server)
        .get('/')
        .set('Cookie', cookie.join(';'))
        .expect(';', done);
      })
    })
  })

  describe('when the session is invalid', function(){
    it('should create new session', function(done){
      var app = App({ name: 'session', signed: false });
      app.use(function (req, res, next) {
        res.end(String(req.session.isNew))
      })

      request(app)
      .get('/')
      .set('Cookie', 'session=bogus')
      .expect(200, 'true', done)
    })
  })

  describe('new session', function(){
    describe('when not accessed', function(){
      it('should not Set-Cookie', function(done) {
        var app = App();
        app.use(function (req, res, next) {
          res.end('greetings');
        })

        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        })
      })
    })

    describe('when accessed and not populated', function(done){
      it('should not Set-Cookie', function(done) {
        var app = App();
        app.use(function (req, res, next) {
          req.session;
          res.end('greetings');
        })

        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        })
      })
    })

    describe('when populated', function(done){
      it('should Set-Cookie', function(done){
        var app = App();
        app.use(function (req, res, next) {
          req.session.message = 'hello';
          res.end();
        })

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /express:sess/)
        .expect(200, function(err, res){
          if (err) return done(err);
          cookie = res.header['set-cookie'].join(';');
          done();
        })
      })

      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function (req, res, next) {
          res.end(JSON.stringify(this.session));
        })

        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        })
      })
    })
  })

  describe('saved session', function(){
    describe('when not accessed', function(){
      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function (req, res, next) {
          res.end('aklsjdfklasjdf');
        })

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        })
      })
    })

    describe('when accessed but not changed', function(){
      it('should be the same session', function(done){
        var app = App();
        app.use(function (req, res, next) {
          assert.equal(req.session.message, 'hello');
          res.end('aklsjdfkljasdf');
        })

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, done);
      })

      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function (req, res, next) {
          assert.equal(req.session.message, 'hello');
          res.end('aklsjdfkljasdf');
        })

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        })
      })
    })

    describe('when accessed and changed', function(){
      it('should Set-Cookie', function(done){
        var app = App();
        app.use(function (req, res, next) {
          req.session.money = '$$$';
          res.end('klajsdlkfjadsf');
        })

        request(app.listen())
        .get('/')
        .set('Cookie', cookie)
        .expect('Set-Cookie', /express:sess/)
        .expect(200, done);
      })
    })
  })

  describe('when session = ', function(){
    describe('null', function(){
      it('should expire the session', function(done){
        var app = App();
        app.use(function (req, res, next) {
          req.session = null;
          res.end('lkajsdf');
        })

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /express:sess/)
        .expect(200, done);
      })
    })

    describe('{}', function(){
      it('should not Set-Cookie', function(done){
        var app = App();
        app.use(function (req, res, next) {
          req.session = {};
          res.end('lkajsdlkfjasdf');
        })

        request(app.listen())
        .get('/')
        .expect(200, function(err, res){
          if (err) return done(err);
          assert.strictEqual(res.header['set-cookie'], undefined);
          done();
        });
      })
    })

    describe('{a: b}', function(){
      it('should create a session', function(done){
        var app = App();
        app.use(function (req, res, next) {
          req.session = { message: 'hello' };
          res.end('klajsdfasdf');
        })

        request(app.listen())
        .get('/')
        .expect('Set-Cookie', /express:sess/)
        .expect(200, done);
      })
    })

    describe('anything else', function(){
      it('should throw', function(done){
        var app = App();
        app.use(function (req, res, next) {
          req.session = 'aklsdjfasdf';
        })

        request(app.listen())
        .get('/')
        .expect(500, done);
      })
    })
  })

  describe('req.session', function () {
    describe('.populated', function () {
      it('should be false on new session', function (done) {
        var app = App();
        app.use(function (req, res, next) {
          res.end(String(req.session.populated))
        })

        request(app.listen())
        .get('/')
        .expect(200, 'false', done)
      })

      it('should be true after adding property', function (done) {
        var app = App();
        app.use(function (req, res, next) {
          req.session.message = 'hello!'
          res.end(String(req.session.populated))
        })

        request(app.listen())
        .get('/')
        .expect(200, 'true', done)
      })
    })
  })
})

function App(options) {
  options = options || {};
  options.keys = ['a', 'b'];
  var app = connect();
  app.use(session(options));
  return app;
}
