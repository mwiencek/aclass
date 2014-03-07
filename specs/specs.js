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

        var b = a.static("baz").around("noop").extend({ hi: 333 });

        expect(b).toBe(a);
        expect(A.baz).not.toBeUndefined();
        expect(a.noop).not.toBeUndefined();
        expect(a.hi).toBe(333);
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
        aclass.methodModifier("countCalls", function (orig, callback) {
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

    it("can define static methods", function () {
        var A = aclass({
            count: 0,

            static$inc: function () {
                this.count++;
            }
        });

        A.inc();

        expect(A.prototype.count).toBe(1);
    });

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

    it("can allow augmented method calls to be arbitrarily nested", function () {
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

    it("can wrap around methods", function () {
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
});
