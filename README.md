# aclass

A small wrapper over JavaScript's prototype system that eases the creation of classes. AMD support is included.

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
    // these are equivalent
    FourLeggedThing.init.call(this, "meow");
    Cat.__super__.init.call(this, "meow");
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

## basic usage

#### aclass([superClass][, init])

Returns a new "class."

```superClass``` must have been previously created with ```aclass()```.

The ```init()``` function is run whenever you create a new instance.

You can supply either of these arguments on their own, or you can supply no arguments.

The ```init()``` function doesn't have to be passed to ```aclass()```. It can also be assigned afterwards:

```JavaScript
var Cat = aclass(FourLeggedThing);

Cat.init = function () { ... };
```

#### Class.instance([arg0][, arg1][, arg2][, ...])

Creates a new instance of ```Class```. Arguments to ```instance()``` are passed to the ```init()``` method, if one exists.

#### classOrInstance1.isa(classOrInstance2)

Convenience function equivalent to:

```JavaScript
classOrInstance1 instanceof classOrInstance2.constructor;
```

## method modifiers

An alternate API is available for augmenting methods, inspired by Moose's [method modifiers](http://search.cpan.org/dist/Moose/lib/Moose/Manual/MethodModifiers.pod).

#### classOrInstance.before(methodName, func)
#### classOrInstance.after(methodName, func)

Replaces ```classOrInstance[methodName]``` with a function than runs the original method, as well as ```func```. With ```.before()```, ```func``` runs first. With ```.after()```, it runs second.

Return values from the original method and ```func``` are ignored.

If ```methodName``` is a direct property of ```classOrInstance```, this overwrites the original method on that object. If ```methodName``` is somewhere in the prototype chain of classOrInstance, the new method delegates calls to the parent method, as expected.

#### classOrInstance.around(methodName, func)

Replaces ```classOrInstance[methodName]``` with function ```func```, which recieves the original method as its first argument. This is useful if:

 * You care about the return values of any of the methods.
 * You have complex code that you want to run before *and* after the original method.
 * You may not want to run the original method at all.

Example:

```JavaScript
var A = aclass(function (prop) {
    this.prop = prop;
});

var B = aclass(A);

B.around("init", function (orig, prop) {
    orig(prop * 10);
});

var b = B.instance(10);

b.prop === 100;
```

## thoughts

I had three main motivations for writing this:

 1. To not have to type ```.prototype``` everywhere.
 2. To not have to manually set a prototype's ```constructor```.
 3. To avoid special code that runs a class's ```init()``` method.

I also dislike the syntax that other class systems use. Passing a dictionary of methods requires too much indentation.

The object returned from ```aclass()``` isn't a constructor, and can't be called with ```new```. In fact, it's actually the prototype of the constructor. The examples above conflict with certain guidelines suggesting to only capitalize constructor functions. This is a minor point to be aware of, but doesn't have any effect if you know what you're doing.

I recommend only accessing ```__super__``` using ```Class.__super__``` and not ```this.__super__```. The latter can lead to unexpected results when you have a class heirarchy of more than two levels, because the value is only ever dependent on ```this```, not the method you happen to be in.

If I could get away with it, I'd rename ```instance()``` to ```new()```. It would work in most cases, but would break inside a ```with``` statement.

## license

http://opensource.org/licenses/MIT
