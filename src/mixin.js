import { warn } from "./util";
import { Subject, Subscription, isObservable } from "rxjs";

import { getCurrentInstance } from 'vue'

import { v4 as uuidv4 } from 'uuid'

export default {
  created() {
    const vm = this;
    const domStreams = vm.$options.domStreams;

    if (domStreams) {
      domStreams.forEach(key => {
        vm[key] = new Subject();
      });
    }

    const observableMethods = vm.$options.observableMethods;
    if (observableMethods) {
      if (Array.isArray(observableMethods)) {
        observableMethods.forEach(methodName => {
          vm[methodName + "$"] = vm.$createObservableMethod(methodName);
        });
      } else {
        Object.keys(observableMethods).forEach(methodName => {
          vm[observableMethods[methodName]] = vm.$createObservableMethod(
            methodName
          );
        });
      }
    }

    let obs = vm.$options.subscriptions;
    if (typeof obs === "function") {
      obs = obs.call(vm);
    }
    if (obs) {
      vm.$observables = {};
      vm._subscription = new Subscription();
      Object.keys(obs).forEach(key => {
        vm[key] = undefined;
        const ob = (vm.$observables[key] = obs[key]);
        if (!isObservable(ob)) {
          warn(
            'Invalid Observable found in subscriptions option with key "' +
              key +
              '".',
            vm
          );
          return;
        }
        vm._subscription.add(
          obs[key].subscribe(
            value => {
              vm[key] = value;
              this.getCurrentInstance().subTree.key = uuidv4();
              // this.$forceUpdate();
            },
            error => {
              throw error;
            }
          )
        );
      });
    }
  },

  beforeUnmount() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
};
