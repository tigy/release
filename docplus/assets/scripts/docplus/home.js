



DocPlus.HomeController = DocPlus.Controller.extend({
	
	name: '',
	
	init: function(){
		this.homeView.setHtml('这是首页');
		Dom.get('body').after(this.homeView.container);
	},
	
	initHomeView: function(homeView){
		
	},
	
	activeView: function(view){
		Dom.get('body').hide();
	},
	
	deactiveView: function(view){
		Dom.get('body').show();
	}
	
});