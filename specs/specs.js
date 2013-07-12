describe("classes", function () {

    it("can pass a BaseClass as the first argument to aclass()", function () {
        var A = aclass();
        var B = aclass(A);

        var a = new A();
        var b = new B();

        expect(a instanceof A).toBe(true);
        expect(a instanceof B).toBe(false);
        expect(b instanceof A).toBe(true);
        expect(b instanceof B).toBe(true);
    });

    it("can call extend() on an existing class or instance", function () {
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

    it("can override methods", function () {
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

    it("can provide an init() method for the constructor", function () {
        function init(prop) {
            this.property = prop;
        }

        var A = aclass(init);
        var a = new A(577);

        expect(a.init).toBe(init);
        expect(a.property).toBe(577);
    });
});

describe("method modifiers", function () {

    function setProp(prop) {
        this.property = prop;
        return prop;
    }

    it("can use method modifiers on a class", function () {
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

    it("can use method modifiers on an instance", function () {
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

    it("can use method modifiers with an inherited method", function () {
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

    it("can use the dollar-sign syntax", function () {
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

    it("can create custom method modifiers", function () {
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
});
