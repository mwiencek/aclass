describe("classes", function () {

    it("can be instantiated with a base class", function () {
        var A = aclass();
        var B = aclass(A);

        var a = new A();
        var b = new B();

        expect(a instanceof A).toBe(true);
        expect(a instanceof B).toBe(false);
        expect(b instanceof A).toBe(true);
        expect(b instanceof B).toBe(true);
    });

    it("can have properties added via extend()", function () {
        var A = aclass();

        A.extend({
            init: function (num) {
                this.number = num;
            },
            setNumber: function (num) {
                this.init(num);
            }
        });

        var a = new A(1337);
        expect(a.number).toBe(1337);

        a.setNumber(0);
        expect(a.number).toBe(0);

        a.extend({
            setNumber: function (num) {
                this.__super__.setNumber.call(this, num * 2);
            }
        });

        a.setNumber(668.5);
        expect(a.number).toBe(1337);
    });

    it("can inherit properties from a BaseClass", function () {
        var A = aclass({
            property: { value: 577 },
            method: function () {
                return true;
            }
        });

        var B = aclass(A);

        var a = new A();
        var b = new B();

        expect(a.property.value).toEqual(577);
        expect(a.property).toBe(b.property);

        expect(a.method()).toBe(true);
        expect(a.method).toBe(b.method);
    });

    it("can override inherited methods", function () {
        var A = aclass({
            method: function () {
                return true;
            }
        });

        var B = aclass(A, {
            method: function () {
                return false;
            }
        });

        var a = new A();
        var b = new B();

        expect(a.method()).toBe(true);
        expect(b.method()).toBe(false);
    });

    it("can set properties via the class prototype", function () {
        var A = aclass();

        A.prototype.method = function () {
            return true;
        };

        var a = new A();

        expect(a.method()).toBe(true);
    });

    it("can be instantiated with a single init function", function () {
        function init(prop) {
            this.property = prop;
        }

        var A = aclass(init);
        var a = new A(577);

        expect(a.init).toBe(init);
        expect(a.property).toBe(577);
    });

    it("do not have their init() called twice when \"new\" is omitted", function () {
        var count = 0;

        aclass(function () { count++ })();

        expect(count).toBe(1);
    });

    it("can use method chaining", function () {
        var A = aclass().extend({ foo: 111 }).extend({ bar: 222 });

        expect(A.prototype.foo).toBe(111);
        expect(A.prototype.bar).toBe(222);

        var a = new A();

        expect(a.foo).toBe(111);
        expect(a.bar).toBe(222);

        var b = a.extend({ baz: 333 }).around("noop").extend({ hi: 444 });

        expect(b).toBe(a);
        expect(a.baz).toBe(333);
        expect(a.noop).not.toBeUndefined();
        expect(a.hi).toBe(444);
    });

    it("can return a different object from their constructor", function () {
        var cache = {};

        var A = aclass(function (id) {
            return cache[id] || (cache[id] = this);
        });

        var a = new A(1);
        var b = new A(1);
        var c = new A(2);

        expect(a).toBe(b);
        expect(a).not.toBe(c);
    });
});

describe("method modifiers", function () {

    function setProp(prop) {
        this.property = prop;
        return prop;
    }

    it("can be called on a class", function () {
        var A = aclass(setProp);

        A.before("init", function () {
            this.inb4 = true;
        });

        A.after("init", function () {
            this.inafter = true;
        });

        A.around("init", function (orig, prop) {
            orig(prop * 10);
        });

        var a = new A(577);

        expect(a.inb4).toBe(true);
        expect(a.inafter).toBe(true);
        expect(a.property).toBe(5770);
    });

    it("can be called on an instance", function () {
        var A = aclass({ setProp: setProp });
        var a = new A();

        a.around("setProp", function (orig, prop) {
            return orig(prop * 10);
        });

        // make sure it only changed on the instance
        expect(A.prototype.setProp).toBe(setProp);

        var result = a.setProp(577);

        expect(a.property).toBe(5770);
        expect(result).toBe(5770);
    });

    it("can be used on an inherited method", function () {
        var A = aclass({ setProp: setProp });
        var B = aclass(A);

        B.around("setProp", function (orig, prop) {
            return orig(prop * 5);
        });

        expect(A.prototype.setProp).toBe(setProp);

        var b = new B();

        expect(b.setProp(5)).toBe(25);

        A.prototype.setProp = function (prop) {
            this.property = prop * 4;
            return this.property;
        };

        expect(b.setProp(5)).toBe(100);
    });

    it("can be used via $-syntax", function () {
        var A = aclass({
            init: setProp,
            methodA: function (a) {
                this.a = a;
            },
            methodB: function (b) {
                this.b = b;
            }
        });

        var B = aclass(A, {
            around$init: function (supr, prop) {
                supr(prop + 1);
            },
            before$methodA: function () {
                this.inb4 = true;
            },
            after$methodB: function () {
                this.inafter = true;
            }
        });

        var b = new B(100);

        expect(b.property).toBe(101);

        b.methodA(7);
        b.methodB(13);

        expect(b.inb4).toBe(true);
        expect(b.a).toBe(7);

        expect(b.inafter).toBe(true);
        expect(b.b).toBe(13);
    });

    it("can be defined via aclass.methodModifier", function () {
        aclass.methodModifier("countCalls", function (owner, name, callback) {
            var orig = owner[name];

            return function () {
                this.count += 1;
                callback.call(this, this.count);
                return orig.call(this);
            };
        });

        var A = aclass({
            count: 0,
            inc: function () {
                return this.count;
            }
        });

        A.countCalls("inc", function (count) {
            if (count === 3) {
                this.three = true;
            }
        });

        var a = new A();

        expect(a.inc()).toBe(1);
        expect(a.inc()).toBe(2);
        expect(a.inc()).toBe(3);
        expect(a.three).toBe(true);
    });

    it("can return values other than functions", function () {
        var fruits = { apple: 123, pear: 456, banana: 789 };

        aclass.methodModifier("fruit", function (owner, name, value) {
            return fruits[value];
        });

        var A = aclass({ fruit$favoriteFruitID: "apple" });

        expect(A.prototype.favoriteFruitID).toBe(123);
    });
});


describe("around$ modifiers", function () {

    it("can wrap around inherited methods", function () {
        var A = aclass({
            method: function (name) {
                return name + "D";
            }
        });

        var B = aclass(A, {
            around$method: function (supr, name) {
                expect(name).toBe("AB");

                name = supr(name + "C");

                expect(name).toBe("ABCD");

                return name + "E";
            }
        });

        var C = aclass(B, {
            around$method: function (supr, name) {
                expect(name).toBe("A");

                name = supr(name + "B");

                expect(name).toBe("ABCDE");

                return name + "F";
            }
        });

        var c = new C();

        expect(c.method("A")).toBe("ABCDEF");
    });

    it("have their supr() retain the correct context when calls are nested", function () {
        var called = false;

        var A = aclass({
            init: function (foo) {
                this.value = String(foo);
            }
        });

        var B = aclass(A, {
            around$init: function (supr, foo) {
                if (called) {
                    return null;
                }
                called = true;
                B(67890);
                supr(foo);
            }
        });

        var b = B(12345);

        expect(b.value).toBe("12345");
    });
});


describe("augment$ modifiers", function () {

    function augmentedA(inner, name) {
        expect(this.constructor.name).toBe("Class");
        expect(name).toBe("A");

        name = inner(name + "B");

        expect(name).toBe("ABCDEFG");

        return name + "H";
    }

    function augmentedB(inner, name) {
        expect(this.constructor.name).toBe("Class");
        expect(name).toBe("AB");

        name = inner(name + "C");

        expect(name).toBe("ABCDEF");

        return name + "G";
    }

    function augmentedC(inner, name) {
        expect(this.constructor.name).toBe("Class");
        expect(name).toBe("ABC");

        name = inner(name + "D");

        expect(name).toBe("ABCDE")

        return name + "F";
    }

    function augmentedD(name) {
        expect(this.constructor.name).toBe("Class");
        expect(name).toBe("ABCD");

        return name + "E";
    }

    it("can augment class methods", function () {
        var A = aclass({ method: augmentedA });

        var B = aclass(A, { augment$method: augmentedB });
        var C = aclass(B, { augment$method: augmentedC });
        var D = aclass(C, { augment$method: augmentedD });

        var d = new D();

        expect(d.method("A")).toBe("ABCDEFGH");
    });

    it("can augment instance methods", function () {
        var A = aclass({ method: augmentedA });

        var a = A();

        a.augment("method", augmentedB);
        a.augment("method", augmentedC);
        a.augment("method", augmentedD);

        expect(a.method("A")).toBe("ABCDEFGH");
    });

    function wrapOuter(inner, wrap) {
        return inner(wrap);
    }

    it("can augment the same parent method from two different children", function () {
        var A = aclass({ wrap: wrapOuter });

        var B = aclass(A);
        var C = aclass(A);

        B.augment("wrap", function (wrap) {
            return wrap + "HAH" + wrap;
        });

        C.augment("wrap", function (wrap) {
            return wrap + "HUH" + wrap;
        });

        var b = B();
        var c = C();

        expect(b.wrap("~")).toBe("~HAH~");
        expect(c.wrap("!")).toBe("!HUH!");
    });

    it("can be arbitrarily nested", function () {
        var A = aclass({ wrap: wrapOuter });

        var B = aclass(A, { value: "B" });
        var C = aclass(A, { value: "C" });
        var b = B();
        var c = C();

        B.augment("wrap", function (wrap) {
            return c.wrap(wrap + this.value + wrap);
        });

        C.augment("wrap", function (wrap) {
            return wrap + this.value + wrap;
        });

        C.around("wrap", function (supr, wrap) {
            return "[" + supr(wrap) + "]";
        });

        expect(b.wrap("/")).toBe("[/B/C/B/]");

        A.augment("wrap", function (inner, wrap) {
            return "<" + inner(wrap) + ">";
        });

        c.around("wrap", function (supr, wrap) {
            return "~" + supr(wrap) + "~";
        });

        expect(b.wrap("/")).toBe("<~[</B/C/B/>]~>");
    });

    it("can be called via around", function () {
        var A = aclass({
            magic: function (inner, foo) {
                var bar = inner(foo);

                if (bar > 0) {
                    return B().magic(bar);
                } else {
                    return bar;
                }
            }
        });

        var B = aclass(A, {
            augment$magic: function (foo) {
                return foo - 1;
            }
        });

        B.around("magic", function (supr, foo) {
            return supr(foo);
        });

        var b = B();

        expect(b.magic(10)).toBe(0);
    });

    it("can be called with the first argument as themselves", function () {
        var A = aclass({
            magic: function (inner1, inner2, foo) {
                expect(inner2).toBe(innerMagic);

                expect(foo).toBe("ABC");

                return inner1(inner2, foo).length;
            }
        });

        function innerMagic(inner, foo) {
            expect(inner).toBe(innerMagic);

            return String(foo);
        }

        var B = aclass(A, {
            augment$magic: innerMagic
        });

        var b = B();

        expect(b.magic(innerMagic, "ABC")).toBe(3);
    });

    it("can be passed as the first argument to another augmented method", function () {
        var A = aclass({
            magic: function (inner, foo) {
                return inner(foo);
            }
        });

        var B = aclass(A, {
            augment$magic: function (foo) {
                return foo;
            }
        });

        var C = aclass({
            magic: function (inner, foo) {
                expect(B().magic(inner)).toBe(inner);

                return inner(foo);
            }
        });

        var D = aclass(C, {
            augment$magic: function (foo) {
                return foo;
            }
        });

        D().magic(1);
    });

    it("can share a method from another class's prototype", function () {
        var called = false;

        var A = aclass({
            magic: function (inner, foo) {
                if (called) {
                    return foo;
                }
                called = true;
                return inner(foo).length;
            }
        });

        var B = aclass(A, {
            around$magic: function (supr, foo) {
                return String(supr(B.prototype.magic, foo));
            }
        });

        var C = aclass(A, {
            augment$magic: B.prototype.magic
        });

        var c = C();

        expect(c.magic(12345)).toBe(5);
    });

    it("retain the correct context when called again from within their outer method", function () {
        var called = false;

        var A = aclass({
            init: function (inner, foo) {
                if (called) {
                    return null;
                }
                called = true;
                B(67890);
                inner(foo);
            }
        });

        var B = aclass(A, {
            augment$init: function (foo) {
                this.value = String(foo);
            }
        });

        var b = B(12345);

        expect(b.value).toBe("12345");
    });

    it("do not have their internal stack conflict with other instances", function () {
        var called = false;

        var A = aclass({
            init: function (inner, foo) {
                if (called) {
                    inner(foo);
                } else {
                    called = true;
                    C(67890);
                    inner(foo);
                }
            }
        });

        var B = aclass(A, {
            augment$init: function (inner, foo) {
                inner(foo);
            }
        });

        var C = aclass(B, {
            augment$init: function (foo) {
                this.value = String(foo);
            }
        });

        var c = C(12345);

        expect(c.value).toBe("12345");
    });

    it("do not have their internal stack conflict with other methods of the same instance", function () {
        // Spys don't work, unfortunately.
        var bMethod2Called = false,
            cMethod2Called = false;

        var A = aclass({
            method1: function (inner, foo) {
                return inner(this.method2(foo));
            },

            method2: function (inner, foo) {
                return foo * 2;
            }
        });

        var B = aclass(A, {
            augment$method1: function (inner, foo) {
                return inner(foo);
            },

            augment$method2: function (inner, foo) {
                // This should never be called.
                bMethod2Called = true;

                return inner(foo);
            }
        });

        var C = aclass(B, {
            augment$method1: function (foo) {
                return String(foo);
            },

            augment$method2: function (foo) {
                // This should never be called.
                cMethod2Called = true;

                return String(foo);
            }
        });

        var c = C();

        expect(c.method1(12345)).toBe("24690");
        expect(bMethod2Called).toBe(false);
        expect(cMethod2Called).toBe(false);

        expect(c.__stack__.length).toBe(0);
    });

    it("still behave if an instance calls inner() multiple times", function () {
        var A = aclass({
            init: function (inner, foo) {
                inner(foo);
                inner(foo);
                inner(foo);
            }
        });

        var B = aclass(A, {
            augment$init: function (inner, foo) {
                inner(foo);
                inner(foo);
                inner(foo);
            }
        });

        var C = aclass(B, {
            augment$init: function (foo) {
                this.value = String(foo);
            }
        });

        var c = C(12345);
        expect(c.value).toBe("12345");
    });
});
