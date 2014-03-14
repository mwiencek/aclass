/* aclass 0.5.0
 * https://github.com/mwiencek/aclass
 *
 * Copyright (C) 2014 Michael Wiencek <mwtuea@gmail.com>
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

    var push = Array.prototype.push,
        protoProp = "prototype",
        constProp = "constructor",
        superProp = "__super__",
        innerProp = "__inner__",
        stackProp = "__stack__",
        methodModifier = /^(\w+)\$(\w+)$/,
        // init() can run twice if Class is called without new.
        // Guard against that with a skipInit sentinel.
        skipInit = [];

    function classDelegate(supr, name, object) {
        return function () {
            supr[name].apply(object, arguments);
            return this;
        };
    }

    function aFunction(object) {
        return typeof object === "function";
    }

    function sequence(before, after) {
        return function () {
            before.apply(this, arguments);
            after.apply(this, arguments);
        };
    }

    function methodOrDelegate(owner, name) {
        if (owner.hasOwnProperty(name)) {
            return owner[name];
        }
        var proto = owner[superProp];

        return function () {
            return proto[name].apply(this, arguments);
        };
    }

    var methodModifiers = {
        before: function (owner, name, func) {
            return sequence(func, methodOrDelegate(owner, name));
        },

        after: function (owner, name, func) {
            return sequence(methodOrDelegate(owner, name), func);
        },

        around: function (owner, name, func) {
            var orig = methodOrDelegate(owner, name);

            return function () {
                var self = this,
                    args = [supr];

                function supr() {
                    return orig.apply(self, arguments);
                }

                push.apply(args, arguments);
                return func.apply(this, args);
            };
        },

        // augment$ is the inverse of around$, with the methods being called in
        // reverse: the next (inner) method in the chain is always passed to
        // the previous (outer) method in the chain, which can decide to call
        // it or not. Unlike around$, we cannot simply unshift the inner method
        // onto the arguments array for the outer method: if the outer method
        // is itself the inner method for something higher in the chain, then
        // doing so would cause the outermost method to receive every single
        // inner method in the chain in its arguments array.

        augment: function (owner, name, func) {
            var orig = owner.hasOwnProperty(name) ? owner[name] : null;

            function augmented() {
                var self = this,
                    outer = orig || owner[superProp][name],
                    augmentStack = this[stackProp],
                    next;

                if (augmentStack === undefined) {
                    augmentStack = this[stackProp] = [];
                }

                function inner() {
                    var args = arguments;

                    // Don't pop multiple functions off the stack if the outer
                    // method calls inner() multiple times.
                    next = next || augmentStack.pop();

                    // The innermost method does not have a next-most-inner
                    // method; it is called directly with the original args.
                    if (next) {
                        args = [next];
                        push.apply(args, arguments);
                    }

                    return func.apply(self, args);
                }

                // If the outer method is also an inner method (i.e., defined
                // by augmented()), delay passing the current inner method.
                if (outer[innerProp]) {
                    augmentStack.push(inner);

                    try {
                        return outer.apply(this, arguments);
                    } finally {
                        // The outer method did not call its inner method;
                        // remove it from the stack.
                        if (augmentStack[augmentStack.length - 1] === inner) {
                            augmentStack.pop();
                        }
                    }
                }

                var args = [inner];
                push.apply(args, arguments);
                return outer.apply(this, args);
            }

            augmented[innerProp] = true;
            return augmented;
        }
    };

    var baseProto = {
        extend: function (properties) {
            var key, value, match, modifier, orig;

            for (key in properties) {
                if (this.hasOwnProperty(key)) {
                    continue;
                }

                value = properties[key];
                match = key.match(methodModifier);

                if (match) {
                    modifier = methodModifiers[match[1]];
                    key = match[2];
                    orig = properties[key];

                    if (orig !== undefined && !this.hasOwnProperty(key)) {
                        this[key] = orig;
                    }

                    value = modifier(this, key, value);
                }
                this[key] = value;
            }
            return this;
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

        function Class(skip) {
            var self = this;

            if (self instanceof Class === false) {
                self = new Class(skipInit);
            }

            if (skip !== skipInit) {
                self[superProp] = proto;

                if (aFunction(self.init)) {
                    var result = self.init.apply(self, arguments);

                    if (result !== undefined) {
                        return result;
                    }
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
            Class[key] = classDelegate(baseProto, key, proto);
        }

        return Class;
    }

    aclass.methodOrDelegate = methodOrDelegate;

    aclass.methodModifier = function (modifierName, modifier) {
        methodModifiers[modifierName] = modifier;

        baseProto[modifierName] = function (name, func) {
            var result = modifier(this, name, func);

            if (aFunction(result)) {
                this[name] = result;
            }
            return this;
        };
    };

    for (var key in methodModifiers) {
        aclass.methodModifier(key, methodModifiers[key]);
    }

    return aclass;
}));
