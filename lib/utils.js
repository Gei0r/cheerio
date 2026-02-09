var cloneDeepWith = require('lodash/cloneDeepWith');
var lodash_clone = require('lodash/clone');

// HTML Tags
var tags = { tag: true, script: true, style: true };

/**
 * Check if the DOM element is a tag.
 *
 * `isTag(type)` includes `<script>` and `<style>` tags.
 *
 * @param {node} type - DOM node to check.
 *
 * @private
 */
exports.isTag = function (type) {
  if (type.type) type = type.type;
  return tags[type] || false;
};

/**
 * Convert a string to camel case notation.
 *
 * @param  {string} str - String to be converted.
 * @returns {string}      String in camel case notation.
 *
 * @private
 */
exports.camelCase = function (str) {
  return str.replace(/[_.-](\w|$)/g, function (_, x) {
    return x.toUpperCase();
  });
};

/**
 * Convert a string from camel case to "CSS case", where word boundaries are
 * described by hyphens ("-") and all characters are lower-case.
 *
 * @param  {string} str - String to be converted.
 * @returns {string}      String in "CSS case".
 *
 * @private
 */
exports.cssCase = function (str) {
  return str.replace(/[A-Z]/g, '-$&').toLowerCase();
};

// Iterate over each DOM element without creating intermediary Cheerio
// instances.
//
// This is indented for use internally to avoid otherwise unnecessary memory
// pressure introduced by _make.
exports.domEach = function (cheerio, fn) {
  var i = 0;
  var len = cheerio.length;
  while (i < len && fn.call(cheerio, i, cheerio[i]) !== false) ++i;
  return cheerio;
};

function smartClone(elem, parent) {
    // **SHALLOW** clone provided by lodash
    let ret = lodash_clone(elem);
    // Fix: Make sure that children don't get taken over from the input
    // we rebuild the array with individual clones below.
    ret.children = [];
    // NOT cloning the prev/next siblings is basically what makes this clone
    //smarter than cheerio's clone() method.
    ret.next = null;
    ret.prev = null;
    ret.parent = parent;

    ret.attribs = lodash_clone(ret.attribs);

    // for the children, we have to do a deep clone. But the child won't clone
    // the parent and its siblings.
    for (let i = 0; i < elem.children?.length; i++) {
        ret.children[i] = smartClone(elem.children[i], ret);
    }

    for (let i = 0; i < ret.children?.length; i++) {
        if (i > 0) {
            ret.children[i].prev = ret.children[i - 1];
        }
        if (i < ret.children.length - 1) {
            ret.children[i].next = ret.children[i + 1];
        }
    }
    return ret;
}

/**
 * Create a deep copy of the given DOM structure.
 * Sets the parents of the copies of the passed nodes to `null`.
 *
 * @param {object} dom - The htmlparser2-compliant DOM structure.
 * @private
 */
exports.cloneDom = function (dom) {
    if (Array.isArray(dom)) {
        let ret = [];
        for (let elem of dom) {
            ret.push(smartClone(elem, null));
        }
        return ret;
    }

    return smartClone(dom, null);
};

/*
 * A simple way to check for HTML strings or ID strings
 */
var quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w-]*)$)/;

/**
 * Check if string is HTML.
 *
 * @param {string} str - String to check.
 *
 * @private
 */
exports.isHtml = function (str) {
  // Faster than running regex, if str starts with `<` and ends with `>`, assume it's HTML
  if (
    str.charAt(0) === '<' &&
    str.charAt(str.length - 1) === '>' &&
    str.length >= 3
  ) {
    return true;
  }

  // Run the regex
  var match = quickExpr.exec(str);
  return !!(match && match[1]);
};
