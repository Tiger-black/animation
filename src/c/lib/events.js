/*
 * author 德昭
 * 事件代理, 事件广播;
 * 例子:
 var Event = require('events');
 var obj = {};
 _.extend(obj, Events);

 this.trigger('channel:alert', {
 name: 'purple'
 });


 this.on('channel:alert', function (data) {
 console.log(data);
 });

 * */
'use strict';
var _ = require('underscore');
var eventSplitter = /\s+/;
var array = [];
var Events = {};
_.extend(Events, {
    on: function (name, callback, context) {
        if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
        this._events || (this._events = {});
        var events = this._events[name] || (this._events[name] = []);
        events.push({callback: callback, context: context, ctx: context || this});
        return this;
    },

    once: function (name, callback, context) {
        if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
        var self = this;
        var once = _.once(function () {
            self.off(name, once);
            callback.apply(this, arguments);
        });
        once._callback = callback;
        return this.on(name, once, context);
    },

    trigger: function (name) {
        if (!this._events) return this;
        var args = array.slice.call(arguments, 1);
        if (!eventsApi(this, 'trigger', name, args)) return this;
        var events = this._events[name];
        var allEvents = this._events.all;
        if (events) triggerEvents(events, args);
        if (allEvents) triggerEvents(allEvents, arguments);
        return this;
    },

    off: function (name, callback, context) {
        if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

        // Remove all callbacks for all events.
        if (!name && !callback && !context) {
            this._events = void 0;
            return this;
        }

        var names = name ? [name] : _.keys(this._events);
        for (var i = 0, length = names.length; i < length; i++) {
            name = names[i];

            // Bail out if there are no events stored.
            var events = this._events[name];
            if (!events) continue;

            // Remove all callbacks for this event.
            if (!callback && !context) {
                delete this._events[name];
                continue;
            }

            // Find any remaining events.
            var remaining = [];
            for (var j = 0, k = events.length; j < k; j++) {
                var event = events[j];
                if (
                    callback && callback !== event.callback &&
                    callback !== event.callback._callback ||
                    context && context !== event.context
                ) {
                    remaining.push(event);
                }
            }

            // Replace events if there are any remaining.  Otherwise, clean up.
            if (remaining.length) {
                this._events[name] = remaining;
            } else {
                delete this._events[name];
            }
        }

        return this;
    }
});

function eventsApi(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
        for (var key in name) {
            obj[action].apply(obj, [key, name[key]].concat(rest));
        }
        return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
        var names = name.split(eventSplitter);
        for (var i = 0, length = names.length; i < length; i++) {
            obj[action].apply(obj, [names[i]].concat(rest));
        }
        return false;
    }

    return true;
}

function triggerEvents(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
        case 0:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx);
            return;
        case 1:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1);
            return;
        case 2:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2);
            return;
        case 3:
            while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
            return;
        default:
            while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
            return;
    }
}

module.exports = Events;
