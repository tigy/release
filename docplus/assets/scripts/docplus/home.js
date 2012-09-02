



DocPlus.HomeController = DocPlus.Controller.extend({
	
	name: '',
	
	initHomeView: function(homeView){
		homeView.setHtml('这是首页');
		Dom.get('body').after(homeView.content);
	},
	
	activeView: function(view){
		Dom.get('body').hide();
	},
	
	deactiveView: function(view){
		Dom.get('body').show();
	},
	
	constructor: function(title, description){
	
		this.name = name;
		this.dataPath = name + '/';
		
		this.homeView = this.createHomeView(name, title, description);
		
		DocPlus.controllers[name] = this;
	}
	
});