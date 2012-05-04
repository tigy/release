

DocData.examples = {

	dom: {
		'controls': {
			'form': {
				'textarea': 0,
				'textarea2': 0
			}
		}
	},

	members: {
		'controls': {
			name: '控件'
		},
		'controls.form': {
			name: '表单'
		},
		'controls.form.textarea': {
			name: '多行文本框'
		},
		'controls.form.textarea2': {
			name: '多行文本框2'
		}
	}
};

DocPlus.initTreeView('examples', {
	'表单::form/::1': {
		'多行文本框::controls/form/textarea::2': 0,
		'多行文本框2::controls/form/form/textarea2::5': 0
	},
	'按钮::button/::1':  {
		'多行文本框3::controls/form/form/textarea3::2': 0,
		'多行文本框4::controls/form/form/textarea4::5': 0
	}


});