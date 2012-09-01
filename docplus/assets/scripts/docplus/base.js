/**
 * @author xuld
 */


/**
 * 负责整个文档逻辑的管理对象。
 */
var DocPlus = {

	/**
	 * 顶部的导航菜单容器节点。
	 */
	tabs: null,

	/**
	 * 存储内容的容器节点。
	 */
	contents: null,

	/**
	 * 存储导航树的容器节点。
	 */
	trees: null,

	/**
	 * 初始化系统。
	 */
	init: function () {

		// 初始化节点。

		DocPlus.tabs = Dom.get("tabs");
		DocPlus.trees = Dom.get("doctree");
		DocPlus.contents = Dom.get("content");

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
			DocPlus.options.views.forEach(DocPlus.navigate);

		// 刷新当前激活的视图。
		DocPlus.reload();
	},

	// 配置

	options: {
		sidebarWidth: 200,
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

		DocPlus.contents.setHeight(height);
		DocPlus.updateSplitter(DocPlus.options.sidebarWidth);
		DocPlus.relayoutTab();
	},

	/**
	 * 更新 splitter 位置。
	 */
	updateSplitter: function (sidebarWidth) {
		Dom.get('sidebar').setWidth(sidebarWidth - 10);
		Dom.get('splitter').setOffset({ x: sidebarWidth - 3 });
		DocPlus.contents.setWidth(document.getSize().x - sidebarWidth - 12);
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
		DocPlus.navigate(DocPlus.getCurrentHash());
	},

	/**
	 * 分析当前网址，获取当前正在显示的视图的哈希值。
	 */
	getCurrentHash: function () {
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
			DocPlus.currentView.update();
		}
	},

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
			return;
		}

		// 如果控制器未载入，则先载入。
		if(controller.indexPath) {
			DocPlus.jsonp(controller.indexPath, controller.init.bind(controller), controller.initError);
			controller.indexPath = null;
		}
		
		var pathInfo = spa === -1 ? '' : hash.substr(spa + 1);
		
		if(!pathInfo){
			if(!controller.homeViewInited) {
				controller.homeViewInited = true;
				controller.initHomeView();
			}
			return controller.homeView;
		}
		
		// 用控制器创建真正的视图对象。
		// 保存新打开的视图。
		return controller.createView(hash, pathInfo);
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
			DocPlus.views[view].tab.setWidth(value);
		}
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
		 * 控制器所需数据源。
		 */
		indexPath: null,
		
		/**
		 * 当前控制器主页对应的资源。
		 */
		homeView: null,
		
		/**
		 * 初始化当前控制器对应的导航菜单。
		 */
		init: function (data) {
			//trace(data);
		},
		
		/**
		 * 向用户展示指定视图管理的导航节点。
		 */
		showTreeNode: function(view){
			
		},
		
		// 视图控制
		
		/**
		 * 初始化主页视图。
		 */
		initHomeView: function(){
			this.homeView.setHtml('<div>请从左边选择 API 信息</div>');
		},
		
		/**
		 * 创建主页视图。
		 */
		createHomeView: function(name, title, description){
			return new DocPlus.HomeView(name, this, title, description);
		},

		/**
		 * 创建和初始化当前控制器对应的指定路径的视图。
		 */
		createView: function(hash, pathInfo){
			
			var view = new DocPlus.View(hash, pathInfo, this);
			
			view.setHtml('加载中...');
			
			return view;
		},

		/**
		 * 激活当前视图。
		 */
		activeView: function (view) {
			this.updateView(view);
		},

		deactiveView: Function.empty,
		
		/**
		 * 刷新视图对应的菜单项。
		 */
		updateView: function(view){
			
			// 如果当前树不是激活的，则激活树。
			if (DocPlus.currentTreeView !== this.treeView) {
				
				if(DocPlus.currentTreeView) {
					this.homeView.tab.removeClass('selected');
					DocPlus.currentTreeView.hide();
				}
				
				DocPlus.currentTreeView = this.treeView.show();
				this.homeView.tab.addClass('selected');
			}
			
			this.showTreeNode(view);
		},

		showTabContextMenu: function (veiw, e) {
			var menu = DocPlus.tabContextMenu;
			if (!menu) {
				DocPlus.tabContextMenu = menu = new ContextMenu();
				menu.on('show', DocPlus.showMask);
				menu.on('hide', DocPlus.hideMask);
				menu.add('关闭').on('click', DocPlus.closeCurrentView);
				// menu.items.add('-');
				// var subMenu = new Menu();
				// subMenu.items.add('默认');
				// subMenu.items.add('红色');
				// subMenu.items.add('绿色');
				// menu.items.add('标记').setSubMenu(subMenu);
				menu.add('-');
				menu.add('恢复关闭的选项卡').on('click', DocPlus.closeCurrentView);
				menu.add('-');
				menu.add('关闭其它选项卡').on('click', DocPlus.closeOtherViews);
				menu.add('全部关闭').on('click', DocPlus.closeAllViews);
			}

			menu.showAt(e.pageX, e.pageY);
			e.stop();
		},

		constructor: function (indexPath, dataPath, name, title, description) {

			this.name = name;
			this.indexPath = indexPath;
			this.dataPath = dataPath;
			
			this.homeView = this.createHomeView(name, title, description).deactive();

			this.treeView = new TreeView()
					.addClass('x-treeview-plain')
					.appendTo(DocPlus.trees)
					.hide();
				
			this.treeView.collapseTo();
			
			DocPlus.controllers[name] = this;
		}

	}),
	
	// 视图
	
	/**
	 * 表示页面中一个选项卡视图。
	 * @class
	 */
	View: Class({

		/**
		 * 当前视图的哈希值。
		 */
		hash: null,

		/**
		 * 当前视图对应的选项卡节点。
		 */
		tab: null,

		/**
		 * 当前标题节点。
		 */
		title: null,

		/**
		 * 当前视图对应的内容节点。
		 */
		content: null,

		/**
		 * 当前视图对应的导航节点。
		 */
		treeNode: null,

		/**
		 * 当前视图对应的控制器。
		 */
		controller: null,

		onTabMouseUp: function (e) {

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

		onTabContextMenu: function (e) {
			this.active();
			this.controller.showTabContextMenu(this, e);
		},

		constructor: function (hash, pathInfo, controller) {

			this.hash = hash;
			this.pathInfo = pathInfo;
			this.controller = controller;

			// 创建 tab 菜单。

			this.tab = Dom.create('li')
				.on('mouseup', this.onTabMouseUp, this)
				.on('contextmenu', this.onTabContextMenu, this);

			Dom.create('a', 'x-closebutton')
				.setAttr('href', 'javascript://关闭选项卡')
				.setAttr('title', '关闭')
				.setText('×')
				.on('click', this.close, this)
				.appendTo(this.tab);

			this.title = Dom.create('a')
				.setAttr('href', '#!' + hash)
				.setText(hash)
				.appendTo(this.tab);
			
			// 添加到 DOM 树中。
			DocPlus.tabs.append(this.tab);
			
			this.init();
			
			DocPlus.views[this.hash] = this ;
			DocPlus.viewCount++;
			DocPlus.relayoutTab();
		},
		
		init: Function.empty,

		// UI
		
		getTitle: function(){
			return this.title.getText();
		},

		setTitle: function (value) {
			this.title.setText(value).setAttr('title', value);
			return this;
		},
		
		getHtml: function(){
			return this.content ? this.content.getHtml() : '';
		},

		setHtml: function (content) {
			if (!this.content) {
				this.content = Dom.create('div', 'content').appendTo(DocPlus.contents);
			}
			this.content.setHtml(content);
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
			this.tab.addClass('selected');
			this.content.show();
			this.controller.activeView(this);
			
			return this;
		},

		/**
		 * 反激活当前视图。
		 */
		deactive: function () {
			this.controller.deactiveView(this);
			this.tab.removeClass('selected');
			this.content.hide();
			DocPlus.currentView = null;
			return this;
		},

		/**
		 * 更新当前视图。
		 */
		update: function () {
			this.controller.updateView(this);
			return this;
		},

		/**
		 * 关闭当前视图。
		 */
		close: function () {
			this.tab.remove();
			this.content.remove();
			
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
		}

	})

	
};


/**
 * 表示控制器主页的特殊视图。
 */
DocPlus.HomeView = DocPlus.View.extend({
	
	pathInfo: '',
	
	constructor: function (hash, controller, value, title) {

		this.hash = hash;
		this.controller = controller;

		// 创建 tab 菜单。

		this.tab = Dom.create('li');

		this.title = Dom.create('a')
			.setAttr('href', '#!' + hash)
			.setAttr('title', title || value)
			.setHtml(value)
			.appendTo(this.tab);
		
		this.tab.appendTo('navbar');
		this.setHtml("<div>请从左边选择</div>");
	},

	close: Function.empty
	
});
