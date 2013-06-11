// Shareit social bookmarking toolbar
(function($) {
	$.fn
			.extend({
				shareIt : function(options) {
					if ($("#shareit-box").length == 0) {
						$("body")
								.append(
										'<div id="shareit-box">'
												+ '<div id="shareit-header"></div>'
												+ '<div id="shareit-body">'
												+ '<div id="shareit-blank"></div>'
												+ '<div id="shareit-url">'
												+ '<input type="text" value="" name="shareit-field" id="shareit-field" class="field" readonly/>'
												+ '</div><div id="shareit-icon"><ul>'
												+ '<li><a href="#" rel="shareit-mail" class="shareit-sm"><img src="http://bquot.com/images/shareit/mail.gif" width="16" height="16" alt="Mail" title="Mail" /></a></li>'
												+ '<li><a href="#" rel="shareit-gmail" class="shareit-sm"><img src="http://bquot.com/images/shareit/gmail.png" width="16" height="16" alt="GMail" title="GMail" /></a></li>'
												+ '<li><a href="#" rel="shareit-twitter" class="shareit-sm"><img src="http://bquot.com/images/shareit/twitter.gif" width="16" height="16" alt="Twitter" title="Twitter" /></a></li>'
												+ '<li><a href="#" rel="shareit-facebook" class="shareit-sm"><img src="http://bquot.com/images/shareit/facebook.png" width="16" height="16" alt="Facebook" title="Facebook" /></a></li>'
												+ '</ul></div></div></div>');

						$("#shareit-box").beResetCSS().css({
							'position' : 'absolute',
							'display' : 'none',
							'z-index' : 666
						});

						$("#shareit-header").css({
							'width' : '138px'
						});

						$("#shareit-body")
								.css(
										{
											'width' : '138px',
											'height' : '100px',
											'background' : 'url(http://bquot.com/images/shareit/shareit.png)'
										});

						$("#shareit-blank").beResetCSS().css({
							'height' : '25px'
						});

						$("#shareit-url")
								.css(
										{
											'height' : '45px',
											'width' : '120px',
											'text-align' : 'center',
											'background' : 'url(http://bquot.com/images/shareit/field.gif) top center no-repeat',
											'margin' : 'auto'
										});

						$("#shareit-url input.field")
								.beResetCSS()
								.css(
										{
											'border' : 'none',
											'outline' : 'none',
											'width' : '100px',
											'height' : '22px',
											'padding' : '3px',
											'background-color' : 'transparent',
											'font-size' : '10px',
											'font-family' : '"Lucida Grande", "Arial", "Helvetica", "Verdana", "sans-serif"'
										});

						$("#shareit-icon").css({
							'height' : '20px'
						});

						$("#shareit-icon ul").beResetCSS().css({
							'list-style' : 'none',
							'width' : '130px',
							'padding' : '0 0 0 8px'
						});

						$("#shareit-icon ul li").beResetCSS().css({
							'float' : 'left',
							'padding' : '0 7px'
						});

						$("#shareit-icon ul li img").beResetCSS().css({
							'border' : 'none'
						});
					}

					var show = function() {
						// get the height, top and calculate the left
						// value
						// for the sharebox
						var height = $(this).height();
						var top = $(this).offset().top;

						// get the left and find the center value
						var left = $(this).offset().left
								+ ($(this).width() / 2)
								- ($('#shareit-box').width() / 2);

						var field = options.url;
						var url = encodeURIComponent(options.url);
						var title = encodeURIComponent(options.title);

						// assign the height for the header, so that the
						// link is cover
						$('#shareit-header').height(height);

						// display the box
						$('#shareit-box').show();

						// set the position, the box should appear under
						// the
						// link and centered
						$('#shareit-box').beResetCSS().css({
							'top' : top,
							'left' : left
						});

						// assign the url to the textfield
						$('#shareit-field').val(field).focus(function() {
							this.select();
						});

						// make the bookmark media open in new
						// tab/window
						$('a.shareit-sm').beResetCSS().attr('target', '_blank');

						// Setup the bookmark media url and title
						$('a[rel=shareit-mail]').attr('href',
								'mailto:?subject=' + title + '%20-%20' + url);
						$('a[rel=shareit-gmail]').attr(
								'href',
								'http://mail.google.com/mail/?view=cm&tf=1&fs=1&su='
										+ title + '&body=' + url);
						$('a[rel=shareit-twitter]').attr(
								'href',
								'http://twitter.com/?status=' + title
										+ '%20-%20' + url);
						$('a[rel=shareit-facebook]').attr(
								'href',
								'http://www.facebook.com/sharer/sharer.php?s=100&p[url]='
										+ url + '&p[title]=' + title);
					};
					$(this).mouseenter(show);

					// onmouse out hide the shareit box
					$('#shareit-box').mouseleave(function() {
						$('#shareit-field').val('');
						$(this).hide();
					});

					// hightlight the textfield on click event
					$('#shareit-field').click(function() {
						$(this).select();
					});

					$('body').click(function() {
						$('#shareit-field').val('');
						$('#shareit-box').hide();
					});

					$('#shareit-box').click(function(event) {
						event.stopPropagation();
					});

					if (options.show) {
						$(this).mouseenter();
					}

					return this;
				}
			});
})(bq_jQuery);

// Scroll into view
(function($) {
	$.fn.extend({
		scrollTo : function(options) {
			var offset = $(this).offset();
			if (offset) {
				var top = offset.top;
				$('html,body').animate({
					scrollTop : top - $(window).height() / 3
				}, 1000);
			}
			return this;
		}
	});
})(bq_jQuery);

/*
 * beResetCSS 0.1 - jQuery plugin written by Benjamin Mock
 * http://benjaminmock.de/jquery-css-reset-plugin/
 * 
 * Copyright (c) 2009 Benjamin Mock (http://benjaminmock.de) Dual licensed under
 * the MIT (MIT-LICENSE.txt) and GPL (GPL-LICENSE.txt) licenses.
 * 
 * Built for jQuery library http://jquery.com
 * 
 */
(function($) {
	$.fn.beResetCSS = function() {
		resetStyles(this);
		return this;
	};

	function resetStyles(element) {
		var tagName = $(element)[0].tagName.toLowerCase();

		var elements = new Array();
		var styles = new Array();

		elements[0] = [ 'html', 'body', 'div', 'span', 'applet', 'object',
				'iframe', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p',
				'blockquote', 'pre', 'a', 'abbr', 'acronym', 'address', 'big',
				'cite', 'code', 'del', 'dfn', 'em', 'font', 'img', 'ins',
				'kbd', 'q', 's', 'samp', 'small', 'strike', 'strong', 'sub',
				'sup', 'tt', 'var', 'b', 'u', 'i', 'center', 'dl', 'dt', 'dd',
				'ol', 'ul', 'li', 'fieldset', 'form', 'label', 'legend',
				'table', 'caption', 'tbody', 'tfoot', 'thead', 'tr', 'th', 'td', 'input' ];

		var s = {
			margin : '0',
			padding : '0',
			border : '0',
			outline : '0',
			fontSize : '100%',
			verticalAlign : 'baseline',
			background : 'transparent'
		};
		styles[0] = s;

		elements[1] = [ 'body' ];
		s = {
			lineHeight : '1'
		};
		styles[1] = s;

		elements[2] = [ 'ol', 'ul' ];
		s = {
			listStyle : 'none'
		}
		styles[2] = s;

		elements[3] = [ 'blockquote', 'q' ];
		s = {
			quotes : 'none'
		}
		styles[3] = s;

		elements[4] = [ 'ins' ];
		s = {
			textDecoration : 'none'
		}
		styles[4] = s;

		elements[5] = [ 'del' ];
		s = {
			textDecoration : 'line-through'
		}
		styles[5] = s;

		elements[6] = [ 'table' ];
		s = {
			borderCollapse : 'collapse',
			borderSpacing : '0'
		}
		styles[6] = s;

		// resetting styles
		$(elements).each(function(i) {
			$(this).each(function(k) {
				if (tagName == this) {
					addStyles(element, styles[i]);
				}
			});
		});
	}

	function addStyles(element, styles) {
		for (key in styles) {
			$(element).css(key, styles[key]);
		}
	}
})(bq_jQuery);