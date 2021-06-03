class Promise {
  static pending = 'pending';
  static fulfilled = 'fulfilled';
  static rejected = 'rejected';
  constructor(executor) {
    this.status = Promise.pending;//初始化状态
    this.value = undefined;
    this.reason = undefined;
    this.callbacks = [];
    executor(this.resolve.bind(this), this.rejected.bind(this));
  }
  catch(onRejected) {
    return this.then(onRejected)
  }
  finally(onFinally) {
    return this.then(onFinally, onFinally)
  }
  resolve(value) {
    if( value instanceof Promise ) {
      value.then(
        this.resolve.bind(this),
        this.rejected.bind(this)
      )
      return
    }
    this.value = value;
    this.status = Promise.fulfilled;
    this.callbacks.forEach(cb => this.handler(cb))
  }
  rejected(reason) {
    if( reason instanceof Promise ) {
      reason.then(
        this.resolve.bind(this),
        this.rejected.bind(this)
      )
      return;
    }
    this.reason = reason;
    this.status = Promise.rejected;
    this.callbacks.forEach(cb => this.handler(cb))
  }
  then(onFulfilled, onRejected) {
    return new Promise((nextResolve, nextRejected) => {
      this.handler({
        onFulfilled,
        onRejected,
        nextRejected,
        nextResolve
      })
    })
  }
  handler(callback) {
    const { onFulfilled, onRejected, nextRejected, nextResolve } = callback;
    if (this.status === Promise.pending) {
      this.callbacks.push(callback);
      return;
    }
    if (onFulfilled && typeof onFulfilled === 'function' && this.status === Promise.fulfilled) {
      const nextValue = onFulfilled(this.value) || this.value;
      nextResolve(nextValue);
      return
    }
    if (onRejected && typeof onRejected === 'function' && this.status === Promise.rejected) {
      const nextReason = onRejected(this.reason) || this.reason;
      nextRejected(nextReason);
      return;
    }
  }
}