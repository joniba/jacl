'use strict';
const Promise = require('bluebird');
const sinon = require('sinon');
const should = require('chai').should();
const Cached = require('../lib/cached');

describe('Cached invalidators: ', function () {
    describe('Absolute time expiration', function () {
        let clock;
    
        before(function () {
            clock = sinon.useFakeTimers(Date.now());
        });
    
        after(function () {
            clock.restore();
        });
        
        it('should invalidate cache after expiration time', function (done) {
            let val = 1;
            let cached = new Cached(() => val++, Cached.invalidators.absoluteTime(100));
            cached.getData()
                .then(data => {
                    data.should.equal(1);
                    clock.tick(99);
                    return cached.getData();
                })
                .then(data => {
                    data.should.equal(1);
                    clock.tick(2);
                    return cached.getData()
                })
                .then(data => {
                    data.should.equal(2);
                    clock.tick(98);
                    return cached.getData()
                })
                .then(data => {
                    data.should.equal(2);
                    clock.tick(2);
                    return cached.getData()
                })
                .then(data => {
                    data.should.equal(3);
                })
                .then(done, done);
        });
        
        it('should parse time to milliseconds', function (done) {
            let val = 1;
            let cached = new Cached(() => val++, '1h');
            cached.getData()
                .then(data => {
                    data.should.equal(1);
                    clock.tick(1000 * 60 * 59);
                    return cached.getData();
                })
                .then(data => {
                    data.should.equal(1);
                    clock.tick(1000 * 60 * 2);
                    return cached.getData()
                })
                .then(data => {
                    data.should.equal(2);
                })
                .then(done, done);
        });
    });
    
    describe('Custom invalidator', function () {
        it('should invalidate as specified', function (done) {
            let val = 1;
            let invalidated = false;
            let cached = new Cached(() => val++, Cached.invalidators.custom(() => invalidated = !invalidated));
            cached.getData()
                .then(data => {
                    data.should.equal(1);
                    return cached.getData();
                })
                .then(data => {
                    data.should.equal(2);
                    return cached.getData()
                })
                .then(data => {
                    data.should.equal(2);
                    return cached.getData();
                })
                .then(data => {
                    data.should.equal(3);
                })
                .then(done, done);
        });
    });
    
    describe('Chain invalidator', function () {
        it('should invalidate when dependency is invalidated and not wait for dependency to be evicted', function (done) {
            let val1 = 1;
            let val2 = 1;
            let invalidated = false;
            let cached1 = new Cached(() => val1++, Cached.invalidators.custom(() => invalidated));
            let cached2 = new Cached(() => val2++, Cached.invalidators.chain(cached1));
            Promise.all([cached1.getData(), cached2.getData()])
                .spread((data1, data2) => {
                    data1.should.equal(1);
                    data2.should.equal(1);
                    return Promise.all([cached1.getData(), cached2.getData()])
                })
                .spread((data1, data2) => {
                    data1.should.equal(1);
                    data2.should.equal(1);
                    invalidated = true;
                    return Promise.all([cached1.getData(), cached2.getData()])
                })
                .spread((data1, data2) => {
                    data1.should.equal(2);
                    data2.should.equal(2);
                    return cached2.getData();
                })
                .then(data2 => {
                    data2.should.equal(3);
                    invalidated = false;
                    return cached2.getData();
                })
                .then(data2 => {
                    data2.should.equal(3);
                })
                .then(done, done);
        });
    });
});
