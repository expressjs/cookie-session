2.1.1 / 2025-07-17
==========

  * deps: on-headers@~1.1.0
    - Fix [CVE-2025-7339](https://www.cve.org/CVERecord?id=CVE-2025-7339) ([GHSA-76c9-3jph-rj3q](https://github.com/expressjs/on-headers/security/advisories/GHSA-76c9-3jph-rj3q))

2.1.0 / 2024-01-23
==================

  * Fix loading sessions with special keys
  * deps: cookies@0.9.1
    - Add `partitioned` option for CHIPS support
    - Add `priority` option for Priority cookie support
    - Fix accidental cookie name/value truncation when given invalid chars
    - Fix `maxAge` option to reject invalid values
    - Remove quotes from returned quoted cookie value
    - Use `req.socket` over deprecated `req.connection`
    - pref: small lookup regexp optimization

2.0.0 / 2021-12-16
==================

  * deps: debug@3.2.7
  * deps: safe-buffer@5.2.1

2.0.0-rc.1 / 2020-01-23
=======================

  * Remove private `req.session.save()`
  * Remove undocumented `req.session.length` to free up key name
  * Remove undocumented `req.sessionCookies` and `req.sessionKey`
  * deps: cookies@0.8.0
    - Fix check for default `secure` option behavior
    - Fix `maxAge` option preventing cookie deletion
    - Support `"none"` in `sameSite` option
    - deps: depd@~2.0.0
    - deps: keygrip@~1.1.0
    - perf: remove argument reassignment
  * deps: debug@3.2.6
  * deps: on-headers@~1.0.2
    - Fix `res.writeHead` patch missing return value
  * deps: safe-buffer@5.2.0
  * perf: remove internal reference to request from session object

2.0.0-beta.3 / 2017-10-13
=========================

  * deps: cookies@0.7.1
    - deps: depd@~1.1.1
    - deps: keygrip@~1.0.2
  * deps: debug@3.1.0
    - Add `DEBUG_HIDE_DATE`
    - Add 256 color mode support
    - Enable / disable namespaces dynamically
    - Make millisecond timer namespace-specific
    - Remove `DEBUG_FD` support
    - Use `Date#toISOString()` when output is not a TTY
  * deps: safe-buffer@5.1.1

2.0.0-beta.2 / 2017-05-23
=========================

  * Create new session for all types of invalid sessions
  * Use `safe-buffer` for improved Buffer API
  * deps: debug@2.6.8
    - Fix `DEBUG_MAX_ARRAY_LENGTH`
    - deps: ms@2.0.0

2.0.0-beta.1 / 2017-02-19
==========================

  * Drop support for Node.js 0.8
  * deps: cookies@0.7.0
    - Add `sameSite` option for SameSite cookie support
    - pref: enable strict mode

2.0.0-alpha.3 / 2017-02-12
==========================

  * Use `Object.defineProperty` instead of deprecated `__define*__`
  * deps: cookies@0.6.2
    - deps: keygrip@~1.0.1
  * deps: debug@2.6.1
    - Allow colors in workers
    - Deprecated `DEBUG_FD` environment variable set to `3` or higher
    - Fix error when running under React Native
    - Use same color for same namespace
    - deps: ms@0.7.2

2.0.0-alpha.2 / 2016-11-10
==========================

  * deps: cookies@0.6.1
  * deps: debug@2.3.2
    - Fix error when running under React Native
    - deps: ms@0.7.2

2.0.0-alpha.1 / 2015-10-11
==========================

  * Change default cookie name to `session`
  * Change `.populated` to `.isPopulated`
  * Remove the `key` option; use `name` instead
  * Save all enumerable properties on `req.session`
    - Including `_`-prefixed properties
  * perf: reduce the scope of try-catch deopt
  * deps: cookies@0.5.1
    - Throw on invalid values provided to `Cookie` constructor
  * deps: on-headers@~1.0.1
    - perf: enable strict mode

1.4.0 / 2020-01-06
==================

  * deps: cookies@0.8.0
    - Fix check for default `secure` option behavior
    - Fix `maxAge` option preventing cookie deletion
    - Support `"none"` in `sameSite` option
    - deps: depd@~2.0.0
    - deps: keygrip@~1.1.0

1.3.3 / 2019-02-28
==================

  * deps: cookies@0.7.3
    - deps: depd@~1.1.2
    - deps: keygrip@~1.0.3
    - perf: remove argument reassignment
  * deps: on-headers@~1.0.2
    - Fix `res.writeHead` patch missing return value

1.3.2 / 2017-09-24
==================

  * deps: debug@2.6.9

1.3.1 / 2017-08-27
==================

  * deps: cookies@0.7.1
    - deps: depd@~1.1.1
    - deps: keygrip@~1.0.2

1.3.0 / 2017-08-03
==================

  * deps: cookies@0.7.0
    - Add `sameSite` option for SameSite cookie support
    - Throw on invalid values provided to `Cookie` constructor
    - deps: keygrip@~1.0.1
    - pref: enable strict mode
  * deps: debug@2.6.8
    - Allow colors in workers
    - Deprecate `DEBUG_FD` environment variable set to 3 or higher
    - Fix error when running under React Native
    - Use same color for same namespace
    - deps: ms@2.0.0
  * deps: on-headers@~1.0.1
    - perf: enable strict mode

1.2.0 / 2015-07-01
==================

  * Make `isNew` non-enumerable and non-writeable
  * Make `req.sessionOptions` a shallow clone to override per-request
  * deps: debug@~2.2.0
    - Fix high intensity foreground color for bold
    - deps: ms@0.7.0
  * perf: enable strict mode
  * perf: remove argument reassignments

1.1.0 / 2014-11-09
==================

  * Fix errors setting cookies to be non-fatal
  * Use `on-headers` instead of `writeHead` patching
  * deps: cookies@0.5.0
  * deps: debug@~2.1.0

1.0.2 / 2014-05-07
==================

  * Add `name` option

1.0.1 / 2014-02-24
==================

  * Fix duplicate `dependencies` in `package.json`

1.0.0 / 2014-02-23
==================

  * Initial release
