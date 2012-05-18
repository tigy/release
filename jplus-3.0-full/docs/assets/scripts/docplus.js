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
			DocPlus.getJSONP(controller.dataJsPath, controller.init.bind(controller));
			delete controller.dataJsPath;
		}

		// 用控制器创建真正的视图对象。
		// 保存新打开的视图。
		return controller.createView(hash, spa === -1 ? '' : hash.substr(spa + 1));
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
		var totalWidth = DocPlus.tabs.getSize().x - 10;

		this.setTabWidth(Math.min(totalWidth / this.viewCount, 200));
	},

	// 脚本动态载入。

	_jsonpObj: new Request.JSONP({
		callback: 'jsonp'
	}),

	getJSONP: function (url, callback) {
		trace('request->', url);
		DocPlus._jsonpObj.run({
			url: url,
			success: callback
		});
	}

};

/**
 * 表示一个逻辑控制器。控制器用于控制视图的操作。
 * @class
 */
DocPlus.Controller = Class({
	
	dataLoaded: false,

	/**
     * 控制器所需数据源。
     */
	dataJsPath: null,
	
	/**
	 * 当前控制器主页对应的资源。
	 */
	homeView: null,
	
	/**
	 * 初始化当前控制器对应的导航菜单。
	 */
	init: function (data) {
		trace(data);
	},
	
	/**
	 * 初始化当前控制器对应的视图。
	 */
	initView: function(view, pathInfo){
		view.setContent('<div>aaaaa</div>');
	},
	
	/**
	 * 向用户展示指定视图管理的导航节点。
	 */
	showTreeNode: function(view){
		
	},

	/**
     * 创建指定路径的视图。
     */
	createView: function(hash, pathInfo){
		
		if(!pathInfo){
			return this.homeView;
		}

		var view = new DocPlus.View(hash, pathInfo, this);
		
		this.initView(view, pathInfo);

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
			if (p) {
				p.active();
				location.hash = p.hash;
			}
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

		this.updateView(view);

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

	constructor: function (dataJsPath, dataPath, name, title, description) {

		this.name = name;
		this.dataJsPath = dataJsPath;
		this.dataPath = dataPath;

		this.homeView = new DocPlus.HomeView(name, this, title, description);
		this.homeView.tab.appendTo('navbar');
		this.homeView.setContent('<div>ddd55d</div>').deactive();

		this.treeView = new TreeView()
				.addClass('x-treeview-plain')
				.appendTo(DocPlus.trees)
				.hide();
			
		this.treeView.collapseTo();
		
		DocPlus.controllers[name] = this;
	}

});


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
	},

	// UI

	setTitle: function (value) {
		this.title.setAttr('title', value).setText(value);
		return this;
	},

	setContent: function (content) {
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
		this.controller.activeView(this);
		return this;
	},

	deactive: function () {
		this.controller.deactiveView(this);
		return this;
	},

	/**
     * 激活当前视图。
     */
	update: function () {
		this.controller.updateView(this);
		return this;
	},

	close: function () {
		this.controller.closeView(this);
		return this;
	}

});


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
	},

	close: Function.empty
	
});


DocPlus.HomeController = DocPlus.Controller.extend({
	
	
});

DocPlus.APIController = DocPlus.Controller.extend({
	
	/**
	 * 初始化当前控制器对应的导航菜单。
	 */
	init: function (data) {
		this.dom = data.dom;
		this.members = data.members;
		
		this.members[''] = {
			treeNode: this.treeView
		};
		
		for(var item in this.dom){
			this.addChild(this.treeView, item, this.dom[item], item);
		}
		
		DocPlus.update();
	},
	
	/**
	 * 初始化当前控制器对应的视图。
	 */
	initView: function(view, pathInfo){
		view.setContent('加载中...'); 
		DocPlus.getJSONP(this.dataPath + pathInfo + '.js', function(data){
			DocPlus.APIRender.render(view, data);
		});
	},
	
	initChildren: function (node, domInfo, memberInfo, pathInfo, useName) {
		for(var item in domInfo){
			if(item === 'prototype' && memberInfo.type === 'C'){
				this.initChildren(node, domInfo.prototype, memberInfo, pathInfo, true);	
			} else {
				var t = pathInfo + '.' + item;
				this.addChild(node, t, domInfo[item], useName ? item : t);
			}
		}
		
		node.collapse(0);
	},
	
	addChild: function(parent, pathInfo, domInfo, name){
		
		// 创建获取信息存储对象。
		var memberInfo = this.members[pathInfo] || (this.members[pathInfo] = {});
		
		// 生成对应的树节点。
		var treeNode = memberInfo.treeNode = new TreeNode();
		this.initTreeNode(memberInfo, pathInfo, name);
		parent.nodes.add(treeNode);
		
		for(var item in domInfo){
			treeNode.setNodeType('plus');
			treeNode.once('expanding', function(){
				this.initChildren(treeNode, domInfo, memberInfo, pathInfo);
			}, this);
			break;
		}
	},
	
	initTreeNode: function (memberInfo, pathInfo, name) {
		memberInfo.treeNode.setText(name).setHref('#!' + this.name + '/' + pathInfo);
	},
	
	getTreeNode: function(pathInfo, hash, createIfNotExist){
		var memberInfo = this.members[pathInfo];
		if(!memberInfo){
			if(createIfNotExist)
				this.members[pathInfo] = memberInfo = {};
			else
				return ;
		}
		
		if(!memberInfo.treeNode){
			var spa = pathInfo.lastIndexOf('.'),
				p;
			if(spa >= 0){
				p = this.getTreeNode(pathInfo.substring(0, spa), hash, true);
			} else {
				p = this.treeView;	
			}
			
			p.trigger('expanding');
		}
		
		return memberInfo.treeNode;
	},
	
	/**
	 * 向用户展示指定视图管理的导航节点。
	 */
	showTreeNode: function(view){
		
		// 菜单未载入，忽略操作。
		if(!this.members)
			return;
		 
		// 获取或创建树节点。
		var treeNode = this.getTreeNode(view.pathInfo, view.hash);
		
		if(treeNode && treeNode !== this.treeView) {
			
			// 激活 treeNode
			this.treeView.setSelectedNode(treeNode);
			
			// 展开节点。
			treeNode.ensureVisible(0);
			
		}
	}
	
});

DocPlus.APIRender = {
	
	render: function (view, data) {
		trace('set  view', view, data);

		var tpl = DocPlus.APIRender.tpls[data.type] || '';

		tpl = Tpl.parse(tpl, data);

		view.setTitle(DocPlus.APIRender.getReadableName(data.name, data.type));
		view.setContent(tpl);
	},

	readableNames: {
		'method': '方法',
		'class': '类',
		'field': '字段',
		'property': '属性'
	},

	getReadableName: function (name, type) {
		return name + ' ' + DocPlus.APIRender.readableNames[type];
	},

	getTypeLink: function(type){
		return type;
	},

	getSyntax: function (data) {

		var fn = [
			data.memberAccess ? data.memberAccess + ' ' : '',
			data.memberAttribute ? data.memberAttribute + ' ' : ''
		];

		if (data.type == 'method') {

			var type = data.returns && data.returns.type;
			if (!type || type == "Undefined" || type == "undefined") {
				type = "void";
			}
			fn.push(
			type,
			' ',
			data.name,
			'(');

			if (data.params) {
				data.params.forEach(function (value, index) {
					if (index) {
						fn.push(', ');
					}
					fn.push('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
					fn.push(value.type);
					fn.push(' ');
					fn.push(value.name);

					if (value.defaultValue) {
						if (value.defaultValue.length == 0) {
							fn.push(' = ?');
						} else {
							fn.push(' = ');
							fn.push(value.defaultValue);
						}
					}
				});
				fn.push('<br>');
			}


			fn.push(')');

		} else if (data.type == 'class') {

			fn.push(data.type);
			fn.push(' ');
			fn.push(data.name);



		}

		return fn.join('');
	},

	tpls: {

		_tpl: '\
<div class="doc">\
	<div class="doc-func">\
		<a type="button" id="a" href="#" class="x-button x-button-plain x-menubutton"> 显示 <span class="x-button-menu x-button-menu-down"> </span> </a>\
	</div>\
	<h1>Class 类<small>System.Dom.Element</small></h1>\
	<hr>\
	<div class="doc-attrs">\
		<dl class="x-treeview-alt">\
			<dt>\
				继承关系:\
			</dt>\
			<dd class="x-clear">\
				<a href="#">JPlus.Object</a>\
			</dd>\
			<dd class="x-treenode-last x-clear">\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				<a href="#">JPlus.Control</a>\
			</dd>\
			<dd>\
				<span class="x-treenode-space"> </span>\
				<span class="x-treenode-space x-treenode-normal x-clear"> </span>\
				<a href="#">JPlus.ScrollableControl</a>\
			</dd>\
			<dd class="x-treenode-last">\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				<a href="#">JPlus.ContentControl</a>\
			</dd>\
			<dt>\
				定义:\
			</dt>\
			<dd>\
				<a href="#">aaa.js</a>\
			</dd>\
			<dd>\
				<a href="#">aaa.js</a>\
			</dd>\
			<dd>\
				<a href="#">aaa.js</a>\
			</dd>\
			<dt>\
				版本:\
			</dt>\
			<dd>\
				1.0\
			</dd>\
		</dl>\
	</div>\
	<p>\
		summary 								<pre><ol><li>代码 pre</li><li>pre</li><li>ol</li></ol></pre>\
	</p>\
	<h3>属性</h3>\
	<table class="x-table doc-members">\
		<thead>\
			<tr>\
				<th></th>\
				<th>名称 </th>\
				<th>说明</th>\
				<th>继承</th>\
			</tr>\
		</thead>\
		<tbody>\
			<tr>\
				<td> 1 </td>\
				<td> Td 1 </td>\
				<td> Td 2 </td>\
				<td> Td 3 </td>\
			</tr>\
			<tr>\
				<td> 2 </td>\
				<td> Td 1 </td>\
				<td> Td 2 </td>\
				<td> Td 3 </td>\
			</tr>\
		</tbody>\
	</table>\
	<h3>备注</h3>\
	<p>\
		使用由 Data 属性返回的 System.Collections  对象来存储和检索与异常相关的补充信息。\
\
		信息的形式为任意数目的用户定义的键/值对。键/值对中的键通常是一个标识字符串，而键/值对中的值则可以是任何对象类型。\
	</p>\
	<h5>诶住</h5>\
	<p>\
		aaa\
	</p>\
	<div class="x-bubble">\
		<h4>注意:</h4>\
		<div>\
			aaaaaaaa\
		</div>\
	</div>\
	<div class="x-panel">\
		<div class="x-panel-header">\
			<h4>注意:</h4>\
		</div>\
		<div class="x-panel-body">\
			AAAA\
		</div>\
	</div>\
	<h3>社区</h3>\
	<textarea class="x-textbox"></textarea>\
	<br>\
	<input type="submit" class="x-button" value="提交">\
	<br>\
	<br>\
	<br>\
	<br>\
	<br>\
	<br>\
</div>',

		'class': '\
<div class="doc">\
	<div class="doc-func">\
		<a type="button" id="a" href="#" class="x-button x-button-plain x-menubutton">显示 <span class="x-button-menu x-button-menu-down"> </span> </a>\
	</div>\
	<h1>\
		{if deprecated}\
	[已过时]\
	{end}\
	{DocPlus.APIRender.getReadableName(name)}<small>{className}</small></h1>\
	<hr>\
	<div class="doc-attrs">\
		<dl class="x-treeview-alt">\
			<dt>\
				相关成员:\
			</dt>\
			<dd class="x-clear">\
				<a href="#">{DocPlus.APIRender.getTypeLink(className)}</a>\
			</dd>\
			<dt>\
				定义:\
			</dt>\
			<dd>\
				<a href="{sourceFile}{sourceLine}">{sourceFile}</a>\
			</dd>\
			{if since}\
			<dt>\
				版本:\
			</dt>\
			<dd>\
				{since}\
			</dd>\
			{end}\
		</dl>\
	</div>\
	{summary}\
	<h3>语法</h3>\
	<div class="doc-content">\
		<code class="doc-syntax">{DocPlus.APIRender.getSyntax($data)}</code>\
	</div>\
	{for memberType in ["configs", "properties", "methods", "events"]}\
	{if $data[memberType]}\
	<h3>所有{memberType == "configs" ? "配置" : memberType == "properties" ? "属性" : memberType == "methods" ? "方法" : "事件"}</h3>\
	<div class="doc-content">\
		<table class="x-table doc-members">\
			<thead>\
				<tr>\
					<th></th>\
					<th>名称</th>\
					<th>说明</th>\
					<th>继承</th>\
				</tr>\
			</thead>\
			<tbody>\
				{for member in $data[memberType]}\
				<tr>\
					<td> {member.type} </td>\
					<td> {DocPlus.APIRender.getTypeLink(member.name)} </td>\
					<td> {member.summary} </td>\
					<td> {DocPlus.APIRender.getTypeLink(member.defines)} </td>\
				</tr>\
				{end}\
			</tbody>\
		</table>\
	</div>\
	{end}\
	{end}\
	{if remark}\
	<h3>备注</h3>\
	<div class="doc-content">\
		{remark}\
	</div>\
	{end}\
	{if example}\
	<h3>示例</h3>\
	<div class="doc-content">\
		{example}\
	</div>\
	{end}\
	{if exceptions}\
	<h3>异常</h3>\
	<div class="doc-content">\
		<dl class="doc-params">\
			{for exception in exceptions}\
				<dt>\
					{DocPlus.APIRender.getTypeLink(exception.type)}\
				</dt>\
				<dd>\
					{exception.summary}\
				</dd>\
			{end}\
		</dl>\
	</div>\
	{end}\
	{if sees}\
	<h3>参考</h3>\
	<div class="doc-content">\
		<ul>\
			{for see in sees}\
				<li>\
					{DocPlus.APIRender.getTypeLink(see)}\
				</li>\
			{end}\
		</ul>\
	</div>\
	{end}\
	<h3>社区</h3>\
	<div class="doc-content">\
		<textarea class="x-textbox"></textarea>\
		<br>\
		<br>\
		<input type="submit" class="x-button" value="提交">\
	</div>\
	<br>\
	<br>\
	<br>\
	<br>\
	<br>\
	<br>\
</div>',

		'method': '\
<div class="doc">\
	<div class="doc-func">\
		<a type="button" id="a" href="#" class="x-button x-button-plain x-menubutton">显示 <span class="x-button-menu x-button-menu-down"> </span> </a>\
	</div>\
	<h1>\
		{if deprecated}\
	[已过时]\
	{end}\
	{DocPlus.APIRender.getReadableName(name, type)}<small>{className}</small></h1>\
	<hr>\
	<div class="doc-attrs">\
		<dl class="x-treeview-alt">\
			<dt>\
				相关成员:\
			</dt>\
			<dd class="x-clear">\
				<a href="#">{DocPlus.APIRender.getTypeLink(className)}</a>\
			</dd>\
			<dt>\
				定义:\
			</dt>\
			<dd>\
				<a href="{sourceFile}{sourceLine}">{sourceFile}</a>\
			</dd>\
			{if since}\
			<dt>\
				版本:\
			</dt>\
			<dd>\
				{since}\
			</dd>\
			{end}\
		</dl>\
	</div>\
	{summary}\
	<h3>语法</h3>\
	<div class="doc-content">\
		<code class="doc-syntax">{DocPlus.APIRender.getSyntax($data)}</code>\
	</div>\
	{if params}\
	<h4>参数</h4>\
	<div class="doc-content">\
		<dl class="doc-params">\
			{for param in params}\
				<dt>\
					<strong>{param.name}</strong>\
					{if param.defaultValue==""}(可选的){else if param.defaultValue}(默认为{param.defaultValue}){end}\
					&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{DocPlus.APIRender.getTypeLink(param.type)}\
				</dt>\
				<dd>\
					{param.summary}\
				</dd>\
			{end}\
		</dl>\
	</div>\
	{end}\
	{if returns}\
	<h4>返回值</h4>\
	<div class="doc-content">\
		<dl class="doc-params">\
			<dt>\
				{DocPlus.APIRender.getTypeLink(returns.type)}\
			</dt>\
			<dd>\
				{returns.summary}\
			</dd>\
		</dl>\
	</div>\
	{end}\
	{if remark}\
	<h3>备注</h3>\
	<div class="doc-content">\
		{remark}\
	</div>\
	{end}\
	{if example}\
	<h3>示例</h3>\
	<div class="doc-content">\
		{example}\
	</div>\
	{end}\
	{if exceptions}\
	<h3>异常</h3>\
	<div class="doc-content">\
		<dl class="doc-params">\
			{for exception in exceptions}\
				<dt>\
					{DocPlus.APIRender.getTypeLink(exception.type)}\
				</dt>\
				<dd>\
					{exception.summary}\
				</dd>\
			{end}\
		</dl>\
	</div>\
	{end}\
	{if sees}\
	<h3>参考</h3>\
	<div class="doc-content">\
		<ul>\
			{for see in sees}\
				<li>\
					{DocPlus.APIRender.getTypeLink(see)}\
				</li>\
			{end}\
		</ul>\
	</div>\
	{end}\
	<h3>社区</h3>\
	<div class="doc-content">\
		<textarea class="x-textbox"></textarea>\
		<br>\
		<br>\
		<input type="submit" class="x-button" value="提交">\
	</div>\
	<br>\
	<br>\
	<br>\
	<br>\
	<br>\
	<br>\
</div>',



	}
	
	
};

DocPlus.initControllers = function(){

	new DocPlus.HomeController(null, '', '', '<span class="x-icon x-icon-home"></span>', '首页');

	new DocPlus.APIController('data/api.js', 'data/api/', 'api', 'API');
	
	new DocPlus.Controller('data/example.js', '../example/', 'example', '示例');

};


/**
	 * 生成并返回一个内容主题是 IFrame 的视图。
	 */
createIFrameView= function (hash, url) {
	var view = new DocPlus.View(hash);
	view.setContent(Dom.create('iframe').setAttr('frameborder', '0').setAttr('src', url));
	return view;
}




Dom.ready(DocPlus.init);



