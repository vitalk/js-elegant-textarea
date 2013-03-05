/**
 * Elegant Textarea,
 * e.g. it expands to fit its content.
 *
 * Copyright © 2013 Vital Kudzelka.
 * Licensed under the MIT license http://opensource.org/licenses/MIT
 */
(function(w, undefined) {

  'use strict';

  /**
   * Make a textarea elegant,
   * e.g. it expands to fit its content.
   *
   * @param {String|Element|Function} el The textarea selector, textarea node
   * or function that invoked when the document is ready
   * @param {Object} opts The options
   * @param {Function} opts.sel The selector engine
   * @param {Function} opts.dom The DOM utility function
   */
  var Elegant = (function namespace() {

    var doc = w.document,
        root = doc.documentElement,
        // match the number with or without dimension
        runitless = /(^-?[\d\.]+)([a-z]*)$/g,
        // match dashed string for camelizing
        rdashed = /-([0-9]|[a-z])/ig,
        // match the single tag
        rtag = /^\s*<(\w+)>/;

    /**
     * Shortcut to Elegant object creation
     */
    function elegant(el, opts) {
      return new Elegant(el, opts);
    }

    function Elegant(el, opts) {
      this.opts = opts || {};
      this.sel = getSelectorEngine(this.opts.sel);
      this.dom = getDOMEngine(this.opts.dom);

      if (el) {
        var self = this;

        if (typeof el === 'string') {
          this.ready(function() {
            for(var i = 0, els = self.sel(el, root), l = els.length; i < l; i++) {
              elegant(els[i], opts);
            }
          });

        } else if (typeof el === 'function') {
          return this.ready(el);

        } else if (isNode(el)) {
          this.el = el;
          var e = this.dom(el);

          if (this.opts.minHeight) {
            this.minHeight = (this.opts.minHeight == 'original') ? e.height() : this.opts.minHeight;
          } else {
            this.minHeight = 0;
          }

          e.css({
            'resize': 'none',
            'overflow-y': 'hidden'
          });

          var resize = function() { self.resize.call(self); };

          attachEvent(el, 'input', resize);
          attachEvent(el, 'propertychange', resize);
        }
      }
    }

    /**
     * Resize element to fit its content.
     */
    Elegant.prototype.resize = function() {
      var m,
          el = this.el;

      if (!el) return;
      if (!(m = getMirror(el, this.dom))) return;

      el = this.dom(el);
      el.css({'height': ''});
      el.css({'height': max(m.height(), this.minHeight)});
    };

    /**
     * Invoke passed function when the document is ready
     *
     * @param {Function} fn Function passed to document load event
     */
    Elegant.prototype.ready = function(fn) {
      var ready = false,
          funcs = [],
          doit = function() {
            // run once
            if (ready) return;

            while (funcs.length) {
              funcs.shift().call(doc);
            }

            ready = true;
            funcs = null;
          };

          attachEvent(w, 'DOMContentLoaded', doit);
          attachEvent(w, 'readystatechange', doit);
          attachEvent(w, 'load', doit);

          if (doc.readyState === 'complete') {
            doit();
          }

          return ready ? fn.call(doc): funcs.push(fn);
    };

    /**
     * Simple DOM utility library with jQuery-like public API
     *
     * @param {String|Element|Dom} el The string to construct DOM node, the
     * DOM node to process or another class instance
     * @return {Dom} The current instance
     */
    var dom = (function() {

      /**
       * Normalize return value to Element
       *
       * @param {Element|Dom} el The element to process
       * @return {Element} The original element
       */
      function toNode(el) {
        return isNode(el) ? el : el.el;
      }

      /**
       * Shortcut to DOM object creation
       */
      function dom(el) {
        return new Dom(el);
      }

      function Dom(el) {
        var n;

        if (typeof el == 'string' && el !== '') {
          var t = el.match(rtag);

          if (t) {
            n = doc.createElement(t[1].toLowerCase());
          } else {
            n = doc.createElement('div');
            n.innerHTML = el;
          }

        } else {
          n = toNode(el);
        }

        this.el = n;
        this.support = (function() {
          return {
            classList: 'classList' in doc.createElement('p')
          };
        }());
      }

      /**
       * Get the next sibling of the element
       *
       * @return {Dom} The next sibling
       */
      Dom.prototype.next = function() {
        var el = this.el.nextSibling;
        while (el && el.nodeType !== 1) {
          el = el.nextSibling;
        }

        return el && dom(el);
      };

      /**
       * Set the HTML content to element
       *
       * @param {String|Dom} h The HTML to insert
       * @return {Dom} This instance
       */
      Dom.prototype.html = function(h) {
        if (typeof h == 'string') this.el.innerHTML = h;
        else this.append(dom(h));

        return this;
      };

      /**
       * Get the current value of the element
       *
       * @return {String} The element value
       */
      Dom.prototype.val = function() {
        return this.el.value;
      };

      /**
       * Add class to element
       *
       * @param {String} c The class name
       * @return {Dom} This instance
       */
      Dom.prototype.addClass = function(c) {
        if (this.support.classList) this.el.classList.add(c);
        else if (!this.hasClass(c)) this.el.className = this.el.className + ' ' + c;

        return this;
      };

      /**
       * Returns the element has class or not
       *
       * @param {String} c The class name to check
       * @return {Boolean} Has element class or not?
       */
      Dom.prototype.hasClass = function(c) {
        return (this.support.classList) ? this.el.classList.contains(c) : this.el.className.search('\b' + c + '\b') != -1;
      };

      /**
       * Insert content element after the current element
       *
       * @param {Element|Dom} el The element to insert
       * @return {Dom} This instance
       */
      Dom.prototype.after = function(el) {
        this.el.parentNode.insertBefore(toNode(el), this.el.nextSibling);

        return this;
      };

      /**
       * Append the passed element into the current element
       *
       * @param {Element|Dom} el The element to append
       * @return {Dom} This instance
       */
      Dom.prototype.append = function(el) {
        this.el.appendChild(toNode(el));

        return this;
      };

      /**
       * Returns the computed height of the element
       *
       * @return {String} The computed height of the element
       */
      Dom.prototype.height = function() {
        return w.getComputedStyle(this.el).height;
      };

      /**
       * Apply styles to element
       *
       * @param {Object} o The object with css property value pairs
       * @return {Dom} This instance
       */
      Dom.prototype.css = function(o) {
        for (var prop in o) {
          this.el.style[camelize(prop)] = o[prop];
        }

        return this;
      };

      return dom;

    }());

    /**
     * Returns the passed element is DOM Element or none
     *
     * @param {Object} el The element to check
     * @return {Boolean} Is element node or text node?
     */
    function isNode(el) {
      return el && el.nodeName && (el.nodeType == 1 || el.nodeType == 3);
    }

    /**
     * Force convert value to string
     *
     * @param {String|Number} v The value to convert
     * @return {String} The converted value
     */
    function toStr(v) {
      return v.toString();
    }

    /**
     * Returns max from two units. On comparison uses unitless value.
     *
     * @param {String} x The 1st unit
     * @param {String} y The 2nd unit
     * @return {String} Max from two units
     */
    function max(x, y) {
      return (unitless(x) > unitless(y)) ? x : y;
    }

    /**
     * Remove the unit of a dimension
     *
     * @param {String} d A number, with or without dimension
     */
    function unitless(d) {
      return parseInt(toStr(d).replace(runitless, '$1'));
    }

    /**
     * Clone the element, inherit original style properties that affect on
     * element size.
     *
     * @param {Element} el The element to clone
     * @param {Function} dom The DOM manipulation library
     * @return {Dom} The cloned element
     */
    function clone(el, dom) {
      var propNames = [
        "border-bottom-width",
        "border-left-width",
        "border-right-width",
        "border-top-width",
        "border-width",
        "border-style",
        "box-sizing",
        "font-family",
        "font-size",
        "font-style",
        "font-variant",
        "font-weight",
        "letter-spacing",
        "line-height",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "text-decoration",
        "text-transform",
        "text-indent",
        "width",
        "word-spacing"
      ];
      var mirror = {
        'position'   : 'absolute',
        'left'       : '-9999px',
        'top'        : '0px',
        'overflow-y' : 'hidden',
        'word-wrap'  : 'break-word',
        'white-space': 'pre-wrap'
      };

      var original = w.getComputedStyle(el);

      for(var prop, props = {}, i = 0, l = propNames.length; i < l; i++) {
        prop = propNames[i];
        props[prop] = original[camelize(prop)];
      }

      return dom('<div>').css(extend(props, mirror));

    }

    /**
     * Returns the existing mirror of the element or create new one.
     *
     * @param {Element} el The original element
     * @param {Function} dom The DOM utility library
     * @return {Dom} The mirror element
     */
    function getMirror(el, dom) {
      var k,
          l = dom(el),
          m = l.next();

      if (m && m.hasClass('js-elegant-mirror')) {
        m.html('');
      } else {
        m = clone(el, dom);
        m.addClass('js-elegant-mirror');
        l.after(m);
      }

      // does not allow mirror collapse whitespaces
      if (l = l.val()) l = dom(doc.createTextNode(l));
      k = dom('<span>').html('&nbsp;');

      if (l) m.append(l);
      m.append(k);

      return m;
    }

    /**
     * Register the specified handler function to handle events of the specified
     * type on the specified target
     *
     * @param {Element} target The event target
     * @param {String} type The event type
     * @param {Function} handler The event handler
     */
    function attachEvent(target, type, handler) {
      if (target.addEventListener) {
        target.addEventListener(type, handler, false);
      } else if (target.attachEvent) {
        target.attachEvent('on' + type, function(e) {
          return handler.call(target, e);
        });
      }
    }

    /**
     * Convert string with hyphens to camelCase (useful for convert css style
     * property to valid object property).
     *
     * @param {String} s The input string
     * @return {String} The camelCase string
     */
    function camelize(s) {
      return s.replace(rdashed, function(s, l) {
        return l.toUpperCase();
      });
    }

    /**
     * Copy the enumerable properties of p to o, and return o
     * If o and p have are property with the same name, o's property is
     * overwritten. This function does not handle getters and setters or copy
     * attributes.
     *
     * @param {Object} o The original object
     * @param {Object} p The another object
     * @return {Object} The object with properties of two objects
     */
    function extend(o, p) {
      for (var prop in p) {
        if (p.hasOwnProperty(prop)) {
          o[prop] = p[prop];
        }
      }
      return o;
    }

    /**
     * Returns the selector engine
     *
     * @param {Function} e The selector engine or nothing
     * @return {Function} The selector engine
     */
    function getSelectorEngine(e) {
      if (e) return e;
      else {
        return doc.querySelectorAll
        ? function(s, r) {
          return r.querySelectorAll(s);
        }
        : function() {
          throw new Error('Elegant: no selector engine found');
        };
      }
    }

    /**
     * Returns the DOM manipulation library
     *
     * @param {Function} fn The DOM manipulation library or nothing
     * @return {Function} The DOM manipulation library
     */
    function getDOMEngine(fn) {
      return fn ? fn : dom;
    }

    return elegant;

  }());

  // expose to the global object
  w.Elegant = Elegant;

}(this));
