
/**
 * 使用 IFrame 加载视图。
 */
DocPlus.IFrameController = DocPlus.Controller.extend({
	
	/**
	 * 当前控制器实际数据的存储路径。
	 */
	dataPath: null,

	/**
	 * 控制器所需数据源。
	 */
	indexPath: null,

	initMenu: function(data, treeView){
		var me = this;
		this._expadingHandler = function(){
			me.initTreeNodes(this.data, this);
		};
		this.initTreeNodes(data, treeView);
	},
	
	/**
	 * 将 data.menu 中的项添加为节点。
	 */
	initTreeNodes: function(data, parentTreeNode){
		var menu,
			treeNode,
			base = data.base,
			menuData;
		for(menu in data.menu){
			menuData = data.menu[menu];
			
			// 修复一些错误的数据。
			
			menuData.base = menuData.base ? menuData.base.replace('~', base) : base;
			menuData.href = (menuData.href || '~').replace('~', menuData.base);
			menuData.title = menuData.title || menu;
			
			// 创建初始化节点。
			
			menuData.treeNode = treeNode = parentTreeNode.add(menu);
			treeNode.data = menuData;
			
			// 如果有子节点，绑定扩展事件。
			if(menuData.menu) {
				treeNode.setNodeType('plus');
				treeNode.once('expanding', this._expadingHandler);
			}
			
			this.initTreeNode(menuData, treeNode);
		}
		
		// 默认折叠窗口。
		parentTreeNode.collapse();
	},
	
	initTreeNode: function (data, treeNode) {
		treeNode.setAttr('href', data.href);
		treeNode.setAttr('title', data.title);
		
		if(data.icon){
			treeNode.setIcon(data.icon);
		}
		//memberInfo.treeNode.last('span').addClass('icon-member icon-' + memberInfo.icon);
	},
	
	loadData: function(data){
		this.initMenu(data, this.treeView);
	},
	
	showTreeNode: function(view){
		trace("showTreeNode", view);
		//   view.treeNode.ensureVisible();
	},
	
	initView: function(view){
		
		// view 的哈希地址即网址。
		this.initIFrameView(view, view.hash);
	},
	
	initHomeView: function(view){
		view.setHtml('首页');
	},
	
	/**
	 * 加载一个内容主题是 IFrame 的视图。
	 */
	initIFrameView: function(view, url){
		view.container = DocPlus.containers.append('<iframe class="container" frameborder="0"></iframe>');
		view.container.on('load', function(){
			view.setTitle(this.node.contentDocument.title);
		});
		view.container.setAttr('src', url);
	}
	
});


