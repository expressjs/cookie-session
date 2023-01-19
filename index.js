/*!
 * cookie-session
 * Copyright(c) 2013 Jonathan Ong
 * Copyright(c) 2014-2017 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var Buffer = require('safe-buffer').Buffer
var debug = require('debug')
var Cookies = require('cookies')
var onHeaders = require('on-headers')
var flatten = require('array-flatten')

/**
 * Module exports.
 * @public
 */

module.exports = cookieSession

var defaultConfiguration = {
  name: 'session',
  sessionName: 'session',
  overwrite: true,
  httpOnly: true,
  signed: true,
}

/**
 * @typedef Configuration
 *
 * @type {object}
 * @property {boolean} [httpOnly=true]
 * @property {array} [keys]
 * @property {string} [name=session] - Name of the cookie to use
 * @property {string} [sessionName=session] - The key on `request.sessions`
 *   through which the session can be accessed. Sessions with sessionName
 *   'session' (the default) will always be accessible at `req.session`.
 * @property {boolean} [overwrite=true]
 * @property {string} [secret]
 * @property {boolean} [signed=true]
 */

/**
 * Create a new cookie session middleware.
 *
 * @param {...Configuration|Configuration[]} configurations
 * @return {function} middleware function
 * @public
 */
function cookieSession (configurations) {
  var configs = flatten(Array.prototype.slice.call(arguments), null)
  switch (configs.length) {
    case 0:
      configs = [{}]
      break
    case 1:
      break
    default:
      ['name', 'sessionName'].forEach(function throwIfDupName(nameKind) {
        var names = Object.create(null)
        configs.forEach(function checkUniqueness(c) {
          var name = c[nameKind] || 'null'
          if (name in names) {
            throw new Error('Each configuration must have a unique ' + nameKind)
          } else {
            names[name] = true
          }
        })
      })
  }
  return compose(configs.map(createCookieSessionMiddleware))
}

function createCookieSessionMiddleware(config) {
  // Options inherit from config but with defaults applied
  var opts = Object.create(config)
  Object.keys(defaultConfiguration).forEach(function applyDefaults(k) {
    if (opts[k] == null) opts[k] = defaultConfiguration[k]
  })

  // secrets
  var keys = opts.keys
  if ((!keys || !keys.length) && opts.secret) keys = [opts.secret]

  if (!keys && opts.signed) {
    throw new Error("If '.signed' is true, '.keys' or '.secret' are required.")
  }

  // Debug namespace
  var sessionDebug = debug('cookie-session:' + opts.name)
  sessionDebug('Session options %j', opts)

  return function cookieSessionMiddleware (req, res, next) {
    var cookies = new Cookies(req, res, {
      keys: keys
    })
    var sess

    // for overriding
    var overrideOptions = Object.create(opts)

    // If the name is session, add classic accessors for backwards compatibility
    if (opts.sessionName === 'session') {
      // for overriding
      req.sessionOptions = overrideOptions

      // define req.session getter / setter
      Object.defineProperty(req, 'session', {
        configurable: true,
        enumerable: true,
        get: getSession,
        set: setSession
      })
    }

    if (!('sessions' in req)) {
      req.sessions = {}
    }
    if (!('sessionsOptions' in req)) {
      req.sessionsOptions = {}
    }

    // for overriding
    req.sessionsOptions[opts.sessionName] = overrideOptions

    // define req.sessions[sessionName] getter / setter
    Object.defineProperty(req.sessions, opts.sessionName, {
      configurable: true,
      enumerable: true,
      get: getSession,
      set: setSession
    })

    function getSession () {
      // already retrieved
      if (sess) {
        return sess
      }

      // unset
      if (sess === false) {
        return null
      }

      // get session
      if ((sess = tryGetSession(
        cookies, opts.name, req.sessionsOptions[opts.sessionName], sessionDebug
      ))) {
        return sess
      }

      // create session
      sessionDebug('session created')
      return (sess = Session.create())
    }

    function setSession (val) {
      if (val == null) {
        // unset session
        sess = false
        return val
      }

      if (typeof val === 'object') {
        // create a new session
        sess = Session.create(val)
        return sess
      }

      throw new Error('req.session can only be set as null or an object.')
    }

    onHeaders(res, function setHeaders () {
      if (sess === undefined) {
        // not accessed
        return
      }

      try {
        if (sess === false) {
          // remove
          sessionDebug('session removed')
          cookies.set(opts.name, '', req.sessionsOptions[opts.sessionName])
        } else if ((!sess.isNew || sess.isPopulated) && sess.isChanged) {
          // save populated or non-new changed session
          sessionDebug('save %s', opts.name)
          cookies.set(
            opts.name,
            Session.serialize(sess),
            req.sessionsOptions[opts.sessionName]
          )
        }
      } catch (e) {
        sessionDebug('error saving session: %s', e.message)
      }
    })

    next()
  }
}

/**
 * Compose a non-empty array of middleware into one function
 * @param {function[]} middlewares - middleware functions
 * @return {function} middleware function
 */
function compose(middlewares) {
  var head = middlewares[0]
  var tail = middlewares.slice(1)

  if (!tail.length) {
    return head;
  }

  return function(req, res, next) {
    head(req, res, function(err) {
      if (err) return next(err);
      compose(tail)(req, res, next);
    });
  };
}

/**
 * Session model.
 *
 * @param {SessionContext} ctx
 * @param {Object} obj
 * @private
 */

function Session (ctx, obj) {
  Object.defineProperty(this, '_ctx', {
    value: ctx
  })

  if (obj) {
    for (var key in obj) {
      this[key] = obj[key]
    }
  }
}

/**
 * Create new session.
 * @private
 */

Session.create = function create (obj) {
  var ctx = new SessionContext()
  return new Session(ctx, obj)
}

/**
 * Create session from serialized form.
 * @private
 */

Session.deserialize = function deserialize (str) {
  var ctx = new SessionContext()
  var obj = decode(str)

  ctx._new = false
  ctx._val = str

  return new Session(ctx, obj)
}

/**
 * Serialize a session to a string.
 * @private
 */

Session.serialize = function serialize (sess) {
  return encode(sess)
}

/**
 * Return if the session is changed for this request.
 *
 * @return {Boolean}
 * @public
 */

Object.defineProperty(Session.prototype, 'isChanged', {
  get: function getIsChanged () {
    return this._ctx._new || this._ctx._val !== Session.serialize(this)
  }
})

/**
 * Return if the session is new for this request.
 *
 * @return {Boolean}
 * @public
 */

Object.defineProperty(Session.prototype, 'isNew', {
  get: function getIsNew () {
    return this._ctx._new
  }
})

/**
 * populated flag, which is just a boolean alias of .length.
 *
 * @return {Boolean}
 * @public
 */

Object.defineProperty(Session.prototype, 'isPopulated', {
  get: function getIsPopulated () {
    return Object.keys(this).length > 0
  }
})

/**
 * Session context to store metadata.
 *
 * @private
 */

function SessionContext () {
  this._new = true
  this._val = undefined
}

/**
 * Decode the base64 cookie value to an object.
 *
 * @param {String} string
 * @return {Object}
 * @private
 */

function decode (string) {
  var body = Buffer.from(string, 'base64').toString('utf8')
  return JSON.parse(body)
}

/**
 * Encode an object into a base64-encoded JSON string.
 *
 * @param {Object} body
 * @return {String}
 * @private
 */

function encode (body) {
  var str = JSON.stringify(body)
  return Buffer.from(str).toString('base64')
}

/**
 * Try getting a session from a cookie.
 * @private
 */

function tryGetSession (cookies, name, opts, log) {
  var str = cookies.get(name, opts)

  if (!str) {
    return undefined
  }

  log('parsing session: %s', str)

  try {
    return Session.deserialize(str)
  } catch (err) {
    return undefined
  }
}
