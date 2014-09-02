/**
 * Module dependencies.
 */

var crypto = require('crypto');
var debug = require('debug')('cookie-session');
var Cookies = require('cookies');

/**
 * Initialize session middleware with options.
 *
 * See README.md for documentation of options.
 *
 * @param {Object} [opts]
 * @return {Function} middleware
 * @api public
 */

module.exports = function(opts){
  opts = opts || {};

  // name - previously "opts.key"
  var name = opts.name || opts.key || 'express:sess';

  // secrets
  var keys = opts.keys;
  if (!keys && opts.secret) keys = [opts.secret];

  // defaults
  if (null == opts.overwrite) opts.overwrite = true;
  if (null == opts.httpOnly) opts.httpOnly = true;
  if (null == opts.signed) opts.signed = true;
  if (null == opts.encrypted) opts.encrypted = true;

  if (!keys && (opts.signed || opts.encrypted)){
    throw new Error('.keys required.');
  }

  debug('session options %j', opts);

  return function cookieSession(req, res, next){
    var cookies = req.sessionCookies = new Cookies(req, res, keys);
    var sess, json, decoded;

    // to pass to Session()
    req.sessionOptions = opts;
    req.sessionKey = name;
    req.sessionEncryptionKeys = keys;

    req.__defineGetter__('session', function(){
      // already retrieved
      if (sess) return sess;

      // unset
      if (false === sess) return null;

      json = cookies.get(name, opts);

      if (json) {
        debug('parse %s', json);
        try {
          if (opts.encrypted) {
            decoded = decrypt(keys, json);
          } else {
            decoded = decode(keys, json);
          }
          sess = new Session(req, decoded);
        } catch (err) {
          // backwards compatibility:
          // create a new session if parsing fails.
          // new Buffer(string, 'base64') does not seem to crash
          // when `string` is not base64-encoded.
          // but `JSON.parse(string)` will crash.
          if (!(err instanceof SyntaxError)) throw err;
          sess = new Session(req);
        }
      } else {
        debug('new session');
        sess = new Session(req);
      }

      return sess;
    });

    req.__defineSetter__('session', function(val){
      if (null == val) return sess = false;
      if ('object' == typeof val) return sess = new Session(req, val);
      throw new Error('req.session can only be set as null or an object.');
    });

    var writeHead = res.writeHead;
    res.writeHead = function () {
      if (undefined === sess) {
        // not accessed
      } else if (false === sess) {
        // remove
        cookies.set(name, '', opts);
      } else if (!json && !sess.length) {
        // do nothing if new and not populated
      } else if (sess.changed(keys, json)) {
        // save
        sess.save();
      }
      writeHead.apply(res, arguments);
    }

    next();
  }
};

/**
 * Session model.
 *
 * @param {Context} ctx
 * @param {Object} obj
 * @api private
 */

function Session(ctx, obj) {
  this._ctx = ctx;
  if (!obj) this.isNew = true;
  else for (var k in obj) this[k] = obj[k];
}

/**
 * JSON representation of the session.
 *
 * @return {Object}
 * @api public
 */

Session.prototype.inspect =
Session.prototype.toJSON = function(){
  var self = this;
  var obj = {};

  Object.keys(this).forEach(function(key){
    if ('isNew' == key) return;
    if ('_' == key[0]) return;
    obj[key] = self[key];
  });

  return obj;
};

/**
 * Check if the session has changed relative to the `prev`
 * JSON value from the request.
 *
 * @param {String} [prev]
 * @return {Boolean}
 * @api private
 */

Session.prototype.changed = function(keys, prev){
  if (!prev) return true;
  var ctx = this._ctx;
  var opts = ctx.sessionOptions;
  if (opts.encrypted){
    this._json = encrypt(keys, this);
  } else{
    this._json = encode(this);
  }
  return this._json != prev;
};

/**
 * Return how many values there are in the session object.
 * Used to see if it's "populated".
 *
 * @return {Number}
 * @api public
 */

Session.prototype.__defineGetter__('length', function(){
  return Object.keys(this.toJSON()).length;
});

/**
 * populated flag, which is just a boolean alias of .length.
 *
 * @return {Boolean}
 * @api public
 */

Session.prototype.__defineGetter__('populated', function(){
  return !!this.length;
});

/**
 * Save session changes by
 * performing a Set-Cookie.
 *
 * @api private
 */

Session.prototype.save = function(){
  var ctx = this._ctx;
  var opts = ctx.sessionOptions;
  var encoded;
  if (opts.encrypted){
    encoded = encrypt(ctx.sessionEncryptionKeys, this);
  } else{
    encoded = encode(this);
  }
  var json = this._json || encoded;
  var opts = ctx.sessionOptions;
  var name = ctx.sessionKey;

  debug('save %s', json);
  ctx.sessionCookies.set(name, json, opts);
};

/**
 * Decode the base64 cookie value to an object.
 *
 * @param {String} string
 * @return {Object}
 * @api private
 */

function decode(string) {
  var body = new Buffer(string, 'base64').toString('utf8');
  return JSON.parse(body);
}

/**
 * Encode an object into a base64-encoded JSON string.
 *
 * @param {Object} body
 * @return {String}
 * @api private
 */

function encode(body) {
  body = JSON.stringify(body);
  return new Buffer(body).toString('base64');
}

/**
 * Decrypt the base64 cookie value to an object.
 *
 * @param {String} string
 * @return {Object}
 * @api private
 */

function decrypt(keys, string) {
  var decipher = crypto.createDecipher('aes256', keys[0]);
  var decrypted = decipher.update(string, 'base64', 'utf8') + decipher.final('utf8');
  return JSON.parse(decrypted);
}

/**
 * Encrypt an object into a base64 aes256-encrypted JSON string.
 *
 * @param {Object} body
 * @return {String}
 * @api private
 */

function encrypt(keys, body) {
  body = JSON.stringify(body);
  var cipher = crypto.createCipher('aes256', keys[0]);
  var encrypted = cipher.update(body, 'utf8', 'base64') + cipher.final('base64');
  return encrypted;
}
