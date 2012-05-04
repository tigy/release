/**
 * @author
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

		document.find('#tabs-more .x-icon-list').getParent().on('click', function () {
			var menu = DocPlus.listMenu;
			if (!menu) {
				DocPlus.listMenu = menu = new ContextMenu().appendTo();
				menu.on('show', DocPlus.showMask);
				menu.on('hide', DocPlus.hideMask);
				menu.hide();
			}

			if (Dom.isHidden(menu.dom)) {
				DocPlus.initViewListMenu(menu);
				menu.showBy(this, 'br');
			} else {
				menu.hide();
			}
		});

		// 刷新页面显示。

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
		var view = DocPlus.views[hash] || DocPlus.createView(hash);

		// 如果无法创建，则无法打开页面，忽视操作。
		if (view) {

			// 激活当前视图。
			view.active();

		}

		// 修复 IE 6/7 下跳转肯能出现的滚动。
		document.body.scrollTop = 0;

	},

	// 视图

	/**
	 * 当前打开的全部视图。
	 */
	views: {},

	/**
       * 当前打开的视图数目。
       */
	viewCount: 0,

	/**
       * 创建指定名的视图。
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
		if(controller.dataJsPath) {
			DocPlus.getJSONP(controller.dataJsPath, DocPlus.reload);
			delete controller.dataJsPath;
		}

		// 用控制器创建真正的视图对象。
		// 保存新打开的视图。
		return controller.createView(hash, hash.substr(spa + 1));
	},

	// 控制器。
	
	/**
	 * 所有可用的控制器。
	 */
	controllers: {},

	/**
	 * 注册一个类型的视图。
	 * @param {String} prefix 前缀字符串，只有hash匹配此前缀时，才使用此视图类型来显示。
	 * @param {String} [dataJsPath] 某个视图类型对应的初始化数据。
	 * @param {Function/String} [createViewFn] 用来创建某个视图的函数。该函数参数是hash地址，返回值是一个 View 。
	 */
	registerGlobalView: function (prefix, text, title, dataJsPath, createViewFn) {
		DocPlus.globalViews[prefix] = new DocPlus.HomeView(prefix, text, title, dataJsPath, createViewFn);
	},

	// 导航

	/**
       * 所有树节点的 hash -> TreeNode 的映射。
       */
	treeNodes: {},

	currentTreeView: null,

	toggleTreeView: function (treeView) {
		if (DocPlus.currentTreeView) {
			DocPlus.currentTreeView.tab.removeClass('selected');
			DocPlus.currentTreeView.hide();
		}
		DocPlus.currentTreeView = treeView.show();
		treeView.tab.addClass('selected');
	},

	compileTreeNode: function (data, parent, basePath) {

		if (data) {
			for (var n in data) {
				var an = n.split('::'),
					hash = basePath + an[1],
					node = DocPlus.treeNodes[hash] = parent.nodes.add(an[0]).setHref('#!' + hash);
				DocPlus.compileTreeNode(data[n], node, basePath);
			}
		}

	},

	createTreeView: function (hash, data) {
		var treeView = DocPlus.treeNodes[hash] = new TreeView().addClass('x-treeview-plain').appendTo('doctree');
		DocPlus.compileTreeNode(data, treeView, hash + '/');
		treeView.tab = DocPlus.globalViews[hash].tab;
		return treeView;
	},

	initTreeView: function (hash, data) {
		Dom.ready(function () {
			var treeView = DocPlus.createTreeView(hash, data);
			treeView.collapseTo();
			DocPlus.toggleTreeView(treeView);

			// 菜单如果打开较慢，则更新当前的节点。


			for (var view in DocPlus.views) {
				DocPlus.views[view].update();
			}
		});
	},

	// 视图界面

	initViewListMenu: function (menu) {
		menu.items.clear();
		menu.items.add('关闭全部').on('click', DocPlus.closeAllViews);
		menu.items.add('恢复关闭的选项卡').on('click', DocPlus.restoreLastView);
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
		var totalWidth = Dom.get('tabs').getSize().x - 10;

		this.setTabWidth(Math.min(totalWidth / this.viewCount, 200));
	},

	// 脚本动态载入。

	_waitingList: [],

	jsonp: function(data){
		var fn = _waitingList.pop();
		fn.call
	},

	jsonpNext: function (url) {
		var d = DocPlus._waitingList.pop();
		if (d) {
			DocPlus.getJSONP(d[0], d[1]);
		}

		// 如果第一次打开，则先栽入其数据地址。
		var script = document.createElement('script');
		script.src = url;
		script.type = 'text/javascript';

		var h = document.getElementsByTagName('HEAD')[0];
		h.insertBefore(script, h.lastChild);

		setTimeout(DocPlus.jsonpTimeout, 3000);
	},

	jsonpTimeout: function () {

		// 丢弃当前请求。
		DocPlus._waitingList.pop();

		// 执行下一个请求。
		DocPlus.jsonpNext();
	},

	getJSONP: function (url, callback) {

		DocPlus._waitingList.push([url, callback]);

		// 如果有正在载入的脚本，则等待当前脚本载入成功后，再继续执行。
		if (DocPlus._waitingList.length > 1) {
			return;
		}

		DocPlus.jsonpNext();

	}

};

/**
 * 表示一个逻辑控制器。控制器用于控制视图的操作。
 * @class
 */
DocPlus.Controller = Class({

	/**
     * 控制器所需数据源。
     */
	dataJsPath: null,

	/**
     * 创建指定路径的视图。
     */
	createView: function(hash, pathInfo){

		var view;




		DocPlus.tabs.append(view.tab);

		// 保存视图状态。

		DocPlus.views[hash] = view;
		DocPlus.viewCount++;
		DocPlus.relayoutTab();

		return view;
	},

	closeView: function (view) {

		var p = view.previousView, n = view.nextView;

		view.tab.remove();
		view.content.remove();

		if (n)
			n.previousTabPage = p;

		if (p) {
			p.nextTabPage = n;
		}

		if (DocPlus.currentView === view) {
			DocPlus.currentView = null;
			p && p.active();
		}

		// 保存视图状态。

		DocPlus.lastView = view.hash;
		delete DocPlus.views[view.hash];
		DocPlus.viewCount--;
		DocPlus.relayoutTab();
	},

	/**
     * 激活当前视图。
     */
	activeView: function (view) {


		// 首先让当前视图取消激活。
		var currentView = DocPlus.currentView;

		if (currentView) {

			// 如果视图相同，则不操作。
			if (currentView === view)
				return;

			currentView.deactive();

			currentView.nextView = view;
			view.previousView = currentView;

		}

		DocPlus.currentView = view;


		// 显示当前选项卡。
		view.tab.addClass('selected');
		view.content.show();

		return;
		// 检查菜单。
		var node = DocPlus.treeNodes[this.hash];

		if (node) {

			// 更新标题
			this.setTitle(node.getText());

			var treeView = node.getTreeView();

			// 激活 treeView
			DocPlus.toggleTreeView(treeView);

			// 激活 treeNode
			treeView.setSelectedNode(node);

			// 展开节点。
			node.ensureVisible(0);
		}

	},

	deactiveView: function (view) {
		view.tab.removeClass('selected');
		view.content.hide();

		DocPlus.currentView = null;

	},

	/**
     * 刷新视图对应的菜单项。
     */
	updateView: function(view){
		
	},

	showTabContextMenu: function (veiw, e) {
		var menu = DocPlus.tabContextMenu;
		if (!menu) {
			DocPlus.tabContextMenu = menu = new ContextMenu();
			menu.on('show', DocPlus.showMask);
			menu.on('hide', DocPlus.hideMask);
			menu.items.add('关闭').on('click', DocPlus.closeCurrentView);
			// menu.items.add('-');
			// var subMenu = new Menu();
			// subMenu.items.add('默认');
			// subMenu.items.add('红色');
			// subMenu.items.add('绿色');
			// menu.items.add('标记').setSubMenu(subMenu);
			menu.items.add('-');
			menu.items.add('恢复关闭的选项卡').on('click', DocPlus.closeCurrentView);
			menu.items.add('-');
			menu.items.add('关闭其它选项卡').on('click', DocPlus.closeOtherViews);
			menu.items.add('全部关闭').on('click', DocPlus.closeAllViews);
		}

		menu.showAt(e.pageX, e.pageY);
		e.stop();
	},

	constructor: function (dataJsPath) {

		this.dataJsPath = dataJsPath;



	}

});


DocPlus.controllers.api = new DocPlus.Controller();


initControls   = function () {
	DocPlus.registerGlobalView('api', 'API', 'API', 'assets/data/api.js', function (hash) {
		var view = new DocPlus.View(hash);
		view.setContent("<div>" + hash + "</div>");
		return view;
	});

	DocPlus.registerGlobalView('examples', '示例', '全部示例', 'assets/data/example.js', '../');
};     


/**
	 * 生成并返回一个内容主题是 IFrame 的视图。
	 */
createIFrameView= function (hash, url) {
	var view = new DocPlus.View(hash);
	view.setContent(Dom.create('iframe', 'content').setAttr('frameborder', '0').setAttr('src', url));
	return view;
}


/**
 * 表示页面中一个选项卡视图。
 * @class
 */
DocPlus.View = Class({

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
	
	/**
	 * 浏览历史上当前视图对应的下一个视图。
	 */
	nextView: null,

	/**
	 * 浏览历史上当前视图对应的上一个视图。
	 */
	previousView: null,

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

	constructor: function (hash, controller) {

		this.hash = hash;
		this.controller = controller;

		// 创建 tab 菜单。

		this.tab = Dom.create('li')
			.on('mouseup', this.onTabMouseUp, this)
			.on('contextmenu', this.onTabContextMenu, this);

		this.title = Dom.create('a')
			.setAttr('href', '#!' + hash)
			.setText(hash)
			.appendTo(this.tab);

		Dom.create('a', 'x-closebutton')
			.setAttr('href', 'javascript://关闭选项卡')
			.setAttr('title', '关闭')
			.setText('×')
			.on('click', this.close, this)
			.appendTo(this.tab);
	},

	// UI

	setTitle: function (value) {
		this.title.setAttr('title', value).setText(value);
	},

	setContent: function (contentDom) {
		this.content = DocPlus.contents.append(contentDom);
	},

	/**
     * 激活当前视图。
     */
	active: function () {
		this.controller.activeView(this);
	},

	deactive: function () {
		this.controller.deactiveView(this);
	},

	/**
     * 激活当前视图。
     */
	update: function () {
		this.controller.updateView(this);
	},

	close: function () {
		this.controller.closeView(this);
	}

});

DocPlus.HomeView = Class({

	constructor: function (prefix, text, title, dataJsPath, createViewFn) {
		this.hash = prefix;
		this.dataJsPath = dataJsPath,
			this.tab = Dom.create('li').setHtml('<a href="#!' + prefix + '" title="' + title + '">' + text + '</a>').appendTo('navbar'),
	        this.createView = typeof createViewFn === 'string' ? function (hash) {
	        	return DocPlus.createIFrameView(hash, createViewFn + hash + '.html');
	        } : createViewFn;
		this.content = Dom.create('div', 'content').hide().appendTo('content');

	},

	/**
     * 同步当前视图所关联的节点菜单。
     */
	update: function () {

		// 检查菜单。
		var node = DocPlus.treeNodes[this.hash];

		if (node) {

			// 激活 treeView
			DocPlus.toggleTreeView(node);
		}

	},

	/**
     * 激活当前视图。
     */
	active: function () {

		var currentView = DocPlus.currentView;

		if (currentView) {

			// 如果视图相同，则不操作。
			if (currentView === this)
				return;

			currentView.deactive();

			currentView.nextView = this;
			this.previousView = currentView;


		}

		DocPlus.currentView = this;

		this.content.show();

		this.controller.active(this);
	},

	deactive: function () {
		this.content.hide();
	}

});

Dom.ready(DocPlus.init);



