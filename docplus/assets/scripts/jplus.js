
/*********************************************************
 * This file is created by a tool at 2012/9/17 12:58
 *********************************************************/




/*********************************************************
 * System.Core.Base
 *********************************************************/
/**
 * J+ Library, 3
 * @projectDescription J+：轻便的、易扩展的UI组件。
 * @copyright 2011-2012 J+ Team
 * @fileOverview 定义最基本的工具函数。
 * @pragma defaultExtends JPlus.Base
 * @license The BSD License
 */

// 可用的宏
// 	CompactMode - 兼容模式 - 支持 IE6+ FF3+ Chrome10+ Opera10.5+ Safari5+ , 若无此宏，将只支持 HTML5。
// 	Publish - 启用发布操作 - 删除 assert 、 trace 、 imports 和 using 支持。


(function (window, undefined) {

	/// #region Core

	/**
	 * document 简写。
	 * @type Document
	 */
	var document = window.document,

        /**
         * Object 简写。
         * @type Function
         */
        Object = window.Object,

		/**
		 * Array.prototype 简写。
		 * @type  Object
		 */
		ap = Array.prototype,

		/**
		 * Object.prototype.toString 简写。
		 * @type Function
		 */
		toString = Object.prototype.toString,

		/**
		 * Object.prototype.hasOwnProperty 简写。
		 * @type Function
		 */
		hasOwnProperty = Object.prototype.hasOwnProperty,

		/**
		 * 空对象。
		 * @type Object
		 */
		emptyObj = {},

		/**
		 * 包含系统有关的函数。
		 * @type Object
		 * @namespace JPlus
		 */
		JPlus = window.JPlus = {

			/**
			 * 所有类的基类。
			 * @abstract class
			 * {@link JPlus.Base} 提供了全部类都具有的基本函数。
			 */
			Base: Base,

			/**
			 * 将一个原生的 Javascript 函数对象转换为一个类。
			 * @param {Function/Class} constructor 用于转换的对象，将修改此对象，让它看上去和普通的类一样。
			 * @return {Function} 返回生成的类。
			 * @remark 转换后的类将有继承、扩展等功能。
			 * @example <pre>
			 * function myFunc(){}
			 * 
			 * JPlus.Native(myFunc);
			 * 
			 * // 现在可以直接使用 implement 函数了。
			 * myFunc.implement({
			 * 	  a: 2
			 * });
			 * </pre>
			 */
			Native: function (constructor) {

				// JPlus 创建的类和普通的 Javascript 函数的最大区别在于:
				// JPlus 创建的类还拥有 classMembers 指定的成员。
				// 因此，将普通函数转换为 JPlus 类的方法就是复制 classMembers 下的方法。
				return extend(constructor, classMembers);
			},

			/**
			 * id种子 。
			 * @type Number
			 * @defaultValue 1
			 * @example 下例演示了 JPlus.id 的用处。
			 * <pre>
			 *		var uid = JPlus.id++;  // 每次使用之后执行 ++， 保证页面内的 id 是唯一的。
			 * </pre>
			 */
			id: 1,

			/**
			 * 获取当前框架的版本号。
			 * @getter
			 */
			version: /*@VERSION*/3.2

		},
		
		/**
		 * 类成员方法。
		 * @type Object
		 * @namespace JPlus.Base
		 */
		classMembers = {

			/**
			 * 扩展当前类的动态方法。
			 * @param {Object} members 用于扩展的成员列表。
			 * @return this
			 * @see #implementIf
			 * @example 以下示例演示了如何扩展 Number 类的成员。<pre>
			 * Number.implement({
			 *   sin: function () {
			 * 	    return Math.sin(this);
			 *  }
			 * });
			 *
			 * (1).sin();  //  Math.sin(1);
			 * </pre>
			 */
			implement: function (members) {

				assert(this.prototype, "MyClass.implement(members): 无法扩展当前类，因为当前类的 prototype 为空。");

				// 直接将成员复制到原型上即可 。
				Object.extend(this.prototype, members);

				return this;
			},

			/**
			 * 扩展当前类的动态方法，但不覆盖已存在的成员。
			 * @param {Object} members 成员。
			 * @return this
			 * @see #implement
			 */
			implementIf: function (members) {

				assert(this.prototype, "MyClass.implementIf(members): 无法扩展当前类，因为当前类的 prototype 为空。");

				Object.extendIf(this.prototype, members);

				return this;
			},

			/**
			 * 添加当前类的动态方法，该方法基于某个属性的同名方法实现。
			 * @param {String} targetProperty 要基于的属性名。
			 * @param {String} setters=undefined 设置函数的方法名数组，用空格隔开。
			 * @param {String} getters=undefined 获取函数的方法名数组，用空格隔开。
			 * @example <pre>
			 * MyClass.defineMethods('field', 'fn1 fn2 fn3');
			 * </pre>
			 * 等价于 <pre>
			 * MyClass.implement({
			 * 		fn1:  function(){ 
			 * 			return this.field.fn1();  
			 * 		},
			 * 		fn2:  function(){ 
			 * 			return this.field.fn2();  
			 * 		},
			 * 		fn3:  function(){ 
			 * 			this.field.fn();
			 * 			return this;
			 * 		}
			 * 	// 如果源函数返回 this, 将更新为当前的 this 。
			 * });
			 * </pre>
			 */
			defineMethods: function(targetProperty, methods, args) {
				
				assert.isString(methods, "MyClass.defineMethods(targetProperty, methods): {methods} ~");
				
				var propertyGetterFunc;
				
				if(/\(\)$/.test(targetProperty)){
					propertyGetterFunc = targetProperty.substr(0, targetProperty.length - 2);
				}
				
				// 最后使用 implement 添加成员。
				return this.implement(Object.map(methods, function(fnName) {
					return function() {
						
						// 获取实际调用的函数目标对象。
						var target = propertyGetterFunc ? this[propertyGetterFunc]() : this[targetProperty],
							r;
							
						assert(target, "#" + targetProperty + " 不能为空。");
						assert(!target || Object.isFunction(target[fnName]), "#" + targetProperty + "." + fnName + "(): 不是函数。");
						
						// 调用被代理的实际函数。
						r = target[fnName].apply(target, arguments);
						
						// 如果不是 getter，返回 this 链式引用。
						return target === r || r === undefined ? this : r;
					};
				}, {}), args);  // 支持 Dom.implement, 传递第二个参数。
			},

			/**
			 * 为当前类注册一个事件。
			 * @param {String} eventName 事件名。如果多个事件使用空格隔开。
			 * @param {Object} properties={} 事件信息。 具体见备注。
			 * @return this
			 * @remark
			 * 事件信息是一个JSON对象，它表明了一个事件在绑定、删除和触发后的一些操作。
			 *
			 * 事件信息的原型如:
			 * <pre>
			 * ({
			 *
			 *  // 当用户执行 target.on(type, fn) 时执行下列函数:
			 * 	add: function(target, type, fn){
			 * 		// 其中 target 是目标对象，type是事件名， fn是执行的函数。
			 *  },
			 *
			 *  // 当用户执行 target.un(type, fn) 时执行下列函数:
			 *  remove: function(target, type, fn){
			 * 		// 其中 target 是目标对象，type是事件名， fn是执行的函数。
			 *  },
			 *
			 *  // 当用户执行 target.trigger(e) 时执行下列函数:
			 *  dispatch: function(target, type, fn, e){
			 * 		// 其中 target 是目标对象，type是事件名， fn是执行的函数。e 是参数。
			 *  }
			 *
			 * });
			 * </pre>
			 *
			 * 当用户使用 obj.on('事件名', 函数) 时， 系统会判断这个事件是否已经绑定过， 如果之前未绑定事件，则会创建新的函数
			 * evtTrigger， evtTrigger 函数将遍历并执行 evtTrigger.handlers 里的成员,
			 * 如果其中一个函数执行后返回 false， 则中止执行，并返回 false， 否则返回 true。
			 * evtTrigger.handlers 表示 当前这个事件的所有实际调用的函数的数组。
			 * 然后系统会调用 add(obj, '事件名', evtTrigger) 然后把 evtTrigger 保存在 obj.dataField().$event['事件名'] 中。
			 * 如果 之前已经绑定了这个事件，则 evtTrigger 已存在，无需创建。 这时系统只需把 函数 放到 evtTrigger.handlers 即可。
			 *
			 * 真正的事件触发函数是 evtTrigger， evtTrigger会执行 initEvent 和用户定义的一个事件全部函数。
			 *
			 * 当用户使用 obj.un('事件名', 函数) 时， 系统会找到相应 evtTrigger， 并从
			 * evtTrigger.handlers 删除 函数。 如果 evtTrigger.handlers 是空数组， 则使用
			 * remove(obj, '事件名', evtTrigger) 移除事件。
			 *
			 * 当用户使用 obj.trigger(参数) 时， 系统会找到相应 evtTrigger， 如果事件有trigger， 则使用
			 * dispatch(obj, '事件名', evtTrigger, 参数) 触发事件。 如果没有， 则直接调用
			 * evtTrigger(参数)。
			 *
			 * 下面分别介绍各函数的具体内容。
			 *
			 * add 表示 事件被绑定时的操作。 原型为:
			 *
			 * <pre>
			 * function add(elem, type, fn) {
			 * 	   // 对于标准的 DOM 事件， 它会调用 elem.addEventListener(type, fn, false);
			 * }
			 * </pre>
			 *
			 * elem表示绑定事件的对象，即类实例。 type 是事件类型， 它就是事件名，因为多个事件的 add 函数肯能一样的，
			 * 因此 type 是区分事件类型的关键。fn 则是绑定事件的函数。
			 *
			 * remove 类似 add。
			 *
			 * $default 是特殊的事件名，它的各个信息将会覆盖同类中其它事件未定义的信息。
			 *
			 * @example 下面代码演示了如何给一个类自定义事件，并创建类的实例，然后绑定触发这个事件。
			 * <pre>
			 * // 创建一个新的类。
			 * var MyCls = new Class();
			 *
			 * MyCls.addEvents('click', {
			 *
			 * 		add:  function (elem, type, fn) {
			 * 	   		alert("为  elem 绑定 事件 " + type );
			 * 		}
			 *
			 * });
			 *
			 * var m = new MyCls;
			 * m.on('myEvt', function () {  //  输出 为  elem 绑定 事件  myEvt
			 * 	  alert(' 事件 触发 ');
			 * });
			 *
			 * m.trigger('myEvt', 2);
			 *
			 * </pre>
			 */
			addEvents: function (eventName, properties) {

				assert.isString(eventName, "MyClass.addEvents(eventName, properties): {eventName} ~");
				
				// 获取存储事件信息的变量。如果不存在则创建。
				var eventObj = this.$event || (this.$event = {}),
					defaultEvent = eventObj.$default;
					
				if(properties) {
					Object.extendIf(properties, defaultEvent);
					
					// 处理 base: 'event' 字段，自动生成 add 和 remove 函数。
					if(properties.base) {
						assert(defaultEvent, "使用 base 字段功能必须预先定义 $default 事件。");
						properties.add = function(obj, type, fn){
							defaultEvent.add(obj, this.base, fn);
						};
						
						properties.remove = function(obj, type, fn){
							defaultEvent.remove(obj, this.base, fn);
						};
					}
				} else {
					properties = defaultEvent || emptyObj;
				}

				// 将 eventName 指定的事件对象都赋值为 properties。
				Object.map(eventName, properties, eventObj);

				return this;
			},

			/**
			 * 继承当前类创建并返回子类。
			 * @param {Object/Function} [methods] 子类的员或构造函数。
			 * @return {Function} 返回继承出来的子类。
			 * @remark
			 * 在 Javascript 中，继承是依靠原型链实现的， 这个函数仅仅是对它的包装，而没有做额外的动作。
			 *
			 * 成员中的 constructor 成员 被认为是构造函数。
			 *
			 * 这个函数实现的是 单继承。如果子类有定义构造函数，则仅调用子类的构造函数，否则调用父类的构造函数。
			 *
			 * 要想在子类的构造函数调用父类的构造函数，可以使用 {@link JPlus.Base#base} 调用。
			 *
			 * 这个函数返回的类实际是一个函数，但它被 {@link JPlus.Native} 修饰过。
			 *
			 * 由于原型链的关系， 肯能存在共享的引用。 如: 类 A ， A.prototype.c = []; 那么，A的实例 b ,
			 * d 都有 c 成员， 但它们共享一个 A.prototype.c 成员。 这显然是不正确的。所以你应该把 参数 quick
			 * 置为 false ， 这样， A创建实例的时候，会自动解除共享的引用成员。 当然，这是一个比较费时的操作，因此，默认
			 * quick 是 true 。
			 *
			 * 也可以把动态成员的定义放到 构造函数， 如: this.c = []; 这是最好的解决方案。
			 *
			 * @example 下面示例演示了如何创建一个子类。
			 * <pre>
			 * var MyClass = new Class(); //创建一个类。
			 *
			 * var Child = MyClass.extend({  // 创建一个子类。
			 * 	  type: 'a'
			 * });
			 *
			 * var obj = new Child(); // 创建子类的实例。
			 * </pre>
			 */
			extend: function (members) {

				// 未指定函数 使用默认构造函数(Object.prototype.constructor);

				// 生成子类 。
				var subClass = hasOwnProperty.call(members = members instanceof Function ? {
					constructor: members
				} : (members || {}), "constructor") ? members.constructor : function () {

					// 调用父类构造函数 。
					arguments.callee.base.apply(this, arguments);

				};

				// 代理类 。
				emptyFn.prototype = (subClass.base = this).prototype;

				// 指定成员 。
				subClass.prototype = Object.extend(new emptyFn, members);

				// 覆盖构造函数。
				subClass.prototype.constructor = subClass;

				// 清空临时对象。
				emptyFn.prototype = null;

				// 创建类 。
				return JPlus.Native(subClass);

			}

		};

	/// #endregion

	/// #region Functions

	/**
	 * 系统原生的对象。
	 * @static class Object
	 */
	extend(Object, {

		/// #if CompactMode

		/**
		 * 复制对象的所有属性到其它对象。
		 * @param {Object} dest 复制的目标对象。
		 * @param {Object} src 复制的源对象。
		 * @return {Object} 返回 *dest*。
		 * @see Object.extendIf
		 * @example <pre>
	     * var a = {v: 3}, b = {g: 2};
	     * Object.extend(a, b);
	     * trace(a); // {v: 3, g: 2}
	     * </pre>
		 */
		extend: (function () {
			for (var item in {
				toString: 1
			})
				return extend;

			JPlus.enumerables = "toString hasOwnProperty valueOf constructor isPrototypeOf".split(' ');
			// IE6 不会遍历系统对象需要复制，所以强制去测试，如果改写就复制 。
			return function (dest, src) {
				if (src) {
					assert(dest != null, "Object.extend(dest, src): {dest} 不可为空。", dest);

					for (var i = JPlus.enumerables.length, value; i--;)
						if (hasOwnProperty.call(src, value = JPlus.enumerables[i]))
							dest[value] = src[value];
					extend(dest, src);
				}

				return dest;
			}
		})(),

		/// #else

		/// extend: extend,

		/// #endif

		/**
		 * 复制对象的所有属性到其它对象，但不覆盖原对象的相应值。
		 * @param {Object} dest 复制的目标对象。
		 * @param {Object} src 复制的源对象。
		 * @return {Object} 返回 *dest*。
		 * @see Object.extend
		 * @example
		 * <pre>
	     * var a = {v: 3, g: 5}, b = {g: 2};
	     * Object.extendIf(a, b);
	     * trace(a); // {v: 3, g: 5}  b 未覆盖 a 任何成员。
	     * </pre>
		 */
		extendIf: function (dest, src) {

			assert(dest != null, "Object.extendIf(dest, src): {dest} 不可为空。", dest);

			// 和 extend 类似，只是判断目标的值，如果不是 undefined 然后拷贝。
			for (var b in src)
				if (dest[b] === undefined)
					dest[b] = src[b];
			return dest;
		},

		/**
		 * 遍历一个类数组，并对每个元素执行函数 *fn*。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 可以让函数返回 **false** 来强制中止循环。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @return {Boolean} 如果循环是因为 *fn* 返回 **false** 而中止，则返回 **false**， 否则返回 **true**。
		 * @see Array#each
		 * @see Array#forEach
		 * @example
		 * <pre>
	     * Object.each({a: '1', c: '3'}, function (value, key) {
	     * 		trace(key + ' : ' + value);
	     * });
	     * // 输出 'a : 1' 'c : 3'
	     * </pre>
		 */
		each: function (iterable, fn, scope) {

			assert(!Object.isFunction(iterable), "Object.each(iterable, fn, scope): {iterable} 不能是函数。 ", iterable);
			assert(Object.isFunction(fn), "Object.each(iterable, fn, scope): {fn} 必须是函数。", fn);
			
			// 如果 iterable 是 null， 无需遍历 。
			if (iterable != null) {

				// 普通对象使用 for( in ) , 数组用 0 -> length 。
				if (typeof iterable.length !== "number") {

					// Object 遍历。
					for (var key in iterable)
						if (fn.call(scope, iterable[key], key, iterable) === false)
							return false;
				} else {
					return each.call(iterable, fn, scope);
				}

			}

			// 正常结束返回 true。
			return true;
		},

		/**
		 * 遍历一个类数组对象并调用指定的函数，返回每次调用的返回值数组。
		 * @param {Array/String/Object} iterable 任何对象，不允许是函数。如果是字符串，将会先将字符串用空格分成数组。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @param {Object} [dest] 仅当 *iterable* 是字符串时，传递 *dest* 可以将函数的返回值保存到 dest。
		 * @return {Object/Undefiend} 返回的结果对象。当 *iterable* 是字符串时且未指定 dest 时，返回空。
		 * @example
		 * <pre>
		 * 
		 * // 传统的 map 用法:
		 * 
	     * Object.map(["a","b"], function(a){
	     * 	  return a + a;
	     * }); // => ["aa", "bb"];
	     *
	     * Object.map({a: "a", b: "b"}, function(a){
	     * 	  return a + a
	     * }); // => {a: "aa", b: "bb"};
	     *
	     * Object.map({length: 1, "0": "a"}, function(a){
	     * 	   return a + a
	     * }); // => ["a"];
	     * 
	     * // 字符串 map 用法:
	     *
	     * Object.map("a b", function(a){
	     * 		return a + a
	     * }, {}); // => {a: "aa", b: "bb"};
	     *
	     * Object.map("a b", function(a){
	     * 		return a + a
	     * }); // => undefined; 注意: 如果未指定 dest，则结果值将丢失。
	     *
	     * Object.map("a b", 3, {}); // => {a: 3, b: 3};
	     * </pre>
		 */
		map: function (iterable, fn, dest) {

			var actualFn;

			// 如果是目标对象是一个字符串，则改为数组。
			if (typeof iterable === 'string') {
				iterable = iterable.split(' ');
				actualFn = typeof fn === 'function' ? dest ? function (value, key, array) {
					this[value] = fn(value, key, array);
				} : fn : function(value){
					this[value] = fn;
				}
			} else {
				dest = typeof iterable.length !== "number" ? {} : [];
				actualFn = function (value, key, array) {
					this[key] = fn(value, key, array);
				};
			}

			// 遍历对象。
			Object.each(iterable, actualFn, dest);

			// 返回目标。
			return dest;
		},

		/**
		 * 判断一个变量是否是数组。
		 * @param {Object} obj 要判断的变量。
		 * @return {Boolean} 如果是数组，返回 true， 否则返回 false。
		 * @example
		 * <pre>
	     * Object.isArray([]); // true
	     * Object.isArray(document.getElementsByTagName("div")); // false
	     * Object.isArray(new Array); // true
	     * </pre>
		 */
		isArray: Array.isArray || function (obj) {
			return toString.call(obj) === "[object Array]";
		},

		/**
		 * 判断一个变量是否是函数。
		 * @param {Object} obj 要判断的变量。
		 * @return {Boolean} 如果是函数，返回 true， 否则返回 false。
		 * @example
		 * <pre>
	     * Object.isFunction(function () {}); // true
	     * Object.isFunction(null); // false
	     * Object.isFunction(new Function); // true
	     * </pre>
		 */
		isFunction: function (obj) {
			return toString.call(obj) === "[object Function]";
		},

		/**
		 * 判断一个变量是否是引用变量。
		 * @param {Object} obj 变量。
		 * @return {Boolean} 如果 *obj* 是引用变量，则返回 **true**, 否则返回 **false** 。
		 * @remark 此函数等效于 `obj !== null && typeof obj === "object"`
		 * @example
		 * <pre>
	     * Object.isObject({}); // true
	     * Object.isObject(null); // false
	     * </pre>
		 */
		isObject: function (obj) {
			// 只检查 null 。
			return obj !== null && typeof obj === "object";
		}

	});

	/**
	 * @static class Function
	 */
	extend(Function, {

		/**
		 * 表示一个空函数。这个函数总是返回 undefined 。
		 * @property
		 * @type Function
		 * @remark
		 * 在定义一个类的抽象函数时，可以让其成员的值等于 **Function.empty** 。
		 */
		empty: emptyFn,

		/**
		 * 返回一个新函数，这个函数始终返回 *value*。
		 * @param {Object} value 需要返回的参数。
		 * @return {Function} 执行得到参数的一个函数。
		 * @example
		 * <pre>
		 * var fn = Function.from(0);
	     * fn()    // 0
	     * </pre>
	 	 */
		from: function (value) {

			// 返回一个值，这个值是当前的参数。
			return function () {
				return value;
			}
		}

	});

	/**
	 * 格式化指定的字符串。
	 * @param {String} formatString 要格式化的字符串。格式化的方式见备注。
	 * @param {Object} ... 格式化用的参数。
	 * @return {String} 格式化后的字符串。
  	 * @remark 
  	 * 
  	 * 格式化字符串中，使用 {0} {1} ... 等元字符来表示传递给 String.format 用于格式化的参数。
  	 * 如 String.format("{0} 年 {1} 月 {2} 日", 2012, 12, 32) 中， {0} 被替换成 2012，
  	 * {1} 被替换成 12 ，依次类推。
  	 * 
  	 * String.format 也支持使用一个 JSON来作为格式化参数。
  	 * 如 String.format("{year} 年 {month} 月 ", { year: 2012, month:12});
  	 * 若要使用这个功能，请确保 String.format 函数有且仅有 2个参数，且第二个参数是一个 Object。
  	 * 
  	 * 格式化的字符串{}不允许包含空格。
  	 * 
  	 * 默认地，String.format 将使用函数的作用域(默认为 String) 函数将参数格式化为字符串后填入目标字符串。
  	 * 因此在使用 String.format 时，应该保证 String.format 的作用域为 String 或其它格式化函数。
  	 * 
  	 * 如果需要在格式化字符串中出现 { 和 }，请分别使用 {{ 和 }} 替代。
	 * 不要出现{{{ 和 }}} 这样将获得不可预知的结果。
	 * @memberOf String
	 * @example <pre>
	 *  String.format("{0}转换", 1); //  "1转换"
	 *  String.format("{1}翻译",0,1); // "1翻译"
	 *  String.format("{a}翻译",{a:"也可以"}); // 也可以翻译
	 *  String.format("{{0}}不转换, {0}转换", 1); //  "{0}不转换1转换"
	 * </pre>
	 */
	String.format = function (formatString, args) {

		assert(!formatString || formatString.replace, 'String.format(formatString, args): {formatString} 必须是字符串。', formatString);

		// 支持参数2为数组或对象的直接格式化。
		var toString = this;

		args = arguments.length === 2 && Object.isObject(args) ? args : ap.slice.call(arguments, 1);

		// 通过格式化返回
		return formatString ? formatString.replace(/\{+?(\S*?)\}+/g, function (match, name) {
			var start = match.charAt(1) == '{', end = match.charAt(match.length - 2) == '}';
			if (start || end)
				return match.slice(start, match.length - end);
			return name in args ? toString(args[name]) : "";
		}) : "";
	};

	/**
	 * 将一个伪数组对象转为原生数组。
	 * @param {Object} iterable 一个伪数组对象。
	 * @param {Number} startIndex=0 转换开始的位置。
	 * @return {Array} 返回新数组，其值和 *value* 一一对应。
	 * @memberOf Array
	 * @remark iterable 不支持原生的 DomList 对象。
	 * @example
	 * <pre>
     * // 将 arguments 对象转为数组。
     * Array.create(arguments); // 返回一个数组
     *
     * // 获取数组的子集。
     * Array.create([4,6], 1); // [6]
     *
     * // 处理伪数组。
     * Array.create({length: 1, "0": "value"}); // ["value"]
     *
     * </pre>
	 */
	Array.create = function (iterable, startIndex) {
		// if(!iterable)
		// return [];

		// [DOM Object] 。
		// if(iterable.item) {
		// var r = [], len = iterable.length;
		// for(startIndex = startIndex || 0; startIndex < len;
		// startIndex++)
		// r[startIndex] = iterable[startIndex];
		// return r;
		// }

		assert(!iterable || toString.call(iterable) !== '[object HTMLCollection]' || typeof iterable.length !== 'number', 'Array.create(iterable, startIndex): {iterable} 不允许是 NodeList 。', iterable);

		// 调用 slice 实现。
		return iterable ? ap.slice.call(iterable, startIndex) : [];
	};

	/// #if CompactMode

	/**
	 * 系统原生的日期对象。
	 * @class Date
	 */
	if (!Date.now) {

		/**
		 * 获取当前时间的数字表示。
		 * @return {Number} 当前的时间点。
		 * @static
		 * @example
		 * <pre>
		 * Date.now(); //   相当于 new Date().getTime()
		 * </pre>
		 */
		Date.now = function () {
			return +new Date;
		};

	}

	/// #endif

	/**
	 * @namespace window
	 */

	/**
	 * 创建一个类。
	 * @param {Object/Function} [methods] 类成员列表对象或类构造函数。
	 * @return {Function} 返回创建的类。
	 * @see JPlus.Base
	 * @see JPlus.Base.extend
	 * @example 以下代码演示了如何创建一个类:
	 * <pre>
	 * var MyCls = Class({
	 *
	 *    constructor: function (a, b) {
	 * 	      alert('构造函数执行了 ' + a + b);
	 *    },
	 *
	 *    say: function(){
	 *    	alert('调用了 say 函数');
	 *    }
	 *
	 * });
	 *
	 *
	 * var c = new MyCls('参数1', '参数2');  // 创建类。
	 * c.say();  //  调用 say 方法。
	 * </pre>
	 */
	window.Class = function (members) {
		
		// 所有类都是继承 JPlus.Base 创建的。
		return Base.extend(members);
	};

	if (!window.execScript) {

		/**
		 * 在全局作用域运行一个字符串内的代码。
		 * @param {String} statement Javascript 语句。
		 * @example
		 * <pre>
		 * execScript('alert("hello")');
		 * </pre>
		 */
		window.execScript = function (statements) {

			assert.isString(statements, "execScript(statements): {statements} ~");

			// 如果正常浏览器，使用 window.eval 。
			window["eval"].call(window, statements);

		};

	}

	/// #endregion

	/// #region Navigator

	/**
	 * 系统原生的浏览器对象实例。
	 * @type Navigator
	 * @namespace navigator
	 */
	(function (navigator) {

		// 检查信息
		var ua = navigator.userAgent,

			match = ua.match(/(IE|Firefox|Chrome|Safari|Opera)[\/\s]([\w\.]*)/i) || ua.match(/(WebKit|Gecko)[\/\s]([\w\.]*)/i) || [0, "", 0],

			// 浏览器名字。
			browser = match[1],
			
			// IE678 = false, 其它 = true
			isStd = !!+"\v1";

		navigator["is" + browser] = navigator["is" + browser + parseInt(match[2])] = true;

		/**
		 * 获取一个值，该值指示是否为 IE 浏览器。
		 * @getter isIE
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE6 浏览器。
		 * @getter isIE6
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE7 浏览器。
		 * @getter isIE7
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE8 浏览器。
		 * @getter isIE8
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE9 浏览器。
		 * @getter isIE9
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 IE10 浏览器。
		 * @getter isIE10
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Firefox 浏览器。
		 * @getter isFirefox
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Chrome 浏览器。
		 * @getter isChrome
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Opera 浏览器。
		 * @getter isOpera
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Opera10 浏览器。
		 * @getter isOpera10
		 * @type Boolean
		 */

		/**
		 * 获取一个值，该值指示是否为 Safari 浏览器。
		 * @getter isSafari
		 * @type Boolean
		 */

		// 结果
		extend(navigator, {

			/// #if CompactMode

			/**
			 * 判断当前浏览器是否符合W3C标准。
			 * @getter
			 * @type Boolean
			 * @remark 就目前浏览器状况， 除了 IE6, 7, 8， 其它浏览器都返回 true。
			 */
			isStd: isStd,

			/**
			 * 获取一个值，该值指示当前浏览器是否支持标准事件。
			 * @getter
			 * @type Boolean
			 * @remark 就目前浏览器状况， IE6，7 中 isQuirks = true 其它浏览器都为 false 。
			 */
			isQuirks: !isStd && !Object.isObject(document.constructor),

			/// #endif

			/**
			 * 获取当前浏览器的名字。
			 * @getter
			 * @type String
			 * @remark
			 * 肯能的值有:
			 *
			 * - IE
			 * - Firefox
			 * - Chrome
			 * - Opera
			 * - Safari
			 *
			 * 对于其它非主流浏览器，返回其 HTML 引擎名:
			 *
			 * - Webkit
			 * - Gecko
			 * - Other
			 */
			name: browser,

			/**
			 * 获取当前浏览器版本。
			 * @getter
			 * @type String
			 * @remark 输出的格式比如 6.0.0 。 这是一个字符串，如果需要比较版本，应该使用
			 * <pre>
			 *       parseFloat(navigator.version) <= 5.5 。
			 * </pre>
			 */
			version: match[2]

		});

	})(window.navigator);

	/// #endregion

	/// #region Methods

	// 把所有内建对象本地化 。
	each.call([String, Array, Function, Date, Base], JPlus.Native);

	/**
	 * 所有由 new Class 创建的类的基类。
	 * @class JPlus.Base
	 */
	Base.implement({

		/**
    	 * 获取当前类对应的数据字段。
    	 * @proteced virtual
    	 * @returns {Object} 一个可存储数据的对象。
    	 * @remark 默认地， 此返回返回 this 。
    	 * 此函数的意义在于将类对象和真实的数据对象分离。
    	 * 这样可以让多个类实例共享一个数据对象。
    	 * @example
    	 * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *    fn: function (a, b) {
	     * 	    alert(a + b);
	     *    }
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * a.dataField().myData = 2;
    	 * </pre>
    	 */
		dataField: function () {
			return this.$data || (this.$data = {});
		},

		/**
	     * 调用父类的成员函数。
	     * @param {String} fnName 调用的函数名。
	     * @param {Object} [...] 调用的参数。如果不填写此项，则自动将当前函数的全部参数传递给父类的函数。
	     * @return {Object} 返回父类函数的返回值。
	     * @protected
	     * @example
	     * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *    fn: function (a, b) {
	     * 	    alert(a + b);
	     *    }
	     * });
	     *
	     * // 创建一个子类 B
	     * var B = A.extend({
	     * 	  fn: function (a, b) {
	     * 	    this.base('fn'); // 子类 B#a 调用父类 A#a
	     * 	    this.base('fn', 2, 4); // 子类 B#a 调用父类 A#a
	     *    }
	     * });
	     *
	     * new B().fn(1, 2); // 输出 3 和 6
	     * </pre>
	     */
		base: function (fnName) {

			var me = this.constructor,

	            fn = this[fnName],

	            oldFn = fn,

	            args = arguments;

			assert(fn, "JPlus.Base#base(fnName, args): 子类不存在 {fnName} 的属性或方法。", fnName);

			// 标记当前类的 fn 已执行。
			fn.$bubble = true;

			assert(!me || me.prototype[fnName], "JPlus.Base#base(fnName, args): 父类不存在 {fnName} 的方法。", fnName);

			// 保证得到的是父类的成员。

			do {
				me = me.base;
				assert(me && me.prototype[fnName], "JPlus.Base#base(fnName, args): 父类不存在 {fnName} 的方法。", fnName);
			} while ('$bubble' in (fn = me.prototype[fnName]));

			assert.isFunction(fn, "JPlus.Base#base(fnName, args): 父类的成员 {fn}不是一个函数。  ");

			fn.$bubble = true;

			// 确保 bubble 记号被移除。
			try {
				if (args.length <= 1)
					return fn.apply(this, args.callee.caller.arguments);
				args[0] = this;
				return fn.call.apply(fn, args);
			} finally {
				delete fn.$bubble;
				delete oldFn.$bubble;
			}
		},

		/**
		 * 增加一个事件监听者。
		 * @param {String} eventName 事件名。
		 * @param {Function} eventHandler 监听函数。当事件被处罚时会执行此函数。
		 * @param {Object} scope=this *eventHandler* 执行时的作用域。
		 * @return this
		 * @example
		 * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * // 绑定一个 click 事件。
         * a.on('click', function (e) {
         * 		return true;
         * });
         * </pre>
		 */
		on: function (eventName, eventHandler, scope) {

			assert.isFunction(eventHandler, 'JPlus.Base#on(eventName, eventHandler, scope): {eventHandler} ~');

			// 获取本对象 本对象的数据内容 本事件值
			var me = this,
	        	data = me.dataField(),
	        	eventListener,
	        	eventManager;
			
			// 获取存储事件对象的空间。
			data = data.$event || (data.$event = {});
			
			// 获取当前事件对应的函数监听器。
			eventListener = data[eventName];
			
			// 生成默认的事件作用域。
			scope = [eventHandler, scope || me];

			// 如果未绑定过这个事件, 则不存在监听器，先创建一个有关的监听器。
			if (!eventListener) {
				
				// 获取事件管理对象。
				eventManager = getMgr(me, eventName);

				// 生成实际处理事件的监听器。
				data[eventName] = eventListener = function (e) {
					var eventListener = arguments.callee, 
						handlers = eventListener.handlers.slice(0), 
						handler,
						i = -1, 
						length = handlers.length;
					
					// 循环直到 return false。
					while (++i < length) {
						handler = handlers[i];
						if (handler[0].call(handler[1], e) === false) {
							
							// 如果存在 stopEvent 处理函数，则调用。
							// 如果当前函数是因为 initEvent 返回 false 引起，则不执行 stopEvent 。
							if(handler[2] !== true && (handler = eventListener.stop)){
								handler[0].call(handler[1], e);
							}
							return false;
						}
					}

					return true;
				};
				
				// 当前事件的全部函数。
				eventListener.handlers = eventManager.initEvent ? 
					[[eventManager.initEvent, me, true], scope] : 
					[scope];

				// 如果事件允许阻止，则存储字段。
				if(eventManager.stopEvent) {
					eventListener.stop = [eventManager.stopEvent, me];
				}

				// 如果事件支持自定义的添加方式，则先添加。
				if (eventManager.add) {
					eventManager.add(me, eventName, eventListener);
				}

			} else {
						
				// 添加到 handlers 。
				eventListener.handlers.push(scope);
			}


			return me;
		},

		/**
		 * 手动触发一个监听器。
		 * @param {String} eventName 监听名字。
		 * @param {Object} [e] 传递给监听器的事件对象。
		 * @return this
		 * @example <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * // 绑定一个 click 事件。
         * a.on('click', function (e) {
         * 		return true;
         * });
         *
         * // 手动触发 click， 即执行  on('click') 过的函数。
         * a.trigger('click');
         * </pre>
		 */
		trigger: function (eventName, e) {

			// 获取本对象 本对象的数据内容 本事件值 。
			var me = this, 
				data = me.dataField().$event, 
				eventManager;

			// 执行事件。
			return !data || !(data = data[eventName]) || ((eventManager = getMgr(me, eventName)).dispatch ? eventManager.dispatch(me, eventName, data, e) : data(e));

		},

		/**
		 * 删除一个或多个事件监听器。
		 * @param {String} [eventName] 事件名。如果不传递此参数，则删除全部事件的全部监听器。
		 * @param {Function} [eventHandler] 回调器。如果不传递此参数，在删除指定事件的全部监听器。
		 * @return this
		 * @remark
		 * 注意: `function () {} !== function () {}`, 这意味着下列代码的 un 将失败:
		 * <pre>
         * elem.on('click', function () {});
         * elem.un('click', function () {});   // 无法删除 on 绑定的函数。
         * </pre>
		 * 正确的做法是把函数保存起来。 <pre>
         * var fn =  function () {};
         * elem.on('click', fn);
         * elem.un('click', fn); // fn  被成功删除。
         *
         * 如果同一个 *eventListener* 被增加多次， un 只删除第一个。
         * </pre>
		 * @example
		 * <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
	     * var fn = function (e) {
         * 		return true;
         * };
	     *
	     * // 绑定一个 click 事件。
         * a.on('click', fn);
         *
         * // 删除一个 click 事件。
         * a.un('click', fn);
         * </pre>
		 */
		un: function (eventName, eventHandler) {

			assert(!eventHandler || Object.isFunction(eventHandler), 'JPlus.Base#un(eventName, eventHandler): {eventHandler} 必须是函数。', eventHandler);

			// 获取本对象 本对象的数据内容 本事件值
			var me = this, 
				data = me.dataField().$event, 
				eventListener, 
				handlers, 
				i;
			
			if (data) {
				
				// 获取指定事件的监听器。
				if (eventListener = data[eventName]) {
					
					// 如果删除特定的处理函数。
					// 搜索特定的处理函数。
					if (eventHandler) {

						handlers = eventListener.handlers;
						i = handlers.length;

						// 根据常见的需求，这里逆序搜索有助于提高效率。
						while (i-- > 0) {
							
							if (handlers[i][0] === eventHandler) {
								
								// 删除 hander 。
								handlers.splice(i, 1);
								
								// 如果删除后只剩 0 个句柄，或只剩 1个 initEvent 句柄，则删除全部数据。
								if (!i || (i === 1 && handlers[0] === true)) {
									eventHandler = 0;
								}

								break;
							}
						}

					}

					// 检查是否存在其它函数或没设置删除的函数。
					if (!eventHandler) {

						// 删除对事件处理句柄的全部引用，以允许内存回收。
						delete data[eventName];
						
						// 获取事件管理对象。
						data = getMgr(me, eventName);

						// 内部事件管理的删除。
						if (data.remove)
							data.remove(me, eventName, eventListener);
					}
				} else if (!eventName) {
					for (eventName in data)
						me.un(eventName);
				}
			}
			return me;
		},

		/**
		 * 增加一个仅监听一次的事件监听者。
		 * @param {String} type 事件名。
		 * @param {Function} listener 监听函数。当事件被处罚时会执行此函数。
		 * @param {Object} scope=this *listener* 执行时的作用域。
		 * @return this
		 * @example <pre>
	     *
	     * // 创建一个类 A
	     * var A = new Class({
	     *
	     * });
	     *
	     * // 创建一个变量。
	     * var a = new A();
	     *
         * a.once('click', function (e) {
         * 		trace('click 被触发了');
         * });
         *
         * a.trigger('click');   //  输出  click 被触发了
         * a.trigger('click');   //  没有输出
         * </pre>
		 */
		once: function (eventName, eventHandler, scope) {

			assert.isFunction(eventHandler, 'JPlus.Base#once(eventName, eventHandler): {eventHandler} ~');

			// 先插入一个用于删除句柄的函数。
			return this.on(eventName, function(){
				this.un(eventName, eventHandler).un(eventName, arguments.callee);	
			}).on(eventName, eventHandler, scope);
		}

	});

	/**
	 * 系统原生的字符串对象。
	 * @class String
	 */
	String.implementIf({

		/// #if CompactMode

		/**
		 * 去除字符串的首尾空格。
		 * @return {String} 处理后的字符串。
		 * @remark 目前除了 IE8-，主流浏览器都已内置此函数。
		 * @example
		 * <pre>
	     * "   g h   ".trim(); //  返回     "g h"
	     * </pre>
		 */
		trim: function () {
			return this.replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, "");
		},

		/// #endif

		/**
		 * 将字符串转为骆驼格式。
		 * @return {String} 返回的内容。
		 * @remark
		 * 比如 "awww-bwww-cwww" 的骆驼格式为 "awwBwwCww"
		 * @example
		 * <pre>
	     * "font-size".toCamelCase(); //     "fontSize"
	     * </pre>
		 */
		toCamelCase: function () {
			return this.replace(/-(\w)/g, toUpperCase);
		},

		/**
		 * 将字符首字母大写。
		 * @return {String} 处理后的字符串。
		 * @example
		 * <pre>
	     * "aa".capitalize(); //     "Aa"
	     * </pre>
		 */
		capitalize: function () {

			// 使用正则实现。
			return this.replace(/(\b[a-z])/g, toUpperCase);
		}

	});

	/**
	 * 系统原生的函数对象。
	 * @class Function
	 */
	Function.implementIf({

		/**
		 * 绑定函数作用域(**this**)。并返回一个新函数，这个函数内的 **this** 为指定的 *scope* 。
		 * @param {Object} scope 要绑定的作用域的值。
		 * @example
		 * <pre>
		 * var fn = function(){ trace(this);  };
		 *
		 * var fnProxy = fn.bind(0);
		 *
	     * fnProxy()  ; //  输出 0
	     * </pre>
		 */
		bind: function (scope) {

			var me = this;
			
			// 返回对 scope 绑定。
			return function () {
				return me.apply(scope, arguments);
			}
		}

	});

	/**
	 * 系统原生的数组对象。
	 * @class Array
	 */
	Array.implementIf({

		/**
		 * 遍历当前数组，并对数组的每个元素执行函数 *fn*。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 可以让函数返回 **false** 来强制中止循环。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @return {Boolean} 如果循环是因为 *fn* 返回 **false** 而中止，则返回 **false**， 否则返回 **true**。
		 * @method
		 * @see Object.each
		 * @see #forEach
		 * @see #filter
		 * @see Object.map
		 * @remark
		 * 在高版本浏览器中，forEach 和 each 功能大致相同，但是 forEach 不支持通过 return false 中止循环。
		 * 在低版本(IE8-)浏览器中， forEach 为 each 的别名。
		 * @example 以下示例演示了如何遍历数组，并输出每个元素的值。
		 * <pre>
	     * [2, 5].each(function (value, index) {
	     * 		trace(value);
	     * });
	     * // 输出 '2 5'
	     * </pre>
	     *
	     * 以下示例演示了如何通过 return false 来中止循环。
	     * <pre>
	     * [2, 5].each(function (value, index) {
	     * 		trace(value);
	     * 		return false;
	     * });
	     * // 输出 '2'
	     * </pre>
		 */
		each: each,

		/**
		 * 如果当前数组中不存在指定 *value*， 则将 *value* 添加到当前数组的末尾。
		 * @param {Object} value 要添加的值。
		 * @return {Boolean} 如果此次操作已成功添加 *value*，则返回 **true**;
		 * 否则表示原数组已经存在 *value*，返回 **false**。
		 * @example
		 * <pre>
	     * ["", "aaa", "zzz", "qqq"].include(""); // 返回 true， 数组不变。
	     * [false].include(0);	// 返回 false， 数组变为 [false, 0]
	     * </pre>
		 */
		include: function (value) {
			var exists = this.indexOf(value) >= 0;
			if (!exists)
				this.push(value);
			return exists;
		},
		
		/// TODO: clear

		/**
		 * 将指定的 *value* 插入到当前数组的指定位置。
		 * @param {Number} index 要插入的位置。索引从 0 开始。如果 *index* 大于数组的长度，则插入到末尾。
		 * @param {Object} value 要插入的内容。
		 * @return {Number} 返回实际插入到的位置。
		 * @example
		 * <pre>
	     * ["I", "you"].insert(1, "love"); //   ["I", "love", "you"]
	     * </pre>
		 */
		insert: function (index, value) {
			assert.deprected("Array#insert 即将从 System.Core.Base 移除。要使用此函数，可引用 System.Utils.Array 组件。");
			assert.isNumber(index, "Array#insert(index, value): {index} ~");
			var me = this, tmp;
			if (index < 0 || index >= me.length) {
				me[index = me.length++] = value;
			} else {
				tmp = ap.slice.call(me, index);
				me.length = index + 1;
				this[index] = value;
				ap.push.apply(me, tmp);
			}
			return index;

		},
		
		/// TODO: clear

		/**
		 * 对当前数组的每个元素调用其指定属性名的函数，并将返回值放入新的数组返回。
		 * @param {String} fnName 要调用的函数名。
		 * @param {Array} [args] 调用时的参数数组。
		 * @return {Array} 返回包含执行结果的数组。
		 * @example
		 * <pre>
	     * ["abc", "def", "ghi"].invoke('charAt', [0]); //  ['a', 'd', 'g']
	     * </pre>
		 */
		invoke: function (fnName, args) {
			assert(!args || typeof args.length === 'number', "Array#invoke(fnName, args): {args} 必须是参数数组。", args);
			var r = [];
			ap.forEach.call(this, function (value) {
				assert(value != null && value[fnName] && value[fnName].apply, "Array#invoke(fnName, args): {value} 不包含函数 {fnName}。", value, fnName);
				r.push(value[fnName].apply(value, args || []));
			});

			return r;
		},

		/**
		 * 删除数组中重复元素。
		 * @return {Array} this
		 * @example
		 * <pre>
	     * [1, 7, 8, 8].unique(); //    [1, 7, 8]
	     * </pre>
		 */
		unique: function () {

			// 删除从 i + 1 之后的当前元素。
			for (var i = 0, j, value; i < this.length;) {
				value = this[i];
				j = ++i;
				do {
					j = ap.remove.call(this, value, j);
				} while (j >= 0);
			}

			return this;
		},

		/**
		 * 删除当前数组中指定的元素。
		 * @param {Object} value 要删除的值。
		 * @param {Number} startIndex=0 开始搜索 *value* 的起始位置。
		 * @return {Number} 被删除的值在原数组中的位置。如果要擅长的值不存在，则返回 -1 。
		 * @remark
		 * 如果数组中有多个相同的值， remove 只删除第一个。
		 * @example
		 * <pre>
	     * [1, 7, 8, 8].remove(7); // 返回 1,  数组变成 [7, 8, 8]
	     * </pre>
	     *
	     * 以下示例演示了如何删除数组全部相同项。
	     * <pre>
	     * var arr = ["wow", "wow", "J+ UI", "is", "powerful", "wow", "wow"];
	     *
	     * // 反复调用 remove， 直到 remove 返回 -1， 即找不到值 wow
	     * while(arr.remove(wow) >= 0);
	     *
	     * trace(arr); // 输出 ["J+ UI", "is", "powerful"]
	     * </pre>
		 */
		remove: function (value, startIndex) {

			// 找到位置， 然后删。
			var i = ap.indexOf.call(this, value, startIndex);
			if (i !== -1)
				ap.splice.call(this, i, 1);
			return i;
		},

		/**
		 * 获取当前数组中指定索引的元素。
		 * @param {Number} index 要获取的元素索引。如果 *index* 小于 0， 则表示获取倒数 *index* 位置的元素。
		 * @return {Object} 指定位置所在的元素。如果指定索引的值不存在，则返回 undefined。
		 * @remark
		 * 使用 arr.item(-1) 可获取最后一个元素的值。
		 * @example
		 * <pre>
	     * [0, 1, 2, 3].item(0);  // 0
	     * [0, 1, 2, 3].item(-1); // 3
	     * [0, 1, 2, 3].item(5);  // undefined
	     * </pre>
		 */
		item: function (index) {
			return this[index < 0 ? this.length + index : index];
		},

		/// #if CompactMode

		/**
		 * 返回当前数组中某个值的第一个位置。
		 * @param {Object} item 成员。
		 * @param {Number} startIndex=0 开始查找的位置。
		 * @return {Number} 返回 *vaue* 的索引，如果不存在指定的值， 则返回-1 。
		 * @remark 目前除了 IE8-，主流浏览器都已内置此函数。
		 */
		indexOf: function (value, startIndex) {
			startIndex = startIndex || 0;
			for (var len = this.length; startIndex < len; startIndex++)
				if (this[startIndex] === value)
					return startIndex;
			return -1;
		},

		/**
		 * 对数组每个元素通过一个函数过滤。返回所有符合要求的元素的数组。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 如果函数返回 **true**，则当前元素会被添加到返回值数组。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @return {Array} 返回一个新的数组，包含过滤后的元素。
		 * @remark 目前除了 IE8-，主流浏览器都已内置此函数。
		 * @see #each
		 * @see #forEach
		 * @see Object.map
		 * @example
		 * <pre>
	     * [1, 7, 2].filter(function (key) {
	     * 		return key < 5;
	     * })  //  [1, 2]
	     * </pre>
		 */
		filter: function (fn, scope) {
			assert.isFunction(fn, "Array#filter(fn, scope): {fn} ~");
			var r = [];
			ap.forEach.call(this, function (value, i, array) {
				if (fn.call(scope, value, i, array))
					r.push(value);
			});
			return r;
		},

		/**
		 * 遍历当前数组，并对数组的每个元素执行函数 *fn*。
		 * @param {Function} fn 对每个元素运行的函数。函数的参数依次为:
		 *
		 * - {Object} value 当前元素的值。
		 * - {Number} index 当前元素的索引。
		 * - {Array} array 当前正在遍历的数组。
		 *
		 * 可以让函数返回 **false** 来强制中止循环。
		 * @param {Object} [scope] 定义 *fn* 执行时 **this** 的值。
		 * @see #each
		 * @see Object.each
		 * @see #filter
		 * @see Object.map
		 * @remark
		 * 在高版本浏览器中，forEach 和 each 功能大致相同，但是 forEach 不支持通过 return false 中止循环。
		 * 在低版本(IE8-)浏览器中， forEach 为 each 的别名。
		 *
		 * 目前除了 IE8-，主流浏览器都已内置此函数。
		 * @example 以下示例演示了如何遍历数组，并输出每个元素的值。
		 * <pre>
	     * [2, 5].forEach(function (value, key) {
	     * 		trace(value);
	     * });
	     * // 输出 '2' '5'
	     * </pre>
		 */
		forEach: each

		/// #endif

	});

	/// #endregion

	/// #region Private Functions

	/**
	 * 复制所有属性到任何对象。
	 * @param {Object} dest 复制目标。
	 * @param {Object} src 要复制的内容。
	 * @return {Object} 复制后的对象。
	 */
	function extend(dest, src) {

		assert(dest != null, "Object.extend(dest, src): {dest} 不可为空。", dest);

		// 直接遍历，不判断是否为真实成员还是原型的成员。
		for (var b in src)
			dest[b] = src[b];
		return dest;
	}

	/**
	 * 对数组运行一个函数。
	 * @param {Function} fn 遍历的函数。参数依次 value, index, array 。
	 * @param {Object} scope 对象。
	 * @return {Boolean} 返回一个布尔值，该值指示本次循环时，有无出现一个函数返回 false 而中止循环。
	 */
	function each(fn, scope) {

		assert(Object.isFunction(fn), "Array#each(fn, scope): {fn} 必须是一个函数。", fn);

		var i = -1, me = this;

		while (++i < me.length)
			if (fn.call(scope, me[i], i, me) === false)
				return false;
		return true;
	}

	/**
	 * 所有自定义类的基类。
	 */
	function Base() {

	}

	/**
	 * 空函数。
	 */
	function emptyFn() {

	}

	/**
	 * 将一个字符转为大写。
	 * @param {String} ch 参数。
	 * @param {String} match 字符。
	 * @return {String} 转为大写之后的字符串。
	 */
	function toUpperCase(ch, match) {
		return match.toUpperCase();
	}

	/**
	 * 获取指定的对象所有的事件管理器。
	 * @param {Object} obj 要使用的对象。
	 * @param {String} type 事件名。
	 * @return {Object} 符合要求的事件管理器，如果找不到合适的，返回默认的事件管理器。
	 */
	function getMgr(obj, eventName) {
		var clazz = obj.constructor, 
			t;

		// 遍历父类，找到指定事件。
		while (!(t = clazz.$event) || !(eventName in t)) {
			if (!(clazz = clazz.base)) {
				return emptyObj;
			}
		}

		return t[eventName];
	}

	/// #endregion

})(this);



JPlus.Base.prototype.toString = function () {
	for (var item in window) {
		if (window[item] === this.constructor)
			return item;
	}

	return Object.prototype.toString.call(this);
};

/**
 * Debug Tools
 */

/**
 * 调试输出指定的信息。
 * @param {Object} ... 要输出的变量。
 */
function trace() {

	// 无参数的话，自动补充一个参数。
	if (arguments.length === 0) {
		if (!trace.$count)
		return trace('(trace: ' + (trace.$count++) + ')');
	}


	if (trace.enable) {

		var hasConsole = window.console, data;

		// 优先使用 console.debug
		if (hasConsole && console.debug && console.debug.apply) {
			return console.debug.apply(console, arguments);
		}

		// 然后使用 console.log
		if (hasConsole && console.log && console.log.apply) {
			return console.log.apply(console, arguments);
		}
		
		// 最后使用 trace.inspect
		for (var i = 0, r = []; i < arguments.length; i++) {
			r[i] = trace.inspect(arguments[i]);
		}

		data = r.join(' ');

		return hasConsole && console.log ? console.log(data) : alert(data);
	}
}

/**
 * 确认一个值是 **true**，否则向用户显示一个警告。
 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。
 * @param {Object} ... 用于格式化 message 中被 {} 包围的参数名的具体值。
 * @return {Boolean} 返回 *value* 的等效布尔值。
 * @example <pre>
 * var value = 1;
 * assert(value > 0, "{value} 应该大于 0。", value);
 * </pre>
 */
function assert(value, message) {
	if (!value) {

		var args = arguments;

		switch (args.length) {
			case 1:
				message = "断言失败";
			case 2:
				break;
			case 0:
				return true;
			default:
				var i = 2;
				message = message.replace(/\{([\w\.\(\)]*?)\}/g, function (match, argsName) {
					return "参数 " + (args.length <= i ? match : argsName + " = " + trace.ellipsis(trace.inspect(args[i++]), 200));
				});
		}

		// 显示调用堆栈。
		if (assert.stackTrace) {

			// 函数调用源。
			args = args.callee.caller;

			// 跳过 assert 函数。
			while (args && args.debugStepThrough)
				args = args.caller;

			// 找到原调用者。
			if (args && args.caller) {
				args = args.caller;
			}

			if (args)
				message += "\r\n--------------------------------------------------------------------\r\n" + trace.ellipsis(trace.decodeUTF8(args.toString()), 600);

		}

		window.trace.error(message);

	}

	return !!value;
}

/**
 * 载入一个组件的 js 和 css源码。
 * @param {String} namespace 组件全名。
 * @example <pre>
 * using("System.Dom.Keys");
 * </pre>
 */
function using(namespace, isStyle) {

	assert.isString(namespace, "using(ns): {ns} 不是合法的组件全名。");

	var cache = using[isStyle ? 'styles' : 'scripts'];

	for (var i = 0; i < cache.length; i++) {
		if (cache[i] === namespace)
			return;
	}

	cache.push(namespace);

	namespace = using.resolve(namespace.toLowerCase(), isStyle);

	var tagName,
    	type,
    	exts,
    	callback;

	if (isStyle) {
		tagName = "LINK";
		type = "href";
		exts = [".less", ".css"];
		callback = using.loadStyle;

		if (!using.useLess) {
			exts.shift();
		}
	} else {
		tagName = "SCRIPT";
		type = "src";
		exts = [".js"];
		callback = using.loadScript;
	}

	// 如果在节点找到符合的就返回，找不到，调用 callback 进行真正的 加载处理。

	var doms = document.getElementsByTagName(tagName),
		path = namespace.replace(/^[\.\/\\]+/, "");

	for (var i = 0; doms[i]; i++) {
		var url = ((document.constructor ? doms[i][type] : doms[i].getAttribute(type, 4)) || '').toLowerCase();
		for (var j = 0; j < exts.length; j++) {
			if (url.indexOf(path + exts[j]) >= 0) {
				return;
			}
		}
	}

	callback(using.rootPath + namespace + exts[0]);
}

/**
 * 导入指定组件全名表示的样式文件。
 * @param {String} namespace 组件全名。
 */
function imports(namespace) {
	return using(namespace, true);
}

(function () {

	/// #region Trace

	/**
     * @namespace trace
     */
	extend(trace, {

		/**
		 * 是否打开调试输出。
		 * @config {Boolean}
		 */
		enable: true,

		/**
		 * 将字符串限定在指定长度内，超出部分用 ... 代替。
		 * @param {String} value 要处理的字符串。
		 * @param {Number} length 需要的最大长度。
		 * @example
		 * <pre>
	     * String.ellipsis("1234567", 6); //   "123..."
	     * String.ellipsis("1234567", 9); //   "1234567"
	     * </pre>
		 */
		ellipsis: function (value, length) {
			return value.length > length ? value.substr(0, length - 3) + "..." : value;
		},

		/**
         * 将字符串从 utf-8 字符串转义。
         * @param {String} s 字符串。
         * @return {String} 返回的字符串。
         */
		decodeUTF8: function (s) {
			return s.replace(/\\u([0-9a-f]{3})([0-9a-f])/gi, function (a, b, c) {
				return String.fromCharCode((parseInt(b, 16) * 16 + parseInt(c, 16)))
			})
		},

		/**
         * 输出类的信息。
         * @param {Object} [obj] 要查看成员的对象。如果未提供这个对象，则显示全局的成员。
         * @param {Boolean} showPredefinedMembers=true 是否显示内置的成员。
         */
		api: (function () {

			var nodeTypes = 'Window Element Attr Text CDATASection Entity EntityReference ProcessingInstruction Comment HTMLDocument DocumentType DocumentFragment Document Node'.split(' '),

                definedClazz = 'String Date Array Number RegExp Function XMLHttpRequest Object'.split(' ').concat(nodeTypes),

                predefinedNonStatic = {
                	'Object': 'valueOf hasOwnProperty toString',
                	'String': 'length charAt charCodeAt concat indexOf lastIndexOf match quote slice split substr substring toLowerCase toUpperCase trim sub sup anchor big blink bold small fixed fontcolor italics link',
                	'Array': 'length pop push reverse shift sort splice unshift concat join slice indexOf lastIndexOf filter forEach',
                	/*
                     * every
                     * map
                     * some
                     * reduce
                     * reduceRight'
                     */
                	'Number': 'toExponential toFixed toLocaleString toPrecision',
                	'Function': 'length extend call',
                	'Date': 'getDate getDay getFullYear getHours getMilliseconds getMinutes getMonth getSeconds getTime getTimezoneOffset getUTCDate getUTCDay getUTCFullYear getUTCHours getUTCMinutes getUTCMonth getUTCSeconds getYear setDate setFullYear setHours setMinutes setMonth setSeconds setTime setUTCDate setUTCFullYear setUTCHours setUTCMilliseconds setUTCMinutes setUTCMonth setUTCSeconds setYear toGMTString toLocaleString toUTCString',
                	'RegExp': 'exec test'
                },

                predefinedStatic = {
                	'Array': 'isArray',
                	'Number': 'MAX_VALUE MIN_VALUE NaN NEGATIVE_INFINITY POSITIVE_INFINITY',
                	'Date': 'now parse UTC'
                },

                APIInfo = function (obj, showPredefinedMembers) {
                	this.members = {};
                	this.sortInfo = {};

                	this.showPredefinedMembers = showPredefinedMembers !== false;
                	this.isClass = obj === Function || (obj.prototype && obj.prototype.constructor !== Function);

                	// 如果是普通的变量。获取其所在的原型的成员。
                	if (!this.isClass && obj.constructor !== Object) {
                		this.prefix = this.getPrefix(obj.constructor);

                		if (!this.prefix) {
                			var nodeType = obj.replaceChild ? obj.nodeType : obj.setInterval && obj.clearTimeout ? 0 : null;
                			if (nodeType) {
                				this.prefix = this.memberName = nodeTypes[nodeType];
                				if (this.prefix) {
                					this.baseClassNames = ['Node', 'Element', 'HTMLElement', 'Document'];
                					this.baseClasses = [window.Node, window.Element, window.HTMLElement, window.HTMLDocument];
                				}
                			}
                		}

                		if (this.prefix) {
                			this.title = this.prefix + this.getBaseClassDescription(obj.constructor) + "的实例成员: ";
                			this.prefix += '.prototype.';
                		}

                		if ([Number, String, Boolean].indexOf(obj.constructor) === -1) {
                			var betterPrefix = this.getPrefix(obj);
                			if (betterPrefix) {
                				this.orignalPrefix = betterPrefix + ".";
                			}
                		}

                	}

                	if (!this.prefix) {

                		this.prefix = this.getPrefix(obj);

                		// 如果是类或对象， 在这里遍历。
                		if (this.prefix) {
                			this.title = this.prefix
                                    + (this.isClass ? this.getBaseClassDescription(obj) : ' ' + getMemberType(obj, this.memberName)) + "的成员: ";
                			this.prefix += '.';
                		}

                	}

                	// 如果是类，获取全部成员。
                	if (this.isClass) {
                		this.getExtInfo(obj);
                		this.addStaticMembers(obj);
                		this.addStaticMembers(obj.prototype, 1, true);
                		this.addEvents(obj, '');
                		delete this.members.prototype;
                		if (this.showPredefinedMembers) {
                			this.addPredefinedNonStaticMembers(obj, obj.prototype, true);
                			this.addPredefinedMembers(obj, obj, predefinedStatic);
                		}

                	} else {
                		this.getExtInfo(obj.constructor);
                		// 否则，获取当前实例下的成员。
                		this.addStaticMembers(obj);

                		if (this.showPredefinedMembers && obj.constructor) {
                			this.addPredefinedNonStaticMembers(obj.constructor, obj);
                		}

                	}
                };

			APIInfo.prototype = {

				memberName: '',

				title: 'API 信息:',

				prefix: '',

				getPrefix: function (obj) {
					if (!obj)
						return "";
					for (var i = 0; i < definedClazz.length; i++) {
						if (window[definedClazz[i]] === obj) {
							return this.memberName = definedClazz[i];
						}
					}

					return this.getTypeName(obj, window, "", 3);
				},

				getTypeName: function (obj, base, baseName, deep) {

					for (var memberName in base) {
						if (base[memberName] === obj) {
							this.memberName = memberName;
							return baseName + memberName;
						}
					}

					if (deep-- > 0) {
						for (var memberName in base) {
							try {
								if (base[memberName] && isUpper(memberName, 0)) {
									memberName = this.getTypeName(obj, base[memberName], baseName + memberName + ".", deep);
									if (memberName)
										return memberName;
								}
							} catch (e) {
							}
						}
					}

					return '';
				},

				getBaseClassDescription: function (obj) {
					if (obj && obj.base && obj.base !== JPlus.Object) {
						var extObj = this.getTypeName(obj.base, window, "", 3);
						return " 类" + (extObj && extObj != "System.Object" ? "(继承于 " + extObj + " 类)" : "");
					}

					return " 类";
				},

				/**
                 * 获取类的继承关系。
                 */
				getExtInfo: function (clazz) {
					if (!this.baseClasses) {
						this.baseClassNames = [];
						this.baseClasses = [];
						while (clazz && clazz.prototype) {
							var name = this.getPrefix(clazz);
							if (name) {
								this.baseClasses.push(clazz);
								this.baseClassNames.push(name);
							}

							clazz = clazz.base;
						}
					}

				},

				addStaticMembers: function (obj, nonStatic) {
					for (var memberName in obj) {
						this.addMember(obj, memberName, 1, nonStatic);
					}

				},

				addPredefinedMembers: function (clazz, obj, staticOrNonStatic, nonStatic) {
					for (var type in staticOrNonStatic) {
						if (clazz === window[type]) {
							staticOrNonStatic[type].forEach(function (memberName) {
								this.addMember(obj, memberName, 5, nonStatic);
							}, this);
						}
					}
				},

				addPredefinedNonStaticMembers: function (clazz, obj, nonStatic) {

					if (clazz !== Object) {

						predefinedNonStatic.Object.forEach(function (memberName) {
							if (clazz.prototype[memberName] !== Object.prototype[memberName]) {
								this.addMember(obj, memberName, 5, nonStatic);
							}
						}, this);

					}

					if (clazz === Object && !this.isClass) {
						return;
					}

					this.addPredefinedMembers(clazz, obj, predefinedNonStatic, nonStatic);

				},

				addEvents: function (obj, extInfo) {
					var evtInfo = obj.$event;

					if (evtInfo) {

						for (var evt in evtInfo) {
							this.sortInfo[this.members[evt] = evt + ' 事件' + extInfo] = 4 + evt;
						}

						if (obj.base) {
							this.addEvents(obj.base, '(继承的)');
						}
					}
				},

				addMember: function (base, memberName, type, nonStatic) {
					try {

						var hasOwnProperty = Object.prototype.hasOwnProperty, owner = hasOwnProperty.call(base, memberName), prefix, extInfo = '';

						nonStatic = nonStatic ? 'prototype.' : '';

						// 如果 base 不存在 memberName 的成员，则尝试在父类查找。
						if (owner) {
							prefix = this.orignalPrefix || (this.prefix + nonStatic);
							type--; // 自己的成员置顶。
						} else {

							// 搜索包含当前成员的父类。
							this.baseClasses.each(function (baseClass, i) {
								if (baseClass.prototype[memberName] === base[memberName] && hasOwnProperty.call(baseClass.prototype, memberName)) {
									prefix = this.baseClassNames[i] + ".prototype.";

									if (nonStatic)
										extInfo = '(继承的)';

									return false;
								}
							}, this);

							// 如果没找到正确的父类，使用当前类替代，并指明它是继承的成员。
							if (!prefix) {
								prefix = this.prefix + nonStatic;
								extInfo = '(继承的)';
							}

						}

						this.sortInfo[this.members[memberName] = (type >= 4 ? '[内置]' : '') + prefix + getDescription(base, memberName) + extInfo] = type
							+ memberName;

					} catch (e) {
					}
				},

				copyTo: function (value) {
					for (var member in this.members) {
						value.push(this.members[member]);
					}

					if (value.length) {
						var sortInfo = this.sortInfo;
						value.sort(function (a, b) {
							return sortInfo[a] < sortInfo[b] ? -1 : 1;
						});
						value.unshift(this.title);
					} else {
						value.push(this.title + '没有可用的子成员信息。');
					}

				}

			};

			initPredefined(predefinedNonStatic);
			initPredefined(predefinedStatic);

			function initPredefined(predefined) {
				for (var obj in predefined)
					predefined[obj] = predefined[obj].split(' ');
			}

			function isEmptyObject(obj) {

				// null 被认为是空对象。
				// 有成员的对象将进入 for(in) 并返回 false 。
				for (obj in (obj || {}))
					return false;
				return true;
			}

			// 90 是 'Z' 65 是 'A'
			function isUpper(str, index) {
				str = str.charCodeAt(index);
				return str <= 90 && str >= 65;
			}

			function getMemberType(obj, name) {

				// 构造函数最好识别。
				if (typeof obj === 'function' && name === 'constructor')
					return '构造函数';

				// IE6 的 DOM 成员不被认为是函数，这里忽略这个错误。
				// 有 prototype 的函数一定是类。
				// 没有 prototype 的函数肯能是类。
				// 这里根据命名如果名字首字母大写，则作为空类理解。
				// 这不是一个完全正确的判断方式，但它大部分时候正确。
				// 这个世界不要求很完美，能解决实际问题的就是好方法。
				if (obj.prototype && obj.prototype.constructor)
					return !isEmptyObject(obj.prototype) || isUpper(name, 0) ? '类' : '函数';

				// 最后判断对象。
				if (Object.isObject(obj))
					return name.charAt(0) === 'I' && isUpper(name, 1) ? '接口' : '对象';

				// 空成员、值类型都作为属性。
				return '属性';
			}

			function getDescription(base, name) {
				return name + ' ' + getMemberType(base[name], name);
			}

			return function (obj, showPredefinedMembers) {
				var r = [];

				// 如果没有参数，显示全局对象。
				if (arguments.length === 0) {
					for (var i = 0; i < 7; i++) {
						r.push(getDescription(window, definedClazz[i]));
					}

					r.push("trace 函数", "assert 函数", "using 函数", "imports 函数");

					for (var name in window) {

						try {
							if (isUpper(name, 0) || JPlus[name] === window[name])
								r.push(getDescription(window, name));
						} catch (e) {

						}
					}

					r.sort();
					r.unshift('全局对象: ');

				} else if (obj != null) {
					new APIInfo(obj, showPredefinedMembers).copyTo(r);
				} else {
					r.push('无法对 ' + (obj === null ? "null" : "undefined") + ' 分析');
				}

			};

		})(),

		/**
         * 获取对象的字符串形式。
         * @param {Object} obj 要输出的内容。
         * @param {Number/undefined} deep=0 递归的层数。
         * @return String 成员。
         */
		inspect: function (obj, deep, showArrayPlain) {

			if (deep == null)
				deep = 3;
			switch (typeof obj) {
				case "function":
					// 函数
					return deep >= 3 ? trace.decodeUTF8(obj.toString()) : "function ()";

				case "object":
					if (obj == null)
						return "null";
					if (deep < 0)
						return obj.toString();

					if (typeof obj.length === "number") {
						var r = [];
						for (var i = 0; i < obj.length; i++) {
							r.push(trace.inspect(obj[i], ++deep));
						}
						return showArrayPlain ? r.join("   ") : ("[" + r.join(", ") + "]");
					} else {
						if (obj.setInterval && obj.resizeTo)
							return "window#" + obj.document.URL;
						if (obj.nodeType) {
							if (obj.nodeType == 9)
								return 'document ' + obj.URL;
							if (obj.tagName) {
								var tagName = obj.tagName.toLowerCase(), r = tagName;
								if (obj.id) {
									r += "#" + obj.id;
									if (obj.className)
										r += "." + obj.className;
								} else if (obj.outerHTML)
									r = obj.outerHTML;
								else {
									if (obj.className)
										r += " class=\"." + obj.className + "\"";
									r = "<" + r + ">" + obj.innerHTML + "</" + tagName + ">  ";
								}

								return r;
							}

							return '[Node type=' + obj.nodeType +' name=' + obj.nodeName + ' value=' + obj.nodeValue + ']';
						}
						var r = "{\r\n", i, flag = 0;
						for (i in obj) {
							if (typeof obj[i] !== 'function')
								r += "\t" + i + " = " + trace.inspect(obj[i], deep - 1) + "\r\n";
							else {
								flag++;
							}
						}

						if (flag) {
							r += '\t... (' + flag + '个函数)\r\n';
						}

						r += "}";
						return r;
					}
				case "string":
					return deep >= 3 ? obj : '"' + obj + '"';
				case "undefined":
					return "undefined";
				default:
					return obj.toString();
			}
		},

		/**
         * 输出方式。 {@param {String} message 信息。}
         * @type Function
         */
		log: function (message) {
			if (trace.enable && window.console && console.log) {
				window.console.log(message);
			}
		},

		/**
         * 输出一个错误信息。
         * @param {Object} msg 内容。
         */
		error: function (msg) {
			if (trace.enable) {
				if (window.console && console.error)
					window.console.error(msg); // 这是一个预知的错误，请根据函数调用堆栈查找错误原因。
				else
					throw msg; // 这是一个预知的错误，请根据函数调用堆栈查找错误原因。
			}
		},

		/**
         * 输出一个警告信息。
         * @param {Object} msg 内容。
         */
		warn: function (msg) {
			if (trace.enable) {
				if (window.console && console.warn)
					window.console.warn(msg);
				else
					window.trace("[警告]" + msg);
			}
		},

		/**
         * 输出一个信息。
         * @param {Object} msg 内容。
         */
		info: function (msg) {
			if (trace.enable) {
				if (window.console && console.info)
					window.console.info(msg);
				else
					window.trace.write("[信息]" + msg);
			}
		},

		/**
         * 遍历对象每个元素。
         * @param {Object} obj 对象。
         */
		dir: function (obj) {
			if (trace.enable) {
				if (window.console && console.dir)
					window.console.dir(obj);
				else if (obj) {
					var r = "", i;
					for (i in obj)
						r += i + " = " + trace.inspect(obj[i], 1) + "\r\n";
					window.trace(r);
				}
			}
		},

		/**
         * 清除调试信息。 (没有控制台时，不起任何作用)
         */
		clear: function () {
			if (window.console && console.clear)
				window.console.clear();
		},

		/**
         * 如果是调试模式就运行。
         * @param {String/Function} code 代码。
         * @return String 返回运行的错误。如无错, 返回空字符。
         */
		eval: function (code) {
			if (trace.enable) {
				try {
					typeof code === 'function' ? code() : eval(code);
				} catch (e) {
					return e;
				}
			}
			return "";
		},

		/**
         * 输出一个函数执行指定次使用的时间。
         * @param {Function} fn 函数。
         */
		time: function (fn) {
			var time = 0,
				currentTime,
				start = +new Date(),
				past;

			try {

				do {

					time += 10;

					currentTime = 10;
					while (--currentTime > 0) {
						fn();
					}

					past = +new Date() - start;

				} while (past < 100);

			} catch (e) {

			}
			window.trace("[时间] " + past / time);
		}

	});

	/// #region Assert

	/**
     * @namespace assert
     */
	extend(assert, {

		/**
		 * 是否在 assert 失败时显示函数调用堆栈。
		 * @config {Boolean} stackTrace
		 */
		stackTrace: true,
		
		debugStepThrough: true,
		
		/**
		 * 指示一个函数已过时。
		 * @param {String} message="此成员已过时" 提示的信息。
		 */
		deprected: function(message) {
		},

		/**
         * 确认一个值为函数。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         * @example <pre>
         * assert.isFunction(a, "a ~");
         * </pre>
         */
		isFunction: createAssertFunc(function (value) {
			return typeof value == 'function';
		}, "必须是函数。"),

		/**
         * 确认一个值为数组。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isArray: createAssertFunc(function (value) {
			return typeof value.length == 'number';
		}, "必须是数组。"),

		/**
         * 确认一个值为数字。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isNumber: createAssertFunc(function (value) {
			return typeof value === "number" || value instanceof Number;
		}, "必须是数字。"),

		/**
         * 确认一个值是字符串。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isString: createAssertFunc(function (value) {
			return typeof value === "string" || value instanceof String;
		}, "必须是字符串。"),

		/**
         * 确认一个值是日期。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isDate: createAssertFunc(function (value) {
			return value && value instanceof Date;
		}, "必须是日期对象。"),

		/**
         * 确认一个值是正则表达式。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isRegExp: createAssertFunc(function (value) {
			return value && value instanceof RegExp;
		}, "必须是正则表达式。"),

		/**
         * 确认一个值为函数变量。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isObject: createAssertFunc(function (value) {
			return value && (typeof value === "object" || typeof value === "function" || typeof value.nodeType === "number");
		}, "必须是一个引用对象。"),

		/**
         * 确认一个值为节点。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isNode: createAssertFunc(function (value) {
			return value ? typeof value.nodeType === "number" || value.setTimeout : value === null;
		}, "必须是 DOM 节点。"),

		/**
         * 确认一个值为节点。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		isElement: createAssertFunc(function (value) {
			return value ? typeof value.nodeType === "number" && value.style : value === null;
		}, "必须是 DOM 元素。"),

		/**
         * 确认一个值非空。
		 * @param {Object} value 要用于判断的值。它会被自动转为布尔型之后再作判断。
		 * @param {String} message="断言失败" 如果 *value* 为 **false**, 则显示的错误提示。可以用 ~ 代替默认的错误提示信息。
		 * @return {Boolean} 返回 *value* 的等效布尔值。
         */
		notNull: createAssertFunc(function (value) {
			return value != null;
		}, "不可为空。")

	});

	function createAssertFunc(assertFunction, defaultMessage) {
		var fn = function (value, message) {
			return assert(assertFunction(value), (message || "断言失败。").replace('~', defaultMessage), value)
		};
		fn.debugStepThrough = true;
		return fn;
	}

	/// #endregion

	/// #region Using

	extend(using, {

		/**
    	 * 是否使用 lesscss
    	 * @config
    	 */
		useLess: true,

		/**
         * 同步载入代码。
         * @param {String} uri 地址。
         * @example <pre>
         * JPlus.loadScript('./v.js');
         * </pre>
         */
		loadScript: function (url) {
			return using.loadText(url, window.execScript || function (statements) {

				// 如果正常浏览器，使用 window.eval 。
				window["eval"].call(window, statements);

			});
		},

		/**
         * 异步载入样式。
         * @param {String} uri 地址。
         * @example <pre>
         * JPlus.loadStyle('./v.css');
         * </pre>
         */
		loadStyle: function (url) {

			// 在顶部插入一个css，但这样肯能导致css没加载就执行 js 。所以，要保证样式加载后才能继续执行计算。
			return document.getElementsByTagName("HEAD")[0].appendChild(extend(document.createElement('link'), {
				href: url,
				rel: using.useLess ? 'stylesheet/less' : 'stylesheet',
				type: 'text/css'
			}));
		},

		/**
         * 判断一个 HTTP 状态码是否表示正常响应。
         * @param {Number} status 要判断的状态码。
         * @return {Boolean} 如果正常则返回true, 否则返回 false 。
		 * 一般地， 200、304、1223 被认为是正常的状态吗。
         */
		checkStatus: function (status) {

			// 获取状态。
			if (!status) {

				// 获取协议。
				var protocol = window.location.protocol;

				// 对谷歌浏览器, 在有些协议， status 不存在。
				return (protocol == "file: " || protocol == "chrome: " || protocol == "app: ");
			}

			// 检查， 各浏览器支持不同。
			return (status >= 200 && status < 300) || status == 304 || status == 1223;
		},

		/**
         * 同步载入文本。
         * @param {String} uri 地址。
         * @param {Function} [callback] 对返回值的处理函数。
         * @return {String} 载入的值。 因为同步，所以无法跨站。
         * @example <pre>
         * trace(  JPlus.loadText('./v.html')  );
         * </pre>
         */
		loadText: function (url, callback) {

			assert.notNull(url, "System.loadText(url, callback): {url} ~");

			// assert(window.location.protocol != "file:",
			// "System.loadText(uri, callback): 当前正使用 file 协议，请使用 http
			// 协议。 \r\n请求地址: {0}", uri);

			// 新建请求。
			// 下文对 XMLHttpRequest 对象进行兼容处理。
			var xmlHttp;

			if (window.XMLHttpRequest) {
				xmlHttp = new XMLHttpRequest();
			} else {
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			}

			try {

				// 打开请求。
				xmlHttp.open("GET", url, false);

				// 发送请求。
				xmlHttp.send(null);

				// 检查当前的 XMLHttp 是否正常回复。
				if (!using.checkStatus(xmlHttp.status)) {
					// 载入失败的处理。
					throw "请求失败:  \r\n   地址: " + url + " \r\n   状态: " + xmlHttp.status + "   " + xmlHttp.statusText + "  " + (window.location.protocol == "file:" ? '\r\n原因: 当前正使用 file 协议打开文件，请使用 http 协议。' : '');
				}

				url = xmlHttp.responseText;

				// 运行处理函数。
				return callback ? callback(url) : url;

			} catch (e) {

				// 调试输出。
			} finally {

				// 释放资源。
				xmlHttp = null;
			}

		},

		/**
         * 全部已载入的样式。
         * @type Array
         * @private
         */
		styles: [],

		/**
         * 全部已载入的组件全名。
         * @type Array
         * @private
         */
		scripts: [],

		/**
         * JPlus 安装的根目录, 可以为相对目录。
         * @config {String}
         */
		rootPath: (function () {
			try {
				var scripts = document.getElementsByTagName("script");

				// 当前脚本在 <script> 引用。最后一个脚本即当前执行的文件。
				scripts = scripts[scripts.length - 1];

				// IE6/7 使用 getAttribute
				scripts = !document.constructor ? scripts.getAttribute('src', 4) : scripts.src;

				// 设置路径。
				return (scripts.match(/[\S\s]*\//) || [""])[0];

			} catch (e) {

				// 出错后，设置当前位置.
				return "";
			}

		})().replace("system/core/assets/scripts/", ""),

		/**
         * 将指定的组件全名转为路径。
         * @param {String} namespace 组件全名。
         * @param {Boolean} isStyle=false 是否为样式表。
         */
		resolve: function (namespace, isStyle) {
			return namespace.replace(/^([^.]+\.[^.]+)\./, isStyle ? '$1.assets.styles.' : '$1.assets.scripts.').replace(/\./g, '/');
		}

	});

	/// #endregion

	/// #endregion

	/**
	 * 复制所有属性到任何对象。
	 * @param {Object} dest 复制目标。
	 * @param {Object} src 要复制的内容。
	 * @return {Object} 复制后的对象。
	 */
	function extend(dest, src) {

		assert(dest != null, "Object.extend(dest, src): {dest} 不可为空。", dest);

		// 直接遍历，不判断是否为真实成员还是原型的成员。
		for (var b in src)
			dest[b] = src[b];
		return dest;
	}

})();




/*********************************************************
 * System.Dom.Base
 *********************************************************/
/**
 * @fileOverview 提供最底层的 DOM 辅助函数。
 * @author xuld
 */
 
 
// Core - 核心部分
// Parse - 节点解析部分
// Traversing - 节点转移部分
// Manipulation - 节点处理部分
// Style - CSS部分
// Attribute - 属性部分
// Event - 事件部分
// DomReady - 加载部分
// Dimension - 尺寸部分 
// Offset - 定位部分

(function(window) {
	
	assert(!window.Dom || window.$ !== window.Dom.get, "重复引入 System.Dom.Base 模块。");
	
	// 变量简写

	/**
	 * document 简写。
	 * @type Document
	 */
	var document = window.document,
	
		/**
		 * Object 简写。
		 * @type Object
		 */
		Object = window.Object,
	
		/**
		 * Object.extend 简写。
		 * @type Function
		 */
		extend = Object.extend,
	
		/**
		 * 数组原型。
		 * @type Object
		 */
		ap = Array.prototype,
	
		/**
		 * Object.map 缩写。
		 * @type Object
		 */
		map = Object.map,
	
		/**
		 * 指示当前浏览器是否为标签浏览器。
		 */
		isStd = navigator.isStd,
	
		// DOM 
	
		/**
		 * 提供对单一原生 HTML 节点的封装操作。
		 * @class
		 * @remark 
		 * @see DomList
		 * @see Dom.get
		 * @see Dom.query
		 * @remark
		 * 所有 DOM 方法都是依赖于此类进行的。比如如下 HTML 代码:
		 * <pre>
		 * &lt;div id="myDivId"&gt;内容&lt;/div&gt;
		 * </pre>
		 * 现在如果要操作这个节点，必须获取这个节点对应的 **Dom** 对象实例。
		 * 最常用的创建 **Dom** 对象实例的方法是 {@link Dom.get}。如:
		 * <pre>
		 * var myDiv = Dom.get("myDivId");
		 * 
		 * myDiv.addClass("cssClass");
		 * </pre>
		 * 其中，myDiv就是一个 **Dom** 对象。然后通过 **Dom** 对象提供的方法可以方便地操作这个节点。<br>
		 * myDiv.node 属性就是这个 Dom 对象对应的原生 HTML 节点。即:
		 * <pre>
		 * Dom.get("myDivId").node === document.getElementById("myDivId");
		 * </pre>
		 * 
		 * **Dom** 类仅实现了对一个节点的操作，如果需要同时处理多个节点，可以使用 {@link DomList} 类。
		 * 	{@link DomList} 类的方法和 **Dom** 类的方法基本一致。
		 */
		Dom = Class({
			
			/**
			 * 获取当 Dom 对象实际对应的 HTML 节点实例。
			 * @type Node
			 * @protected
			 */
			node: null,
			
			/**
			 * 获取当前类对应的数据字段。
			 * @protected override
			 * @return {Object} 一个可存储数据的对象。
			 * @remark
			 * 此函数会在原生节点上创建一个 $data 属性以存储数据。
			 */
			dataField: function(){
				
				// 将数据绑定在原生节点上。
				// 这在  IE 6/7 存在内存泄露问题。
				// 由于 IE 6/7 即将退出市场。此处忽略。
				return this.node.$data || (this.node.$data = {});
			},
		
			/**
			 * 使用一个原生节点初始化 Dom 对象的新实例。
			 * @param {Node} node 封装的元素。
			 */
			constructor: function(node) {
				assert.isNode(node, "Dom#constructor(node): {node} 必须是 DOM 节点。");
				this.node = node;

				/// TODO: clear
				this.dom = node;
				/// TODO: clear
			},
		
			/**
			 * 将当前 Dom 对象插入到指定父 Dom 对象指定位置。
			 * @param {Node} parentNode 要添加的父节点。
			 * @param {Node} refNode=null 如果指定了此值，则当前节点将添加到此节点之前。
			 * @protected virtual
			 */
			attach: function(parentNode, refNode) {
				assert(parentNode && parentNode.nodeType, 'Dom#attach(parentNode, refNode): {parentNode} 必须是 DOM 节点。', parentNode);
				assert(refNode === null || refNode.nodeType, 'Dom#attach(parentNode, refNode): {refNode} 必须是 null 或 DOM 节点 。', refNode);
				parentNode.insertBefore(this.node, refNode);
			},
		
			/**
			 * 将当前 Dom 对象从指定的父 Dom 对象移除。
			 * @param {Node} parentNode 用于移除的父节点。
			 * @protected virtual
			 */
			detach: function(parentNode) {
				assert(parentNode && parentNode.removeChild, 'Dom#detach(parentNode): {parentNode} 必须是 DOM 节点 Dom 对象。', parent);
				
				// 仅当是直接父节点时删除。
				if(this.node.parentNode === parentNode)
					parentNode.removeChild(this.node);
			},
		
			/**
			 * 在当前 Dom 对象下插入一个子 Dom 对象到指定位置。
			 * @param {Dom} childControl 要插入 Dom 对象。
			 * @param {Dom} refControl=null 如果指定了此值，则插入到 Dom 对象之前。
			 * @protected virtual
			 */
			insertBefore: function(childControl, refControl) {
				assert(childControl && childControl.attach, 'Dom#insertBefore(childControl, refControl): {childControl} 必须 Dom 对象。', childControl);
				childControl.attach(this.node, refControl && refControl.node || null);
				return childControl;
			},
		
			/**
			 * 删除当 Dom 对象的指定 Dom 对象。
			 * @param {Dom} childControl 要删除 Dom 对象。
			 * @protected virtual
			 */
			removeChild: function(childControl) {
				assert(childControl && childControl.detach, 'Dom#removeChild(childControl): {childControl} 必须 Dom 对象。', childControl);
				
				childControl.detach(this.node);
				return childControl;
			},
			
			/**
			 * 判断当前节点是否和指定节点相等。
			 * @param {Dom} childControl 要判断的节点。
			 * @return {Boolean} 如果节点相同，则返回 true，否则返回 false 。
			 */
			equals: function(childControl){
				return this.node === childControl || (childControl && this.node === childControl.node);
			}
			
		}),
	
		/**
		 * 表示原生节点的集合。用于批量操作节点。
		 * @class
		 * @extends Array
		 * @see Dom
		 * @see Dom.query
		 * @remark
		 * **DomList** 是对元素列表的包装。  **DomList** 允许快速操作多个节点。 
		 * {@link Dom} 的所有方法对 **DomList** 都有效。
		 * 要查询 DomList 的方法，可以转到 {@link Dom} 类。
		 * 
		 * **DomList** 是一个伪数组，每个元素都是一个原生的 HTML 节点。
		 */
		DomList = Class({
	
			/**
			 * 获取当前集合的节点个数。
			 * @type {Number}
			 * @property
			 */
			length: 0,

			/**
			 * 使用包含节点的数组初始化 DomList 类的新实例。
			 * @param {Array/DomList} [doms] 用于初始化当前集合的节点集合。
			 * @constructor
			 */
			constructor: function(doms) {
				if (doms) {
					var dom;
					
					// 将参数的 doms 拷贝到当前集合。
					while (dom = doms[this.length]) {
						this[this.length++] = Dom.getNode(dom);
					}
				}
			},
	
			/**
			 * 获取当前集合中指定索引对应的 Dom 对象。
			 * @param {Number} index 要获取的元素索引。如果 *index* 小于 0， 则表示获取倒数 *index* 位置的元素。
			 * @return {Object} 指定位置所在的元素。如果指定索引的值不存在，则返回 undefined。
			 * @remark
			 * 使用 arr.item(-1) 可获取最后一个元素的值。
			 * @see Array#see
			 * @example 
			 * <pre>
		     * [0, 1, 2, 3].item(0);  // 0
		     * [0, 1, 2, 3].item(-1); // 3
		     * [0, 1, 2, 3].item(5);  // undefined
		     * </pre>
			 */
			item: function(index){
				var elem = this[index < 0 ? this.length + index : index];
				return elem ? new Dom(elem) : null;
			},
			
			/**
			 * 对当前集合的每个节点的 Dom 封装调用其指定属性名的函数，并将返回值放入新的数组返回。
			 * @param {String} fnName 要调用的函数名。
			 * @param {Array} args=[] 调用时的参数数组。
			 * @return {Array} 返回包含执行结果的数组。
			 * @see Array#see
			 */
			invoke: function(fnName, args) {
				args = args || [];
				var r = [];
				assert(dp[fnName] && dp[fnName].apply, "DomList#invoke(fnName): {fnName} 不是 Dom 对象的方法。", fnName);
				this.forEach(function(value) {
					value = new Dom(value);
					r.push(value[fnName].apply(value, args));
				});
				return r;
			},
			
			///TODO: clear
			
			concat: function(){
				assert.deprected('DomList#concat 已过时，请改用 DomList#add');
				return this.add.apply(this, arguments);
			},
			
			///TODO: clear
			
			/**
			 * 将参数节点添加到当前集合。
			 * @param {Node/NodeList/Array/DomList} ... 要增加的节点。
			 * @return this
			 */
			add: function() {
				for (var args = arguments, i = 0, value; i < args.length; i++) {
					value = args[i], j = -1;
					if(value){
						if(typeof value.length !== 'number')
							value = [value];
							
						while(++j < value.length)
							this.include(Dom.getNode(value[j]));
					}
				}
	
				return this;
			},

			/**
			 * 使用指定的 CSS 选择器或函数过滤当前集合，并返回满足要求的元素的新 DomList 对象。
			 * @param {String/Function} expression 用于过滤的 CSS 选择器或自定义函数，具体格式参考 {@link Array#filter}。
			 * @return {DomList} 满足要求的元素的新 DomList 对象。
			 */
			filter: function(expression) {
				return new DomList(ap.filter.call(this, typeof expression === 'string' ? function(elem){
					return Dom.match(elem, expression);
				} : expression));
			},
			
			/**
			 * 为每个元素绑定事件。
			 * @remark 见 {@link JPlus.Base#on}
			 */
			on: createDomListMthod('on'),

			/**
			 * 为每个元素删除绑定事件。
			 * @remark 见 {@link JPlus.Base#un}
			 */
			un: createDomListMthod('un'),

			/**
			 * 触发每个元素事件。
			 * @remark 见 {@link JPlus.Base#trigger}
			 */
			trigger: function(type, e) {
				return this.invoke('trigger', [type, e]).indexOf(false) < 0;
			}
			
		}),
	
		/**
		 * 表示一个点。包含 x 坐标和 y 坐标。
		 * @class Point
		 */
		Point = Class({
			
			/**
			 * @field {Number} x X 坐标。
			 */
			
			/**
			 * @field {Number} y Y 坐标。
			 */
	
			/**
			 * 初始化 Point 的新实例。
			 * @param {Number} x X 坐标。
			 * @param {Number} y Y 坐标。
			 * @constructor
			 */
			constructor: function(x, y) {
				this.x = x;
				this.y = y;
			},
			
			/**
			 * 将当前值加上 *p*。
			 * @param {Point} p 值。
			 * @return {Point} this
			 */
			add: function(p) {
				assert(p && 'x' in p && 'y' in p, "Point#add(p): {p} 必须有 'x' 和 'y' 属性。", p);
				return new Point(this.x + p.x, this.y + p.y);
			},

			/**
			 * 将当前值减去 *p*。
			 * @param {Point} JPlus 值。
			 * @return {Point} this
			 */
			sub: function(p) {
				assert(p && 'x' in p && 'y' in p, "Point#sub(p): {p} 必须有 'x' 和 'y' 属性。", p);
				return new Point(this.x - p.x, this.y - p.y);
			}
		}),
		
		/**
		 * DOM 事件。
		 */
		DomEvent = Class({

			/**
			 * 构造函数。
			 * @param {Object} target 事件对象的目标。
			 * @param {String} type 事件对象的类型。
			 * @param {Object} [e] 事件对象的属性。
			 * @constructor
			 */
			constructor: function(target, type) {
				assert.notNull(target, "Dom.Event#constructor(target, type): {target} ~");

				this.target = target;
				this.type = type;
			},
			
			/**
			 * 阻止事件的冒泡。
			 * @remark 默认情况下，事件会向父元素冒泡。使用此函数阻止事件冒泡。
			 */
			stopPropagation: function() {
				this.cancelBubble = true;
			},
			
			/**
			 * 取消默认事件发生。
			 * @remark 有些事件会有默认行为，如点击链接之后执行跳转，使用此函数阻止这些默认行为。
			 */
			preventDefault: function() {
				this.returnValue = false;
			},
			
			/// TODO: clear
			
			/**
			 * 停止默认事件和冒泡。
			 * @remark 此函数可以完全撤销事件。 事件处理函数中 return false 和调用 stop() 是不同的， return
			 *         false 只会阻止当前事件其它函数执行， 而 stop() 只阻止事件冒泡和默认事件，不阻止当前事件其它函数。
			 */
			stop: function() {
				assert.deprected('Dom.Event#stop() 已过时，请改用 return false 实现阻止事件。');
				this.stopPropagation();
				this.preventDefault();
			},
			
			/// TODO: clear
			
			/**
			 * 获取当前发生事件 Dom 对象。
			 * @return {Dom} 发生事件 Dom 对象。
			 */
			getTarget: function() {
				return new Dom(this.orignalType && this.currentTarget || (this.target.nodeType === 3 ? this.target.parentNode: this.target));
			}
		}),
		
		// 系统使用的变量
		
		/**
		 * Dom.prototype
		 */
		dp = Dom.prototype,
		
		/**
		 * DomEvent.prototype
		 */
		ep = DomEvent.prototype,
		
		/**
		 * 一个返回 true 的函数。
		 */
		returnTrue = Function.from(true),

		/**
		 * 用于测试的元素。
		 * @type Element
		 */
		div = document.createElement('DIV'),
	
		/**
		 * 函数 Dom.parseNode使用的新元素缓存。
		 * @type Object
		 */
		cache = {},
		
		/**
		 * 默认事件。
		 * @type Object
		 */
		defaultEvent = {
			
			/**
			 * 阻止事件的函数。 
			 * @param {Event} e 事件参数。
			 */
			stopEvent: function(e){
				e.stopPropagation();
				e.preventDefault();
			},

			/**
			 * 发送处理指定的事件。
			 * @param {Dom} dom 事件所有者。
			 * @param {Event} eventName 事件名。
			 * @param {Function} eventListener 事件监听器。
			 * @return {Event} e 事件参数。
			 */
			dispatch: function (dom, eventName, eventListener, e) {
				dom = dom.node;
				
				var event = e;
				
				if(!e || !e.type){
					e = new Dom.Event(dom, eventName);
					
					if(event) {
						
						// IE 8- 在处理原生事件时肯能出现错误。
						try{
							extend(e, event);
						}catch(ex){
							
						}
						
					}
				}

				return eventListener(e) && (!dom[eventName = 'on' + eventName] || dom[eventName](e) !== false);
			},

			/**
			 * 添加绑定事件。
			 * @param {Dom} ctrl 事件所有者。
			 * @param {String} type 类型。
			 * @param {Function} fn 函数。
			 */
			add: div.addEventListener ? function (dom, type, fn) {
				dom.node.addEventListener(type, fn, false);
			} : function (dom, type, fn) {
				dom.node.attachEvent('on' + type, fn);
			},

			/**
			 * 删除事件。
			 * @param {Object} elem 对象。
			 * @param {String} type 类型。
			 * @param {Function} fn 函数。
			 */
			remove: div.removeEventListener ? function (dom, type, fn) {
				dom.node.removeEventListener(type, fn, false);
			} : function (dom, type, fn) {
				dom.node.detachEvent('on' + type, fn);
			}

		},
		
		/**
		 * 鼠标事件。 
		 * @type Object
		 */
		mouseEvent = defaultEvent,
		
		/**
		 * 键盘事件。 
		 * @type Object
		 */
		keyEvent = defaultEvent,
		
		// 正则

		/**
		 * 处理 <div/> 格式标签的正则表达式。
		 * @type RegExp
		 */
		rXhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
		
		/// #if CompactMode
		
		/**
		 * 透明度的正则表达式。
		 * @type RegExp IE8 使用滤镜支持透明度，这个表达式用于获取滤镜内的表示透明度部分的子字符串。
		 */
		rOpacity = /opacity=([^)]*)/,
		
		/// #endif
		
		/**
		 * 是否属性的正则表达式。
		 * @type RegExp
		 */
		rStyle = /-(\w)|float/g,
		
		/**
		 * 判断 body 节点的正则表达式。
		 * @type RegExp
		 */
		rBody = /^(?:BODY|HTML|#document)$/i,

		/**
		 * 判断选择框的正则表达式。
		 * @type RegExp
		 */
		rCheckBox = /^(?:checkbox|radio)$/,
		
		// attr
		
		/**
		 * 默认用于获取和设置属性的函数。
		 */
		defaultHook = {
			getProp: function(elem, name) {
				return name in elem ? elem[name] : null;
			},
			setProp: function(elem, name, value) {
				if ('238'.indexOf(elem.nodeType) === -1){
					elem[name] = value;
				}
			},
			
			get: function(elem, name) {
				return elem.getAttribute ? elem.getAttribute(name) : this.getProp(elem, name);
			},
			set: function(elem, name, value) {
				if (elem.setAttribute) {

					// 如果设置值为 null, 表示删除属性。
					if (value === null) {
						elem.removeAttribute(name);
					} else {
						elem.setAttribute(name, value);
					}
				} else {
					this.setProp(elem, name, value);
				}
			}
		},
		
		/**
		 * 获取和设置优先使用 prop 而不是 attr 的特殊属性的函数。
		 */
		propHook = {
			get: function(elem, name, type) {
				return type || !(name in elem) ? defaultHook.get(elem, name) : elem[name];
			},
			set: function(elem, name, value) {
				if (name in elem) {
					elem[name] = value;
				} else {
					defaultHook.set(elem, name, value);
				}
			}
		},

		/**
		 * 获取和设置返回类型是 boolean 的特殊属性的函数。
		 */
		boolHook = {
			get: function(elem, name, type) {
				return type ? elem[name] ? name.toLowerCase() : null : !!elem[name];
			},
			set: function(elem, name, value) {
				elem[name] = value;
			}
		},
		
		/**
		 * 获取和设置 FORM 专有属性的函数。
		 */
		formHook = {
			get: function(elem, name, type){
				var value = defaultHook.get(elem, name);
				if(!type && !value) {
					
					// elem[name] 被覆盖成 DOM 节点，创建空的 FORM 获取默认值。
					if(elem[name].nodeType){
						elem = Dom.createNode('form');
					}
					value = elem[name];
				}
				return value;
			},	
			set: defaultHook.set
		},
		
		// 修复用的 JSON 对象
		
		/**
		 * 在 Dom.parseNode 和 setHtml 中对 HTML 字符串进行包装用的字符串。
		 * @type Object 部分元素只能属于特定父元素， parseFix 列出这些元素，并使它们正确地添加到父元素中。 IE678
		 *       会忽视第一个标签，所以额外添加一个 div 标签，以保证此类浏览器正常运行。
		 */
		parseFix = {
			$default: isStd ? [1, '', '']: [2, '$<div>', '</div>'],
			option: [2, '<select multiple="multiple">', '</select>'],
			legend: [2, '<fieldset>', '</fieldset>'],
			thead: [2, '<table>', '</table>'],
			tr: [3, '<table><tbody>', '</tbody></table>'],
			td: [4, '<table><tbody><tr>', '</tr></tbody></table>'],
			col: [3, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
			area: [2, '<map>', '</map>']
		},
		
		/**
		 * 特殊属性的设置方式。
		 */
		styleFix = {
			height: function(value) {
				this.node.style.height = value > 0 ? value + 'px' : value <= 0 ? '0px' : value;
				return this;
			},
			width: function(value) {
				this.node.style.width = value > 0 ? value + 'px' : value <= 0 ? '0px' : value;
				return this;
			}
		},
		
		/**
		 * 别名属性的列表。
		 * @type Object
		 */
		propFix = {
			innerText: 'innerText' in div ? 'innerText' : 'textContent'
		},
		
		/**
		 * 特殊属性的列表。
		 * @type Object
		 */
		attrFix = {

			maxLength: {
				get: propHook.get,
				set: function(elem, name, value) {
					if (value || value === 0) {
						elem[name] = value;
					} else {
						defaultHook.set(elem, name, null);
					}
				}
			},

			selected: {
				get: function(elem, name, type) {

					// Webkit、IE 误报 Selected 属性。
					// 通过调用 parentNode 属性修复。
					var parent = elem.parentNode;
					
					// 激活 select, 更新 option 的 select 状态。
					if (parent) {
						parent.selectedIndex;
						
						// 同理，处理 optgroup 
						if (parent.parentNode) {
							parent.parentNode.selectedIndex;
						}
					}
					
					// type  0 => boolean , 1 => "selected",  2 => defaultSelected => "selected"
					return name in elem ? type ? (type === 1 ? elem[name] : elem.defaultSelected) ? name : null : elem[name] : defaultHook.get(elem, name);
					
				},
				set : boolHook.set
			},
			
			checked: {
				get: function(elem, name, type) {
					// type  0 => boolean , 1 => "checked",  2 => defaultChecked => "checked"
					return name in elem ? type ? (type === 1 ? elem[name] : elem.defaultChecked) ? name : null : elem[name] : defaultHook.get(elem, name);
				},
				set: boolHook.set
			},
			
			value: {
				get: function(elem, name, type) {
					// type  0/1 => "value",  2 => defaultValue => "value"
					return name in elem ? type !== 2 ? elem[name] : elem.defaultValue : defaultHook.get(elem, name);
				},
				set: propHook.set
			},

			tabIndex: {
				get: function(elem, name, type) {
					// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
					// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
					var value = elem.getAttributeNode(name);
					value = value && value.specified && value.value || null;
					return type ? value : +value;
				},
				set: propHook.set
			}

		},
		
		/**
		 * 字符串字段。
		 * @type Object
		 */
		textFix = {},
		
		/// #if CompactMode
		 
		/**
		 * 获取元素的实际的样式属性。
		 * @param {Element} elem 需要获取属性的节点。
		 * @param {String} name 需要获取的CSS属性名字。
		 * @return {String} 返回样式字符串，肯能是 undefined、 auto 或空字符串。
		 */
		getStyle = window.getComputedStyle ? function(elem, name) {
	
			// getComputedStyle为标准浏览器获取样式。
			assert.isElement(elem, "Dom.getStyle(elem, name): {elem} ~");
	
			// 获取真实的样式owerDocument返回elem所属的文档对象
			// 调用getComputeStyle的方式为(elem,null)
			var computedStyle = elem.ownerDocument.defaultView.getComputedStyle(elem, null);
	
			// 返回 , 在 火狐如果存在 IFrame， 则 computedStyle == null
			// http://drupal.org/node/182569
			return computedStyle ? computedStyle[name]: null;
	
		}: function(elem, name) {
	
			assert.isElement(elem, "Dom.getStyle(elem, name): {elem} ~");
	
			// 特殊样式保存在 styleFix 。
			if( name in styleFix) {
				switch (name) {
					case 'height':
						return elem.offsetHeight === 0 ? 'auto': elem.offsetHeight -  Dom.calc(elem, 'by+py') + 'px';
					case 'width':
						return elem.offsetWidth === 0 ? 'auto': elem.offsetWidth -  Dom.calc(elem, 'bx+px') + 'px';
					case 'opacity':
						return rOpacity.test(styleString(elem, 'filter')) ? parseInt(RegExp.$1) / 100 + '': '1';
				}
			}
			// currentStyle：IE的样式获取方法,runtimeStyle是获取运行时期的样式。
			// currentStyle是运行时期样式与style属性覆盖之后的样式
			var r = elem.currentStyle;
	
			if(!r)
				return "";
			r = r[name];
	
			// 来自 jQuery
			// 如果返回值不是一个带px的 数字。 转换为像素单位
			if(/^-?\d/.test(r) && !/^-?\d+(?:px)?$/i.test(r)) {
	
				// 保存初始值
				var style = elem.style, left = style.left, rsLeft = elem.runtimeStyle.left;
	
				// 放入值来计算
				elem.runtimeStyle.left = elem.currentStyle.left;
				style.left = name === "fontSize" ? "1em": (r || 0);
				r = style.pixelLeft + "px";
	
				// 回到初始值
				style.left = left;
				elem.runtimeStyle.left = rsLeft;
	
			}
	
			return r;
		},
		
		/// #else
		
		/// getStyle = function (elem, name) {
		///
		/// 	// 获取样式
		/// 	var computedStyle = elem.ownerDocument.defaultView.getComputedStyle(elem, null);
		///
		/// 	// 返回
		/// 	return computedStyle ? computedStyle[ name ]: null;
		///
		/// },
		/// #endif

		/**
		 * float 属性的名字。
		 * @type String
		 */
		styleFloat = 'cssFloat' in div.style ? 'cssFloat': 'styleFloat',
		
		// IE：styleFloat Other：cssFloat
		
		/**
		 * 浏览器使用的真实的 DOMContentLoaded 事件名字。
		 * @type String
		 */
		domReady,

		t;
	
	// 变量初始化。

	// 初始化 parseFix。
	parseFix.optgroup = parseFix.option;
	parseFix.tbody = parseFix.tfoot = parseFix.colgroup = parseFix.caption = parseFix.thead;
	parseFix.th = parseFix.td;

	// 初始化 attrFix。
	map("enctype encoding action method target", formHook, attrFix);

	// 初始化 attrFix。
	map("defaultChecked defaultSelected readOnly disabled autofocus autoplay async controls hidden loop open required scoped compact noWrap isMap declare noshade multiple noresize defer useMap", boolHook, attrFix);

	// 初始化 propFix。
	map("readOnly tabIndex defaultChecked defaultSelected accessKey useMap contentEditable maxLength", function(value) {
		propFix[value.toLowerCase()] = value;
	});

	// 初始化 attrFix。
	map("innerHTML innerText textContent tagName nodeName nodeType nodeValue defaultValue selectedIndex cellPadding cellSpacing rowSpan colSpan frameBorder", function(value) {
		propFix[value.toLowerCase()] = value;
		attrFix[value] = propHook;
	});
	
	// 初始化 textFix。
	textFix.INPUT = textFix.SELECT = textFix.TEXTAREA = 'value';
	textFix['#text'] = textFix['#comment'] = 'nodeValue';
	
	/// #region Dom
	
	/**
	 * @class Dom
	 */
	extend(Dom, {
		
		/**
		 * 根据一个 *id* 或原生节点获取一个 {@link Dom} 类的实例。
		 * @param {String/Node/Dom/DomList} id 要获取元素的 id 或用于包装成 Dom 对象的任何元素，如是原生的 DOM 节点、原生的 DOM 节点列表数组或已包装过的 Dom 对象。。
	 	 * @return {Dom} 此函数返回是一个 Dom 类型的变量。通过这个变量可以调用所有文档中介绍的 DOM 操作函数。如果无法找到指定的节点，则返回 null 。此函数可简写为 $。
	 	 * @static
	 	 * @example
	 	 * 找到 id 为 a 的元素。
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">
	 	 * &lt;p id="a"&gt;once&lt;/p&gt; &lt;div&gt;&lt;p&gt;two&lt;/p&gt;&lt;/div&gt; &lt;p&gt;three&lt;/p&gt;
	 	 * </pre>
	 	 * #####JavaScript:
	 	 * <pre>Dom.get("a");</pre>
	 	 * #####结果:
	 	 * <pre>{&lt;p id="a"&gt;once&lt;/p&gt;}</pre>
	 	 * 
	 	 * <br>
	 	 * 返回 id 为 a1 的 DOM 对象
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">&lt;p id="a1"&gt;&lt;/p&gt; &lt;p id="a2"&gt;&lt;/p&gt; </pre>
	 	 *
	 	 * #####JavaScript:
	 	 * <pre>Dom.get(document.getElecmentById('a1')) // 等效于 Dom.get('a1')</pre>
	 	 * <pre>Dom.get(['a1', 'a2']); // 等效于 Dom.get('a1')</pre>
	 	 * <pre>Dom.get(Dom.get('a1')); // 等效于 Dom.get('a1')</pre>
	 	 * 
	 	 * #####结果:
	 	 * <pre>{&lt;p id="a1"&gt;&lt;/p&gt;}</pre>
		 */
		get: function(id) {
			return typeof id === "string" ?
				(id = document.getElementById(id)) && new Dom(id) :
				id ? 
					id.nodeType || id.setTimeout ? 
						new Dom(id) :
						id.node ? 
							new Dom(id.node) :
							Dom.get(id[0]) : 
					null;
		},
		
		/**
		 * 执行一个 CSS 选择器，返回第一个元素对应的 {@link Dom} 对象。
		 * @param {String/NodeList/DomList/Array/Dom} 用来查找的 CSS 选择器或原生的 DOM 节点。
		 * @return {Element} 如果没有对应的节点则返回一个空的 DomList 对象。
	 	 * @static
	 	 * @see DomList
	 	 * @example
	 	 * 找到第一个 p 元素。
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">
	 	 * &lt;p&gt;one&lt;/p&gt; &lt;div&gt;&lt;p&gt;two&lt;/p&gt;&lt;/div&gt; &lt;p&gt;three&lt;/p&gt;
	 	 * </pre>
	 	 * 
	 	 * #####Javascript:
	 	 * <pre>
	 	 * Dom.find("p");
	 	 * </pre>
	 	 * 
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">
	 	 * {  &lt;p&gt;one&lt;/p&gt;  }
	 	 * </pre>
	 	 * 
	 	 * <br>
	 	 * 找到第一个 p 元素，并且这些元素都必须是 div 元素的子元素。
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">
	 	 * &lt;p&gt;one&lt;/p&gt; &lt;div&gt;&lt;p&gt;two&lt;/p&gt;&lt;/div&gt; &lt;p&gt;three&lt;/p&gt;</pre>
	 	 * 
	 	 * #####Javascript:
	 	 * <pre>
	 	 * Dom.find("div &gt; p");
	 	 * </pre>
	 	 * 
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">
	 	 * { &lt;p&gt;two&lt;/p&gt; }
	 	 * </pre>
		 */
		find: function(selector){
			return typeof selector === "string" ?
				document.find(selector) :
				Dom.get(selector);
		},
		
		/**
		 * 执行一个 CSS 选择器，返回一个新的 {@link DomList} 对象。
		 * @param {String/NodeList/DomList/Array/Dom} 用来查找的 CSS 选择器或原生的 DOM 节点列表。
		 * @return {Element} 如果没有对应的节点则返回一个空的 DomList 对象。
	 	 * @static
	 	 * @see DomList
	 	 * @example
	 	 * 找到所有 p 元素。
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">
	 	 * &lt;p&gt;one&lt;/p&gt; &lt;div&gt;&lt;p&gt;two&lt;/p&gt;&lt;/div&gt; &lt;p&gt;three&lt;/p&gt;
	 	 * </pre>
	 	 * 
	 	 * #####Javascript:
	 	 * <pre>
	 	 * Dom.query("p");
	 	 * </pre>
	 	 * 
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">
	 	 * [  &lt;p&gt;one&lt;/p&gt; ,&lt;p&gt;two&lt;/p&gt;, &lt;p&gt;three&lt;/p&gt;  ]
	 	 * </pre>
	 	 * 
	 	 * <br>
	 	 * 找到所有 p 元素，并且这些元素都必须是 div 元素的子元素。
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">
	 	 * &lt;p&gt;one&lt;/p&gt; &lt;div&gt;&lt;p&gt;two&lt;/p&gt;&lt;/div&gt; &lt;p&gt;three&lt;/p&gt;</pre>
	 	 * 
	 	 * #####Javascript:
	 	 * <pre>
	 	 * Dom.query("div &gt; p");
	 	 * </pre>
	 	 * 
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">
	 	 * [ &lt;p&gt;two&lt;/p&gt; ]
	 	 * </pre>
         * 
	 	 * <br>
         * 查找所有的单选按钮(即: type 值为 radio 的 input 元素)。
         * <pre>Dom.query("input[type=radio]");</pre>
		 */
		query: function(selector) {
			return selector ? 
				typeof selector === 'string' ? 
					document.query(selector) :
					selector.nodeType || selector.setTimeout ?
						new DomList([selector]) :
						typeof selector.length === 'number' ? 
							selector instanceof DomList ?
								selector :
								new DomList(selector) :
							new DomList([Dom.getNode(selector)]) :
				new DomList;
		},
		
		/**
		 * 根据提供的原始 HTML 标记字符串，解析并动态创建一个节点，并返回这个节点的 Dom 对象包装对象。
		 * @param {String/Node} html 用于动态创建DOM元素的HTML字符串。
		 * @param {Document} ownerDocument=document 创建DOM元素所在的文档。
		 * @param {Boolean} cachable=true 指示是否缓存节点。
		 * @return {Dom} Dom 对象。
	 	 * @static
	 	 * @remark
	 	 * 可以传递一个手写的 HTML 字符串，或者由某些模板引擎或插件创建的字符串，也可以是通过 AJAX 加载过来的字符串。但是在你创建 input 元素的时会有限制，可以参考第二个示例。当然这个字符串可以包含斜杠 (比如一个图像地址)，还有反斜杠。当创建单个元素时，请使用闭合标签或 XHTML 格式。
	 	 * 在这个函数的内部，是通过临时创建一个元素，并将这个元素的 innerHTML 属性设置为给定的标记字符串，来实现标记到 DOM 元素转换的。所以，这个函数既有灵活性，也有局限性。
	 	 * 
	 	 * @example
	 	 * 动态创建一个 div 元素（以及其中的所有内容），并将它追加到 body 元素中。
	 	 * #####JavaScript:
	 	 * <pre>Dom.parse("&lt;div&gt;&lt;p&gt;Hello&lt;/p&gt;&lt;/div&gt;").appendTo(document.body);</pre>
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">[&lt;div&gt;&lt;p&gt;Hello&lt;/p&gt;&lt;/div&gt;]</pre>
	 	 * 
	 	 * 创建一个 &lt;input&gt; 元素必须同时设定 type 属性。因为微软规定 &lt;input&gt; 元素的 type 只能写一次。
	 	 * #####JavaScript:
	 	 * <pre>
	 	 * // 在 IE 中无效:
	 	 * Dom.parse("&lt;input&gt;").setAttr("type", "checkbox");
	 	 * // 在 IE 中有效:
	 	 * Dom.parse("&lt;input type='checkbox'&gt;");
	 	 * </pre>        
		 */
		parse: function(html, context, cachable) {

			assert.notNull(html, 'Dom.parse(html, context, cachable): {html} ~');

			return html.node ? html: new Dom(Dom.parseNode(html, context, cachable));
		},

		/**
		 * 创建一个指定标签的节点，并返回这个节点的 Dom 对象包装对象。
		 * @param {String} tagName 要创建的节点标签名。
		 * @param {String} className 用于新节点的 CSS 类名。
	 	 * @static
	 	 * @example
	 	 * 动态创建一个 div 元素（以及其中的所有内容），并将它追加到 body 元素中。在这个函数的内部，是通过临时创建一个元素，并将这个元素的 innerHTML 属性设置为给定的标记字符串，来实现标记到 DOM 元素转换的。所以，这个函数既有灵活性，也有局限性。
	 	 * #####JavaScript:
	 	 * <pre>Dom.create("div", "cls").appendTo(document.body);</pre>
	 	 *
	 	 * 创建一个 div 元素同时设定 class 属性。
	 	 * #####JavaScript:
	 	 * <pre>Dom.create("div", "className");</pre>
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">{&lt;div class="className"&gt;&lt;/div&gt;}</pre>
		 */
		create: function(tagName, className) {
			return new Dom(Dom.createNode(tagName, className || ''));
		},
		
		/**
		 * 根据一个 id 获取元素。如果传入的id不是字符串，则直接返回参数。
		 * @param {String/Node/Dom} id 要获取元素的 id 或元素本身。
	 	 * @return {Node} 元素。
	 	 * @static
		 */
		getNode: function (id) {
			return id ? 
					id.nodeType || id.setTimeout ?
						id :
						id.node || (typeof id === "string" ? 
							document.getElementById(id) :
							Dom.getNode(id[0])
						) :
						null;
		},
		
		/**
		 * 创建一个节点。
		 * @param {String} tagName 创建的节点的标签名。
		 * @param {String} className 创建的节点的类名。
	 	 * @static
		 */
		createNode: function(tagName, className) {
			assert.isString(tagName, 'Dom.create(tagName, className): {tagName} ~');
			var div = document.createElement(tagName);
			div.className = className;
			return div;
		},
		
		/**
		 * 解析一个 html 字符串，返回相应的原生节点。
		 * @param {String/Element} html 要解析的 HTML 字符串。如果解析的字符串是一个 HTML 字符串，则此函数会忽略字符串前后的空格。
		 * @param {Element} context=document 生成节点使用的文档中的任何节点。
		 * @param {Boolean} cachable=true 指示是否缓存节点。这会加速下次的解析速度。
		 * @return {Element/TextNode/DocumentFragment} 如果 HTML 是纯文本，返回 TextNode。如果 HTML 包含多个节点，返回 DocumentFragment 。否则返回 Element。
	 	 * @static
		 */
		parseNode: function(html, context, cachable) {

			// 不是 html，直接返回。
			if( typeof html === 'string') {

				var srcHTML = html;

				// 查找是否存在缓存。
				html = cache[srcHTML];
				context = context && context.ownerDocument || document;

				assert(context.createElement, 'Dom.parseNode(html, context, cachable): {context} 必须是 DOM 节点。', context);

				if(html && html.ownerDocument === context) {

					// 复制并返回节点的副本。
					html = html.cloneNode(true);

				} else {

					// 测试查找 HTML 标签。
					var tag = /<([\w:]+)/.exec(srcHTML);
					cachable = cachable !== false;

					if(tag) {

						assert.isString(srcHTML, 'Dom.parseNode(html, context, cachable): {html} ~');
						html = context.createElement("div");

						var wrap = parseFix[tag[1].toLowerCase()] || parseFix.$default;

						// IE8- 会过滤字符串前的空格。
						// 为了保证全部浏览器统一行为，此处删除全部首尾空格。

						html.innerHTML = wrap[1] + srcHTML.trim().replace(rXhtmlTag, "<$1></$2>") + wrap[2];

						// UE67: 如果节点未添加到文档。需要重置 checkbox 的 checked 属性。
						if (navigator.isQuirks) {
							each(html.getElementsByTagName('INPUT'), function(elem) {
								if(rCheckBox.test(elem.type)) {
									elem.checked = elem.defaultChecked;
								}
							});
						}

						// 转到正确的深度。
						// IE 肯能无法正确完成位置标签的处理。
						for( tag = wrap[0]; tag--; )
							html = html.lastChild;

						assert.isNode(html, "Dom.parseNode(html, context, cachable): 无法根据 {html} 创建节点。", srcHTML);

						// 如果解析包含了多个节点。
						if (html.previousSibling) {
							wrap = html.parentNode;

							assert(context.createDocumentFragment, 'Dom.parseNode(html, context, cachable): {context} 必须是 DOM 节点。', context);
							html = context.createDocumentFragment();
							while (wrap.firstChild) {
								html.appendChild(wrap.firstChild);
							}
						} else {

							// 删除用于创建节点的父 DIV 标签。
							html.parentNode.removeChild(html);
						}

						// 一般使用最后的节点， 如果存在最后的节点，使用父节点。
						// 如果有多节点，则复制到片段对象。
						cachable = cachable && !/<(?:script|object|embed|option|style)/i.test(srcHTML);

					} else {

						// 创建文本节点。
						html = context.createTextNode(srcHTML);
					}

					if(cachable) {
						cache[srcHTML] = html.cloneNode(true);
					}

				}

			}

			return html;

		},
		
		/**
		 * 判断一个元素是否符合一个选择器。
		 * @param {Node} elem 一个 HTML 节点。
		 * @param {String} selector 一个 CSS 选择器。
		 * @return {Boolean} 如果指定的元素匹配输入的选择器，则返回 true， 否则返回 false 。
	 	 * @static
		 */
		match: function (elem, selector) {
			assert.isString(selector, "Dom#find(selector): selector ~。");
			
			if(elem.nodeType !== 1)
				return false;
				
			if(!elem.parentNode){
				var div = document.createElement('div');
				div.appendChild(elem);
				try{
					return match(elem, selector);
				} finally {
					div.removeChild(elem);
				}
			}
			return match(elem, selector);
		},
		
		/// TODO: clear
		
		hasChild: function(elem, child){
			assert.deprected("Dom.hasChild 已过时，请改用 Dom.has");
			return Dom.has(elem, child);
		},
		
		/// TODO: clear

		/**
		 * 判断指定节点之后有无存在子节点。
		 * @param {Element} elem 节点。
		 * @param {Element} child 子节点。
		 * @return {Boolean} 如果确实存在子节点，则返回 true ， 否则返回 false 。
	 	 * @static
		 */
		has: div.compareDocumentPosition ? function(elem, child) {
			assert.isNode(elem, "Dom.has(elem, child): {elem} ~");
			assert.isNode(child, "Dom.has(elem, child): {child} ~");
			return !!(elem.compareDocumentPosition(child) & 16);
		}: function(elem, child) {
			assert.isNode(elem, "Dom.has(elem, child): {elem} ~");
			assert.isNode(child, "Dom.has(elem, child): {child} ~");
			while(child = child.parentNode)
				if(elem === child)
					return true;

			return false;
		},
		
		/**
		 * 获取一个元素对应的文本。
		 * @param {Element} elem 元素。
		 * @return {String} 值。对普通节点返回 text 属性。
	 	 * @static
		 */
		getText: function(elem) {
			assert.isNode(elem, "Dom.getText(elem, name): {elem} ~");
			return elem[textFix[elem.nodeName] || propFix.innerText] || '';
		},

		/**
		 * 获取元素的属性值。
		 * @param {Node} elem 元素。
		 * @param {String} name 要获取的属性名称。
		 * @return {String} 返回属性值。如果元素没有相应属性，则返回 null 。
	 	 * @static
		 */
		getAttr: function(elem, name, type) {
			
			assert.isNode(elem, "Dom.getAttr(elem, name): {elem} ~");
			
			name = propFix[name] || name;
			
			var hook = attrFix[name];
			
			// 如果存在钩子，使用钩子获取属性。
			// 最后使用 defaultHook 获取。
			return hook ? hook.get(elem, name, type) : defaultHook.get(elem, name.toLowerCase(), type);

		},
		
		/**
		 * 判断一个节点是否隐藏。
		 * @method isHidden
		 * @return {Boolean} 隐藏返回 true 。
	 	 * @static
		 */
		
		/**
		 * 检查是否含指定类名。
		 * @param {Element} elem 要测试的元素。
		 * @param {String} className 类名。
		 * @return {Boolean} 如果存在返回 true。
	 	 * @static
		 */
		hasClass: function(elem, className) {
			assert.isNode(elem, "Dom.hasClass(elem, className): {elem} ~");
			assert(className && (!className.indexOf || !/[\s\r\n]/.test(className)), "Dom.hasClass(elem, className): {className} 不能空，且不允许有空格和换行。如果需要判断 2 个 class 同时存在，可以调用两次本函数： if(hasClass('A') && hasClass('B')) ...");
			return (" " + elem.className + " ").indexOf(" " + className + " ") >= 0;
		},

		/**
		 * 存储事件对象的信息。
		 */
		$event: {},
		
		/**
		 * 特殊属性集合。
		 * @type Object 特殊的属性，在节点复制时不会被复制，因此需要额外复制这些属性内容。
	 	 * @static
		 */
		cloneFix: {
			INPUT: function(srcElem, destElem) {
				
				if (rCheckBox.test(srcElem.type)) {

					// IE6 必须同时设置 defaultChecked 属性。
					destElem.defaultChecked = destElem.checked = srcElem.checked;

					// IE67 无法复制 value 属性。
					if (destElem.value !== srcElem.value) {
						destElem.value = srcElem.value;
					}
				} else {
					destElem.value = srcElem.value;
				}
			},
			TEXTAREA: 'value',
			OPTION: 'selected',
			OBJECT: function(destElem, srcElem) {
				if (destElem.parentNode) {
					destElem.outerHTML = srcElem.outerHTML;
					
					if(srcElem.innerHTML && !destElem.innerHTML)
						destElem.innerHTML = srcElem.innerHTML;
				}
			}
		},
		
		/**
		 * 特殊属性集合。
		 * @property
		 * @type Object
		 * @static
		 * @private
		 */
		attrFix: attrFix,

		/**
		 * 特殊属性集合。
		 * @property
		 * @type Object
		 * @static
		 * @private
		 */
		propFix: propFix,
		
		/**
		 * 获取文本时应使用的属性值。
		 * @private
	 	 * @static
		 */
		textFix: textFix,
		
		/**
		 * 特殊的样式集合。
		 * @property
		 * @type Object
		 * @private
	 	 * @static
		 */
		styleFix: styleFix,
	
		/**
		 * 用于查找所有支持的伪类的函数集合。
		 * @private
	 	 * @static
		 */
		pseudos: {
			
			target : function (elem) {
				var nameOrId = elem.id || elem.name;
				if(!nameOrId) return false;
				var doc = getDocument(elem).defaultView;
				return nameOrId === (doc.defaultView || doc.parentWindow).location.hash.slice(1)
			},

			/**
			 * 判断一个节点是否有元素节点或文本节点。
			 * @param {Element} elem 要测试的元素。
			 * @return {Boolean} 如果存在子节点，则返回 true，否则返回 false 。
			 */
			empty: Dom.isEmpty = function(elem) {
				for( elem = elem.firstChild; elem; elem = elem.nextSibling )
					if( elem.nodeType === 1 || elem.nodeType === 3 ) 
						return false;
				return true;
			},
			
			contains: function( elem, args){ 
				return Dom.getText(elem).indexOf(args) >= 0;
			},
			
			/**
			 * 判断一个节点是否不可见。
			 * @return {Boolean} 如果元素不可见，则返回 true 。
			 */
			hidden: Dom.isHidden = function(elem) {
				return (elem.style.display || getStyle(elem, 'display')) === 'none';
			},
			visible: function( elem ){ return !Dom.isHidden(elem); },
			
			not: function(elem, args){ return !match(elem, args); },
			has: function(elem, args){ return query(args, new Dom(elem)).length > 0; },
			
			selected: function(elem) { return attrFix.selected.get(elem, 'selected', 1); },
			checked: function(elem){ return elem.checked; },
			enabled: function(elem){ return elem.disabled === false; },
			disabled: function(elem){ return elem.disabled === true; },
			
			input: function(elem){ return /^(input|select|textarea|button)$/i.test(elem.nodeName); },
			
			"nth-child": function(args, oldResult, result){
				var t = Dom.pseudos;
				if(t[args]){
					t[args](null, oldResult, result);	
				} else if(args = oldResult[args - 1])
					result.push(args);
			},
			"first-child": function (args, oldResult, result) {
				if(args = oldResult[0])
					result.push(args);
			},
			"last-child": function (args, oldResult, result) {
				if(args = oldResult[oldResult.length - 1])
					result.push(args);
			},
			"only-child": function(elem){ 
				var p = new Dom(elem.parentNode).first(elem.nodeName);
				return p && p.next(); 
			},
			odd: function(args, oldResult, result){
				var index = 0, elem, t;
				while(elem = oldResult[index++]) {
					if(args){
						result.push(elem);	
					}
				}
			},
			even: function(args, oldResult, result){
				return Dom.pseudos.odd(!args, oldResult, result);
			}
			
		},

		/**
		 * 显示元素的样式。
		 * @static
		 * @type Object
		 */
		displayFix: {
			position: "absolute",
			visibility: "visible",
			display: "block"
		},
		
		/**
		 * 不需要单位的 css 属性。
		 * @static
		 * @type Object
		 */
		styleNumbers: map('fillOpacity fontWeight lineHeight opacity orphans widows zIndex zoom', returnTrue, {}),

		/**
		 * 默认最大的 z-index 。
		 * @property zIndex
		 * @type Number
		 * @private
		 * @static
		 */
		
		/**
		 * 获取 window 对象的 Dom 对象封装示例。
	 	 * @static
		 */
		window: new Dom(window),
		
		/**
		 * 获取 document 对象的 Dom 对象封装示例。
	 	 * @static
		 */
		document: new Dom(document),

		/**
		 * 获取元素的计算样式。
		 * @param {Element} elem 元素。
		 * @param {String} name  要访问的属性名称。
		 * @return {String} 样式。
	 	 * @static
	 	 * 访问元素的样式属性。
		 * @example
		 * 取得第一个段落的color样式属性的值。
		 * #####JavaScript:
		 * <pre>Dom.getStyle(document.getElementById("id"), "color");</pre>
		 */
		getStyle: getStyle,

		/**
		 * 读取样式字符串。
		 * @param {Element} elem 元素。
		 * @param {String} name 属性名。必须使用骆驼规则的名字。
		 * @return {String} 字符串。
	 	 * @static
		 */
		styleString: styleString,

		/**
		 * 读取样式数字。
		 * @param {Element} elem 元素。
		 * @param {String} name 属性名。必须使用骆驼规则的名字。
		 * @return {String} 字符串。
		 * @static
		 */
		styleNumber: styleNumber,
		
		/**
		 * 获取一个标签的默认 display 属性。
		 * @param {Element} elem 元素。
		 */
		defaultDisplay: function(elem){
			var displays = Dom.displays || (Dom.displays = {}),
				tagName = elem.tagName,
				display = displays[tagName],
				iframe,
				iframeDoc;
				
			if(!display) {
				
				elem = document.createElement(tagName);
				document.body.appendChild(elem);
				display = getStyle(elem, 'display');
				document.body.removeChild(elem);

				// 如果简单的测试方式失败。使用 IFrame 测试。
				if ( display === "none" || display === "" ) {
					iframe = document.body.appendChild(Dom.emptyIframe || (Dom.emptyIframe = Object.extend(document.createElement("iframe"), {
						frameBorder: 0,
						width: 0,
						height: 0
					})));
					
					// Create a cacheable copy of the iframe document on first call.
					// IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
					// document to it; WebKit & Firefox won't allow reusing the iframe document.
					iframeDoc =  ( iframe.contentWindow || iframe.contentDocument ).document;
					frameDoc.write("<!doctype html><html><body>");
					iframeDoc.close();

					elem = iframeDoc.body.appendChild( iframeDoc.createElement(nodeName) );
					display = getStyle(elem, 'display');
					document.body.removeChild( iframe );
				}
				
				displays[tagName] = display;
			}
		
			return display;
		},

		/**
		 * 通过设置 display 属性来显示元素。
		 * @param {Element} elem 元素。
	 	 * @static
		 */
		show: function(elem) {
			assert.isElement(elem, "Dom.show(elem): {elem} ~");

			// 普通元素 设置为 空， 因为我们不知道这个元素本来的 display 是 inline 还是 block
			elem.style.display = '';

			// 如果元素的 display 仍然为 none , 说明通过 CSS 实现的隐藏。这里默认将元素恢复为 block。
			if(getStyle(elem, 'display') === 'none')
				elem.style.display = elem.style.$display || Dom.defaultDisplay(elem);
		},
		
		/**
		 * 通过设置 display 属性来隐藏元素。
		 * @param {Element} elem 元素。
	 	 * @static
		 */
		hide: function(elem) {
			assert.isElement(elem, "Dom.hide(elem): {elem} ~");
			var currentDisplay = styleString(elem, 'display');
			if(currentDisplay !== 'none') {
				elem.style.$display = currentDisplay;
				elem.style.display = 'none';
			}
		},
		
		/**
		 * 根据不同的内容进行计算。
		 * @param {Element} elem 元素。
		 * @param {String} type 要计算的值。一个 type 是一个 js 表达式，它有一些内置的变量来表示元素的相关计算值。预定义的变量有：
		 *
		 *		- ml: marginLeft (同理有 r=right, t=top, b=bottom，x=left+right,y=top+bottom 下同)
		 *		- bl: borderLeftWidth
		 *		- pl: paddingLeft
		 *		- sx: bl + pl + height (同理有 y)
		 *		- css 样式: 如 height, left
		 *
		 * @return {Number} 计算值。
	 	 * @static
		 */
		calc: (function() {

			/**
			 * 样式表。
			 * @static
			 * @type Object
			 */
			var cache = {},

				init, 
				
				tpl;

			if(window.getComputedStyle) {
				init = 'var c=e.ownerDocument.defaultView.getComputedStyle(e,null);return ';
				tpl = '(parseFloat(c["#"])||0)';
			} else {
				init = 'return ';
				tpl = '(parseFloat(Dom.getStyle(e, "#"))||0)';
			}

			/**
			 * 翻译 type。
			 * @param {String} type 输入字符串。
			 * @return {String} 处理后的字符串。
			 */
			function format(type) {

				// 如果长度为 2，则处理为简写。
				if (type.length === 2) {
					var t = type.charAt(0),
						d = type.charAt(1),
						ns1 = {
							m: 'margin#',
							b: 'border#Width',
							p: 'padding#'
						},
						ns2 = {
							t: 'Top',
							r: 'Right',
							b: 'Bottom',
							l: 'Left'
						};
					if (t in ns1) {
						t = ns1[t];
						if (d == 'x') {
							type = '(' + t.replace('#', ns2.l) + '+' + t.replace('#', ns2.r) + ')';
						} else if (d == 'y') {
							type = '(' + t.replace('#', ns2.t) + '+' + t.replace('#', ns2.b) + ')';
						} else {
							type = t.replace('#', ns2[d]);
						}
					} else if (t == 's') {
						return d == 'x' ? 'e.offsetWidth' : 'e.offsetHeight';
					}
				} else if (type == 'width' || type == 'height') {
					return 'Dom.styleNumber(e,"' + type + '")';
				} else if (type.length < 2) {
					return type;
				}

				return tpl.replace('#', type);
			}

			return function(elem, type) {
				assert.isElement(elem, "Dom.calc(elem, type): {elem} ~");
				assert.isString(type, "Dom.calc(elem, type): {type} ~");
				return (cache[type] || (cache[type] = new Function("e", init + type.replace(/\w+/g, format))))(elem);
			}
		})(),

		/**
		 * 设置一个元素可拖动。
		 * @param {Element} elem 要设置的节点。
	 	 * @static
		 */
		movable: function(elem) {
			assert.isElement(elem, "Dom.movable(elem): 参数 elem ~");
			if(!/^(?:abs|fix)/.test(styleString(elem, "position")))
				elem.style.position = "relative";
		},
		
		/**
		 * 获取元素的文档。
		 * @param {Element} elem 元素。
		 * @return {Document} 文档。
	 	 * @static
		 */
		getDocument: getDocument,
	
		/**
		 * 将一个成员附加到 Dom 对象和相关类。
		 * @param {Object} obj 要附加的对象。
		 * @param {Number} listType = 1 说明如何复制到 DomList 实例。
		 * @return this
		 * @static
		 * 对 Element 扩展，内部对 Element DomList document 皆扩展。
		 *         这是由于不同的函数需用不同的方法扩展，必须指明扩展类型。 所谓的扩展，即一个类所需要的函数。 DOM 方法
		 *         有 以下种 1, 其它 setText - 执行结果返回 this， 返回 this 。(默认) 2
		 *         getText - 执行结果是数据，返回结果数组。 3 getElementById - 执行结果是DOM
		 *         或 ElementList，返回 DomList 包装。 4 hasClass -
		 *         只要有一个返回等于 true 的值， 就返回这个值。 参数 copyIf 仅内部使用。
		 */
		implement: function(members, listType, copyIf) {
		
			var classes = [DomList, Dom], i;
		
			for(var fnName in members){
				i = classes.length;
				while(i--) {
					if(!copyIf || !classes[i].prototype[fnName]) {
						classes[i].prototype[fnName] = i ? members[fnName] : createDomListMthod(fnName, listType);
					}
				}
			}
		
			return this;

		},
	
		/**
		 * 若不存在，则将一个对象附加到 Element 对象。
		 * @static
		 * @param {Object} obj 要附加的对象。
		 * @param {Number} listType = 1 说明如何复制到 DomList 实例。
		 * @param {Number} docType 说明如何复制到 Document 实例。
		 * @return this
		 */
		implementIf: function(obj, listType) {
			return this.implement(obj, listType, true);
		},
	
		//// TODO: clear it
		define: function(ctrl, target, setters, getters) {
			assert.deprected("Dom.define(ctrl, target, setters, getters) 已过时，请使用 MyClass.defineMethods(target, methods)");

			return ctrl.defineMethods(target, (setters + " " +  getters).trim());
		},
		//// TODO: clear it

		/**
		 * 表示事件的参数。
		 * @class Dom.Event
		 */
		Event: DomEvent

	})
	
	.implement({

		/**
		 * 将当前 Dom 对象添加到其它节点或 Dom 对象中。
		 * @param {Node/String} parent=document.body 节点 Dom 对象或节点的 id 字符串。
		 * @return this
		 * @remark
		 * this.appendTo(parent) 相当于 parent.append(this) 。
		 * @example
		 * 把所有段落追加到ID值为foo的元素中。
		 * #####HTML:
		 * <pre lang="htm" format="none">
		 * &lt;p&gt;I would like to say: &lt;/p&gt;&lt;div id="foo"&gt;&lt;/div&gt;
		 * </pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").appendTo("foo");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">
		 * &lt;div id="foo"&gt;&lt;p&gt;I would like to say: &lt;/p&gt;&lt;/div&gt;
		 * </pre>
		 *
		 * 创建一个新的div节点并添加到 document.body 中。
		 * <pre>
		 * Dom.create("div").appendTo();
		 * </pre>
		 */
		appendTo: function(parent) {

			// parent 肯能为 true
			parent ? (parent.append ? parent : Dom.get(parent)).append(this) : this.attach(document.body, null);

			return this;

		},

		/**
		 * 移除当前 Dom 对象或其子对象。
		 * @param {Dom} [child] 如果指定了子对象，则删除此对象。
		 * @return this
		 * @see #dispose
		 * @remark
		 * 这个方法不会彻底移除 Dom 对象，而只是暂时将其从 Dom 树分离。
		 * 如果需要彻底删除 Dom 对象，使用 {@link #dispose}方法。
		 * @example
		 * 从DOM中把所有段落删除。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt; how are &lt;p&gt;you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").remove();</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">how are</pre>
		 *
		 * 从DOM中把带有hello类的段落删除
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p class="hello"&gt;Hello&lt;/p&gt; how are &lt;p&gt;you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").remove(".hello");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">how are &lt;p&gt;you?&lt;/p&gt;</pre>
		 */
		remove: function(child) {
			assert(!arguments.length || child, 'Dom#remove(child): {child} 不是合法的节点', child);

			return arguments.length ?
				typeof child === 'string' ?
					this.query(child).remove() :
					this.removeChild(child) :
				(child = this.parentControl || this.parent()) ?
					child.removeChild(this) :
					this;
		},

		/**
	 	 * 删除一个节点的所有子节点。
		 * @return this
		 * @example
		 * 把所有段落的子元素（包括文本节点）删除。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello, &lt;span&gt;Person&lt;/span&gt; &lt;a href="#"&gt;and person&lt;/a&gt;&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").empty();</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;p&gt;&lt;/p&gt;</pre>
		 */
		empty: function() {
			var elem = this.node;
			//if (elem.nodeType == 1)
			//	each(elem.getElementsByTagName("*"), clean);
			while (elem = this.last(true))
				this.removeChild(elem);
			return this;
		},

		/**
		 * 彻底删除当前 DOM 对象。释放占用的所有资源。
		 * @see #remove
		 * @remark 这个方法会同时删除节点绑定的事件以及所有的数据。
		 * @example
		 * 从DOM中把所有段落删除。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;dispose&lt;/p&gt; how are &lt;p&gt;you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").dispose();</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">how are</pre>
		 *
		 * 从DOM中把带有hello类的段落删除。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p class="hello"&gt;Hello&lt;/p&gt; how are &lt;p&gt;you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").dispose(".hello");</pre>
		 */
		dispose: function() {
			var elem = this.node;
			if (elem.nodeType == 1) {
				each(elem.getElementsByTagName("*"), clean);
				clean(elem);
			}

			return this.remove();
		},

		/**
		 * 设置一个样式属性的值。
		 * @param {String} name CSS 属性名或 CSS 字符串。
		 * @param {String/Number} [value] CSS属性值， 数字如果不加单位，则会自动添加像素单位。
		 * @return this
		 * @example
		 * 将所有段落的字体颜色设为红色并且背景为蓝色。
		 * <pre>Dom.query("p").setStyle('color', "#ff0011");</pre>
		 */
		setStyle: function(name, value) {

			// 获取样式
			var me = this;

			assert.isString(name, "Dom#setStyle(name, value): {name} ~");
			assert.isElement(me.node, "Dom#setStyle(name, value): 当前 dom 不支持样式");

			// 设置通用的属性。
			if (arguments.length == 1) {
				me.node.style.cssText += ';' + name;

				// 特殊的属性值。
			} else if (name in styleFix) {

				// setHeight setWidth setOpacity
				return styleFix[name].call(me, value);

			} else {
				name = name.replace(rStyle, formatStyle);

				assert(value || !isNaN(value), "Dom#setStyle(name, value): {value} 不是正确的属性值。", value);

				// 如果值是函数，运行。
				if (typeof value === "number" && !(name in Dom.styleNumbers))
					value += "px";

			}

			// 指定值。
			me.node.style[name] = value;

			return me;

		},

		/**
		 * 向用户显示当前 Dom 对象。
		 * @param {String} [type] 显示时使用的特效方式。
		 * @param {Number} duration=300 效果执行时间。
		 * @param {Function} [callBack] 效果执行完的回调函数。
		 * @param {String} [link] 当效果正在执行时的处理方式。
		 *
		 * - "**wait**"(默认): 等待上个效果执行完成。
		 * - "**ignore**": 忽略新的效果。
		 * - "**stop**": 正常中止上一个效果，然后执行新的效果。
		 * - "**abort**": 强制中止上一个效果，然后执行新的效果。
		 * @return this
		 * @remark 此函数是通过设置 css的 display 属性实现的。
		 */
		show: function() {
			Dom.show(this.node);
			return this;
		},

		/**
		 * 向用户隐藏当前 Dom 对象。
		 * @param {String} [type] 显示时使用的特效方式。
		 * @param {Number} duration=300 效果执行时间。
		 * @param {Function} [callBack] 效果执行完的回调函数。
		 * @param {String} [link] 当效果正在执行时的处理方式。
		 *
		 * - "**wait**"(默认): 等待上个效果执行完成。
		 * - "**ignore**": 忽略新的效果。
		 * - "**stop**": 正常中止上一个效果，然后执行新的效果。
		 * - "**abort**": 强制中止上一个效果，然后执行新的效果。
		 * @return this
		 * @remark 此函数是通过设置 css的 display = none 实现的。
		 */
		hide: function(duration, callback) {
			Dom.hide(this.node);
			return this;
		},

		/**
		 * 切换当前 Dom 对象的显示状态。
		 * @param {String} [type] 显示时使用的特效方式。
		 * @param {Number} duration=300 效果执行时间。
		 * @param {Function} [callBack] 效果执行完的回调函数。
		 * @param {String} [value] 强制设置 toggle 效果。
		 * @param {String} [link] 当效果正在执行时的处理方式。
		 *
		 * - "**wait**"(默认): 等待上个效果执行完成。
		 * - "**ignore**": 忽略新的效果。
		 * - "**stop**": 正常中止上一个效果，然后执行新的效果。
		 * - "**abort**": 强制中止上一个效果，然后执行新的效果。
		 * @return this
		 * @remark 此函数是通过设置 css的 display 属性实现的。
		 */
		toggle: function() {
			var args = arguments,
				flag = args[args.length - 1];
			return this[(typeof flag === 'boolean' ? flag : Dom.isHidden(this.node)) ? 'show' : 'hide'].apply(this, args);
		},

		/**
		 * 设置当前 Dom 对象不可选。
		 * @param {Boolean} value=true 如果为 true，表示不可选，否则表示可选。
		 * @return this
		 */
		unselectable: 'unselectable' in div ? function(value) {
			assert.isElement(this.node, "Dom#unselectable(value): 当前 dom 不支持此操作");
			this.node.unselectable = value !== false ? 'on' : '';
			return this;
		} : 'onselectstart' in div ? function(value) {
			assert.isElement(this.node, "Dom#unselectable(value): 当前 dom 不支持此操作");
			this.node.onselectstart = value !== false ? Function.from(false) : null;
			return this;
		} : function(value) {
			assert.isElement(this.node, "Dom#unselectable(value): 当前 dom 不支持此操作");
			this.node.style.MozUserSelect = value !== false ? 'none' : '';
			return this;
		},

		/**
		 * 设置或删除一个 HTML 属性值。
		 * @param {String} name 要设置的属性名称。
		 * @param {String} value 要设置的属性值。当设置为 null 时，删除此属性。
		 * @return this
		 * @example
		 * 为所有图像设置src属性。
		 * #####HTML:
		 * <pre lang="htm" format="none">
		 * &lt;img/&gt;
		 * &lt;img/&gt;
		 * </pre>
		 * #####JavaScript:
		 * <pre>Dom.query("img").setAttr("src","test.jpg");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;img src= "test.jpg" /&gt; , &lt;img src= "test.jpg" /&gt; ]</pre>
		 *
		 * 将文档中图像的src属性删除
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;img src="test.jpg"/&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("img").setAttr("src");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;img /&gt; ]</pre>
		 */
		setAttr: function(name, value) {

			//assert(name !== 'type' || elem.tagName !== "INPUT" || !elem.parentNode, "Dom#setAttr(name, type): 无法修改INPUT元素的 type 属性。");

			var elem = this.node;
			
			name = propFix[name] || name;
			
			var hook = attrFix[name];
			
			if(!hook) {
				hook = defaultHook;
				name = name.toLowerCase();
			}
			
			hook.set(elem, name, value);

			return this;

		},

		/**
		 * 快速设置当前 Dom 对象的样式、属性或事件。
		 * @param {String/Object} name 属性名。可以是一个 css 属性名或 html 属性名。如果属性名是on开头的，则被认为是绑定事件。 - 或 - 属性值，表示 属性名/属性值 的 JSON 对象。
		 * @param {Object} [value] 属性值。
		 * @return this
		 * @remark
		 * 此函数相当于调用 setStyle 或 setAttr 。数字将自动转化为像素值。
		 * @example
		 * 将所有段落字体设为红色、设置 class 属性、绑定 click 事件。
		 * <pre>
		 * Dom.query("p").set("color","red").set("class","cls-red").set("onclick", function(){alert('clicked')});
		 * </pre>
		 *
		 * - 或 -
		 *
		 * <pre>
		 * Dom.query("p").set({
		 * 		"color":"red",
		 * 		"class":"cls-red",
		 * 		"onclick": function(){alert('clicked')}
		 * });
		 * </pre>
		 */
		set: function(options, value) {
			var me = this,
				key,
				setter;

			// .set(key, value)
			if (typeof options === 'string') {
				key = options;
				options = {};
				options[key] = value;
			}

			for (key in options) {
				value = options[key];
				
				// .setStyle(css, value)
				if (me.node.style && (key in me.node.style || rStyle.test(key)))
					me.setStyle(key, value);

				// .setKey(value)
				else if (Object.isFunction(me[setter = 'set' + key.capitalize()]))
					me[setter](value);

				// 如果是当前对象的成员。
				else if (key in me) {

					setter = me[key];

					// .key(value)
					if (Object.isFunction(setter))
						me[key](value);

					// .key.set(value)
					else if (setter && setter.set)
						setter.set(value);

					// .key = value
					else
						me[key] = value;
					
				// .on(event, value)
				} else if (/^on(\w+)/.test(key))
					me.on(RegExp.$1, value);

				// .setAttr(attr, value);
				else
					me.setAttr(key, value);

			}

			return me;

		},

		/**
		 * 为当前 Dom 对象添加指定的 Css 类名。
		 * @param {String} className 一个或多个要添加到元素中的CSS类名，用空格分开。
		 * @return this
		 * @example
		 * 为匹配的元素加上 'selected' 类。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").addClass("selected");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p class="selected"&gt;Hello&lt;/p&gt; ]</pre>
		 *
		 * 为匹配的元素加上 selected highlight 类。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").addClass("selected highlight");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p class="selected highlight"&gt;Hello&lt;/p&gt; ]</pre>
		 */
		addClass: function(className) {
			assert.isString(className, "Dom#addClass(className): {className} ~");

			var elem = this.node, classList = className.split(/\s+/), newClass, i;

			// 加速为不存在 class 的元素设置 class 。
			if (!elem.className && classList.length <= 1) {
				elem.className = className;

			} else {
				newClass = " " + elem.className + " ";

				for (i = 0; i < classList.length; i++) {
					if (newClass.indexOf(" " + classList[i] + " ") < 0) {
						newClass += classList[i] + " ";
					}
				}
				elem.className = newClass.trim();
			}

			return this;

		},

		/**
		 * 从当前 Dom 对象中删除全部或者指定的类。
		 * @param {String} [className] 一个或多个要删除的CSS类名，用空格分开。如果不提供此参数，将清空 className 。
		 * @return this
		 * @example
		 * 从匹配的元素中删除 'selected' 类
		 * #####HTML:
		 * <pre lang="htm" format="none">
		 * &lt;p class="selected first"&gt;Hello&lt;/p&gt;
		 * </pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").removeClass("selected");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">
		 * [ &lt;p class="first"&gt;Hello&lt;/p&gt; ]
		 * </pre>
		 */
		removeClass: function(className) {
			assert(!className || className.split, "Dom#removeClass(className): {className} ~");

			var elem = this.node, classList, newClass = "", i;

			if (className) {
				classList = className.split(/\s+/);
				newClass = " " + elem.className + " ";
				for (i = classList.length; i--;) {
					newClass = newClass.replace(" " + classList[i] + " ", " ");
				}
				newClass = newClass.trim();

			}

			elem.className = newClass;

			return this;

		},

		/**
		 * 如果存在（不存在）就删除（添加）一个类。
		 * @param {String} className CSS类名。
		 * @param {Boolean} [toggle] 自定义切换的方式。如果为 true， 则加上类名，否则删除。
		 * @return this
		 * @see #addClass
		 * @see #removeClass
		 * @example
		 * 为匹配的元素切换 'selected' 类
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p class="selected"&gt;Hello Again&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").toggleClass("selected");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p class="selected"&gt;Hello&lt;/p&gt;, &lt;p&gt;Hello Again&lt;/p&gt; ]</pre>
		 */
		toggleClass: function(className, state) {
			return this[(state == undefined ? this.hasClass(className) : !state) ? 'removeClass' : 'addClass'](className);
		},

		/**
		 * 设置当前 Dom 对象的文本内容。对于输入框则设置其输入的值。
		 * @param {String} 用于设置元素内容的文本。
		 * @return this
		 * @see #setHtml
		 * @remark 与 {@link #setHtml} 类似, 但将编码 HTML (将 "&lt;" 和 "&gt;" 替换成相应的HTML实体)。
		 * @example
		 * 设定文本框的值。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;input type="text"/&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("input").setText("hello world!");</pre>
		 */
		setText: function(value) {
			this.node[textFix[this.node.nodeName] || propFix.innerText] = value;
			return this;
		},

		/**
		 * 设置当前 Dom 对象的 Html 内容。
		 * @param {String} value 用于设定HTML内容的值。
		 * @return this
		 * @example
		 * 设置一个节点的内部 html
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;div id="a"&gt;&lt;p/&gt;&lt;/div&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.get("a").setHtml("&lt;a/&gt;");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;div id="a"&gt;&lt;a/&gt;&lt;/div&gt;</pre>
		 */
		setHtml: function(value) {

			// 如果存在 <script> 或 <style> ，则不能使用 innerHTML 实现。
			if (/<(?:script|style)/i.test(value)) {
				this.empty().append(value);
				return this;
			}

			var elem = this.node,
				map = parseFix.$default;

			assert(elem.nodeType === 1, "Dom#setHtml(value): {elem} 不是元素节点(nodeType === 1), 无法执行 setHtml。", elem);

			value = (map[1] + value + map[2]).replace(rXhtmlTag, "<$1></$2>");
			try {

				// 对每个子元素清空内存。
				// each(elem.getElementsByTagName("*"), clean);

				// 内部执行 innerHTML 。
				elem.innerHTML = value;

				// 如果 innerHTML 出现错误，则直接使用节点方式操作。
			} catch (e) {
				this.empty().append(value);
				return this;
			}

			// IE6 需要包装节点，此处解除包装的节点。
			if (map[0] > 1) {
				value = elem.lastChild;
				elem.removeChild(elem.firstChild);
				elem.removeChild(value);
				while (value.firstChild)
					elem.appendChild(value.firstChild);
			}

			return this;
		},

		/**
		 * 设置当前 Dom 对象的显示大小。
		 * @param {Number/Point} x 要设置的宽或一个包含 x、y 属性的对象。如果不设置，使用 null 。
		 * @param {Number} y 要设置的高。如果不设置，使用 null 。
		 * @return this
		 * @remark
		 * 设置元素实际占用大小（包括内边距和边框，但不包括滚动区域之外的大小）。
		 *
		 * 此方法对可见和隐藏元素均有效。
		 * @example
		 * 设置 id=myP 的段落的大小。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p id="myP"&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.get("myP").setSize({x:200,y:100});</pre>
		 */
		setSize: function(x, y) {
			var me = this,
				p = formatPoint(x, y);

			if (p.x != null) me.setWidth(p.x - Dom.calc(me.node, 'bx+px'));

			if (p.y != null) me.setHeight(p.y - Dom.calc(me.node, 'by+py'));

			return me;
		},

		/**
		 * 获取当前 Dom 对象设置CSS宽度(width)属性的值（不带滚动条）。
		 * @param {Number} value 设置的宽度值。
		 * @return this
		 * @example
		 * 将所有段落的宽设为 20。
		 * <pre>Dom.query("p").setWidth(20);</pre>
		 */
		setWidth: styleFix.width,

		/**
		 * 获取当前 Dom 对象设置CSS高度(hidth)属性的值（不带滚动条）。
		 * @param {Number} value 设置的高度值。
		 * @return this
		 * @example
		 * 将所有段落的高设为 20。
		 * <pre>Dom.query("p").setHeight(20);</pre>
		 */
		setHeight: styleFix.height,

		/**
		 * 设置当前 Dom 对象相对父元素的偏移。
		 * @param {Point} offsetPoint 要设置的 x, y 对象。
		 * @return this
		 * @remark
		 * 此函数仅改变 CSS 中 left 和 top 的值。
		 * 如果当前对象的 position 是static，则此函数无效。
		 * 可以通过 {@link #setPosition} 强制修改 position, 或先调用 {@link Dom.movable} 来更改 position 。
		 *
		 * @example
		 * 设置第一段的偏移。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>
		 * Dom.query("p:first").setOffset({ x: 10, y: 30 });
		 * </pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;left: 15, top: 15&lt;/p&gt;</pre>
		 */
		setOffset: function(offsetPoint) {

			assert(Object.isObject(offsetPoint), "Dom#setOffset(offsetPoint): {offsetPoint} 必须有 'x' 和 'y' 属性。", offsetPoint);
			var style = this.node.style;

			if (offsetPoint.y != null)
				style.top = offsetPoint.y + 'px';

			if (offsetPoint.x != null)
				style.left = offsetPoint.x + 'px';
			return this;
		},

		/**
		 * 设置当前 Dom 对象的绝对位置。
		 * @param {Number/Point} x 要设置的水平坐标或一个包含 x、y 属性的对象。如果不设置，使用 null 。
		 * @param {Number} y 要设置的垂直坐标。如果不设置，使用 null 。
		 * @return this
		 * @remark
		 * 如果对象原先的position样式属性是static的话，会被改成relative来实现重定位。
		 * @example
		 * 设置第二段的位置。
		 * #####HTML:
		 * <pre lang="htm" format="none">
		 * &lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;
		 * </pre>
		 * #####JavaScript:
		 * <pre>
		 * Dom.query("p:last").setPosition({ x: 10, y: 30 });
		 * </pre>
		 */
		setPosition: function(x, y) {
			var me = this,
				offset = me.getOffset().sub(me.getPosition()),
				offsetPoint = formatPoint(x, y);

			if (offsetPoint.y != null) offset.y += offsetPoint.y;
			else offset.y = null;

			if (offsetPoint.x != null) offset.x += offsetPoint.x;
			else offset.x = null;

			Dom.movable(me.node);

			return me.setOffset(offset);
		},

		/**
		 * 设置当前 Dom 对象的滚动条位置。
		 * @param {Number/Point} x 要设置的水平坐标或一个包含 x、y 属性的对象。如果不设置，使用 null 。
		 * @param {Number} y 要设置的垂直坐标。如果不设置，使用 null 。
		 * @return this
		 */
		setScroll: function(x, y) {
			var elem = this.node,
				offsetPoint = formatPoint(x, y);
				
			if(elem.nodeType !== 9){
				if (offsetPoint.x != null) elem.scrollLeft = offsetPoint.x;
				if (offsetPoint.y != null) elem.scrollTop = offsetPoint.y;
			} else {
				if(offsetPoint.x == null)
					offsetPoint.x = this.getScroll().x;
				if(offsetPoint.y == null)
					offsetPoint.y = this.getScroll().y;
				(elem.defaultView || elem.parentWindow).scrollTo(offsetPoint.x, offsetPoint.y);
			}
			
			return this;
			
		},
		
		/**
		 * 批量为当前 DOM 节点绑定事件。 
		 * @since 3.2
		 */
		bind: function(eventAndSelector, handler){
			
			var eventName, selector;
			
			if(Object.isObject(eventAndSelector)){
				for(eventName in eventAndSelector) {
					this.on(eventName, eventAndSelector[eventName]);
				}
			} else {
				
				eventName = (/^\w+/.match(eventAndSelector) || [''])[0];
					
				assert(eventName, "Dom#bind(eventAndSelector, handler): {eventAndSelector} 中不存在事件信息。正确的 eventAndSelector 格式： click.selector")
				
				if(selector = eventAndSelector.substr(eventName.length)){
					this.delegate(eventName, delegateEventName, handler);
				} else {
					this.on(eventName, handler);
				}
				
			}
			
			return this;
		},
		
		/**
		 * 模拟提交表单。
		 */
		submit: function(){
			
			// 当手动调用 submit 的时候，不会触发 submit 事件，因此手动模拟  #8
			
			var e = new Dom.Event(this.node, 'submit');
			this.trigger('submit', e);
			if(e.returnValue !== false){
				this.node.submit();
			}
			return this;
		},

		/**
		 * 通过当前 Dom 对象代理执行子节点的事件。
		 * @param {String} selector 筛选子节点的选择器。
		 * @param {String} type 绑定的事件名。
		 * @param {Function} fn 绑定的事件监听器。
		 * @remark
		 * 这个函数会监听子节点的事件冒泡，并使用 CSS 选择器筛选子节点。
		 *
		 * 这个方法是对 (@link #on} 的补充，比如有如下 HTML 代码:
		 * <pre lang="htm">
		 * &amp;lt;body&amp;gt;
		 * &amp;lt;div class=&quot;clickme&quot;&amp;gt;Click here&amp;lt;/div&amp;gt;
		 * &amp;lt;/body&amp;gt;
		 * </pre>
		 *
		 * 可以给这个元素绑定一个简单的click事件：
		 * <pre>
		 * Dom.query('.clickme').bind('click', function() {
		 * 	alert("Bound handler called.");
		 * });
		 * </pre>
		 *
		 * 使用 {@link #on} 时，函数会绑定一个事件处理函数，而以后再添加的对象则不会有。
		 * 而如果让父元素代理执行事件，则可以监听到动态增加的元素。比如:
		 *
		 * <pre>
		 * document.delegate('.clickme', 'click', function() {
		 * 	alert("Bound handler called.");
		 * });
		 * </pre>
		 *
		 * 这时，无论是原先存在的，还是后来动态创建的节点，只要匹配了　.clickme ，就可以成功触发事件。
		 */
		delegate: function(selector, eventName, handler) {

			assert.isString(selector, "Dom#delegate(selector, eventName, handler): {selector}  ~");
			assert.isString(eventName, "Dom#delegate(selector, eventName, handler): {eventName}  ~");
			assert.isFunction(handler, "Dom#delegate(selector, eventName, handler): {handler}  ~");

			var delegateEventName = 'delegate:' + eventName,
				delegateEvent,
				eventInfo = Dom.$event[eventName],
				initEvent,
				data = this.dataField();

			if (eventInfo && eventInfo.delegate) {
				eventName = eventInfo.delegate;
				initEvent = eventInfo.initEvent;
			}
			
			data = data.$event || (data.$event = {});
			delegateEvent = data[delegateEventName];
			
			if(!delegateEvent){
				data[delegateEventName] = delegateEvent = function(e) {
					
					// 获取原始的目标对象。
					var target = e.getTarget(),
					
						// 所有委托的函数信息。
						delegateHandlers = arguments.callee.handlers,
						
						actucalHandlers = [],
						
						i,
						
						handlerInfo,
						
						delegateTarget;
						
					for(i = 0; i < delegateHandlers.length; i++){
					
						handlerInfo = delegateHandlers[i];
						
						if((delegateTarget = target.closest(handlerInfo[1])) && (!initEvent || initEvent.call(delegateTarget, e) !== false)){
							actucalHandlers.push([handlerInfo[0], delegateTarget]);
						}
					}
					
					for(i = 0; i < actucalHandlers.length; i++) {
					
						handlerInfo = actucalHandlers[i];
						
						if(handlerInfo[0].call(handlerInfo[1], e) === false) {
							e.stopPropagation();
							e.preventDefault();
							break;
						}
					}
				
				};
				
				this.on(eventName, delegateEvent);
				
				delegateEvent.handlers = [];
			}
			
			delegateEvent.handlers.push([handler, selector]);
			
			return this;

		}

	})

	.implement({
		
		/**
		 * 获取当前 Dom 对象指定属性的样式。
		 * @param {String} name 需要读取的样式名。允许使用 css 原名字或其骆驼规则。
		 * @return {String} 返回样式对应的值。如果此样式未设置过，返回其默认值。 
		 * @example
		 * 取得 id=myP 的段落的color样式属性的值。
		 * <pre>Dom.get("myP").getStyle("color");</pre>
		 */
		getStyle: function(name) {
		
			var elem = this.node;
		
			assert.isString(name, "Dom#getStyle(name): {name} ~");
			assert(elem.style, "Dom#getStyle(name): 当 Dom 对象对应的节点不是元素，无法使用样式。");
		
			return elem.style[name = name.replace(rStyle, formatStyle)] || getStyle(elem, name);
		
		},
		
		/**
		 * 获取当前 Dom 对象的 HTML 属性值。
		 * @param {String} name 要获取的属性名称。
		 * @return {String} 返回属性值。如果元素没有相应属性，则返回 null 。
	 	 * @example
	 	 * 返回文档中 id="img" 的图像的src属性值。
	 	 * #####HTML:
	 	 * <pre lang="htm" format="none">&lt;img id="img" src="test.jpg"/&gt;</pre>
	 	 * #####JavaScript:
	 	 * <pre>Dom.get("img").getAttr("src");</pre>
	 	 * #####结果:
	 	 * <pre lang="htm" format="none">test.jpg</pre>
		 */
		getAttr: function(name, type) {
			return Dom.getAttr(this.node, name, type);
		},
	
		/**
		 * 取得当前 Dom 对象内容。对于输入框则获取其输入的值。
		 * @return {String} 文本内容。对普通节点返回 textContent 属性, 对输入框返回 value 属性， 对普通节点返回 nodeValue 属性。
		 * @remark 
		 * 结果是由所有匹配元素包含的文本内容组合起来的文本。这个方法对HTML和XML文档都有效。
		 * @example
		 * 获取文本框中的值。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;input type="text" value="some text"/&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("input").getText();</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">["some text"]</pre>
		 */
		getText: function() {
			return Dom.getText(this.node);
		},
	
		/**
		 * 取得当前 Dom 对象的html内容。
		 * @return {String} HTML 字符串。
		 * @example
		 * 获取 id="a" 的节点的内部 html。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;div id="a"&gt;&lt;p/&gt;&lt;/div&gt;</pre>
		 * #####JavaScript:
		 * <pre>$Dom.query("a").getHtml();</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">"&lt;p/&gt;"</pre>
		 */
		getHtml: function() {
			assert(this.node.nodeType === 1, "Dom#getHtml(): 仅当 dom.nodeType === 1 时才能使用此函数。"); 
			return this.node.innerHTML;
		},
	
		/**
		 * 获取当前 Dom 对象的可视区域大小。包括 border 大小。
		 * @return {Point} 位置。
		 * @remark
		 * 此方法对可见和隐藏元素均有效。
		 * 
		 * 获取元素实际占用大小（包括内边距和边框）。
		 * @example
		 * 获取第一段落实际大小。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p:first").getSize();</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">{x=200,y=100}</pre>
		 */
		getSize: function() {
			var elem = this.node,
				x,
				y;
				
			if(elem.nodeType !== 9){
				x = elem.offsetWidth;
				y = elem.offsetHeight;
			} else {
				elem = elem.documentElement;
				x = elem.clientWidth;
				y = elem.clientHeight;
			}
		
			return new Point(x, y);
		},
	
		/**
		 * 获取当前 Dom 对象的CSS width值。（不带滚动条）。
		 * @return {Number} 获取的值。
		 * 取得元素当前计算的宽度值（px）。
		 * @example
		 * 获取第一段的宽。
		 * <pre>Dom.query("p").item(0).getWidth();</pre>
		 * 
		 * 获取当前HTML文档宽度。
		 * <pre>document.getWidth();</pre>
		 */
		getWidth: function() {
			return styleNumber(this.node, 'width');
		},
	
		/**
		 * 获取当前 Dom 对象的CSS height值。（不带滚动条）。
		 * @return {Number} 获取的值。
		 * 取得元素当前计算的高度值（px）。
		 * @example
		 * 获取第一段的高。
		 * <pre>Dom.query("p").item(0).getHeight();</pre>
		 * 
		 * 获取当前HTML文档高度。
		 * <pre>document.getHeight();</pre>
		 */
		getHeight: function() {
			return styleNumber(this.node, 'height');
		},
	
		/**
		 * 获取当前 Dom 对象的滚动区域大小。
		 * @return {Point} 返回的对象包含两个整型属性：x 和 y。
		 * @remark
		 * getScrollSize 获取的值总是大于或的关于 getSize 的值。
		 * 
		 * 此方法对可见和隐藏元素均有效。
		 */
		getScrollSize: function() {
			var elem = this.node,
				x,
				y;
				
			if(elem.nodeType !== 9) {
				x = elem.scrollWidth;
				y = elem.scrollHeight;
			} else {
				var body = elem.body;
				elem = elem.documentElement;
				x = Math.max(elem.scrollWidth, body.scrollWidth, elem.clientWidth);
				y = Math.max(elem.scrollHeight, body.scrollHeight, elem.clientHeight);
			}
		
			return new Point(x, y);
		},
		
		/**
		 * 获取当前 Dom 对象的相对位置。
		 * @return {Point} 返回的对象包含两个整型属性：x 和 y。
		 * @remark
		 * 此方法只对可见元素有效。
		 * 
		 * 获取匹配元素相对父元素的偏移。
		 * @example
		 * 获取第一段的偏移
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;</pre>
		 * #####JavaScript:<pre>
		 * var p = Dom.query("p").item(0);
		 * var offset = p.getOffset();
		 * trace( "left: " + offset.x + ", top: " + offset.y );
		 * </pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;left: 15, top: 15&lt;/p&gt;</pre>
		 */
		getOffset: function() {
			// 如果设置过 left top ，这是非常轻松的事。
			var elem = this.node, left = elem.style.left, top = elem.style.top;
		
			// 如果未设置过。
			if(!left || !top) {
		
				// 绝对定位需要返回绝对位置。
				if(styleString(elem, "position") === 'absolute') {
					top = this.offsetParent();
					left = this.getPosition();
					if(!rBody.test(top.node.nodeName))
						left = left.sub(top.getPosition());
					left.x -= styleNumber(elem, 'marginLeft') + styleNumber(top.node, 'borderLeftWidth');
					left.y -= styleNumber(elem, 'marginTop') + styleNumber(top.node, 'borderTopWidth');
		
					return left;
				}
		
				// 非绝对的只需检查 css 的style。
				left = getStyle(elem, 'left');
				top = getStyle(elem, 'top');
			}
		
			// 碰到 auto ， 空 变为 0 。
			return new Point(parseFloat(left) || 0, parseFloat(top) || 0);
		},
	
		/**
		 * 获取当前 Dom 对象的绝对位置。
		 * @return {Point} 返回的对象包含两个整型属性：x 和 y。
		 * @remark
		 * 此方法只对可见元素有效。
		 * @example
		 * 获取第二段的偏移
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>
		 * var p = Dom.query("p").item(1);
		 * var position = p.getPosition();
		 * trace( "left: " + position.x + ", top: " + position.y );
		 * </pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;left: 0, top: 35&lt;/p&gt;</pre>
		 */
		getPosition: function() {
			
			// 对于 document，返回 scroll 。
			if(this.node.nodeType === 9){
				return this.getScroll();
			}
		
			var elem = this.node, 
				bound = elem.getBoundingClientRect(),
				doc = getDocument(elem),
				html = doc.documentElement,
				htmlScroll = doc.getScroll();
			return new Point(bound.left + htmlScroll.x - html.clientLeft, bound.top + htmlScroll.y - html.clientTop);
		},
	
		/**
		 * 获取当前 Dom 对象的滚动条的位置。
		 * @return {Point} 返回的对象包含两个整型属性：x 和 y。
		 * @remark
		 * 此方法对可见和隐藏元素均有效。
		 *
		 * @example
		 * 获取第一段相对滚动条顶部的偏移。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;2nd Paragraph&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>
		 * var p = Dom.query("p").item(0);
		 * trace( "scrollTop:" + p.getScroll() );
		 * </pre>
		 * #####结果:
		 * <pre lang="htm" format="none">
		 * &lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;scrollTop: 0&lt;/p&gt;
		 * </pre>
		 */
		getScroll: function() {
			var elem = this.node,
				win,
				x,
				y;
			if(elem.nodeType !== 9){
				x = elem.scrollLeft;
				y = elem.scrollTop;
			} else if('pageXOffset' in (win = elem.defaultView || elem.parentWindow)) {
				x = win.pageXOffset;
				y = win.pageYOffset;
			} else {
				elem = elem.documentElement;
				x = elem.scrollLeft;
				y = elem.scrollTop;
			}
			
			return new Point(x, y);
		},

		/**
		 * 获取当前 Dom 对象的在原节点的位置。
		 * @param {Boolean} args=true 如果 args 为 true ，则计算文本节点。
		 * @return {Number} 位置。从 0 开始。
		 */
		index: function(args) {
			var i = 0, elem = this.node;
			while (elem = elem.previousSibling)
				if (elem.nodeType === 1 || args === true)
					i++;
			return i;
		},

		/**
		 * 获取当前 Dom 对象的指定位置的直接子节点。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。如果 args 是小于 0 的数字，则从末尾开始计算。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 获取第1个子节点。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;html&gt;&lt;body&gt;&lt;div&gt;&lt;p&gt;&lt;span&gt;Hello&lt;/span&gt;&lt;/p&gt;&lt;span&gt;Hello Again&lt;/span&gt;&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.find("span").child(1)</pre>
		 */
		child: function(args) {
			return ~args >= 0 ? this.last(~args) : this.first(args);
		},

		/**
		 * 获取当前 Dom 对象的父节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在 Dom 对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 找到每个span元素的所有祖先元素。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;html&gt;&lt;body&gt;&lt;div&gt;&lt;p&gt;&lt;span&gt;Hello&lt;/span&gt;&lt;/p&gt;&lt;span&gt;Hello Again&lt;/span&gt;&lt;/div&gt;&lt;/body&gt;&lt;/html&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.find("span").parent()</pre>
		 */
		parent: createTreeWalker('parentNode'),

		/**
		 * 编辑当前 Dom 对象及父节点对象，找到第一个满足指定 CSS 选择器或函数的节点。
		 * @param {String/Function} [filter] 用于判断的元素的 CSS 选择器 或者 用于筛选元素的过滤函数。
		 * @param {Dom/String} [context=document] 只在指定的节点内搜索此元素。
		 * @return {Dom} 如果当前节点满足要求，则返回当前节点，否则返回一个匹配的父节点对象。如果不存在，则返回 null 。
		 * @remark
		 * closest 和 parent 最大区别就是 closest 会测试当前的元素。
		 */
		closest: function(selector, context) {
			selector = typeof selector === 'function' ? selector(this, this.node) : this.match(selector) ? this : this.parent(selector);
			return selector && (!context || Dom.get(context).has(selector)) ? selector : null;
		},

		/**
		 * 获取当前 Dom 对象的第一个子节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 获取匹配的第二个元素
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt; This is just a test.&lt;/p&gt; &lt;p&gt; So is this&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").first(1)</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p&gt; So is this&lt;/p&gt; ]</pre>
		 */
		first: createTreeWalker('nextSibling', 'firstChild'),

		/**
		 * 获取当前 Dom 对象的最后一个子节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 获取匹配的第二个元素
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt; This is just a test.&lt;/p&gt; &lt;p&gt; So is this&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").getChild(1)</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p&gt; So is this&lt;/p&gt; ]</pre>
		 */
		last: createTreeWalker('previousSibling', 'lastChild'),

		/**
		 * 获取当前 Dom 对象的下一个相邻节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 找到每个段落的后面紧邻的同辈元素。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;Hello Again&lt;/p&gt;&lt;div&gt;&lt;span&gt;And Again&lt;/span&gt;&lt;/div&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").getNext()</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p&gt;Hello Again&lt;/p&gt;, &lt;div&gt;&lt;span&gt;And Again&lt;/span&gt;&lt;/div&gt; ]</pre>
		 */
		next: createTreeWalker('nextSibling'),

		/**
		 * 获取当前 Dom 对象的上一个相邻的节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 找到每个段落紧邻的前一个同辈元素。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;div&gt;&lt;span&gt;Hello Again&lt;/span&gt;&lt;/div&gt;&lt;p&gt;And Again&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").getPrevious()</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;div&gt;&lt;span&gt;Hello Again&lt;/span&gt;&lt;/div&gt; ]</pre>
		 *
		 * 找到每个段落紧邻的前一个同辈元素中类名为selected的元素。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;div&gt;&lt;span&gt;Hello&lt;/span&gt;&lt;/div&gt;&lt;p class="selected"&gt;Hello Again&lt;/p&gt;&lt;p&gt;And Again&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").getPrevious("div")</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p class="selected"&gt;Hello Again&lt;/p&gt; ]</pre>
		 */
		prev: createTreeWalker('previousSibling'),

		/**
		 * 获取当前 Dom 对象的全部直接子节点。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {NodeList} 返回满足要求的节点的列表。
		 * @example
		 *
		 * 查找DIV中的每个子元素。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;div&gt;&lt;span&gt;Hello Again&lt;/span&gt;&lt;/div&gt;&lt;p&gt;And Again&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("div").getChildren()</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;span&gt;Hello Again&lt;/span&gt; ]</pre>
		 *
		 * 在每个div中查找 div。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;div&gt;&lt;span&gt;Hello&lt;/span&gt;&lt;p class="selected"&gt;Hello Again&lt;/p&gt;&lt;p&gt;And Again&lt;/p&gt;&lt;/div&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("div").getChildren("div")</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;p class="selected"&gt;Hello Again&lt;/p&gt; ]</pre>
		 */
		children: createTreeDir('nextSibling', 'firstChild'),

		/**
		 * 获取当前 Dom 对象以后的全部相邻节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {DomList} 返回一个 DomList 对象。
		 */
		nextAll: createTreeDir('nextSibling'),

		/**
		 * 获取当前 Dom 对象以前的全部相邻节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {DomList} 返回一个 DomList 对象。
		 */
		prevAll: createTreeDir('previousSibling'),

		/**
		 * 获取当前 Dom 对象以上的全部相邻节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {DomList} 返回一个 DomList 对象。
		 */
		parentAll: createTreeDir('parentNode'),

		/**
		 * 获取当前 Dom 对象的全部兄弟节点对象。
		 * @param {Integer/String/Function/Boolean} [filter] 用于查找子元素的 CSS 选择器 或者 元素在Control对象中的索引 或者 用于筛选元素的过滤函数 或者 true 则同时接收包含文本节点的所有节点。
		 * @return {DomList} 返回一个 DomList 对象。
		 */
		siblings: function(args) {
			return this.prevAll(args).add(this.nextAll(args));
		},

		/**
		 * 获取用于让当前 Dom 对象定位的父对象。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 */
		offsetParent: function() {
			var me = this.node;
			while ((me = me.offsetParent) && !rBody.test(me.nodeName) && styleString(me, "position") === "static");
			return new Dom(me || getDocument(this.node).body);
		}

	}, 2)

	.implement({

		/**
		 * 获取当前节点内的全部子节点。
		 * @param {String} args="*" 要查找的节点的标签名。 * 表示返回全部节点。
		 * @return {DomList} 返回一个 DomList 对象。
		 */
		getElements: function(args) {

			var getElementsByTagName = 'getElementsByTagName';
			var elem = this[getElementsByTagName] ? this : this.node;
			args = args || "*";

			if (elem[getElementsByTagName]) {
				return elem[getElementsByTagName](args);
			}

			getElementsByTagName = 'querySelectorAll';
			if (elem[getElementsByTagName]) {
				return elem[getElementsByTagName](args);
			}

			return [];
		},
		
		/**
		 * 搜索所有与指定表达式匹配的元素。
		 * @param {String} 用于查找的表达式。
		 * @return {NodeList} 返回满足要求的节点的列表。
		 * @example
		 * 从所有的段落开始，进一步搜索下面的span元素。与Dom.query("p span")相同。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;&lt;span&gt;Hello&lt;/span&gt;, how are you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").query("span")</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;span&gt;Hello&lt;/span&gt; ]</pre>
		 */
		query: function(selector){
			assert.isString(selector, "Dom#find(selector): selector ~。");
			assert(selector, "Dom#find(selector): {selector} 不能为空。", selector);
			var elem = this.node, result;
			
			if(elem.nodeType !== 1) {
				return document.query.call(this, selector)
			}
			
			try{ 
				var oldId = elem.id, displayId = oldId;
				if(!oldId){
					elem.id = displayId = '__SELECTOR__';
					oldId = 0;
				}
				result = elem.querySelectorAll('#' + displayId +' ' + selector);
			} catch(e) {
				result = query(selector, this);
			} finally {
				if(oldId === 0){
					elem.removeAttribute('id');
				}
			}
			
			
			
			return new DomList(result);
		},
	
		/**
		 * 创建并返回当前 Dom 对象的副本。
		 * @param {Boolean} deep=true 是否复制子元素。
		 * @param {Boolean} cloneDataAndEvent=false 是否复制数据和事件。
		 * @param {Boolean} keepId=false 是否复制 id 。
		 * @return {Dom} 新 Dom 对象。
		 *
		 * @example
		 * 克隆所有b元素（并选中这些克隆的副本），然后将它们前置到所有段落中。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;b&gt;Hello&lt;/b&gt;&lt;p&gt;, how are you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("b").clone().prependTo("p");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;b&gt;Hello&lt;/b&gt;&lt;p&gt;&lt;b&gt;Hello&lt;/b&gt;, how are you?&lt;/p&gt;</pre>
		 */
		clone: function(deep, cloneDataAndEvent, keepId) {
		
			var elem = this.node,
				clone = elem.cloneNode(deep = deep !== false);
			
			if(elem.nodeType === 1){
				if (deep) {
					for (var elemChild = elem.getElementsByTagName('*'), cloneChild = clone.getElementsByTagName('*'), i = 0; cloneChild[i]; i++)
						cleanClone(elemChild[i], cloneChild[i], cloneDataAndEvent, keepId);
				}
			
				cleanClone(elem, clone, cloneDataAndEvent, keepId);
			}
		
			return new this.constructor(clone);
		}
	 
	}, 3)

	.implement({

		/**
		 * 搜索所有与指定CSS表达式匹配的第一个元素。
		 * @param {String} selecter 用于查找的表达式。
		 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
		 * @example
		 * 从所有的段落开始，进一步搜索下面的span元素。与Dom.find("p span")相同。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;&lt;span&gt;Hello&lt;/span&gt;, how are you?&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").find("span")</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">[ &lt;span&gt;Hello&lt;/span&gt; ]</pre>
		 */
		find: function(selector) {
			assert.isString(selector, "Dom#find(selector): selector ~");
			var elem = this.node, result;
			if (elem.nodeType !== 1) {
				return document.find.call(this, selector)
			}

			try {
				var oldId = elem.id, displayId = oldId;
				if (!oldId) {
					elem.id = displayId = '__SELECTOR__';
					oldId = 0;
				}
				result = elem.querySelector('#' + displayId + ' ' + selector);
			} catch (e) {
				result = query(selector, this)[0];
			} finally {
				if (oldId === 0) {
					elem.removeAttribute('id');
				}
			}

			return result ? new Dom(result) : null;
		},

		/**
		 * 检查当前 Dom 对象是否含有某个特定的类。
		 * @param {String} className 要判断的类名。只允许一个类名。
		 * @return {Boolean} 如果存在则返回 true。
		 * @example
		 * 隐藏包含有某个类的元素。
		 * #####HTML:
		 * <pre lang="htm" format="none">
		 * &lt;div class="protected"&gt;&lt;/div&gt;&lt;div&gt;&lt;/div&gt;
		 * </pre>
		 * #####JavaScript:
		 * <pre>Dom.query("div").on('click', function(){
		 * 	if ( this.hasClass("protected") )
		 * 		this.hide();
		 * });
		 * </pre>
		 */
		hasClass: function(className) {
			return Dom.hasClass(this.node, className);
		},
		
		/**
		 * 检查当前 Dom 对象是否符合指定的表达式。
		 * @param {String} String
		 * @return {Boolean} 如果匹配表达式就返回 true，否则返回  false 。
		 * @example
		 * 由于input元素的父元素是一个表单元素，所以返回true。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;form&gt;&lt;input type="checkbox" /&gt;&lt;/form&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("input[type='checkbox']").match("input")</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">true</pre>
		 */
		match: function (selector) {
			return Dom.match(this.node, selector);
		},
		
		/**
		 * 判断当前元素是否是隐藏的。
		 * @return {Boolean} 当前元素已经隐藏返回 true，否则返回  false 。
		 */
		isHidden: function(){
			return Dom.isHidden(this.node);
		},
		
		/// TODO: clear
		
		hasChild: function(dom, allowSelf){
			assert.deprected("Dom#hasChild 已过时，请改用 Dom#has");
			return this.has(dom, allowSelf);
		},
		
		/// TODO: clear
		
		/**
		 * 判断一个节点是否有子节点。
		 * @param {Dom} dom 子节点。
		 * @param {Boolean} allowSelf=false 如果为 true，则当当前节点等于指定的节点时也返回 true 。
		 * @return {Boolean} 存在子节点则返回true 。
		 */
		has: function(dom, allowSelf){
			if(typeof dom === "string")
				return (allowSelf && this.match(dom)) || !!this.find(dom);
				
			dom = Dom.getNode(dom);
			
			return (allowSelf && this.node === dom) || Dom.has(this.node, dom);
		}
		
	}, 4);
	
	/// #endregion

	Object.each({

		/**
		 * 插入一个HTML 到末尾。
		 * @param {String/Node/Dom} html 要插入的内容。
		 * @return {Dom} 返回插入的新节点对象。
		 */
		append: function(ctrl, dom) {
			return ctrl.insertBefore(dom, null);
		},

		/**
		 * 插入一个HTML 到顶部。
		 * @param {String/Node/Dom} html 要插入的内容。
		 * @return {Dom} 返回插入的新节点对象。
		 */
		prepend: function(ctrl, dom) {
			return ctrl.insertBefore(dom, ctrl.first(true));
		},

		/**
		 * 插入一个HTML 到前面。
		 * @param {String/Node/Dom} html 要插入的内容。
		 * @return {Dom} 返回插入的新节点对象。
		 */
		before: function(ctrl, dom) {
			var p = ctrl.parentControl || ctrl.parent();
			return p ? p.insertBefore(dom, ctrl) : null;
		},

		/**
		 * 插入一个HTML 到后面。
		 * @param {String/Node/Dom} html 要插入的内容。
		 * @return {Dom} 返回插入的新节点对象。
		 */
		after: function(ctrl, dom) {
			var p = ctrl.parentControl || ctrl.parent();
			return p ? p.insertBefore(dom, ctrl.next(true)) : null;
		},

		/**
		 * 将一个节点用另一个节点替换。
		 * @param {String/Node/Dom} html 用于将匹配元素替换掉的内容。
		 * @return {Element} 替换之后的新元素。
		 * 将所有匹配的元素替换成指定的HTML或DOM元素。
		 * @example
		 * 把所有的段落标记替换成加粗的标记。
		 * #####HTML:
		 * <pre lang="htm" format="none">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;cruel&lt;/p&gt;&lt;p&gt;World&lt;/p&gt;</pre>
		 * #####JavaScript:
		 * <pre>Dom.query("p").replaceWith("&lt;b&gt;Paragraph. &lt;/b&gt;");</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">&lt;b&gt;Paragraph. &lt;/b&gt;&lt;b&gt;Paragraph. &lt;/b&gt;&lt;b&gt;Paragraph. &lt;/b&gt;</pre>
		 *
		 * 用第一段替换第三段，可以发现他是移动到目标位置来替换，而不是复制一份来替换。
		 * #####HTML:<pre lang="htm" format="none">
		 * &lt;div class=&quot;container&quot;&gt;
		 * &lt;div class=&quot;inner first&quot;&gt;Hello&lt;/div&gt;
		 * &lt;div class=&quot;inner second&quot;&gt;And&lt;/div&gt;
		 * &lt;div class=&quot;inner third&quot;&gt;Goodbye&lt;/div&gt;
		 * &lt;/div&gt;
		 * </pre>
		 * #####JavaScript:
		 * <pre>Dom.find('.third').replaceWith(Dom.find('.first'));</pre>
		 * #####结果:
		 * <pre lang="htm" format="none">
		 * &lt;div class=&quot;container&quot;&gt;
		 * &lt;div class=&quot;inner second&quot;&gt;And&lt;/div&gt;
		 * &lt;div class=&quot;inner first&quot;&gt;Hello&lt;/div&gt;
		 * &lt;/div&gt;
		 * </pre>
		 */
		replaceWith: function(ctrl, dom) {
			var parent;
			if (parent = (ctrl.parentControl || ctrl.parent())) {
				dom = parent.insertBefore(dom, ctrl);
				parent.removeChild(ctrl);
			}
			return dom;
		}

	}, function(value, key) {
		dp[key] = function(html) {
			html = Dom.parse(html, this);

			var scripts,
				i = 0,
				script,
				r = value(this, html);

			if (html.node.tagName === 'SCRIPT') {
				scripts = [html.node];
			} else {
				scripts = html.getElements('SCRIPT');
			}

			// 如果存在脚本，则一一执行。
			while (script = scripts[i++]) {
				if (!script.type || /\/(java|ecma)script/i.test(script.type)) {

					if (script.src) {
						assert(window.Ajax && Ajax.send, "必须载入 System.Request.Script 模块以支持动态执行 <script src=''>");
						Ajax.send({
							url: script.src,
							type: "GET",
							dataType: 'script',
							async: false
						});
						//    script.parentNode.removeChild(script);
					} else {
						window.execScript(script.text || script.textContent || script.innerHTML || "");
					}

				}
			}

			return r;
		};

		DomList.prototype[key] = function(html) {
			var r;
			if (typeof html === 'string') {
				r = new DomList(this.invoke(key, [html]));
			} else {
				r = new DomList;
				html = Dom.get(html);
				this.forEach(function(value) {
					var cloned = html.clone();
					Dom.get(value)[key](cloned);
					r.push(cloned.node);
				});
			}
			return r;
		};

	});
	
	// Dom 函数。
	Dom.defineMethods('node', 'scrollIntoView focus blur select click reset', 1);
	
	/// #region document
	
	/**
	 * 获取当 Dom 对象实际对应的 HTML 节点实例。
	 * @type Node
	 * @protected
	 */
	document.node = document;
	
	/**
	 * 搜索所有与指定CSS表达式匹配的第一个元素。
	 * @param {String} selecter 用于查找的表达式。
	 * @return {Dom} 返回一个节点对象。如果不存在，则返回 null 。
	 * @example
	 * 从所有的段落开始，进一步搜索下面的span元素。与Dom.find("p span")相同。
	 * #####HTML:
	 * <pre lang="htm" format="none">&lt;p&gt;&lt;span&gt;Hello&lt;/span&gt;, how are you?&lt;/p&gt;</pre>
	 * #####JavaScript:
	 * <pre>Dom.query("p").find("span")</pre>
	 * #####结果:
	 * <pre lang="htm" format="none">[ &lt;span&gt;Hello&lt;/span&gt; ]</pre>
	 */
	document.find = function(selector){
		assert.isString(selector, "Dom#find(selector): selector ~");
		var result;
		try{
			result = this.querySelector(selector);
		} catch(e) {
			result = query(selector, this)[0];
		}
		return result ? new Dom(result) : null;
	};
	
	/**
	 * 执行选择器。
	 * @method
	 * @param {String} selecter 选择器。 如 h2 .cls attr=value 。
	 * @return {Element/undefined} 节点。
	 */
	document.query = function(selector){
		assert.isString(selector, "Dom#find(selector): selector ~。");
		var result;
		try{
			result = this.querySelectorAll(selector);
		} catch(e) {
			result = query(selector, this);
		}
		return new DomList(result);
	};
	
	// 拷贝 DOM Event 到 document 。
	t = document.constructor;
	if(t){
		t.$event = Dom.$event;
		t.base = Dom.base;
	} else {
		document.constructor = Dom;
	}

	// document 函数。
	map('on un trigger once delegate dataField getElements getPosition getSize getScroll setScroll getScrollSize first last parent child children has', function (fnName) {
		document[fnName] = dp[fnName];
	});
	
	/// #endregion

	/// #region DomList
	
	// DomList 函数。
	map("slice splice reverse unique shift pop unshift push include indexOf each forEach", function (fnName, index) {
		DomList.prototype[fnName] = index < 4 ? function() {
			return new DomList(ap[fnName].apply(this, arguments));
		} : ap[fnName];
	});
	
	/// #endregion

	/// #region Event

	map("$default mousewheel blur focus scroll change select submit resize error load unload touchstart touchmove touchend hashchange", defaultEvent, Dom.$event);
	
	/// #if CompactMode

	if(isStd) {

	/// #endif

		domReady = 'DOMContentLoaded';
		t = Event.prototype;
		
		/// TODO: clear
		t.stop = ep.stop;
		
		/// TODO: clear
		t.getTarget = ep.getTarget;
		
	/// #if CompactMode
	
	} else {

		domReady = 'readystatechange';
		
		defaultEvent.initEvent = function (e) {
			e.target = e.srcElement;
		
		/// TODO: clear
			e.stop = ep.stop;
		
		/// TODO: clear
			e.getTarget = ep.getTarget;
			e.stopPropagation = ep.stopPropagation;
			e.preventDefault = ep.preventDefault;
		};
		
		mouseEvent = {
			initEvent: function (e) {
				if(!e.stop) {
					var node = getDocument(e.target).node;
					defaultEvent.initEvent(e);
					e.relatedTarget = e.fromElement === e.srcElement ? e.toElement: e.fromElement;
					e.pageX = e.clientX + node.scrollLeft;
					e.pageY = e.clientY + node.scrollTop;
					e.layerX = e.x;
					e.layerY = e.y;
					// 1 ： 单击 2 ： 中键点击 3 ： 右击
					e.which = e.button & 1 ? 1: e.button & 2 ? 3: e.button & 4 ? 2: 0;

				}
			}
		};
		
		keyEvent = {
			initEvent: function (e) {
				defaultEvent.initEvent(e);
				e.which = e.keyCode;
			}
		};

		Dom.cloneFix.SCRIPT = 'text';

		styleFix.opacity = function(value){
			var elem = this.node, style = elem.style;

			assert(!+value || (value <= 1 && value >= 0), 'Dom#setStyle("opacity", value): {value} 必须在 0~1 间。', value);
			assert.isElement(elem, "Dom#setStyle(name, value): 当前 dom 不支持样式");

			if (value)
				value *= 100;
			value = value || value === 0 ? 'opacity=' + value : '';

			// 获取真实的滤镜。
			elem = styleString(elem, 'filter');

			assert(!/alpha\([^)]*\)/i.test(elem) || rOpacity.test(elem), 'Dom#setOpacity(value): 当前元素的 {filter} CSS属性存在不属于 alpha 的 opacity， 将导致 setOpacity 不能正常工作。', elem);

			// 当元素未布局，IE会设置失败，强制使生效。
			style.zoom = 1;

			// 设置值。
			style.filter = rOpacity.test(elem) ? elem.replace(rOpacity, value) : (elem + ' alpha(' + value + ')');

			return this;

		};

		defaultHook.get = function(elem, name) {

			if (!elem.getAttributeNode) {
				return defaultHook.getProp(elem, name);
			}

			// 获取属性节点，避免 IE 返回属性。
			name = elem.getAttributeNode(name);

			// 如果不存在节点， name 为 null ，如果不存在节点值， 返回 null。
			return name ? name.value || (name.specified ? "" : null) : null;

		};

		defaultHook.set = formHook.set = function(elem, name, value) {

			if (elem.getAttributeNode) {

				// 获取原始的属性节点。
				var node = elem.getAttributeNode(name);

				// 如果 value === null 表示删除节点。
				if (value === null) {

					// 仅本来存在属性时删除节点。
					if (node) {
						node.nodeValue = '';
						elem.removeAttributeNode(node);
					}

					// 本来存在属性值，则设置属性值。
				} else if (node) {
					node.nodeValue = value;
				} else {
					elem.setAttribute(name, value);
				}

			} else {
				defaultHook.setProp(elem, name, value);
			}
		};

		// IE678 无法获取 style 属性，改用 style.cssText 获取。
		attrFix.style = {
			get: function(elem, name) {
				return elem.style.cssText.toLowerCase() || null;
			},
			set: function(elem, name, value) {
				elem.style.cssText = value || '';
			}
		};

		if (navigator.isQuirks) {
			
			// IE 6/7 获取 Button 的value会返回文本。
			attrFix.value = {
				
				_get: attrFix.value.get,
				
				get: function(elem, name, type) {
					return elem.tagName === 'BUTTON' ? defaultHook.get(elem, name) : this._get(elem, name, type);
				},
				
				set: function(elem, name, value) {
					if(elem.tagName === 'BUTTON') {
						defaultHook.set(elem, name, value);
					} else {
						elem.value = value || '';
					}
				}
			};

			// IE 6/7 会自动添加值到下列属性。
			attrFix.href = attrFix.src = attrFix.useMap = attrFix.width = attrFix.height = {

				get: function(elem, name) {
					return elem.getAttribute(name, 2);
				},

				set: function(elem, name, value) {
					elem.setAttribute(name, value);
				}
			};

			// IE 6/7 在设置 contenteditable 为空时报错。
			attrFix.contentEditable = {

				get: function(elem, name) {

					// 获取属性节点，避免 IE 返回属性。
					name = elem.getAttributeNode(name);

					// 如果不存在节点， name 为 null ，如果不存在节点值， 返回 null。
					return name && name.specified ? name.value : null;

				},

				set: function(elem, name, value) {
					if (value === null) {
						elem.removeAttributeNode(elem.getAttributeNode(name));
					} else {
						defaultHook.set(elem, name, value || "false");
					}
				}
			};
	
			try {
	
				// 修复IE6 因 css 改变背景图出现的闪烁。
				document.execCommand("BackgroundImageCache", false, true);
			} catch(e) {
	
			}

		}

	}
	
	Dom.addEvents("click dblclick mousedown mouseup mouseover mouseenter mousemove mouseleave mouseout contextmenu selectstart selectend", mouseEvent);
	
	Dom.addEvents("keydown keypress keyup", keyEvent);

	if(div.onfocusin === undefined) {

		Dom.addEvents('focusin focusout', {
			fix: function(elem, type, fnName) {
				var base = type === 'focusin' ? 'focus' : 'blur';
				var doc = elem.node.ownerDocument || elem.node;
				doc[fnName](base, this.handler, true);
			},
			handler: function(e) {
				var type = e.orignalType = e.type === 'focus' ? 'focusin' : 'focusout';

				var p = e.getTarget();

				while (p) {
					if (!p.trigger(type, e)) {
						return;
					}
					p = p.parent();
				}

				document.trigger(type, e);
			},
			add: function(elem, type, fn) {
				this.fix(elem, type, 'addEventListener');
			},
			remove: function() {
				this.fix(elem, type, 'removeEventListener');
			}
		});

	}

	if(div.onmousewheel === undefined) {
		Dom.addEvents('mousewheel', {
			base: 'DOMMouseScroll'
		});
	}
	
	// Firefox 会在右击时触发 document.onclick 。
	if(navigator.isFirefox) {
		Dom.addEvents('click', {
			initEvent: function(e){
				return e.which === undefined || e.which === 1;
			}
		});
	}
	
	Object.each({
		'mouseenter': 'mouseover',
		'mouseleave': 'mouseout'
	}, function(fix, event) {
		Dom.addEvents(event, {
			initEvent: function (e) {
				
				// 如果浏览器原生支持 mouseenter/mouseleave, 不作操作。
				if(e.type !== event) {
					
					var relatedTarget = e.relatedTarget;
		
					// 修正 getTarget 返回值。
					e.orignalType = event;
					return this.node !== relatedTarget && !Dom.has(this.node, relatedTarget);
					
				}
			},
			base: div.onmouseenter === null ? null : fix,
			delegate: fix
		});
	});
	
	Dom.addEvents('focus', {
			delegate: 'focusin'
		}).addEvents('blur', {
			delegate: 'focusout'
		});
	
	/// #endregion

	/// #region DomReady

	/**
	 * 设置在页面加载(不包含图片)完成时执行函数。
	 * @param {Functon} fn 当DOM加载完成后要执行的函数。
	 * @member Dom.ready
	 * @remark
	 * 允许你绑定一个在DOM文档载入完成后执行的函数。需要把页面中所有需要在 DOM 加载完成时执行的Dom.ready()操作符都包装到其中来。
	 * 
        @example
          当DOM加载完成后，执行其中的函数。
          #####JavaScript:<pre>Dom.ready(function(){
  // 文档就绪
});</pre>
        
	 */

	/**
	 * 设置在页面加载(包含图片)完成时执行函数。
	 * @param {Functon} fn 执行的函数。
	 * @member Dom.load
	 * @remark
	 * 允许你绑定一个在DOM文档载入完成后执行的函数。需要把页面中所有需要在 DOM 加载完成时执行的Dom.load()操作符都包装到其中来。
        @example
          当DOM加载完成后，执行其中的函数。
          #####JavaScript:<pre>Dom.load(function(){
  // 文档和引用的资源文件加载完成
});</pre>
        
	 */

	// 避免使用了默认的 DOM 事件处理。
	Dom.$event.domready = Dom.$event.domload = {};

	map('ready load', function(readyOrLoad, isLoad) {

		var isReadyOrIsLoad = isLoad ? 'isLoaded': 'isReady';
		
		readyOrLoad = 'dom' + readyOrLoad;

		// 设置 ready load
		return function (fn, scope) {
			
			// 忽略参数不是函数的调用。
			var isFn = Object.isFunction(fn);

			// 如果已载入，则直接执行参数。
			if(Dom[isReadyOrIsLoad]) {

				if (isFn)
					fn.call(scope);

				// 如果参数是函数。
			} else if (isFn) {

				document.on(readyOrLoad, fn, scope);

				// 触发事件。
				// 如果存在 JS 之后的 CSS 文件， 肯能导致 document.body 为空，此时延时执行 DomReady
			} else if (document.body) {

				// 如果 isReady, 则删除
				if(isLoad) {

					// 使用系统文档完成事件。
					isFn = Dom.window;
					fn = readyOrLoad;

					// 确保 ready 触发。
					Dom.ready();

				} else {
					isFn = document;
					fn = domReady;
				}

				defaultEvent.remove(isFn, fn, arguments.callee);

				// 先设置为已经执行。
				Dom[isReadyOrIsLoad] = true;

				// 触发事件。
				if (document.trigger(readyOrLoad, fn)) {

					// 删除事件。
					document.un(readyOrLoad);

				}
				
			} else {
				setTimeout(arguments.callee, 1);
			}

			return document;
		};

	}, Dom);
	
	// 如果readyState 不是 complete, 说明文档正在加载。
	if(document.readyState !== "complete") {

		// 使用系统文档完成事件。
		defaultEvent.add(document, domReady, Dom.ready);

		defaultEvent.add(Dom.window, 'load', Dom.load, false);

		/// #if CompactMode
		
		// 只对 IE 检查。
		if(!isStd) {

			// 来自 jQuery
			// 如果是 IE 且不是框架
			var topLevel = false;

			try {
				topLevel = window.frameElement == null && document.documentElement;
			} catch(e) {
			}

			if(topLevel && topLevel.doScroll) {

				/**
				 * 为 IE 检查状态。
				 * @private
				 */
				(function doScrollCheck() {
					if(Dom.isReady) {
						return;
					}

					try {
						// Use the trick by Diego Perini
						// http://javascript.nwbox.com/IEContentLoaded/
						topLevel.doScroll("left");
					} catch(e) {
						return setTimeout(doScrollCheck, 50);
					}

					Dom.ready();
				})();
			}
		}

		/// #endif
	} else {
		setTimeout(Dom.load, 1);
	}
	
	/// #endregion

	/// #region Export
	
	div = null;
	
	// 导出函数。
	window.Dom = Dom;
	window.DomList = DomList;
	window.Point = Point;
	window.$ = window.$ || Dom.get;
	window.$$ = window.$$ || Dom.query;
	
	/// #endregion

	/**
	 * @class
	 */

	/**
	 * 创建 DomList 的方法。 
	 * @param {NodeList} fnName 对应的 Dom 对象的函数名。
	 * @param {Integer} listType=0 函数类型。
	 */
	function createDomListMthod(fnName, listType){
		return !listType ? function () {
			// 为每个 Dom 对象调用 fnName 。
			var i = 0, len = this.length, target;
			while(i < len) {
				target = new Dom(this[i++]);
				target[fnName].apply(target, arguments);
			}
			return this;
		} : listType === 2 ? function() {
			// 返回第一个元素的对应值 。
			if(this.length) {
				var target = new Dom(this[0]);
				return target[fnName].apply(target, arguments);
			}
		} : listType === 3 ? function() {
			// 将返回的每个节点放入新的 DomList 中。
			var r = new DomList;
			return r.add.apply(r, this.invoke(fnName, arguments));
		} : function() {
			// 只要有一个返回非 false，就返回这个值。
			var i = 0, r, target;
			while (i < this.length && !r) {
				target = new Dom(this[i++]);
				r = target[fnName].apply(target, arguments);
			}
			return r;
		};
	}
	
	/**
	 * 遍历 NodeList 对象。 
	 * @param {NodeList} nodelist 要遍历的 NodeList。
	 * @param {Function} fn 遍历的函数。
	 */
	function each(nodelist, fn) {
		var i = 0, node;
		while( node = nodelist[i++]){
			fn(node);
		}
	}

	/**
	 * 获取元素的文档。
	 * @param {Node} node 元素。
	 * @return {Document} 文档。
	 */
	function getDocument(node) {
		assert.isNode(node, 'Dom.getDocument(node): {node} ~', node);
		return node.ownerDocument || node.document || node;
	}

	/**
	 * 返回简单的遍历函数。
	 * @param {String} next 获取下一个成员使用的名字。
	 * @param {String} first=next 获取第一个成员使用的名字。
	 * @return {Function} 遍历函数。
	 */
	function createTreeWalker(next, first) {
		first = first || next;
		return function(args) {
			var node = this.node[first];
			
			// 如果存在 args 编译为函数。
			if(args){
				args = getFilter(args);
			}
			
			while(node) {
				if(args ? args.call(this, node) : node.nodeType === 1)
					return new Dom(node);
				node = node[next];
			}
			
			return null;
		};
	}

	/**
	 * 返回简单的遍历函数。
	 * @param {String} next 获取下一个成员使用的名字。
	 * @param {String} first=next 获取第一个成员使用的名字。
	 * @return {Function} 遍历函数。
	 */
	function createTreeDir(next, first) {
		first = first || next;
		return function(args) {
			var node = this.node[first],
				r = new DomList;

			// 如果存在 args 编译为函数。
			if (args) {
				args = getFilter(args);
			}

			while (node) {
				if (args ? args.call(this, node) : node.nodeType === 1)
					r.push(node);
				node = node[next];
			}

			return r;
		}
	}
	
	/**
	 * 获取一个选择器。
	 * @param {Number/Function/String/Boolean} args 参数。
	 * @return {Funtion} 函数。
	 */
	function getFilter(args) {
		
		// 如果存在 args，则根据不同的类型返回不同的检查函数。
		switch (typeof args) {
			
			// 数字返回一个计数器函数。
			case 'number':
				return function(elem) {
					return elem.nodeType === 1 && --args < 0;
				};
				
				// 字符串，表示选择器。
			case 'string':
				if(/^(?:[-\w:]|[^\x00-\xa0]|\\.)+$/.test(args)) {
					args = args.toUpperCase();
					return function(elem) {
						return elem.nodeType === 1 && elem.tagName === args;
					};
				}
				return args === '*' ? null : function(elem) {
					return elem.nodeType === 1 && Dom.match(elem, args);
				};
				
				// 布尔类型，而且是 true, 返回 Function.from(true)，  表示不过滤。
			case 'boolean':
				args = returnTrue;
				break;
			
		}

		assert.isFunction(args, "Dom#xxxAll(args): {args} 必须是一个 null、函数、数字或字符串。", args);
		
		return args;
	}
	
	/**
	 * 删除由于拷贝导致的杂项。
	 * @param {Element} srcElem 源元素。
	 * @param {Element} destElem 目的元素。
	 * @param {Boolean} cloneDataAndEvent=true 是否复制数据。
	 * @param {Boolean} keepId=false 是否留下ID。
	 */
	function cleanClone(srcElem, destElem, cloneDataAndEvent, keepId) {

		// 删除重复的 ID 属性。
		if(!keepId && destElem.removeAttribute)
			destElem.removeAttribute('id');

		/// #if CompactMode
		
		if(destElem.clearAttributes) {

			// IE 会复制 自定义事件， 清楚它。
			destElem.clearAttributes();
			destElem.mergeAttributes(srcElem);
			destElem.$data = null;

			if(srcElem.options) {
				each(srcElem.options, function(value) {
					destElem.options.seleced = value.seleced;
				});
			}
		}

		/// #endif

		if (cloneDataAndEvent !== false && (cloneDataAndEvent = srcElem.$data)) {

			destElem.$data = cloneDataAndEvent = extend({}, cloneDataAndEvent);
			
			// event 作为系统内部对象。事件的拷贝必须重新进行 on 绑定。
			var event = cloneDataAndEvent.$event, dest;

			if (event) {
				cloneDataAndEvent.$event = null;
				dest = new Dom(destElem);
				for (cloneDataAndEvent in event)

					// 对每种事件。
					event[cloneDataAndEvent].handlers.forEach(function(handler) {

						// 如果源数据的 target 是 src， 则改 dest 。
						dest.on(cloneDataAndEvent, handler[0], handler[1].node === srcElem ? dest : handler[1]);
					});
			}
			
		}
		
		// 特殊属性复制。
		if (keepId = Dom.cloneFix[srcElem.tagName]) {
			if (typeof keepId === 'string') {
				destElem[keepId] = srcElem[keepId];
			} else {
				keepId(destElem, srcElem);
			}
		}
	}

	/**
	 * 清除节点的引用。
	 * @param {Element} elem 要清除的元素。
	 */
	function clean(elem) {

		// 删除自定义属性。
		if(elem.clearAttributes)
			elem.clearAttributes();

		// 删除事件。
		new Dom(elem).un();

		// 删除句柄，以删除双重的引用。
		elem.$data = null;

	}

	/**
	 * 到骆驼模式。
	 * @param {String} all 全部匹配的内容。
	 * @param {String} match 匹配的内容。
	 * @return {String} 返回的内容。
	 */
	function formatStyle(all, match) {
		return match ? match.toUpperCase(): styleFloat;
	}

	/**
	 * 读取样式字符串。
	 * @param {Element} elem 元素。
	 * @param {String} name 属性名。
	 * @return {String} 字符串。
	 */
	function styleString(elem, name) {
		assert.isElement(elem, "Dom.styleString(elem, name): {elem} ~");
		return elem.style[name] || getStyle(elem, name);
	}

	/**
	 * 读取样式数字。
	 * @param {Object} elem 元素。
	 * @param {Object} name 属性名。
	 * @return {Number} 数字。
	 */
	function styleNumber(elem, name) {
		assert.isElement(elem, "Dom.styleNumber(elem, name): {elem} ~");
		var value = parseFloat(elem.style[name]);
		if(!value && value !== 0) {
			value = parseFloat(getStyle(elem, name));

			if(!value && value !== 0) {
				if( name in styleFix) {
					
					var styles = {};
					for(var style in Dom.displayFix) {
						styles[style] = elem.style[style];
					}
					
					extend(elem.style, Dom.displayFix);
					value = parseFloat(getStyle(elem, name)) || 0;
					extend(elem.style, styles);
				} else {
					value = 0;
				}
			}
		}

		return value;
	}

	/**
	 * 转换参数为标准点。
	 * @param {Number} x X坐标。
	 * @param {Number} y Y坐标。
	 * @return {Object} {x:v, y:v}
	 */
	function formatPoint(x, y) {
		return x && typeof x === 'object' ? x: {
			x: x,
			y: y
		};
	}
	
	/**
	 * 判断指定选择器是否符合指定的节点。 
	 * @param {Node} node 判断的节点。
	 * @param {String} selector 选择器表达式。
	 */
	function match(node, selector){
		var r, i = 0;
		try{
			r = node.parentNode.querySelectorAll(selector);
		} catch(e){
			return query(selector, new Dom(node.parentNode)).indexOf(node) >= 0 || query(selector, Dom.document).indexOf(node) >= 0;
		}
		while(r[i])
			if(r[i++] === node)
				return true;
		
		return false;
	}

	/// #region Selector
	
	/**
	 * 使用指定的选择器代码对指定的结果集进行一次查找。
	 * @param {String} selector 选择器表达式。
	 * @param {DomList/Dom} result 上级结果集，将对此结果集进行查找。
	 * @return {DomList} 返回新的结果集。
	 */
	function query(selector, result) {

		var prevResult = result,
			rBackslash = /\\/g, 
			m, 
			key, 
			value, 
			lastSelector, 
			filterData;
		
		selector = selector.trim();

		// 解析分很多步进行，每次解析  selector 的一部分，直到解析完整个 selector 。
		while(selector) {
			
			// 保存本次处理前的选择器。
			// 用于在本次处理后检验 selector 是否有变化。
			// 如果没变化，说明 selector 不能被正确处理，即 selector 包含非法字符。
			lastSelector = selector;
			
			// 解析的第一步: 解析简单选择器
			
			// ‘*’ ‘tagName’ ‘.className’ ‘#id’
			if( m = /^(^|[#.])((?:[-\w\*]|[^\x00-\xa0]|\\.)+)/.exec(selector)) {
				
				// 测试是否可以加速处理。
				if(!m[1] || (result[m[1] === '#' ? 'getElementById' : 'getElementsByClassName'])) {
					selector = RegExp.rightContext;
					switch(m[1]) {
						
						// ‘#id’
						case '#':
							result = result.getElementById(m[2]);
							result = result ? [result] : null;
							break;
							
							// ‘.className’
						case '.':
							result = result.getElementsByClassName(m[2]);
							break;
							
							// ‘*’ ‘tagName’
						default:
							result = result.getElements(m[2].replace(rBackslash, ""));
							break;
								
					}
		
					// 如果仅仅为简单的 #id .className tagName 直接返回。
					if (!selector) {
						return new DomList(result);
					}
							
				// 无法加速，等待第四步进行过滤。
				} else {
					result = result.getElements();
				}
			
				// 解析的第二步: 解析父子关系操作符(比如子节点筛选)
			
				// ‘a>b’ ‘a+b’ ‘a~b’ ‘a b’ ‘a *’
			} else if(m = /^\s*([\s>+~<])\s*(\*|(?:[-\w*]|[^\x00-\xa0]|\\.)*)/.exec(selector)) {
				selector = RegExp.rightContext;
				
				var value = m[2].replace(rBackslash, "");
				
				switch(m[1]){
					case ' ':
						result = result.getElements(value);
						break;
						
					case '>':
						result = result.children(value);
						break;
						
					case '+':
						result = result.next(value);
						break;
						
					case '~':
						result = result.nextAll(value);
						break;
						
					case '<':
						result = result.parentAll( value);
						break;
						
					default:
						throwError(m[1]);
				}
				
				// ‘a>b’: m = ['>', 'b']
				// ‘a>.b’: m = ['>', '']
				// result 始终实现了  Dom 接口，所以保证有 Dom.combinators 内的方法。

				// 解析的第三步: 解析剩余的选择器:获取所有子节点。第四步再一一筛选。
			} else {
				result = result.getElements();
			}
		
			// 强制转 DomList 以继续处理。
			if(!(result instanceof DomList)){
				result = new DomList(result);
			}
			
			// 解析的第四步: 筛选以上三步返回的结果。
	
			// ‘#id’ ‘.className’ ‘:filter’ ‘[attr’
			while(m = /^([#\.:]|\[\s*)((?:[-\w]|[^\x00-\xa0]|\\.)+)/.exec(selector)) {
				selector = RegExp.rightContext;
				value = m[2].replace(rBackslash, "");
				
				// ‘#id’: m = ['#','id']
				
				// 筛选的第一步: 分析筛选器。
	
				switch (m[1]) {
	
					// ‘#id’
					case "#":
						filterData = ["id", "=", value];
						break;
	
						// ‘.className’
					case ".":
						filterData = ["class", "~=", value];
						break;
	
						// ‘:filter’
					case ":":
						filterData = Dom.pseudos[value] || throwError(value);
						args = undefined;
	
						// ‘selector:nth-child(2)’
						if( m = /^\(\s*("([^"]*)"|'([^']*)'|[^\(\)]*(\([^\(\)]*\))?)\s*\)/.exec(selector)) {
							selector = RegExp.rightContext;
							args = m[3] || m[2] || m[1];
						}
						
						
						break;
	
						// ‘[attr’
					default:
						filterData = [value.toLowerCase()];
						
						// ‘selector[attr]’ ‘selector[attr=value]’ ‘selector[attr='value']’  ‘selector[attr="value"]’    ‘selector[attr_=value]’
						if( m = /^\s*(?:(\S?=)\s*(?:(['"])(.*?)\2|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/.exec(selector)) {
							selector = RegExp.rightContext;
							if(m[1]) {
								filterData[1] = m[1];
								filterData[2] = m[3] || m[4];
								filterData[2] = filterData[2] ? filterData[2].replace(/\\([0-9a-fA-F]{2,2})/g, function (x, y) {
									return String.fromCharCode(parseInt(y, 16));
								} 
								).replace(rBackslash, "") : "";
							}
						}
						break;
				}
		
				var args, 
					oldResult = result,
					i = 0,
					elem;
				
				// 筛选的第二步: 生成新的集合，并放入满足的节点。
				
				result = new DomList();
				if(filterData.call) {
					
					// 仅有 2 个参数则传入 oldResult 和 result
					if(filterData.length === 3){
						filterData(args, oldResult, result);
					} else {
						while(elem = oldResult[i++]) {
							if(filterData(elem, args))
								result.push(elem);
						}
					}
				} else {
					while(elem = oldResult[i++]){
						var actucalVal = Dom.getAttr(elem, filterData[0], 1),
							expectedVal = filterData[2],
							tmpResult;
						switch(filterData[1]){
							case undefined:
								tmpResult = actucalVal != null;
								break;
							case '=':
								tmpResult = actucalVal === expectedVal;
								break;
							case '~=':
								tmpResult = (' ' + actucalVal + ' ').indexOf(' ' + expectedVal + ' ') >= 0;
								break;
							case '!=':
								tmpResult = actucalVal !== expectedVal;
								break;
							case '|=':
								tmpResult = ('-' + actucalVal + '-').indexOf('-' + expectedVal + '-') >= 0;
								break;
							case '^=':
								tmpResult = actucalVal && actucalVal.indexOf(expectedVal) === 0;
								break;
							case '$=':
								tmpResult = actucalVal && actucalVal.substr(actucalVal.length - expectedVal.length) === expectedVal;
								break;
							case '*=':
								tmpResult = actucalVal && actucalVal.indexOf(expectedVal) >= 0;
								break;
							default:
								throw 'Not Support Operator : "' + filterData[1] + '"'
						}
						
						if(tmpResult){
							result.push(elem);	
						}
					}
				}
			}
			
			// 最后解析 , 如果存在，则继续。

			if( m = /^\s*,\s*/.exec(selector)) {
				selector = RegExp.rightContext;
				return result.add(query(selector, prevResult));
			}


			if(lastSelector.length === selector.length){
				throwError(selector);
			}
		}
		
		return result;
	}
		
	/**
	 * 抛出选择器语法错误。 
 	 * @param {String} message 提示。
	 */
	function throwError(message) {
		throw new SyntaxError('An invalid or illegal string was specified : "' + message + '"!');
	}

	/// #endregion
	
})(this);

/*********************************************************
 * System.Utils.Deferrable
 *********************************************************/
/**
 * @author xuld
 */

/**
 * 用于异步执行任务时保证任务是串行的。
 */
var Deferrable = Class({

	chain: function (deferrable, args) {
		var lastTask = [deferrable, args];

		if (this._firstTask) {
			this._lastTask[2] = lastTask;
		} else {
			this._firstTask = lastTask;
		}
		this._lastTask = lastTask;
	},

	progress: function () {

		var firstTask = this._firstTask;
		this.isRunning = false;

		if (firstTask) {
			this._firstTask = firstTask[2];
			
			firstTask[0].run(firstTask[1]);
		}

		return this;
		
	},

	/**
	 * 多个请求同时发生后的处理方法。
	 * wait - 等待上个操作完成。
	 * ignore - 忽略当前操作。
	 * stop - 正常中断上个操作，上个操作的回调被立即执行，然后执行当前操作。
	 * abort - 非法停止上个操作，上个操作的回调被忽略，然后执行当前操作。
	 * replace - 替换上个操作为新的操作，上个操作的回调将被复制。
	 */
	defer: function (args, link) {

		var isRunning = this.isRunning;
		this.isRunning = true;

		if (!isRunning)
			return false;

		switch (link) {
			case undefined:
				break;
			case "abort":
			case "stop":
			case "skip":
				this[link]();
				this.isRunning = true;
				return false;
			case "replace":
				this.init(this.options = Object.extend(this.options, args));
				
			// fall through
			case "ignore":
				return true;
			default:
				assert(link === "wait", "Deferred#defer(args, link): 成员 {link} 必须是 wait、abort、stop、ignore、replace 之一。", link);
		}

		this.chain(this, args);
		return true;
	},

	/**
	 * 让当前队列等待指定的 deferred 全部执行完毕后执行。
	 */
	wait: function (deferred) {
		if (this.isRunning) {
			this.stop();
		}

		this.defer = deferred.defer.bind(deferred);
		this.progress = deferred.progress.bind(deferred);
		return this;
	},

	then: function (callback, args) {
		if (this.isRunning) {
			this.chain({
				owner: this,
				run: function (args) {
					if(callback.call(this.owner, args) !== false)
						this.owner.progress();
				}
			}, args);
		} else {
			callback.call(this, args);
		}
		return this;
	},
	
	delay: function(duration){
		return this.run({duration: duration});
	},
	
	pause: Function.empty,
	
	skip: function(){
		this.pause();
		this.progress();
		return this;
	},
	
	abort: function(){
		this.pause();
		this._firstTask = this._lastTask = null;
		this.isRunning = false;
		return this;
	},

	stop: function () {
		return this.abort();
	}

});

/*********************************************************
 * System.Fx.Base
 *********************************************************/
/**
 * @fileOverview 提供底层的 特效算法支持。
 * @author xuld
 */

/**
 * 特效算法基类。
 * @class Fx
 * @extends Deferrable
 * @abstract
 */
var Fx = (function() {
	
	
	/// #region interval
	
	var cache = {};
	
	/**
	 * 定时执行的函数。
	 */
	function interval(){
		var i = this.length;
		while(--i >= 0)
			this[i].step();
	}
	
	/// #endregion
		
	return Deferrable.extend({

		/**
		 * 当前 FX 对象的默认配置。
		 */
		options: {

			/**
			 * 特效执行毫秒数。
			 * @type {Number}
			 */
			duration: 300,

			/**
			 * 每秒的运行帧次。
			 * @type {Number}
			 */
			fps: 50,

			/**
			 * 用于实现渐变曲线的计算函数。函数的参数为：
			 *
			 * - @param {Object} p 转换前的数值，0-1 之间。
			 *
			 * 返回值是一个数字，表示转换后的值，0-1 之间。
			 * @field
			 * @type Function
			 * @remark
			 */
			transition: function(p) {
				return -(Math.cos(Math.PI * p) - 1) / 2;
			}

		},
		
		/**
		 * 当被子类重写时，实现生成当前变化所进行的初始状态。
		 * @param {Object} from 开始位置。
		 * @param {Object} to 结束位置。
		 * @return {Base} this
		 */
		init: Function.empty,
		
		/**
		 * @event step 当进度改变时触发。
		 * @param {Number} value 当前进度值。
		 */
		
		/**
		 * 根据指定变化量设置值。
		 * @param {Number} delta 变化量。 0 - 1 。
		 * @abstract
		 */
		set: Function.empty,
		
		/**
		 * 进入变换的下步。
		 */
		step: function() {
			var me = this,
				time = Date.now() - me.time,
				options = me.options;
			if (time < options.duration) {
				me.set(options.transition(time / options.duration));
			}  else {
				me.end(false);
			}
		},
		
		/**
		 * 开始运行特效。
		 * @param {Object} from 开始位置。
		 * @param {Object} to 结束位置。
		 * @param {Number} duration=-1 变化的时间。
		 * @param {Function} [onComplete] 停止回调。
		 * @param {String} link='wait' 变化串联的方法。 可以为 wait, 等待当前队列完成。 restart 柔和转换为目前渐变。 cancel 强制关掉已有渐变。 ignore 忽视当前的效果。
		 * @return {Base} this
		 */
		run: function (options, link) {
			var me = this, defaultOptions, duration;
			if (!me.defer(options, link)) {

				defaultOptions = me.options;

				// options
				me.options = options = Object.extend({
					transition: defaultOptions.transition,
					fps: defaultOptions.fps
				}, options);

				// duration
				duration = options.duration;
				assert(duration == undefined || duration === 0 || +duration, "Fx#run(options, link): {duration} 必须是数字。如果需要使用默认的时间，使用 -1 。",  duration);
				options.duration = duration !== -1 && duration != undefined ? duration < 0 ? -defaultOptions.duration / duration : duration : defaultOptions.duration;

				// start
				if (options.start && options.start.call(options.target, options, me) === false) {
					me.progress();
				} else {

					me.init(options);
					me.set(0);
					me.time = 0;
					me.resume();
				}
			}

			return me;
		},

		/**
		 * 让当前特效执行器等待指定时间。
		 */
		delay: function(timeout){
			return this.run({
				duration: timeout
			});
		},

		/**
		 * 由应用程序通知当前 Fx 对象特效执行完。
		 * @param {Boolean} isAbort 如果是强制中止则为 true, 否则是 false 。
		 */
		end: function(isAbort) {
			var me = this;
			me.pause();
			me.set(1);
			try {

				// 调用回调函数。
				if (me.options.complete) {
					me.options.complete.call(me.options.target, isAbort, me);
				}
			} finally {

				// 删除配置对象。恢复默认的配置对象。
				delete me.options;
				me.progress();
			}
			return me;
		},
		
		/**
		 * 中断当前效果。
		 */
		stop: function() {
			this.abort();
			this.end(true);
			return this;
		},
		
		/**
		 * 暂停当前效果。
		 */
		pause: function() {
			var me = this, fps, intervals;
			if (me.timer) {
				me.time = Date.now() - me.time;
				fps = me.options.fps;
				intervals = cache[fps];
				intervals.remove(me);
				if (intervals.length === 0) {
					clearInterval(me.timer);
					delete cache[fps];
				}
				me.timer = 0;
			}
			return me;
		},
		
		/**
		 * 恢复当前效果。
		 */
		resume: function() {
			var me = this, fps, intervals;
			if (!me.timer) {
				me.time = Date.now() - me.time;
				fps = me.options.fps;
				intervals = cache[fps];
				if (intervals) {
					intervals.push(me);
					me.timer = intervals[0].timer;
				} else {
					me.timer = setInterval(interval.bind(cache[fps] = [me]), Math.round(1000 / fps ));
				}
			}
			return me;
		}
		
	});
	

})();

/*********************************************************
 * System.Fx.Tween
 *********************************************************/
/** * DOM 补间动画 * @author xuld */Object.extend(Fx, {		/**	 * 用于特定 css 补间动画的引擎。 
	 */	tweeners: {},		/**	 * 默认的补间动画的引擎。 	 */	defaultTweeners: [],		/**	 * 用于数字的动画引擎。
	 */	numberTweener: {		get: function(target, name){			return Dom.styleNumber(target.node, name);		},						/**		 * 常用计算。		 * @param {Object} from 开始。		 * @param {Object} to 结束。		 * @param {Object} delta 变化。		 */		compute: function(from, to, delta){			return (to - from) * delta + from;		},				parse: function(value){			return typeof value == "number" ? value : parseFloat(value);		},				set: function(target, name, value){			target.node.style[name] = value;		}	},	/**	 * 补间动画	 * @class Tween	 * @extends Fx	 */	Tween: Fx.extend({				/**		 * 初始化当前特效。		 */		constructor: function(){					},				/**		 * 根据指定变化量设置值。		 * @param {Number} delta 变化量。 0 - 1 。		 * @override		 */		set: function(delta){			var options = this.options,				params = options.params,				target = options.target,				tweener,				key,				value;			// 对当前每个需要执行的特效进行重新计算并赋值。			for (key in params) {				value = params[key];				tweener = value.tweener;				tweener.set(target, key, tweener.compute(value.from, value.to, delta));			}		},				/**		 * 生成当前变化所进行的初始状态。		 * @param {Object} options 开始。		 */		init: function (options) {							// 对每个设置属性			var key,				tweener,				part,				value,				parsed,				i,				// 生成新的 tween 对象。				params = {};						for (key in options.params) {				// value				value = options.params[key];				// 如果 value 是字符串，判断 += -= 或 a-b				if (typeof value === 'string' && (part = /^([+-]=|(.+?)-)(.*)$/.exec(value))) {					value = part[3];				}				// 找到用于变化指定属性的解析器。				tweener = Fx.tweeners[key = key.toCamelCase()];								// 已经编译过，直接使用， 否则找到合适的解析器。				if (!tweener) {										// 如果是纯数字属性，使用 numberParser 。					if(key in Dom.styleNumbers) {						tweener = Fx.numberTweener;					} else {												i = Fx.defaultTweeners.length;												// 尝试使用每个转换器						while (i-- > 0) {														// 获取转换器							parsed = Fx.defaultTweeners[i].parse(value, key);														// 如果转换后结果合格，证明这个转换器符合此属性。							if (parsed || parsed === 0) {								tweener = Fx.defaultTweeners[i];								break;							}						}						// 找不到合适的解析器。						if (!tweener) {							continue;						}											}					// 缓存 tweeners，下次直接使用。					Fx.tweeners[key] = tweener;				}								// 如果有特殊功能。 ( += -= a-b)				if(part){					parsed = part[2];					i = parsed ? tweener.parse(parsed) : tweener.get(options.target, key);					parsed = parsed ? tweener.parse(value) : (i + parseFloat(part[1] === '+=' ? value : '-' + value));				} else {					parsed = tweener.parse(value);					i = tweener.get(options.target, key);				}								params[key] = {					tweener: tweener,					from: i,					to: parsed						};								assert(i !== null && parsed !== null, "Fx.Tween#init(options): 无法正确获取属性 {key} 的值({from} {to})。", key, i, parsed);							}			options.params = params;		}		}),		createTweener: function(tweener){		return Object.extendIf(tweener, Fx.numberTweener);	}	});Object.each(Dom.styleFix, function(value, key){	Fx.tweeners[key] = this;}, Fx.createTweener({	set: function (target, name, value) {		Dom.styleFix[name].call(target, value);	}}));Fx.tweeners.scrollTop = Fx.createTweener({	set: function (target, name, value) {		target.setScroll(null, value);	},	get: function (target) {		return target.getScroll().y;	}});Fx.tweeners.scrollLeft = Fx.createTweener({	set: function (target, name, value) {		target.setScroll(value);	},	get: function (target) {		return target.getScroll().x;	}});Fx.defaultTweeners.push(Fx.createTweener({	set: navigator.isStd ? function (target, name, value) {				target.node.style[name] = value + 'px';	} : function(target, name, value) {		try {						// ie 对某些负属性内容报错			target.node.style[name] = value;		}catch(e){}	}}));
/*********************************************************
 * System.Fx.Animate
 *********************************************************/
/**
 * @fileOverview 通过改变CSS实现的变换。
 * @author xuld
 */



 

(function(){
	
	var displayEffects = Fx.displayEffects = {
			opacity: Function.from({
				opacity: 0
			})
		},

		toggle = Dom.prototype.toggle,

		shift = Array.prototype.shift,
		
		height = 'height marginTop paddingTop marginBottom paddingBottom';

	function fixProp(options, elem, prop) {
		options.orignal[prop] = elem.style[prop];
		elem.style[prop] = Dom.styleNumber(elem, prop) + 'px';
	}

	Object.each({
		all: height + ' opacity width',
		height: height,
		width: 'width marginLeft paddingLeft marginRight paddingRight'
	}, function(value, key){
		value = Object.map(value, this, {});

		displayEffects[key] = function(options, elem, isShow) {

			// 修复 overflow 。
			options.orignal.overflow = elem.style.overflow;
			elem.style.overflow = 'hidden';

			// inline 元素不支持 修改 width 。
			if (Dom.styleString(elem, 'display') === 'inline') {
				options.orignal.display = elem.style.display;
				elem.style.display = 'inline-block';
			}

			// 如果是 width, 固定 height 。
			if (key === 'height') {
				fixProp(options, elem, 'width');
			} else if (key === 'width') {
				fixProp(options, elem, 'height');
			}
			
			return value;
		};
	}, Function.from(0));
	
	Object.map('left right top bottom', function(key, index) {
		key = 'margin' + key.capitalize();
		return function(options, elem, isShow) {

			// 将父元素的 overflow 设为 hidden 。
			elem.parentNode.style.overflow = 'hidden';

			var params = {},
				fromValue,
				toValue,
				key2,
				delta;
			
			if (index <= 1) {
				key2 = index === 0 ? 'marginRight' : 'marginLeft';
				fromValue = -elem.offsetWidth - Dom.styleNumber(elem, key2);
				toValue = Dom.styleNumber(elem, key);
				params[key] = isShow ? (fromValue + '-' + toValue) : (toValue + '-' + fromValue);

				fixProp(options, elem, 'width');
				delta = toValue - fromValue;
				toValue = Dom.styleNumber(elem, key2);
				fromValue = toValue + delta;
				params[key2] = isShow ? (fromValue + '-' + toValue) : (toValue + '-' + fromValue);

			} else {
				key2 = index === 2 ? 'marginBottom' : 'marginTop';
				fromValue = -elem.offsetHeight - Dom.styleNumber(elem, key2);
				toValue = Dom.styleNumber(elem, key);
				params[key] = isShow ? (fromValue + '-' + toValue) : (toValue + '-' + fromValue);
			}

			return params;
		
		};
		
	}, displayEffects);

	Dom.implement({
		
		/**
		 * 获取和当前节点有关的 param 实例。
		 * @return {Animate} 一个 param 的实例。
		 */
		fx: function() {
			var data = this.dataField();
			return data.$fx || (data.$fx = new Fx.Tween());
		}
		
	}, 2)
	
	.implement({
		
		/**
		 * 变化到某值。
		 * @param {String/Object} [name] 变化的名字或变化的末值或变化的初值。
		 * @param {Number} duration=-1 变化的时间。
		 * @param {Function} [oncomplete] 停止回调。
		 * @param {String} link='wait' 变化串联的方法。 可以为 wait, 等待当前队列完成。 rerun 柔和转换为目前渐变。 cancel 强制关掉已有渐变。 ignore 忽视当前的效果。
		 * @return this
		 */
		animate: function (params, duration, oncomplete, link) {
			assert.notNull(params, "Dom#animate(params, duration, oncomplete, link): {params} ~", params);
				
			if(params.params){
				link = params.link;
			} else {
				params = {
					params: params,
					duration: duration,
					complete: oncomplete
				};
			}
			
			params.target = this;

			assert(!params.duration || typeof params.duration === 'number', "Dom#animate(params, duration, oncomplete, link): {duration} 必须是数字。如果需要制定为默认时间，使用 -1 。", params.duration);
			assert(!params.oncomplete || Object.isFunction(params.oncomplete), "Dom#animate(params, duration, oncomplete, link): {oncomplete} 必须是函数", params.oncomplete);
			
			this.fx().run(params, link);
			
			return this;
		},
		
		/**
		 * 显示当前元素。
		 * @param {Number} duration=500 时间。
		 * @param {Function} [callback] 回调。
		 * @param {String} [type] 方式。
		 * @return {Element} this
		 */
		show: function() {
			var me = this,
				args = arguments,
				callback,
				effect;

			// 如果没有参数，直接隐藏。
			if (args.length === 0) {
				Dom.show(me.node);
			} else {

				// 如果第一个参数是字符串。则表示是显示类型。
				effect = typeof args[0] === 'string' ? shift.call(args) : 'opacity';
				assert(Fx.displayEffects[effect], "Dom#show(effect, duration, callback, link): 不支持 {effect} 。", effect);
				callback = args[1];

				me.fx().run({
					target: me,
					duration: args[0],
					start: function(options, fx) {

						var elem = this.node,
							t,
							params,
							param;

						// 如果元素本来就是显示状态，则不执行后续操作。
						if (!Dom.isHidden(elem)) {
							if (callback)
								callback.call(this, true, true);
							return false;
						}

						// 首先显示元素。
						Dom.show(elem);

						// 保存原有的值。
						options.orignal = {};

						// 新建一个新的 params 。
						options.params = params = {};

						// 获取指定特效实际用于展示的css字段。
						t = Fx.displayEffects[effect](options, elem, true);

						// 保存原有的css值。
						// 用于在hide的时候可以正常恢复。
						for (param in t) {
							options.orignal[param] = elem.style[param];
						}

						// 因为当前是显示元素，因此将值为 0 的项修复为当前值。
						for (param in t) {
							if (t[param] === 0) {

								// 设置变化的目标值。
								params[param] = Dom.styleNumber(elem, param);

								// 设置变化的初始值。
								elem.style[param] = 0;
							} else {
								params[param] = t[param];
							}
						}
					},
					complete: function(isAbort, fx) {

						// 拷贝回默认值。
						Object.extend(this.node.style, fx.options.orignal);

						if (callback)
							callback.call(this, false, isAbort);
					}
				}, args[2]);

			}
		
			return me;
		},
		
		/**
		 * 隐藏当前元素。
		 * @param {Number} duration=500 时间。
		 * @param {Function} [callback] 回调。
		 * @param {String} [type] 方式。
		 * @return {Element} this
		 */
		hide: function () {
			var me = this,
				args = arguments,
				callback,
				effect;
			
			// 如果没有参数，直接隐藏。
			if (args.length === 0) {
				Dom.hide(me.node);
			} else {

				// 如果第一个参数是字符串。则表示是显示类型。
				effect = typeof args[0] === 'string' ? shift.call(args) : 'opacity';
				assert(Fx.displayEffects[effect], "Dom#hide(effect, duration, callback, link): 不支持 {effect} 。", effect);
				callback = args[1];

				me.fx().run({
					target: me,
					duration: args[0],
					start: function(options, fx) {

						var elem = this.node,
							params,
							param;

						// 如果元素本来就是隐藏状态，则不执行后续操作。
						if (Dom.isHidden(elem)) {
							if (callback)
								callback.call(this, false, true);
							return false;
						}

						// 保存原有的值。
						options.orignal = {};

						// 获取指定特效实际用于展示的css字段。
						options.params = params = Fx.displayEffects[effect](options, elem, false);

						// 保存原有的css值。
						// 用于在show的时候可以正常恢复。
						for (param in params) {
							options.orignal[param] = elem.style[param];
						}
					},
					complete: function(isAbort, fx) {

						var elem = this.node;

						// 最后显示元素。
						Dom.hide(elem);

						// 恢复所有属性的默认值。
						Object.extend(elem.style, fx.options.orignal);

						// callback
						if (callback)
							callback.call(this, false, isAbort);
					}
				}, args[2]);

			}
			
			return this;
		},
	
		toggle: function(){
			var me = this;
			me.fx().then(function (args) {
				toggle.apply(me, args);
				return false;
			}, arguments);

			return me;
		}
	
	});
	
})();

/// TODO: clear

document.animate = function() {
	assert.deprected("document.animate 已过时，请改用 Dom.get(document).animate。");
	var doc = Dom.get(document);
	doc.animate.apply(doc, arguments);
	return this;
};

/// TODO: clear

/*********************************************************
 * System.Ajax.Base
 *********************************************************/
/**
 * @fileOverview 提供最底层的请求底层辅助函数。
 */

var Ajax = (function() {

	var ajaxLoc,
		ajaxLocParts,
		rUrl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
		defaultAccepts = ["*/"] + ["*"],
		Ajax;
	
	// 如果设置了 document.domain, IE 会抛出异常。
	try {
		ajaxLoc = location.href;
	} catch (e) {
		// 使用 a 的默认属性获取当前地址。
		ajaxLoc = document.createElement("a");
		ajaxLoc.href = "";
		ajaxLoc = ajaxLoc.href;
	}

	ajaxLocParts = rUrl.exec(ajaxLoc.toLowerCase()) || [];
	
	/**
	 * 用于发送和接收 AJAX 请求的工具。
	 */
	Ajax = Deferrable.extend({
		
		/**
		 * Ajax 默认配置。
		 */
		options: {

			///**
			// * 供 Transport 设置的状态回调。
			// */
			//callback: Function.empty,
			
			/**
			 * 传输的数据类型。
			 * @type String
			 */
			dataType: 'text',
	
			/**
			 * 当前 AJAX 发送的地址。
			 * @field url
			 */
			url: ajaxLoc,
	
			/**
			 * 超时的时间大小。 (单位: 毫秒)
			 * @property timeouts
			 * @type Number
			 */
			timeout: -1,

			/**
			 * 出现错误后的回调。
			 */
			exception: function(e) {
				this.callback(e.message, -1);
			},
	
			///**
			// * 获取或设置是否为允许缓存。
			// * @type Boolean
			// */
			//cache: true,
	
			///**
			// * 发送的数据。
			// * @type Obeject/String
			// */
			//data: null,
	
			///**
			// * 发送数据前的回调。
			// * @type Function
			// */
			//start: null,
	
			///**
			// * 发送数据成功的回调。
			// * @type Function
			// */
			//success: null,
	
			///**
			// * 发送数据错误的回调。
			// * @type Function
			// */
			//error: null,
	
			///**
			// * 发送数据完成的回调。
			// * @type Function
			// */
			//complete: null,
		
			/**
			 * 用于格式化原始数据的函数。
			 * @type Function
			 */
			formatData: function(data) {
				return typeof data === 'string' ? data : Ajax.param(data);
			}

			///**
			// * 获取或设置请求类型。
			// */
			//type: 'GET',

			///**
			// * 获取或设置是否为异步请求。
			// */
			//async: true,

			///**
			// * 获取或设置是否为请求使用的用户名。
			// */
			//username: null,

			///**
			// * 获取或设置是否为请求使用的密码。
			// */
			//password: null,

			///**
			// * 获取请求头。
			// */
			//headers: null,
			
		},
		
		/**
		 * Ajax 对象。
		 * @constructor Ajax
		 */
		constructor: function() {

		},

		/**
		 * 发送一个 AJAX 请求。
		 * @param {Object} options 发送的配置。
		 *
		 * //  accepts - 请求头的 accept ，默认根据 dataType 生成。
		 * async - 是否为异步的请求。默认为 true 。
		 * cache - 是否允许缓存。默认为 true 。
		 * charset - 请求的字符编码。
		 * complete(errorCode, xhr) - 请求完成时的回调。
		 * //  contentType - 请求头的 Content-Type 。默认为 'application/x-www-form-urlencoded; charset=UTF-8'。
		 * // createNativeRequest() - 创建原生 XHR 对象的函数。
		 * crossDomain - 指示 AJAX 强制使用跨域方式的请求。默认为 null,表示系统自动判断。
		 * data - 请求的数据。
		 * dataType - 请求数据的类型。默认为根据返回内容自动识别。
		 * errorCode(message, xhr) - 请求失败时的回调。
		 * formatData(data) - 用于将 data 格式化为字符串的函数。
		 * headers - 附加的额外请求头信息。
		 * jsonp - 如果使用 jsonp 请求，则指示 jsonp 参数。如果设为 false，则不添加后缀。默认为 callback。
		 * jsonpCallback - jsonp请求回调函数名。默认为根据当前时间戳自动生成。
		 * //  mimeType - 用于覆盖原始 mimeType 的 mimeType 。
		 * getResponse(data) - 用于解析请求数据用的回调函数。
		 * password - 请求的密码 。
		 * start(data, xhr) - 请求开始时的回调。return false 可以终止整个请求。
		 * success(data, xhr) - 请求成功时的回调。
		 * timeout - 请求超时时间。单位毫秒。默认为 -1 无超时 。
		 * type - 请求类型。必须是大写。默认是 "GET" 。
		 * url - 请求的地址。
		 * username - 请求的用户名 。
		 *
		 * @param {String} link 当出现两次并发的请求后的操作。
		 */
		run: function(options, link) {
			var me = this, defaultOptions, transport;
			
			if (!me.defer(options, link)) {

				// defaultOptions
				defaultOptions = me.options;

				// options
				me.options = options = Object.extend({
					target: me,
					formatData: defaultOptions.formatData,
					timeout: defaultOptions.timeout,
					exception: defaultOptions.exception
				}, options);
				
				assert(!options.url || options.url.replace, "Ajax#run(options): {options.url} 必须是字符串。", options.url);

				// dataType
				options.dataType = options.dataType || defaultOptions.dataType;

				// url
				options.url = options.url ? options.url.replace(/#.*$/, "") : defaultOptions.url;
	
				// data
				options.data = options.data ? options.formatData(options.data) : null;
	
				// crossDomain
				if (options.crossDomain == null) {
	
					var parts = rUrl.exec(options.url.toLowerCase());
	
					// from jQuery: 跨域判断。
					options.crossDomain = !!(parts &&
						(parts[1] != ajaxLocParts[1] || parts[2] != ajaxLocParts[2] ||
							(parts[3] || (parts[1] === "http:" ? 80 : 443)) !=
								(ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443)))
					);
	
				}
				
				// 当前用于传输的工具。
				transport = Ajax.transports[options.dataType];

				assert(transport, "Ajax#run(options, link): 不支持 {dataType} 的数据格式。", options.dataType);
				
				// 实际的发送操作。
				transport.send(options);

			}
			
			return me;
		},

		/**
		 * 停止当前的请求。
		 * @return this
		 */
		pause: function() {
			this.options.callback('Aborted', -3);
			return this;
		}

	});
	
	Object.extend(Ajax, {

		send: function(options){
			return new Ajax().run(options);
		},
		
		transports: {
			
		},
		
		accepts: {
			
		},
		
		/**
		 * 返回变量的地址形式。
		 * @param {Object} obj 变量。
		 * @return {String} 字符串。
		 * @example <pre>
		 * Ajax.param({a: 4, g: 7}); //  a=4&g=7
		 * </pre>
		 */
		param: function(obj, name) {
	
			var s;
			if (Object.isObject(obj)) {
				s = [];
				Object.each(obj, function(value, key) {
					s.push(Ajax.param(value, name ? name + "[" + key + "]" : key));
				});
				s = s.join('&');
			} else {
				s = encodeURIComponent(name) + "=" + encodeURIComponent(obj);
			}
	
			return s.replace(/%20/g, '+');
		},
		
		concatUrl: function(url, param) {
			return param ? url + (url.indexOf('?') >= 0 ? '&' : '?') + param : url;
		},
		
		addCachePostfix: function(url){
			return /[?&]_=/.test(url) ? url : Ajax.concatUrl(url, '_=' + Date.now() + JPlus.id++);
		},

		/**
		 * 判断一个 HTTP 状态码是否表示正常响应。
		 * @param {Number} status 要判断的状态码。
		 * @return {Boolean} 如果正常则返回true, 否则返回 false 。
		 * @remark 一般地， 200、304、1223 被认为是正常的状态吗。
		 */
		checkStatus: function(status) {

			// 获取状态。
			if (!status) {

				// 获取协议。
				var protocol = window.location.protocol;

				// 对谷歌浏览器, 在有些协议， status 不存在。
				return (protocol == "file: " || protocol == "chrome: " || protocol == "app: ");
			}

			// 检查， 各浏览器支持不同。
			return (status >= 200 && status < 300) || status == 304 || status == 1223;
		},

		/**
		 * 初始化一个 XMLHttpRequest 对象。
		 * @return {XMLHttpRequest} 请求的对象。
		 */
		createNativeRequest: window.XMLHttpRequest ? function() {
			return new XMLHttpRequest();
		} : function() {
			return new ActiveXObject("Microsoft.XMLHTTP");
		}

	});

	/**
	 * 公共的 XHR 对象。
	 */
	Ajax.transports.text = Ajax.XHR = {
		
		/**
		 * 根据 xhr 获取响应。
		 * @type {XMLHttpRequest} xhr 要获取的 xhr 。
		 */
		getResponse: function(xhr) {

			// 如果请求了一个二进制格式的文件， IE6-9 报错。
			try {
				return xhr.responseText;
			} catch (ieResponseTextError) {
				return '';
			}

		},

		/**
		 * 发送指定配置的 Ajax 对象。
		 * @type {Ajax} options 要发送的 AJAX 对象。
		 */
		send: function(options) {

			// 拷贝配置。

			// options
			var headers,
				xhr,
				key,
				callback;

			// type
			options.type = options.type ? options.type.toUpperCase() : 'GET';

			// async
			options.async = options.async !== false;

			// getResponse
			options.getResponse = options.getResponse || this.getResponse;

			// data
			if (options.data && options.type == 'GET') {
				options.url = Ajax.concatUrl(options.url, options.data);
				options.data = null;
			}

			// cache
			if (options.cache === false) {
				options.url = Ajax.addCachePostfix(options.url);
			}

			// headers
			headers = {};

			// headers['Accept']
			headers.Accept = options.dataType in Ajax.accepts ? Ajax.accepts[options.dataType] + ", " + defaultAccepts + "; q=0.01" : defaultAccepts;

			// headers['Content-Type']
			if (options.data) {
				headers['Content-Type'] = "application/x-www-form-urlencoded; charset=" + (options.charset || "UTF-8");
			}

			// headers['Accept-Charset']
			if (options.charset) {
				headers["Accept-Charset"] = value;
			}

			// headers['X-Requested-With']
			if (!options.crossDomain) {
				headers['X-Requested-With'] = 'XMLHttpRequest';
			}

			// 如果参数有 headers, 复制到当前 headers 。
			if (options.headers) {
				options.headers = Object.extend(headers, options.headers);
			}

			// 发送请求。

			// 请求对象。
			options.xhr = xhr = Ajax.createNativeRequest();

			/**
			 * 由 XHR 负责调用的状态检测函数。
			 * @param {Object} _ 忽略的参数。
			 * @param {Integer} errorCode 系统控制的错误码。
			 *
			 * - 0: 成功。
			 * - -1: 程序出现异常，导致进程中止。
			 * - -2: HTTP 相应超时， 程序自动终止。
			 * - -3: START 函数返回 false， 程序自动终止。
			 * - 1: HTTP 成功相应，但返回的状态码被认为是不对的。
			 * - 2: HTTP 成功相应，但返回的内容格式不对。
			 */
			callback = options.callback = function(errorMessage, error) {

				// xhr
				var xhr = options.xhr;

				try {

					if (xhr && (error || xhr.readyState === 4)) {

						// 删除 readystatechange  。
						// 删除 options.callback 避免被再次触发。
						xhr.onreadystatechange = options.callback = Function.empty;

						// 如果存在错误。
						if (error) {

							// 如果是因为超时引发的，手动中止请求。
							if (xhr.readyState !== 4) {
								xhr.abort();
							}

							// 出现错误 status = error 。
							options.status = error;
							options.statusText = "";
							options.errorMessage = errorMessage;
						} else {

							options.status = xhr.status;

							// 如果跨域，火狐报错。
							try {
								options.statusText = xhr.statusText;
							} catch (firefoxCrossDomainError) {
								// 模拟 Webkit: 设为空字符串。
								options.statusText = "";
							}

							// 检验状态码是否正确。
							if (Ajax.checkStatus(options.status)) {
								// 如果请求合法，且数据返回正常，则使用 getResponse 获取解析的原始数据。
								error = 0;
								options.errorMessage = null;
								try {
									options.response = options.getResponse(xhr);
								} catch (getResponseError) {
									error = 2;
									options.errorMessage = getResponseError.message;
								}
							} else {
								error = 1;
								options.errorMessage = options.statusText;
							}

						}

						// 保存 error 。
						options.errorCode = error;

						try {

							if (error) {
								if (options.error)
									options.error.call(options.target, options.errorMessage, xhr);

							} else {
								if (options.success)
									options.success.call(options.target, options.response, xhr);
							}

							if (options.complete)
								options.complete.call(options.target, options, xhr);

						} finally {

							// 删除 XHR 以确保 onStateChange 不重复执行。
							options.xhr = xhr = null;

							// 删除 options 。
							delete options.target.options;

							// 确保 AJAX 的等待项正常继续。
							options.target.progress();

						}
					}
				} catch (firefoxAccessError) {

					// 赋予新的空对象，避免再次访问 XHR 。
					options.xhr = {readyState: 4};
					options.exception(firefoxAccessError);
				}
			};

			// 预处理数据。
			if (options.start && options.start.call(options.target, options, xhr) === false)
				return callback(0, -3);

			try {

				if (options.username)
					xhr.open(options.type, options.url, options.async, options.username, options.password);
				else
					xhr.open(options.type, options.url, options.async);

			} catch (ieOpenError) {

				//  出现错误地址时  ie 在此产生异常
				return options.exception(ieOpenError);
			}

			// 设置文件头。
			// 如果跨域了， 火狐会报错。
			for (key in headers)
				try {
					xhr.setRequestHeader(key, headers[key]);
				} catch (firefoxSetHeaderError) {
				}

			// 监视 提交是否完成。
			xhr.onreadystatechange = callback;

			try {
				xhr.send(options.data);
			} catch (sendError) {
				return options.exception(sendError);
			}

			// 同步时，火狐不会自动调用 onreadystatechange
			if (!options.async) {
				callback();
			} else if (xhr.readyState === 4) {
				// IE6/7： 如果存在缓存，需要手动执行回调函数。
				setTimeout(callback, 0);
			} else if (options.timeouts > 0) {
				setTimeout(function() {
					callback('Timeout', -2);
				}, options.timeouts);
			}

			// 发送完成。

		}

	};

	Object.map("get post", function(type) {

		Ajax[type] = function(url, data, onsuccess, dataType) {
			if (typeof data == 'function') {
				dataType = onsuccess;
				onsuccess = data;
				data = null;
			}

			return Ajax.send({
				url: url,
				data: data,
				success: onsuccess,
				type: type,
				dataType: dataType
			});
		};

	});

	return Ajax;

})();
/*********************************************************
 * System.Ajax.Script
 *********************************************************/
/** * AJAX 传输 JavaScript 。 * @author xuld */Ajax.accepts.script = "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript";Ajax.transports.script = {
	getResponse: function(xhr) {
		var code = Ajax.XHR.getResponse(xhr);
		window.execScript(code);
		return code;
	},	send: function(options) {
		if (!options.crossDomain) {
			return Ajax.XHR.send.call(this, options);		}		options.type = "GET";				// cache		if (options.cache !== false) {
			options.cache = false;						options.url = Ajax.addCachePostfix(options.url);		}		// data		if (options.data) {			options.url = Ajax.concatUrl(options.url, options.data);			options.data = null;		}		var script = options.script = document.createElement('SCRIPT'),
			t,
			callback = options.callback = function(errorMessage, error) {
				var script = options.script;
				if (script && (error || !script.readyState || !/in/.test(script.readyState))) {

					// 删除 callback 避免再次执行。
					options.callback = Function.empty;

					// 删除全部绑定的函数。
					script.onerror = script.onload = script.onreadystatechange = null;

					// 删除当前脚本。
					script.parentNode.removeChild(script);

					try {												if(error < 0) {							options.status = error;							options.statusText = "";						} else {							options.status = 200;							options.statusText = "OK";						}

						if (error) {														options.errorCode = error;							options.errorMessage = errorMessage;							
							if (options.error)
								options.error.call(options.target, options.errorMessage, script);
						} else {														options.errorCode = 0;							options.errorMessage = null;							
							if (options.success)
								options.success.call(options.target, options.response, script);
						}

						if (options.complete)
							options.complete.call(options.target, options, script);

					} finally {

						options.script = script = null;

						delete options.target.options;

						options.target.progress();
					}
				}
			};

		script.src = options.url;
		script.type = "text/javascript";
		script.async = "async";
		if (options.charset)
			script.charset = options.charset;
		
		// 预处理数据。
		if (options.start && options.start.call(options.target, options, xhr) === false)
			return callback(0, -3);

		script.onload = script.onreadystatechange = callback;

		script.onerror = function(e) {
			callback('Network Error', 2);
		};		
		if (options.timeouts > 0) {
			setTimeout(function() {
				callback('Timeout', -2);
			}, options.timeouts);
		}

		t = document.getElementsByTagName("SCRIPT")[0];
		t.parentNode.insertBefore(script, t);	}};Ajax.script = function(url, onsuccess) {
	return Ajax.send({
		url: url,		dataType: 'script',		success: onsuccess	});};
/*********************************************************
 * System.Ajax.JSONP
 *********************************************************/
/**
 * AJAX 处理JSON-P数据。
 * @author xuld
 */

Ajax.transports.jsonp = {

	jsonp: 'callback',

	getResponse: function(xhr) {
		window.execScript(Ajax.XHR.getResponse(xhr));
		return this.response;
	},

	send: function(options) {

		if (options.jsonp === undefined) {
			options.jsonp = this.jsonp;
		}

		// callback=?
		var jsonpCallback = options.jsonpCallback || (options.jsonpCallback = 'jsonp' + Date.now() + JPlus.id++);

		// callback=jsonp123
		if (options.jsonp) {
			if (options.url.indexOf(options.jsonp + '=?') >= 0) {
				options.url = options.url.replace(options.jsonp + '=?', options.jsonp + '=' + jsonpCallback);
			} else {
				options.url = Ajax.concatUrl(options.url, options.jsonp + "=" + jsonpCallback);
			}
		}

		var oldMethod = window[jsonpCallback];

		window[jsonpCallback] = function(data) {

			// 回复初始的 jsonpCallback 函数。
			window[jsonpCallback] = oldMethod;

			// 保存 response 数据。
			options.response = data;

			// 通知 onStateChange 已完成请求。
			options.callback();
		};

		// 最后使用 Script 协议发送。
		Ajax.transports.script.send.call(this, options);
	}

};Ajax.jsonp = function(url, data, onsuccess) {
	if (typeof data === 'function') {
		onsuccess = data;
		data = null;
	}

	return Ajax.send({
		url: url,		dataType: 'jsonp',		data: data,		success: onsuccess
	});
};
/*********************************************************
 * System.Ajax.Submit
 *********************************************************/


/**
 * 返回一个表单的参数表示形式。
 * @param {HTMLFormElement} formElem 表单元素。
 * @return {String} 参数形式。
 */
Ajax.paramForm = function(formElem) {
	formElem = Dom.getNode(formElem);
	assert(formElem && formElem.tagName == "FORM", "HTMLFormElement.param(formElem): 参数 {formElem} 不是合法的 表单 元素", formElem);
	var s = [], input, e = encodeURIComponent, value, name;
	for (var i = 0, len = formElem.length; i < len; i++) {
		input = formElem[i];
		
		// 如果存在名字。
		if (!input.disabled && (name = input.name)) {
		
			// 增加多行列表。
			if (input.type == "select-multiple") {
				
				// 多行列表  selectedIndex 返回第一个被选中的索引。
				// 遍历列表，如果 selected 是 true， 表示选中。
			
				var j = input.selectedIndex;
				if (j != -1) {
					input = input.options;
					for (var l = input.length; j < l; j++) {
						if (input[j].selected) {
							s.push(e(name) + "=" + e(input[j].value));
						}
					}
				}
				
			} else if (!/checkbox|radio/.test(input.type) || input.checked !== false){
				s.push(e(name) + "=" + e(input.value));
			}
		}
	}
	
	return s.join('&');

};

/**
 * 通过 ajax 提交一个表单。
 * @param {HTMLFormElement} form 表单元素。
 * @param {String/Object} data 数据。
 * @param {Function} [onsuccess] 成功回调函数。
 * @param {Function} [onerror] 错误回调函数。
 * @param {Object} timeouts=-1 超时时间， -1 表示不限。
 * @param {Function} [ontimeout] 超时回调函数。
 */
Ajax.submit = function(form, onsuccess, onerror, timeouts) {
	form = Dom.getNode(form);
	return Ajax.send({
		type: form.method,
		url: form.action,
		data: Ajax.paramForm(form),
		success: onsuccess,
		error: onerror,
		timeouts: timeouts === undefined ? -1 : timeouts
	});
};

/*********************************************************
 * Controls.Core.Base
 *********************************************************/
/**
 * @author  xuld
 */




/**
 * 所有控件基类。
 * @class Control
 * @abstract
 * 控件的周期：
 * constructor - 创建控件对应的 Javascript 类。不建议重写构造函数，除非你知道你在做什么。
 * create - 创建本身的 dom 节点。 可重写 - 默认使用 this.tpl 创建。
 * init - 初始化控件本身。 可重写 - 默认为无操作。
 * attach - 渲染控件到文档。不建议重写，如果你希望额外操作渲染事件，则重写。
 * detach - 删除控件。不建议重写，如果一个控件用到多个 dom 内容需重写。
 */
var Control = Dom.extend({

	/**
	 * 存储当前控件的默认配置。
	 * @getter {Object} options
	 * @protected
	 * @virtual
	 */

	/**
	 * 存储当前控件的默认模板字符串。
	 * @getter {String} tpl
	 * @protected
	 * @virtual
	 */

	/**
	 * 当被子类重写时，生成当前控件。
	 * @param {Object} options 选项。
	 * @protected
	 * @virtual
	 */
	create: function () {

		assert(this.tpl, "Control#create: 无法获取或创建当前控件所关联的 DOM 节点。请为控件定义 tpl 属性或重写 create 函数。");
		//assert(this.tpl, "Control.prototype.create(): 当前类不存在 tpl 属性。Control.prototype.create 会调用 tpl 属性，根据这个属性中的 HTML 代码动态地生成节点并返回。子类必须定义 tpl 属性或重写 Control.prototype.create 方法返回节点。");

		// 转为对 tpl解析。
		return Dom.parseNode(this.tpl.replace(/x-control/g, 'x-' + this.xtype));
	},

	/**
	 * 当被子类重写时，渲染控件。
	 * @method
	 * @param {Object} options 配置。
	 * @protected virtual
	 */
	init: Function.empty,

	/**
	 * 初始化一个新的控件。
	 * @param {String/Element/Control/Object} [options] 对象的 id 或对象或各个配置。
	 */
	constructor: function (options) {

		// 这是所有控件共用的构造函数。
		var me = this,

			// 临时的配置对象。
			opt = {},

			// 当前实际的节点。
			node;

		// 如果存在配置。
		if (options) {

			// 如果 options 是纯配置。
			if (options.constructor === Object) {
				Object.extend(opt, options);
				node = Dom.getNode(opt.dom);
				delete opt.dom;
			} else {
				node = Dom.getNode(options);
			}

		}

		// 如果 dom 的确存在，使用已存在的， 否则使用 create(opt)生成节点。
		me.node = node || me.create(opt);

		assert.isNode(me.node, "Dom#constructor(options): Dom 对象的 {node} 为空。");

		// 调用 init 初始化控件。
		me.init(opt);

		//// 如果指定的节点已经在 DOM 树上，且重写了 attach 方法，则调用之。
		//if (me.node.parentNode && me.attach !== Control.prototype.attach) {
		//	me.attach(me.node.parentNode, me.node.nextSibling);
		//}

		// 复制各个选项。
		me.set(opt);
	},

	/**
	 * xtype 。
	 * @virtual
	 */
	xtype: "control"

});
/*********************************************************
 * Controls.Display.Bubble
 *********************************************************/
/** * @author  */
/*********************************************************
 * Controls.Display.Icon
 *********************************************************/
/** * @author  */
/*********************************************************
 * Controls.Layout.Splitter
 *********************************************************/
/** * @author  */
/*********************************************************
 * Controls.Core.ICollapsable
 *********************************************************/
/** * @author  xuld *//** * 表示一个可折叠的控件。 * @interface ICollapsable */var ICollapsable = {		/**	 * 获取目前是否折叠。	 * @virtual	 * @return {Boolean} 获取一个值，该值指示当前面板是否折叠。	 */	isCollapsed: function() {		var container = this.container ? this.container() : this;		return !container || Dom.isHidden(container.node);	},		onCollapsing: function(duration){		return this.trigger('collapsing', duration);	},		onExpanding: function(duration){		return this.trigger('expanding', duration);	},		onCollapse: function(){		this.trigger('collapse');	},		onExpand: function(){		this.trigger('expand');	},	/**	 * 折叠面板。	 * @param {Number} duration 折叠效果使用的时间。	 */	collapse: function(duration){		var me = this, 			container,			callback;		if(me.onCollapsing(duration) !== false && (container = me.container ? me.container() : me)) {			callback = function(){				me.addClass('x-' + me.xtype + '-collapsed');				me.onCollapse();			};						// 如果不加参数，使用同步方式执行。			if(duration === undefined){				container.hide();				callback();			} else {				container.hide('height', duration, callback, 'ignore');			}		}		return me;	},	/**	 * 展开面板。	 * @param {Number} duration 折叠效果使用的时间。	 */	expand: function(duration){		if(this.onExpanding(duration) !== false) {			var container = this.container ? this.container() : this;			if(container) {				this.removeClass('x-' + this.xtype + '-collapsed');				if(duration === undefined){					container.show();					this.onExpand();				} else {					container.show('height', duration, this.onExpand.bind(this), 'ignore');				}			}		}		return this;	},		/**	 * 切换面板的折叠。	 * @param {Number} duration 折叠效果使用的时间。	 */	toggleCollapse: function(duration) {		return this[this.isCollapsed() ? 'expand' : 'collapse'](duration);	}	};
/*********************************************************
 * Controls.Core.ScrollableControl
 *********************************************************/
/**
 * @author  xuld
 */

/**
 * 表示一个含有滚动区域的控件。
 * @class ScrollableControl
 * @extends Control
 * @abstract
 * @see ListControl
 * @see ContainerControl
 * <p>
 * {@link ScrollableControl} 提供了完整的子控件管理功能。
 * </p>
 * 
 * <p>
 * 通过 {@link #add} 
 * 来增加一个子控件，该方法间接调用 {@link #doAdd}，以
 * 让 {@link ScrollableControl} 有能力自定义组件的添加方式。
 * </p>
 * 
 * <p>
 * 如果需要创建一个含子控件的控件，则可以 继承 {@link ScrollableControl} 类创建。
 * 子类需要重写 {@link #onAdding} 方法用于对子控件初始化。
 * 重写 {@link #doAdd}实现子控件的添加方式（默认使用 appendChild 到跟节点）。
 * 重写 {@link #onAdded}实现子控件的添加后的回调函数。
 * </p>
 * 
 * <p>
 * 最典型的 {@link ScrollableControl} 的子类为 {@link ListControl} 和 {@link ContainerControl} 。
 * </p>
 */
var ScrollableControl = Control.extend({
	
	/**
	 * 获取某一个容器节点封装的子控件。
	 * @param {Control} container 要获取的容器控件。
	 * @return {Control} 指定容器控件包装的真实子控件。如果不存在相应的子控件，则返回自身。
	 * @protected
	 */
	itemOf: function(child) {
		var data = child.dataField();
		return data.namedItem || (data.namedItem = child);
	},

	// /**
	 // * 获取用于包装指定子控件的容器控件。
	 // * @param {Control} item 要获取的子控件。
	 // * @return {Control} 用于包装指定子控件的容器控件。
	 // * @protected virtual
	 // * @see #itemOf
	 // */
	// childOf: function(childControl) {
		// return childControl;
	// },
// 
	
	/**
	 * 当被子类重写时，用于重写添加子控件前的操作。
	 * @param {Control} childControl 新添加的子控件。
	 * @return {Control} 实际需要添加的子控件。
	 * @protected virtual
	 */
	initChild: function(childControl){
		return childControl;
	},
	
	/**
 	 * 当被子类重写时，用于重写删除子控件前的操作。
	 * @param {Control} childControl 要删除的子控件。
	 * @return {Control} 实际删除的子控件。
	 * @protected virtual
	 */
	uninitChild: function(childControl){
		return childControl;
	},

	/**
	 * 当被子类重写时，用于重写添加子控件的具体逻辑实现。
	 * @param {Control} childControl 新添加的子控件。
	 * @param {Control} refControl=null 用于表面添加的位置的子控件。指定控件会被插入到此控件之前。如果值为 null ，则添加到末尾。
	 * @protected virtual
	 */
	doAdd: Dom.prototype.insertBefore,
	
	/**
 	 * 当被子类重写时，用于重写删除子控件的具体逻辑实现。
	 * @param {Control} childControl 要删除的子控件。
	 * @protected virtual
	 */
	doRemove: Dom.prototype.removeChild,

	/**
	 * 当新控件被添加时执行。
	 * @param {Control} childControl 新添加的子控件。
	 * @protected virtual
	 */
	onAdd: function(item){

		/**
		 * 当子控件被添加时触发。
		 * @event add
		 * @param {Control} childControl 被添加的子控件。
		 */
		this.trigger("add", item);
	},
	
	/**
 	 * 当新控件被移除时执行。
	 * @param {Control} childControl 要删除的子控件。
	 * @protected virtual
	 */
	onRemove: function(item){
		
		/**
		 * 当子控件被添加时触发。
		 * @event remove
		 * @param {Control} childControl 被删除的子控件。
		 */
		this.trigger("remove", item);
	},
	
	/**
	 * 当新控件被添加时执行。
	 * @param {Control} childControl 新添加的元素。
	 * @param {Control} refControl 元素被添加的位置。
	 * @protected override
	 */
	insertBefore: function(childControl, refControl) {
		
		// 初始化一个项。
		if(childControl = this.initChild(childControl)){
			
			var item = this.itemOf(childControl);
			
			// 如果 childControl 已经属于某 Control 。
			if(item.parentControl){
				item.parentControl.removeChild(item);
			}
			
			// 底层的插入操作。
			this.doAdd(childControl, refControl);
			
			// 此  item 属于此容器管理。
			item.parentControl = this;
			
			// 通知当前类节点已添加。
			this.onAdd(item);
			
			// 返回新创建的子控件。
			return item;
			
		}
		
		return null;
	},

	/**
	 * 当新控件被移除时执行。
	 * @param {Object} childControl 新添加的元素。
	 * @protected override
	 */
	removeChild: function(childControl) {
		
		// 初始化一个项。
		if(childControl = this.uninitChild(childControl)){
			
			var item = this.itemOf(childControl);
			
			// 删除容器的关联。
			delete childControl.dataField().namedItem;
				
			// 实际的删除操作。
			this.doRemove(childControl);
			
			// 通知当前类节点已删除。
			this.onRemove(item);
		
			item.parentControl = null;
				
			// 返回被删除的子控件。
			return item;
			
		}
		
		return null;
	},

	/**
	 * 添加一个子节点到当前控件末尾。
	 * @param {Control} ... 要添加的子节点。
	 * @return {Control/this} 返回新添加的子控件。
	 */
	add: function() {
		var args = arguments;
		if (args.length === 1) {
			return this.append(args[0]);
		}

		Object.each(args, this.append, this);
		return this;
	},
	
	clear: Dom.prototype.empty,
	
	/**
	 * 获取指定索引的项。
	 */
	item: function(index) {
		var child = this.child(index);
		return child ? this.itemOf(child) : child;
	},
	
	/**
	 * 对集合的每一项执行函数。
	 */
	each: function(fn, bind) {
		for (var c = this.first(), i = 0 ; c; c = c.next()) {
			if (fn.call(bind, this.itemOf(c), i++, this) === false) {
				return false;
			}
		}

		return true;
	},

	/**
	 * 获取当前集合中子元素的项。
	 */
	count: function(all) {
		for (var c = this.first(all), i = 0 ; c; c = c.next(all), i++);
		return i;
	},

	/**
	 * 获取某一项在列表中的位置。
	 */
	indexOf: function(item) {
		for (var c = this.first(), i = 0 ; c; c = c.next(), i++) {
			if (c.equals(item)) {
				return i;
			}
		}
		return -1;
	},

	/**
	 * 在指定位置插入一个子节点。
	 * @param {Integer} index 添加的子控件的索引。
	 * @param {Control} childControl 要添加的子节点。
	 * @return {Control} 返回新添加的子控件。
	 */
	addAt: function(index, childControl) {
		return this.insertBefore(Dom.parse(childControl), this.child(index));
	},

	/**
	 * 删除指定索引的子节点。
	 * @param {Integer} index 删除的子控件的索引。
	 * @return {Control} 返回删除的子控件。如果删除失败（如索引超出范围）则返回 null 。
	 */
	removeAt: function(index) {
		var child = this.child(index);
		return child ? this.removeChild(child) : null;
	}

});
/*********************************************************
 * Controls.Core.ListControl
 *********************************************************/
/**
 * @author  xuld
 */


/**
 * 表示所有管理多个有序列的子控件的控件基类。
 * @class ListControl
 * @extends ScrollableControl
 * ListControl 封装了使用  &lt;ul&gt; 创建列表控件一系列方法。
 */
var ListControl = ScrollableControl.extend({
	
	/**
	 * 模板。
	 */
	tpl: '<ul class="x-control"/>',
	/**	 * 获取用于包装指定子控件的容器控件。	 * @param {Control} item 要获取的子控件。	 * @return {Control} 用于包装指定子控件的容器控件。	 * @protected override	 * @see #itemOf
	 */
	childOf: function(childControl) {
		return childControl && childControl.node.tagName !== 'LI' ? childControl.parent() : childControl;
	},
	
	/**
	 * 当被子类重写时，用于初始化新添加的节点。
	 * @param {Control} childControl 正在添加的节点。
	 * @return {Control} 需要真正添加的子控件。
	 * @protected override
	 */
	initChild: function(childControl){
		
		// <li> 的 class 属性。
		var clazz = 'x-' + this.xtype + '-item', li;

		// 如果 childControl 不是 <li>, 则包装一个 <li> 标签。
		if (childControl.node.tagName !== 'LI') {

			// 创建 <li>
			li = Dom.create('LI', clazz);
			
			// 复制节点。
			li.append(childControl);
			
			// 赋值。
			childControl = li;
		} else {
			
			// 自动加上 clazz 。
			childControl.addClass(clazz);
		}
		
		return childControl;
	},
	
	/**
 	 * 当新控件被移除时执行。
	 * @param {Control} childControl 新添加的元素。
	 * @return {Control} 需要真正删除的子控件。
	 * @protected override
	 */
	uninitChild: function(childControl) {
		
		// 如果 childControl 不是 <li>, 则退出 <li> 的包装。
		if (childControl.node.parentNode !== this.node) {
			
			// 获取包装的 <li>
			var li = childControl.parent();
			
			// 不存在 li 。
			if(!li) {
				return null;
			}
			
			// 删除节点。
			li.removeChild(childControl);
			
			// 赋值。
			childControl = li;
		}
		
		// 返回实际需要删除的组件。
		return childControl;

	},
	
	/**
	 * 当被子类重写时，实现初始化 DOM 中已经存在的项。 
	 */
	initItems: function(){
		this.query('>li').addClass('x-' + this.xtype + '-item');
	},
	
	init: function() {
		this.initItems();
	},
	
	// /**
	 // * 当当前控件在屏幕中显示不下时，由 align 函数触发执行此函数。
	 // * @param {String} xOry 值为 "x" 或 "y"。
	 // * @param {Integer} value 设置的最大值。
	 // * @param {Boolean} isOverflowing 如果值为 true，表示发生了此事件，否则表示恢复此状态。
	 // */
	// onOverflow: function(xOry, value, isOverflowing){
		// var data = this['overflow' + xOry];
		// if(isOverflowing){
			// if(!data){
				// this['overflow' + xOry] = this[xOry === 'x' ? 'getWidth' : 'getHeight']();
			// }
			// this[xOry === 'x' ? 'setWidth' : 'setHeight'](value);
		// } else if(data !== undefined){
			// this[xOry === 'x' ? 'setWidth' : 'setHeight'](data);
			// delete this['overflow' + xOry];
		// }
	// },
	
	indexOf: function(item){
		return ScrollableControl.prototype.indexOf.call(this, this.childOf(item));
	},

	getItemByText: function(value){
		for (var c = this.first(), child ; c; c = c.next()) {
			if (c.getText() === value) {
				child = c;
				break;
			}
		}
		
		return child ? this.itemOf(child) : null;
	},
	
	set: function(items){
		if(Object.isArray(items)){
			this.clear();
			this.add.apply(this, items);
			return this;
		}
		
		return Dom.prototype.set.apply(this, arguments);
	},

	/**
	 * 设置某个事件发生之后，执行某个函数.
	 * @param {String} eventName 事件名。
	 * @param {String} funcName 执行的函数名。
	 */
	itemOn: function(eventName, fn, bind){
		var me = this;
		return this.on(eventName, function(e){
			for(var c = me.node.firstChild, target = e.target; c; c = c.nextSibling){
				if(c === target || Dom.has(c, target)){
					return fn.call(bind, me.itemOf(new Dom(c)), e);
				}
			}
		}, bind);
	}
	
});


ListControl.aliasMethods = function(controlClass, targetProperty, removeChildProperty){
	controlClass.defineMethods(targetProperty, 'add addAt removeAt item indexOf each count');
	
	removeChildProperty = removeChildProperty || targetProperty;
	controlClass.prototype.removeChild = function(childControl){
		childControl.detach(this.node);
		
		var child = this[removeChildProperty];
		if(child)
			childControl.detach(child.node);
	};
	
};
/*********************************************************
 * Controls.Core.ContentControl
 *********************************************************/
/** * @fileOverview 表示一个包含文本内容的控件。 * @author xuld *//** * 表示一个有内置呈现的控件。 * @abstract * @class ContentControl * @extends Control *  * <p> * 这个控件同时允许在子控件上显示一个图标。 * </p> *  * <p> * ContentControl 的外元素是一个根据内容自动改变大小的元素。它自身没有设置大小，全部的大小依赖子元素而自动决定。 * 因此，外元素必须满足下列条件的任何一个: *  <ul> * 		<li>外元素的 position 是 absolute<li> * 		<li>外元素的 float 是 left或 right <li> * 		<li>外元素的 display 是  inline-block (在 IE6 下，使用 inline + zoom模拟) <li> *  </ul> * </p> */var ContentControl = Control.extend({		/**	 * 获取当前显示的图标。	 * @getter {Control} icon	 * @proected	 */		icon: function(){		return this.find('.x-icon');	},		/**	 * 获取当前控件中显示文字的主 DOM 对象。	 */	content: function(){		return this.last(true) || this;	},		/**	 * 当被子类改写时，实现创建添加和返回一个图标节点。	 * @protected	 * @virtual	 */	createIcon: function(){		return this.content().before(Dom.create('i', 'x-icon'));	},		getIcon: function(){		var icon = this.icon();		return icon ? (/x-icon-(.*?)\b/.test(icon.node.className) || [0, ""])[1] : null;	},		/**	 * 设置图标。	 * @param {String} icon 图标。	 * @return {Panel} this	 */	setIcon: function(icon) {				if(icon != null){			(this.icon() || this.createIcon()).node.className = "x-icon x-icon-" + icon;		} else if(icon = this.icon()) {			icon.remove();		}				return this;	},		setText: function(value){		Dom.prototype.setText.call(this.content(), value);		return this;	},		getText: function(){		return Dom.getText(this.content().node);	}	});
/*********************************************************
 * Controls.Core.TreeControl
 *********************************************************/
/** * @author  xuld *//** * 表示一个树结构的子组件。 */var TreeControl = ListControl.extend({		/**	 * 将已有的 DOM 节点转为 {@link TreeControl.Item} 对象。	 * @param {Dom} childControl 要转换的 DOM 对象。	 * @param {Dom} parent=null DOM 对象的父节点。	 * @protected virtual	 */	createTreeItem: function(childControl, parent) {		return new TreeControl.Item(childControl);	},		/**	 * 初始化一个 <li> 对象。	 * @private	 */	initItemContainer: function(li){			// 获取第一个子节点。		var subControl = li.addClass('x-' + this.xtype + '-item').find('>ul'),			item = (subControl ? (subControl.prev() || subControl.prev(true)) : (li.first() || li.first(true))) || Dom.parse('');				// 根据节点创建一个 MenuItem 对象。		item = this.createTreeItem(item, li);		// 如果存在子菜单，设置子菜单。		if (subControl) {			item.setSubControl(subControl);		}				// 保存 li -> childControl 的关联。		li.dataField().namedItem = item;				return item;	},		/**	 * 处理一个子控件。	 * @protected override	 */	initChild: function(childControl){				// 如果是添加 <li> 标签，则直接返回。		// .add('<li></li>')		if (childControl.node.tagName === 'LI') {						this.initItemContainer(childControl);			// .add(new MenuItem())		} else {						// 转为 MenuItem 对象。			// .add(文本或节点)			var item = this.createTreeItem(childControl);						// 创建一个新的容器节点。			childControl = Dom.create('LI', 'x-' + this.xtype + '-item');						// 复制节点。			childControl.append(item);							// 保存 li -> childControl 的关联。			childControl.dataField().namedItem = item;		}		return childControl;	},		/**	 * 初始化 DOM 中已经存在的项。 	 * @protected override	 */	initItems: function(){		for(var c = this.first(); c; c = c.next()){			this.initItemContainer(c).parentControl = this;		}	}});/** * 表示 TreeControl 中的一项。 */TreeControl.Item = ContentControl.extend({		tpl: '<a class="x-control">&nbsp;</a>',		/**	 * 获取当前菜单管理的子菜单。	 * @type {TreeControl}	 */	subControl: null,		/**	 * 当被子类重写时，用于创建子树。	 * @param {TreeControl} treeControl 要初始化的子树。	 * @return {TreeControl} 新的 {@link TreeControl} 对象。	 * @protected virtual	 */	createSubControl: function(control){		return new TreeControl(control);	},		/**	 * 当被子类重写时，用于初始化子树。	 * @param {TreeControl} treeControl 要初始化的子树。	 * @protected virtual	 */	initSubControl: Function.empty,		/**	 * 当被子类重写时，用于删除初始化子树。	 * @param {TreeControl} treeControl 要删除初始化的子树。	 * @protected virtual	 */	uninitSubControl: Function.empty,		/**	 * 获取当前项的子树控件。 	 */	getSubControl: function(){		if(!this.subControl){			this.setSubControl(this.createSubControl());		}		return this.subControl;	},		/**	 * 设置当前项的子树控件。	 */	setSubControl: function(treeControl) {		if (treeControl) {						if(!(treeControl instanceof TreeControl)){				treeControl = this.createSubControl(treeControl);				}						// 如果子控件不在 DOM 树中，插入到当前节点后。			if (!treeControl.parent('body') && this.node.parentNode) {				this.node.parentNode.appendChild(treeControl.node);			}					this.subControl = treeControl;			this.initSubControl(treeControl);			treeControl.owner = this;		} else if(this.subControl){			this.subControl.remove();			this.uninitSubControl(this.subControl);			delete this.subControl.owner;			this.subControl = null;		}		return this;	},	attach: function(parentNode, refNode) {				// 如果有关联的容器，先添加容器。		var subControl = this.subControl;		if (subControl && !subControl.parent('body')) {			parentNode.insertBefore(subControl.node, refNode);		}		parentNode.insertBefore(this.node, refNode);	},	detach: function(parentNode) {				if(this.node.parentNode === parentNode) {			parentNode.removeChild(this.node);		}				// 如果有关联的容器，删除容器。		var subControl = this.subControl;		if (subControl) {			parentNode.removeChild(subControl.node);		}	},		setAttr: function(name, value) {		if(/^(selected|checked|disabled)$/i.test(name)){			return this[name.toLowerCase()](value);		}		return Dom.prototype.setAttr.call(this, name, value);	},	/**	 * 切换显示鼠标是否移到当前项。	 */	hovering: function(value){		return this.toggleClass('x-' + this.xtype + '-hover', value);	}});ListControl.aliasMethods(TreeControl.Item, 'getSubControl()', 'subControl');Object.map("selected checked disabled", function(funcName) {	TreeControl.Item.prototype[funcName] = function(value) {		this.toggleClass('x-' + this.xtype + '-' + funcName, value);		return Dom.prototype.setAttr.call(this, funcName, value);	};});
/*********************************************************
 * Controls.DataView.TreeView
 *********************************************************/
/** * @author  *//** * 表示是 {@link TreeView} 中的一个节点。 */var TreeNode = TreeControl.Item.extend(ICollapsable).implement({		xtype: 'treenode',		tpl: '<a class="x-control"><span></span></a>',		/**	 * 当前树的深度。	 * @type {Integer}	 */	depth: 0,		/**	 * 获取当前用于折叠的容器对象。	 * @return {Control} 折叠的容器对象。	 * @protected override	 */	container: function(){		return this.subControl;	},		/**	 * 获取当前的文字对象。	 * @return {Control} 文字对象。	 * @protected override	 */	content: function(){		return this.last('span');	},		/**	 * 当被子类改写时，实现创建添加和返回一个图标节点。	 * @protected	 * @virtual	 */	createIcon: function(){		return this.content().prepend(Dom.create('i', 'x-icon'));	},		/**	 * 当被子类重写时，用于创建子树。	 * @param {TreeControl} treeControl 要初始化的子树。	 * @return {TreeControl} 新的 {@link TreeControl} 对象。	 * @protected override	 */	createSubControl: function(control){		return new TreeView(control).removeClass('x-treeview').addClass('x-treeview-subtree');	},		/**	 * 当被子类重写时，用于初始化子树。	 * @param {TreeControl} treeControl 要初始化的子树。	 * @protected override	 */	initSubControl: function(treeControl){		treeControl.depth = this.depth;	},		// 树节点的控制。		/**	 * 更新一个节点前面指定的占位符的类名。	 * @private	 */	_setSpan: function(depth, className){				this.each(function(node){			var first = node.first(depth).node;			if(first.tagName == 'SPAN')				first.className = className;			node._setSpan(depth, className);		});			},		_markAsLastNode: function(){		this.addClass('x-treenode-last');		this._setSpan(this.depth - 1, 'x-treenode-space x-treenode-none');	},		_clearMarkAsLastNode: function(){		this.removeClass('x-treenode-last');		this._setSpan(this.depth - 1, 'x-treenode-space');	},	/**	 * 获取当前节点的占位 span 。	 * @param {Integer} index 要获取的索引， 最靠近右的索引为 0 。	 * @protected	 */	span: function(index){		return this.content().prev(index);	},		/**	 * 由于子节点的改变刷新本节点和子节点状态。	 * @protected	 */	update: function(){				// 更新图标。		this.updateNodeType();				var last = this.subControl.item(-1), lastNode;				// 更新 lastNode		if(last){			lastNode = this._lastNode;			if (!lastNode || lastNode.node !== last.node) {				last._markAsLastNode();				this._lastNode = last;				if (lastNode) lastNode._clearMarkAsLastNode();			}		}			},		/**	 * 根据当前的节点情况更新当前节点的图标。	 * @protected	 */	updateNodeType: function(){		this.setNodeType(this.subControl && this.subControl.first() ? this.isCollapsed() ? 'plus' : 'minus' : 'normal');	},		/**	 * 获取一个值，该值指示当前节点是否为最后一个节点。	 * @return {Boolean}	 * @protected	 */	isLastNode: function(){		return this.parentNode &&  this.parentNode._lastNode === this;	},		onDblClick: function(e){		this.toggleCollapse(-0.5);		e.stop();	},		init: function(options){		this.unselectable();		this.on('dblclick', this.onDblClick, this);		// 绑定节点和控件，方便发生事件后，根据事件源得到控件。		this.dataField().control = this;	},		/**	 * 获取当前节点的图标。	 */	getNodeType: function(){		var span = this.span(0);		return span ? (/x-treenode-(.+)/.exec(span.node.className.replace(/\bx-treenode-space\b/, '')) || [0, "line"])[1] : null;	},		/**	 * 设置当前节点的图标。	 * @param {String} type 类型。肯能的值如： 'normal' 'plus' 'minus' 'none' 'loading' 'line'。	 * @return this	 */	setNodeType: function(type){		var span = this.span(0);		if(span) {			span.node.className = 'x-treenode-space x-treenode-' + type;		}		return this;	},		onCollapse: function(){		this.updateNodeType();	},		onExpanding: function(){		ICollapsable.onExpanding.call(this);		this.setNodeType(this.subControl && this.subControl.first() ? 'minus' : 'normal');		},		onExpand: function(){		if(this.subControl) {			this.subControl.node.style.height = 'auto';		}				ICollapsable.onExpand.call(this);	},		/**	 * 展开当前节点及子节点。	 * @param {Integer} duration 折叠动画使用的毫米数。	 * @param {Integer} maxDepth=0 最大折叠的深度。默认为 -1 表示全部折叠。	 * @return this	 */	expandAll: function(duration, maxDepth){		if (this.subControl && !(maxDepth === 0)) {			this.expand(duration);			this.invoke('expandAll', [duration, --maxDepth]);		}		return this;	},		/**	 * 折叠当前节点及子节点。	 * @param {Integer} duration 折叠动画使用的毫米数。	 * @param {Integer} maxDepth=0 最大折叠的深度。默认为 -1 表示全部折叠。	 * @return this	 */	collapseAll: function(duration, maxDepth){		if (this.subControl && !(maxDepth === 0)) {			this.invoke('collapseAll', [duration, --maxDepth]);			this.collapse(duration);		}		return this;	},		/**	 * 展开当前节点，但折叠指定深度以后的节点。	 */	collapseTo: function(depth, duration){		duration = duration === undefined ? 0 : duration;		depth = depth === undefined ? 1 : depth;				if(depth > 0){			this.expand(duration);		} else {			this.collapse(duration);		}				this.invoke('collapseTo', [--depth, duration]);	},		invoke: function(funcName, args){		if(this.subControl){			this.subControl.invoke(funcName, args);		}		return this;	},	/**	 * 获取当前节点的深度。	 * @return {Integer} 返回节点深度。	 */	getDepth: function(){		return this.depth;	},	/**	 * 设置当前节点的深度。	 * @param {Integer} value 要设置的深度。	 * @return this	 */	setDepth: function(value){				assert(value >= 0, "TreeNode#setDepth(value): {value} 必须是不小于 0 的整数", value);				var me = this,			currentDepth = me.depth, 			span,			current = me;				// 删除多余的占位符。				while(currentDepth > value){			me.removeChild(elem.first());			currentDepth--;		}			// 补上不够的占位符。				while(currentDepth < value){			me.prepend(Dom.createNode('span', 'x-treenode-space'));			currentDepth++;		}				// 更新深度。				me.depth = value;				// 绑定最后一个 span 的点击事件。				span = this.span(0);				if(currentDepth) {			span.un('click', this.onDblClick).on('click', this.onDblClick, this);		}				// 更新 spans 的 class 状态。				while((current = current.parentNode) && (span = span.prev())){			span.node.className = current.isLastNode() ? 'x-treenode-space x-treenode-none' : 'x-treenode-space';		}				me.updateNodeType();				// 对子节点设置深度+1		me.invoke('setDepth', [++value]);	},		getTreeView: function(){		var n = this;		while(n)			n = n.parentNode;				return n ? n.parentControl : null;	},		ensureVisible: function(duration){		var n = this;		while(n = n.parentNode) {			n.expand(duration);		}		//   this.scrollIntoView();				return this;	}});var TreeView = TreeControl.extend({		xtype: 'treeview',		depth: 0,		createTreeItem: function(childControl, parent) {				if(!(childControl instanceof TreeNode)){				// 如果是文本。			if (childControl.node.nodeType === 3) {					// 保存原有 childControl 。				var t = childControl;				childControl = new TreeNode;				childControl.content().append(t);								if (parent) {					parent.prepend(childControl);				}			} else {					// 创建对应的 MenuItem 。				childControl = new TreeNode(childControl);			}					}				// 设置子节点的位置。		childControl.setDepth(this.depth + 1);				// 更新当前树的父节点。		if(this.owner){			this.owner.update();			childControl.parentNode = this.owner;		}		return childControl;	},	/**	 * 当用户点击一项时触发。	 */	onNodeClick: function (node) {		return this.trigger('nodeclick', node);	},		/**	 * 获取一个值，该值指示当前节点是否为最后一个节点。	 * @return {Boolean}	 * @protected	 */	isLastNode: function(){		return false;	},		init: function(){		// 根据已有的 DOM 结构初始化菜单。		this.initItems();				this.on('click', this.onClick);	},		invoke: function(funcName, args){		var subTree = this, c, target;		args = args || [];		for(var c = subTree.first(); c; c = c.next()){			target = subTree.itemOf(c);			target[funcName].apply(target, args);		}		return this;	},		collapse: function(duration){		return this.invoke('collapse', [duration]);	},		collapseAll: function(duration){		return this.invoke('collapseAll', [duration]);	},		expand: function(duration){		return this.invoke('expand', [duration]);	},		expandAll: function(duration){		return this.invoke('expandAll', [duration]);	},		collapseTo: function(depth, duration){		return this.invoke('collapseTo', [--depth, duration]);	},		/**	 * 当一个选项被选中时触发。	 */	onSelect: function(node){		return this.trigger('select', node);	},		/**	 * 当选中的项被更新后触发。	 */	onChange: function (old, item){		return this.trigger('change', old);	},		/**	 * 点击时触发。	 */	onClick: function (e) {				var target = e.target;				if(/\bx-treenode-(minus|plus|loading)\b/.test(target.className))			return;				if((target = new Dom(target).closest('.x-treenode')) && (target = target.dataField().control) && !this.clickNode(target)){			e.stop();		}					},		/**	 * 模拟点击一项。	 */	clickNode: function(node){		if(this.onNodeClick(node)){			this.setSelectedNode(node);			return true;		}				return false;	},		setSelectedNode: function(node){				// 先反选当前选择项。		var old = this.getSelectedNode();		if(old)			old.selected(false);			if(this.onSelect(node) !== false){					// 更新选择项。			this.selectedNode = node;						if(node != null){				node.selected(true);			}					}					if(old !== node)			this.onChange(old, node);					return this;	},		getSelectedNode: function(){		return this.selectedNode;	}	});
/*********************************************************
 * System.Dom.Align
 *********************************************************/
/**
 * @author xuld 
 */


/**
 * 为控件提供按控件定位的方法。
 * @interface
 */
Dom.implement((function(){
	
	var aligners = {
			
			xc: function (opt) {
				opt.x = opt.tp.x + (opt.ts.x - opt.s.x) / 2 + opt.ox;
			},
			
			ol: function(opt, r){
				opt.x = opt.tp.x - opt.s.x - opt.ox;
				
				if(r > 0 && opt.x <= opt.dp.x) {
					aligners.or(opt, --r);
				}
			},
			
			or: function(opt, r){
				opt.x = opt.tp.x + opt.ts.x + opt.ox;
				
				if(r > 0 && opt.x + opt.s.x >= opt.dp.x + opt.ds.x) {
					aligners.ol(opt, --r);
				}
			},
			
			il: function (opt, r) {
				opt.x = opt.tp.x + opt.ox;
				
				if(r > 0 && opt.x + opt.s.x >= opt.dp.x + opt.ds.x) {
					aligners.ir(opt, --r);
				}
			},
			
			ir: function (opt, r) {
				opt.x = opt.tp.x + opt.ts.x - opt.s.x - opt.ox;
				
				if(r > 0 && opt.x <= opt.dp.x) {
					aligners.il(opt, --r);
				}
			},
			
			yc: function (opt) {
				opt.y = opt.tp.y + (opt.ts.y - opt.s.y) / 2 + opt.oy;
			},
			
			ot: function(opt, r){
				opt.y = opt.tp.y - opt.s.y - opt.oy;
				
				if(r > 0 && opt.y <= opt.dp.y) {
					aligners.ob(opt, --r);
				}
			},
			
			ob: function(opt, r){
				opt.y = opt.tp.y + opt.ts.y + opt.oy;
				
				if(r > 0 && opt.y + opt.s.y >= opt.dp.y + opt.ds.y) {
					aligners.ot(opt, --r);
				}
			},
			
			it: function (opt, r) {
				opt.y = opt.tp.y + opt.oy;
				
				if(r > 0 && opt.y + opt.s.y >= opt.dp.y + opt.ds.y) {
					aligners.ib(opt, --r);
				}
			},
			
			ib: function (opt, r) {
				opt.y = opt.tp.y + opt.ts.y - opt.s.y - opt.oy;
				
				if(r > 0 && opt.y <= opt.dp.y) {
					aligners.it(opt, --r);
				}
			}
			
		},
		
		setter = Object.map({
			bl: 'il ob',
			rt: 'or it',
			rb: 'or ib',
			lt: 'ol it',
			lb: 'ol ib',
			br: 'ir ob',
			tr: 'ir ot',
			tl: 'il ot',
			rc: 'or yc',
			bc: 'xc ob',
			tc: 'xc ot',
			lc: 'ol yc',
			cc: 'xc yc',
			
			'~lb': 'il ib',
			'~rt': 'ir it',
			'~rb': 'ir ib',
			'~lt': 'il it',
			'~rc': 'ir yc',
			'~bc': 'xc ib',
			'~tc': 'xc it',
			'~lc': 'il yc',
			
			'^lb': 'ol ob',
			'^rt': 'or ot',
			'^rb': 'or ob',
			'^lt': 'ol ot'
			
		}, function(value){
			value = value.split(' ');
			value[0] = aligners[value[0]];
			value[1] = aligners[value[1]];
			return value;
		}, {});
			
		/*
		 *      tl   tc   tr
		 *      ------------
		 *   lt |          | rt
		 *      |          |
		 *   lc |    cc    | rc
		 *      |          |
		 *   lb |          | rb
		 *      ------------
		 *      bl   bc   br
		 */
	
	return {
		
		/**
		 * 基于某个控件，设置当前控件的位置。改函数让控件显示都目标的右侧。
		 * @param {Controls} ctrl 目标的控件。
		 * @param {String} align 设置的位置。如 lt rt 。完整的说明见备注。
		 * @param {Number} offsetX 偏移的X大小。
		 * @param {Number} offsetY 偏移的y大小。
		 * @param {Boolean} enableReset 如果元素超出屏幕范围，是否自动更新节点位置。
		 * @memberOf Control
		 */
		align: function(ctrl, position, offsetX, offsetY, enableReset) {
					
			assert(!position || position in setter, "Control.prototype.align(ctrl, position,  offsetX, offsetY): {position} 必须是 l r c 和 t b c 的组合。如 lt", position);
			
			ctrl = ctrl instanceof Dom ? ctrl : Dom.get(ctrl);
			position = setter[position] || setter.lb;
			
			var opt = {
				s: this.getSize(),
				ts: ctrl.getSize(),
				tp: ctrl.getPosition(),
				ds: document.getSize(),
				dp: document.getPosition(),
				ox: offsetX,
				oy: offsetY
			}, r = enableReset === false ? 0 : 2;
			
			position[0](opt, r);
			position[1](opt, r);
			
			return this.setPosition(opt);
		}
		
	};
	
})());


/*********************************************************
 * Controls.Button.Menu-Alt
 *********************************************************/
/** * @author xuld *//** * 表示菜单项。  */var MenuItem = TreeControl.Item.extend({	xtype: 'menuitem',	/**	 * 当被子类重写时，用于创建子树。	 * @param {TreeControl} treeControl 要初始化的子树。	 * @return {TreeControl} 新的 {@link TreeControl} 对象。	 * @protected override	 */	createSubControl: function(treeControl){		return new Menu(treeControl);	},		/**	 * 当被子类重写时，用于初始化子树。	 * @param {TreeControl} treeControl 要初始化的子树。	 * @protected override	 */	initSubControl: function(treeControl){		treeControl.hide();		treeControl.floating = false;		this.addClass('x-menuitem-submenu');		this.on('mouseup', this._cancelHideMenu);	},		/**	 * 当被子类重写时，用于删除初始化子树。	 * @param {TreeControl} treeControl 要删除初始化的子树。	 * @protected override	 */	uninitSubControl: function(treeControl){		treeControl.floating = true;		this.removeClass('x-menuitem-submenu');		this.un('mouseup', this._cancelHideMenu);	},	onMouseOver: function() {		this.hovering(true);		if (this.subControl)			this.showSubMenu();		else if(this.parentControl)			this.parentControl.hideSubMenu();	},		onMouseOut: function() {		// 没子菜单，需要自取消激活。		// 否则，由父菜单取消当前菜单的状态。		// 因为如果有子菜单，必须在子菜单关闭后才能关闭激活。		if (!this.subControl)			this.hovering(false);	},		/**	 *	 */	init: function() {		if(this.hasClass('x-' + this.xtype)) {			this.unselectable();			this.on('mouseover', this.onMouseOver);			this.on('mouseout', this.onMouseOut);			if(!this.icon()){				this.setIcon('none');			}		}	},		_cancelHideMenu: function(e) {		e.stopPropagation();	},	_hideTargetMenu: function(e) {		var tg = e.relatedTarget;		while (tg && !Dom.hasClass(tg, 'x-menu')) {			tg = tg.parentNode;		}		if (tg) {			new Dom(tg).dataField().control.hideSubMenu();		}	},	getSubMenu: TreeControl.Item.prototype.getSubControl,		setSubMenu: TreeControl.Item.prototype.setSubControl,	showSubMenu: function(){		// 使用父菜单打开本菜单，显示子菜单。		this.parentControl && this.parentControl.showSubMenu(this);				return this;	},		hideSubMenu: function(){		// 使用父菜单打开本菜单，显示子菜单。		this.parentControl && this.parentControl.hideSubMenu(this);				return this;	},		hovering: function(value){		this.parent().toggleClass("x-menu-hover", value !== false);		this.toggleClass("x-menuitem-hover", value !== false);	}});var MenuSeperator = MenuItem.extend({	tpl: '<div class="x-menuseperator"></div>',	init: Function.empty});var Menu = TreeControl.extend({	xtype: 'menu',		/**	 * 表示当前菜单是否为浮动的菜单。 	 */	floating: false,	createTreeItem: function(childControl, parent) {				if(!(childControl instanceof MenuItem)){				// 如果是文本。			if (childControl.node.nodeType === 3) {					// - => MenuSeperator				if (/^\s*-\s*$/.test(childControl.getText())) {						// 删除文本节点。					if (parent) {						parent.remove(childControl);					}						childControl = new MenuSeperator;						// 其它 => 添加到 MenuItem				} else {						// 保存原有 childControl 。					var t = childControl;					childControl = new MenuItem;					childControl.content().replaceWith(t);				}				if (parent) {					parent.prepend(childControl);				}			} else if(childControl.hasClass('x-menuseperator')){				childControl = new MenuSeperator;			} else {					// 创建对应的 MenuItem 。				childControl = new MenuItem(childControl);			}						}		return childControl;	},	init: function() {		// 绑定节点和控件，方便发生事件后，根据事件源得到控件。		this.dataField().control = this;		// 根据已有的 DOM 结构初始化菜单。		this.initItems();	},	onShow: function() {				// 如果菜单是浮动的，则点击后关闭菜单，否则，只关闭子菜单。		if(this.floating)			document.once('mouseup', this.hide, this);		this.trigger('show');	},	/**	 * 关闭本菜单。	 */	onHide: function() {		// 先关闭子菜单。		this.hideSubMenu();		this.trigger('hide');	},	show: function() {		Dom.show(this.node);		this.onShow();		return this;	},	hide: function() {		Dom.hide(this.node);		this.onHide();		return this;	},		/**	 * 当前菜单依靠某个控件显示。	 * @param {Control} ctrl 方向。	 */	showAt: function(x, y) {				// 确保菜单已添加到文档内。		if (!this.parent('body')) {			this.appendTo();		}		// 显示节点。		this.show();		this.setPosition(x, y);		return this;	},	/**	 * 当前菜单依靠某个控件显示。	 * @param {Control} ctrl 方向。	 */	showBy: function(ctrl, pos, offsetX, offsetY, enableReset) {		// 确保菜单已添加到文档内。		if (!this.parent('body')) {			this.appendTo(ctrl.parent());		}		// 显示节点。		this.show();		this.align(ctrl, pos || 'rt', offsetX != null ? offsetX : -5, offsetY != null ? offsetY : -5, enableReset);		return this;	},	/**	 * 显示指定项的子菜单。	 * @param {MenuItem} menuItem 子菜单项。	 * @protected	 */	showSubMenu: function(menuItem) {		// 如果不是右键的菜单，在打开子菜单后监听点击，并关闭此子菜单。		if (!this.floating)			document.once('mouseup', this.hideSubMenu, this);		// 隐藏当前项子菜单。		this.hideSubMenu();		// 激活本项。		menuItem.hovering(true);		// 如果指定的项存在子菜单。		if (menuItem.subControl) {			// 设置当前激活的项。			this.currentSubMenu = menuItem;			// 显示子菜单。			menuItem.subControl.showBy(menuItem);		}			},	/**	 * 关闭本菜单打开的子菜单。	 * @protected	 */	hideSubMenu: function() {		// 如果有子菜单，就隐藏。		if (this.currentSubMenu) {			// 关闭子菜单。			this.currentSubMenu.subControl.hide();			// 取消激活菜单。			this.currentSubMenu.hovering(false);			this.currentSubMenu = null;		}			}});
/*********************************************************
 * Controls.Button.CloseButton
 *********************************************************/

/*********************************************************
 * Controls.Core.IInput
 *********************************************************/
/** * @author xuld *//** * 所有表单输入控件实现的接口。 * @interface IInput */var IInput = {		/**	 * 获取或设置当前表单的实际域。	 * @protected	 * @type {Control}	 */	hiddenField: null,		/**	 * 当设置文本时执行此函数。
	 */	onChange: function(){		this.trigger('change');	},		/**	 * 创建用于在表单内保存当前输入值的隐藏域。	 * @return {Dom} 隐藏输入域。
	 */	createHiddenField: function(){		return Dom.parse('<input type="hidden">').appendTo(this).setAttr('name', Dom.getAttr(this.node, 'name'));	},		/**	 * 获取当前输入域实际用于提交数据的表单域。	 * @return {Dom} 一个用于提交表单的数据域。	 */	input: function(){				// 如果不存在隐藏域。		if(!this.hiddenField) {						// 如果 当前元素是表单元素，直接返回。			if(/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(this.node.tagName)){				return this;			}						this.hiddenField = this.createHiddenField();		}				return this.hiddenField;	},		/**	 * 获取当前控件所在的表单。	 * @return {Dom} 表单。
	 */	form: function () {		return Dom.get(this.input().node.form);	},		/**	 * 清空当前控件的数据。	 * @return this
	 */	clear: function(){		return this.setText('');	},		/**	 * 选中当前控件。	 * @return this
	 */	select: function(){		Dom.prototype.select.apply(this.input(), arguments);		return this;	},		setAttr: function (name, value) {		var dom = this;		if(/^(disabled|readonly|name)$/i.test(name)){			if(/^disabled$/i.test(name)) {				return this.disabled(value);			} else if(/^readonly$/i.test(name)) {				return this.readOnly(value);			} 						dom = this.input();		}		return Dom.prototype.setAttr.call(dom, name, value);	},		getAttr: function (name, type) {		return Dom.getAttr((/^(disabled|readonly|name|form)$/i.test(name) ? this.input() : this).node, name, type);	},		getText: function(){		return Dom.getText(this.input().node);	},		setText: function(value){		var old = this.getText();		Dom.prototype.setText.call(this.input(), value);		if(old !== value)			this.onChange();					return this;	}	};Object.map("disabled readOnly", function(funcName){	IInput[funcName] = function(value){		value = value !== false;		this.toggleClass('x-' + this.xtype + '-' + funcName.toLowerCase(), value);		return Dom.prototype.setAttr.call(this.input(), funcName, value);	};});
/*********************************************************
 * Controls.Form.TextBox
 *********************************************************/
/** * @author  xuld */var TextBox = Control.extend(IInput).implement({		xtype: 'textbox',		tpl: '<input type="text" class="x-control">'	});
/*********************************************************
 * Controls.Core.IDropDownOwner
 *********************************************************/
/** * @author xuld *//** * 所有支持下拉菜单的组件实现的接口。 * @interface IDropDownOwner */var IDropDownOwner = {		/**	 * 获取或设置当前实际的下拉菜单。	 * @protected	 * @type {Control}	 */	dropDown: null,		/**	 * 下拉菜单的宽度。	 * @config {String}	 * @defaultValue -1	 * @return 如果值为 'auto', 则和父容器有同样的宽度。如果设为 -1， 表示不处理宽度。	 */	dropDownWidth: -1,		onDropDownShow: function(){		this.trigger('dropdownshow');	},		onDropDownHide: function(){		this.trigger('dropdownhide');	},		/**	 * 获取当前控件的下拉菜单。	 * @return {Control} 	 */	getDropDown: function(){		return this.dropDown;	},		attach: function(parentNode, refNode){		if(this.dropDown && !this.dropDown.parent('body')) {			this.dropDown.attach(parentNode, refNode);		}		Dom.prototype.attach.call(this, parentNode, refNode);	},		detach: function(parentNode){		Dom.prototype.detach.call(this, parentNode);		if(this.dropDown) {			this.dropDown.detach(parentNode);		}	},	setDropDown: function(dom){				// 修正下拉菜单为 Control 对象。		dom = dom instanceof Dom ? dom : Dom.get(dom);				assert.notNull(dom, "IDropDown.setDropDown(dom): {dom} ~");				// 设置下拉菜单。		this.dropDown = dom.addClass('x-dropdown').hide();				// 如果当前节点已经添加到 DOM 树，则同时添加 dom 。		if(!dom.parent('body')){						// 给 div 更多关心。			if(/^DIV$/.test(this.node.tagName)){				this.append(dom);			} else {				this.after(dom);			}						// IE6/7 无法自动在父节点无 z-index 时处理 z-index 。			if(navigator.isQuirks && dom.parent().getStyle('zIndex') === 0)				dom.parent().setStyle('zIndex', 1);		}				return this;	},		dropDownHidden: function () {		return Dom.isHidden(this.dropDown.node);	},		realignDropDown: function (offsetX, offsetY) {		this.dropDown.align(this, 'bl', offsetX, offsetY);		return this;	},		toggleDropDown: function(e){		if(e) this._dropDownTrigger = e.target;		return this[this.dropDownHidden() ? 'showDropDown' : 'hideDropDown']();	},		showDropDown: function(){				var dropDown = this.dropDown;				if(this.dropDownHidden()){			dropDown.show();			this.realignDropDown(0, -1);						var size = this.dropDownWidth;			if(size === 'auto') {				size = this.getSize().x;								// 不覆盖 min-width				if(size < Dom.styleNumber(dropDown.node, 'min-width'))					size = -1;			}						if(size >= 0) {				dropDown.setSize(size);			}						this.onDropDownShow();						document.on('mouseup', this.hideDropDown, this);		} else {			this.realignDropDown(0, -1);		}				return this;	},		hideDropDown: function (e) {				var dropDown = this.dropDown;				if(!this.dropDownHidden()){						// 如果是来自事件的关闭，则检测是否需要关闭菜单。			if(e){				e = e.target;				if([this._dropDownTrigger, dropDown.node, this.node].indexOf(e) >= 0 || Dom.has(dropDown.node, e) || Dom.has(this.node, e)) 					return this;			}						this.onDropDownHide();			dropDown.hide();			document.un('mouseup', this.hideDropDown);					}				return this;	}	};
/*********************************************************
 * Controls.Form.Picker
 *********************************************************/
/** * @author  xuld *//** * 表示一个数据选择器。 * @abstract class * @extends Control */var Picker = Control.extend(IInput).implement(IDropDownOwner).implement({		tpl: '<span class="x-picker">\			<input type="text" class="x-textbox"/>\		</span>',		dropDownListTpl: '<span class="x-picker">\			<a href="javascript:;" class="x-button">A</a>\		</span>',			menuButtonTpl: '<button class="x-button" type="button"><span class="x-button-menu"></span></button>',		/**	 * 当前控件是否为下拉列表。	 */	dropDownList: false,		/**	 * 下拉框的宽度。	 */	dropDownWidth: 'auto',		/**	 * @config dropDownList 是否允许用户输入自定义的文本值。	 */		create: function(options){		return Dom.parseNode(options.dropDownList ? this.dropDownListTpl : this.tpl);	},		/**	 * 获取当前输入域实际用于提交数据的表单域。	 * @return {Dom} 一个用于提交表单的数据域。	 */	input: function(){				// 如果不存在隐藏域。		if(!this.hiddenField) {						var textBox = this.find('.x-textbox');						if(textBox){				return textBox;				}						this.hiddenField = Dom.parse('<input type="hidden">').appendTo(this);			this.hiddenField.setAttr('name', Dom.getAttr(this.node, 'name'));		}				return this.hiddenField;	},		/**	 * 获取当前控件的按钮部分。	 */	button: function(){		return this.find('button');	},		/**	 * @protected	 * @override	 */	init: function(){				// 如果是 <input> 或 <a> 直接替换为 x-picker		if(!this.first() && !this.hasClass('x-picker')) {			var elem = this.node;						// 创建 x-picker 组件。			this.node = Dom.createNode('span', 'x-picker x-' + this.xtype);						// 替换当前节点。			if(elem.parentNode){				elem.parentNode.replaceChild(this.node, elem);			}						// 插入原始 <input> 节点。			this.prepend(elem);		}				// 如果没有下拉菜单按钮，添加之。		if(!this.button()) {			this.append(this.menuButtonTpl);			}				// 初始化菜单。		elem = this.next();		if(elem && !elem.hasClass('x-dropdown')) {			elem = null;		}		this.setDropDown(this.createDropDown(elem));				// 设置菜单显示的事件。		(this.dropDownList ? this : this.button()).on('click', this.toggleDropDown, this);			},		setWidth: function(value){		var first = this.first();		if(value >= 0){			value -= this.getWidth() - first.getWidth();		}		first.setWidth(value);		return this;	},		disabled: function(value){		value = value !== false;				// 子节点全部设置样式。		this.children().setAttr("disabled", value);				// 为按钮增加 disabled 样式。		this.query('.x-textbox').toggleClass("x-textbox-disabled", value);				// 为按钮增加 disabled 样式。		this.query('.x-button').toggleClass("x-button-disabled", value);	},		readOnly: function(value){				value = value !== false;				// 子节点全部设置样式。		this.input().setAttr("readonly", value);				// 为按钮增加 disabled 样式。		this.query('.x-textbox').toggleClass("x-textbox-readonly", value);	},		// 下拉菜单		onDropDownShow: function(){		// 默认选择当前值。		this.updateDropDown();		this.button().addClass('x-button-actived');		return IDropDownOwner.onDropDownShow.apply(this, arguments);	},		onDropDownHide: function(){		this.button().removeClass('x-button-actived');		return IDropDownOwner.onDropDownHide.apply(this, arguments);	},		/**	 * 创建当前 Picker 的菜单。	 * @return {Control} 下拉菜单。	 */	createDropDown: function(existDom){		return existDom || Dom.parse('<div/>');	},		/**	 * 将当前文本的值同步到下拉菜单。	 * @protected virtual	 */	updateDropDown: Function.empty	}).addEvents('change', {	add: function(picker, type, fn){		Dom.$event.$default.add(picker.input(), type, fn);	},	remove: function(picker, type, fn){		Dom.$event.$default.remove(picker.input(), type, fn);	}});
/*********************************************************
 * Controls.Form.SearchTextBox
 *********************************************************/
var SearchTextBox = Picker.extend({		xtype: 'searchtextbox',		tpl: '<span class="x-picker">\				<input type="text" class="x-textbox x-searchtextbox"/>\			</span>',			menuButtonTpl: '<button class="x-searchtextbox-search"></button>',		onKeyDown: function(e){		if(e.keyCode === 10 || e.keyCode === 13){			this.onSearch();		}	},		onSearch: function(){		this.trigger('search', this.getText());	},		init: function(){				// 如果是 <input> 或 <a> 直接替换为 x-picker		if(!this.first() && !this.hasClass('x-picker')) {			var elem = this.node;						// 创建 x-picker 组件。			this.node = Dom.createNode('span', 'x-picker');						// 替换当前节点。			if(elem.parentNode){				elem.parentNode.replaceChild(this.node, elem);			}						// 插入原始 <input> 节点。			this.prepend(elem);		}				// 如果没有下拉菜单按钮，添加之。		if(!this.button()) {			this.append(this.menuButtonTpl);			}				var textBox = this.input();		textBox.on('focus', textBox.select);				this.button().on('click', this.onSearch, this);		textBox.on('keydown', this.onKeyDown, this);				if(navigator.isIE6){			textBox.on('keypress', this.onKeyDown, this);		}	}});
/*********************************************************
 * Controls.Button.ContextMenu
 *********************************************************/
/** * @author  */var ContextMenu = Menu.extend({		floating: true,		setControl: function(ctrl){		ctrl.on('contextmenu', this.onContextMenu, this);				return this;	},		onContextMenu: function(e){ 		this.showAt(e.pageX === undefined ? event.x : e.pageX, e.pageY === undefined ? event.y : e.pageY);		e.stop();	}	});
/*********************************************************
 * System.Data.JSON
 *********************************************************/


/**
 * 提供解析 JSON 的函数。
 */
var JSON = JSON || {};
	
Object.extend(JSON, {
	
	specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	replaceChars: function(chr){
		return JSON.specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	encode: function(obj){
		switch (typeof obj){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON.replaceChars) + '"';
			case 'object':
				if (obj) {
					if (Array.isArray(obj)) {
						return '[' + String(Object.map(obj, JSON.encode, [])) + ']';
					}
					var s = [];
					for (var key in obj) {
						s.push(JSON.encode(key) + ':' + JSON.encode(obj[key]));
					}
					return '{' + s + '}';
				}
			default:
				return String(obj);
		}
	},

	decode: function(string){
		if (typeof string != 'string' || !string.length) return null;
		
		// 摘自 json2.js
		if (/^[\],:{}\s]*$/
                    .test(string.replace(/\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

        	return new Function('return ' + string)();
        	
        }
        
        throw new SyntaxError('JSON.parse: unexpected character\n' + value);
	}

});

Object.extendIf(JSON, {
	stringify: JSON.encode,
	parse: JSON.decode
});



/*********************************************************
 * System.Browser.Base
 *********************************************************/
/** * @author  */var Browser = Browser || {};
/*********************************************************
 * System.Browser.Cookie
 *********************************************************/



/**
 * 获取 Cookies 。
 * @param {String} name 名字。
 * @param {String} 值。
 */
Browser.getCookie = function (name) {
	assert.isString(name, "Browser.getCookie(name): 参数 {name} ~");
	var matches = document.cookie.match(new RegExp("(?:^|; )" + encodeURIComponent(name).replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1') + "=([^;]*)"));
	return matches ? decodeURIComponent(matches[1]) : null;
};
	
/**
 * 设置 Cookies 。
 * @param {String} name 名字。
 * @param {String} value 值。
 * @param {Number} expires 有效天数。天。-1表示无限。
 * @param {Object} props 其它属性。如 domain, path, secure    。
 */
Browser.setCookie = function (name, value, expires, props) {
	var e = encodeURIComponent,
		    updatedCookie = e(name) + "=" + e(value),
		    t;

	if (expires == undefined)
		expires = value === null ? -1 : 1000;

	if (expires) {
		t = new Date();
		t.setHours(t.getHours() + expires * 24);
		updatedCookie += '; expires=' + t.toGMTString();
	}

	for (t in props) {
		updatedCookie = String.concat(updatedCookie, "; " + t, "=", e(props[t]));
	}
	
	assert(updatedCookie.length < 4096, "Browser.setCookie(name, value, expires, props): 参数  value 内容过长(大于 4096)，操作失败。");

	document.cookie = updatedCookie;

	return value;
};



/*********************************************************
 * System.Browser.LocalStorage
 *********************************************************/
/** * @author  */Object.extend(Browser, {		setData: window.localStorage ? function(name, value){		localStorage[name] = value;		return value;	} : Browser.setCookie,		getData: window.localStorage ? function (name) {		return localStorage[name];	} : Browser.getCookie,		setJSON: function (name, value) {		Browser.setData(name, JSON.encode(value));		return value;	},		getJSON: function (name) {		name = Browser.getData(name);		if(name)			try{				return JSON.decode(name);			}catch(e){}							return null;	}	});
/*********************************************************
 * System.Dom.Drag
 *********************************************************/
//===========================================
//  拖动 
//   A: xuld
//===========================================


	
var Draggable = Class({
	
	initEvent: function (e) {
		e.draggable = this;
		e.dragTarget = this.target;
	},
	
	/**
	 * 触发 dragstart 事件。
	 * @param {Event} e 原生的 mousemove 事件。
	 */
	onDragStart: function(e){
		this.initEvent(e);
		// 如果都正常。
		return this.target.trigger('dragstart', e);
	},
	
	/**
	 * 触发 drag 事件。
	 * @param {Event} e 原生的 mousemove 事件。
	 */
	onDrag: function(e){
		this.initEvent(e);
		this.target.trigger('drag', e);
	},
	
	/**
	 * 触发 dragend 事件。
	 * @param {Event} e 原生的 mouseup 事件。
	 */
	onDragEnd: function(e){
		this.initEvent(e);
		return this.target.trigger('dragend', e);
	},
	
	/**
	 * 处理 mousedown 事件。
	 * 初始化拖动，当单击时，执行这个函数，但不执行 doDragStart。
	 * 只有鼠标移动时才会继续执行doDragStart。
	 * @param {Event} e 事件参数。
	 */
	initDrag: function(e){

		// 左键才继续
		if(e.which !== 1)
			return;
		
		if(Draggable.current) {
			Draggable.current.stopDrag(e);
		}
		
		e.preventDefault();
		
		var me = this;
		
		me.from = new Point(e.pageX, e.pageY);
		me.to = new Point(e.pageX, e.pageY);
		
		// 设置当前处理  mousemove 的方法。
		// 初始需设置 onDrag
		// 由 onDrag 设置为    onDrag
		me.handler = me.startDrag;
		
		me.timer = setTimeout(function(){
			me.startDrag(e);
		}, me.dragDelay);
		
		// 设置文档  mouseup 和   mousemove
		Dom.getDocument(me.handle.node).on('mouseup', me.stopDrag, me).on('mousemove', me.handleDrag, me);
	
	},
	
	/**
	 * 处理 mousemove 事件。
	 * @param {Event} e 事件参数。
	 */
	handleDrag: function(e){
		
		e.preventDefault();
		
		this.to.x = e.pageX;
		this.to.y = e.pageY;
		
		// 调用函数处理。
		this.handler(e);
	},
	
	/**
	 * 处理 mousedown 或 mousemove 事件。开始准备拖动。
	 * @param {Event} e 事件。
	 * 这个函数调用 onDragStart 和 beforeDrag
	 */
	startDrag: function (e) {
		
		var me = this;
		
		//   清空计时器。
		clearTimeout(me.timer);
		
		Draggable.current = me;
		
		// 设置句柄。
		me.handler = me.drag;
		
		// 开始拖动事件，如果这个事件 return false，  就完全停止拖动。
		if (me.onDragStart(e)) {
			me.beforeDrag(e);
			me.drag(e);
		} else {
			// 停止。
			me.stopDragging();
		}
	},
	
	/**
	 * 处理 mousemove 事件。处理拖动。
	 * @param {Event} e 事件参数。
	 * 这个函数调用 onDrag 和 doDrag
	 */
	drag: function(e){
		this.onDrag(e);
		this.doDrag(e);
	},
	
	/**
	 * 处理 mouseup 事件。
	 * @param {Event} e 事件参数。
	 * 这个函数调用 onDragEnd 和 afterDrag
	 */
	stopDrag: function (e) {
		
		// 只有鼠标左键松开， 才认为是停止拖动。
		if(e.which !== 1)
			return;
		
		e.preventDefault();
		
		// 检查是否拖动。
		// 有些浏览器效率较低，肯能出现这个函数多次被调用。
		// 为了安全起见，检查 current 变量。
		if (Draggable.current === this) {
			
			this.stopDragging();
			
			this.onDragEnd(e);

			// 改变结束的鼠标类型，一般这个函数将恢复鼠标样式。
			this.afterDrag(e);
		
		} else {

			this.stopDragging();
			
		}
	},
	
	beforeDrag: function(e){
		this.offset = this.proxy.getOffset();
		document.documentElement.style.cursor = this.target.getStyle('cursor');
		if('pointerEvents' in document.body.style)
			document.body.style.pointerEvents = 'none';
		else if(document.body.setCapture)
			document.body.setCapture();
	},
	
	doDrag: function(e){
		var me = this;
		me.proxy.setOffset({
			x: me.offset.x + me.to.x - me.from.x,
			y: me.offset.y + me.to.y - me.from.y
		});
	},
	
	afterDrag: function(){
		if(document.body.style.pointerEvents === 'none')
			document.body.style.pointerEvents = '';
		else if(document.body.releaseCapture)
			document.body.releaseCapture();
		document.documentElement.style.cursor = '';
		this.offset = null;
	},
	
	dragDelay: 500,
	
	constructor: function(dom, handle){
		this.proxy = this.target = dom;
		this.handle = handle || dom;
		this.draggable();
	},

	/**
	 * 停止当前对象的拖动。
	 */
	stopDragging: function(){
		Dom.getDocument(this.handle.node).un('mousemove', this.handleDrag).un('mouseup', this.stopDrag);
		clearTimeout(this.timer);
		Draggable.current = null;
	},
	
	draggable: function(value){
		this.handle[value !== false ? 'on' : 'un']('mousedown', this.initDrag, this);
	}
	
});

/**
 * @class Element
 */
Dom.implement({
	
	/**
	 * 使当前元素支持拖动。
	 * @param {Element} [handle] 拖动句柄。
	 * @return this
	 */
	draggable: function(handle) {
		var draggable = this.dataField().draggable;
		if(handle !== false) {
			if (handle === true) handle = null;
			if(draggable) {
				assert(!handle || draggable.handle.target === handle.target, "Dom.prototype.draggable(handle): 无法重复设置 {handle}, 如果希望重新设置handle，使用以下代码：dom.draggable(false);JPlus.removeData(dom, 'draggable');dom.draggable(handle) 。", handle);
				draggable.draggable();
			} else  {
				Dom.movable(this.node);
				draggable = this.dataField().draggable = new Draggable(this, handle);
			}
			
			
		} else if(draggable)
			draggable.draggable(false);
		return this;
	}
	
});
	


/*********************************************************
 * System.Dom.Drop
 *********************************************************/
//===========================================
//  拖放         A
//===========================================



(function(){
	
	/**
	 * 全部的区。
	 */
	var droppables = [],
		
		dp = Draggable.prototype,
		
		Droppable = window.Droppable = Class({
		
			initEvent: function (draggable, e) {
				e.draggable = draggable;
				e.droppable = this;
				e.dragTarget = draggable.target;
			},
			
			/**
			 * 触发 dragenter 执行。
			 * @param {Draggable} droppable 拖放物件。
			 * @param {Event} e 事件参数。
			 */
			onDragEnter: function(draggable, e){
				this.initEvent(draggable, e);
				return this.target.trigger('dragenter', e);
			},
			
			/**
			 * 触发 dragover 执行。
			 * @param {Draggable} droppable 拖放物件。
			 * @param {Event} e 事件参数。
			 */
			onDragOver: function(draggable, e){
				this.initEvent(draggable, e);
				return this.target.trigger('dragover', e);
			},

			/**
			 * 触发 drop 执行。
			 * @param {Draggable} draggable 拖放物件。
			 * @param {Event} e 事件参数。
			 */
			onDrop: function(draggable, e){
				this.initEvent(draggable, e);
				return this.target.trigger('drop', e);
			},
			
			/**
			 * 触发 dragleave 执行。
			 * @param {Draggable} droppable 拖放物件。
			 * @param {Event} e 事件参数。
			 */
			onDragLeave: function(draggable, e){
				this.initEvent(draggable, e);
				return this.target.trigger('dragleave', e);
			},
			
			/**
			 * 初始化。
			 * @constructor Droppable
			 */
			constructor: function(ctrl){
				this.target = ctrl;
				this.setDisabled(false);
			},
			
			/**
			 * 判断当前的 bound 是否在指定点和大小表示的矩形是否在本区范围内。
			 * @param {Rectange} box 范围。
			 * @return {Boolean} 在上面返回 true
			 */
			check: function(draggable, position, size){
				var myLeft = position.x,
					myRight = myLeft + size.x,
					targetLeft = this.position.x,
					targetRight = targetLeft + this.size.x,
					myTop,
					myBottom,
					targetTop,
					targetBottom;
				
				if((myRight >= targetRight || myRight <= targetLeft) && 
						(myLeft >= targetRight || myLeft <= targetLeft) && 
						(myLeft >= targetLeft || myRight <= targetRight))
					return false;
				
				
				myTop = position.y;
				myBottom = myTop + size.y;
				targetTop = this.position.y;
				targetBottom = targetTop + this.size.y;

				if((myBottom >= targetBottom || myBottom <= targetTop) && 
						(myTop >= targetBottom || myTop <= targetTop) && 
						(myTop >= targetTop || myBottom <= targetBottom))
					return false;
				
				return true;
			},
			
			/**
			 * 使当前域处理当前的 drop 。
			 */
			setDisabled: function(value){
				droppables[value ? 'remove' : 'include'](this);
			},
			
			accept: function(elem){
				this.position = this.target.getPosition();
				this.size = this.target.getSize();
				return true;
			}
			
		}),
		
		beforeDrag = dp.beforeDrag,
		
		doDrag = dp.doDrag,
		
		afterDrag = dp.afterDrag,
		
		mouseEvents = Dom.$event.mousemove;
	
	Draggable.implement({
		
		beforeDrag: function(e){
			var me = this;
			beforeDrag.call(me, e);
			me.position = me.proxy.getPosition();
			me.size = me.proxy.getSize();
			me.droppables = droppables.filter(function(droppable){
				return droppable.accept(me);
			});
			me.activeDroppables = new Array(me.droppables.length);
		},
		
		doDrag: function(e){
			doDrag.call(this, e);
			var me = this,
				i = 0,
				droppables = me.droppables,
				position = me.proxy.getPosition(),
				size = me.proxy.getSize(),
				activeDroppables = me.activeDroppables,
				droppable;
			while(i < droppables.length) {
				droppable = droppables[i];
				if(droppable.check(me, position, size)) {
					if(activeDroppables[i])
						droppable.onDragOver(me, e);
					else {
						activeDroppables[i] = true;
						droppable.onDragEnter(me, e);
					}
					
					
				} else if(activeDroppables[i]){
					activeDroppables[i] = false;
					droppable.onDragLeave(me, e);
				}
				i++;
			}
		},
		
		afterDrag: function(e){
			var me = this;
			afterDrag.call(me, e);
			me.droppables.forEach(function(droppable, i){
				if(me.activeDroppables[i])
					droppable.onDrop(me, e);
			});
			me.activeDroppables = me.droppables = null;
		}
	});
	
	Dom.addEvents('dragenter dragleave dragover drop', {
		add:  function(elem, type, fn){
			Dom.$event.$default.add(elem, type, fn);
			fn = elem.dataField().droppable;
			if(fn){
				fn.setDisabled(false);
			} else {
				elem.dataField().droppable = new Droppable(elem);
			}
		},
		remove: function(elem, type, fn){
			Dom.$event.$default.remove(elem, type, fn);
			elem.dataField().droppable.setDisabled();
			delete elem.dataField().droppable;
		},
		initEvent: mouseEvents && mouseEvents.initEvent
	});
})();


/*********************************************************
 * System.Text.Tpl
 *********************************************************/
//===========================================
//  模板引擎
//   A: xuld
//===========================================


/**
 * @class Tpl
 * @example Tpl.parse("{if a}OK{end}", {a:1}); //=> OK
 * 模板解析字符串语法:
 * 模板字符串由静态数据和解析单元组成。
 * 普通的内容叫静态的数据，解析前后，静态数据不变。
 * 解析单元由 { 开始， } 结束。解析单元可以是:
 * 1. Javascript 变量名: 这些变量名来自 Tpl.parse 的第2个参数， 比如第二个参数是 {a:[1]} ，那 {a[0]}将返回 1 。
 * 2. if/for/end/else/eval 语句，这5个是内置支持的语法。
 * 2.1 if: {if a} 或  {if(a)} 用来判断一个变量，支持全部Javascript表达式，如 {if a==1} 。语句 {if} 必须使用 {end} 关闭。
 * 2.2 else 等价于 Javascript 的 else， else后可同时有 if语句，比如: {else if a}
 * 2.3 for: {for a in data} for用来遍历对象或数组。  语句 {for} 必须使用 {end} 关闭。
 * 2.4 eval: eval 后可以跟任何 Javascript 代码。 比如 {eval nativeFn(1)}
 * 2.5 其它数据，将被处理为静态数据。
 * 3 如果需要在模板内输出 { 或 }，使用 {{} 和 {}} 。 或者使用 \{ 和 \}
 * 4 特殊变量，模板解析过程中将生成4个特殊变量，这些变量将可以方便操作模板
 * 4.1 $output 模板最后将编译成函数，这个函数返回最后的内容， $output表示这个函数的组成代码。
 * 4.2 $data 表示  Tpl.parse 的第2个参数。
 * 4.3 $index 在 for 循环中，表示当前循环的次号。
 * 4.4 $value 在 for 循环中，表示当前被循环的目标。
 */
var Tpl = {
	
	cache: {},
	
	/**
	 * 使用指定的数据解析模板，并返回生成的内容。
	 * @param {String} tpl 表示模板的字符串。
	 * @param {Object} data 数据。
	 * @param {Object} bind 模板中 this 的指向。
	 * @return {String} 处理后的字符串。 
	 */
	parse: function(tpl, data, bind) {
		return (Tpl.cache[tpl] || (Tpl.cache[tpl] = Tpl.compile(tpl))).call(bind, data);
	},
		
	/**
	 * 把一个模板编译为函数。
	 * @param {String} tpl 表示模板的字符串。
	 * @return {Function} 返回的函数。
	 */
	compile: function(tpl){
		tpl = Tpl.build(Tpl.lexer(tpl));
		return new Function("_", tpl);
	},
	
	/**
	 * 对一个模板进行词法解析。返回拆分的数据单元。
	 * @param {String} tpl 表示模板的字符串。
	 * @return {Array} 返回解析后的数据单元。
	 */
	lexer: function (tpl) {
		
		/**
		 * [字符串1, 代码块1, 字符串2, 代码块2, ...]
		 */
		var output = [],
			
			// 块的开始位置。
			blockStart = -1,
			
			// 块的结束位置。
			blockEnd = -1;
		
		while ((blockStart = tpl.indexOf('{', blockStart + 1)) >= 0) {

			// 如果 { 后面是 { , 忽略之。
			if (tpl.charAt(blockStart + 1) === '{') {
				blockStart++;
				continue;
			}
			
			// 放入第一个数据区块。
			output.push(tpl.substring(blockEnd + 1, blockStart));

			// 从  blockStart 处搜索 }
			blockEnd = blockStart;

			// 搜索 } 字符，如果找到的字符尾随一个 } 则跳过。
			do {
				blockEnd = tpl.indexOf('}', blockEnd + 1);

				if (tpl.charAt(blockEnd + 1) !== '}' || tpl.charAt(blockEnd + 2) === '}') {
					break;
				}

				blockEnd++;
			} while (true);

			if (blockEnd == -1) {
				Tpl.throwError("缺少 '}'", tpl.substr(blockStart));
			} else {
				output.push(tpl.substring(blockStart + 1, blockStart = blockEnd).trim());
			}

		}
		
		// 剩余的部分。
		output.push(tpl.substring(blockEnd + 1, tpl.length));
		
		return output;
	},
	
	/**
	 * 将词法解析器的结果编译成函数源码。
	 */
	build: function(lexerOutput){
		
		var output = "var __OUTPUT__=\"\",__INDEX__,__KEY__,__TARGET__,__TMP__;with(_){";
		
		for(var i = 0, len = lexerOutput.length, source, isString = true; i < len; i++){
			source = lexerOutput[i].replace(/([\{\}]){2}/g, "$1");
			
			if(isString){
				output += "__OUTPUT__+=\"" + source.replace(/[\"\\\n\r]/g, Tpl.replaceSpecialChars) + "\";";
			} else {
				output += Tpl.parseMacro(source);
			}
			
			isString = !isString;
		}
		
		output +="};return __OUTPUT__";
		
		return output;
	},
	
	parseMacro: function(macro){
		var command = (macro.match(/^\w+\b/) || [''])[0],
			params = macro.substr(command.length);

		switch(command) {
			case "end":
				return "}";
			case 'if':
			case 'while':
				if(!params)
					Tpl.throwError("'" + command + "' 语句缺少条件, '" + command + "' 语句的格式为 {" + command + " condition}", macro);
				macro = command + "(Object.isArray(__TMP__=" + params + ")?__TMP__.length:__TMP__){";
				break;
			case 'for':
				if(command = /^\s*(var\s+)?([\w$]+)\s+in\s+/.exec(params)) {
					macro = "__INDEX__=0;__TARGET__=" + params.substr(command[0].length) + ";for(__KEY__ in __TARGET__){if(!__TARGET__.hasOwnProperty(__KEY__))continue;__INDEX__++;var " + command[2] + "=__TARGET__[__KEY__];";	
				} else if (/^\(/.test(params)) {
					return macro + "{";
				} else {
					Tpl.throwError("'for' 语法错误， 'for' 语句的格式为 {for var_name in obj}", macro);
				}
				break;
			case 'else':
				return '}else ' + (/^\s*if\b/.exec(params) ? Tpl.parseMacro(params.trim()) : '{');
			case 'var':
				macro += ';';
				break;
			case 'function':
				macro += '{';
				break;
			case 'break':
			case 'continue':
				break;
			case 'eval':
				macro = params;
				break;
			default:
				macro = '__TMP__=' + macro + ';if(__TMP__!=undefined)__OUTPUT__+=__TMP__;';
				break;
		}
		
		return macro.replace(/@(\w+)\b/g, Tpl.replaceConsts);
	},

	isLast: function(obj, index){
		if(typeof obj.length === 'number')
			return index >= obj.length - 1;
			
		for(var p in obj){
			index--;	
		}
		
		return !index;
	},
	
	consts: {
		'target': '__TARGET__',
		'key': '__KEY__',
		'index': '__INDEX__',
		'first': '__INDEX__==0',
		'last': 'Tpl.isLast(__TARGET__,__INDEX__)',
		'odd': '__INDEX__%2===1',
		'even': '__INDEX__%2'
	},
	
	replaceConsts: function(_, consts){
		return Tpl.consts[consts] || _;
	},
	
	specialChars: {
		'"': '\\"',
		'\n': '\\n',
		'\r': '\\r',
		'\\': '\\\\'
	},
	
	replaceSpecialChars: function(specialChar){
		return Tpl.specialChars[specialChar] || specialChar;
	},

	throwError: function(message, tpl){
		throw new SyntaxError("Tpl.parse: " + message + "。 (在 '" + tpl +"' 附近)");
	}
	
};
/*********************************************************
 * Controls.Form.ComboBox
 *********************************************************/
/** * @author xuld *//** * 表示一个组合框。 * @class * @extends Picker * @example <pre> * var comboBox = new ComboBox(); * comboBox.menu.add("aaa"); * comboBox.menu.add("bbb"); * comboBox.menu.setSelectedIndex(0); * </pre>
 */var ComboBox = Picker.extend({		xtype: 'combobox',		autoResize: true,		// 悬停选中		_getHover: function(){		return this._hoverItem;	},		_setHover: function(item){		var clazz = 'x-' + this.dropDown.xtype + '-hover';				if(this._hoverItem){			this._hoverItem.removeClass(clazz);		}				this._hoverItem = item ? item.addClass(clazz) : null;			},		/**	 * 移动当前选中项的位置。	 */	_moveHover: function(delta){				// 如果菜单未显示。	    if(this.dropDownHidden()){	    		    	// 显示菜单。	    	this.showDropDown();	    } else {	    		    	var item = this._hoverItem || this.selectedItem;	    		    	if(item){	    		item = item[delta > 0 ? 'next' : 'prev']();	    	}	    		    	if(!item){	    		item = this.dropDown.item(delta > 0 ? 0 : -1);	    	}	    		    	this._setHover(item);	    		    }	},		onSelect: function(item){		return this.trigger('select', item);	},		/**	 * 处理键盘事件。
	 */	onKeyDown: function(e){		switch(e.keyCode) {						// 上下			case 40:			case 38:							// 阻止默认事件。			    e.preventDefault();			    				this._moveHover(e.keyCode === 40 ? 1 : -1);			    			    break;			    			// 回车			case 13:			case 10:				if(!this.dropDownHidden()){					var currentItem = this._getHover();					if(currentItem != null) {						this.selectItem(currentItem);						e.preventDefault();					}				}		}	},		/**	 * 当用户单击某一项时执行。	 */	onItemClick: function(item, e){				// 禁止事件。		e.stop();			// 如果无法更改值，则直接忽略。		if(!this.getAttr('disabled') && !this.getAttr('readonly')) {							// 设置当前的选中项。			this.selectItem(item);					}			},		/**	 * 创建当前 Picker 的菜单。	 * @return {Control} 下拉菜单。	 * @protected virtual	 */	createDropDown: function(existDom){		return new ComboBox.DropDownMenu(existDom);	},		_syncSelect: function(){		var selected = this.hiddenField.find(':selected');		this.first().setText(selected ? selected.getText() : this.hiddenField.getAttr('placeholder'));	},		/**	 * 将当前文本的值同步到下拉菜单。	 */	updateDropDown: function(){				var item;				if(this.dropDownList){			item = this.getSelectedItem();		} else {			item = this.dropDown.getItemByText(this.getText());		}				this._setHover(item);	},		updateText: function(item){				// 如果是 dropDownList, 还需要更新 <select> 的值。		if(this.dropDownList){			var elem = this.hiddenField.node,				oldIndex = elem.selectedIndex;			if(item == null){				elem.selectedIndex = -1;			} else {				elem.value = item.option.value;			}			this._syncSelect();						if(oldIndex !== elem.selectedIndex)				this.onChange();		} else {			IInput.setText.call(this, item.getText());		}			},		clear: function(){		if(this.dropDownList){			this.updateText(null);		} else {			IInput.clear.call(this, value);		}	},		setText: function(value){				IInput.setText.call(this, value);				if(this.dropDownList){			this._syncSelect();		}				return this;	},		init: function (options) {				// 1. 处理 <select>		var selectNode;				// 如果初始化的时候传入一个 <select> 则替换 <select>, 并拷贝相关数据。		if(this.node.tagName === 'SELECT') {						selectNode = this.node;						// 调用 create 重新生成 dom 。			this.node = Dom.parseNode(this.dropDownListTpl);						this.dropDownList = true;					}				// 2. 初始化文本框				// 初始化文本框		this.base('init');				// 3. 初始化菜单				// 绑定下拉菜单的点击事件		this.dropDown			.itemOn('mouseover', this._setHover, this)			.itemOn('click', this.onItemClick, this);				// 4. 绑定事件				// 监听键盘事件。		this.on('keydown', this.onKeyDown);				// IE6 Hack: keydown 无法监听到回车。		if(navigator.isIE6) {			this.on('keypress', this.onKeyDown);			}				// 4. 设置默认项					if(selectNode) {						this.hiddenField = selectNode = new Dom(selectNode);						// 让 listBox 拷贝 <select> 的成员。			this.copyItemsFromSelect(selectNode);						// 隐藏 <select> 为新的 dom。			selectNode.hide();						// 插入当前节点。			selectNode.after(this);		}			},		/**	 * 模拟鼠标选择某一个项。	 */	selectItem: function (item) {		this.setSelectedItem(item);		return this.hideDropDown();	},		/**	 * 获取当前选中的项。如果不存在选中的项，则返回 null 。	 * @return {Control} 选中的项。	 */	getSelectedItem: function(){		return this.selectedItem;	},		/**	 * 设置当前选中的项。	 * @param {Control} item 选中的项。	 * @return this	 */	setSelectedItem: function(item){		item = this.dropDown.itemOf(item);		if(this.onSelect(item) !== false) {			this.selectedItem = item;			this.updateText(item);		}		return this;	},		getSelectedIndex: function(){		return this.dropDown.indexOf(this.getSelectedItem());	},		setSelectedIndex: function(value){		return this.setSelectedItem(this.dropDown.item(value));	},		set: function(items){		if(Object.isArray(items)){			this.dropDown.set(items);			return this;		}				return Dom.prototype.set.apply(this, arguments);	},		resizeToFitItems: function(){		var dropDown = this.dropDown,			oldWidth = dropDown.getStyle('width'),			oldDisplay = dropDown.getStyle('display');					dropDown.setStyle('display', 'inline-block');		dropDown.setWidth('auto');				this.first().setSize(dropDown.getWidth());				dropDown.setStyle('width', oldWidth);		dropDown.setStyle('display', oldDisplay);		return this;	},		copyItemsFromSelect: function(select){		for(var node = select.node.firstChild; node; node = node.nextSibling) {			if(node.tagName  === 'OPTION') {				var item = this.add(Dom.getText(node));								item.option = node;				if(node.selected){					this.setSelectedItem(item);				}			}		}				if(select.onclick)			this.node.onclick = select.node.onclick;				if(select.onchange)			this.on('change', select.node.onchange);				if(this.autoResize)			this.setWidth(select.getWidth());			}}).addEvents('select');ListControl.aliasMethods(ComboBox, 'dropDown');ComboBox.DropDownMenu = ListControl.extend({		xtype: "listbox"});
/*********************************************************
 * Controls.Form.ListBox
 *********************************************************/
/** * @author  *//** * 表示一个列表框。 * @class * @extends ListControl * @implements IInput
 */var ListBox = ListControl.extend(IInput).implement({		xtype: 'listbox',		/**	 * 当用户点击一项时触发。	 */	onItemClick: function (item) {		return this.trigger('itemclick', item);	},		/**	 * 当一个选项被选中时触发。	 */	onSelect: function(item){				// 如果存在代理元素，则同步更新代理元素的值。		if(this.formProxy)			this.formProxy.value = this.baseGetValue(item);					return this.trigger('select', item);	},		/**	 * 点击时触发。
	 */	onClick: function (e) {				// 如果无法更改值，则直接忽略。		if(this.hasClass('x-' + this.xtype + '-disabled') || this.hasClass('x-' + this.xtype + '-readonly'))			return;					//获取当前项。		var item = e.getTarget().closest('li');		if(item && !!this.clickItem(item)){			e.stop();		}	},		/**	 * 底层获取一项的值。	 */	baseGetValue: function(item){		return item ? item.value !== undefined ? item.value : item.getText() : null;	},		/**	 * 模拟点击一项。
	 */	clickItem: function(item){		if(this.onItemClick(item)){			this.toggleSelected(item);			return true;		}				return false;	},		init: function(options){		var t;		if(this.node.tagName === 'SELECT'){			t = this.node;			this.node = this.create(options);			t.parentNode.replaceChild(this.node, t);		}				this.base('init');					this.on('click', this.onClick);				if(t)			this.copyItemsFromSelect(t);			},		// form		/**	 * 反选择一项。	 */	clear: function () {		return this.setSelectedItem(null);	},		/**	 * 获取选中项的值，如果每天项被选中，则返回 null 。	 */	getValue: function(){		var selectedItem = this.getSelectedItem();		return selectedItem ? this.baseGetValue(selectedItem) : this.formProxy ? this.formProxy.value : null;	},		/**	 * 查找并选中指定值内容的项。如果没有项的值和当前项相同，则清空选择状态。	 */	setValue: function(value){				// 默认设置为值。		if(this.formProxy)			this.formProxy.value = value;					var t;				this.each(function(item){			if(this.baseGetValue(item) === value){				t = item;				return false;			}		}, this);				return this.setSelectedItem(t);	},		copyItemsFromSelect: function(select){		if(select.name){			this.setName(select.name);			select.name = '';		}		for(var node = select.firstChild; node; node = node.nextSibling) {			if(node.tagName  === 'OPTION') {				var item = this.add(Dom.getText(node));									item.value = node.value;				if(node.selected){					this.setSelectedItem(item);				}			}		}				if(select.onclick)			this.node.onclick = select.onclick;				if(select.onchange)			this.on('change', select.onchange);			}	});
/*********************************************************
 * Controls.Form.Suggest
 *********************************************************/
/** * @author  *//** * 用于提示框的组件。 */var Suggest = ComboBox.extend({		dropDownWidth: 'auto',		getSuggestItems: function(text){		if(!this.items){			this.items = [];			this.dropDown.each(function(item){				this.items.push(item.getText());			}, this);		}				text = text.toLowerCase();		return this.items.filter(function(value){			return value.toLowerCase().indexOf(text) >= 0;		});	},		setSuggestItems: function(value){		this.dropDown.set(value);		return this;	},		/**	 * 向用户显示提示项。	 */	showSuggest: function(){		var text = Dom.getText(this.node);		var items = this.getSuggestItems(text);				if(!items || !items.length || (items.length === 1 && items[0] === text))  {			return this.hideDropDown();		}				this.dropDown.set(items);				this.showDropDown();				// 默认选择当前值。		this._setHover(this.dropDown.item(0));	},		onKeyUp: function(e){		switch(e.keyCode) {			case 40:			case 38:			case 13:			case 36:			case 37:			    return;		}						this.showSuggest();	},		// 重写 onDropDownShow 和 onDropDownHide		setText: Dom.prototype.setText,		getText: Dom.prototype.getText,		onDropDownShow: IDropDownOwner.onDropDownShow,		onDropDownHide: IDropDownOwner.onDropDownHide,		updateText: function(item){		this.setText(item.getText());	},		init: function(options){				var suggest = this.createDropDown().addClass('x-suggest');				// UI 上增加一个下拉框。		this.setDropDown(suggest);				// 绑定下拉菜单的点击事件		this.dropDown			.itemOn('mouseover', this._setHover, this)			.itemOn('mousedown', this.onItemClick, this);
		this.on('keydown', this.onKeyDown);
		this.on('focus', this.showSuggest);		this.on('blur', this.hideDropDown);
		this.on('keyup', this.onKeyUp);				this.setAttr('autocomplete', 'off');			}	});
/*********************************************************
 * Controls.Core.Common
 *********************************************************/
/** * @author  */