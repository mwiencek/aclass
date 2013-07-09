# aclass

A (very) small wrapper over JavaScript's prototype system. AMD support is included.

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

#### instance.isa(Class)

Returns ```true``` if ```Class``` is somewhere in the prototype chain of ```instance```, ```false``` otherwise.

#### Class1.isa(Class2)

Returns ```true``` if ```Class2``` is somewhere in the prototype chain of ```Class1```, ```false``` otherwise.

## thoughts

I had three main motivations for writing this:

 1. To not have to type ```.prototype``` everywhere.
 2. To not have to manually set a prototype's ```constructor```.
 3. To avoid special code that runs a class's ```init()``` method.

I also dislike the syntax that other class systems use. Passing a dictionary of methods requires too much indentation.

The ```__super__``` attribute isn't something I'd use, personally. I added it because it was a single line of code. I would recommend only accessing it using ```Class.__super__``` and not ```this.__super__```. The latter can lead to unexpected results when you have a class heirarchy of more than two levels, because the value is only ever dependent on ```this```, not the method you happen to be in.

If I could get away with it, I'd rename ```instance()``` to ```new()```. It would work in most cases, but would break inside a ```with``` statement.

## license

http://opensource.org/licenses/MIT
