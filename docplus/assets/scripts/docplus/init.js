
DocPlus.initControllers = function(){
	//	  new DocPlus.HomeController(null, '', '', '<span class="x-icon x-icon-home"></span>', '首页');

	//    new DocPlus.APIController('api/index.js', 'api/data/', 'api', 'API');
	
	new DocPlus.ExampleController('examples/index.js', 'examples/', 'example', '示例');
	new DocPlus.Controller('tools/index.js', 'tools/', 'tools', '工具');

	
	if(!location.hash){
		location.hash = '#!api/';
	}
	
};

Dom.ready(DocPlus.init);



