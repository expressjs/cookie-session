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
