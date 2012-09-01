

var CommentServerUrl = 'http://localhost:83/query.ashx';

// disqus.com

var CommentServer = {

	save: function (dom, hash) {

		new Request.JSONP({
			url: CommentServerUrl,
			data: {
				action: 'add',
				content: Dom.get(dom).find('.x-textbox').getText(),
				url: hash
			},
			success: function () {
				CommentServer.load(dom, hash);
			}
		}).send();
	},

	load: function (dom, hash) {
		if (!window.CommentServerUrl) {
			Dom.get(dom).setHtml('未配置社区服务器');
			return;
		}



		new Request.JSONP({
			url: CommentServerUrl,
			data: {
				action: 'get',
				url: hash
			},
			success: function (data) {
				Dom.get(dom).setHtml(Tpl.parse('\
{for comment in $data}\
{comment.content}\
<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{comment.date}</span>\
<hr>\
{end}\
<textarea class="x-textbox"></textarea>\
<br><br>\
<input type="button" class="x-button" value="提交" onclick="CommentServer.save(this.parentNode, \'' + hash + '\')">', data));
			},
			error: function () {
				Dom.get(dom).setHtml('无法连接到接口服务器');
			},
		}).send();
	}

};
