
DocPlus.initControllers = function(){
	new DocPlus.HomeController('<span class="x-icon x-icon-home"></span>', '首页');

	//    new DocPlus.APIController('api/index.js', 'api/data/', 'api', 'API');
	
	new DocPlus.IFrameController('examples', '示例', '查看示例代码');
	new DocPlus.IFrameController('tools', '工具', '开发常用的工具');

	
	if(!location.hash){
		location.hash = '#!api/';
	}
	
};

Dom.ready(DocPlus.init);



