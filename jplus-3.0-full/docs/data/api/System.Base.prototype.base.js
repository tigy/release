﻿jsonp({"fullName":'System.Base.prototype.base',"source":'base.js',"sourceFile":'data/source/base.html#System-Base-prototype-base',"summary":'<p>\u8c03\u7528\u7236\u7c7b\u7684\u6210\u5458\u53d8\u91cf\u3002</p>\n',"returns":{"type":'Object',"summary":'\u7236\u7c7b\u8fd4\u56de\u3002 \u6ce8\u610f\u53ea\u80fd\u4ece\u5b50\u7c7b\u4e2d\u8c03\u7528\u7236\u7c7b\u7684\u540c\u540d\u6210\u5458\u3002'},"memberAccess":'protected',"example":'<p><code>\n* var MyBa = new Class({\na: function (g, b) {\nalert(g + b);\n}\n});\n* var MyCls = MyBa.extend({\na: function (g, b) {\nthis.base(\'a\'); // \u8c03\u7528 MyBa#a \u6210\u5458\u3002\n}\n});\n* new MyCls().a();\n</code></p>\n',"name":'base',"memberOf":'System.Base',"memberType":'method'});