'use strict';
const Promise = require('bluebird');
const Cached = require('./cached');
const invalidators = require('./invalidators');

module.exports = class {
    /**
     * Gets a promise containing the cached data. Data is loaded if not yet loaded or if invalidated.
     * @param key
     * @returns {Promise.<T>} - a promise containing the requested data
     */
    get(key) {
        let entry = this.getEntry(key);
        let cached = entry.cached;
        return cached ? getAndSave(entry) : Promise.resolve();
    }
    
    /**
     * Gets the last loaded data without promises.
     * Does not attempt to reload data; does not check for invalidation, etc.
     * @param key
     * @returns {*}
     */
    getSaved(key) {
        return this.getEntry(key).data;
    }
    
    /**
     * Gets a promise containing the cached data. Creates the cache entry if none exists.
     * Data is loaded if not yet loaded or if invalidated.
     * @param key
     * @param loader
     * @param invalidators
     * @returns {Promise.<T>} - a promise containing the loaded data
     */
    getOrCreate(key, loader, invalidators, options) {
        options = options || {};
        options.overwrite = false;
        let entry = this.set(key, loader, invalidators, options);
        return getAndSave(entry);
    }
    
    getEntry(key) {
        return this[key] || (this[key] = {});
    }
    
    exists(key) {
        return this[key];
    }
    
    /**
     * Creates a cached-entry and saves it at the given key, passing loader and invalidators to
     * the created entry.
     * @param key
     * @param loader
     * @param invalidators
     * @param {Object} [options] - currently supported options: 'projections'
     * @param {Object} [options.projections] - adds projections to the cached entry. See 'addProjections'
     * documentation.
     * @returns {Cached} - the created Cached entry.
     */
    set(key, loader, invalidators, options) {
        options = options || {};
        let entry = this.getEntry(key);
    
        if (!entry.cached || options.overwrite !== false)
            entry.cached = new Cached(loader, invalidators, key);
        
        if (options.projections)
            this.addProjections(options.projections, entry.cached);
        
        return entry;
    }
    
    /**
     *
     * @param {Cached} cached - the cached instance whose data should be projected according to {projections},
     * and on whose invalidation the projected entries should also be invalidated.
     * @param {Object} projections - An array of projections to add to {cached}.
     *  Use: projects the data from {cached} into a new format to be stored with a specified key in this cache instance.
     *      Projected entries are invalidated when the {cached} parent entry is invalidated.
     *  Definition:
     *      "key": required field. The value is the key in which the projection will be stored in this cache instance.
     *      "project": required field. A function that receives that data retrieved from {cached} and
     *          returns the projected representation.
     *
     *  Example projections definition:
     *  cache.getOrCreate('main', () => val, invalidators.absoluteTime(1), {
                projections: [
                    { key: 'timesTwo', project: x => x * 2 },
                    { key: 'timesTen', project: x => x * 10 },
                ]
            })
     */
    addProjections(projections, cached){
        if (!projections.length)
            return;
    
        projections.forEach(projection => {
            this.set(
                projection.key,
                () => cached.getData().then(data => projection.project(data)),
                invalidators.chain(cached));
        })
    }
};

function getAndSave(entry) {
    return entry.cached.getData().then(data => entry.data = data);
}


