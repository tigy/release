/**
 * @author xuld
 */


/**
 * 负责整个文档逻辑的管理对象。
 */
var DocPlus = {
	
	/**
	 * 首页的导航。
	 */
	navs: null,

	/**
	 * 顶部的导航菜单容器节点。
	 */
	tabs: null,

	/**
	 * 存储内容的容器节点。
	 */
	containers: null,

	/**
	 * 存储导航树的容器节点。
	 */
	trees: null,

	/**
	 * 初始化系统。
	 */
	init: function () {

		// 初始化节点。

		DocPlus.navs = Dom.get("navbar");
		DocPlus.tabs = Dom.get("tabs");
		DocPlus.trees = Dom.get("doctree");
		DocPlus.containers = Dom.get("container");

		// 载入配置。
		DocPlus.loadOptions();

		// 初始化分割条。

		DocPlus.initSplitter();
		DocPlus.updateLayout();
		
		// 绑定界面事件。

		var win = Dom.window;
		win.on('unload', DocPlus.saveOptions);
		win.on('hashchange', DocPlus.reload);
		win.on('resize', DocPlus.updateLayout);

		Dom.find('#tabs-more .x-icon-list').parent().on('click', function () {
			var menu = DocPlus.listMenu;
			if (!menu) {
				DocPlus.listMenu = menu = new ContextMenu().appendTo();
				menu.on('show', DocPlus.showMask);
				menu.on('hide', DocPlus.hideMask);
				menu.hide();
			}

			if (Dom.isHidden(menu.node)) {
				DocPlus.initViewListMenu(menu);
				menu.showBy(this, 'br');
			} else {
				menu.hide();
			}
		});

		// 刷新页面显示。
		
		DocPlus.initControllers();

		// 刷新历史记录的视图。
		if (DocPlus.options.views)
			DocPlus.options.views.forEach(function(hash){
				DocPlus.viewHistory.push(DocPlus.createView(hash));
			});

		// 刷新当前激活的视图。
		DocPlus.reload();
	},

	// 配置
	
	/**
	 * 当前系统的配置对象。 
	 */
	options: {
		
		/**
		 * 分割条的位置。 
		 */
		sidebarWidth: 200,
		
		/**
		 * 已打开的视图。 
		 */
		views: []
	},

	/**
	 * 载入默认配置。
	 */
	loadOptions: function () {
		var data = Browser.getJSON('docOptions');
		if (data) {
			for (var item in DocPlus.options) {
				DocPlus.options[item] = data[item];
			}
		}
	},
	
	/**
	 * 保存当前配置。 
	 */
	saveOptions: function () {
		if (DocPlus.options.views)
			DocPlus.options.views.length = 0;
		else
			DocPlus.options.views = [];

		for (var view in DocPlus.views) {
			DocPlus.options.views.push(view);
		}

		Browser.setJSON('docOptions', DocPlus.options);
	},

	// 分割条

	/**
	 * 初始化 splitter 的拖动事件。
	 */
	initSplitter: function () {
		var draggable = new Draggable(Dom.get('splitter'));

		draggable.onDragStart = function (e) {
			this.target.addClass('x-splitter-proxy');
			return true;
		};

		draggable.onDrag = function () {
			this.to.y = this.from.y;
			this.to.x = Math.min(1000, Math.max(150, this.to.x));
			return true;
		};

		draggable.onDragEnd = function () {
			DocPlus.updateSplitter(this.to.x);
			this.target.removeClass('x-splitter-proxy');
			return true;
		};
	},

	/**
	 * 当窗口更改大小之后，刷新页面布局。
	 */
	updateLayout: function () {
		var height = document.getSize().y - Dom.get('header').getSize().y;
		Dom.get('splitter').setHeight(height);
		height -= 10;
		DocPlus.trees.setHeight(height - Dom.get('sidebar-toolbar').getSize().y - 10);

		DocPlus.containers.setHeight(height);
		DocPlus.updateSplitter(DocPlus.options.sidebarWidth);
		DocPlus.relayoutTab();
	},

	/**
	 * 更新 splitter 位置。
	 */
	updateSplitter: function (sidebarWidth) {
		Dom.get('sidebar').setWidth(sidebarWidth - 10);
		Dom.get('splitter').setOffset({ x: sidebarWidth - 3 });
		DocPlus.containers.setWidth(document.getSize().x - sidebarWidth - 12);
		DocPlus.options.sidebarWidth = sidebarWidth;
	},

	// 页面
	
	/**
	 * 将页面重定向到指定哈希地址。
	 */
	redirect: function(hash){
		location.hash = '!' + hash;
	},

	/**
	 * 根据页面上当前哈希值，重新加载页面。
	 */
	reload: function () {
		DocPlus.navigate(DocPlus.getHash());
	},

	/**
	 * 分析当前网址，获取当前正在显示的视图的哈希值。
	 */
	getHash: function () {
		var href = location.href,
    		i = href.indexOf("#");
		return i >= 0 ? href.substr(href.charAt(++i) === '!' ? i + 1 : i) : "";
	},

	/**
	 * 显示指定哈希值的选项卡。
	 */
	navigate: function (hash) {

		// 检查指定地址的视图是否存在，如果存在，则激活。否则，先创建该视图。
		var view = DocPlus.views[hash] || (DocPlus.createView(hash));

		// 如果无法创建，则无法打开页面，忽视操作。
		if (view) {

			// 激活当前视图。
			view.active();

		}

		// 修复 IE 6/7 下跳转肯能出现的滚动。
		document.body.scrollTop = 0;

	},

	/**
     * 刷新当前视图。
     */
	update: function () {
		if(DocPlus.currentView) {
			DocPlus.currentView.controller.activeView(DocPlus.currentView);
		}
	},

	// 数据

	// 视图
	
	/**
	 * 所有可用的控制器。
	 */
	controllers: {},

	/**
	 * 当前打开的全部视图。
	 */
	views: {},

	/**
	 * 当前打开的视图数目。
	 */
	viewCount: 0,
	
	/**
	 * 视图的历史记录。 
	 */
	viewHistory: [],

	/**
	 * 根据指定的哈希值创建指定名的视图。
	 */
	createView: function (hash) {

		var spa = hash.indexOf('/');

		// 获取相应的控制器。
		var controller = DocPlus.controllers[spa >= 0 ? hash.substr(0, spa) : hash];

		// 如果找不到合适的控制器，则表示无法创建相应视图。返回空。
		if(!controller){
			return null;
		}

		// 如果控制器未载入，则先载入。
		if(controller.init !== Function.empty) {
			controller.init();
			controller.init = Function.empty;
		}
		
		var pathInfo = spa === -1 ? '' : hash.substr(spa + 1),
			view;
		
		if(!pathInfo){
			view = controller.homeView;
			if(!view.content) {
				controller.initHomeView(view);
			}
		} else {
			view = controller.createView(hash, pathInfo);
			controller.initView(view);
		}
		
		// 用控制器创建真正的视图对象。
		// 保存新打开的视图。
		return view;
	},

	// 视图界面

	initViewListMenu: function (menu) {
		menu.clear();
		menu.add('关闭全部').on('click', DocPlus.closeAllViews);
		menu.add('恢复关闭的选项卡').on('click', DocPlus.restoreLastView);
		//menu.items.add('-');
	},

	showMask: function () {
		Dom.get('mask').show();
	},

	hideMask: function () {
		Dom.get('mask').hide();
	},

	closeCurrentView: function () {
		DocPlus.currentView && DocPlus.currentView.close();
	},

	closeOtherViews: function () {
		for (var i in DocPlus.views) {
			var t = DocPlus.views[i];
			if (t !== DocPlus.currentView) {
				t.close();
			}
		}
	},

	restoreLastView: function () {
		DocPlus.lastView && DocPlus.navigate(DocPlus.lastView);
	},

	closeAllViews: function () {
		for (var i in DocPlus.views) {
			DocPlus.views[i].close();
		}
	},

	setTabWidth: function (value) {
		for (var view in DocPlus.views) {
			DocPlus.views[view].header.setWidth(value);
		}
	},
	
	highlightCurrentView: function(){
		DocPlus.currentView && DocPlus.currentView.highlight();
	},
	
	relayoutTab: function () {
		var totalWidth = DocPlus.tabs.getSize().x - 10;

		this.setTabWidth(Math.min(totalWidth / this.viewCount, 200));
	},

	// 脚本动态载入。

	_jsonpObj: new Ajax(),

	jsonp: function (url, callback, onerror) {
		DocPlus._jsonpObj.run({
			dataType: 'jsonp',
			crossDomain: true,
			cache: true,
			jsonp: null,
			jsonpCallback: 'jsonp',
			url: url,
			success: callback,
			error: onerror
		});
	},
	
	// 控制器
	
	/**
	 * 表示一个逻辑控制器。控制器用于控制视图的操作。
	 * @class
	 */
	Controller: Class({
		
		/**
		 * 当前控制器的名字。
		 */
		name: null,
		
		/**
		 * 当前控制器主页对应的资源。
		 */
		homeView: null,
	
		/**
		 * 当前控制器对应的导航树。
		 * @type {TreeView}
		 */
		treeView: null,
			
		/**
		 * 初始化当前控制器。
		 * @protected virtual
		 */
		init: function (){
			
			var me = this;
		
			this.treeView = new TreeView()
					.addClass('x-treeview-plain')
					.hide()
					.appendTo(DocPlus.trees);
			
			this.menus = {};
			
			DocPlus.jsonp(this.name + '/index.js', function(data){
				me.loadData(data);
			},  function(){
				me.loadDataError(this.options.url);
			});
		
		},
		
		/**
		 * 将 data.menu 中的项添加为节点。
		 */
		initTreeNodes: function(data, parentTreeNode){
			var menu,
				treeNode,
				menuData;
			for(menu in data.menu){
				menuData = data.menu[menu];
				
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
		
		/**
		 * 将 data 中的项添加为节点。
		 */
		initTreeNode: function (data, treeNode) {
			treeNode.setAttr('href', '#!' + data.href);
			treeNode.setAttr('title', data.title);
			
			if(data.icon){
				treeNode.setIcon(data.icon);
			}
			//memberInfo.treeNode.last('span').addClass('icon-member icon-' + memberInfo.icon);
		},
		
		/**
		 * 修复数据到标准的内容。 
		 */
		fixData: function(data){
			
			var menu, subData;
			
			for(menu in data.menu){
				subData = data.menu[menu];
				subData.parent = data;
				subData.name = menu;
				subData.title = subData.title || menu;
				this.menus[subData.href] = subData;
				
				this.fixData(subData);
			}
			
		},
		
		/**
		 * 初始化菜单。 
		 */
		initMenu: function(data){
			var me = this;
			this._expadingHandler = function(){
				me.initTreeNodes(this.data, this);
			};
			this.initTreeNodes(data, this.treeView);
		},
		
		/**
		 * 获取指定数据对应的树节点。 
		 */
		getTreeNode: function(data){
			if(data){
				if(!data.treeNode){
					
					// 令父节点展开并初始化子节点。
					this.getTreeNode(data.parent).trigger('expanding');
				}
				
				return data.treeNode;
			}
			
			return null;
		},
		
		/**
		 * 获取指定视图对应的节点。 
		 */
		getTreeNodeOfView: function(view){
			
			if(!view.treeNode){
				view.treeNode = this.getTreeNode(this.menus[view.hash]);
			}
			
			return  view.treeNode;
		},
		
		/**
		 * 获取指定视图对应的数据。 
		 */
		getDataOfView: function(view){
			return this.menus[view.hash];
		},
		
		/**
		 * 初始化当前控制器对应的导航菜单。
		 * @param {Object} data 初始化的数据。
		 * @protected virtual
		 */
		loadData: function(data){
			this.fixData(data);
			this.initMenu(data);
			DocPlus.reload();
		},
		
		/**
		 * 数据载入失败的回调函数。
		 * @protected virtual
		 */
		loadDataError: function(url){
			this.treeView.setHtml('<li>无法载入索引文件: ' + url + '</li>');
		},
		
		// 视图控制
		
		/**
		 * 创建主页视图。
		 * @protected virtual
		 */
		createHomeView: function(headerHtml, headerTitle){
			return new DocPlus.HomeView(this.name, this, headerHtml, headerTitle);
		},

		/**
		 * 创建当前控制器对应的指定路径的视图。
		 * @protected virtual
		 */
		createView: function(hash, pathInfo){
			return new DocPlus.View(hash, pathInfo, this);
		},
		
		/**
		 * 初始化主页视图。
		 * @protected virtual
		 */
		initHomeView: function(view){
			view.setHtml('请从导航选择需要的项');
		},
		
		/**
		 * 初始化当前控制器对应的指定路径的视图。
		 * @protected virtual
		 */
		initView: function(view){
			view.setHtml('加载中...');
		},

		/**
		 * 激活当前视图。
		 * @protected virtual
		 */
		activeView: function(view){
			
			// 激活当前控制器对应的导航树。
			if (DocPlus.currentController !== this) {
				
				if(DocPlus.currentController) {
					DocPlus.currentController.treeView.hide();
					DocPlus.currentController.homeView.header.removeClass('selected-alt');
				}
				
				DocPlus.currentController = this;
				this.treeView.show();
				this.homeView.header.addClass('selected-alt');
			}
			
			// 如果激活的是主页，则仅仅显示主页。
			if(view === this.homeView) {
				view.header.removeClass('selected-alt');
			} else {
				this.homeView.header.addClass('selected-alt');
				this.showTreeNode(view);
			}
		},

		/**
		 * 反激活当前视图。
		 * @protected virtual
		 */
		deactiveView: function(view){
			
		},
		
		/**
		 * 向用户展示指定视图管理的导航节点。
		 */
		showTreeNode: function(view) {
			
			var treeNode = this.getTreeNodeOfView(view);
			
			if(treeNode) {
				// 激活 treeNode
				this.treeView.setSelectedNode(treeNode);
				treeNode.ensureVisible();
			}
		},

		/**
		 * 生成视图对应的菜单项。
		 * @protected virtual
		 */
		createContextMenu: function (veiw) {
			var menu = new ContextMenu();
			menu.on('show', DocPlus.showMask);
			menu.on('hide', DocPlus.hideMask);
			menu.add('关闭').on('click', DocPlus.closeCurrentView);
			menu.add('-');
			menu.add('高亮').on('click', DocPlus.highlightCurrentView).checked(view.isHighlighted());
			// var subMenu = new Menu();
			// subMenu.items.add();
			// subMenu.items.add('红色');
			// subMenu.items.add('绿色');
			// menu.items.add('标记').setSubMenu(subMenu);
			menu.add('-');
			menu.add('恢复关闭的选项卡').on('click', DocPlus.closeCurrentView);
			menu.add('-');
			menu.add('关闭其它选项卡').on('click', DocPlus.closeOtherViews);
			menu.add('全部关闭').on('click', DocPlus.closeAllViews);
			return menu;
		},
		
		/**
		 * 初始化当前控制器。 
		 */
		constructor: function (name, headerHtml, headerTitle) {

			this.name = name;
			
			this.homeView = this.createHomeView(headerHtml, headerTitle);
			
			DocPlus.controllers[name] = this;
		}

	}),
	
	// 视图
	
	/**
	 * 表示页面中一个选项卡视图。
	 * @class
	 */
	View: Class({
		
		// 视图

		/**
		 * 当前视图的哈希值。
		 * @type {String}
		 */
		hash: null,

		/**
		 * 当前视图的显示路径。
		 * @type {String}
		 */
		pathInfo: null,

		/**
		 * 当前视图对应的控制器。
		 * @type {Controller}
		 */
		controller: null,
		
		// UI

		/**
		 * 当前视图对应的选项卡节点。
		 * @type {Dom}
		 */
		header: null,

		/**
		 * 当前视图对应的内容节点。
		 * @type {Dom}
		 */
		container: null,

		/**
		 * 当前视图的菜单。
		 * @type {ContextMenu}
		 */
		contextMenu: null,

		onHeaderMouseUp: function (e) {

			switch (e.which) {

				// // 鼠标左键。
				// case 1:
				// this.active();
				// break;

				// 鼠标中键。
				case 2:
					e.stop();
					this.close();
					break;
			}

		},

		onHeaderContextMenu: function (e) {
			
			// 激活视图。
			this.active();
			
			// 创建右键菜单。
			if(!this.contextMenu){
				this.contextMenu = this.controller.createContextMenu(this);
			}
			
			// 显示菜单。
			this.contextMenu.showAt(e.pageX, e.pageY);
			e.stop();
		},

		constructor: function (hash, pathInfo, controller) {

			this.hash = hash;
			this.pathInfo = pathInfo;
			this.controller = controller;

			// 创建 header 菜单。

			this.header = Dom.create('li')
				.setHtml('<a class="x-closebutton" href="javascript://关闭选项卡" title="关闭">×</a><a href="#!' + hash + '">' + (hash || '&nbsp;') + '</a>')
				.on('mouseup', this.onHeaderMouseUp, this)
				.on('contextmenu', this.onHeaderContextMenu, this)
				.appendTo(DocPlus.tabs);
			
			this.header.find('.x-closebutton').on('click', this.close, this);
			
			this.init();
			
			DocPlus.views[this.hash] = this ;
			DocPlus.viewCount++;
			DocPlus.relayoutTab();
		},
		
		/**
		 * 初始化当前视图。 
		 */
		init: Function.empty,

		// UI
		
		getTitle: function(){
			return this.header.last().getText();
		},

		setTitle: function (value) {
			this.header.last().setText(value || '　').setAttr('title', value);
			return this;
		},
		
		getHtml: function(){
			return this.container ? this.container.getHtml() : '';
		},

		setHtml: function (value) {
			if (!this.container) {
				this.container = Dom.create('div', 'container').hide().appendTo(DocPlus.containers);
			}
			this.container.setHtml(value);
			return this;
		},

		/**
		 * 激活当前视图。
		 */
		active: function () {
			
			// 首先让当前视图取消激活。
			var currentView = DocPlus.currentView;

			if (currentView) {

				// 如果视图相同，则不操作。
				if (currentView === this)
					return;

				currentView.deactive();

			}

			DocPlus.currentView = this;
			
			DocPlus.viewHistory.remove(this);
			DocPlus.viewHistory.push(this);

			// 显示当前选项卡。
			this.header.addClass('selected');
			this.container.show();
			this.controller.activeView(this);
			
			return this;
		},

		/**
		 * 反激活当前视图。
		 */
		deactive: function () {
			this.controller.deactiveView(this);
			this.header.removeClass('selected');
			this.container.hide();
			DocPlus.currentView = null;
			return this;
		},

		/**
		 * 关闭当前视图。
		 */
		close: function () {
			this.header.remove();
			this.container.remove();
			
			DocPlus.viewHistory.remove(this);

			if (DocPlus.currentView === this) {
				DocPlus.currentView = null;
				var topView = DocPlus.viewHistory.item(-1) || this.controller.homeView;
				topView.active();
				DocPlus.redirect(topView.hash);
			}

			// 保存视图状态。

			DocPlus.lastView = this.hash;
			delete DocPlus.views[this.hash];
			DocPlus.viewCount--;
			DocPlus.relayoutTab();
			
			return this;
		},
		
		highlight: function(){
			this.header.addClass('header-highlight');
		},
		
		isHighlighted: function(){
			return this.header.hasClass('header-highlight');
		}

	})

};



/**
 * 表示控制器主页的特殊视图。
 */
DocPlus.HomeView = DocPlus.View.extend({
	
	pathInfo: '',
	
	constructor: function (hash, controller, headerHtml, headerTitle) {

		this.hash = hash;
		this.controller = controller;

		// 创建 header 菜单。

		this.header = Dom.create('li')
			.setHtml('<a href="#!' + hash + '" title="' + (headerTitle || headerHtml) + '">' + headerHtml + '</a>')
			.appendTo(DocPlus.navs);
	},

	close: Function.empty
	
});


