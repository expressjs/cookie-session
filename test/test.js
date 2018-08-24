
process.env.NODE_ENV = 'test'

var assert = require('assert')
var connect = require('connect')
var request = require('supertest')
var session = require('..')

describe('Cookie Session', function () {
  describe('"httpOnly" option', function () {
    it('should default to "true"', function (done) {
      var app = App()
      app.use(function (req, res, next) {
        req.session.message = 'hi'
        res.end(String(req.sessionOptions.httpOnly))
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithParameter('session', 'httpOnly'))
        .expect(200, 'true', done)
    })

    it('should use given "false"', function (done) {
      var app = App({ httpOnly: false })
      app.use(function (req, res, next) {
        req.session.message = 'hi'
        res.end(String(req.sessionOptions.httpOnly))
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithoutParameter('session', 'httpOnly'))
        .expect(200, 'false', done)
    })
  })

  describe('"overwrite" option', function () {
    it('should default to "true"', function (done) {
      var app = App()
      app.use(function (req, res, next) {
        res.setHeader('Set-Cookie', [
          'session=foo; path=/fake',
          'foo=bar'
        ])
        req.session.message = 'hi'
        res.end(String(req.sessionOptions.overwrite))
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithValue('foo', 'bar'))
        .expect(200, 'true', done)
    })

    it('should use given "false"', function (done) {
      var app = App({ overwrite: false })
      app.use(function (req, res, next) {
        res.setHeader('Set-Cookie', [
          'session=foo; path=/fake',
          'foo=bar'
        ])
        req.session.message = 'hi'
        res.end(String(req.sessionOptions.overwrite))
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithValue('foo', 'bar'))
        .expect('Set-Cookie', /session=foo/)
        .expect(200, 'false', done)
    })
  })

  describe('when options.name = my.session', function () {
    it('should use my.session for cookie name', function (done) {
      var app = App({ name: 'my.session' })
      app.use(function (req, res, next) {
        req.session.message = 'hi'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookie('my.session'))
        .expect(200, done)
    })
  })

  describe('when options.signed = true', function () {
    describe('when options.keys are set', function () {
      it('should work', function (done) {
        var app = connect()
        app.use(session({
          keys: ['a', 'b']
        }))
        app.use(function (req, res, next) {
          req.session.message = 'hi'
          res.end()
        })

        request(app)
          .get('/')
          .expect(200, '', done)
      })
    })

    describe('when options.secret is set', function () {
      it('should work', function (done) {
        var app = connect()
        app.use(session({
          secret: 'a'
        }))
        app.use(function (req, res, next) {
          req.session.message = 'hi'
          res.end()
        })

        request(app)
          .get('/')
          .expect(200, '', done)
      })
    })

    describe('when options.keys are not set', function () {
      it('should throw', function () {
        assert.throws(function () {
          session()
        })
      })
    })
  })

  describe('when options.signed = false', function () {
    describe('when app.keys are not set', function () {
      it('should work', function (done) {
        var app = connect()
        app.use(session({
          signed: false
        }))
        app.use(function (req, res, next) {
          req.session.message = 'hi'
          res.end()
        })

        request(app)
          .get('/')
          .expect(200, done)
      })
    })
  })

  describe('when options.secure = true', function () {
    describe('when connection not secured', function () {
      it('should not Set-Cookie', function (done) {
        var app = App({ secure: true })
        app.use(function (req, res, next) {
          process.nextTick(function () {
            req.session.message = 'hello!'
            res.end('greetings')
          })
        })

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })
  })

  describe('when the session contains a ;', function () {
    it('should still work', function (done) {
      var app = App()
      app.use(function (req, res, next) {
        if (req.method === 'POST') {
          req.session.string = ';'
          res.statusCode = 204
          res.end()
        } else {
          res.end(req.session.string)
        }
      })

      request(app)
        .post('/')
        .expect(shouldHaveCookie('session'))
        .expect(204, function (err, res) {
          if (err) return done(err)
          request(app)
            .get('/')
            .set('Cookie', cookieHeader(cookies(res)))
            .expect(';', done)
        })
    })
  })

  describe('when the session is invalid', function () {
    it('should create new session', function (done) {
      var app = App({ name: 'my.session', signed: false })
      app.use(function (req, res, next) {
        res.end(String(req.session.isNew))
      })

      request(app)
        .get('/')
        .set('Cookie', 'my.session=bogus')
        .expect(200, 'true', done)
    })
  })

  describe('new session', function () {
    describe('when not accessed', function () {
      it('should not Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          res.end('greetings')
        })

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })

    describe('when accessed and not populated', function (done) {
      it('should not Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          var sess = req.session
          res.end(JSON.stringify(sess))
        })

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })

    describe('when populated', function (done) {
      it('should Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session.message = 'hello'
          res.end()
        })

        request(app)
          .get('/')
          .expect(shouldHaveCookie('session'))
          .expect(200, done)
      })
    })
  })

  describe('saved session', function () {
    var cookie

    before(function (done) {
      var app = App()
      app.use(function (req, res, next) {
        req.session.message = 'hello'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookie('session'))
        .expect(200, function (err, res) {
          if (err) return done(err)
          cookie = cookieHeader(cookies(res))
          done()
        })
    })

    describe('when not accessed', function () {
      it('should not Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          res.end('aklsjdfklasjdf')
        })

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })

    describe('when accessed but not changed', function () {
      it('should be the same session', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          assert.strictEqual(req.session.message, 'hello')
          res.end('aklsjdfkljasdf')
        })

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(200, done)
      })

      it('should not Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          assert.strictEqual(req.session.message, 'hello')
          res.end('aklsjdfkljasdf')
        })

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })

    describe('when accessed and changed', function () {
      it('should Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session.money = '$$$'
          res.end('klajsdlkfjadsf')
        })

        request(app)
          .get('/')
          .set('Cookie', cookie)
          .expect(shouldHaveCookie('session'))
          .expect(200, done)
      })
    })
  })

  describe('when session = ', function () {
    describe('null', function () {
      it('should expire the session', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session = null
          res.end('lkajsdf')
        })

        request(app)
          .get('/')
          .expect(shouldHaveCookie('session'))
          .expect(200, done)
      })

      it('should no longer return a session', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session = null
          res.end(JSON.stringify(req.session))
        })

        request(app)
          .get('/')
          .expect(shouldHaveCookie('session'))
          .expect(200, 'null', done)
      })
    })

    describe('{}', function () {
      it('should not Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session = {}
          res.end('hello, world')
        })

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, 'hello, world', done)
      })
    })

    describe('{a: b}', function () {
      it('should create a session', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session = { message: 'hello' }
          res.end('klajsdfasdf')
        })

        request(app)
          .get('/')
          .expect(shouldHaveCookie('session'))
          .expect(200, done)
      })
    })

    describe('anything else', function () {
      it('should throw', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session = 'aklsdjfasdf'
        })

        request(app)
          .get('/')
          .expect(500, done)
      })
    })
  })

  describe('req.session', function () {
    describe('.isPopulated', function () {
      it('should be false on new session', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          res.end(String(req.session.isPopulated))
        })

        request(app)
          .get('/')
          .expect(200, 'false', done)
      })

      it('should be true after adding property', function (done) {
        var app = App()
        app.use(function (req, res, next) {
          req.session.message = 'hello!'
          res.end(String(req.session.isPopulated))
        })

        request(app)
          .get('/')
          .expect(200, 'true', done)
      })
    })
  })

  describe('req.sessionOptions', function () {
    it('should be the session options', function (done) {
      var app = App({ name: 'my.session' })
      app.use(function (req, res, next) {
        res.end(String(req.sessionOptions.name))
      })

      request(app)
        .get('/')
        .expect(200, 'my.session', done)
    })

    it('should alter the cookie setting', function (done) {
      var app = App({ maxAge: 3600000, name: 'my.session' })
      app.use(function (req, res, next) {
        if (req.url === '/max') {
          req.sessionOptions.maxAge = 6500000
        }

        req.session.message = 'hello!'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithTTLBetween('my.session', 0, 3600000))
        .expect(200, function (err) {
          if (err) return done(err)
          request(app)
            .get('/max')
            .expect(shouldHaveCookieWithTTLBetween('my.session', 5000000, Infinity))
            .expect(200, done)
        })
    })
  })
})

function App (options) {
  var opts = Object.create(options || null)
  opts.keys = ['a', 'b']
  var app = connect()
  app.use(session(opts))
  return app
}

function cookieHeader (cookies) {
  return Object.keys(cookies).map(function (name) {
    return name + '=' + cookies[name].value
  }).join('; ')
}

function cookies (res) {
  var headers = res.headers['set-cookie'] || []
  var obj = Object.create(null)

  for (var i = 0; i < headers.length; i++) {
    var params = Object.create(null)
    var parts = headers[i].split(';')
    var nvp = parts[0].split('=')

    for (var j = 1; j < parts.length; j++) {
      var pvp = parts[j].split('=')

      params[pvp[0].trim().toLowerCase()] = pvp[1]
        ? pvp[1].trim()
        : true
    }

    var ttl = params.expires
      ? Date.parse(params.expires) - Date.parse(res.headers.date)
      : null

    obj[nvp[0].trim()] = {
      value: nvp.slice(1).join('=').trim(),
      params: params,
      ttl: ttl
    }
  }

  return obj
}

function shouldHaveCookie (name) {
  return function (res) {
    assert.ok((name in cookies(res)), 'should have cookie "' + name + '"')
  }
}

function shouldHaveCookieWithParameter (name, param) {
  return function (res) {
    assert.ok((name in cookies(res)), 'should have cookie "' + name + '"')
    assert.ok((param.toLowerCase() in cookies(res)[name].params),
      'should have parameter "' + param + '"')
  }
}

function shouldHaveCookieWithoutParameter (name, param) {
  return function (res) {
    assert.ok((name in cookies(res)), 'should have cookie "' + name + '"')
    assert.ok(!(param.toLowerCase() in cookies(res)[name].params),
      'should not have parameter "' + param + '"')
  }
}

function shouldHaveCookieWithTTLBetween (name, low, high) {
  return function (res) {
    assert.ok((name in cookies(res)), 'should have cookie "' + name + '"')
    assert.ok(('expires' in cookies(res)[name].params),
      'should have parameter "expires"')
    assert.ok((cookies(res)[name].ttl >= low && cookies(res)[name].ttl <= high),
      'should have TTL between ' + low + ' and ' + high)
  }
}

function shouldHaveCookieWithValue (name, value) {
  return function (res) {
    assert.ok((name in cookies(res)), 'should have cookie "' + name + '"')
    assert.strictEqual(cookies(res)[name].value, value)
  }
}

function shouldNotSetCookies () {
  return function (res) {
    assert.strictEqual(res.headers['set-cookie'], undefined, 'should not set cookies')
  }
}
