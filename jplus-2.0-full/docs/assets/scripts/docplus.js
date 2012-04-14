/** * @author */var DocPlus = {    initGlobalViews: function () {        DocPlus.registerGlobalView('api', 'API', 'API', 'assets/data/api.js', function (name) {        });        DocPlus.registerGlobalView('examples', '示例', '全部示例', 'assets/data/example.js', '../');    },    /**	 * 初始化系统。	 */    init: function () {        DocPlus.loadOptions();        DocPlus.initLayout();        DocPlus.initGlobalViews();                DocPlus.options.views && DocPlus.options.views.forEach(DocPlus.navigate);        DocPlus.reload();    },    // 配置    options: {        sidebarWidth: 200,        views: []    },    /**	 * 载入默认配置。	 */    loadOptions: function () {    	var data = LocalStorage.getJSON('docOptions');    	if(data){	    	for(var item in DocPlus.options){	    		DocPlus.options[item] = data[item];		    	}    	}    },    saveOptions: function () {    	if(DocPlus.options.views)    		DocPlus.options.views.length = 0;    	else    		DocPlus.options.views = [];    		        for (var view in DocPlus.views) {            DocPlus.options.views.push(view);        }        LocalStorage.setJSON('docOptions', DocPlus.options);    },    // 界面    /**	 * 初始化左右布局。	 */    initLayout: function () {        DocPlus.initSplitter();        DocPlus.updateLayout();        DocPlus.initEvents();    },    /**	 * 初始化 splitter 的拖动事件。	 */    initSplitter: function () {        var draggable = new Draggable(Dom.get('splitter'));        draggable.onDragStart = function (e) {            this.target.addClass('x-splitter-proxy');            return true;        };        draggable.onDrag = function () {            this.to.y = this.from.y;            this.to.x = Math.min(1000, Math.max(150, this.to.x));            return true;        };        draggable.onDragEnd = function () {            DocPlus.updateSplitter(this.to.x);            this.target.removeClass('x-splitter-proxy');            return true;        };    },    /**	 * 当窗口更改大小之后，刷新页面布局。	 */    updateLayout: function () {        var height = document.getSize().y - Dom.get('header').getSize().y;        Dom.get('splitter').setHeight(height);        height -= 10;        Dom.get('doctree').setHeight(height - Dom.get('sidebar-toolbar').getSize().y - 10);        Dom.get('content').setHeight(height);        DocPlus.updateSplitter(DocPlus.options.sidebarWidth);        DocPlus.relayoutTab();    },    /**	 * 更新 splitter 位置。	 */    updateSplitter: function (sidebarWidth) {        Dom.get('sidebar').setWidth(sidebarWidth - 10);        Dom.get('splitter').setOffset({ x: sidebarWidth - 3 });        Dom.get('content').setWidth(document.getSize().x - sidebarWidth - 12);        DocPlus.options.sidebarWidth = sidebarWidth;    },    // 事件    /**	 * 绑定界面事件。	 */    initEvents: function () {        var win = new Dom(window);        win.on('unload', DocPlus.saveOptions);        win.on('hashchange', DocPlus.reload);        win.on('resize', DocPlus.updateLayout);                document.find('#tabs-more .x-icon-list').getParent().on('click', function () {
        	var menu = DocPlus.listMenu;	        if (!menu) {	            DocPlus.listMenu = menu = new ContextMenu().appendTo();	            menu.on('show', DocPlus.showMask);	            menu.on('hide', DocPlus.hideMask);	            menu.hide();	        }	        		    if(Dom.isHidden(menu.dom)){		        DocPlus.initViewListMenu(menu);		        menu.showBy(this, 'br');		   	} else {		   		menu.hide();		   	}
        });    },    // 页面        getCurrentName: function(){    	var href = location.href,     		i = href.indexOf("#");    	return i >= 0 ? href.substr(href.charAt(++i) === '!' ? i + 1 : i) : "";    },    /**	 * 根据页面上当前哈希值，重新加载页面。	 */    reload: function () {        DocPlus.navigate(DocPlus.getCurrentName());    },    /**	 * 显示指定哈希值的选项卡。	 */    navigate: function (name) {        // 检查指定的 view 是否存在，如果存在，则激活。否则，创建该视图。        var view = DocPlus.views[name];        if (!view) {        	        	view = DocPlus.globalViews[name];        	        	if(!view) {        		view = DocPlus.createView(name);        			            if (!view) {	                return;	            }            	DocPlus.views[name] = view;        		DocPlus.relayoutTab();            	        	} else if (view.dataJsPath) {                view.load();                // 防止第二次重新执行加载。                view.dataJsPath = null;            }        	        }        view.active();        document.body.scrollTop = 0;    },    // 视图    /**	 * 当前打开的全部视图。	 */    views: {},    /**     * 当前打开的视图数目。     */    viewCount: 0,    /**	 * 表示页面中一个选项卡视图。	 * @class	 */    View: Class({        /**		 * 当前视图的唯一名字。		 */        name: null,        /**		 * 当前视图对应的选项卡节点。		 */        tab: null,        /**		 * 当前视图对应的内容节点。		 */        content: null,        /**		 * 浏览历史上当前视图对应的下一个视图。		 */        nextView: null,        /**		 * 浏览历史上当前视图对应的上一个视图。		 */        previousView: null,        constructor: function (name) {            // 获取标题。            // var title = DocPlus.treeNodes[name];            //  var title = this.title = options.title || name || '　';            // 创建 tab 菜单。            this.tab = Dom.create('li');            Dom.create('a', 'x-closebutton')				.setAttr('href', 'javascript://关闭选项卡')				.setAttr('title', '关闭')				.setText('×')				.on('click', this.close, this)				.appendTo(this.tab);            Dom.create('a')				.setAttr('href', '#!' + name)				.setText(name)				.appendTo(this.tab);            this.tab.on('mouseup', this.onTabMouseUp, this);            this.tab.on('contextmenu', this.onTabContextMenu, this);            Dom.get('tabs').append(this.tab);            DocPlus.viewCount++;        },        //initContent: function (options) {        //    if (options.url) {        //        return ;        //    }        //    return Dom.create('div', 'content').setHtml(this.name);        //},        /**         * 同步当前视图所关联的节点菜单。         */        update: function () {            // 检查菜单。            var node = DocPlus.treeNodes[this.name];            if (node) {                // 更新标题                this.setTitle(node.getText());                var treeView = node.getTreeView();                // 激活 treeView                DocPlus.toggleTreeView(treeView);                // 激活 treeNode                treeView.setSelectedNode(node);                // 展开节点。                node.ensureVisible(0);            }        },        /**         * 激活当前视图。         */        active: function () {            var currentView = DocPlus.currentView;            if (currentView) {                // 如果视图相同，则不操作。                if (currentView === this)                    return;                currentView.deactive();                currentView.nextView = this;                this.previousView = currentView;            }            DocPlus.currentView = this;            // 显示当前选项卡。            this.tab.addClass('selected');            this.content.show();            this.update();        },        deactive: function () {            this.tab.removeClass('selected');            this.content.hide();        },        // UI        setTitle: function (value) {            this.tab.getLast().setAttr('title', value).setText(value);        },        setContent: function (contentDom) {            Dom.get('content').append(this.content = contentDom);        },        onTabMouseUp: function (e) {            switch (e.which) {                // // 鼠标左键。                // case 1:                // this.active();                // break;                // 鼠标中键。                case 2:                    e.stop();                    this.close();                    break;            }        },        onTabContextMenu: function (e) {            this.active();            DocPlus.showTabContextMenu(e);        },                setTabWidth: function(value){        	this.tab.setWidth(value);        },        close: function () {            var p = this.previousView, n = this.nextView;            this.tab.remove();            this.content.remove();            if (n)                n.previousTabPage = p;            if (p) {                p.nextTabPage = n;            }            if (DocPlus.currentView === this) {                DocPlus.currentView = null;                p && p.active();            }			DocPlus.lastView = this.name;            delete DocPlus.views[this.name];            DocPlus.viewCount--;            DocPlus.relayoutTab();        }    }),    HomeView: Class({        /**		 * 当前视图对应的选项卡节点。		 */        tab: null,        /**		 * 当前视图对应的内容节点。		 */        content: null,        /**		 * 浏览历史上当前视图对应的下一个视图。		 */        nextView: null,        /**		 * 浏览历史上当前视图对应的上一个视图。		 */        previousView: null,        constructor: function (prefix, text, title, dataJsPath, createViewFn) {            this.dataJsPath = dataJsPath,			this.tab = Dom.create('li').setHtml('<a href="#!' + prefix + '" title="' + title + '">' + text + '</a>').appendTo('navbar'),	        this.createView = typeof createViewFn === 'string' ? function (name) {	            return DocPlus.createIFrameView(name, createViewFn + name + '.html');	        } : createViewFn;            this.content = Dom.create('div', 'content').hide().appendTo('content');        },        /**         * 同步当前视图所关联的节点菜单。         */        update: function () {            // 检查菜单。            var node = DocPlus.treeNodes[this.name];            if (node) {                // 激活 treeView                DocPlus.toggleTreeView(node);            }        },        /**         * 激活当前视图。         */        active: function () {            var currentView = DocPlus.currentView;            if (currentView) {                // 如果视图相同，则不操作。                if (currentView === this)                    return;                currentView.deactive();                currentView.nextView = this;                this.previousView = currentView;            }            DocPlus.currentView = this;            this.content.show();            this.update();        },        deactive: function () {            this.content.hide();        },        load: function () {            // 如果第一次打开，则先栽入其数据地址。            var script = document.createElement('script');            script.src = this.dataJsPath;            script.type = 'text/javascript';            var h = document.getElementsByTagName('HEAD')[0];            h.insertBefore(script, h.lastChild);        }    }),    /**     * 创建指定名的视图。     */    createView: function (name) {        // 假设 name 是一个全局视图。        var globalView = DocPlus.globalViews[name.substr(0, name.indexOf('/'))];        // 如果第一次打开，则先栽入其数据地址。        if (globalView) {            // 如果第一次打开，则先栽入其数据地址。            if (globalView.dataJsPath) {                globalView.load();                // 防止第二次重新执行加载。                this.dataJsPath = null;            }            globalView = globalView.createView(name);            globalView.name = name;        }        return globalView;    },    /**	 * 生成并返回一个内容主题是 IFrame 的视图。	 */    createIFrameView: function (name, url) {        var view = new DocPlus.View(name);        view.setContent(Dom.create('iframe', 'content').setAttr('frameborder', '0').setAttr('src', url));        return view;    },    // 视图类型。    globalViews: {},    /**	 * 注册一个类型的视图。	 * @param {String} prefix 前缀字符串，只有name匹配此前缀时，才使用此视图类型来显示。	 * @param {String} [dataJsPath] 某个视图类型对应的初始化数据。	 * @param {Function/String} [createViewFn] 用来创建某个视图的函数。该函数参数是name地址，返回值是一个 View 。	 */    registerGlobalView: function (prefix, text, title, dataJsPath, createViewFn) {        DocPlus.globalViews[prefix] = new DocPlus.HomeView(prefix, text, title, dataJsPath, createViewFn);    },    // 导航    /**     * 所有树节点的 name -> TreeNode 的映射。     */    treeNodes: {},    currentTreeView: null,    toggleTreeView: function (treeView) {        if (DocPlus.currentTreeView) {            DocPlus.currentTreeView.tab.removeClass('selected');            DocPlus.currentTreeView.hide();        }        DocPlus.currentTreeView = treeView.show();        treeView.tab.addClass('selected');    },    compileTreeNode: function (data, parent, basePath) {        if (data) {            for (var n in data) {                var an = n.split('::'),					name = basePath + an[1],					node = DocPlus.treeNodes[name] = parent.nodes.add(an[0]).setHref('#!' + name);                DocPlus.compileTreeNode(data[n], node, basePath);            }        }    },    createTreeView: function (name, data) {        var treeView = DocPlus.treeNodes[name] = new TreeView().addClass('x-treeview-plain').appendTo('doctree');        DocPlus.compileTreeNode(data, treeView, name + '/');        treeView.tab = DocPlus.globalViews[name].tab;        return treeView;    },    initTreeView: function (name, data) {        Dom.ready(function () {            var treeView = DocPlus.createTreeView(name, data);            treeView.collapseTo();            DocPlus.toggleTreeView(treeView);                        // 菜单如果打开较慢，则更新当前的节点。                                    for(var view in DocPlus.views){            	DocPlus.views[view].update();            }        });    },    // 视图界面    	initViewListMenu: function(menu){    	menu.items.clear();    	menu.items.add('关闭全部').on('click', DocPlus.closeAllViews);    	menu.items.add('恢复关闭的选项卡').on('click', DocPlus.restoreLastView);    	//menu.items.add('-');    },    showMask: function () {        Dom.get('mask').show();    },    hideMask: function () {        Dom.get('mask').hide();    },	    showTabContextMenu: function (e) {        var menu = DocPlus.tabContextMenu;        if (!menu) {            DocPlus.tabContextMenu = menu = new ContextMenu();            menu.on('show', DocPlus.showMask);            menu.on('hide', DocPlus.hideMask);            menu.items.add('关闭').on('click', DocPlus.closeCurrentView);            // menu.items.add('-');
            // var subMenu = new Menu();
            // subMenu.items.add('默认');
            // subMenu.items.add('红色');
            // subMenu.items.add('绿色');
            // menu.items.add('标记').setSubMenu(subMenu);                     menu.items.add('-');            menu.items.add('恢复关闭的选项卡').on('click', DocPlus.closeCurrentView);           	   menu.items.add('-');               menu.items.add('关闭其它选项卡').on('click', DocPlus.closeOtherViews);            menu.items.add('全部关闭').on('click', DocPlus.closeAllViews);        }        menu.showAt(e.pageX, e.pageY);        e.stop();    },    closeCurrentView: function () {        DocPlus.currentView && DocPlus.currentView.close();    },    closeOtherViews: function () {        for (var i in DocPlus.views) {            var t = DocPlus.views[i];            if (t !== DocPlus.currentView) {                t.close();            }        }    },        restoreLastView: function () {    	DocPlus.lastView && DocPlus.navigate(DocPlus.lastView);    },    closeAllViews: function () {        for (var i in DocPlus.views) {            DocPlus.views[i].close();        }    },        setTabWidth: function(value){    	for(var view in DocPlus.views){    		DocPlus.views[view].setTabWidth(value);    	}    },    relayoutTab: function () {    	var totalWidth = Dom.get('tabs').getSize().x - 10;    	    	this.setTabWidth(Math.min(totalWidth / this.viewCount, 200));    }};Dom.ready(DocPlus.init);