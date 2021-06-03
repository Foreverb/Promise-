// promise是一个类  它的构造函数接受一个函数  函数的两个参数也是函数

//三种状态，pending、fulfilled、rejected

//两种值：value-执行成功处理函数(this.resolve)之后返回的值，reason-执行失败处理函数(this.rejected)之后返回的值

class mPromise {
  //promise的三个状态
  static pending = 'pending';
  static fulfilled = 'fulfilled';
  static rejected = 'rejected';
  constructor(executor) {
    this.value = undefined;
    this.reason = undefined;
    this.callbacks = []; //回调函数
    this.status = mPromise.pending; //初始化状态为pending
    //处理new promise实例时传参
    //bind(this) 防止执行resolve或者rejected方法时 方法内部this指向出现问题
    executor(this.resolve.bind(this), this.rejected.bind(this));
  }
  //finally和catch方法只是then的一个别名
  //catch() / finally() 方法返回一个Promise
  catch(onRejected) {
    return this.then(null, onRejected);
  }
  finally(onFinally) {
    return this.then(onFinally, onFinally);
  }
  resolve(value) {
    //添加这段代码原因：
    //当第一个promise中resolve方法里面的参数是个promise时
    //那么后面的then方法，会等到这个promise完成之后
    //才会执行后面的then方法
    if (value instanceof mPromise) {
      value.then(
        this.resolve.bind(this),
        this.rejected.bind(this)
      )
      return
    }
    this.value = value;
    this.status = mPromise.fulfilled;// 将状态设置为成功
    this.callbacks.forEach(cb => this.handler(cb));// 通知成功事件执行
  }
  rejected(reason) {
    //添加这段代码原因：
    //当第一个promise中resolve方法里面的参数是个promise时
    //那么后面的then方法，会等到这个promise完成之后
    //才会执行后面的then方法
    if (reason instanceof mPromise) {
      reason.then(
        this.resolve.bind(this),
        this.rejected.bind(this)
      )
      return
    }
    this.reason = reason;
    this.status = mPromise.rejected;// 将状态设置为失败
    this.callbacks.forEach(cb => this.handler(cb));// 通知失败事件执行
  }
  // onFulfilled 是成功时执行的函数
  // onRejected 是失败时执行的函数
  then(onFulfilled, onRejected) {
    // 返回一个新的Promise
    return new mPromise((nextResolve, nextRejected) => {
      // 注册事件：将需要执行的回调函数存储起来
      this.handler({
        onFulfilled,
        onRejected,
        nextResolve,
        nextRejected
      })
      //吧下一个resolve，rejected函数存入到callback中，主要就是把onFulfilled/onRejected执行结果通过nextResolve/nextRejected传入到下一个promise中作为它的value
    })

  }
  handler(callback) {
    const { onFulfilled, onRejected, nextResolve, nextRejected } = callback;
    //处理初始状态回调
    if (this.status === mPromise.pending) {
      this.callbacks.push(callback);
      return;
    }
    //处理成功回调
    if (this.status === mPromise.fulfilled) {
      const nextValue = onFulfilled ? onFulfilled(this.value) : this.value;
      nextResolve(nextValue);
      return;
    }
    //处理失败回调
    if (this.status === mPromise.rejected) {
      const nextReason = onRejected ? onRejected(this.reason) : this.value;
      nextRejected(nextReason);
    }
  }
}