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
