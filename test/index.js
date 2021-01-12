// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond Cloud
//
// Copyright 2019 The Board of Trustees of the Leland Stanford Junior University
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details

import * as qs from 'qs';
import assert from 'assert';

import * as iv from '../lib';

const TEST_CASES = [
    ['foo=bar', { foo: 'string' }, true],
    ['foo=bar', { foo: 'number' }, false],
    ['foo=bar', { foo: '?string' }, true],
    ['', { foo: '?string' }, true],
    ['', { foo: 'string' }, false],
    ['', { foo: '?number' }, true],

    ['foo=1&bar=2', { foo: 'string', bar: 'number' }, true],
    ['foo=1&bar=lol', { foo: 'string', bar: 'number' }, false],
    ['foo=&bar=2', { foo: 'string', bar: 'number' }, false],

    ['foo=', { foo: '?string' }, true],
    ['foo=', { foo: 'string' }, false],
    ['foo=', { foo: '?number' }, true],
    ['foo=', { foo: 'number' }, false],
    ['foo=', { foo: '?integer' }, true],
    ['foo=', { foo: 'integer' }, false],
    ['foo=', { foo: 'boolean' }, true],
    ['foo=', { foo: '?boolean' }, true],
    ['', { foo: 'boolean' }, true],

    ['foo=1', { foo: 'boolean' }, true],
    ['foo=0', { foo: 'boolean' }, false],
    ['foo=false', { foo: 'boolean' }, false],
    ['foo=true', { foo: 'boolean' }, false],

    ['foo=1', { foo: 'number' }, true],
    ['foo=1.5', { foo: 'number' }, true],
    ['foo=.5e-3', { foo: 'number' }, true],
    ['foo=Infinity', { foo: 'number' }, false],
    ['foo=1', { foo: 'integer' }, true],
    ['foo=1.5', { foo: 'integer' }, false],

    ['foo[]=', { foo: 'array' }, true],
    ['', { foo: 'array' }, false],
    ['foo=1&foo=2', { foo: 'array' }, true],
    ['foo=1', { foo: 'array' }, false],
    ['foo=1', { foo: ['array', 'string'] }, true],
    ['foo=1&foo=2', { foo: ['array', 'string'] }, true],
    ['', { foo: ['array', 'string'] }, false],
    ['', { foo: ['array', '?string'] }, true],
    ['', { foo: '?array' }, true],

    ['foo[key]=1', { foo: 'object' }, true],
    ['foo[key]=1', { foo: 'array' }, false],
    ['foo[key]=1', { foo: 'string' }, false],
    ['foo[]=1&foo[key]=2', { foo: 'array' }, false],

    ['', { foo: 'string' }, false, { json: true }],

    ['class%5B0%5D=foo&class%5B1%5D=bar', { class: '?string' }, false],

    // test that control characters are rejected
    ['foo=\x00', { foo: 'string' }, false],
    ['foo=\x00', { foo: '?string' }, false],
    ['foo=abc\x00def', { foo: 'string' }, false],
    ['foo=abcdef\x00', { foo: 'string' }, false],
    ['foo=\x00abcdef', { foo: 'string' }, false],
    ['foo=\x08', { foo: 'string' }, false],
    ['foo=\x9d', { foo: 'string' }, false],
    ['foo=\x1f', { foo: 'string' }, false],
    ['foo=\x7f', { foo: 'string' }, false],
    ['foo=\x9f', { foo: 'string' }, false],
    // but whitespace is allowed
    ['foo=\n', { foo: 'string' }, true],
    ['foo=\r', { foo: 'string' }, true],
    ['foo=\v', { foo: 'string' }, true],
    ['foo=\f', { foo: 'string' }, true],
    ['foo=\t', { foo: 'string' }, true],
    ['foo=%20', { foo: 'string' }, true],
    ['foo= ', { foo: 'string' }, true],
    ['foo=%0A', { foo: 'string' }, true],

    // Regular Expression:
    ['foo=bar', { foo: /ba[rz]/ }, true],
    ['foo=baz', { foo: /ba[rz]/ }, true],
    ['foo=foo', { foo: /ba[rz]/ }, false],
    ['foo[]=bar&foo[]=baz', { foo: /ba[rz]/ }, false],
    ['foo[]=bar', { foo: /ba[rz]/ }, false],
    ['foo[0]=bar', { foo: /ba[rz]/ }, false],
    ['foo=barbarian', { foo: /ba[rz]/ }, true],
    ['foo=barbarian', { foo: /^ba[rz]$/ }, false],
    ['foo=', { foo: /ba[rz]/ }, false],
    ['foo=', { foo: /^ba[rz]$/ }, false],
    ['foo=', { foo: /^$|^ba[rz]$/ }, true],
    ['', { foo: /ba[rz]/ }, false],
    ['', { foo: /^ba[rz]$/ }, false],
    ['', { foo: /^$|^ba[rz]$/ }, true],
];

function test(i) {
    console.log(`Test Case #${i+1}`);
    const [input, validation, expected, options] = TEST_CASES[i];

    const req = {
        _(x) { return x; },
        query: qs.parse(input)
    };
    const res = {
    };
    const next = (err) => {
        if (err) {
            if (expected)
                assert.fail(`unexpected error for ${input}`);
            assert(err.message.startsWith('missing or invalid parameter'));
            assert.strictEqual(err.code, 'E_BAD_PARAM');
            assert.strictEqual(err.status, 400);
        } else {
            if (!expected)
                assert.fail(`unexpected success for ${input}`);
        }
    };

    iv.validateGET(validation, options)(req, res, next);
}

export default function main() {
    for (let i = 0; i < TEST_CASES.length; i++)
        test(i);
}
if (!module.parent)
    main();
