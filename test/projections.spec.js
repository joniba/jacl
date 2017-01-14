'use strict';
const sinon = require('sinon');
const should = require('chai').should();
const Promise = require('bluebird');
const Cache = require('../lib/cache');
const invalidators = require('../lib/invalidators');

describe('Cache projections: ', function () {
    let clock;
    
    before(function () {
        clock = sinon.useFakeTimers(Date.now());
    });
    
    after(function () {
        clock.restore();
    });
    
    it('should project data into multiple keys', function (done) {
        let val = 1;
        let cache = new Cache();
        
        cache.getOrCreate('main', () => val, invalidators.absoluteTime(1), {
            projections: [
                { key: 'timesTwo', project: x => x * 2 },
                { key: 'timesTen', project: x => x * 10 },
            ]
        })
            .then(data => {
                data.should.equal(1);
                return Promise.all([cache.get('timesTwo'), cache.get('timesTen')]);
            })
            .spread((timesTwo, timesTen) => {
                should.exist(timesTwo);
                should.exist(timesTen);
                timesTwo.should.equal(2);
                timesTen.should.equal(10);
                // change value and retrieve cache again without invalidating
                val = 10;
                return Promise.all([cache.get('timesTwo'), cache.get('timesTen')]);
            })
            .spread((timesTwo, timesTen) => {
                should.exist(timesTwo);
                should.exist(timesTen);
                timesTwo.should.equal(2);
                timesTen.should.equal(10);
                // invalidate cache (modified value should be loaded)
                clock.tick(2);
                return Promise.all([cache.get('timesTwo'), cache.get('timesTen')]);
            })
            .spread((timesTwo, timesTen) => {
                should.exist(timesTwo);
                should.exist(timesTen);
                timesTwo.should.equal(20);
                timesTen.should.equal(100);
                // invalidate cache without changing value (cache should be reloaded but have same value)
                clock.tick(2);
                return Promise.all([cache.get('timesTwo'), cache.get('timesTen')]);
            })
            .spread((timesTwo, timesTen) => {
                should.exist(timesTwo);
                should.exist(timesTen);
                timesTwo.should.equal(20);
                timesTen.should.equal(100);
            })
            .then(done, done);
    });
});