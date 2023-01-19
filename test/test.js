'use strict'

process.env.NODE_ENV = 'test'

var assert = require('assert')
var connect = require('connect')
var request = require('supertest')
var session = require('..')

describe('Cookie Session', function () {
  describe('"httpOnly" option', function () {
    it('should default to "true"', function (done) {
      var app = App()
      app.use(function (req, res, _next) {
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
      app.use(function (req, res, _next) {
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
      app.use(function (req, res, _next) {
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
      app.use(function (req, res, _next) {
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
    it("should use 'my.session' for cookie name, but 'session' for session name", function (done) {
      var app = App({ name: 'my.session' })
      app.use(function (req, res, _next) {
        req.session.message = 'hi'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookie('my.session'))
        .expect(200, done)
    })
  })

  describe('when options.sessionName = my.session', function () {
    it("the default-named cookie should be accessible at req.session", function (done) {
      var app = App(
        {}, // default name 'session' should be used
        {
          name: "secondary",
          sessionName: "secondary",
        }
      )
      app.use(function (req, res, next) {
        req.sessions.session.number = 1
        req.sessions.secondary.number = 2
        next()
      })
      app.use(function (req, res, _next) {
        res.end(String(req.session.number))
      })

      request(app)
        .get('/')
        .expect(200, '1', done)
    })

    it("the session should be at req.sessions['my.session'] but not req.session", function (done) {
      var app = App({ sessionName: 'my.session' })
      app.use(function (req, res, _next) {
        req.sessions['my.session'].message = 'hi'
        res.end(String(req.session))
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookie('session'))
        .expect(200, 'undefined', done)
    })

    it("should use 'my.session' as the session name, but 'session' as the cookie name", function (done) {
      var app = App({ sessionName: 'my.session' })
      app.use(function (req, res, _next) {
        req.sessions['my.session'].message = 'hi'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookie('session'))
        .expect(200, done)
    })
  })

  describe('when two cookies are used with different options', function () {
    it("should set the 'httpOnly' but not the 'jsAlso' cookie-session as httpOnly", function (done) {
      var app = App({
        name: 'httpOnly',
        sessionName: 'httpOnly',
      }, {
        name: 'jsAlso',
        sessionName: 'jsAlso',
        httpOnly: false,
      })
      app.use(function (req, res, _next) {
        req.sessions.httpOnly.message = 'httpOnly'
        req.sessions.jsAlso.message = 'jsAlso'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithParameter('httpOnly', 'httpOnly'))
        .expect(shouldHaveCookieWithoutParameter('jsAlso', 'httpOnly'))
        .expect(200, done)
    })
  })

  describe('when two cookies are configured with the same name', function () {
    it("should error if the cookies have the same name", function (done) {
      assert.throws(function() {
        App({}, {sessionName: 'secondary'})
      })
      done()
    })
    it("should error if the cookies have the same SessionName", function (done) {
      assert.throws(function() {
        App({}, {name: 'secondary'})
      })
      done()
    })
  })

  describe('when multiple cookieSessions are required', function () {
    var app
    it("multiple configs to be passed to cookieSession in an array", function () {
      app = connect()
      app.use(session([
        {
          signed: false,
        }, {
          signed: false,
          name: 'secondary',
          sessionName: 'secondary',
        }
      ]))
    })
    it("cookieSession can be called multiple times", function () {
      app = connect()
      app.use(session({
        signed: false,
      }))
      app.use(session({
        signed: false,
        name: 'secondary',
        sessionName: 'secondary',
      }))
    })
    afterEach(function (done) {
      app.use(function (req, _res, next) {
        req.session.name = req.sessionOptions.name
        req.sessions.secondary.name = req.sessionsOptions.secondary.name
        next()
      })
      app.use('/', function (req, res, _next) {
        res.end(req.session.name + req.sessions.secondary.name)
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookie('session'))
        .expect(shouldHaveCookie('secondary'))
        .expect(200, 'sessionsecondary', done)
    })
  })

  describe('when options.signed = true', function () {
    describe('when options.keys are set', function () {
      it('should work', function (done) {
        var app = connect()
        app.use(session({
          keys: ['a', 'b']
        }))
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
      app.use(function (req, res, _next) {
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
      app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
          res.end('greetings')
        })

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })

    describe('when accessed and not populated', function () {
      it('should not Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, _next) {
          var sess = req.session
          res.end(JSON.stringify(sess))
        })

        request(app)
          .get('/')
          .expect(shouldNotSetCookies())
          .expect(200, done)
      })
    })

    describe('when populated', function () {
      it('should Set-Cookie', function (done) {
        var app = App()
        app.use(function (req, res, _next) {
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
      app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
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
        app.use(function (req, res, _next) {
          res.end(String(req.session.isPopulated))
        })

        request(app)
          .get('/')
          .expect(200, 'false', done)
      })

      it('should be true after adding property', function (done) {
        var app = App()
        app.use(function (req, res, _next) {
          req.session.message = 'hello!'
          res.end(String(req.session.isPopulated))
        })

        request(app)
          .get('/')
          .expect(200, 'true', done)
      })
    })
  })

  describe('session options', function () {
    it('should be at sessionOptions by default', function (done) {
      var app = App()
      app.use(function (req, res, _next) {
        res.end(String(req.sessionOptions.name))
      })

      request(app)
        .get('/')
        .expect(200, 'session', done)
    })

    it('should also be in sessionsOptions[sessionName]', function (done) {
      var app = App()
      app.use(function (req, res, _next) {
        res.end(String(req.sessionsOptions.session.name))
      })

      request(app)
        .get('/')
        .expect(200, 'session', done)
    })

    it('should not be at sessionOptions for non-default sessionName', function (done) {
      var app = App({ sessionName: 'foo' })
      app.use(function (req, res, _next) {
        res.end(String(req.sessionOptions))
      })

      request(app)
        .get('/')
        .expect(200, 'undefined', done)
    })

    it('should alter the cookie setting', function (done) {
      var app = App({ maxAge: 3600000 })
      app.use(function (req, res, _next) {
        if (req.url === '/max') {
          req.sessionOptions.maxAge = 6500000
        }

        req.session.message = 'hello!'
        res.end()
      })

      request(app)
        .get('/')
        .expect(shouldHaveCookieWithTTLBetween('session', 0, 3600000))
        .expect(200, function (err) {
          if (err) return done(err)
          request(app)
            .get('/max')
            .expect(shouldHaveCookieWithTTLBetween('session', 5000000, Infinity))
            .expect(200, done)
        })
    })
  })
})

/**
 * Connect to an app using cookie-sessions with passed configurations
 * @param {...Configuration} configurations
 * @return {app}
 */
function App (configurations) {
  var app = connect()
  var configs = arguments.length ? Array.prototype.slice.call(arguments) : [{}]
  var keyedConfigs = configs.map(function addKeys(configuration) {
    return Object.create(configuration, { keys: {
      value: ['a', 'b'],
      enumerable: true,
    }})
  })
  app.use(session(keyedConfigs))
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
