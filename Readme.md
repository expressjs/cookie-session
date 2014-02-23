# cookie-session

 Simple cookie-based session middleware.

## Example

  View counter example:

```js
var session = require('cookie-session');
var connect = require('connect');
var app = connect();

app.use(session({
  keys: ['a', 'b']
}));
app.use(session());

app.use(function (req, res, next){
  var n = req.session.views || 0;
  req.session.views = ++n;
  res.end(n + ' views');
})

app.listen(3000);
console.log('listening on port 3000');
```

## Semantics

  This module provides "guest" sessions, meaning any visitor will have a session,
  authenticated or not. If a session is _new_ a Set-Cookie will be produced regardless
  of populating the session.

## API

### Options

  The cookie name is controlled by the `key` option, which defaults
  to "express:sess". All other options are passed to `cookies.get()` and
  `cookies.set()` allowing you to control security, domain, path,
  and signing among other settings.

  Read more here: https://github.com/jed/cookies

### Session#isNew

  Returns __true__ if the session is new.

### Destroying a session

  To destroy a session simply set it to `null`:

```js
req.session = null;
```

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
