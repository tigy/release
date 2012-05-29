﻿jsonp({"fullName":'Array.prototype.forEach',"source":'base.js',"sourceFile":'data/source/base.js.html#Array-prototype-forEach',"summary":'<p>\u904d\u5386\u5f53\u524d\u6570\u7ec4\uff0c\u5e76\u5bf9\u6570\u7ec4\u7684\u6bcf\u4e2a\u5143\u7d20\u6267\u884c\u51fd\u6570 <em>fn</em>\u3002</p>\n',"params":[{"type":'Function',"name":'fn',"summary":'<p>\u5bf9\u6bcf\u4e2a\u5143\u7d20\u8fd0\u884c\u7684\u51fd\u6570\u3002\u51fd\u6570\u7684\u53c2\u6570\u4f9d\u6b21\u4e3a:</p>\n\n<ul>\n<li>{Object} value \u5f53\u524d\u5143\u7d20\u7684\u503c\u3002</li>\n<li>{Number} index \u5f53\u524d\u5143\u7d20\u7684\u7d22\u5f15\u3002</li>\n<li>{Array} array \u5f53\u524d\u6b63\u5728\u904d\u5386\u7684\u6570\u7ec4\u3002</li>\n</ul>\n\n<p>\u53ef\u4ee5\u8ba9\u51fd\u6570\u8fd4\u56de <strong>false</strong> \u6765\u5f3a\u5236\u4e2d\u6b62\u5faa\u73af\u3002</p>\n'},{"type":'Object',"name":'bind',"defaultValue":'',"summary":'<p>\u5b9a\u4e49 <em>fn</em> \u6267\u884c\u65f6 <strong>this</strong> \u7684\u503c\u3002</p>\n'}],"see":['#each','Object.each','#filter','Object.map'],"remark":'<p>\u5728\u9ad8\u7248\u672c\u6d4f\u89c8\u5668\u4e2d\uff0cforEach \u548c each \u529f\u80fd\u5927\u81f4\u76f8\u540c\uff0c\u4f46\u662f forEach \u4e0d\u652f\u6301\u901a\u8fc7 return false \u4e2d\u6b62\u5faa\u73af\u3002\n\u5728\u4f4e\u7248\u672c(IE8-)\u6d4f\u89c8\u5668\u4e2d\uff0c forEach \u4e3a each \u7684\u522b\u540d\u3002 </p>\n\n<p>\u76ee\u524d\u9664\u4e86 IE8-\uff0c\u4e3b\u6d41\u6d4f\u89c8\u5668\u90fd\u5df2\u5185\u7f6e\u6b64\u51fd\u6570\u3002</p>\n',"example":'<p>\u4ee5\u4e0b\u793a\u4f8b\u6f14\u793a\u4e86\u5982\u4f55\u904d\u5386\u6570\u7ec4\uff0c\u5e76\u8f93\u51fa\u6bcf\u4e2a\u5143\u7d20\u7684\u503c\u3002 </p>\n\n<pre> \n[2, 5].forEach(function (value, key) {\ntrace(value);\n});\n// \u8f93\u51fa \'2\' \'5\'\n</pre>\n',"name":'forEach',"memberOf":'Array',"memberType":'method'});