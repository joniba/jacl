'use strict';
const _ = require('lodash');

module.exports = {
    absoluteTime: require('./absolute_time_expiration'),
    custom: require('./custom_invalidator'),
    chain: require('./chain_invalidator'),
    
    fromJson: function (config) {
        if (!config)
            return this.absoluteTime('5m');
        
        return _(config).map((value, name) => {
            if (_.isArray(value))
                return value.map(x => this[name](x));
            
            return this[name](value)
        }).flatten().value();
    },
    
    register(name, ctor){
        this[name] = ctor;
    }
};

