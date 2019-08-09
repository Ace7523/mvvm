class Vue {
	constructor(options) {
		this.$el = options.el
		this.$data = options.data

		if(this.$el){
			// 编辑模板 用 vm.$data 去替换模板 
			new Compiler(this.$el, this)
		}
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
                console.log(node, value, this.vm)
				// CompileUtil[directive](node, value, this.vm)
			}
			
		})
    }
    compileText(node) {
		let content = node.textContent
		if(/\{\{(.+?)\}\}/.test(content)){
            console.log(node, content, this.vm)
			// CompileUtil['text'](node, content, this.vm)
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