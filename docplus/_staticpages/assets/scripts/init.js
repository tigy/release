
DocPlus.initControllers = function(){
	new DocPlus.HomeController('', '<span class="x-icon x-icon-home"></span>', '首页');
	new DocPlus.APIController('api', '文档', '查看类库 API 文档');
	new DocPlus.IFrameController('examples', '示例', '查看示例代码');
	new DocPlus.IFrameController('tools', '工具', '开发常用的工具');

	
	// if(!location.hash){
		// location.hash = '#!api/';
	// }
	
};

Dom.ready(DocPlus.init);



