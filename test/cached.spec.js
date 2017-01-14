'use strict';
const _ = require('lodash');
const Promise = require('bluebird');
const sinon = require('sinon');
const should = require('chai').should();
const Cached = require('../lib/cached');

describe('Cached', function () {
    it('should load data with loader', function (done) {
        let val = 5;
        let loader = () => val;
        let cached = new Cached(loader);
        cached.getData()
            .then(data => {
                data.should.equal(5);
            })
            .then(done, done);
    });
    
    it('should reload data until a non-null result is returned', function (done) {
        let val = undefined;
        let loader = () => val;
        let cached = new Cached(loader);
        cached.getData()
            .then(data => {
                should.not.exist(data);
                val = null;
                return cached.getData();
            })
            .then(data => {
                should.not.exist(data);
                val = false;
                return cached.getData();
            })
            .then(data => {
                should.exist(data);
                data.should.equal(false);
                val = 3;
                return cached.getData();
            })
            .then(data => {
                should.exist(data);
                data.should.equal(false);
            })
            .then(done, done);
    });
});
