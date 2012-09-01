
DocPlus.initControllers = function(){
	//	  new DocPlus.HomeController(null, '', '', '<span class="x-icon x-icon-home"></span>', '首页');

	new DocPlus.APIController('api/index.js', 'api/data/', 'api', 'API');
	
	//    new DocPlus.Controller('data/example.js', '../example/', 'example', '示例');

	
	if(!location.hash){
		location.hash = '#!api/';
	}
	
};

Dom.ready(DocPlus.init);



