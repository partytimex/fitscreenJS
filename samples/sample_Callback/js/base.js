/***************************************************************************************************************
	模拟ECMAScript5常用的API
	說明：
	1.覆蓋原生Array.prototype.indexOf 與 Array.prototype.lastIndexOf方法
	  --理由：避免[123,3,5].indexOf(new Number(123)) = -1的情況
	2.除上述兩個，餘下的優先採用瀏覽器原生方法
****************************************************************************************************************/
if(!Function.prototype.bind){
	Function.prototype.bind = function (boundThis) {
		var _slice = [].slice,
			//this預綁定參數方法
			targetFunction = this,
			boundArgs = _slice.call(arguments, 1),
			F = function () {
				//作為構造器的情況
				if(this instanceof F){
					//採用new方式調用F(this == fn的一個實例)
					var obj,
						ret,
						//新建一個構造器
						temp = function () {};
					temp.prototype = targetFunction.prototype;
					obj = new temp;//obj只擁有目標函數的原型，不具備實例變量
					ret = targetFunction.apply(obj, boundArgs.concat(_slice.call(arguments)));
					//允許目標函數返回自身，IE8-與其他瀏覽器行為保持一致
					return (typeof ret == 'object' || typeof ret == 'function') && ret !== null ? ret : obj;
				}
				//採用普通方式調用F(this == window)
				return targetFunction.apply(boundThis, boundArgs.concat(_slice.call(arguments)));
			};
		return F;  
	};
}

if (!Array.prototype.forEach) { 
	Array.prototype.forEach = function(f, oThis) {
		if (!f || f.constructor != Function.toString()) return;
		oThis = oThis || window;
		for (var i = 0, len = this.length; i < len; i++) {
			f.call(oThis, this[i], i, this); //p1 上下文环境 p2 数组元素 p3 索引 p4 数组对象
		}
	}
}

if (!Array.prototype.filter) {
	Array.prototype.filter = function(f, oThis) {
		if (!f || f.constructor != Function.toString()) return;
		oThis = oThis || window;
		var a = [];
		for (var i = 0, len = this.length; i < len; i++) {
			if (f.call(oThis, this[i], i, this)) a.push(this[i]);
		}
		return a;
	}
}

if (!Array.prototype.map) {
	Array.prototype.map = function(f, oThis) {
		if (!f || f.constructor != Function.toString()) return;
		oThis = oThis || window;
		var a = [];
		for (var i = 0, len = this.length; i < len; i++) {
			a.push(f.call(oThis, this[i], i, this));
		}
		return a;
	}
}

if (!Array.prototype.every) {
	Array.prototype.every = function(f, oThis) {
		if (!f || f.constructor != Function.toString()) return;
		oThis = oThis || window;
		for (var i = 0, len = this.length; i < len; i++) {
			if (!f.call(oThis, this[i], i, this)) return false;
		}
		return true;
	}
}

if (!Array.prototype.some) {
	Array.prototype.some = function(f, oThis) {
		if (!f || f.constructor != Function.toString()) return;
		oThis = oThis || window;
		for (var i = 0, len = this.length; i < len; i++) {
			if (f.call(oThis, this[i], i, this)) return true;
		}
		return false;
	}
}

//比较对象是否于参数obj 相等..
function compare(obj1, obj2) {
	if (obj1 == null || obj2 == null) return (obj1 === obj2);
	//避免[1,2,3].constructor != ele('iframe').contentWindow.Array->obj1.constructor.toString() == obj2.constructor
	return (obj1 == obj2 && obj1.constructor.toString() == obj2.constructor);
}

//修复ff等其他实现 indexOf方法的浏览器中值类型于引用类型比较相等性一律返回false问题
Array.prototype.indexOf = function(obj) {
	for (var i = 0, len = this.length; i < len; i++) {
		if (compare(this[i], obj)) return i;
	}
	return -1;
}

//修复ff等其他实现 indexOf方法的浏览器中值类型于引用类型比较相等性一律返回false问题
Array.prototype.lastIndexOf = function(obj) {
	for (var i = this.length - 1; i >= 0; i--) {
		if (compare(this[i], obj)) return i;
	}
	return -1;
}

if (!String.prototype.trim) {
    var trimBeginRegexp = /^\s+/; // /\s+/ == /^\s+/ == /^\s+/g (IE8-要顯式用/^\s+/)
    var trimEndRegexp = /\s+$/; // /\s+$/ == /\s+$/g
    String.prototype.trim = function () {
        return String(this).replace(trimBeginRegexp, '').replace(trimEndRegexp, '');
    };
}

if(typeof document.getElementsByClassName != 'function'){  
	document.getElementsByClassName = function(classname){  
		var d=document;  
		var e=d.getElementsByTagName('*');  
		var c=new RegExp('\\b'+classname+'\\b');  
		var r=[];  
		  
		for(var i=0,l=e.length;i<l;i++){  
			var cn=e[i].className;  
			if(c.test(cn)){  
				r.push(e[i]);  
			}  
		}  
		return r;  
	};  
}

if(typeof document.querySelectorAll != 'function'){  
	var s=document.createStyleSheet();
	document.querySelectorAll = function(r, c, i, j, a) {
		a=document.all, c=[], r = r.replace(/\[for\b/gi, '[htmlFor').split(',');
		for (i=r.length; i--;) {
			s.addRule(r[i], 'k:v');
			for (j=a.length; j--;) a[j].currentStyle.k && c.push(a[j]);
			s.removeRule(0);
		}
		//IE8- 与DOM书写顺序相反,倒序处理
		return c.reverse();
	}
}

//擴展字符串提取數字
String.prototype.toNum = function () {
	var regexp = /^-*\d+/
		,result = String(this).match(regexp)[0]; //String(this).match 返回類型數組
	return result == null ? 0 : parseFloat(result);
};

/***************************************************************************************************************
	微型庫
	1.基於ECMAScript5
	2.API遵循Jquery
	3.兼容Mobile,Desktop
	4.收納項目中常用方法
****************************************************************************************************************/
var DS
	,Q;

DS = (function() {
	var nmg, EMPTY_ARRAY, _slice;
	_slice = [].slice;
	EMPTY_ARRAY = [];
	nmg = function(selector) {
		var dom;
		/*  對象獲取器參數
			1.selector：選擇符 string 或對象 document / element / window / documentFragment
		*/
		dom = nmg.getDOMObject(selector);
		return Q(dom);
	};
	Q = function(dom) {
		/*	
			1.dom.__proto__ = Q.prototype; // DOM Object->webkit SUPPORT,FF等 NOT SUPPORT
			2.for(var fn in Q.prototype){ dom.__proto__[fn] =  Q.prototype[fn]; } // 當擴展方法與DOM Object屬性同名時失效 如style
			處理：將DOM Object組裝到數組。之後問題：
			1.dom.__proto__ = Q.prototype; // IE8- NOT SUPPORT
			處理：對數組逐一添加擴展的方法
		*/
		for(var fn in Q.prototype){ dom[fn] =  Q.prototype[fn]; }
		return dom;
	};
	nmg.extend = function(target) {
		_slice.call(arguments, 1).forEach(function(source) {
			var key, _results;
			_results = [];
			for (key in source) {
					_results.push(target[key] = source[key]);
			}
			return _results;
		});
		return target;
	};
	//fn 旗下方法賦予給通過nmg('id')獲取的DOM元素，但不具備nmg.xxx類似的方法
	Q.prototype = nmg.fn = {};
	return nmg;
})();

window.DS = DS;

"nmg" in window || (window.nmg = DS);

//特性檢測
nmg.support = (function() {
	"use strict";
	var support
		,div = document.createElement("div")
		,ipt = document.createElement("input");
	// Setup
	div.setAttribute( "className", "t" );
	var has3d = function () {
		var style = document.documentElement.style,
			str = 'perspective',
			css3s = 'Webkit Moz O ms'.split(' '),
			cstr = str.charAt(0).toUpperCase() + str.substr(1),  //首字母转换成大写
			rstr = (cstr + ' ' + css3s.join(cstr + ' ') + cstr).split(' '),//属性都加上前缀
			result = null; 
		for(var i=0,len=rstr.length;i<len;i++){
			if(rstr[i] in style){
				result = rstr[i];
				break;
			}
		}
		return !!result;
	};
	support = {
		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
		getSetAttribute : div.className !== "t"
		// 是否支持oninput事件
		,hasOnInput : typeof ipt.oninput == 'object'
		// 是否支持觸屏事件
		,hasTouch : "ontouchstart" in window
		,has3d : has3d()
	};
	return support;
})();

//檢測器
nmg.browser = (function() {
	"use strict";
	 var ua = navigator.userAgent.toLowerCase()
		  ,isOpera = (/opera/i).test(ua)
		  ,isAndroid = (/android/i).test(ua)
	      ,isUC = navigator.appVersion.indexOf("UC")!= -1
          ,isMeeGo = (/meego/i).test(ua)
          ,isWP = (/windows phone os/i).test(ua)
		  ,isIOS = (/mac os/i).test(ua);
	return {
		ua_lowerCase : ua.toLowerCase() //稳健
		//设备检测
		,isIPad : (/ipad/i).test(ua) //稳健
		,isIPhoneOrIPod : (/iphone/i).test(ua) || (/ipod/i).test(ua) //稳健
		,isNexus7 : window.devicePixelRatio == 1.3312499523162842 //临时
		//系统检测
		,isIOS : isIOS //稳健
		,isAndroid : isAndroid //稳健
		,isWP : isWP //稳健
		,isMeeGo : isMeeGo //稳健
		//浏览器检测
		,isUC : isUC //稳健
		,isOpera : isOpera //稳健
		,isIE : (/msie/i).test(ua) //稳健
		,isChrome : (/chrome/i).test(ua) //稳健
		,isAndroidOriginalBrowser : isAndroid && !isUC && !isOpera //半稳健	  除了UC Opera Mobile/HD 还有其他浏览器，如QQ浏览器等
		,isDesktop : !isWP && !isIOS && !isAndroid && !isMeeGo && !(/opera mobi/i).test(ua) //半穩健_已使用 手机系统还有塞班等
		,isSamSungPad : window.devicePixelRatio == 1 && !isIOS //不穩健 Android下的UC等瀏覽器也可能與此判斷匹配
		,isFirefox : /mozilla/.test(ua) //稳健
		,isWebkit : /webkit/.test(ua)	 //稳健
	}
})();

//Screen
nmg.screen = (function() {
	"use strict";
	return function(){
		return {
			getWidth: function(){ 
				return typeof window.innerWidth != 'undefined' 
				? window.innerWidth : document.getElementsByTagName('html')[0].clientWidth;
			}
			,getHeight: function(){
				return typeof window.innerHeight != 'undefined' 
				? window.innerHeight : document.getElementsByTagName('html')[0].clientHeight;
			}
		}
	}();
})();

//全局變量
var arr = []
	,pop = arr.pop
	,push = arr.push
	,slice = arr.slice
	,_forEach = arr.forEach
	,_map = arr.map
	,propFix = {
		tabindex: "tabIndex",
		readonly: "readOnly",
		"for": "htmlFor",
		"class": "className",
		maxlength: "maxLength",
		cellspacing: "cellSpacing",
		cellpadding: "cellPadding",
		rowspan: "rowSpan",
		colspan: "colSpan",
		usemap: "useMap",
		frameborder: "frameBorder",
		contenteditable: "contentEditable"
	}
	,vendor = nmg.browser.isWebkit ? "webkit":
				nmg.browser.isFirefox ? "Moz": 
				nmg.browser.isOpera ? "O":
				nmg.browser.isIE ? "ms":
				""
	,eventFix = {
		click: nmg.support.hasTouch ? 'touchstart' : 'click'
		,resize: "onorientationchange" in window ? "orientationchange": "resize"
		,mousedown: nmg.support.hasTouch ? "touchstart" : "mousedown"
		,mousemove: nmg.support.hasTouch ? "touchmove" : "mousemove"
		,mouseup: nmg.support.hasTouch ? "touchend" : "mouseup"
		,transitionend : nmg.browser.isWebkit ? "webkitTransitionEnd":
			nmg.browser.isFirefox ? "transitionend": 
			nmg.browser.isOpera ? 'otransitionend': //不使用"oTransitionEnd"原因:opera event.type为'otransitionend'
			nmg.browser.isIE ? "MSTransitionEnd": //IE9 依旧不支持，目前只有IE10支持
			""
		,input: nmg.support.hasOnInput ? "input" : "propertychange"
	}
	,cssFix = {
		transitionduration : vendor + "TransitionDuration"
		,transform : vendor + "Transform"
		,translate : vendor + "Transform"
		,perspective : vendor + 'Perspective'
	}
	,mouseButton = {
		button:{
			left: 0//IE9已经更正为0，IE8-:nmg.browser.isIE ? 1 : 0(目前不对IE8-做兼容性处理)
			,center: nmg.browser.isIE ? 4 : 1
			,right: 2
		}	
	}
	,getSetAttribute = nmg.support.getSetAttribute;

// Use a stripped-down slice if we can't use a native one
try {
	slice.call( docElem.childNodes, 0 )[0].nodeType;
} catch ( e ) {
	slice = function( i ) {
		var elem,
			results = [];
		for ( ; (elem = this[i]); i++ ) {
			results.push( elem );
		}
		return results;
	};
};

//DOM(已作鍊式處理)
(function(nmg) {
	/*
		1.不允許參數列表有同名參數
		2.不允許未經聲明的變量
	*/
	"use strict";
	var OBJECT_PROTOTYPE, CLASS_SELECTOR, ID_SELECTOR, TAG_SELECTOR, IS_HTML_FRAGMENT, HTML_CONTAINERS
		, _existsClass, _computedStyle, _toElesArray, _find, _getPxCssVal, _sizeAccess, _eq, _Q;
	OBJECT_PROTOTYPE = Object.prototype;
	CLASS_SELECTOR = /^\.([\w-]+)$/;
	ID_SELECTOR = /^#[\w\d-]+$/;
	TAG_SELECTOR = /^[\w-]+$/;
	IS_HTML_FRAGMENT = /^\s*<(\w+|!)[^>]*>/;
	HTML_CONTAINERS = document.createElement("div");

	_existsClass = function(name, className) {
		var classes;
		classes = className.split(/\s+/);	//split(/\s+/) == split(/\s+/g)
		return classes.indexOf(name) >= 0;
    };

	_computedStyle = function(element, property) {
		var ret = (element.currentStyle? element.currentStyle : window.getComputedStyle(element, null))[property];
		if( ret == 'auto' || ret.indexOf('%') > 1 ){
			switch(property){
				case 'width':
					ret = element.clientWidth + 'px';
					break;
				case 'height':
					ret = element.clientHeight + 'px';
					break;
				default:
					break;
			}
		}
		return ret;
	};

	// HTMLCollection / NodeList 裡的DOM元素抽到數組
	_toElesArray = function(nodelist){
		var elements
			,results = []
			,elementTypes = [1, 9, 11];
		elements = [];
		push.apply( results, slice.call(nodelist, 0) );
		_forEach.call( results, function(value){
			if( typeof value.nodeType != 'undefined' && elementTypes.indexOf(value.nodeType) >= 0){
				elements.push(value);
			}
		});
		return elements;	
	};

	nmg.toType = function(obj) {
		return OBJECT_PROTOTYPE.toString.call(obj).match(/\s([a-z|A-Z]+)/)[1].toLowerCase();
	};

	nmg.isObjArray = function(dom){
		if( !!dom && typeof dom.append == 'function' ){
			return true;
		}
		return false;
	};

	nmg.fn.closest = function(tagName){
		var ret = []
			,tagName = tagName.toUpperCase();
		_forEach.call(this, function(element){
			while (element.tagName !== tagName) {
				element = element.parentNode;
			};
			ret.push(element);
		});
		ret.prevObject = this;
		return Q(ret);
	};

	nmg.query = function(selector) { 
		var elements;
		selector = selector.trim();
		if( CLASS_SELECTOR.test(selector) ){
			// IE8- NOT SUPPORT
			return _toElesArray( document.getElementsByClassName(selector.replace(/^./,'')) );
		}else if( ID_SELECTOR.test(selector) ){
			return [ document.getElementById(selector.replace(/^#/,'')) ];
		}else if( TAG_SELECTOR.test(selector) ){
			return _toElesArray(document.getElementsByTagName( selector ));
		}else{
			// IE8- NOT SUPPORT
			return _toElesArray(document.querySelectorAll( selector ));
		};
	};

	_find = function(selector, Mode){
		var ret = []
			,hasChild = function(element){ return element.children.length > 0; }
			,isMatch = function(element){ return  selector == element; }
			,self = this[0]
			,recursion = function(element){ //遞歸
				isMatch(element) && self != element && ret.push(element);
				if( hasChild(element) ){
					_forEach.call(element.children, function(element){
						recursion(element);
					});
				};
			};
		
		if(Mode == 'string'){
			selector = selector.trim();	
			if( CLASS_SELECTOR.test(selector) ){
				isMatch = function(element){ 
					var arr = !!nmg(element).attr('class') ? nmg(element).attr('class').split(' ') : []; 
					for(var i = 0; i < arr.length; i++){
						if( arr[i] == selector.replace(/^./,'') )	{
							return true;
						}
					};			
					return false;
				};
			}else if( ID_SELECTOR.test(selector) ){
				isMatch = function(element){ return nmg(element).attr('id') == selector.replace(/^#/,''); }		
			}else if( TAG_SELECTOR.test(selector) ){
				isMatch = function(element){ return  element.tagName.toLowerCase() == selector.toLowerCase(); }		
			}
		}else if(Mode == 'objs'){
			isMatch = function(element){
				var ret = false;
				_forEach.call(selector, function(ele){
					if(ele == element){
						ret = true;
					}
				});
				return ret;
			};
		};
		_forEach.call(this, function(element){
			recursion(element);
		});			
		return ret;
	};
	
	nmg.fn.end = function(){
		return this.prevObject;
	};

	//“破坏性”操作
	nmg.fn.find = function(selector){
		var elementTypes, type, ret;
		elementTypes = [1, 3, 9, 11];
		type = nmg.toType(selector);
		if (type === "string") {
			ret = _find.call(this, selector, 'string');
		}else if(elementTypes.indexOf(selector.nodeType) >= 0){
			ret = _find.call(this, selector, 'obj');
		}else if( nmg.isObjArray(selector) ){
			ret = _find.call(this, selector, 'objs');
		}
		ret.prevObject = this;
		return Q(ret);
	};

	_Q = function(dom) {
		for(var fun in nmg.fn){ dom[fun] = nmg.fn[fun]; }
		return dom;
	};	

	_eq = function(i){
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		var ret = j >= 0 && j < len ? [ this[j] ] : [];
		return _Q(ret);
	};

	nmg.fn.first = function() {
		var ret = _eq.call(this, 0);
		ret.prevObject = this;
		return ret;
	};

	nmg.fn.last =  function() {
		var ret = _eq.call(this, -1);
		ret.prevObject = this;
		return ret;
	};

	nmg.fn.eq =  function(i) {
		var ret = _eq.call(this, i);
		ret.prevObject = this;
		return ret;
	};

	nmg.getDOMObject = function(selector) { 
		var elementTypes, type, domobj;
		//節點類型: 1.ELEMENT_NODE 2.ATTRIBUTE_NODE 3.TEXT_NODE 8.COMMENT_NODE 9.DOCUMENT_NODE 11.DOCUMENT_FRAGMENT_NODE
		//http://www.w3schools.com/dom/dom_nodetype.asp
		//Notes: iframe.nodeType -> 1, document.createDocumentFragment().nodeType -> 11, window.nodeType -> undefined
		elementTypes = [1, 3, 9, 11];
		type = nmg.toType(selector);
		
		if (type === "string" && IS_HTML_FRAGMENT.test(selector)) { //創建元素 nmg("<a href='#'></a>")
			domobj = nmg.fragment(selector);
		}else if (type === "string"){
			domobj = nmg.query(selector);
		}else if(elementTypes.indexOf(selector.nodeType) >= 0 || selector === window){
			domobj = [selector];
		}else if(nmg.isObjArray(selector)){
			return selector;
		}else if(type === 'htmlcollection' || typeof selector.length == 'number'){
			return _toElesArray(selector);
		}
		return domobj;
	};

	nmg.fragment = function(markup){
		var container = HTML_CONTAINERS;
		container.innerHTML = markup.trim();
		return _map.call(container.childNodes, function(element, index, array) {
			return container.removeChild(element);
		});	
	};
	
	nmg.fn.clone = function(){
		var ret = this.map( function(element){
			return element.cloneNode(true);
		});
		return _Q(ret);
	};
	
	nmg.fn.before = function(t){
		_forEach.call(this, function(element){
			var parentNode = element.parentNode;
			for(var i = 0; i < nmg(t).length; i++){ 
				parentNode.insertBefore(nmg(t)[i], element);
			}
		});	
	};

	// 移除節點
	nmg.fn.remove = function(){
		_forEach.call(this, function(element){
			var parentNode = element.parentNode;
			parentNode.removeChild(element);
		});	
	};

	nmg.fn.append = function(markup){
		var domobj = nmg.isObjArray(markup) ? markup : nmg(markup);
		if( !!domobj && domobj.length > 0 ){
			_forEach.call(this, function(element, idx){
				domobj = idx > 0 ? nmg(domobj).clone() : domobj;
				_forEach.call(domobj, function(ele){
					element.appendChild(ele);
				});
			});
		}

		return this;
	};

	nmg.fn.appendTo = function(selector){
		nmg(selector).append(this);
		return this;
	};

	//自身有返回值，不作鍊式處理
	nmg.fn.hasClass = function(name) {
		return _existsClass(name, this[0].className);
    };

	nmg.fn.addClass = function(name) {
		_forEach.call(this, function(element){
			if (!_existsClass(name, element.className)) {
				element.className += " " + name;
				element.className = element.className.replace(/\s+/g, " ").trim();
			}
		});
		return this;
	};

	nmg.fn.removeClass = function(name) {
		var proceed = arguments.length === 0 || typeof name === "string" && name;
		name = name.match(/\S+/g);
		_forEach.call(this, function(element){
			if (proceed) {
				if (!name) {
					element.className = '';
				}else {
					var arr = element.className.split(/\s+/);
					name.forEach(function(val){
						if (_existsClass(val, element.className)) {
							for(var i = 0; i < arr.length; i++){
								  if( arr[i] == val ){
									   delete arr[i];
								  }
							}
						}	
					});
					element.className = arr.join(' ').replace(/\s+/, ' ');
				}
			}
		});
		return this;
	};
	
	nmg.fn.css = function(property, value) {
		var rdashAlpha = /-([\da-z])/gi
			,rmsPrefix = /^-ms-/
			,fcamelCase = function( all, letter ) {
				return letter.toUpperCase();
			}
			,camelCase = function( string ) {
				return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
			}
			,has3d = nmg.support.has3d
			,value = property.toLowerCase() == 'translate'  && value != void 0 && value != 'none'? 
				( 'translate' + (has3d ? '3d(': '(') + value + (has3d ? ',0)': ')') )
				: value
			,property = camelCase( !!cssFix[property] ? cssFix[property] : property );
		if ( typeof value !== 'undefined' ) {
			_forEach.call(this, function(element) {
				element.style[property] = value;
			});
		} else {
			var computeStyleResult = _computedStyle(this[0], property);
			return this[0].style[property] || (computeStyleResult == 'auto' || computeStyleResult == '' ? '0px' : computeStyleResult);
		}
		return this;
	};

	_getPxCssVal = function(value){
		return typeof value == 'number' ? value + 'px' : typeof value == 'string' ? value : 0;
	};

	_sizeAccess = function(val, isWidth){
		var attr = isWidth ? 'width' : 'height';
		if( val != void 0 ){
			if( typeof val != 'function' ){
				this.css(attr, _getPxCssVal(val));
			}else{
				var idx = 0, width;
				_forEach.call(this, function(element) {
					width = val(idx, nmg(element).css(attr));
					nmg(element).css(attr, _getPxCssVal(width));
					idx++;
				});				
			}
		}
		else{
			return this.css(attr);
		}
		return this;
	};
	
	nmg.fn.width = function(val) {
		return _sizeAccess.call(this, val, true);
	};

	nmg.fn.height = function(val) {
		return _sizeAccess.call(this, val, false);
	};

	nmg.fn.show = function() {
		//使用this.css('display', 'block') 替代 this.css('display', '')原因，display:none比display:''要更高
		return this.css('display', 'block');
	};

	nmg.fn.hide = function() {
		return this.css("display", "none");
	};

	nmg.fn.html = function(cnt){
		var element = this[0]
			,hasTextContent = typeof element.textContent != 'undefined'
			,isScriptNode = element.nodeName.toLowerCase() == 'script'
			,hasInnerText = typeof element.innerText != 'undefined'
			,argLength = arguments.length
			,textContent = '';

		_forEach.call(this, function(element){
			if( argLength === 0 ){
				if( hasTextContent ){
					textContent = element.textContent;	
				}else if( isScriptNode ){
					textContent = element.text;
				}else if( hasInnerText ){
					textContent = element.innerText;		
				}			
			}else if( typeof cnt === 'number' || typeof cnt === 'string' ){
				if( hasTextContent ){
					element.textContent = cnt;	
				}else if( isScriptNode ){
					element.text = cnt; 
				}else if( hasInnerText ){
					element.innerText = cnt;		
				}			
			}		
		});
		if( argLength === 0 ){
			return textContent;
		}
	};

	nmg.fn.empty = function(){
		this.html('');
	};

	nmg.fn.attr = function(name, value) {
		// null/0/false !== void 0; undefined === void 0;
		// 0/false != void 0; undefined/null == void 0;
		if (nmg.toType(name) === "string" && value === void 0) {
			var _this = this[0];
			if(typeof _this.getAttribute != 'undefined'){
				if( name == 'class' && nmg.toType(_this.attributes) == 'object' ){
					//IE7 Use: this[0].getAttribute(name).nodeValue 
					//nmg.toType(_this.attributes)
					//IE7-8:'object'
					//Other:'namednodemap'
					return !!_this.attributes(name) && _this.attributes(name).nodeValue ? _this.attributes(name).nodeValue : '';
				}else if(name == "href"){
					//IE7 返回絕對路徑 修正為this[0].getAttribute( name, 2 )
					return _this.getAttribute( 'href', 2 );
				}else{
					return _this.getAttribute(name);
				}
			}
		} else {
			if( value === null ){
				nmg.fn.removeAttr.call(this,name);
				return;
			}
			_forEach.call(this, function(element) {
				return element.setAttribute(name, value);
			});
		}
		return this;
	};

	nmg.fn.removeAttr = function(name) {
		var propName = propFix[ name ] || name;
		_forEach.call(this, function(element) {
			element.removeAttribute( getSetAttribute ? name : propName ); // IE7- 'className'
		});
		return this;
	};
	//自身有返回值，不作鍊式處理
	nmg.fn.index = function() {
		//return index in parent
		if( this[0] && this[0].parentNode ){
			var currEle = this[0]
				,parentChildren = currEle.parentNode.children;
			for( var i = 0; i < parentChildren.length; i++){
				if(currEle === parentChildren[i]){
					return i;
				}
			};
		}else{
			return -1;
		}
	};
})(DS);

//Extend
(function(nmg) {
	"use strict";
	var _set;

	nmg.extend = function(obj, ext_obj) {
		ext_obj = ext_obj || {};
		for (var key in ext_obj) {
			obj[key] = ext_obj[key];
		}
		return obj;		
	};
})(DS);

//Event
(function(nmg) {
	//"use strict";
	var HANDLERS, ELEMENT_ID, READY_EXPRESSION, _createProxyCallback, _getElementId,
		_subscribe, _findHandlers, _unsubscribe, _getEventName, _getCallBack, _getNormalEvent;
	ELEMENT_ID = 1; 
	HANDLERS = {};
	READY_EXPRESSION = /complete|loaded|interactive/;

	nmg.fn.ready = function(callback) {
		/*safari 在strict Mode下不允許產生未聲明的變量*/
		var st = setTimeout;
		if (nmg.browser.isWebkit) { // safari
			setTimeout(function(){
				if ( READY_EXPRESSION.test(document.readyState) ) {
					callback();
				} else {
				  setTimeout(arguments.callee,10);
				}
			}, 10); 
		} else if ( (
			( nmg.browser.isFirefox && !nmg.browser.isCompatible )
			|| nmg.browser.isOpera ) ) { // opera/moz
			nmg(document).bind("DOMContentLoaded", callback);
		} else if (nmg.browser.isIE) {
			(function (){ 
				var tempNode = document.createElement('document:ready'); 
				try {
					tempNode.doScroll('left'); 
					callback(); 
					tempNode = null; 
				} catch(e) { 
					st(arguments.callee, 0); 
				} 
			})();
		} else {
			window.onload = callback;
		}
	};

	//將event參數正常化
	_getNormalEvent = function(event){
		//不能通過opera 嚴格模式，其他瀏覽器嚴格模式沒問題
		!!event.srcElement && (event.target = event.srcElement);
		//event.point = nmg.support.hasTouch ? event.touches[0] : undefined; // mobile 產生問題
		return event;
	};

	_createProxyCallback = function(callback, callbackTarget) {
		var proxy;
		callback = callback;
		proxy = function(event) {
				var result;
				event = _getNormalEvent(event);
				result = callback.apply(callbackTarget, [event]);
				if (result === false) {
					nmg.preventDefault(event);
				}
				return result;
		};
		return proxy;
	};

	_getElementId = function(element) {
		return element._id || (element._id = ELEMENT_ID++);
	};

	_subscribe = function(element, callbackTarget, event, callback) {
		var handler, element_id, element_handlers;
		element_id = _getElementId(element);
		element_handlers = HANDLERS[element_id] || (HANDLERS[element_id] = []); 
		handler = {
			event: event,
			callback: callback,
			proxy: _createProxyCallback(callback, callbackTarget),
			index: element_handlers.length
		};
		element_handlers.push(handler);	
		return nmg.fn.addHandler(element, handler.event, handler.proxy);
	};

	_findHandlers = function(element_id, event, fn) {
		return (HANDLERS[element_id] || []).filter(function(handler) {
		return handler && (!event || handler.event === event) && (!fn || handler.callback === fn) }
	)};

	_unsubscribe = function(element, event, callback) {
		var element_id;
		element_id =  _getElementId(element);
		return _findHandlers(element_id, event, callback).forEach(function(handler) {
			delete HANDLERS[element_id][handler.index];
			return nmg.fn.removeHandler(element, handler.event, handler.proxy);
		});
    };
	
	_getEventName = function(event){
		var ret = typeof eventFix[event] == 'undefined' ? event : eventFix[event];
		return ret;
	};

	nmg.preventDefault = function(evt){
		if( evt && evt.preventDefault ) evt.preventDefault();
		else window.event.returnValue = false; 			
	};

	_getCallBack = function(callback){
		var hasHandleEvent = typeof callback.handleEvent == 'function';
		return {
			callback : hasHandleEvent ? callback.handleEvent : callback
			,target : hasHandleEvent ? callback : undefined
		};
	};

    nmg.fn.bind = function(event, callback) {
		var callbackInfo = _getCallBack(callback);
		event = _getEventName(event);
		_forEach.call(this, function(element, index){
			element._index = index;
			var callbackTarget = !!callbackInfo.target ? callbackInfo.target : element;
			_subscribe(element, callbackTarget, event, callbackInfo.callback);
		});
	};
        
	nmg.fn.unbind = function(event, callback) {
		var callbackInfo = _getCallBack(callback);
		event = _getEventName(event);
		_forEach.call(this, function(element){
			_unsubscribe(element, event, callbackInfo.callback);
		});
	};

	nmg.fn.addHandler =  function(ele, type, handler){
		if(ele.addEventListener){
			ele.addEventListener(type,handler,false);
		}else if(ele.attachEvent){//IE8-
			ele.attachEvent('on' + type,handler);
		}else{
			ele['on' + type] = handler;
		}
	};

	nmg.fn.removeHandler =  function(ele, type, handler){
		if(ele.removeEventListener){
			ele.removeEventListener(type,handler,false);
		}else if(ele.detachEvent){
			ele.detachEvent('on' + type, handler);
		}else{
			ele['on' + type] = null
		}
	};
})(DS);

//Animation
(function(nmg) {
	"use strict";
	var tween, getJsonMap, css, init, go, play, stop, delay, Animate, _getTime;

	tween = {
		eain:function(t, b, c, d){ return - c * (t /= d) * (t - 2) + b}
	};

	getJsonMap = function(jsonMap){
		var arr = [];
		var a = null;
		for(a in jsonMap){
			var json = {};
			var test = String(jsonMap[a]).match(/(-*\d+)($|([a-z]+))/);
			json.interval = null;
			json.style = a;
			json.val = typeof jsonMap[a] == "number" ? jsonMap[a] : parseFloat(test[1]);
			json.px = test[3];
			arr[arr.length] = json;
		}
		return arr;
	};

	//获取Element对象css属性值
	css = window.getComputedStyle ?
		function(a, b, c){
			if( c == undefined){
				b = b.replace(/([A-Z])/g, "-$1");
				b = b.toLowerCase();
				return window.getComputedStyle(a, null).getPropertyValue(b);
			}else{
				a.style[b] = c;
			}
		}
		:function(a, b, c){
			if( c == undefined){
				if(b == "opacity"){
					return a.style.filter.indexOf("opacity=") >= 0 ? parseFloat(a.style.filter.match(/opacity=([^)]*)/)[1]) / 100 : "1";
				}else { 
					return a.currentStyle[b] == "auto" ? 0 : a.currentStyle[b];}
				}else{
				if(b == "opacity"){
					a.style.filter = (a.filter || "").replace(/alpha\([^)]*\)/, "") + "alpha(opacity=" + c * 100 + ")";
				}else{ 
					a.style[b] = c 
				}
			}
		}; 

	go = function(element, style, val, callBack, time, px, systemCallBack){
		px = px || '';
		var b = parseFloat( css(element, style) ) || 0;
		val = val - b;
		var st = new Date().getTime();
		var a = setInterval(function(){
			var t = new Date().getTime() - st;
			if( t > time){
				t = time;
				clearInterval(a);
				callBack&&callBack(element);
			}
			css(element, style, parseFloat(tween.eain(t, b, val, time))+ px, 2);
			}, 10);
		return a;
	};

	play = function(element){
		var config = element._animateConfig;
		if(config.delay){
			setTimeout(function(){ play(element); }, config.delay);
			element._animateConfig.delay = 0;
			return element;
		}

		var callBack = config.callBack;
		var time = config.time;
		var i = 0;
		var j = 0;
		var len = config.jsonMap.length;

		var systemCallBack = function(){
			if(++j == len){
				callBack && callBack(element);
			};
		}

		for(; i<len; i++){
			var style = config.jsonMap[i].style
				,val = config.jsonMap[i].val
				,px = config.jsonMap[i].px;
			element._animateConfig.jsonMap[i].interval = go(element, style, val, callBack, time, px, systemCallBack);
		}
		return element;
	};

	nmg.speeds = {		
		slow: 600,
		fast: 200,
		// Default speed
		_default: 400
	};

	nmg.getTime = function(speed){
		var time;
		time = nmg.speeds['_default'];
		if( typeof speed == 'string' ){
			typeof nmg.speeds[speed] != 'undefined' && ( time = nmg.speeds[speed] );
		}else if( typeof speed == 'number' ){
			time = speed; 
		}
		return time;
	};

	nmg.fn.animate = function(jsonMap, speed, callBack){
		typeof speed == 'function' && ( callBack = speed );
		_forEach.call(this, function(element, index, array) {
			element['_animateConfig'] = {
				delay:0,
				jsonMap:getJsonMap(jsonMap),
				time: nmg.getTime(speed),
				callBack: callBack && callBack.bind(element)
			};
			element = play(element);
		});
		return this;
	};

	nmg.fn.fadeIn= function(speed, callBack){
		this.css('opacity', 0);
		this.show();
		typeof speed == 'function' && ( callBack = speed );
		nmg.fn.animate.call(this, { opacity: '1' }, nmg.getTime(speed), callBack);
	};

	nmg.fn.fadeOut= function(speed, callBack){
		typeof speed == 'function' && ( callBack = speed );
		nmg.fn.animate.call(this, { opacity: '0' }, nmg.getTime(speed), callBack);
	}
})(DS);

//Mobile 
(function(nmg) {
	"use strict";
	/* 打開頁面或刷新頁面時隱藏地址欄 */
	nmg.hideAddressBar = function(){
		window.onload = function(){
			setTimeout(function(){
				window.scrollTo(0, 0);
			}, 0);			
		};
	}
})(DS);

//集成常用方法(已作鍊式處理)
(function(nmg) {
	"use strict";
	var tolang;

	nmg.fn.tolang = function(wrap_id, mode){
		var id = '#' + this.attr('id') + ' '
			,wrapEle = nmg('#' + wrap_id);
		if( mode == void 0 ){
			var tag_a = nmg(id + 'a')
				,lanclass = tag_a.length == 3 ? ['tc', 'sc', 'en'] : ['tc', 'en'];
				
				wrapEle.addClass('tc');
				tag_a.bind('click', function(){
					nmg(id + '.curr').removeClass('curr');
					nmg(this).addClass('curr');
					wrapEle.removeClass('tc sc en');
					wrapEle.addClass(lanclass[this._index]);
				});
		}else if( mode == 'toggle'){
			var tc = nmg(nmg(id + 'a')[0])
				,en = nmg(nmg(id + 'a')[1]);

			en.hide();
			wrapEle.addClass('tc');

			tc.bind('click', function(){
				nmg(this).hide();
				en.show();
				wrapEle.removeClass('tc en');
				wrapEle.addClass('en');
			});
			en.bind('click', function(){
				nmg(this).hide();
				tc.show();	
				wrapEle.removeClass('tc en');
				wrapEle.addClass('tc');
			});			
		}
		return this;
	};

	nmg.fn.toScrollBar = function(){
		var id = this.attr('id');
		if( typeof ScrollEmulate != 'undefined' ){
			new ScrollEmulate(id).start();
		}else{
			alert('請引用base_scrollbar.js !');
		}
		return this;
	};

	nmg.fn.toSlideBox = function(speeds){
		var id = '#' + this.attr('id') + ' '
			,time = nmg.getTime(speeds)
			,slidebox_list = nmg(id + '.j_slidebox_list')
			,items = nmg(id + ' .j_slidebox_nav a').length
			,li_width = nmg(id + ' .j_slidebox_item').css('width').toNum()
			,lis_width = li_width * items;

		slidebox_list.css('width', lis_width + 'px');
		
		nmg(id + '.j_slidebox_nav a').bind('click', function(evt){
			nmg(id + ' .curr').removeClass('curr');
			nmg(this).addClass('curr');
			slidebox_list.animate({'left' : -this._index*li_width + 'px'}, time);
		});
		return this;
	};

	nmg.fn.toPageList = function(pages,langVers){
		var fileName, fileName_tem, fragment = document.createDocumentFragment(), c_h, c_a, a_a;
		c_h = function(){
			var tag_h = document.createElement('h1');
			nmg(tag_h).html('文件列表');
			return tag_h;
		};
		c_a = function(){
			var tag_a = document.createElement('a');
			nmg(tag_a).attr('target', '_blank');
			return tag_a;
		};
		a_a = function(fileName){
			var a;
			a = c_a();
			nmg(a).attr('href', fileName);
			nmg(a).html(fileName);
			fragment.appendChild( a );			
		};
		fragment.appendChild(c_h());
		if( nmg.toType(pages) == 'array' ){
			//name1,name2,name3,....
			pages.forEach(function(name){
				fileName = name + '.html';
				a_a(fileName);	
			});
		}else{
			// p1_sc,p1_en,p1_tc,....
			for(var i = 1; i < pages + 1; i++){
				fileName_tem = 'p' + i +'_';
				for( var j = 0; j < langVers.length; j++ ){
					fileName = fileName_tem + langVers[j] + '.html';
					a_a(fileName);	
				}
			}
		}
		this[0].appendChild(fragment);
		this.addClass('j_pageList');

		return this;
	};
	//#xxx#變底色的TextArea
	nmg.fn.toTextArea = function(){
		this.find('textarea').bind('input',function(e){
			var html = this.value.replace(/\n/g,'<br>').replace(/\s/g,'&nbsp;')
				,bg = nmg(this.parentNode).find('.j_bg');
			bg[0].innerHTML = html.replace(/#([^#]*)#/g, "<span class='j_spanbg'>#$1#</span>" );
		});	
	};
})(DS);

