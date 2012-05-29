﻿jsonp({"fullName":'System.Base.addEvent',"source":'base.js',"sourceFile":'data/source/base.js.html#System-Base-addEvent',"summary":'<p>\u4e3a\u5f53\u524d\u7c7b\u6dfb\u52a0\u4e8b\u4ef6\u3002</p>\n',"params":[{"type":'Object',"name":'evens',"defaultValue":'',"summary":'\u6240\u6709\u4e8b\u4ef6\u3002 \u5177\u4f53\u89c1\u4e0b\u3002'}],"returns":{"type":'',"summary":'this'},"remark":'<p>\n\u8fd9\u4e2a\u51fd\u6570\u662f\u5b9e\u73b0\u81ea\u5b9a\u4e49\u4e8b\u4ef6\u7684\u5173\u952e\u3002\n</p>\n\n<p>\naddEvents \u51fd\u6570\u7684\u53c2\u6570\u662f\u4e00\u4e2a\u4e8b\u4ef6\u4fe1\u606f\uff0c\u683c\u5f0f\u5982: {click: { add: ..., remove: ...,\ntrigger: ..., initEvent: ...} \u3002 \u5176\u4e2d click \u8868\u793a\u4e8b\u4ef6\u540d\u3002\u4e00\u822c\u5efa\u8bae\u4e8b\u4ef6\u540d\u662f\u5c0f\u5199\u7684\u3002\n</p>\n\n<p>\n\u4e00\u4e2a\u4e8b\u4ef6\u6709\u591a\u4e2a\u76f8\u5e94\uff0c\u5206\u522b\u662f: \u7ed1\u5b9a(add), \u5220\u9664(remove), \u89e6\u53d1(trigger)\n</p>\n\n<p></p>\n\u5f53\u7528\u6237\u4f7f\u7528 o.on(\'\u4e8b\u4ef6\u540d\', \u51fd\u6570) \u65f6\uff0c \u7cfb\u7edf\u4f1a\u5224\u65ad\u8fd9\u4e2a\u4e8b\u4ef6\u662f\u5426\u5df2\u7ecf\u7ed1\u5b9a\u8fc7\uff0c \u5982\u679c\u4e4b\u524d\u672a\u7ed1\u5b9a\u4e8b\u4ef6\uff0c\u5219\u4f1a\u521b\u5efa\u65b0\u7684\u51fd\u6570\nevtTrigger\uff0c evtTrigger \u51fd\u6570\u5c06\u904d\u5386\u5e76\u6267\u884c evtTrigger.handlers \u91cc\u7684\u6210\u5458,\n\u5982\u679c\u5176\u4e2d\u4e00\u4e2a\u51fd\u6570\u6267\u884c\u540e\u8fd4\u56de false\uff0c \u5219\u4e2d\u6b62\u6267\u884c\uff0c\u5e76\u8fd4\u56de false\uff0c \u5426\u5219\u8fd4\u56de true\u3002\nevtTrigger.handlers \u8868\u793a \u5f53\u524d\u8fd9\u4e2a\u4e8b\u4ef6\u7684\u6240\u6709\u5b9e\u9645\u8c03\u7528\u7684\u51fd\u6570\u7684\u6570\u7ec4\u3002\n\u7136\u540e\u7cfb\u7edf\u4f1a\u8c03\u7528 add(o,\n\'\u4e8b\u4ef6\u540d\', evtTrigger) \u7136\u540e\u628a evtTrigger \u4fdd\u5b58\u5728 o.data.$event[\'\u4e8b\u4ef6\u540d\'] \u4e2d\u3002\n\u5982\u679c \u4e4b\u524d\u5df2\u7ecf\u7ed1\u5b9a\u4e86\u8fd9\u4e2a\u4e8b\u4ef6\uff0c\u5219 evtTrigger \u5df2\u5b58\u5728\uff0c\u65e0\u9700\u521b\u5efa\u3002 \u8fd9\u65f6\u7cfb\u7edf\u53ea\u9700\u628a \u51fd\u6570 \u653e\u5230\nevtTrigger.handlers \u5373\u53ef\u3002\n</p></p>\n\n<p>\n\u4e5f\u5c31\u662f\u8bf4\uff0c\u771f\u6b63\u7684\u4e8b\u4ef6\u89e6\u53d1\u51fd\u6570\u662f evtTrigger\uff0c evtTrigger\u53bb\u6267\u884c\u7528\u6237\u5b9a\u4e49\u7684\u4e00\u4e2a\u4e8b\u4ef6\u5168\u90e8\u51fd\u6570\u3002\n</p>\n\n<p>\n\u5f53\u7528\u6237\u4f7f\u7528 o.un(\'\u4e8b\u4ef6\u540d\', \u51fd\u6570) \u65f6\uff0c \u7cfb\u7edf\u4f1a\u627e\u5230\u76f8\u5e94 evtTrigger\uff0c \u5e76\u4ece\nevtTrigger.handlers \u5220\u9664 \u51fd\u6570\u3002 \u5982\u679c evtTrigger.handlers \u662f\u7a7a\u6570\u7ec4\uff0c \u5219\u4f7f\u7528\nremove(o, \'\u4e8b\u4ef6\u540d\', evtTrigger) \u79fb\u9664\u4e8b\u4ef6\u3002\n</p>\n\n<p>\n\u5f53\u7528\u6237\u4f7f\u7528 o.trigger(\u53c2\u6570) \u65f6\uff0c \u7cfb\u7edf\u4f1a\u627e\u5230\u76f8\u5e94 evtTrigger\uff0c \u5982\u679c\u4e8b\u4ef6\u6709trigger\uff0c \u5219\u4f7f\u7528\ntrigger(\u5bf9\u8c61, \'\u4e8b\u4ef6\u540d\', evtTrigger, \u53c2\u6570) \u89e6\u53d1\u4e8b\u4ef6\u3002 \u5982\u679c\u6ca1\u6709\uff0c \u5219\u76f4\u63a5\u8c03\u7528\nevtTrigger(\u53c2\u6570)\u3002\n</p>\n\n<p>\n\u4e0b\u9762\u5206\u522b\u4ecb\u7ecd\u5404\u51fd\u6570\u7684\u5177\u4f53\u5185\u5bb9\u3002\n</p>\n\n<p>\nadd \u8868\u793a \u4e8b\u4ef6\u88ab\u7ed1\u5b9a\u65f6\u7684\u64cd\u4f5c\u3002 \u539f\u578b\u4e3a:\n</p>\n\n<pre>\nfunction add(elem, type, fn) {\n// \u5bf9\u4e8e\u6807\u51c6\u7684 DOM \u4e8b\u4ef6\uff0c \u5b83\u4f1a\u8c03\u7528 elem.addEventListener(type, fn, false);\n}\n</pre>\n\n<p>\nelem\u8868\u793a\u7ed1\u5b9a\u4e8b\u4ef6\u7684\u5bf9\u8c61\uff0c\u5373\u7c7b\u5b9e\u4f8b\u3002 type \u662f\u4e8b\u4ef6\u7c7b\u578b\uff0c \u5b83\u5c31\u662f\u4e8b\u4ef6\u540d\uff0c\u56e0\u4e3a\u591a\u4e2a\u4e8b\u4ef6\u7684 add \u51fd\u6570\u80af\u80fd\u4e00\u6837\u7684\uff0c\n\u56e0\u6b64 type \u662f\u533a\u5206\u4e8b\u4ef6\u7c7b\u578b\u7684\u5173\u952e\u3002fn \u5219\u662f\u7ed1\u5b9a\u4e8b\u4ef6\u7684\u51fd\u6570\u3002\n</p>\n\n<p>\nremove \u540c\u7406\u3002\n</p>\n\n<p>\ntrigger \u662f\u9ad8\u7ea7\u7684\u4e8b\u4ef6\u3002\u53c2\u8003\u4e0a\u9762\u7684\u8bf4\u660e\u3002\n</p>\n\n<p>\n\u5982\u679c\u4f60\u4e0d\u77e5\u9053\u5176\u4e2d\u7684\u51e0\u4e2a\u53c2\u6570\u529f\u80fd\uff0c\u7279\u522b\u662f trigger \uff0c\u8bf7\u4e0d\u8981\u81ea\u5b9a\u4e49\u3002\n</p>\n',"example":'<p>\u4e0b\u9762\u4ee3\u7801\u6f14\u793a\u4e86\u5982\u4f55\u7ed9\u4e00\u4e2a\u7c7b\u81ea\u5b9a\u4e49\u4e8b\u4ef6\uff0c\u5e76\u521b\u5efa\u7c7b\u7684\u5b9e\u4f8b\uff0c\u7136\u540e\u7ed1\u5b9a\u89e6\u53d1\u8fd9\u4e2a\u4e8b\u4ef6\u3002 <pre></p>\n\n<p>// \u521b\u5efa\u4e00\u4e2a\u65b0\u7684\u7c7b\u3002\nvar MyCls = new Class();</p>\n\n<p>MyCls.addEvent(\'click\', {</p>\n\n<p>add:  function (elem, type, fn) {\nalert(\"\u4e3a  elem \u7ed1\u5b9a \u4e8b\u4ef6 \" + type );\n}</p>\n\n<p>});</p>\n\n<p>var m = new MyCls;\nm.on(\'click\', function () {\nalert(\' \u4e8b\u4ef6 \u89e6\u53d1 \');\n});</p>\n\n<p>m.trigger(\'click\', 2);</p>\n\n<p></pre></p>\n',"name":'addEvent',"memberOf":'System.Base',"memberType":'method'});