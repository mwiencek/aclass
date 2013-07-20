/* aclass 0.3.4
 * https://github.com/mwiencek/aclass
 *
 * Copyright (C) 2013 Michael Wiencek
 *
 * Released under the MIT license:
 * http://opensource.org/licenses/MIT
 */
(function (root, factory) {
    "use strict";

    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof exports === "object") {
        module.exports = factory();
    } else {
        root.aclass = factory();
    }
}(this, function () {
    "use strict";

    var protoProp = "prototype",
        constProp = "constructor",
        superProp = "__super__",
        boundProp = "__bound__",
        methodModifier = /^(\w+)\$(\w+)$/;

    function bound(func, object) {
        function boundFunc() {
            return func.apply(boundFunc[boundProp] || this, arguments);
        }
        boundFunc[boundProp] = object;
        return boundFunc;
    }

    function delegate(proto, name, object) {
        function boundFunc() {
            return proto[name].apply(boundFunc[boundProp] || this, arguments);
        }
        boundFunc[boundProp] = object;
        return boundFunc;
    }

    function aFunction(object) {
        return typeof object === "function";
    }

    var methodModifiers = {
        before: function (orig, func) {
            return function () {
                func.apply(this, arguments);
                orig.apply(this, arguments);
            };
        },

        after: function (orig, func) {
            return methodModifiers.before(func, orig);
        },

        around: function (orig, func) {
            if (orig[boundProp] === undefined) {
                orig = bound(orig, null);
            }
            return function () {
                orig[boundProp] = this;
                var args = [orig];
                args.push.apply(args, arguments);
                return func.apply(this, args);
            };
        },

        augment: function (orig, func) {
            return methodModifiers.around(func, orig);
        },

        static: function (orig, func, name) {
            var proto = this;

            this[constProp][name] = function () {
                return func.apply(proto, arguments);
            };
        }
    };

    var baseProto = {
        extend: function (properties) {
            for (var key in properties) {
                if (this.hasOwnProperty(key)) {
                    continue;
                }
                var value = properties[key];

                if (aFunction(value) && methodModifier.test(key)) {
                    var match = key.match(methodModifier),
                        modifier = methodModifiers[match[1]];

                    key = match[2];
                    var orig = properties[key];

                    if (orig !== undefined && !this.hasOwnProperty(key)) {
                        this[key] = orig;
                    }
                    value = modifyMethod(this, key, value, modifier);
                }
                this[key] = value;
            }
        }
    };

    function Prototype() {}

    function aclass(arg0, arg1) {
        var supr, proto;

        if (aFunction(arg0) && baseProto.isPrototypeOf(arg0[protoProp])) {
            supr = arg0[protoProp];
        } else {
            supr = baseProto;
            arg1 = arg0;
        }

        Prototype[protoProp] = supr;
        proto = new Prototype();
        proto[superProp] = supr;

        // init() can run twice if Class is called without new.
        // Guard against that with an "initiate" flag.
        var initiate = true;

        function Class() {
            var self = this;

            if (self instanceof Class === false) {
                initiate = false;
                self = new Class();
                initiate = true;
            }

            if (initiate === true) {
                self[superProp] = proto;

                if (aFunction(self.init)) {
                    self.init.apply(self, arguments);
                }
            }
            return self;
        }

        proto[constProp] = Class;
        Class[protoProp] = proto;

        if (arg1 !== undefined) {
            proto.extend(aFunction(arg1) ? { init: arg1 } : arg1);
        }

        for (key in baseProto) {
            Class[key] = delegate(baseProto, key, proto);
        }

        return Class;
    }

    function modifyMethod(object, name, value, modifier) {
        var orig;
        if (object.hasOwnProperty(name)) {
            orig = object[name];
        } else {
            orig = delegate(object[superProp], name, null);
        }
        return modifier.call(object, orig, value, name);
    }

    aclass.methodModifier = function (modifierName, modifier) {
        methodModifiers[modifierName] = modifier;

        baseProto[modifierName] = function (name, func) {
            var result = modifyMethod(this, name, func, modifier);

            if (aFunction(result)) {
                this[name] = result;
            }
        };
    };

    for (var key in methodModifiers) {
        aclass.methodModifier(key, methodModifiers[key]);
    }

    return aclass;
}));
