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
        superProp = "__super__";

    function BaseClass() {}
    var baseProto = BaseClass[protoProp];

    baseProto.isa = function (object) {
        return this instanceof object[constProp];
    };

    baseProto.instance = function () {
        var instance = new this[constProp](),
            init = instance.init;
        if (init !== undefined) {
            init.apply(instance, arguments);
        }
        return instance;
    };

    function bind(func, object) {
        return function () {
            return func.apply(object, arguments);
        };
    }

    function sequence(before, after) {
        return function () {
            before.apply(this, arguments);
            after.apply(this, arguments);
        };
    }

    function getFunctionOrDelegate(object, name) {
        if (object.hasOwnProperty(name)) {
            return object[name];

        } else {
            // Delegate calls to the parent prototype.
            object = object.hasOwnProperty(superProp) ?
                     object[superProp] : object[constProp][protoProp];

            return function () {
                return object[name].apply(this, arguments);
            };
        }
    }

    baseProto.before = function (name, before) {
        this[name] = sequence(before, getFunctionOrDelegate(this, name));
    };

    baseProto.after = function (name, after) {
        this[name] = sequence(getFunctionOrDelegate(this, name), after);
    };

    baseProto.around = function (name, func) {
        var orig = getFunctionOrDelegate(this, name);

        this[name] = function () {
            var args = [bind(orig, this)];
            args.push.apply(args, arguments);

            return func.apply(this, args);
        };
    };

    return function (arg0, arg1) {
        var superProto = baseProto, init;

        if (typeof arg0 === "function") {
            init = arg0;

        } else if (arg0 !== undefined) {
            superProto = arg0;

            if (arg1 !== undefined) {
                init = arg1;
            }
        }

        function Class() {}
        var proto = Class[protoProp] = new superProto[constProp]();
        proto[superProp] = superProto;
        proto[constProp] = Class;

        if (init !== undefined) {
            proto.init = init;
        }

        return proto;
    };
}));
