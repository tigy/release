
/**
 * 使用 IFrame 加载视图。
 */
DocPlus.IFrameController = DocPlus.Controller.extend({
	
	/**
	 * 当前控制器实际数据的存储路径。
	 */
	dataPath: null,
	
	init: function(){
		this.dataPath = this.name + '/';
		DocPlus.Controller.prototype.init.call(this);
	},
	
	initView: function(view){
		
		// view 的哈希地址即网址。
		this.initIFrameView(view, this.dataPath + view.pathInfo);
	},
	
	initHomeView: function(view){
		this.initIFrameView(view, this.dataPath + 'index.html');
	},
	
	/**
	 * 加载一个内容主题是 IFrame 的视图。
	 */
	initIFrameView: function(view, url){
		view.container = DocPlus.containers.append('<iframe class="container" frameborder="0"></iframe>');
		view.container.setAttr('src', url);
		// view.container.on('load', function(){
			// view.setTitle(this.node.contentDocument.title);
		// });
	}
	
});


