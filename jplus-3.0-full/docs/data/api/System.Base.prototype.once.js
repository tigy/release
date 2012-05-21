﻿jsonp({"fullName":'System.Base.prototype.once',"source":'base.js',"sourceFile":'data/source/base.html#System-Base-prototype-once',"summary":'<p>\u589e\u52a0\u4e00\u4e2a\u53ea\u6267\u884c\u4e00\u6b21\u7684\u76d1\u542c\u8005\u3002</p>\n',"params":[{"type":'String',"name":'type',"defaultValue":'',"summary":'\u76d1\u542c\u540d\u5b57\u3002'},{"type":'Function',"name":'listener',"defaultValue":'',"summary":'\u8c03\u7528\u51fd\u6570\u3002'},{"type":'Object',"name":'bind',"defaultValue":'this',"summary":'listener \u6267\u884c\u65f6\u7684\u4f5c\u7528\u57df\u3002'}],"returns":{"type":'',"summary":'Base this'},"example":'<pre>\nelem.once(\'click\', function (e) {\ntrace(\'a\');  \n});\n\nelem.trigger(\'click\');   //  \u8f93\u51fa  a\nelem.trigger(\'click\');   //  \u6ca1\u6709\u8f93\u51fa \n</pre>\n',"name":'once',"memberOf":'System.Base',"memberType":'method'});