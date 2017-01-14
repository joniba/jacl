'use strict';
const _ = require('lodash');
const Promise = require('bluebird');
const debug = require('debug')('cached');
const EventEmitter = require('events').EventEmitter;

const Cached = module.exports = class extends EventEmitter {
    /**
     * @param {Function} loader - function for loading the encapsulated data.
     * @param {Object|Array|Number} invalidation - An object or array of objects conforming to the
     * invalidator signature (see absolute_time_expiration.js); or a number or string representing the
     * absolute expiration time of the cached data.
     * @param {string} [key] - for debugging purposes only
     */
    constructor(loader, invalidation, key) {
        super();
        this.loader = loader;
        this.invalidators = Cached.getInvalidators(invalidation);
        this.key = key;
    }
    
    getData() {
        if (!this.invalidated())
            return Promise.resolve(this.data);
        
        this.emit('invalidated', this);
        
        if (this.data && this.key)
            debug(`Cache "${this.key}" invalidated, reloading.`);
        
        return Promise.resolve(this.loader()).then(data => {
            this.emit('dataLoaded', data);
            this.invalidators.forEach(x => x.dataLoaded(data));
            this.data = data;
            return data;
        });
    }
    
    invalidated() {
        return this.data == null || this.invalidators.some(x => x.invalidated(this.data));
    }
    
    static getInvalidators(invalidation) {
        if (!invalidation)
            return [];
        
        if (_.isArray(invalidation))
            return invalidation;
        
        if (_.isFinite(invalidation) || _.isString(invalidation))
            return [Cached.invalidators.absoluteTime(invalidation)];
        
        return [invalidation];
    }
};

Cached.invalidators = require('./invalidators');