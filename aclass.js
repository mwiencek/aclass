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

    var baseProto = {},
        protoProp = "prototype",
        constProp = "constructor",
        superProp = "__proto__",
        methodModifier = /^(\w+)\$(\w+)$/;

    function bound(func, object) {
        return function () {
            return func.apply(object, arguments);
        };
    }

    function setSuper(object, proto) {
        if (object[superProp] === undefined) {
            object[superProp] = proto;
        }
    }

    function sequence(before, after) {
        return function () {
            before.apply(this, arguments);
            after.apply(this, arguments);
        };
    }

    function aFunction(object) {
        return typeof object === "function";
    }

    var methodModifiers = {
        before: function (orig, func) {
            return sequence(func, orig);
        },

        after: function (orig, func) {
            return sequence(orig, func);
        },

        around: function (orig, func) {
            return function () {
                var args = [bound(orig, this)];
                args.push.apply(args, arguments);
                return func.apply(this, args);
            };
        }
    };

    function aclass(arg0, arg1) {
        var supr, proto, properties;

        if (aFunction(arg0) && baseProto.isPrototypeOf(arg0[protoProp])) {
            supr = arg0[protoProp];
        } else {
            supr = baseProto;
            arg1 = arg0;
        }
        properties = aFunction(arg1) ? { init: arg1 } : arg1;

        function Prototype() {}
        Prototype[protoProp] = supr;
        proto = new Prototype();
        setSuper(proto, supr);

        function Class() {
            var self = this;

            if (self instanceof Class === false) {
                self = new Class();
            }
            setSuper(self, proto);

            if (aFunction(self.init)) {
                self.init.apply(self, arguments);
            }
            return self;
        }

        proto[constProp] = Class;
        Class[protoProp] = proto;

        for (key in properties) {
            if (proto.hasOwnProperty(key)) {
                continue;
            }
            var value = properties[key];

            if (aFunction(value) && methodModifier.test(key)) {
                var match = key.match(methodModifier),
                    modifier = methodModifiers[match[1]];

                key = match[2];
                value = modifyMethod(properties, proto, key, value, modifier);
            }
            proto[key] = value;
        }

        for (key in baseProto) {
            Class[key] = bound(baseProto[key], proto);
        }

        Class.extend = function (properties) {
            return aclass(Class, properties);
        };

        return Class;
    }

    function modifyMethod(source, target, name, value, modifier) {
        var orig;
        if (source.hasOwnProperty(name)) {
            orig = source[name];
        } else {
            var supr = target[superProp];

            orig = function () {
                return supr[name].apply(this, arguments);
            };
        }
        return modifier.call(target, orig, value);
    }

    aclass.methodModifier = function (modifierName, modifier) {
        methodModifiers[modifierName] = modifier;

        baseProto[modifierName] = function (name, func) {
            this[name] = modifyMethod(this, this, name, func, modifier);
        };
    };

    for (var key in methodModifiers) {
        aclass.methodModifier(key, methodModifiers[key]);
    }

    return aclass;
}));
