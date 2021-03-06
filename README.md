# aclass

Note: This works great for what it does, but there's not much of a reason to use it in modern-day projects anymore. Better tools exist now, e.g. [Babel](https://babeljs.io/).

A small but powerful wrapper over JavaScript's prototype system that eases the creation of classes.

Supports IE6+, modern browsers, and AMD.

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

There are two ways to use these. The most convenient way is the ```modifier$method``` syntax, only usable within the ```properties``` of a class definition:

```JavaScript
var Cat = aclass(FourLeggedThing, {

    // delegates to FourLeggedThing.prototype.init
    around$init: function (supr) {
        supr("meow");
    }
});
```

(See below for a complete explanation of ```around```.)

The second way to use method modifiers is, well, as methods:

```JavaScript
var Cat = aclass(FourLeggedThing);

// equivalent to the example above
Cat.around("init", function (supr) {
    supr("meow");
});
```

This is necessary if a class is defined somewhere else, and you want to modify it later. It's also necessary if you want to use method modifiers on an instance of a class.

Available modifiers are listed below.

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

```around()``` is the suggested way to call ```methodName``` in the parent class. See above for an example of this.

#### classOrInstance.augment(methodName, func)

```augment()``` is the inverse of ```around()```. The original method receives an ```inner``` function as the first argument, which subclasses then implement via ```augment()```.

```JavaScript
var Sign = aclass({

    init: function (canvas, text) {
        this.canvas = canvas;
        this.text = text;

        canvas.width = 100;
        canvas.height = 100;
    },

    draw: function (inner) {
        var context = this.canvas.getContext("2d");

        inner(context);

        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#000";
        context.fillText(this.text, 50, 50);
    }
});

var YieldSign = aclass(Sign, {

    around$init: function (supr, canvas) {
        supr(canvas, "YIELD");
    },

    augment$draw: function (context) {
        context.beginPath();

        context.moveTo(0, 99);
        context.lineTo(50, 0);
        context.lineTo(99, 99);
        context.lineTo(0, 99);

        context.strokeStyle = "#000";
        context.fillStyle = "#ff0";
        context.stroke();
        context.fill();

        context.closePath();
    }
});

var canvas = document.createElement("canvas");
document.body.appendChild(canvas);

YieldSign(canvas).draw();
```

### create your own™

Custom method modifiers can be created, as described below.

#### aclass.methodModifier(name, callback)

```name``` is the name of the modifier.

```callback``` receives three parameters: the owner of the method being modified, the name of the method being modified, and the new function (or value) that was provided. Typically, ```callback``` should return a new function that does something with these parameters, but you can be as creative as you want.

If you're using the $-syntax, the third parameter received is the function (or value) you assign to the ```modifier$method``` property. For example:

```JavaScript
aclass.methodModifier("throttle", function (owner, name, func) {
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

Alternatively, you could implement it like this, if you’d prefer to throttle methods after-the-fact:

```JavaScript
aclass.methodModifier("throttle", function (owner, name) {
    var orig = aclass.methodOrDelegate(owner, name);
    return _.throttle(orig, 100);
});

var A = aclass({
    updateSomething: function () {
        this.update();
    }
});

A.throttle("updateSomething");
```

In this case, ```A``` is the owner and ```updateSomething``` is the name of the method to modify on ```A```. The ```aclass.methodOrDelegate``` utility is described below.

#### aclass.methodOrDelegate(owner, name)

If ```name``` is an own property of ```owner``` (i.e., ```owner.hasOwnProperty(name)``` returns ```true```), then this simply returns ```owner[name]```. Otherwise, this returns a function that delegates to ```owner```’s super-class to look up ```name```. This allows you to “reference” a function that may not exist yet, or may exist but become modified later (possibly through a method modifier).

## license

http://opensource.org/licenses/MIT
