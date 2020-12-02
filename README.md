# query-validation

[![Build Status](https://travis-ci.com/stanford-oval/query-validation.svg?branch=master)](https://travis-ci.com/stanford-oval/query-validation) [![Coverage Status](https://coveralls.io/repos/github/stanford-oval/query-validation/badge.svg?branch=master)](https://coveralls.io/github/stanford-oval/query-validation?branch=master) [![Dependency Status](https://david-dm.org/stanford-oval/query-validation/status.svg)](https://david-dm.org/stanford-oval/query-validation) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/stanford-oval/query-validation.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/stanford-oval/query-validation/context:javascript)

A small library to do server-side validation of GET and POST parameters. It is designed
to work with express, qs and body-parser.

## Usage

```javascript
const qv = require('query-validation');
const express = require('express');

const app = express();
app.get('/foo', qv.validateGET({
   param1: 'string',
   param2: 'number'
}), (req, res, next) => {
   // use req.query.param1 and req.query.param2 safely
});
```

## API

### validateGET(keys, options)

Returns a middleware function that validates the query in the request (`req.query`) according to the passed keys. The following types are accepted:

- `string`: must be a non-empty string, with no ASCII control characters except ordinary whitespace
- `number`: must be a finite, not-NaN number (either a finite JS number, or a string representing a finite number in decimal notation)
- `integer`: must be an integer number (either a JS number that is an integer, or a string representing an integer in decimal notation)
- `boolean`: must be a JS boolean, the string '1', the empty string, or undefined (missing) (this is designed to handle HTML checkboxes)
- `object`: must be a plain object (not a primitive or Array)
- `array`: must be an Array
- `null`: must be the JS `null` (this is only meaningful for JSON input)
- a RegExp object: must be a string conforming to the passed-in regular expression

All types may be prefixed with `?` to indicate that the value is optional, in which case `undefined` is accepted.

If the query is not valid, the request will fail with a `ValidationError`, passed to the `next` handler of the middleware. The error can
be handled using express standard error handling middleware, or it will cause an Internal Server Error.

### validatePOST(keys, options)

Similar to `validateGET`, but validates `req.body` instead. This is designed to work with `bodyParser.urlencoded`, `bodyParser.json` or similar
middlewares.

Options:
- `options.accept`: mime type; if specified, the body must be of the provided content-type; use this to restrict a route to only use JSON or
  only use URL-encoded input.

### checkKey(value, spec)

Low-level method to validate a specific query or body parameter. Returns `true` or `false`.

### ValidationError

All error reported by this library are of this class. They have the following properties:

- `status`: HTTP status to use (400 or 415)
- `code`: programming-friendly error code, either `E_BAD_PARAM` or `E_BAD_CONTENT_TYPE`
- `key`: the key that caused the error, or `null`
- `message`: error message, suitable for logging but not for displaying to the user (it will not contain sensitive user data, but it might reveal
  information about the app)
