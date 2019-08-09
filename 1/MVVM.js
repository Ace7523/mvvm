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
        console.log('node', node)
        let childNodes = node.childNodes
        console.log('childNodes', childNodes)
        console.log('todo 编译')
		
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