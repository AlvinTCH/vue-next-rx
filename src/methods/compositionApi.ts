import { ref as _ref, onBeforeUnmount, Ref } from 'vue';
import { Observable, Subject } from 'rxjs';

/*
Example Usage:

setup() {
  const { subject: plus$, callback: plus } = rxInitSubjectCallback()
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
*/

// Subscribes and ensures unsubscription when component is unmounted
function subscribeTo<T>(
  observable: Observable<T>,
  next?: (value: T) => void,
  error?: (err: any) => void,
  complete?: () => void
) {
  const subscription = observable.subscribe(next, error, complete);
  onBeforeUnmount(() => {
    subscription.unsubscribe();
  });

  return subscription;
}

// add custom subscription functions
function useSubscription<T>(
  observable: Observable<T>,
  next?: (value: T) => void,
  error?: (err: any) => void,
  complete?: () => void
) {
  return subscribeTo(observable, next, error, complete);
}

// Add the observable to the Subject and alters the Ref
function useObservable<T>(
  observable: Observable<T>,
  defaultValue?: T
): Ref<T> {
  const handler = _ref(defaultValue) as Ref<T>;
  subscribeTo(
    observable,
    value => {
      handler.value = value;
    },
    error => {
      throw error;
    }
  );
  return handler;
}

// Register subject and callback event
function rxInitSubjectCallback<T>() {
  const subject = new Subject<T>();
  return {
    subject,
    callback: (event: T) => {
      subject.next(event);
    }
  };
}

export { useObservable, useSubscription, rxInitSubjectCallback }