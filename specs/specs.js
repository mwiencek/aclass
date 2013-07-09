describe("aclass test suite", function () {

    it("supports subclassing", function () {
        var A = aclass(function (prop) {
            this.prop = prop;
        });

        A.sharedMethod = function () {
            return this.prop;
        };

        A.squared = function () {
            return this.prop * this.prop;
        };

        var B = aclass(A);

        B.doubleit = function () {
            return A.squared.call(this) * 2;
        };

        var a = A.instance(1),
            b = B.instance(2);

        expect(a.prop).toBe(1);
        expect(b.prop).toBe(2);
        expect(a.sharedMethod).toBe(b.sharedMethod);
        expect(b.doubleit()).toBe(8);
        expect(b.isa(A)).toBe(true);
        expect(b.isa(B)).toBe(true);
        expect(a.isa(A)).toBe(true);
        expect(a.isa(B)).toBe(false);
        expect(A.isa(B)).toBe(false);
        expect(B.isa(A)).toBe(true);
    });

    it("supports method modifiers", function () {
        var A = aclass(function (prop) {
            this.prop = prop * 2;
        });

        A.after("init", function (prop) {
            this.prop *= (prop + 1);
        });

        var a = A.instance(3);

        expect(a.prop).toBe(24);

        A.before("init", function (prop) {
            this.eleven = (prop === 11);
        });

        a = A.instance(11);

        expect(a.eleven).toBe(true);
        expect(a.prop).toBe(264);

        var B = aclass(A);

        B.around("init", function (orig, prop) {
            orig(prop * 5);
        });

        var b = B.instance(13);

        expect(b.prop).toBe(8580);
        expect(b.eleven).toBe(false);

        A.init = function (prop) {
            this.prop = prop;
        };

        b = B.instance(11);

        expect(b.prop).toBe(55);
        expect(b.eleven).toBeUndefined();

        // Also test modifiers on instances
        b.before("init", function () {
            this.inb4 = true;
        });

        b.after("init", function () {
            this.inafter = true;
        });

        b.around("init", function (orig, prop) {
            return orig(prop * 10);
        });

        b.init(11);

        expect(b.prop).toBe(550);
        expect(b.inb4).toBe(true);
        expect(b.inafter).toBe(true);
    });
});
