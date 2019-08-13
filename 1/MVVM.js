const CompileUtil = {
	// 根据表达式取到对应数据, 对于{{ key.val }} 这种前后有空格的，要注意格式 
	getVal(vm, expr){
		return expr.split('.').reduce((current, data)=>{
			return current[data]
		}, vm.$data)
	},
	setValue(vm, expr, value){
		expr.split('.').reduce((current, data, index, arr)=>{
			if(index == arr.length -1){
				return current[data] = value	
			}
			return current[data]
		}, vm.$data)
	},
	getContentValue(vm, expr) {
		// 重新去一次 {{a}} {{b}} 中的a b的值，再一次性放回去
		return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
			return this.getVal(vm, args[1])
		})
	},
	model(node, expr, vm){
		let fn = this.updater['modelUpdater']

		new Watcher(vm, expr, (newVal) => {
			fn(node, newVal)
		})
		node.addEventListener('input', (e) => {
			let value = e.target.value
			this.setValue(vm, expr, value)
		})

		let value = this.getVal(vm, expr)
		fn(node, value)
	},
	text(node, expr, vm){
		// {{a}} {{b}}
		// args 就是拿到所有的 {{}}
		let fn = this.updater['textUpdater']
		let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {

			new Watcher(vm, args[1], (newVal) => {
			    fn(node, this.getContentValue(vm, expr)) // 返回一个全的字符串
			})

			return this.getVal(vm, args[1])
		})
		fn(node, content)
	},
	updater: {
		modelUpdater(node, value) {
			node.value = value
		},
		textUpdater(node, value) {
			node.textContent = value
		}
	}
}
class Dep {
	constructor() {
		this.subs = []
	}
	// 订阅
	addSub(watcher) {
		this.subs.push(watcher)
	}
	// 发布
	notify() {
		this.subs.forEach(watcher => {
			watcher.update()
		})
	}
}
class Watcher {
	constructor(vm, expr, callback) {
		this.vm = vm
		this.expr = expr 
		this.callback = callback
		// 默认先存放一个老值
		this.oldValue = this.getOldValue()
	}
	getOldValue() {
		Dep.target = this // 先把自己放在this上
		let value = CompileUtil.getVal(this.vm, this.expr)
		Dep.target = null
		return value
	}
	update() {
		let newVal = CompileUtil.getVal(this.vm, this.expr)
		if (newVal !== this.oldValue){
			this.callback(newVal)
		}
	}
}
class Vue {
	constructor(options) {
		this.$el = options.el
		this.$data = options.data

		let computed = options.computed

		if(this.$el){
            // 进行数据劫持 把数据全部转化为Object.defineProperty 来定义
			new Observer(this.$data)
			
			for(let key in computed){
				Object.defineProperty(this.$data, key, {
					get: ()=>{
						// 确保this指向当前new出来的vm实例
						// 箭头函数中 没有this 于是向上找 找打this.$el 的 this
						return computed[key].call(this)
					}
				})
			}
			this.proxyVm(this.$data)
			
			// 编辑模板 用 vm.$data 去替换模板 
			new Compiler(this.$el, this)
		}
	}
	proxyVm(data){
		for(let key in data){
			Object.defineProperty(this, key, {
				get() {
					return data[key]
				}
			})
		}
	}	
}
class Observer {
	constructor(data){
		this.observer(data)
	}
	observer(data) {
		if(data && typeof data == 'object'){
			for(let key in data){
				this.defineReactive(data, key, data[key])
			}
		}
	}
	defineReactive(obj, key, value){
        // 递归 当前value还是对象的话 再次进行观察
		this.observer(value)

		let dep = new Dep()

		Object.defineProperty(obj, key, {
			get() {

				Dep.target && dep.addSub(Dep.target)

				return value
			},
			set : (newVal) => {
				if(newVal != value){
					// 如果赋值的newVal也是对象，那就需要对这个对象也进行监控
					this.observer(newVal)
					value = newVal

					dep.notify()
				}
			}
		})
	}
}
class Compiler {
	constructor(el, vm) {
		this.el = this.isElementNode(el) ? el : document.querySelector(el)
		this.vm = vm
        let fragment = this.node2fragment(this.el)

        this.compile(fragment)

		this.el.appendChild(fragment)
	}
	compile(node) {
        let childNodes = node.childNodes
        // childNodes 是一个类数组 没用babel [...childNodes] 用不了
		childNodes.forEach = Array.prototype.forEach
		childNodes.forEach(child => {
			if (this.isElementNode(child)){
				this.compileElement(child)
				// 递归
				this.compile(child)
			} else {
				this.compileText(child)
			}
		})

    }
    compileElement(node) {
        let attributes = node.attributes
        attributes.forEach = Array.prototype.forEach
		attributes.forEach( attr => {
			let {name, value} = attr
			if (this.isDirective(name)){
                let [ ,directive] = name.split('-')
				CompileUtil[directive](node, value, this.vm)
			}
			
		})
    }
    compileText(node) {
		let content = node.textContent
		if(/\{\{(.+?)\}\}/.test(content)){
			CompileUtil['text'](node, content, this.vm)
		}
    }
    isDirective(attrName){
		return attrName.startsWith('v-')
	}
	isElementNode(node) {
		return node.nodeType === 1
	}
	// 把dom节点移动到内存中
	node2fragment(node) {
		let fragment = document.createDocumentFragment()
		let firstChild
		while (firstChild = node.firstChild) {
			fragment.appendChild(firstChild)
		}
		return fragment
	}
} 