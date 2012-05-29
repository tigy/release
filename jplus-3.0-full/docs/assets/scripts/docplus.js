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

		document.find('#tabs-more .x-icon-list').parent().on('click', function () {
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
		this.homeView.setContent('<div>请从左边选择 API 信息</div>').deactive();

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
		
		if(isClass && domInfo.prototype) {
			var t = pathInfo + '.prototype';
			if(!this.members[t]) {
				this.members[t] = {};	
			}
			this.members[t].treeNode = memberInfo.treeNode;
			this.initChildren(node, domInfo.prototype, memberInfo, pathInfo, true);	
		}
		
		for(var item in domInfo){
			if(!isClass || item !== 'prototype'){
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
		memberInfo.treeNode.last('span').addClass('icon-member icon-' + memberInfo.icon);
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

var CommentServerUrl = 'http://localhost:83/query.ashx';

// disqus.com

var CommentServer = {

	save: function (dom, hash) {

		new Request.JSONP({
			url: CommentServerUrl,
			data: {
				action: 'add',
				content: Dom.get(dom).find('.x-textbox').getText(),
				url: hash
			},
			success: function () {
				CommentServer.load(dom, hash);
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
				action: 'get',
				url: hash
			},
			success: function (data) {
				Dom.get(dom).setHtml(Tpl.parse('\
{for comment in $data}\
{comment.content}\
<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{comment.date}</span>\
<hr>\
{end}\
<textarea class="x-textbox"></textarea>\
<br><br>\
<input type="button" class="x-button" value="提交" onclick="CommentServer.save(this.parentNode, \'' + hash + '\')">', data));
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
		'constructor': '构造函数',
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

    formatHTML: function (html, indentCharacter, indentSize) {
        return new HtmlFormater().parse(html, indentCharacter, indentSize); //wrapping functions HtmlFormater
    },

    formatJS: js_beautify,
    
    encodeHTML: function (value) {
            return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\'/g, "&#39;").replace(/\"/g, "&quot;");

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
	
	getLink: function(name){
		var m = DocPlus.controllers.api.members[name];
		
		return DocPlus.APIRender.getTypeLink(name, DocPlus.APIRender.getReadableName(name, m && m.type));
	},

	getTypeLink: function (name, displayName) {
		
		var r = [];
		
		
		name.split('/').forEach(function(name){
			if (name in DocPlus.controllers.api.members) {
				r.push( '<a href="#' + DocPlus.controllers.api.name + '/' + name + '">' + (displayName || name) + '</a>'  );
			} else {
				r.push( '<a>' + (displayName || name) + '</a>'  );
			}
		});
		
		
		
		return r.join(' / ');
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
			case 'constructor':
			
				if(data.memberType === 'constructor') {
				
					fn.push(
					'new ',
					data.memberOf,
					'(');
					
				} else {
					
					var type = data.returns && data.returns.type;
					if (!type || type == "Undefined" || type == "undefined") {
						type = "void";
					}
					
					fn.push(
					type,
					' ',
					name,
					'(');
					
				}
	
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
					fn.push(' extends ');
					fn.push( data['extends']);
				}
				if (data['implements']) {
					fn.push(' implements ');
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
				
			default:
				fn.push(name);
				break;
				
		}

		return fn.join('');
	},
	
	render: function (view, data) {
		
		// @link
		tpl = Tpl.parse(DocPlus.APIRender.tpl, data).replace(/\{@link (.*?)\}/g, function(m, value){
			if(value.charAt(0) === '#'){
				value = data.memberOf + value;
			}
			
			value = value.replace('#', '.prototype.');
		
			return DocPlus.APIRender.getLink(value);
		});
		
		view.setTitle(DocPlus.APIRender.getShortReadableName(data.name, data.memberType, data.memberOf));
		view.setContent(tpl);

		Object.each(view.content.dom.getElementsByTagName('ul'), function (node) {
			if (!node.className) {
				var m;
				node.className = 'doc-list';
				for(node = node.firstChild; node; node = node.nextSibling){
					if(node.nodeType === 1 && (m = /^\{(.*?)\}\s+(.*?)(\s*=\s*(.*?))?\s+(.*)$/.exec(Dom.getText(node)))){
						node.innerHTML = String.format("<strong>{0}</strong>({1}): {2}{3}", m[2], DocPlus.APIRender.getTypeLink(m[1]), m[5], m[4] ? " 默认为 " + m[4] + " 。": "");
					}	
				}
			}
		});

		Object.each(view.content.dom.getElementsByTagName('pre'), function (node) {
			if (!node.className) {
				var code = Dom.getText(node).trim(),
					format = Dom.getAttr(node, 'format'),
					lang;
    			
    			switch(format) {
    				case 'htm':
    					code = DocPlus.APIRender.formatJS(code);
    					lang = format;
    					break;
    					
    				case 'js':
    					code = DocPlus.APIRender.formatHTML(code);	
    					lang = format;
    					break;
    					
    				default:
    					lang = Dom.getAttr(node, 'lang') || (/^\</.test(code) ? 'htm' : 'js');
    				
    			}
				
				node.className = 'prettyPrint linenums lang-' + lang;
				
				node.innerHTML = prettyPrintOne(DocPlus.APIRender.encodeHTML(code), lang, 1);
			}
		});
		
	},

	tpl: '\
<div class="doc">\
	<div class="doc-func x-hide">\
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
			{if $data.baseClasses || $data.subClasses}\
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
				{if baseClasses.length}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{end}\
				{end}\
				<strong>{name}</strong>\
			</dd>\
			{for subClass in subClasses}\
			<dd class="{if $index == subClasses.length - 1}x-treenode-last {end}x-clear">\
				{if baseClasses}\
				{for(var i = 1; i <= baseClasses.length; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
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
		<code lang="none" class="doc-syntax">{$data.syntax || DocPlus.APIRender.getSyntax($data)}</code>\
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
		{DocPlus.APIRender.getTypeLink(type)}\
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
				<tr class="member-{member.memberAccess || "public"}{if member.defines} member-extends{end}">\
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
	{if $data.memberOf || $data.see}\
	<h3>另参考</h3>\
	<div class="doc-content">\
		<ul class="doc-ul">\
			{for see in $data.see}\
				<li>\
					{{}@link {see}{}}\
				</li>\
			{end}\
			<li>\
				{{}@link {$data.memberOf}{}}\
			</li>\
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
	//	  new DocPlus.HomeController(null, '', '', '<span class="x-icon x-icon-home"></span>', '首页');

	new DocPlus.APIController('data/api.js', 'data/api/', 'api', 'API');
	
	//    new DocPlus.Controller('data/example.js', '../example/', 'example', '示例');

	
	if(!location.hash){
		location.hash = '#!api/';
	}
	
};


/**
	 * 生成并返回一个内容主题是 IFrame 的视图。
	 */
createIFrameView= function (hash, url) {
	var view = new DocPlus.View(hash);
	view.setContent(Dom.create('iframe').setAttr('frameborder', '0').setAttr('src', url));
	return view;
}




    function HtmlFormater() {

        this.tags = { //An object to hold tags, their position, and their parent-tags, initiated with default values
            parent: 'parent1',
            parentcount: 1,
            parent1: ''
        };

    };

    HtmlFormater.prototype = {

        //HtmlFormater position
        pos: 0,
        token: '',
        currentMode: 'CONTENT',
        tagType: '',
        tokenText: '',
        lastToken: '',
        lastText: '',
        tokenType: '',

        Utils: { //Uilities made available to the various functions
            whitespace: "\n\r\t ".split(''),
            singleToken: 'br,input,link,meta,!doctype,basefont,base,area,hr,wbr,param,img,isindex,?xml,embed'.split(','),
            //all the single tags for HTML
            extra_liners: 'head,body,/html'.split(','),
            //for tags that need a line of whitespace before them
            in_array: function (what, arr) {
                for (var i = 0; i < arr.length; i++) {
                    if (what === arr[i]) {
                        return true;
                    }
                }
                return false;
            }
        },

        getContent: function () { //function to capture regular content between tags
            var chart = '';
            var content = [];
            var space = false;
            //if a space is needed
            while (this.input.charAt(this.pos) !== '<') {
                if (this.pos >= this.input.length) {
                    return content.length ? content.join('') : ['', 'TK_EOF'];
                }
                chart = this.input.charAt(this.pos);
                this.pos++;
                this.lineCharCount++;

                if (this.Utils.in_array(chart, this.Utils.whitespace)) {
                    if (content.length) {
                        space = true;
                    }
                    this.lineCharCount--;
                    continue;
                    //don't want to insert unnecessary space
                } else if (space) {
                    if (this.lineCharCount >= this.maxChar) { //insert a line when the maxChar is reached
                        content.push('\n');
                        for (var i = 0; i < this.indent_level; i++) {
                            content.push(this.indentString);
                        }
                        this.lineCharCount = 0;
                    } else {
                        content.push(' ');
                        this.lineCharCount++;
                    }
                    space = false;
                }
                content.push(chart);
                //letter at-a-time (or string) inserted to an array
            }
            return content.length ? content.join('') : '';
        },

        getScript: function () { //get the full content of a script to pass to js_beautify
            var chart = '';
            var content = [];
            var reg_match = new RegExp('\<\/script' + '\>', 'igm');
            reg_match.lastIndex = this.pos;
            var reg_array = reg_match.exec(this.input);
            var endScript = reg_array ? reg_array.index : this.input.length; //absolute end of script
            while (this.pos < endScript) { //get everything in between the script tags
                if (this.pos >= this.input.length) {
                    return content.length ? content.join('') : ['', 'TK_EOF'];
                }

                chart = this.input.charAt(this.pos);
                this.pos++;

                content.push(chart);
            }
            return content.length ? content.join('') : ''; //we might not have any content at all
        },

        recordTag: function (tag) { //function to record a tag and its parent in this.tags Object
            if (this.tags[tag + 'count']) { //check for the existence of this tag type
                this.tags[tag + 'count']++;
                this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
            } else { //otherwise initialize this tag type
                this.tags[tag + 'count'] = 1;
                this.tags[tag + this.tags[tag + 'count']] = this.indent_level; //and record the present indent level
            }
            this.tags[tag + this.tags[tag + 'count'] + 'parent'] = this.tags.parent; //set the parent (i.e. in the case of a div this.tags.div1parent)
            this.tags.parent = tag + this.tags[tag + 'count']; //and make this the forEach parent (i.e. in the case of a div 'div1')
        },

        retrieveTag: function (tag) { //function to retrieve the opening tag to the corresponding closer
            if (this.tags[tag + 'count']) { //if the openener is not in the Object we ignore it
                var temp_parent = this.tags.parent; //check to see if it's a closable tag.
                while (temp_parent) { //till we reach '' (the initial value);
                    if (tag + this.tags[tag + 'count'] === temp_parent) { //if this is it use it
                        break;
                    }
                    temp_parent = this.tags[temp_parent + 'parent']; //otherwise keep on climbing up the DOM Tree
                }
                if (temp_parent) { //if we caught something
                    this.indent_level = this.tags[tag + this.tags[tag + 'count']]; //set the indent_level accordingly
                    this.tags.parent = this.tags[temp_parent + 'parent']; //and set the forEach parent
                }
                delete this.tags[tag + this.tags[tag + 'count'] + 'parent']; //delete the closed tags parent reference...
                delete this.tags[tag + this.tags[tag + 'count']]; //...and the tag itself
                if (this.tags[tag + 'count'] == 1) {
                    delete this.tags[tag + 'count'];
                } else {
                    this.tags[tag + 'count']--;
                }
            }
        },
        getTag: function () { //function to get a full tag and parse its type
            var chart = '';
            var content = [];
            var space = false;

            do {
                if (this.pos >= this.input.length) {
                    return content.length ? content.join('') : ['', 'TK_EOF'];
                }
                chart = this.input.charAt(this.pos);
                this.pos++;
                this.lineCharCount++;

                if (this.Utils.in_array(chart, this.Utils.whitespace)) { //don't want to insert unnecessary space
                    space = true;
                    this.lineCharCount--;
                    continue;
                }

                if (chart === "'" || chart === '"') {
                    if (!content[1] || content[1] !== '!') { //if we're in a comment strings don't get treated specially
                        chart += this.getUnformatted(chart);
                        space = true;
                    }
                }

                if (chart === '=') { //no space before =
                    space = false;
                }

                if (content.length && content[content.length - 1] !== '=' && chart !== '>' && space) { //no space after = or before >
                    if (this.lineCharCount >= this.maxChar) {
                        this.printNewline(false, content);
                        this.lineCharCount = 0;
                    } else {
                        content.push(' ');
                        this.lineCharCount++;
                    }
                    space = false;
                }
                content.push(chart);
                //inserts character at-a-time (or string)
            } while (chart !== '>');

            var tagComplete = content.join('');
            var tagIndex;
            if (tagComplete.indexOf(' ') != -1) { //if there's whitespace, thats where the tag name ends
                tagIndex = tagComplete.indexOf(' ');
            } else { //otherwise go with the tag ending
                tagIndex = tagComplete.indexOf('>');
            }
            var tagCheck = tagComplete.substring(1, tagIndex).toLowerCase();
            if (tagComplete.charAt(tagComplete.length - 2) === '/' || this.Utils.in_array(tagCheck, this.Utils.singleToken)) { //if this tag name is a single tag type (either in the list or has a closing /)
                this.tagType = 'SINGLE';
            } else if (tagCheck === 'script') { //for later script handling
                this.recordTag(tagCheck);
                this.tagType = 'SCRIPT';
            } else if (tagCheck === 'style') { //for future style handling (for now it justs uses getContent)
                this.recordTag(tagCheck);
                this.tagType = 'STYLE';
            } else if (tagCheck.charAt(0) === '!') { //peek for <!-- comment
                if (tagCheck.indexOf('[if') != -1) { //peek for <!--[if conditional comment
                    if (tagComplete.indexOf('!IE') != -1) { //this type needs a closing --> so...
                        var comment = this.getUnformatted('-->', tagComplete);
                        //...delegate to getUnformatted
                        content.push(comment);
                    }
                    this.tagType = 'START';
                } else if (tagCheck.indexOf('[endif') != -1) { //peek for <!--[endif end conditional comment
                    this.tagType = 'END';
                    this.unindent();
                } else if (tagCheck.indexOf('[cdata[') != -1) { //if it's a <[cdata[ comment...
                    var comment = this.getUnformatted(']]>', tagComplete);
                    //...delegate to getUnformatted function
                    content.push(comment);
                    this.tagType = 'SINGLE';
                    //<![CDATA[ comments are treated like single tags
                } else {
                    var comment = this.getUnformatted('-->', tagComplete);
                    content.push(comment);
                    this.tagType = 'SINGLE';
                }
            } else {
                if (tagCheck.charAt(0) === '/') { //this tag is a double tag so check for tag-ending
                    this.retrieveTag(tagCheck.substring(1));
                    //remove it and all ancestors
                    this.tagType = 'END';
                } else { //otherwise it's a start-tag
                    this.recordTag(tagCheck);
                    //push it on the tag stack
                    this.tagType = 'START';
                }
                if (this.Utils.in_array(tagCheck, this.Utils.extra_liners)) { //check if this double needs an extra line
                    this.printNewline(true, this.output);
                }
            }
            return content.join('');
            //returns fully formatted tag
        },
        getUnformatted: function (delimiter, origTag) { //function to return unformatted content in its entirety
            if (origTag && origTag.indexOf(delimiter) != -1) {
                return '';
            }
            var chart = '';
            var content = '';
            var space = true;
            do {
                chart = this.input.charAt(this.pos);
                this.pos++

                if (this.Utils.in_array(chart, this.Utils.whitespace)) {
                    if (!space) {
                        this.lineCharCount--;
                        continue;
                    }
                    if (chart === '\n' || chart === '\r') {
                        content += '\n';
                        for (var i = 0; i < this.indent_level; i++) {
                            content += this.indentString;
                        }
                        space = false;
                        //...and make sure other indentation is erased
                        this.lineCharCount = 0;
                        continue;
                    }
                }
                content += chart;
                this.lineCharCount++;
                space = true;

            } while (content.indexOf(delimiter) == -1);
            return content;
        },
        getToken: function () { //initial handler for token-retrieval
            var token;

            if (this.lastToken === 'TK_TAG_SCRIPT') { //check if we need to format javascript
                var tempToken = this.getScript();
                if (typeof tempToken !== 'string') {
                    return tempToken;
                }
                token = js_beautify(tempToken, {
                	indent_size: this.indentSize,
                	indent_char: this.indentCharacter,
                	indent_level: this.indent_level
                });
                //call the JS Beautifier
                return [token, 'TK_CONTENT'];
            }
            if (this.currentMode === 'CONTENT') {
                token = this.getContent();
                if (typeof token !== 'string') {
                    return token;
                } else {
                    return [token, 'TK_CONTENT'];
                }
            }

            if (this.currentMode === 'TAG') {
                token = this.getTag();
                if (typeof token !== 'string') {
                    return token;
                } else {
                    var tagNameType = 'TK_TAG_' + this.tagType;
                    return [token, tagNameType];
                }
            }
        },

        printer: function (jsSource, indentCharacter, indentSize, maxChar) { //handles input/output and some other printing functions
            this.input = jsSource || '';
            //gets the input for the HtmlFormater
            this.output = [];
            this.indentCharacter = indentCharacter || ' ';
            this.indentString = '';
            this.indentSize = indentSize || 2;
            this.indent_level = 0;
            this.maxChar = maxChar || 70;
            //maximum amount of characters per line
            this.lineCharCount = 0;
            //count to see if maxChar was exceeded
            for (var i = 0; i < this.indentSize; i++) {
                this.indentString += this.indentCharacter;
            }

            return this;
        },

        printNewline: function (ignore, arr) {
            this.lineCharCount = 0;
            if (!arr || !arr.length) {
                return;
            }
            if (!ignore) { //we might want the extra line
                while (this.Utils.in_array(arr[arr.length - 1], this.Utils.whitespace)) {
                    arr.pop();
                }
            }
            arr.push('\n');
            for (var i = 0; i < this.indent_level; i++) {
                arr.push(this.indentString);
            }
        },

        printToken: function (text) {
            this.output.push(text);
        },

        indent: function () {
            this.indent_level++;
        },

        unindent: function () {
            if (this.indent_level > 0) {
                this.indent_level--;
            }
        },

        parse: function (htmlSource, indentCharacter, indentSize) {
            var me = this;
            me.printer(htmlSource, indentCharacter, indentSize); //initialize starting values
            
            var hasContent = true;
            
            while (true) {
                var t = me.getToken();
                me.tokenText = t[0];
                me.tokenType = t[1];
                if (me.tokenType === 'TK_EOF') {
                    break;
                }

                switch (me.tokenType) {
	                case 'TK_TAG_START':
	                case 'TK_TAG_SCRIPT':
	                case 'TK_TAG_STYLE':
	                    me.printNewline(false, me.output);
	                    me.printToken(me.tokenText);
	                    me.indent();
	                    me.currentMode = 'CONTENT';
	                    break;
	                case 'TK_TAG_END':
	                	if(hasContent) {
	                  		me.printNewline(true, me.output);
		                } else {
	                    	hasContent = true;	
		                }
	                    me.printToken(me.tokenText);
	                    me.currentMode = 'CONTENT';
	                    break;
	                case 'TK_TAG_SINGLE':
	                    me.printNewline(false, me.output);
	                    me.printToken(me.tokenText);
	                    me.currentMode = 'CONTENT';
	                    hasContent = true;
	                    break;
	                case 'TK_CONTENT':
	                    hasContent = true;
	                    if (me.tokenText !== '') {
	                    	if(/^\<(title|textarea|System|a|span|button|li)\b/.test(me.lastText)){
	                    		hasContent = false;
	                    	} else {
		                        me.printNewline(false, me.output);
	                       }
		                   me.printToken(me.tokenText);
	                    } else if(/^TK_TAG_S/.test(me.lastToken)){
	                    	hasContent = false;
	                    }
	                    me.currentMode = 'TAG';
	                    break;
	            }
                me.lastToken = me.tokenType;
                me.lastText = me.tokenText;
            }
            return me.output.join('');
        }
    };

    /*jslint onevar: false, plusplus: false */
    /*

 JS Beautifier
---------------


  Written by Einar Lielmanis, <einar@jsbeautifier.org>
      http://jsbeautifier.org/

  Originally converted to javascript by Vital, <vital76@gmail.com>
  "End braces on own line" added by Chris J. Shull, <chrisjshull@gmail.com>

  You are free to use this in any way you want, in case you find this useful or working for you.

  Usage:
    js_beautify(js_source_text);
    js_beautify(js_source_text, options);

  The options are:
    indent_size (default 4)          — indentation size,
    indent_char (default space)      — character to indent with,
    preserve_newlines (default true) — whether existing line breaks should be preserved,
    preserve_max_newlines (default unlimited) - maximum number of line breaks to be preserved in one chunk,

    jslint_happy (default false) — if true, then jslint-stricter mode is enforced.

            jslint_happy   !jslint_happy
            ---------------------------------
             function ()      function()

    brace_style (default "collapse") - "collapse" | "expand" | "end-expand" | "expand-strict"
            put braces on the same line as control statements (default), or put braces on own line (Allman / ANSI style), or just put end braces on own line.

            expand-strict: put brace on own line even in such cases:

                var a =
                {
                    a: 5,
                    b: 6
                }
            This mode may break your scripts - e.g "return { a: 1 }" will be broken into two lines, so beware.

    space_before_conditional: should the space before conditional statement be added, "if(true)" vs "if (true)"

    e.g

    js_beautify(js_source_text, {
      'indent_size': 1,
      'indent_char': '\t'
    });


*/



    function js_beautify(js_source_text, options) {

        var input, output, token_text, last_type, last_text, last_last_text, last_word, flags, flag_store, indent_string;
        var whitespace, wordchar, punct, parser_pos, line_starters, digits;
        var prefix, token_type, do_block_just_closed;
        var wanted_newline, just_added_newline, n_newlines;
        var preindent_string = '';


        // Some interpreters have unexpected results with foo = baz || bar;
        options = options ? options : {};

        var opt_brace_style;

        // compatibility
        if (options.space_after_anon_function !== undefined && options.jslint_happy === undefined) {
            options.jslint_happy = options.space_after_anon_function;
        }
        if (options.braces_on_own_line !== undefined) { //graceful handling of deprecated option
            opt_brace_style = options.braces_on_own_line ? "expand" : "collapse";
        }
        opt_brace_style = options.brace_style ? options.brace_style : (opt_brace_style ? opt_brace_style : "collapse");


        var opt_indent_size = options.indent_size ? options.indent_size : 4;
        var opt_indent_char = options.indent_char ? options.indent_char : ' ';
        var opt_preserve_newlines = typeof options.preserve_newlines === 'undefined' ? true : options.preserve_newlines;
        var opt_max_preserve_newlines = typeof options.max_preserve_newlines === 'undefined' ? false : options.max_preserve_newlines;
        var opt_jslint_happy = options.jslint_happy === 'undefined' ? false : options.jslint_happy;
        var opt_keep_array_indentation = typeof options.keep_array_indentation === 'undefined' ? false : options.keep_array_indentation;
        var opt_space_before_conditional = typeof options.space_before_conditional === 'undefined' ? true : options.space_before_conditional;
        var opt_indent_case = typeof options.indent_case === 'undefined' ? false : options.indent_case;
		var indentation_level_start = options.indent_level || 0;

        just_added_newline = false;

        // cache the source's length.
        var input_length = js_source_text.length;

        function trim_output(eat_newlines) {
            eat_newlines = typeof eat_newlines === 'undefined' ? false : eat_newlines;
            while (output.length && (output[output.length - 1] === ' ' || output[output.length - 1] === indent_string || output[output.length - 1] === preindent_string || (eat_newlines && (output[output.length - 1] === '\n' || output[output.length - 1] === '\r')))) {
                output.pop();
            }
        }

        function trim(s) {
            return s.replace(/^\s\s*|\s\s*$/, '');
        }

        function force_newline() {
            var old_keep_array_indentation = opt_keep_array_indentation;
            opt_keep_array_indentation = false;
            print_newline()
            opt_keep_array_indentation = old_keep_array_indentation;
        }

        function print_newline(ignore_repeated) {

            flags.eat_next_space = false;
            if (opt_keep_array_indentation && is_array(flags.mode)) {
                return;
            }

            ignore_repeated = typeof ignore_repeated === 'undefined' ? true : ignore_repeated;

            flags.if_line = false;
            trim_output();

            if (!output.length) {
                return; // no newline on start of file
            }

            if (output[output.length - 1] !== "\n" || !ignore_repeated) {
                just_added_newline = true;
                output.push("\n");
            }
            if (preindent_string) {
                output.push(preindent_string);
            }
            for (var i = 0; i < flags.indentation_level; i += 1) {
                output.push(indent_string);
            }
            if (flags.var_line && flags.var_line_reindented) {
                output.push(indent_string); // skip space-stuffing, if indenting with a tab
            }
            if (flags.case_body) {
                output.push(indent_string);
            }
        }



        function print_single_space() {

            if (last_type === 'TK_COMMENT') {
                // no you will not print just a space after a comment
                return print_newline(true);
            }

            if (flags.eat_next_space) {
                flags.eat_next_space = false;
                return;
            }
            var last_output = ' ';
            if (output.length) {
                last_output = output[output.length - 1];
            }
            if (last_output !== ' ' && last_output !== '\n' && last_output !== indent_string) { // prevent occassional duplicate space
                output.push(' ');
            }
        }


        function print_token() {
            just_added_newline = false;
            flags.eat_next_space = false;
            output.push(token_text);
        }

        function indent() {
            flags.indentation_level += 1;
        }


        function remove_indent() {
            if (output.length && output[output.length - 1] === indent_string) {
                output.pop();
            }
        }

        function set_mode(mode) {
            if (flags) {
                flag_store.push(flags);
            }
            flags = {
                previous_mode: flags ? flags.mode : 'BLOCK',
                mode: mode,
                var_line: false,
                var_line_tainted: false,
                var_line_reindented: false,
                in_html_comment: false,
                if_line: false,
                in_case: false,
                case_body: false,
                eat_next_space: false,
                indentation_baseline: -1,
                indentation_level: (flags ? flags.indentation_level + (flags.case_body ? 1 : 0) + ((flags.var_line && flags.var_line_reindented) ? 1 : 0) : indentation_level_start),
                ternary_depth: 0
            };
        }

        function is_array(mode) {
            return mode === '[EXPRESSION]' || mode === '[INDENTED-EXPRESSION]';
        }

        function is_expression(mode) {
            return in_array(mode, ['[EXPRESSION]', '(EXPRESSION)', '(FOR-EXPRESSION)', '(COND-EXPRESSION)']);
        }

        function restore_mode() {
            do_block_just_closed = flags.mode === 'DO_BLOCK';
            if (flag_store.length > 0) {
                var mode = flags.mode;
                flags = flag_store.pop();
                flags.previous_mode = mode;
            }
        }

        function all_lines_start_with(lines, c) {
            for (var i = 0; i < lines.length; i++) {
                if (trim(lines[i])[0] != c) {
                    return false;
                }
            }
            return true;
        }

        function is_special_word(word) {
            return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
        }

        function in_array(what, arr) {
            for (var i = 0; i < arr.length; i += 1) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
        }

        function look_up(exclude) {
            var local_pos = parser_pos;
            var c = input.charAt(local_pos);
            while (in_array(c, whitespace) && c != exclude) {
                local_pos++;
                if (local_pos >= input_length) return 0;
                c = input.charAt(local_pos);
            }
            return c;
        }

        function get_next_token() {
            n_newlines = 0;

            if (parser_pos >= input_length) {
                return ['', 'TK_EOF'];
            }

            wanted_newline = false;

            var c = input.charAt(parser_pos);
            parser_pos += 1;


            var keep_whitespace = opt_keep_array_indentation && is_array(flags.mode);

            if (keep_whitespace) {

                //
                // slight mess to allow nice preservation of array indentation and reindent that correctly
                // first time when we get to the arrays:
                // var a = [
                // ....'something'
                // we make note of whitespace_count = 4 into flags.indentation_baseline
                // so we know that 4 whitespaces in original source match indent_level of reindented source
                //
                // and afterwards, when we get to
                //    'something,
                // .......'something else'
                // we know that this should be indented to indent_level + (7 - indentation_baseline) spaces
                //
                var whitespace_count = 0;

                while (in_array(c, whitespace)) {

                    if (c === "\n") {
                        trim_output();
                        output.push("\n");
                        just_added_newline = true;
                        whitespace_count = 0;
                    } else {
                        if (c === '\t') {
                            whitespace_count += 4;
                        } else if (c === '\r') {
                            // nothing
                        } else {
                            whitespace_count += 1;
                        }
                    }

                    if (parser_pos >= input_length) {
                        return ['', 'TK_EOF'];
                    }

                    c = input.charAt(parser_pos);
                    parser_pos += 1;

                }
                if (flags.indentation_baseline === -1) {
                    flags.indentation_baseline = whitespace_count;
                }

                if (just_added_newline) {
                    var i;
                    for (i = 0; i < flags.indentation_level + 1; i += 1) {
                        output.push(indent_string);
                    }
                    if (flags.indentation_baseline !== -1) {
                        for (i = 0; i < whitespace_count - flags.indentation_baseline; i++) {
                            output.push(' ');
                        }
                    }
                }

            } else {
                while (in_array(c, whitespace)) {

                    if (c === "\n") {
                        n_newlines += ((opt_max_preserve_newlines) ? (n_newlines <= opt_max_preserve_newlines) ? 1 : 0 : 1);
                    }


                    if (parser_pos >= input_length) {
                        return ['', 'TK_EOF'];
                    }

                    c = input.charAt(parser_pos);
                    parser_pos += 1;

                }

                if (opt_preserve_newlines) {
                    if (n_newlines > 1) {
                        for (i = 0; i < n_newlines; i += 1) {
                            print_newline(i === 0);
                            just_added_newline = true;
                        }
                    }
                }
                wanted_newline = n_newlines > 0;
            }


            if (in_array(c, wordchar)) {
                if (parser_pos < input_length) {
                    while (in_array(input.charAt(parser_pos), wordchar)) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos === input_length) {
                            break;
                        }
                    }
                }

                // small and surprisingly unugly hack for 1E-10 representation
                if (parser_pos !== input_length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {

                    var sign = input.charAt(parser_pos);
                    parser_pos += 1;

                    var t = get_next_token(parser_pos);
                    c += sign + t[0];
                    return [c, 'TK_WORD'];
                }

                if (c === 'in') { // hack for 'in' operator
                    return [c, 'TK_OPERATOR'];
                }
                if (wanted_newline && last_type !== 'TK_OPERATOR' && last_type !== 'TK_EQUALS' && !flags.if_line && (opt_preserve_newlines || last_text !== 'var')) {
                    print_newline();
                }
                return [c, 'TK_WORD'];
            }

            if (c === '(' || c === '[') {
                return [c, 'TK_START_EXPR'];
            }

            if (c === ')' || c === ']') {
                return [c, 'TK_END_EXPR'];
            }

            if (c === '{') {
                return [c, 'TK_START_BLOCK'];
            }

            if (c === '}') {
                return [c, 'TK_END_BLOCK'];
            }

            if (c === ';') {
                return [c, 'TK_SEMICOLON'];
            }

            if (c === '/') {
                var comment = '';
                // peek for comment /* ... */
                var inline_comment = true;
                if (input.charAt(parser_pos) === '*') {
                    parser_pos += 1;
                    if (parser_pos < input_length) {
                        while (!(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/') && parser_pos < input_length) {
                            c = input.charAt(parser_pos);
                            comment += c;
                            if (c === '\x0d' || c === '\x0a') {
                                inline_comment = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                break;
                            }
                        }
                    }
                    parser_pos += 2;
                    if (inline_comment && n_newlines == 0) {
                        return ['/*' + comment + '*/', 'TK_INLINE_COMMENT'];
                    } else {
                        return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
                    }
                }
                // peek for comment // ...
                if (input.charAt(parser_pos) === '/') {
                    comment = c;
                    while (input.charAt(parser_pos) !== '\r' && input.charAt(parser_pos) !== '\n') {
                        comment += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input_length) {
                            break;
                        }
                    }
                    parser_pos += 1;
                    if (wanted_newline) {
                        print_newline();
                    }
                    return [comment, 'TK_COMMENT'];
                }

            }

            if (c === "'" || // string
            c === '"' || // string
            (c === '/' && ((last_type === 'TK_WORD' && is_special_word(last_text)) || (last_text === ')' && in_array(flags.previous_mode, ['(COND-EXPRESSION)', '(FOR-EXPRESSION)'])) || (last_type === 'TK_COMMENT' || last_type === 'TK_START_EXPR' || last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_OPERATOR' || last_type === 'TK_EQUALS' || last_type === 'TK_EOF' || last_type === 'TK_SEMICOLON')))) { // regexp
                var sep = c;
                var esc = false;
                var resulting_string = c;

                if (parser_pos < input_length) {
                    if (sep === '/') {
                        //
                        // handle regexp separately...
                        //
                        var in_char_class = false;
                        while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (!esc) {
                                esc = input.charAt(parser_pos) === '\\';
                                if (input.charAt(parser_pos) === '[') {
                                    in_char_class = true;
                                } else if (input.charAt(parser_pos) === ']') {
                                    in_char_class = false;
                                }
                            } else {
                                esc = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when end-of-file reached.
                                // bail out with what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }

                    } else {
                        //
                        // and handle string also separately
                        //
                        while (esc || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (!esc) {
                                esc = input.charAt(parser_pos) === '\\';
                            } else {
                                esc = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                // incomplete string/rexp when end-of-file reached.
                                // bail out with what had been received so far.
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    }



                }

                parser_pos += 1;

                resulting_string += sep;

                if (sep === '/') {
                    // regexps may have modifiers /regexp/MOD , so fetch those, too
                    while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
                        resulting_string += input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }

            if (c === '#') {


                if (output.length === 0 && input.charAt(parser_pos) === '!') {
                    // shebang
                    resulting_string = c;
                    while (parser_pos < input_length && c != '\n') {
                        c = input.charAt(parser_pos);
                        resulting_string += c;
                        parser_pos += 1;
                    }
                    output.push(trim(resulting_string) + '\n');
                    print_newline();
                    return get_next_token();
                }



                // Spidermonkey-specific sharp variables for circular references
                // https://developer.mozilla.org/En/Sharp_variables_in_JavaScript
                // http://mxr.mozilla.org/mozilla-central/source/js/src/jsscan.cpp around line 1935
                var sharp = '#';
                if (parser_pos < input_length && in_array(input.charAt(parser_pos), digits)) {
                    do {
                        c = input.charAt(parser_pos);
                        sharp += c;
                        parser_pos += 1;
                    } while (parser_pos < input_length && c !== '#' && c !== '=');
                    if (c === '#') {
                        //
                    } else if (input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
                        sharp += '[]';
                        parser_pos += 2;
                    } else if (input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
                        sharp += '{}';
                        parser_pos += 2;
                    }
                    return [sharp, 'TK_WORD'];
                }
            }

            if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
                parser_pos += 3;
                c = '<!--';
                while (input[parser_pos] != '\n' && parser_pos < input_length) {
                    c += input[parser_pos];
                    parser_pos++;
                }
                flags.in_html_comment = true;
                return [c, 'TK_COMMENT'];
            }

            if (c === '-' && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
                flags.in_html_comment = false;
                parser_pos += 2;
                if (wanted_newline) {
                    print_newline();
                }
                return ['-->', 'TK_COMMENT'];
            }

            if (in_array(c, punct)) {
                while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input_length) {
                        break;
                    }
                }

                if (c === '=') {
                    return [c, 'TK_EQUALS'];
                } else {
                    return [c, 'TK_OPERATOR'];
                }
            }

            return [c, 'TK_UNKNOWN'];
        }

        //----------------------------------
        indent_string = '';
        while (opt_indent_size > 0) {
            indent_string += opt_indent_char;
            opt_indent_size -= 1;
        }

        while (js_source_text && (js_source_text[0] === ' ' || js_source_text[0] === '\t')) {
            preindent_string += js_source_text[0];
            js_source_text = js_source_text.substring(1);
        }
        input = js_source_text;

        last_word = ''; // last 'TK_WORD' passed
        last_type = 'TK_START_EXPR'; // last token type
        last_text = ''; // last token text
        last_last_text = ''; // pre-last token text
        output = [];

        do_block_just_closed = false;

        whitespace = "\n\r\t ".split('');
        wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
        digits = '0123456789'.split('');

        punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! !! , : ? ^ ^= |= ::';
        punct += ' <%= <% %> <?= <? ?>'; // try to be a good boy and try not to break the markup language identifiers
        punct = punct.split(' ');

        // words which should always start on new line.
        line_starters = 'continue,try,throw,return,var,if,switch,case,default,for,while,break,function'.split(',');

        // states showing if we are currently in expression (i.e. "if" case) - 'EXPRESSION', or in usual block (like, procedure), 'BLOCK'.
        // some formatting depends on that.
        flag_store = [];
        set_mode('BLOCK');

        parser_pos = 0;
        while (true) {
            var t = get_next_token(parser_pos);
            token_text = t[0];
            token_type = t[1];
            if (token_type === 'TK_EOF') {
                break;
            }

            switch (token_type) {

            case 'TK_START_EXPR':

                if (token_text === '[') {

                    if (last_type === 'TK_WORD' || last_text === ')') {
                        // this is array index specifier, break immediately
                        // a[x], fn()[x]
                        if (in_array(last_text, line_starters)) {
                            print_single_space();
                        }
                        set_mode('(EXPRESSION)');
                        print_token();
                        break;
                    }

                    if (flags.mode === '[EXPRESSION]' || flags.mode === '[INDENTED-EXPRESSION]') {
                        if (last_last_text === ']' && last_text === ',') {
                            // ], [ goes to new line
                            if (flags.mode === '[EXPRESSION]') {
                                flags.mode = '[INDENTED-EXPRESSION]';
                                if (!opt_keep_array_indentation) {
                                    indent();
                                }
                            }
                            set_mode('[EXPRESSION]');
                            if (!opt_keep_array_indentation) {
                                print_newline();
                            }
                        } else if (last_text === '[') {
                            if (flags.mode === '[EXPRESSION]') {
                                flags.mode = '[INDENTED-EXPRESSION]';
                                if (!opt_keep_array_indentation) {
                                    indent();
                                }
                            }
                            set_mode('[EXPRESSION]');

                            if (!opt_keep_array_indentation) {
                                print_newline();
                            }
                        } else {
                            set_mode('[EXPRESSION]');
                        }
                    } else {
                        set_mode('[EXPRESSION]');
                    }



                } else {
                    if (last_word === 'for') {
                        set_mode('(FOR-EXPRESSION)');
                    } else if (in_array(last_word, ['if', 'while'])) {
                        set_mode('(COND-EXPRESSION)');
                    } else {
                        set_mode('(EXPRESSION)');
                    }
                }

                if (last_text === ';' || last_type === 'TK_START_BLOCK') {
                    print_newline();
                } else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || last_text === '.') {
                    if (wanted_newline) {
                        print_newline();
                    }
                    // do nothing on (( and )( and ][ and ]( and .(
                } else if (last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                    print_single_space();
                } else if (last_word === 'function' || last_word === 'typeof') {
                    // function() vs function ()
                    if (opt_jslint_happy) {
                        print_single_space();
                    }
                } else if (in_array(last_text, line_starters) || last_text === 'catch') {
                    if (opt_space_before_conditional) {
                        print_single_space();
                    }
                }
                print_token();

                break;

            case 'TK_END_EXPR':
                if (token_text === ']') {
                    if (opt_keep_array_indentation) {
                        if (last_text === '}') {
                            // trim_output();
                            // print_newline(true);
                            remove_indent();
                            print_token();
                            restore_mode();
                            break;
                        }
                    } else {
                        if (flags.mode === '[INDENTED-EXPRESSION]') {
                            if (last_text === ']') {
                                restore_mode();
                                print_newline();
                                print_token();
                                break;
                            }
                        }
                    }
                }
                restore_mode();
                print_token();
                break;

            case 'TK_START_BLOCK':

                if (last_word === 'do') {
                    set_mode('DO_BLOCK');
                } else {
                    set_mode('BLOCK');
                }
                if (opt_brace_style == "expand" || opt_brace_style == "expand-strict") {
                    var empty_braces = false;
                    if (opt_brace_style == "expand-strict") {
                        empty_braces = (look_up() == '}');
                        if (!empty_braces) {
                            print_newline(true);
                        }
                    } else {
                        if (last_type !== 'TK_OPERATOR') {
                            if (last_text === '=' || (is_special_word(last_text) && last_text !== 'else')) {
                                print_single_space();
                            } else {
                                print_newline(true);
                            }
                        }
                    }
                    print_token();
                    if (!empty_braces) indent();
                } else {
                    if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                        if (last_type === 'TK_START_BLOCK') {
                            print_newline();
                        } else {
                            print_single_space();
                        }
                    } else {
                        // if TK_OPERATOR or TK_START_EXPR
                        if (is_array(flags.previous_mode) && last_text === ',') {
                            if (last_last_text === '}') {
                                // }, { in array context
                                print_single_space();
                            } else {
                                print_newline(); // [a, b, c, {
                            }
                        }
                    }
                    indent();
                    print_token();
                }

                break;

            case 'TK_END_BLOCK':
                restore_mode();
                if (opt_brace_style == "expand" || opt_brace_style == "expand-strict") {
                    if (last_text !== '{') {
                        print_newline();
                    }
                    print_token();
                } else {
                    if (last_type === 'TK_START_BLOCK') {
                        // nothing
                        if (just_added_newline) {
                            remove_indent();
                        } else {
                            // {}
                            trim_output();
                        }
                    } else {
                        if (is_array(flags.mode) && opt_keep_array_indentation) {
                            // we REALLY need a newline here, but newliner would skip that
                            opt_keep_array_indentation = false;
                            print_newline();
                            opt_keep_array_indentation = true;

                        } else {
                            print_newline();
                        }
                    }
                    print_token();
                }
                break;

            case 'TK_WORD':

                // no, it's not you. even I have problems understanding how this works
                // and what does what.
                if (do_block_just_closed) {
                    // do {} ## while ()
                    print_single_space();
                    print_token();
                    print_single_space();
                    do_block_just_closed = false;
                    break;
                }

                if (token_text === 'function') {
                    if (flags.var_line) {
                        flags.var_line_reindented = true;
                    }
                    if ((just_added_newline || last_text === ';') && last_text !== '{' && last_type != 'TK_BLOCK_COMMENT' && last_type != 'TK_COMMENT') {
                        // make sure there is a nice clean space of at least one blank line
                        // before a new function definition
                        n_newlines = just_added_newline ? n_newlines : 0;
                        if (!opt_preserve_newlines) {
                            n_newlines = 1;
                        }

                        for (var i = 0; i < 2 - n_newlines; i++) {
                            print_newline(false);
                        }
                    }
                }

                if (token_text === 'case' || token_text === 'default') {
                    if (last_text === ':' || flags.case_body) {
                        // switch cases following one another
                        remove_indent();
                    } else {
                        // case statement starts in the same line where switch
                        if (!opt_indent_case) flags.indentation_level--;
                        print_newline();
                        if (!opt_indent_case) flags.indentation_level++;
                    }
                    print_token();
                    flags.in_case = true;
                    flags.case_body = false;
                    break;
                }

                prefix = 'NONE';

                if (last_type === 'TK_END_BLOCK') {

                    if (!in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
                        prefix = 'NEWLINE';
                    } else {
                        if (opt_brace_style == "expand" || opt_brace_style == "end-expand" || opt_brace_style == "expand-strict") {
                            prefix = 'NEWLINE';
                        } else {
                            prefix = 'SPACE';
                            print_single_space();
                        }
                    }
                } else if (last_type === 'TK_SEMICOLON' && (flags.mode === 'BLOCK' || flags.mode === 'DO_BLOCK')) {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                    prefix = 'SPACE';
                } else if (last_type === 'TK_STRING') {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_WORD') {
                    if (last_text === 'else') {
                        // eat newlines between ...else *** some_op...
                        // won't preserve extra newlines in this place (if any), but don't care that much
                        trim_output(true);
                    }
                    prefix = 'SPACE';
                } else if (last_type === 'TK_START_BLOCK') {
                    prefix = 'NEWLINE';
                } else if (last_type === 'TK_END_EXPR') {
                    print_single_space();
                    prefix = 'NEWLINE';
                }

                if (in_array(token_text, line_starters) && last_text !== ')') {
                    if (last_text == 'else') {
                        prefix = 'SPACE';
                    } else {
                        prefix = 'NEWLINE';
                    }

                    if (token_text === 'function' && (last_text === 'get' || last_text === 'set')) {
                        prefix = 'SPACE';
                    }
                }

                if (flags.if_line && last_type === 'TK_END_EXPR') {
                    flags.if_line = false;
                }
                if (in_array(token_text.toLowerCase(), ['else', 'catch', 'finally'])) {
                    if (last_type !== 'TK_END_BLOCK' || opt_brace_style == "expand" || opt_brace_style == "end-expand" || opt_brace_style == "expand-strict") {
                        print_newline();
                    } else {
                        trim_output(true);
                        print_single_space();
                    }
                } else if (prefix === 'NEWLINE') {
                    if ((last_type === 'TK_START_EXPR' || last_text === '=' || last_text === ',') && token_text === 'function') {
                        // no need to force newline on 'function': (function
                        // DONOTHING
                    } else if (token_text === 'function' && last_text == 'new') {
                        print_single_space();
                    } else if (is_special_word(last_text)) {
                        // no newline between 'return nnn'
                        print_single_space();
                    } else if (last_type !== 'TK_END_EXPR') {
                        if ((last_type !== 'TK_START_EXPR' || token_text !== 'var') && last_text !== ':') {
                            // no need to force newline on 'var': for (var x = 0...)
                            if (token_text === 'if' && last_word === 'else' && last_text !== '{') {
                                // no newline for } else if {
                                print_single_space();
                            } else {
                                flags.var_line = false;
                                flags.var_line_reindented = false;
                                print_newline();
                            }
                        }
                    } else if (in_array(token_text, line_starters) && last_text != ')') {
                        flags.var_line = false;
                        flags.var_line_reindented = false;
                        print_newline();
                    }
                } else if (is_array(flags.mode) && last_text === ',' && last_last_text === '}') {
                    print_newline(); // }, in lists get a newline treatment
                } else if (prefix === 'SPACE') {
                    print_single_space();
                }
                print_token();
                last_word = token_text;

                if (token_text === 'var') {
                    flags.var_line = true;
                    flags.var_line_reindented = false;
                    flags.var_line_tainted = false;
                }

                if (token_text === 'if') {
                    flags.if_line = true;
                }
                if (token_text === 'else') {
                    flags.if_line = false;
                }

                break;

            case 'TK_SEMICOLON':

                print_token();
                flags.var_line = false;
                flags.var_line_reindented = false;
                if (flags.mode == 'OBJECT') {
                    // OBJECT mode is weird and doesn't get reset too well.
                    flags.mode = 'BLOCK';
                }
                break;

            case 'TK_STRING':

                if (last_type === 'TK_END_EXPR' && in_array(flags.previous_mode, ['(COND-EXPRESSION)', '(FOR-EXPRESSION)'])) {
                    print_single_space();
                } else if (last_type == 'TK_STRING' || last_type === 'TK_START_BLOCK' || last_type === 'TK_END_BLOCK' || last_type === 'TK_SEMICOLON') {
                    print_newline();
                } else if (last_type === 'TK_WORD') {
                    print_single_space();
                }
                print_token();
                break;

            case 'TK_EQUALS':
                if (flags.var_line) {
                    // just got an '=' in a var-line, different formatting/line-breaking, etc will now be done
                    flags.var_line_tainted = true;
                }
                print_single_space();
                print_token();
                print_single_space();
                break;

            case 'TK_OPERATOR':

                var space_before = true;
                var space_after = true;

                if (flags.var_line && token_text === ',' && (is_expression(flags.mode))) {
                    // do not break on comma, for(var a = 1, b = 2)
                    flags.var_line_tainted = false;
                }

                if (flags.var_line) {
                    if (token_text === ',') {
                        if (flags.var_line_tainted) {
                            print_token();
                            flags.var_line_reindented = true;
                            flags.var_line_tainted = false;
                            print_newline();
                            break;
                        } else {
                            flags.var_line_tainted = false;
                        }
                        // } else if (token_text === ':') {
                        // hmm, when does this happen? tests don't catch this
                        // flags.var_line = false;
                    }
                }

                if (is_special_word(last_text)) {
                    // "return" had a special handling in TK_WORD. Now we need to return the favor
                    print_single_space();
                    print_token();
                    break;
                }

                if (token_text === ':' && flags.in_case) {
                    if (opt_indent_case) flags.case_body = true;
                    print_token(); // colon really asks for separate treatment
                    print_newline();
                    flags.in_case = false;
                    break;
                }

                if (token_text === '::') {
                    // no spaces around exotic namespacing syntax operator
                    print_token();
                    break;
                }

                if (token_text === ',') {
                    if (flags.var_line) {
                        if (flags.var_line_tainted) {
                            print_token();
                            print_newline();
                            flags.var_line_tainted = false;
                        } else {
                            print_token();
                            print_single_space();
                        }
                    } else if (last_type === 'TK_END_BLOCK' && flags.mode !== "(EXPRESSION)") {
                        print_token();
                        if (flags.mode === 'OBJECT' && last_text === '}') {
                            print_newline();
                        } else {
                            print_single_space();
                        }
                    } else {
                        if (flags.mode === 'OBJECT') {
                            print_token();
                            print_newline();
                        } else {
                            // EXPR or DO_BLOCK
                            print_token();
                            print_single_space();
                        }
                    }
                    break;
                    // } else if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS']) || in_array(last_text, line_starters) || in_array(last_text, ['==', '!=', '+=', '-=', '*=', '/=', '+', '-'])))) {
                } else if (in_array(token_text, ['--', '++', '!']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(last_text, line_starters)))) {
                    // unary operators (and binary +/- pretending to be unary) special cases
                    space_before = false;
                    space_after = false;

                    if (last_text === ';' && is_expression(flags.mode)) {
                        // for (;; ++i)
                        //        ^^^
                        space_before = true;
                    }
                    if (last_type === 'TK_WORD' && in_array(last_text, line_starters)) {
                        space_before = true;
                    }

                    if (flags.mode === 'BLOCK' && (last_text === '{' || last_text === ';')) {
                        // { foo; --i }
                        // foo(); --bar;
                        print_newline();
                    }
                } else if (token_text === '.') {
                    // decimal digits or object.property
                    space_before = false;

                } else if (token_text === ':') {
                    if (flags.ternary_depth == 0) {
                        flags.mode = 'OBJECT';
                        space_before = false;
                    } else {
                        flags.ternary_depth -= 1;
                    }
                } else if (token_text === '?') {
                    flags.ternary_depth += 1;
                }
                if (space_before) {
                    print_single_space();
                }

                print_token();

                if (space_after) {
                    print_single_space();
                }

                if (token_text === '!') {
                    // flags.eat_next_space = true;
                }

                break;

            case 'TK_BLOCK_COMMENT':

                var lines = token_text.split(/\x0a|\x0d\x0a/);

                if (all_lines_start_with(lines.slice(1), '*')) {
                    // javadoc: reformat and reindent
                    print_newline();
                    output.push(lines[0]);
                    for (i = 1; i < lines.length; i++) {
                        print_newline();
                        output.push(' ');
                        output.push(trim(lines[i]));
                    }

                } else {

                    // simple block comment: leave intact
                    if (lines.length > 1) {
                        // multiline comment block starts with a new line
                        print_newline();
                    } else {
                        // single-line /* comment */ stays where it is
                        if (last_type === 'TK_END_BLOCK') {
                            print_newline();
                        } else {
                            print_single_space();
                        }

                    }

                    for (i = 0; i < lines.length; i++) {
                        output.push(lines[i]);
                        output.push('\n');
                    }

                }
                if (look_up('\n') != '\n') print_newline();
                break;

            case 'TK_INLINE_COMMENT':
                print_single_space();
                print_token();
                if (is_expression(flags.mode)) {
                    print_single_space();
                } else {
                    force_newline();
                }
                break;

            case 'TK_COMMENT':

                // print_newline();
                if (wanted_newline) {
                    print_newline();
                } else {
                    print_single_space();
                }
                print_token();
                if (look_up('\n') != '\n') force_newline();
                break;

            case 'TK_UNKNOWN':
                if (is_special_word(last_text)) {
                    print_single_space();
                }
                print_token();
                break;
            }

            last_last_text = last_text;
            last_type = token_type;
            last_text = token_text;
        }

        var sweet_code = preindent_string + output.join('').replace(/[\n ]+$/, '');
        return sweet_code;

    }


Dom.ready(DocPlus.init);



