aclass
======

A (very) small wrapper over JavaScript's prototype system.

```JavaScript
var FourLeggedThing = aclass(function (noise) {
    this.noise = noise;
});

FourLeggedThing.makeNoise = function () {
    alert(this.noise);
};

FourLeggedThing.run = function () {
    // have fun implementing this
};

var Cat = aclass(FourLeggedThing, function () {
    // these are all equivalent
    FourLeggedThing.init.call(this, "meow");
    Cat.__super__.init.call(this, "meow");
    this.__super__.init.call(this, "meow");
});

Cat.flee = function () {
    this.makeNoise();
    this.run();
};

var precious = Cat.instance();
precious.flee();

precious.isa(Cat) === true;
precious.isa(FourLeggedThing) === true;
Cat.isa(FourLeggedThing) === true;
```

I had three motivations for writing this:
 1. To not have to type ```.prototype``` everywhere.
 2. To not have to manually set a prototype's ```constructor```.
 3. To avoid special code that runs a class's ```init()``` method.

The ```__super__``` attribute isn't something I'd use, personally. I added it because it was a single line of code.

```aclass()``` can accept the following as arguments: a super class, an ```init()``` function, or both in that order. It can be called without any arguments if the class has no parent or ```init()```.

The ```init()``` function doesn't have to be passed to ```aclass()```. It can also be assigned afterwards:

```JavaScript
var Cat = aclass(FourLeggedThing);

Cat.init = function () { ... };
```

Instances are created using ```Class.instance()```. Arguments to ```instance()``` are passed to the ```init()``` method, if one exists.

If I could get away with it, I'd rename ```instance()``` to ```new()```. It would work in most cases, but would break inside a ```with``` statement.
