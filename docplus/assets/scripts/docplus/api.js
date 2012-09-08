

DocPlus.APIController = DocPlus.Controller.extend({
	
	/**
	 * 初始化当前控制器对应的导航菜单。
	 */
	loadData: function (data) {
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
	initView: function(view){
		view.setHtml('加载中...'); 
		var dataPath = this.name + '/data/' + view.pathInfo + '.js';
		DocPlus.jsonp(dataPath, function(data){
			DocPlus.APIRender.render(view, data);
		}, function(){
			view.setHtml('无法载入数据: ' + dataPath);
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
		parent.add(treeNode);
		
		for(var item in domInfo){
			treeNode.setNodeType('plus');
			treeNode.once('expanding', function(){
				this.initChildren(treeNode, domInfo, memberInfo, pathInfo);
			}, this);
			break;
		}
	},
	
	initTreeNode: function (memberInfo, pathInfo, name) {
		memberInfo.treeNode.setText(name).setAttr('href', '#!' + this.name + '/' + pathInfo);
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
		view.setHtml(tpl);

		Object.each(view.container.dom.getElementsByTagName('ul'), function (node) {
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

		Object.each(view.container.dom.getElementsByTagName('pre'), function (node) {
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
		{if _.deprecated}[已过时]{end}\
		{DocPlus.APIRender.getReadableName(_.fullName, _.memberType)}\
		<small>{_.memberOf}</small>\
	</h1>\
	<hr>\
	<div class="doc-attrs">\
		<dl class="x-treeview-alt">\
			{if _.baseClasses || _.subClasses}\
			<dt>\
				继承关系:\
			</dt>\
			{for baseClass in _.baseClasses}\
			<dd class="x-treenode-last x-clear">\
				{for(var i = 1; i < @index; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
				{if @first}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{end}\
				{DocPlus.APIRender.getTypeLink(baseClass)}\
			</dd>\
			{end}\
			<dd class="x-treenode-last x-clear">\
				{if _.baseClasses}\
				{for(var i = 1; i < _.baseClasses.length; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
				{if _.baseClasses.length}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{end}\
				{end}\
				<strong>{_.name}</strong>\
			</dd>\
			{for subClass in _.subClasses}\
			<dd class="{if @last}x-treenode-last {end}x-clear">\
				{if _.baseClasses}\
				{for(var i = 1; i <= _.baseClasses.length; i++)}\
					<span class="x-treenode-space x-treenode-none"> </span>\
				{end}\
				{end}\
				<span class="x-treenode-space x-treenode-normal"> </span>\
				{DocPlus.APIRender.getTypeLink(subClass)}\
			</dd>\
			{end}\
			{end}\
			{if _.className}\
			<dt>\
				相关成员:\
			</dt>\
			<dd class="x-clear">\
				{DocPlus.APIRender.getTypeLink(_.className)}\
			</dd>\
			{end}\
			{if _.source}\
			<dt>\
				定义:\
			</dt>\
			<dd>\
				{if _.sourceFile}\
				<a target="_blank" href="{_.sourceFile}">{_.source}</a>\
				{else} \
				<a>{_.source}</a>\
				{end}\
			</dd>\
			{end}\
			{if _.since}\
			<dt>\
				版本:\
			</dt>\
			<dd>\
				{_.since}\
			</dd>\
			{end}\
		</dl>\
	</div>\
	{_.summary}\
	<h3>语法</h3>\
	<div class="doc-content">\
		<code lang="none" class="doc-syntax">{_.syntax || DocPlus.APIRender.getSyntax(_)}</code>\
	</div>\
	{if _.params}\
	<h4>参数</h4>\
	<div class="doc-content">\
		<dl class="doc-params">\
			{for param in _.params}\
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
	{if _.returns}\
	<h4>返回值</h4>\
	<div class="doc-content">\
		<dl class="doc-params">\
			<dt>\
				{DocPlus.APIRender.getTypeLink(_.returns.type)}\
			</dt>\
			<dd>\
				{_.returns.summary}\
			</dd>\
		</dl>\
	</div>\
	{end}\
	{if _.type}\
	<h4>类型</h4>\
	<div class="doc-content">\
		{DocPlus.APIRender.getTypeLink(_.type)}\
	</div>\
	{end}\
	{if _.defaultValue}\
	<h4>默认值</h4>\
	<div class="doc-content">\
		{_.defaultValue}\
	</div>\
	{end}\
	{for(var $memberType in DocPlus.APIRender.members)}\
	{if _[$memberType]}\
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
				{for member in _[$memberType]}\
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
	{if _.remark}\
	<h3>备注</h3>\
	<div class="doc-content">\
		{_.remark}\
	</div>\
	{end}\
	{if _.example}\
	<h3>示例</h3>\
	<div class="doc-content">\
		{_.example}\
	</div>\
	{end}\
	{if _.exceptions}\
	<h3>异常</h3>\
	<div class="doc-content">\
		<dl class="doc-params">\
			{for exception in _.exceptions}\
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
	{if _.memberOf || _.see}\
	<h3>另参考</h3>\
	<div class="doc-content">\
		<ul class="doc-ul">\
			{for see in _.see}\
				<li>\
					{{@link {see}}}\
				</li>\
			{end}\
			<li>\
				{{@link {$data.memberOf}}}\
			</li>\
		</ul>\
	</div>\
	{end}\
	<h3>社区</h3>\
	<div class="doc-content doc-club">\
		<a href="javascript:;" class="x-linkbutton" onclick="CommentServer.load(this.parentNode, \'#!api/{_.fullName}\')">获取社区内容</a>\
	</div>\
</div>'
	
	
};
