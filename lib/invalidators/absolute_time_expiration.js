'use strict';
const ms = require('ms');

class AbsoluteTimeExpiration {
    constructor(expiresIn) {
        expiresIn = expiresIn || 0;
        this.expiresIn = (typeof expiresIn == 'number') ? expiresIn : ms(expiresIn);
    }
    
    dataLoaded(data) {
        this.expired = false;
        setTimeout(() => this.expired = true, this.expiresIn);
    }
    
    invalidated(data) {
        return this.expired;
    }
}

module.exports = expiresIn => new AbsoluteTimeExpiration(expiresIn);