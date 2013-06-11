(function() {
	var callback = function() {
		BQ.save();
	};
	if (typeof (BQ) == 'undefined') {
		BQ = {};
		var sources = [ 'http://bquot.com/javascripts/ajax-spin.min.js',
				'http://ajax.cdnjs.com/ajax/libs/json2/20110223/json2.js',
				'http://bquot.com/javascripts/ajaxslt.min.js',
				'http://bquot.com/javascripts/rangy-core.min.js',
				'http://bquot.com/javascripts/jquery-1.6.1.min.js',
				'http://bquot.com/javascripts/jquery.addons.min.js',
				'http://bquot.com/javascripts/bq.js?_' + new Date().getTime() ];

		var loadNextScript = function() {
			if (sources.length > 0) {
				var script = document.createElement('script');
				script.src = sources.shift();
				document.body.appendChild(script);

				var done = false;
				script.onload = script.onreadystatechange = function() {
					if (!done
							&& (!this.readyState || this.readyState == "loaded" || this.readyState == "complete")) {
						done = true;

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						loadNextScript();
					}
				}
			} else {
				callback();
			}
		}
		loadNextScript();

	} else {
		if (BQ_spin.show()) {
			callback();
		}
	}
})();