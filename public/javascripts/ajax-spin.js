(function(window) {
	
	var SPIN_ID = "bq-ajax-spin";
	
	var disableSelection = function(target) {
	    if (typeof target.onselectstart!="undefined") {// IE route
	        target.onselectstart=function(){return false}
	    } else if (typeof target.style.MozUserSelect!="undefined") { // Firefox
																		// route
	        target.style.MozUserSelect="none"
	    } else { // All other route (ie: Opera)
	        target.onmousedown=function(){return false}
	    }
		target.style.cursor = "default"
	};
	
	var show = function() {
		if (document.getElementById(SPIN_ID)) {
			return false;
		}
		var div = document.createElement("div");
		div.id = SPIN_ID;
		div
				.setAttribute(
						"style",
						"z-index:666;position:fixed;top:0;right:0;bottom:0;left:0;height:100%;width:100%;margin:auto;text-align:center;vertical-align:center;background-color:#000;opacity:0.7;");
		var imgDiv = document.createElement("div");
		imgDiv
				.setAttribute(
						"style",
						'z-index:666;height:100px;width:100px;position:fixed;left:50%;top:50%;margin:-50px 0 0 -50px;background:url("http://bquot.com/images/ajax-loader.gif") top center no-repeat;');
		div.appendChild(imgDiv);
		disableSelection(div);
		document.documentElement.appendChild(div);
		return true;
	};

	var hide = function() {
		var div = document.getElementById(SPIN_ID);
		if (div) {
			div.parentNode.removeChild(div);
		}
	};

	show();

	window["BQ_spin"] = {};
	window["BQ_spin"]["show"] = show;
	window["BQ_spin"]["hide"] = hide;
	
})(window);
