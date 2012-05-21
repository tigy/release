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
	
	viewHistory: [],

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
			DocPlus.getJSONP(controller.dataJsPath, controller.init.bind(controller), controller.initError);
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
		jsonp: null,
		callback: 'jsonp'
	}),

	getJSONP: function (url, callback, onerror) {
		DocPlus._jsonpObj.run({
			url: url,
			success: callback,
			error: onerror
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
		//trace(data);
	},
	
	/**
	 * 初始化当前控制器对应的视图。
	 */
	initView: function(view, pathInfo){
		view.setContent('加载中...');
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

		view.tab.remove();
		view.content.remove();
		
		DocPlus.viewHistory.remove(view);

		if (DocPlus.currentView === view) {
			DocPlus.currentView = null;
			var topView = DocPlus.viewHistory.item(-1) || view.controller.homeView;
			topView.active();
			DocPlus.redirect(topView.hash);
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

		}

		DocPlus.currentView = view;
		
		DocPlus.viewHistory.remove(view);
		DocPlus.viewHistory.push(view);


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
		var dataPath = this.dataPath + pathInfo + '.js';
		DocPlus.getJSONP(dataPath, function(data){
			DocPlus.APIRender.render(view, data);
		}, function(){
			view.setContent('无法载入数据: ' + dataPath);
		});
	},
	
	initChildren: function (node, domInfo, memberInfo, pathInfo, useName) {
		var isClass = memberInfo.type === 'class';
		for(var item in domInfo){
			if(isClass && item === 'prototype'){
				var t = pathInfo + '.prototype';
				if(!this.members[t]) {
					this.members[t] = {};	
				}
				this.members[t].treeNode = memberInfo.treeNode;
				this.initChildren(node, domInfo.prototype, memberInfo, pathInfo, true);	
			} else {
				var t = pathInfo + (useName ? '.prototype.' : '.') + item;
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
		memberInfo.treeNode.getLast('span').addClass('icon-member icon-' + memberInfo.icon);
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

var CommentServerUrl = 'http://localhost:8022';

// disqus.com

var CommentServer = {

	save: function (dom, hash) {

		new Request.JSONP({
			url: CommentServerUrl,
			data: {
				action: 'save',
				content: Dom.get(dom).find('.x-textbox').getValue()
			},
			success: function () {
				CommentServer.init(dom, hash);
			}
		}).send();
	},

	load: function (dom, hash) {
		if (!window.CommentServerUrl) {
			Dom.get(dom).setHtml('未配置社区服务器');
			return;
		}



		new Request.JSONP({
			url: CommentServerUrl,
			data: {
				action: 'get'
			},
			success: function (data) {
				Dom.get(dom).setHtml(Tpl.parse('\
{for comment in $data}\
{comment.content}\
{comment.date}\
<hr>\
{end}\
<textarea class="x-textbox"></textarea>\
<br><br>\
<input type="button" class="x-button" value="提交" onclick="CommentServer.save(this.parentNode, ' + hash + ')">', data));
			},
			error: function () {
				Dom.get(dom).setHtml('无法连接到接口服务器');
			},
		}).send();
	}

};

DocPlus.APIRender = {
	
	objectTypes: {
		'class': '类',
		'enum': '枚举',
		'interface': '接口',
		'object': '对象',
		'module': '模块',
		'category': '分类'
	},

	memberTypes: {
		'method': '方法',
		'field': '字段',
		'property': '属性',
		'function': '函数',
		'config': '配置',
		'event': '事件'
	},

	members: {
		'configs': '配置',
		'fields': '字段',
		'properties': '属性',
		'methods': '方法',
		'events': '事件'
	},

	getIcon: function (icon, isStatic, extend) {
		return '<span class="icon-member icon-member-signle icon-' + icon + '"></span>' + (isStatic ? '<span class="x-icon icon-static"></span>' : '') + (extend ? '<span class="x-icon icon-extends"></span>' : '');
	},

	getShortReadableName: function (name, memberType, memberOf) {
		var n = DocPlus.APIRender.getReadableName(name, memberType);
		return memberOf ? n + ' (' + memberOf + ')' : n;
	},

	getReadableName: function (name, memberType) {
		var typeName = DocPlus.APIRender.memberTypes[memberType] || DocPlus.APIRender.objectTypes[memberType];
		return typeName ? name + ' ' + typeName : name;
	},
	
	getMemberName: function(name){
		return name.substr(name.lastIndexOf('.') + 1);
	},

	getTypeLink: function (name, displayName) {
		if (name in DocPlus.controllers.api.members) {
			return '<a href="#' + DocPlus.controllers.api.name + '/' + name + '">' + (displayName || name) + '</a>';
		} else {
			return '<a>' + (displayName || name) + '</a>';
		}
	},

	getSyntax: function (data) {
		
		var fn = [
			data.memberAccess ? data.memberAccess + ' ' : '',
			data.memberAttribute ? data.memberAttribute + ' ' : ''
		];
		
		var name = data.name;
		
		switch(data.memberType){
			case 'method':
			case 'function':
						
				var type = data.returns && data.returns.type;
				if (!type || type == "Undefined" || type == "undefined") {
					type = "void";
				}
				fn.push(
				type,
				' ',
				name,
				'(');
	
				if (data.params) {
					data.params.forEach(function (value, index) {
						if (index) {
							fn.push(', ');
						}
						fn.push('<br>&nbsp;&nbsp;&nbsp;&nbsp;');
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
				break;
			
			case 'class':
			case 'enum':
			case 'interface':
			case 'module':
			case 'category':
					
				fn.push(data.memberType);
				fn.push(' ');
				fn.push(name);
				if (data['extends']) {
					fn.push('extends ');
					fn.push( data['extends']);
				}
				if (data['implements']) {
					fn.push('implements ');
					fn.push(data['implements'].join(','));
				}
				break;

			case 'field':
			case 'property':
				var type = data.type;
				if (!type || type == "Undefined" || type == "undefined") {
					type = "Object";
				}
				fn.push(
				type,
				' ',
				name);
				
				if (data.defaultValue) {
					fn.push(' = ');
					fn.push(data.defaultValue);
				}

				break;
			case 'config':
				var type = data.type;
				if (!type || type == "Undefined" || type == "undefined") {
					type = "Object";
				}
				fn.push(
				'{',
				name,
				': ',
				data.defaultValue ? data.defaultValue : ('<em>' + (data.type || "Object") + '</em>'),
				'}');

				break;
			case 'event':
				fn.length = 0;
				fn.push('obj.on("' + name + '", function(){<br>&nbsp;&nbsp;&nbsp;&nbsp;// 回调函数<br>})');
				break;
				
			case 'object':
				fn.push(name);
				fn.push(' = {}')
				break;
				
		}

		return fn.join('');
	},
	
	render: function (view, data) {


		tpl = Tpl.parse(DocPlus.APIRender.tpl, data);
		view.setTitle(DocPlus.APIRender.getShortReadableName(data.name, data.memberType, data.memberOf));
		view.setContent(tpl);

		Object.each(view.content.dom.getElementsByTagName('code'), function (node) {
			var dom = Dom.get(node), lang = dom.getAttr('lang') || 'js';
			if (lang != "none") {
				dom = dom.replaceWith('<pre></pre>');
				dom.addClass('prettyprint linenums lang-' + lang);
				dom.setHtml(prettyPrintOne(node.innerHTML.trim(), lang, 1));
			}
		});
		
	},

	tpl: '\
<div class="doc">\
	<div class="doc-func">\
		<a type="button" href="javascript:;" class="x-button x-button-plain x-menubutton">显示 <span class="x-button-menu x-button-menu-down"> </span> </a>\
	</div>\
	<h1>\
		{if deprecated}[已过时]{end}\
		{DocPlus.APIRender.getReadableName(fullName, memberType)}\
		<small>{memberOf}</small>\
	</h1>\
	<hr>\
	<div class="doc-attrs">\
		<dl class="x-treeview-alt">\
			{if $data.baseClassses || $data.subClasses}\
			<dt>\
				继承关系:\
			</dt>\
			{for baseClass in baseClasses}\
			<dd class="x-treenode-last x-clear">\
				{for(var i = 1; i < $index; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
				{if $index}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{end}\
				{DocPlus.APIRender.getTypeLink(baseClass)}\
			</dd>\
			{end}\
			<dd class="x-treenode-last x-clear">\
				{if baseClasses}\
				{for(var i = 1; i < baseClasses.length; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
				{end}\
				{if baseClasses.length}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{end}\
				<strong>{name}</strong>\
			</dd>\
			{for subClass in subClasses}\
			<dd class="{if $index == subClasses.length - 1}x-treenode-last {end}x-clear">\
				{for(var i = 1; i <= baseClasses.length; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{DocPlus.APIRender.getTypeLink(subClass)}\
			</dd>\
			{end}\
			{end}\
			{if className}\
			<dt>\
				相关成员:\
			</dt>\
			<dd class="x-clear">\
				{DocPlus.APIRender.getTypeLink(className)}\
			</dd>\
			{end}\
			{if source}\
			<dt>\
				定义:\
			</dt>\
			<dd>\
				{if sourceFile}\
				<a target="_blank" href="{sourceFile}">{source}</a>\
				{else} \
				<a>{source}</a>\
				{end}\
			</dd>\
			{end}\
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
		<code lang="none" class="doc-syntax">{DocPlus.APIRender.getSyntax($data)}</code>\
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
	{if type}\
	<h4>类型</h4>\
	<div class="doc-content">\
		{type}\
	</div>\
	{end}\
	{if defaultValue}\
	<h4>默认值</h4>\
	<div class="doc-content">\
		{defaultValue}\
	</div>\
	{end}\
	{for(var $memberType in DocPlus.APIRender.members)}\
	{if $data[$memberType]}\
	<h3>所有{DocPlus.APIRender.members[$memberType]}</h3>\
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
				{for member in $data[$memberType]}\
				<tr class="member-{member.memberAccess}{if member.defines} member-extends{end}">\
					<td> {DocPlus.APIRender.getIcon(member.icon, member.isStatic, member.defines)} </td>\
					<td> {DocPlus.APIRender.getTypeLink(member.fullName, member.name)} </td>\
					<td> {member.summary} </td>\
					<td> {member.defines ? DocPlus.APIRender.getTypeLink(member.defines) : ""} </td>\
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
	<div class="doc-content doc-club">\
		<a href="javascript:;" class="x-linkbutton" onclick="CommentServer.load(this.parentNode, \'#!api/{fullName}\')">获取社区内容</a>\
	</div>\
</div>'
	
	
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



