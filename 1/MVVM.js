const CompileUtil = {
	// 根据表达式取到对应数据, 对于{{ key.val }} 这种前后有空格的，要注意格式 
	getVal(vm, expr){
		return expr.split('.').reduce((current, data)=>{
			return current[data]
		}, vm.$data)
	},
	model(node, expr, vm){
		let fn = this.updater['modelUpdater']
		let value = this.getVal(vm, expr)
		fn(node, value)
	},
	text(node, expr, vm){
		// {{a}} {{b}}
		// args 就是拿到所有的 {{}}
		let fn = this.updater['textUpdater']
		let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
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
class Vue {
	constructor(options) {
		this.$el = options.el
		this.$data = options.data

		if(this.$el){
            // 进行数据劫持 把数据全部转化为Object.defineProperty 来定义
            new Observer(this.$data)
            console.log('this.$data ', this.$data)
			// 编辑模板 用 vm.$data 去替换模板 
			new Compiler(this.$el, this)
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

		Object.defineProperty(obj, key, {
			get() {
				return value
			},
			set : (newVal) => {
				if(newVal != value){
					// 如果赋值的newVal也是对象，那就需要对这个对象也进行监控
					this.observer(newVal)
					value = newVal
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