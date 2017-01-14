'use strict';

class ChainInvalidator {
    constructor(cached) {
        this.dependency = cached;
        this.dependency.on('invalidated', () => this.expired = true);
    }
    
    dataLoaded(data) {
        this.expired = false;
    }
    
    invalidated(data) {
        return this.expired || this.dependency.invalidated();
    }
}

module.exports = cached => new ChainInvalidator(cached);