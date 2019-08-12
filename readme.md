
前5次提交都比较容易理解

 
commit6
开始逐步实现数据更新驱动视图更新，利用发布订阅 
添加Dep类 && 修改Observer类
Dep类生成实例有两个方法 1 添加观察者 2 调用每个观察者的update方法
这里解释一下，为什么是Dep类，而不是就写一个方法什么的
明确 dep 是什么，是发布订阅器 ，谁来用 ？ vm.$data的每一个属性都需要用 比如user ，user.name， user.age ，都需要有一个独有的dep
所以，需要Dep类，然后每个属性都要用过new Dep() 来新生成一个属于这条属性本身的dep实例

class Dep {} 很容易理解 难理解的是关于Observer类的修改
let dep = new Dep() 这一句  在上面提到的编译过程，就会执行这一句，目的是给vm.$data的每一条属性添加个dep实例
在Object.defineProperty 的get() 方法中 
Dep.target && dep.addSub(Dep.target) 这一句 是使用这个dep实例的addSub方法 （提示： 先忽略Dep.target是什么）
在Object.defineProperty 的set() 方法中 
dep.notify() 触发当前dep中存储的所有watcher ， 调用每个watcher的update方法

小结下这里 
1 在编译过程中，data的每条属性添加了dep实例
2 重点 在获取这属性的值的时候，把watcher添加到dep实例中
3 这条属性值在改变时， dep.notify() 进而触发所有watcher的update方法 

commit7
难点1 Watcher 类
三个参数 vm expr callback 
vm就是当前vue实例 ，包含 原始的 data， 可以把第一个参数想成是原材料
expr 表达式，比如 user.name 
callback 回调函数

1 先在vm中获取参数表达式中对应的 值 
  注意注意！ 因为数据已经全部被劫持，那么在这次获取，就是调用 Object.defineProperty 的get() 方法 也就是要去执行 Dep.target && dep.addSub(Dep.target) 这一条语句，在这语句执行之前
  Dep.target = this 这一句的作用，就是把当前的this 挂载在了全局对象的target上，Dep.target可能会让人混淆，其实换成别的全局对象也行， 那问题，这个this是什么？ 答 this就是 watcher实例！(提示 回顾一下new 的原理)
  然后就把 Dep.target = null 上面懂了的话，这里就不用解释

2 new 出来的 watcher实例 有一个update方法，这个方法一执行，就会重新去获取值，并把新值传递给参数中的回调函数，并且会让这个回调函数执行

3 在哪里new Watcher
答 在第一次编译的时候，也就是 页面最最开始 {{user.name}} 通过vm.$data 变成 Ace7523 的时候，也就是在  CompileUtil 的 model 和 text 方法中

发布订阅完毕

