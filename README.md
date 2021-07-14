# vue-next-rx

<div align="center">
<img src="https://i.ibb.co/q5267TX/maxresdefault-2.jpg" width="25%" />
</div>

### [RxJS v6](https://github.com/ReactiveX/rxjs) integration for [Vue next]()

### Note: This is a fork of @nopr3d/vue-next-rx

![](https://img.shields.io/github/license/NOPR9D/vue-next-rx)

<br>

> **NOTE**
>
> - vue-next-rx only works with RxJS v6+ by default. If you want to keep using RxJS v5 style code, install `rxjs-compat`.

---

# Installation

#### NPM + ES2015 or more

**`rxjs` is required as a peer dependency.**

```bash
npm install vue @greytch/vue-next-rx rxjs --save
```

```js
import Vue from "vue";
import VueRx from "@greytch/vue-next-rx";

Vue.use(VueRx);
```

<br />

When bundling via webpack, `dist/vue-next-rx.esm.js` is used by default. It imports the minimal amount of Rx operators and ensures small bundle sizes.

To use in a browser environment, use the UMD build `dist/vue-next-rx.js`. When in a browser environment, the UMD build assumes `window.rxjs` to be already present, so make sure to include `vue-next-rx.js` after Vue.js and RxJS. It also installs itself automatically if `window.Vue` is present.

Example:

```html
<script src="https://unpkg.com/rxjs/bundles/rxjs.umd.js"></scripts>
<script src="https://unpkg.com/vue@next"></script>
<script src="../dist/vue-next-rx.js"></script>
```

<br />

# Usage

## Composition API

Credits to @kevin-courbet in https://github.com/vuejs/vue-rx/issues/120)

### `rxInitSubjectCallback<T>()`

Returns the subject and the callback function to be used. Callback function can be exposed and be placed in the DOM and can be used to trigger the observable

```js
const { subject: plus$, callback: plus } = rxInitSubjectCallback();
```

### `useObservable<T>(observable: Observable<T>, defaultValue?: T)`

Wraps the obervable. The variable becomes a ref

```js
const { subject: plus$, callback: plus } = rxInitSubjectCallback();
```

#### Example Implementation

``` html
<div lang="pug">
  <div @click="plus">
  </div>
  <span>{{ count }}</span>
</div>
```

```js
import { rxInitSubjectCallback, useObservable } from "@greytch/vue-next-rx";

export default defineComponent({
  name: "Home",
  setup () {
    // returns the subject and the callback function to be used. Callback function can be exposed and be placed in the DOM to call the composition API
    const { subject: plus$, callback: plus } = rxInitSubjectCallback();

    // wraps the obervable. 'Count' becomes a "ref" type
    const count = useObservable(
      plus$.pipe(
        map(() => 1),
        startWith(0),
        scan((total, change) => total + change)
      )
    )
    return {
      count,
      plus
    }
  }
});
```

</br>

## Subscriptions

```js
// Expose `Subject` with domStream, use them in subscriptions functions
export default defineComponent({
  name: "Home",
   domStreams: ["click$"],
    subscriptions() {
      return {
        count: this.click$.pipe(
          map(() => 1),
          startWith(0),
          scan((total, change) => total + change)
        ),
      };
});
```

```html
<div>
  <button v-stream:click="click$">Click Me</button>
</div>

<div>{{count}}</div>
<!-- On click will show 0, 1 ,2 ,3... -->
```

### Or

</br>

```js
// Expose `Subject` with domStream, use them in subscriptions functions
export default defineComponent({
  name: "Home",
  domStreams: ["action$"],
  subscriptions() {
    this.action$.pipe(map(() => "Click Event !")).subscribe(console.log);
    // On click will print "Click Event"
  },
});
```

## Tips

You can get the data by simply plucking it from the source stream:

```js
const actionData$ = this.action$.pipe(pluck("data"));
```

You can bind Subject by this way

```html // Bind with stream directives
<button v-stream:click="action$">Click Me!</button>
or
<button v-stream:click="{ subject: action$, data: someData }">+</button>
```

---

<br />

# Other API Methods

</br>

## `$watchAsObservable(expOrFn, [options])`

This is a prototype method added to instances. You can use it to create an observable from a Data. The emitted value is in the format of `{ newValue, oldValue }`:

```js
import { ref } from "@greytch/vue-next-rx";

export default defineComponent({
  name: "Home",
  setup() {
    const msg = ref("Old Message");
    setTimeout(() => (msg.value = "New message incomming !"), 1000);
    return { msg };
  },
  subscriptions() {
    return {
      oldMsg: this.$watchAsObservable("msg").pipe(pluck("oldValue")),
    };
  },
});
```

You can also add options allowed in the $watch API (E.g deep, immediate as the second parameter)

```js
import { ref } from "@greytch/vue-next-rx";

export default defineComponent({
  name: "Home",
  setup() {
    const msg = ref("Old Message");
    setTimeout(() => (msg.value = "New message incomming !"), 1000);
    return { msg };
  },
  subscriptions() {
    return {
      oldMsg: this.$watchAsObservable("msg", { immediate: true }).pipe(pluck("oldValue")),
    };
  },
});
```

```html
<!-- bind to it normally in templates -->
<!-- on change DOM is update too -->
<div>{{ msg }}</div>
<!-- Will display : Old message, after 1 second display "New Message !" -->
<div>{{oldMsg}}</div>
<!-- wait for value and display "Old Message" after 1 second -->
```

---

## `$subscribeTo(observable, next, error, complete)`

This is a prototype method added to instances. You can use it to subscribe to an observable, but let VueRx manage the dispose/unsubscribe.

```js
import { interval } from "rxjs";

const vm = new Vue({
  mounted() {
    this.$subscribeTo(interval(1000), function (count) {
      console.log(count);
    });
  },
});
```

## `$fromDOMEvent(selector, event)`

This is a prototype method added to instances. Use it to create an observable from DOM events within the instances' element. This is similar to `Rx.Observable.fromEvent`, but usable inside the `subscriptions` function even before the DOM is actually rendered.

`selector` is for finding descendant nodes under the component root element, if you want to listen to events from root element itself, pass `null` as first argument.

```js
import { pluck } from "rxjs/operators";

const vm = new Vue({
  subscriptions() {
    return {
      inputValue: this.$fromDOMEvent("input", "keyup").pipe(
        pluck("target", "value")
      ),
    };
  },
});
```

```html
<div><input /></div>
<div>{{inputValue}}</div>
```

---

## `$createObservableMethod(methodName)`

Convert function calls to observable sequence which emits the call arguments.

This is a prototype method added to instances. Use it to create a shared hot observable from a function name. The function will be assigned as a vm method.

```html
<custom-form :onSubmit="submitHandler"></custom-form>
```

```js
const vm = new Vue({
  subscriptions() {
    return {
      // requires `share` operator
      formData: this.$createObservableMethod("submitHandler"),
    };
  },
});
```

You can use the `observableMethods` option to make it more declarative:

```js
new Vue({
  observableMethods: {
    submitHandler: "submitHandler$",
    // or with Array shothand: ['submitHandler']
  },
});
```

The above will automatically create two things on the instance:

1. A `submitHandler` method which can be bound to in template with `v-on`;
2. A `submitHandler$` observable which will be the stream emitting calls to `submitHandler`.

[example](https://github.com/NOPR9D/vue-next-rx/blob/main/example/createObservableMethod.html)

---

## Example

See `/examples` for some simple examples.

</br>

---
<br>

## Other Vue RxJS implementation

- vuse-rx: https://github.com/Raiondesu/vuse-rx

</br>

---

---

## License

[MIT](http://opensource.org/licenses/MIT)

---
