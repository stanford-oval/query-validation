// -*- mode: typescript; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Thingpedia
//
// Copyright 2019 The Board of Trustees of the Leland Stanford Junior University
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See COPYING for details

import typeIs from 'type-is';
import type * as express from 'express';

export class ValidationError extends Error {
    status : number;
    code : string;
    key : string|null;

    constructor(status : number, code : string, key : string|null, message : string) {
        super(message);
        this.status = status;
        this.code = code;
        this.key = key;
    }
}

export type TypeSpec = string[]|string|RegExp;

export function checkKey(value : unknown, type : TypeSpec) : boolean {
    if (Array.isArray(type)) {
        for (const option of type) {
            if (checkKey(value, option))
                return true;
        }
        return false;
    }
    if (type instanceof RegExp) {
        if (value === undefined)
            value = '';
        if (typeof value !== 'string')
            return false;
        return type.test(value);
    }

    if (type.startsWith('?')) {
        if (value === undefined || value === '' || value === null)
            return true;
        type = type.substring(1);
    }

    switch (type) {
    case 'null':
        return value === null;

    case 'array':
        return Array.isArray(value);

    case 'string':
        // NOTE: the character ranges U+0000-U+001F and U+007F-U+009F are control
        // characters (NUL, BACKSPACE, DEL, etc.) that have special meaning in many
        // contexts
        // there is no reason to allow them, anywhere
        /* eslint no-control-regex: "off" */
        return typeof value === 'string' && !!value && !/[\x00-\x08\x0e-\x1f\x7f-\x9f]/.test(value);

    case 'boolean':
        // a checkbox is either present (== 1) or absent (== undefined)
        // for api compatibility, also allow true/false
        return value === undefined || value === '1' || value === '' || value === true || value === false;

    // NOTE: parseInt/parseFloat have weird behavior with trailing garbage
    // we don't want to accept that, so we use the unary "+" operator to
    // convert to a number instead
    case 'number':
        return typeof value === 'string' && value !== '' && Number.isFinite(+value);
    case 'integer':
        return typeof value === 'string' && value !== '' && Number.isInteger(+value);

    case 'object':
        return typeof value === 'object' && !Array.isArray(value);

    default:
        // should never be reached
        return false;
    }
}

function failKey(key : string) : Error {
    return new ValidationError(400 /* Bad Request */, 'E_BAD_PARAM', key, `missing or invalid parameter ${key}`);
}

function failContentType() : Error {
    return new ValidationError(415 /* Not Acceptable */, 'E_BAD_CONTENT_TYPE', null, `invalid content-type`);
}

interface ValidateOptions {
    accept ?: string;
}

function _validate(req : express.Request,
                   res : express.Response,
                   next : (err ?: Error) => void,
                   body : Record<string, unknown>,
                   keys : Record<string, TypeSpec>,
                   options : ValidateOptions) {
    for (const key in keys) {
        if (!checkKey(body[key], keys[key])) {
            next(failKey(key));
            return;
        }
    }
    next();
}

export function validateGET(keys : Record<string, TypeSpec>, options : ValidateOptions = {}) : express.RequestHandler {
    return function(req : express.Request, res : express.Response, next : (err ?: Error) => void) {
        _validate(req, res, next, req.query, keys, options);
    };
}
export function validatePOST(keys : Record<string, TypeSpec>, options : ValidateOptions = {}) : express.RequestHandler {
    return function(req : express.Request, res : express.Response, next : (err ?: Error) => void) {
        if (options.accept && !typeIs(req, options.accept)) {
            next(failContentType());
            return;
        }

        _validate(req, res, next, req.body, keys, options);
    };
}
