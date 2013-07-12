# aclass

A small but powerful wrapper over JavaScript's prototype system that eases the creation of classes. AMD support is included.

```JavaScript
var FourLeggedThing = aclass({

    init: function (noise) {
        this.noise = noise;
    },

    makeNoise: function () {
        alert(this.noise);
    },

    run: function () {
        // have fun implementing this
    }
});

var Cat = aclass(FourLeggedThing, {

    around$init: function (supr) {
        supr("meow");
    },

    flee: function () {
        this.makeNoise();
        this.run();
    }
});

var precious = new Cat();
precious.flee();

precious instanceof Cat === true;
precious instanceof FourLeggedThing === true;
```

## basic usage

#### aclass([BaseClass][, init])
#### aclass([BaseClass][, properties])

Returns a new class.

```BaseClass``` is optional. If supplied, it must have been previously created with ```aclass()```.

The second argument (or first, if ```BaseClass``` is not supplied), is either an ```init()``` function, or an object whose properties will be copied to the new class's prototype. The ```init``` function is automatically run whenever you create a new instance. You can supply an ```init``` in ```properties```, too; the former syntax is simply a convenience for when the class has no other methods.

#### classOrInstance.extend(properties)

Extends the existing ```classOrInstance``` with values from ```properties```.

```JavaScript
var Cat = aclass();

Cat.extend({
    meow: function () {
        alert("meow");
    }
});

var angryCat = new Cat();

angryCat.extend({
    // see "method modifiers" below to understand the $-syntax

    after$meow: function () {
        this.attack();
    }
});
```

## method modifiers

An API is available for augmenting methods, inspired by Moose's [method modifiers](http://search.cpan.org/dist/Moose/lib/Moose/Manual/MethodModifiers.pod).

#### classOrInstance.before(methodName, func)
#### classOrInstance.after(methodName, func)

Replaces ```classOrInstance[methodName]``` with a function than runs the original method, as well as ```func```. With ```.before()```, ```func``` runs first. With ```.after()```, it runs second.

Return values from the original method and ```func``` are ignored.

If ```methodName``` is somewhere in the prototype chain of classOrInstance, the new method delegates calls to the parent prototype, as expected.

#### classOrInstance.around(methodName, func)

Replaces ```classOrInstance[methodName]``` with function ```func```, which recieves the original method as its first argument. This is useful if:

 * You care about the return values of any of the methods.
 * You have complex code that you want to run before *and* after the original method.
 * You may not want to run the original method at all.

```around()``` is the suggested way to call ```methodName``` in the parent class:

```JavaScript
var A = aclass({

    setProp: function (prop) {
        this.prop = prop;
        return prop;
    }
});

var B = aclass(A);

B.around("setProp", function (supr, prop) {
    return supr(prop * 10);
});

var b = new B();

b.setProp(10) === 100;
```

### $-syntax

Method modifiers can be called during class creation:

```JavaScript
var Cat = aclass(FourLeggedThing, {

    // delegates to FourLeggedThing.prototype.init
    around$init: function (supr) {
        supr("meow");
    }
});
```

The syntax is:

```JavaScript
...
modifier$method: function () {
    // this function is passed as the second argument to modifier
},
...
```

### create your own™

Custom method modifiers can be created, as described below.

#### aclass.methodModifier(name, func)

```name``` is the name of the modifier.

```func``` is a function that accepts two parameters: the original function being replaced*, and an additional callback (if any). ```func``` must return a new function that does something with either of these.

If you're using the $-syntax, the callback is the function you assign to the ```modifier$method``` property. For example:

```JavaScript
aclass.methodModifier("throttle", function (orig, func) {
    // underscore's throttle() function:
    // http://underscorejs.org/#throttle
    return _.throttle(func, 100);
});

var A = aclass({
    // There is no original updateSomething() function here, which is okay.
    // We can ignore the orig argument above.

    throttle$updateSomething: function () {
        this.update();
    }
});
```

Alternatively, you could implement it like this:

```JavaScript
aclass.methodModifier("throttle", function (orig) {
    return _.throttle(orig, 100);
});

var A = aclass({
    updateSomething: function () {
        this.update();
    }
});

A.throttle("updateSomething");
```

\* If no function with the specified name exists directly on the target class or instance (e.g. "updateSomething"), then ```orig``` is a function that delegates the name lookup onto the parent prototype.

## license

http://opensource.org/licenses/MIT
