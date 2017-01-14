'use strict';

class CustomInvalidator {
    constructor(isInvalidated, onDataLoaded) {
        this.isInvalidated = isInvalidated;
        this.onDataLoaded = onDataLoaded;
    }
    
    dataLoaded(data) {
        if (this.onDataLoaded)
            this.onDataLoaded(data);
    }
    
    invalidated(data) {
        return this.isInvalidated(data);
    }
}

module.exports = (invalidate, onDataLoaded) => new CustomInvalidator(invalidate, onDataLoaded);