var ReqCtx = require('./reqctx.js');
var moment = require('moment');

var SimpleFormat = require('../config/config').log_simpleformat;

function LogItem() {
    if (!(this instanceof LogItem))
        return new LogItem();

    this.pid = undefined;
    this.level = undefined;
    this.time = undefined;
    this.context_id  = undefined;
    this.context_name = undefined;
    this.action = undefined;
    this.msg = undefined;
    this.message = undefined;
    this.exception = undefined;
}

var Log = {

    level: {
        debug: 30000,
        info: 40000,
        warn: 60000,
        error: 70000,
        fatal: 110000
    },

    log_entry: function(req) {
        var log_item = new LogItem();
        log_item.pid = process.pid;
        log_item.level = 40000;
        log_item.time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        log_item.context_id = ReqCtx.get(req).id;
        log_item.context_name = ReqCtx.get(req).name;
        log_item.action = "1";
        log_item.msg = {
            url: req.url,
            http_header: req.headers,
            input: JSON.stringify(req.body),
            remote_address: req.remote_address
        }

        Log._log_item(log_item);
    },

    log_exist: function(req, body) {
        var spent = (new Date().getTime()) - ReqCtx.get(req).stime;

        var log_item = new LogItem();
        log_item.pid = process.pid;
        log_item.level = 40000;
        log_item.time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        log_item.context_id = ReqCtx.get(req).id;
        log_item.context_name = ReqCtx.get(req).name;
        log_item.action = "2";
        log_item.msg = {
            spent: spent
        };

        if (Buffer.isBuffer(body)) {
            log_item.msg.output = "#<base64>#";
            log_item.msg.status = 0;
        } else {
            if (body instanceof Error) {
                log_item.exception = body.stack;
                body = { ret: 500, msg: body.message };
            }

            log_item.msg.output = JSON.stringify(body);
            log_item.msg.status = body.ret || 1;

            if (ReqCtx.get(req).name.length == 0) {
                log_item.msg = undefined;
                log_item.action = undefined;
            }
        }
        
        Log._log_item(log_item);
    },

    create_item: function(level, msg, exception, req) {
        
        var log_item = new LogItem();
        log_item.pid = process.pid;
        log_item.level = level;
        log_item.time = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
        log_item.message = JSON.stringify(msg);
        if (exception && exception instanceof Error) {
            exception = exception.stack;
        }
        log_item.exception = exception;
        log_item.context_id = ReqCtx.get(req).id;
        log_item.context_name = ReqCtx.get(req).name;
        return log_item;
    },

    //d(req, msg)
    //d(req, err)
    //d(req, msg, err)
    //d(msg)
    //d(err)
    //d(msg, err)
    //d(item)
    d: function() {
        Log._log(Log.level.debug, arguments);
    },

    i: function() {
        Log._log(Log.level.info, arguments);
    },

    w: function() {
        Log._log(Log.level.warn, arguments);
    },

    e: function() {
        Log._log(Log.level.error, arguments);
    },

    f: function() {
        Log._log(Log.level.fatal, arguments);
    },

    _log: function(level, args) {

        var item = {
            log: undefined,
            req: undefined,
            msg: undefined,
            err: undefined
        }
        
        if (args.length === 1) {
            var arg1 = args[0];
            if (arg1 instanceof LogItem) {
                item.log = arg1;
            } else {
                if (arg1 && arg1.ctx) {
                    throw new Error("参数不正确");
                } else if (arg1 instanceof Error) {
                    item.err = arg1;
                } else {
                    item.msg = arg1;
                }
            }
        } else if (args.length === 2) {
            var arg1 = args[0];
            var arg2 = args[1];
            if (arg1 && arg1.ctx) {
                item.req = arg1;
                if (arg2 instanceof Error) {
                    item.err = arg2;
                } else {
                    item.msg = arg2;
                }
            } else {
                if (arg2 instanceof Error) {
                    item.msg = arg1;
                    item.err = arg2;
                } else {
                    throw new Error("参数不正确");
                }

            }
        } else if (args.length === 3) {
            var arg1 = args[0];
            var arg2 = args[1];
            var arg3 = args[2];
            if (arg1 && arg1.ctx && arg3 instanceof Error) {
                item.req = arg1;
                item.msg = arg2;
                item.err = arg3;
            } else {
                throw new Error("参数不正确");
            }
        } else {
            throw new Error("参数不正确");
        }

        if (item.log) {
            Log._log_item(item.log);
        } else {
            Log._log_item(Log.create_item(level, item.msg, item.err, item.req));
        }
    },
    
    _log_item : function(item) {
        if (!(item instanceof LogItem))
            return;

        var msg = null;
        
        if (SimpleFormat) {
            msg = item.msg ? JSON.stringify(item.msg) : item.message;
            if (item.exception) {
                msg = msg + item.exception;
            }
        } else {
            msg = JSON.stringify(item);
        }
        

        if (item.level === Log.level.debug) {
            console.info(msg);
        } else if (item.level === Log.level.info) {
            console.info(msg);
        } else if (item.level === Log.level.warn) {
            console.warn(msg);
        } else if (item.level === Log.level.error) {
            console.error(msg);
        } else if (item.level === Log.level.fatal) {
            console.error(msg);
        }

        delete item;
    }
}

module.exports = Log;