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

    function BaseClass() {}
    var baseProto = BaseClass.prototype;

    baseProto.isa = function (object) {
        return this instanceof object.constructor;
    };

    baseProto.instance = function () {
        var instance = new this.constructor(),
            init = instance.init;
        if (init !== undefined) {
            init.apply(instance, arguments);
        }
        return instance;
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
        var proto = Class.prototype = new superProto.constructor();
        proto.__super__ = superProto;
        proto.constructor = Class;

        if (init !== undefined) {
            proto.init = init;
        }

        return proto;
    };
}));
