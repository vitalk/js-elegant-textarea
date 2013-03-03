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
   * @param {Object} opts The options, sel - the selector engine
   */
  var Elegant = (function namespace() {

    var doc = w.document,
        root = doc.documentElement;

    /**
     * Shortcut to Elegant object creation
     */
    function elegant(el, opts) {
      return new Elegant(el, opts);
    }

    function Elegant(el, opts) {
      this.opts = opts || {};
      this.sel = getSelectorEngine(this.opts.sel);

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

        } else {
          this.el = el;

          if (this.opts.minHeight) {
            this.minHeight = (this.opts.minHeight == 'original') ? getHeight(el) : this.opts.minHeight;
          } else {
            this.minHeight = 0;
          }

          var resize = function() { self.resize.call(self, el); };

          apply(el, {
            'resize': 'none',
            'overflow-y': 'hidden'
          });

          attachEvent(el, 'input', resize);
          attachEvent(el, 'propertychange', resize);
        }
      }
    }

    /**
     * Resize element to fit its content.
     *
     * @param {Element} el The element to resize
     */
    Elegant.prototype.resize = function(el, m) {
      if (!el) return;
      if (!(m = getMirror(el))) return;

      el.style.height = '';
      el.style.height = max(getHeight(m), this.minHeight);
    };

    /**
     * Clone the element, inherit original style properties that affect on
     * element size.
     *
     * @param {Element} el The element to clone
     * @return {Element} The cloned element
     */
    Elegant.prototype.clone = function(el) {
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

      var original = w.getComputedStyle(el),
          rv = doc.createElement('div');

      for(var prop, props = {}, i = 0, l = propNames.length; i < l; i++) {
        prop = propNames[i];
        props[prop] = original[camelize(prop)];
      }

      apply(rv, this.extend(props, mirror));

      return rv;
    };

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
    Elegant.prototype.extend = function(o, p) {
      for (var prop in p) {
        if (p.hasOwnProperty(prop)) {
          o[prop] = p[prop];
        }
      }
      return o;
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
      return parseInt(d.replace(/(^-?[\d\.]+)([a-z]*)$/g, '$1'));
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
     * Returns the existing mirror of the element or create new one.
     *
     * @param {Element} el The original element
     * @return {Element} The mirror element
     */
    function getMirror(el) {
      var k, l, m = el.nextSibling;

      if (m && m.className == 'js-elegant-mirror') {
        m.innerHTML = '';
      } else {
        m = Elegant.prototype.clone(el);
        m.className = 'js-elegant-mirror';
        el.parentNode.insertBefore(m, el.nextSibling);
      }

      if (k = el.value) l = doc.createTextNode(k);

      k = doc.createElement('span');
      k.innerHTML = '&nbsp;';

      if (l) m.appendChild(l);
      m.appendChild(k);

      return m;
    }

    /**
     * Apply styles to element
     *
     * @param {Element} el The document element that will be styled
     * @param {Object} props The object with css property value pairs
     */
    function apply(el, props) {
      for (var prop in props) {
        el.style[camelize(prop)] = props[prop];
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
      return s.replace(/-([a-z]|[0-9])/ig, function(s, l) {
        return l.toUpperCase();
      });
    }

    /**
     * Returns the computed element height
     *
     * @param {Element} el The DOM element
     * @return {String} The computed height of the element
     */
    function getHeight(el) {
      return w.getComputedStyle(el).height;
    }

    return elegant;

  }());

  // expose to the global object
  w.Elegant = Elegant;

}(this));
