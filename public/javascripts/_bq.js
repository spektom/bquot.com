var BQ = (function() {

	// XPath methods:
	var XPATH_TEXT_LIMIT = 50;
	var HUMAN_ID_PATTERN = /^[\w_\.\-]+$/;
	var XPATH_LIMIT = 20;

	var getLiteral = function(value) {
		// if the value contains only single or double quotes,
		// construct
		// an XPath literal
		if (value.indexOf("'") == -1) {
			return "'" + value + "'";
		}
		if (value.indexOf("\"") == -1) {
			return '"' + value + '"';
		}

		// if the value contains both single and double quotes,
		// construct an
		// expression that concatenates all non-double-quote
		// substrings with
		// the quotes, e.g.:
		//
		// concat("foo", '"', "bar")
		var result = "concat(";
		var substrings = value.split('"');
		for ( var i = 0; i < substrings.length; i++) {
			var needComma = (i > 0);
			if (substrings[i] != "") {
				if (i > 0) {
					result += ", ";
				}
				result += '"' + substrings[i] + '"';
				needComma = true;
			}
			if (i < substrings.length - 1) {
				if (needComma) {
					result += ", ";
				}
				result += "'\"'";
			}
		}
		result += ")";
		return result;
	};

	var getPrevSiblings = function(element) {
		var num = 0;
		// Count previous siblings:
		var sibling = element.previousSibling;
		while (sibling != null) {
			if (sibling.nodeType == 1) {
				if (sibling.tagName == element.tagName) {
					++num;
				}
			}
			sibling = sibling.previousSibling;
		}
		return num;
	};

	var getNextSiblings = function(element) {
		var num = 0;
		// Count next siblings:
		var sibling = element.nextSibling;
		while (sibling != null) {
			if (sibling.nodeType == 1) {
				if (sibling.tagName == element.tagName) {
					++num;
				}
			}
			sibling = sibling.nextSibling;
		}
		return num;
	};

	var isParentOf = function(parent, child) {
		while (child != null) {
			if (child == parent) {
				return true;
			}
			child = child.parentNode;
		}
		return false;
	};

	var filterParentSelectorByIndex = function(tagName, selector, expr,
			element, result) {

		var siblings = bq_xpathResolve(element.ownerDocument, "/descendant::"
				+ tagName + selector);
		var siblingIdx = 0;
		for ( var i = 0; i < siblings.length; ++i) {
			var sibling = siblings[i];
			if (isParentOf(sibling, element)) {
				siblingIdx = i + 1;
				break;
			}
		}
		if (siblingIdx > 0) {
			result.push("/descendant::" + tagName + selector + "[" + siblingIdx
					+ "]" + expr);

			if (siblingIdx == siblings.snapshotLength) {
				result.push("/descendant::" + tagName + selector + "[last()]"
						+ expr);
			}
		}
	};

	function AttributeHint(attr) {
		this.attr = attr;
	}

	AttributeHint.prototype.filterableByIndex = true;

	AttributeHint.prototype.generate = function(element) {
		var value = element.getAttribute(this.attr);
		if (value != null && this.isValidValue(value)) {
			return "[@" + this.attr + "=" + getLiteral(value) + "]";
		}
		return null;
	};

	AttributeHint.prototype.isValidValue = function(value) {
		return value.length > 0 && value.length < XPATH_TEXT_LIMIT;
	};

	/**
	 * Hint based on element ID ("id" attribute)
	 */
	IdHint.prototype = new AttributeHint();
	IdHint.prototype.constructor = IdHint;
	function IdHint() {
		this.attr = "id";
	}

	IdHint.prototype.isValidValue = function(value) {
		if (!value.match(HUMAN_ID_PATTERN)) {
			// not considered to be a human ID
			return false;
		}
		return AttributeHint.prototype.isValidValue.call(this, value);
	};

	/**
	 * Hint based on attribute containing URI ("href", "src", etc.)
	 */
	URLAttrHint.prototype = new AttributeHint();
	URLAttrHint.prototype.constructor = URLAttrHint;
	function URLAttrHint(attr) {
		this.attr = attr;
	}

	URLAttrHint.prototype.isValidValue = function(value) {
		if (!AttributeHint.prototype.isValidValue.call(this, value)) {
			return false;
		}
		return value.toLowerCase().indexOf("javascript:") != 0 && value != "#";
	};

	/**
	 * Hint based on element index in the parent elements list
	 */
	function ChildIndexHint(forceChildIndex) {
		this.forceChildIndex = (forceChildIndex === null) ? false
				: forceChildIndex;
	}

	ChildIndexHint.prototype.generate = function(element) {
		var prevSiblingsNum = getPrevSiblings(element);
		if (!this.forceChildIndex) {
			var nextSiblingsNum = getNextSiblings(element);
			if (prevSiblingsNum + nextSiblingsNum == 0) {
				return null;
			}
		}
		return "[" + (prevSiblingsNum + 1) + "]";
	};

	/**
	 * Hint based on the fact that this element is the last in the list of
	 * parent elements
	 */
	function LastElementHint() {
	}

	LastElementHint.prototype.generate = function(element) {
		if (getPrevSiblings(element) == 0) {
			return null;
		}

		// Check that this element is the last element of such
		// tag:
		var sibling = element.nextSibling;
		while (sibling != null) {
			if (sibling.nodeType == 1) {
				if (sibling.tagName == element.tagName) {
					return null;
				}
			}
			sibling = sibling.nextSibling;
		}
		return "[last()]";
	};

	/**
	 * Hint based on text value of HTML element
	 */
	function TextHint() {
	}

	TextHint.prototype.filterableByIndex = true;

	TextHint.prototype.generate = function(element) {
		// Check that the element doesn't have non-text
		// children:
		var children = element.childNodes;
		var length = children.length;
		for ( var i = 0; i < length; ++i) {
			if (children[i] && children[i].nodeType != 3) {
				return null;
			}
		}

		var innerText = element.textContent;
		if (innerText != null && innerText.replace(/^\s*|\s*$/g, '').length > 0) {
			if (innerText.length < XPATH_TEXT_LIMIT) {
				return "[text()=" + getLiteral(innerText) + "]";
			}
		}
		return null;
	};

	/**
	 * Hint based on the fact that HTML element has no siblings of the same name
	 */
	function NoSelectorHint() {
	}

	NoSelectorHint.prototype.generate = function(element) {
		var sibling = element.previousSibling;
		while (sibling != null) {
			if (sibling.nodeType == 1) {
				if (sibling.tagName == element.tagName) {
					return null;
				}
			}
			sibling = sibling.previousSibling;
		}
		sibling = element.nextSibling;
		while (sibling != null) {
			if (sibling.nodeType == 1) {
				if (sibling.tagName == element.tagName) {
					return null;
				}
			}
			sibling = sibling.nextSibling;
		}
		return "";
	};

	// ===================================================================
	// XPath Generator
	// ===================================================================

	/**
	 * Generates various XPath expressions (candidates) for a given DOM element
	 */
	function XPathGenerator() {
		this.maxPaths = XPATH_LIMIT;
		this.selectorHints = [ new IdHint(), new AttributeHint("name"),
				new AttributeHint("class"), new URLAttrHint("action"),
				new URLAttrHint("href"), new ChildIndexHint(),
				new LastElementHint(), new TextHint(), new NoSelectorHint() ];
	}

	XPathGenerator.prototype.generateAbsolute = function(element,
			forceChildIndex) {
		var childIndexHint = new ChildIndexHint(forceChildIndex);
		var expr = "";
		while (element != null) {
			if (element.nodeType == 1) {
				var selector = childIndexHint.generate(element);
				if (selector == null) {
					selector = "";
				}
				expr = "/" + element.tagName.toLowerCase() + selector + expr;
			}
			element = element.parentNode;
		}
		return expr;
	};

	XPathGenerator.prototype.generate = function(element) {
		var xpaths = [ this.generateAbsolute(element) ];
		var nonUniqueExprs = [ "" ];

		var node = element;
		while (node != null && nonUniqueExprs.length > 0) {

			if (node.nodeType == 1) {
				var currentElement = node;
				var newNonUniqExprs = new Array();

				var level = 0;
				while (currentElement != null) {

					if (currentElement.nodeType == 1) {
						var tagName = currentElement.tagName.toLowerCase();
						if (tagName == "body") {
							break;
						}

						for ( var hintIdx = 0; hintIdx < this.selectorHints.length; ++hintIdx) {
							if (xpaths.length >= this.maxPaths) {
								break;
							}
							var hint = this.selectorHints[hintIdx];

							var selector = hint.generate(currentElement);
							if (selector != null) {

								for ( var exprIdx = 0; exprIdx < nonUniqueExprs.length; ++exprIdx) {
									if (xpaths.length >= this.maxPaths) {
										break;
									}
									var expr = nonUniqueExprs[exprIdx];
									if (level > 0 && expr.length == 0) {
										continue;
									}

									var newExpr = tagName + selector
											+ (level > 0 ? "/" : "") + expr;
									var testXPath = "//" + newExpr;

									var resolved = bq_xpathResolve(
											element.ownerDocument, testXPath,
											level > 0);

									// If XPath expression
									// resolves to a single
									// element:
									if (resolved.length == 1
											&& resolved[0] == element) {
										xpaths.push(testXPath);

									} else if (level == 0) {
										var elementFound = false;
										// Check whether the
										// needed element
										// exists between
										// resolved elements:
										for ( var i = 0; i < resolved.length; ++i) {
											if (element == resolved[i]) {
												elementFound = true;
												break;
											}
										}
										if (elementFound) {
											if (hint.filterableByIndex) {
												filterParentSelectorByIndex(
														tagName, selector,
														expr, element, xpaths);
											} else {
												newNonUniqExprs.push("/"
														+ newExpr);
											}
										}
									}
								}
							}
						}
					}

					currentElement = currentElement.parentNode;
					++level;
				}

				nonUniqueExprs = newNonUniqExprs;
			}
			node = node.parentNode;
		}

		return xpaths;
	}

	// Checksum for checking whether range can be serialized
	var crc32 = (function() {
		function utf8encode(str) {
			var utf8CharCodes = [];

			for ( var i = 0, len = str.length, c; i < len; ++i) {
				c = str.charCodeAt(i);
				if (c < 128) {
					utf8CharCodes.push(c);
				} else if (c < 2048) {
					utf8CharCodes.push((c >> 6) | 192, (c & 63) | 128);
				} else {
					utf8CharCodes.push((c >> 12) | 224, ((c >> 6) & 63) | 128,
							(c & 63) | 128);
				}
			}
			return utf8CharCodes;
		}

		var cachedCrcTable = null;

		function buildCRCTable() {
			var table = [];
			for ( var i = 0, j, crc; i < 256; ++i) {
				crc = i;
				j = 8;
				while (j--) {
					if ((crc & 1) == 1) {
						crc = (crc >>> 1) ^ 0xEDB88320;
					} else {
						crc >>>= 1;
					}
				}
				table[i] = crc >>> 0;
			}
			return table;
		}

		function getCrcTable() {
			if (!cachedCrcTable) {
				cachedCrcTable = buildCRCTable();
			}
			return cachedCrcTable;
		}

		return function(str) {
			var utf8CharCodes = utf8encode(str), crc = -1, crcTable = getCrcTable();
			for ( var i = 0, len = utf8CharCodes.length, y; i < len; ++i) {
				y = (crc ^ utf8CharCodes[i]) & 0xFF;
				crc = (crc >>> 8) ^ crcTable[y];
			}
			return (crc ^ -1) >>> 0;
		};
	})();

	function escapeTextForHtml(str) {
		return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function nodeToInfoString(node, infoParts) {
		infoParts = infoParts || [];
		var nodeType = node.nodeType, children = node.childNodes, childCount = children.length;
		var nodeInfo = [ nodeType, node.nodeName, childCount ].join(":");
		var start = "", end = "";
		switch (nodeType) {
			case 3: // Text node
				start = escapeTextForHtml(node.nodeValue);
				break;
			case 8: // Comment
				start = "<!--" + escapeTextForHtml(node.nodeValue) + "-->";
				break;
			default:
				start = "<" + nodeInfo + ">";
				end = "</>";
				break;
		}
		if (start) {
			infoParts.push(start);
		}
		for ( var i = 0; i < childCount; ++i) {
			nodeToInfoString(children[i], infoParts);
		}
		if (end) {
			infoParts.push(end);
		}
		return infoParts;
	}

	function findTextNode(node, text, verifyCallback) {
		if (node) {
			if (node.nodeType == 3) {
				var textIndex = node.data.indexOf(text);
				if (textIndex !== -1) {
					if (verifyCallback(node)) {
						return node;
					}
				}
			} else {
				var child = node.firstChild, nextChild;
				while (child) {
					nextChild = child.nextSibling;
					var n = findTextNode(child, text, verifyCallback);
					if (n) {
						return n;
					}
					child = nextChild;
				}
			}
		}
		return null;
	}

	// Creates a string representation of the specified
	// element's contents that is similar to innerHTML but omits
	// all
	// attributes and comments and includes child node counts.
	// This is done instead of using innerHTML to work around
	// IE <= 8's policy of including element properties in
	// attributes, which ruins things by changing an element's
	// innerHTML whenever the user changes an input within the
	// element.
	function getElementChecksum(el) {
		var info = nodeToInfoString(el).join("");
		return crc32(info).toString(16);
	}

	function serializePosition(node, offset) {
		var origNode = node;
		var nodeIndex = -1;
		if (node.nodeType != 1) {
			nodeIndex = rangy.dom.getNodeIndex(node);
			node = node.parentNode;
		}

		var xpaths = new XPathGenerator().generate(node);
		var posData = {
			xpaths : xpaths,
			offset : offset,
			checksum : getElementChecksum(node),
			nodeIndex : nodeIndex
		};

		if (origNode.nodeType == 3) {
			var text = origNode.data.replace(/^\s*|\s*$/g, "");
			if (text.length > 20) {
				text = text.substring(0, 20);
			}
			if (text.length > 0) {
				posData.text = text;
			}
		}
		return posData;
	}

	function deserializePosition(serialized, documents) {
		var node = null;
		for ( var d = 0; d < documents.length && !node; ++d) {
			for ( var i = 0; i < serialized.xpaths.length && !node; ++i) {
				var resolved = bq_xpathResolve(documents[d],
						serialized.xpaths[i], true);
				if (resolved.length == 1) {
					try {
						if (getElementChecksum(resolved[0]) == serialized.checksum) {
							if (serialized.nodeIndex != -1) {
								if (serialized.nodeIndex < resolved[0].childNodes.length) {
									node = resolved[0].childNodes[serialized.nodeIndex];
								}
							} else {
								node = resolved[0];
							}
						}
					} catch (e) {
					}
				}
			}
		}

		if (!node && serialized.text) {
			var notExactMatch = null;
			// Try to resolve using text:
			for ( var d = 0; d < documents.length && !node; ++d) {
				var doc = documents[d];
				if (doc && doc.documentElement) {
					node = findTextNode(
							doc.documentElement,
							serialized.text,
							function(n) {
								return (getElementChecksum(n.parentNode) == serialized.checksum);
							});
					if (!notExactMatch && !node) {
						notExactMatch = findTextNode(doc.documentElement,
								serialized.text, function(n) {
									return (n.data.replace(/^\s*|\s*$/g, "")
											.indexOf(serialized.text) === 0);
								});
					}
				}
			}
			if (!node) {
				node = notExactMatch;
			}
		}

		return node == null ? null : new rangy.dom.DomPosition(node,
				serialized.offset);
	}

	function serializeRange(range) {
		var doc = rangy.DomRange.getRangeDocument(range);
		var start = serializePosition(range.startContainer, range.startOffset,
				doc);
		var end = serializePosition(range.endContainer, range.endOffset, doc);
		return {
			start : start,
			end : end
		};
	}

	function deserializeRange(serialized, documents) {
		var start = deserializePosition(serialized.start, documents);
		if (!start) {
			return null;
		}
		var end = deserializePosition(serialized.end,
				[ start.node.ownerDocument ]);
		if (!end) {
			return null;
		}
		var range = rangy.createRange(start.node.ownerDocument);
		range.setStart(start.node, start.offset);
		range.setEnd(end.node, end.offset);
		return range;
	}

	function serializeSelection(selection) {
		selection = selection || rangy.getSelection();
		var ranges = selection.getAllRanges(), serializedRanges = [];

		// Try to fix IE9 issue (selection is returned for the second time):
		if (ranges.length == 0) {
			selection = rangy.getSelection();
			ranges = selection.getAllRanges();
		}
		for ( var i = 0, len = ranges.length; i < len; ++i) {
			serializedRanges[i] = serializeRange(ranges[i]);
		}
		return serializedRanges;
	}

	function wrapRanges(ranges, className) {
		var textNode, it;
		for ( var i = 0, len = ranges.length; i < len; ++i) {
			range = ranges[i];
			// If one or both of the range boundaries falls
			// in the middle
			// of a text node, the following line splits the
			// text node at the
			// boundary
			range.splitBoundaries();

			// The following line creates a simple iterator
			// that iterates
			// over the nodes within the range. The first
			// parameter is an
			// array of valid nodeTypes (in this case, text
			// nodes only)
			it = range.createNodeIterator([ 3 ]);

			while ((textNode = it.next())) {
				var span = textNode.ownerDocument.createElement("span");
				span.className = className;
				textNode.parentNode.insertBefore(span, textNode);
				span.appendChild(textNode);
			}
		}
	}

	function deserializeSelection(serializedRanges) {
		var documents = [ document ];
		var frames = window.frames;
		for ( var i = 0; i < frames.length; i++) {
			try {
				var frameDoc = frames[i].document;
				documents.push(frameDoc);
			} catch (e) {
				// frame from different domain is not accessible
			}
		}

		var ranges = [];
		for ( var i = 0, len = serializedRanges.length; i < len; ++i) {
			var range = deserializeRange(serializedRanges[i], documents);
			if (range != null) {
				ranges.push(range);
			}
		}
		return ranges;
	}

	return {
		save : function() {
			rangy.init();

			var selection = serializeSelection();

			// Check that the selection is not empty:
			if (selection.length > 0) {
				var data = JSON.stringify(selection);
				bq_jQuery(function() {
					bq_jQuery.getScript("http://bquot.com/api.js?url="
							+ encodeURIComponent(document.location.href)
							+ "&data=" + encodeURIComponent(data));
				});
			} else {
				if (typeof (BQ_spin) !== 'undefined') {
					BQ_spin.hide();
				}
			}
		},

		restore : function(short_url, data, show) {
			try {
				rangy.init();
				if (typeof(data) == 'string') {
					data = JSON.parse(data);
				}
				var ranges = deserializeSelection(data);
				var className = "bq-span" + new Date().getTime();
				wrapRanges(ranges, className);
			} finally {
				if (typeof (BQ_spin) !== 'undefined') {
					BQ_spin.hide();
				}
			}

			bq_jQuery(function() {
				bq_jQuery("." + className + ":first").scrollTo();

				var selection = bq_jQuery("." + className);

				// Create a title for the bookmark from the selected text:
				var title = selection.text();
				title = bq_jQuery.trim(title).replace(/\s+/, " ");
				if (title.length > 100) {
					title = title.substring(0, 100).replace(/[\S]*$/, "...");
				}

				selection.css({
					'background-color' : 'yellow',
					'color' : '#333'
				}).shareIt({
					url : short_url,
					title : title,
					show : show
				})
			});
		}
	}
})();