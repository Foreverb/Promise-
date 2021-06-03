class WPromise {
  static pending = 'pending';
  static fulfilled = 'fulfilled';
  static rejected = 'rejected';

  constructor(executor) {
      this.status = WPromise.pending; // 初始化状态为pending
      this.value = undefined; // 存储 this._resolve 即操作成功 返回的值
      this.reason = undefined; // 存储 this._reject 即操作失败 返回的值
      // 存储then中传入的参数
      // 至于为什么是数组呢？因为同一个Promise的then方法可以调用多次
      this.callbacks = [];
      executor(this._resolve.bind(this), this._reject.bind(this));
  }

  // onFulfilled 是成功时执行的函数
  // onRejected 是失败时执行的函数
  then(onFulfilled, onRejected) {
      // 返回一个新的Promise
      return new WPromise((nextResolve, nextReject) => {
          // 这里之所以把下一个Promsie的resolve函数和reject函数也存在callback中
          // 是为了将onFulfilled的执行结果通过nextResolve传入到下一个Promise作为它的value值
          this._handler({
              nextResolve,
              nextReject,
              onFulfilled,
              onRejected
          });
      });
  }

  // catch方法只有一个参数用于处理错误的情况
  catch(onRejected) {
      return this.then(null, onRejected);
  }

  finally(onFinally) {
      return this.then(onFinally, onFinally);
  }

  _resolve(value) {
      // 处理onFulfilled执行结果是一个Promise时的情况
      // 这里可能理解起来有点困难
      // 当value instanof WPromise时，说明当前Promise肯定不会是第一个Promise
      // 而是后续then方法返回的Promise（第二个Promise）
      // 我们要获取的是value中的value值（有点绕，value是个promise时，那么内部存有个value的变量）
      // 怎样将value的value值获取到呢，可以将传递一个函数作为value.then的onFulfilled参数
      // 那么在value的内部则会执行这个函数，我们只需要将当前Promise的value值赋值为value的value即可
      if (value instanceof WPromise) {
          value.then(
              this._resolve.bind(this),
              this._reject.bind(this)
          );
          return;
      }

      this.value = value;
      this.status = WPromise.fulfilled; // 将状态设置为成功

      // 通知事件执行
      this.callbacks.forEach(cb => this._handler(cb));
  }

  _reject(reason) {
      if (reason instanceof WPromise) {
          reason.then(
              this._resolve.bind(this),
              this._reject.bind(this)
          );
          return;
      }

      this.reason = reason;
      this.status = WPromise.rejected; // 将状态设置为失败

      this.callbacks.forEach(cb => this._handler(cb));
  }

  _handler(callback) {
      const {
          onFulfilled,
          onRejected,
          nextResolve,
          nextReject
      } = callback;
      if (this.status === WPromise.pending) {
          this.callbacks.push(callback);
          return;
      }

      if (this.status === WPromise.fulfilled) {
          // 传入存储的值
          // 未传入onFulfilled时，将value传入
          const nextValue = onFulfilled
              ? onFulfilled(this.value)
              : this.value;
          nextResolve(nextValue);
          return;
      }

      if (this.status === WPromise.rejected) {
          // 传入存储的错误信息
          // 同样的处理
          const nextReason = onRejected
              ? onRejected(this.reason)
              : this.reason;
          nextReject(nextReason);
      }
  }
}