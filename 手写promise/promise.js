class Promise {
  static pending = 'pending';
  static fulfilled = 'fulfilled';
  static rejected = 'rejected';
  constructor(executor) {
    this.status = Promise.pending;
    this.value = undefined;
    this.reason = undefined;
    this.callbacks = [];
    executor(this.resolve.bind(this), this.rejected.bind(this));
  }
  resolve(value) {
    if (value instanceof Promise) {
      value.then(
        this.resolve.bind(this),
        this.rejected.bind(this)
      )
      return;
    }
    this.value = value;
    this.status = Promise.fulfilled;
    this.callbacks.forEach(cb => this.handler(cb))
  }
  rejected(reason) {
    if (reason instanceof Promise) {
      reason.then(
        this.resolve.bind(this),
        this.rejected.bind(this)
      )
      return;
    }
    this.reason = reason;
    this.status = Promise.rejected;
    this.callbacks.forEach(cb => this.handler(cb));
  }
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  finally(onFinally) {
    return this.then(onFinally, onFinally);
  }
  then(onFulfilled, onRejected) {
    return new Promise((nextResolve, nextRejected) => {
      this.handler(
        {
          onFulfilled,
          onRejected,
          nextResolve,
          nextRejected
        }
      )
    })
  }
  handler(callback) {
    const { onFulfilled, onRejected, nextResolve, nextRejected } = callback;
    if (this.status === Promise.pending) {
      this.callbacks.push(callback);
      return;
    }
    if (this.status === Promise.fulfilled) {
      const nextValue = onFulfilled ? onFulfilled(this.value) : this.value;
      nextResolve(nextValue);
      return;
    }
    if (this.status === Promise.rejected) {
      const nextReason = onRejected ? onRejected(this.reason) : this.reason;
      nextRejected(nextReason);
      return;
    }
  }
}