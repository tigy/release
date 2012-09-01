



DocPlus.ExampleController = DocPlus.Controller.extend({
	
	
		/**
		 * 激活当前视图。
		 */
		activeView: function (view) {
			this.updateView(view);
		},

		deactiveView: function (view) {
			alert(1);
		},
		
		
});