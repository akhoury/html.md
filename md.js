// [html.md](http://neocotic.com/html.md) 1.0.0  
// (c) 2012 Alasdair Mercer  
// Freely distributable under the MIT license.  
// Based on [Make.text](http://homepage.mac.com/tjim/) 1.5  
// (c) Trevor Jim  
// Licensed under the GPL Version 2 license.  
// For all details and documentation:  
// <http://neocotic.com/html.md>

(function () {

  // Private constants
  // -----------------

  var
    // TODO: Comment
    DEFAULT_CONFIG = {
      debug: false
    },
    // TODO: Comment
    REPLACEMENTS   = {
      '\\\\':              '\\\\',
      '\\[':               '\\[',
      '\\]':               '\\]',
      '>':                 '\\>',
      '_':                 '\\_',
      '\\*':               '\\*',
      '`':                 '\\`',
      '#':                 '\\#',
      '([0-9])\\.(\\s|$)': '$1\\.$2',
      '\u00a9':            '(c)',
      '\u00ae':            '(r)',
      '\u2122':            '(tm)',
      '\u00a0':            ' ',
      '\u00b7':            '\\*',
      '\u2002':            ' ',
      '\u2003':            ' ',
      '\u2009':            ' ',
      '\u2018':            '\'',
      '\u2019':            '\'',
      '\u201c':            '"',
      '\u201d':            '"',
      '\u2026':            '...',
      '\u2013':            '--',
      '\u2014':            '---'
    },
    // TODO: Comment
    REGEX          = (function () {
      var result = {};
      for (var key in REPLACEMENTS) {
        if (REPLACEMENTS.hasOwnProperty(key)) {
          result[key] = new RegExp(key, 'g');
        }
      }
      return result;
    }());

  // Private variables
  // -----------------

  var
    // TODO: Comment
    atLeft        = true,
    // TODO: Comment
    atNoWS        = true,
    // TODO: Comment
    atP           = true,
    // TODO: Comment
    buffer        = '',
    // TODO: Comment
    config        = {},
    // TODO: Comment
    exceptions    = [],
    // TODO: Comment
    inCode        = false,
    // TODO: Comment
    inPre         = false,
    // TODO: Comment
    inOrderedList = false,
    // TODO: Comment
    last          = null,
    // TODO: Comment
    left          = '\n',
    // TODO: Comment
    links         = [],
    // TODO: Comment
    linkTitles    = [],
    // Save the previous value of the `md` variable.
    previousMd    = window.md,
    // TODO: Comment
    rlinks        = {},
    // TODO: Comment
    unhandled     = {};

  // Try to ensure Node is available with the required constants.
  var Node = (typeof Node === 'undefined') ? {} : Node;
  if (!Node.ELEMENT_NODE) Node.ELEMENT_NODE = 1;
  if (!Node.TEXT_NODE) Node.TEXT_NODE = 3;

  // Private functions
  // -----------------

  // TODO: Comment
  function append(str) {
    if (last != null) buffer += last;
    last = str;
  }

  // TODO: Comment
  function br() {
    append('  ' + left);
    atLeft = atNoWS = true;
  }

  // TODO: Comment
  function code() {
    var old = inCode;
    inCode = true;
    return function () {
      inCode = old;
    };
  }

  // TODO: Comment
  function inCodeProc(str) {
    return str.replace(/`/g, '\\`');
  }

  // TODO: Comment
  function nonPreProcess(str) {
    str = str.replace(/\n([ \t]*\n)+/g, '\n');
    str = str.replace(/\n[ \t]+/g, '\n');
    str = str.replace(/[ \t]+/g, ' ');
    for (var key in REPLACEMENTS) {
      if (REPLACEMENTS.hasOwnProperty(key)) {
        str = str.replace(REGEX[key], REPLACEMENTS[key]);
      }
    }
    return str;
  }

  // TODO: Comment
  function ol() {
    var old = inOrderedList;
    inOrderedList = true;
    return function () {
      inOrderedList = old;
    };
  }

  // TODO: Comment
  function output(str) {
    if (!str) return;
    if (!inPre) {
      if (atNoWS) str = str.replace(/^[ \t\n]+/, '');
      else if (/^[ \t]*\n/.test(str)) str = str.replace(/^[ \t\n]+/, '\n');
      else str = str.replace(/^[ \t]+/, ' ');
    }
    if (str === '') return;
    atP = /\n\n$/.test(str);
    atLeft = /\n$/.test(str);
    atNoWS = /[ \t\n]$/.test(str);
    append(str.replace(/\n/g, left));
  }

  // TODO: Comment
  function outputLater(str) {
    return function () {
      output(str);
    };
  }

  // TODO: Comment
  function p() {
    if (atP) return;
    if (!atLeft) {
      append(left);
      atLeft = true;
    }
    append(left);
    atNoWS = atP = true;
  }

  // TODO: Comment
  function pre() {
    var old = inPre;
    inPre = true;
    return function () {
      inPre = old;
    };
  }

  // TODO: Comment
  function process(e) {
    if (typeof getComputedStyle !== 'undefined') {
      try {
        var style = getComputedStyle(e, null);
        if (style && style.getPropertyValue && style.getPropertyValue('display') === 'none') return;
      } catch (ex) {
        thrown(ex, 'getComputedStyle');
      }
    }
    if (e.nodeType === Node.ELEMENT_NODE) {
      var
        after        = null,
        skipChildren = false;
      try {
        switch (e.tagName) {
        case 'HEAD':
        case 'STYLE':
        case 'SCRIPT':
        case 'SELECT':
        case 'OPTION':
        case 'NOSCRIPT':
        case 'NOFRAMES':
        case 'INPUT':
        case 'BUTTON':
        case 'SELECT':
        case 'TEXTAREA':
        case 'LABEL':
          skipChildren = true;
          break;
        case 'BODY':
        case 'FORM':
          break;
        case 'H1':
          p();
          output('# ');
          break;
        case 'H2':
          p();
          output('## ');
          break;
        case 'H3':
          p();
          output('### ');
          break;
        case 'H4':
          p();
          output('#### ');
          break;
        case 'H5':
          p();
          output('##### ');
          break;
        case 'H6':
          p();
          output('###### ');
          break;
        case 'P':
        case 'DIV':
          p();
          break;
        case 'BR':
          br();
          break;
        case 'HR':
          p();
          output('--------------------------------');
          p();
          break;
        case 'EM':
        case 'I':
        case 'U':
          output('_');
          atNoWS = true;
          after = outputLater('_');
          break;
        case 'DT':
          p();
        case 'STRONG':
        case 'B':
          output('**');
          atNoWS = true;
          after = outputLater('**');
          break;
        case 'OL':
          var r1 = pushLeft('    ');
          var r2 = ol();
          after = function () {
            r1();
            r2();
          };
          break;
        case 'UL':
          var r1 = pushLeft('    ');
          var r2 = ul();
          after = function () {
            r1();
            r2();
          };
          break;
        case 'LI':
          if (inOrderedList) {
            replaceLeft('1.  ');
          } else {
            replaceLeft('*   ');
          }
          break;
        case 'PRE':
          var r1 = pushLeft('    ');
          var r2 = pre();
          after = function () {
            r1();
            r2();
          };
          break;
        case 'CODE':
          if (!inPre) {
            output('`');
            var r1 = code();
            var r2 = outputLater('`');
            after = function () {
              r1();
              r2();
            };
          }
          break;
        case 'DD':
        case 'BLOCKQUOTE':
          after = pushLeft('> ');
          break;
        case 'A':
          if (!e.href) break;
          var n;
          if (rlinks[e.href]) {
            n = rlinks[e.href];
          } else {
            n = links.length;
            links[n] = e.href;
            rlinks[e.href] = n;
            if (e.title) linkTitles[n] = e.title;
          }
          output('[');
          atNoWS = true;
          after = outputLater('][' + n + ']');
          break;
        case 'IMG':
          skipChildren = true;
          if (!e.src) break;
          output('![' + e.alt + '](' + e.src + ')');
          break;
        case 'IFRAME':
        case 'FRAME':
          skipChildren = true;
          try {
            if (e.contentDocument && e.contentDocument.documentElement) {
              process(e.contentDocument.documentElement);
            }
          } catch (ex) {
            thrown(ex, 'contentDocument');
          }
          break;
        case 'TR':
          after = p;
          break;
        default:
          if (config.debug) unhandled[e.tagName] = null;
          break;
        }
      } catch (ex) {
        thrown(ex, e.tagName);
      }
      if (!skipChildren) {
        for (var i = 0; i < e.childNodes.length; i++) {
          process(e.childNodes[i]);
        }
      }
      if (after) after();
    } else if (e.nodeType === Node.TEXT_NODE) {
      if (inPre) {
        output(e.nodeValue);
      } else if (inCode) {
        output(inCodeProc(e.nodeValue));
      } else {
        output(nonPreProcess(e.nodeValue));
      }
    }
  }

  // TODO: Comment
  function pushLeft(str) {
    var oldLeft = left;
    left += str;
    if (atP) {
      append(str);
    } else {
      p();
    }
    return function () {
      left = oldLeft;
      atLeft = atP = false;
      p();
    };
  }

  // TODO: Comment
  function replaceLeft(str) {
    if (!atLeft) {
      append(left.replace(/    $/, str));
      atLeft = atNoWS = atP = true;
    } else if (last) {
      last = last.replace(/    $/, str);
    }
  }

  // TODO: Comment
  function resetAndConfigure(options) {
    // Reset
    atLeft        = true;
    atNoWS        = true;
    atP           = true;
    buffer        = '';
    exceptions    = [];
    inCode        = false;
    inPre         = false;
    inOrderedList = false;
    last          = null;
    left          = '\n';
    links         = [];
    linkTitles    = [];
    rlinks        = {};
    unhandled     = {};
    // Configure
    if (typeof options !== 'object') options = {};
    for (var property in DEFAULT_CONFIG) {
      if (DEFAULT_CONFIG.hasOwnProperty(property)) {
        if (options.hasOwnProperty(property)) {
          config[property] = options[property];
        } else {
          config[property] = DEFAULT_CONFIG[property];
        }
      }
    }
  }

  // TODO: Comment
  function thrown(exception, message) {
    if (config.debug) exceptions.push(message + ': ' + exception);
  }

  // TODO: Comment
  function ul() {
    var old = inOrderedList;
    inOrderedList = false;
    return function () {
      inOrderedList = old;
    };
  }

  // html.md setup
  // -------------

  // Build the publicly exposed API.
  var md = window.md = function (html, options) {
    if (!html) return '';
    resetAndConfigure(options);
    var container = document.createElement('div');
    if (typeof html === 'string') {
      container.innerHTML = html;
    } else {
      container.appendChild(html);
    }
    process(container);
    append('\n\n');
    var title;
    for (var i = 0; i < links.length; i++) {
      title = '\n';
      if (linkTitles[i]) title = ' "' + linkTitles[i] + '"\n';
      if (links[i]) append('[' + i + ']: ' + links[i] + title);
    }
    if (config.debug) {
      var unhandledTags = [];
      for (var name in unhandled) {
        if (unhandled.hasOwnProperty(name)) {
          unhandledTags.push(name);
        }
      }
      unhandledTags.sort();
      if (unhandledTags.length) {
        console.log('Ignored tags;\n' + unhandledTags.join(', '));
      } else {
        console.log('No tags were ignored');
      }
      if (exceptions.length) console.log(exceptions.join('\n'));
    }
    append('');
    return buffer;
  };

  // Public constants
  // ----------------

  // Current version of html.md.
  md.VERSION = '1.0.0';

  // Public functions
  // ----------------

  // Run html.md in *noConflict* mode, returning the `md` variable to its
  // previous owner.  
  // Returns a reference to `md`.
  md.noConflict = function () {
    window.md = previousMd;
    return this;
  };

}());