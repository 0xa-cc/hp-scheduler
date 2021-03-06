var Sequelize = require("sequelize");
var config = require('../config/config.js');
var Log = require('./log');

module.exports = {

    sequelize: function() {
        
        if (!this._sequelize) {

            this._sequelize = new Sequelize(config.db_connection_string, {
                pool: {
                    max: config.db_pool_max,
                    min: config.db_pool_min,
                    idle: config.db_pool_idle,
                },
                logging: config.log_sql
            });

            Log.i("create db instance sequelize !!!");
        }

        return this._sequelize;
    },

    sync: function(options) {
        return this.sequelize().sync(options);
    },

    select: function(sql, options) {
        options = options || {};
        options.type = Sequelize.QueryTypes.SELECT;
        return this.sequelize().query(sql, options);
    }
}
