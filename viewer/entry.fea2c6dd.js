// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../../../../node_modules/preact/dist/preact.module.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.render = I;
exports.hydrate = L;
exports.h = exports.createElement = h;
exports.Fragment = d;
exports.createRef = p;
exports.Component = m;
exports.cloneElement = M;
exports.createContext = O;
exports.toChildArray = x;
exports._unmount = D;
exports.options = exports.isValidElement = void 0;
var n,
    l,
    u,
    t,
    i,
    r,
    o,
    f = {},
    e = [],
    c = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|^--/i;
exports.isValidElement = l;
exports.options = n;

function s(n, l) {
  for (var u in l) n[u] = l[u];

  return n;
}

function a(n) {
  var l = n.parentNode;
  l && l.removeChild(n);
}

function h(n, l, u) {
  var t,
      i,
      r,
      o,
      f = arguments;
  if (l = s({}, l), arguments.length > 3) for (u = [u], t = 3; t < arguments.length; t++) u.push(f[t]);
  if (null != u && (l.children = u), null != n && null != n.defaultProps) for (i in n.defaultProps) void 0 === l[i] && (l[i] = n.defaultProps[i]);
  return o = l.key, null != (r = l.ref) && delete l.ref, null != o && delete l.key, v(n, l, o, r);
}

function v(l, u, t, i) {
  var r = {
    type: l,
    props: u,
    key: t,
    ref: i,
    __k: null,
    __p: null,
    __b: 0,
    __e: null,
    l: null,
    __c: null,
    constructor: void 0
  };
  return n.vnode && n.vnode(r), r;
}

function p() {
  return {};
}

function d(n) {
  return n.children;
}

function y(n) {
  if (null == n || "boolean" == typeof n) return null;
  if ("string" == typeof n || "number" == typeof n) return v(null, n, null, null);

  if (null != n.__e || null != n.__c) {
    var l = v(n.type, n.props, n.key, null);
    return l.__e = n.__e, l;
  }

  return n;
}

function m(n, l) {
  this.props = n, this.context = l;
}

function w(n, l) {
  if (null == l) return n.__p ? w(n.__p, n.__p.__k.indexOf(n) + 1) : null;

  for (var u; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) return u.__e;

  return "function" == typeof n.type ? w(n) : null;
}

function g(n) {
  var l, u;

  if (null != (n = n.__p) && null != n.__c) {
    for (n.__e = n.__c.base = null, l = 0; l < n.__k.length; l++) if (null != (u = n.__k[l]) && null != u.__e) {
      n.__e = n.__c.base = u.__e;
      break;
    }

    return g(n);
  }
}

function k(l) {
  (!l.__d && (l.__d = !0) && 1 === u.push(l) || i !== n.debounceRendering) && (i = n.debounceRendering, (n.debounceRendering || t)(_));
}

function _() {
  var n, l, t, i, r, o, f;

  for (u.sort(function (n, l) {
    return l.__v.__b - n.__v.__b;
  }); n = u.pop();) n.__d && (t = void 0, i = void 0, o = (r = (l = n).__v).__e, (f = l.__P) && (t = [], i = $(f, r, s({}, r), l.__n, void 0 !== f.ownerSVGElement, null, t, null == o ? w(r) : o), j(t, r), i != o && g(r)));
}

function b(n, l, u, t, i, r, o, c, s) {
  var h,
      v,
      p,
      d,
      y,
      m,
      g,
      k = u && u.__k || e,
      _ = k.length;
  if (c == f && (c = null != r ? r[0] : _ ? w(u, 0) : null), h = 0, l.__k = x(l.__k, function (u) {
    if (null != u) {
      if (u.__p = l, u.__b = l.__b + 1, null === (p = k[h]) || p && u.key == p.key && u.type === p.type) k[h] = void 0;else for (v = 0; v < _; v++) {
        if ((p = k[v]) && u.key == p.key && u.type === p.type) {
          k[v] = void 0;
          break;
        }

        p = null;
      }

      if (d = $(n, u, p = p || f, t, i, r, o, c, s), (v = u.ref) && p.ref != v && (g || (g = [])).push(v, u.__c || d, u), null != d) {
        if (null == m && (m = d), null != u.l) d = u.l, u.l = null;else if (r == p || d != c || null == d.parentNode) {
          n: if (null == c || c.parentNode !== n) n.appendChild(d);else {
            for (y = c, v = 0; (y = y.nextSibling) && v < _; v += 2) if (y == d) break n;

            n.insertBefore(d, c);
          }

          "option" == l.type && (n.value = "");
        }
        c = d.nextSibling, "function" == typeof l.type && (l.l = d);
      }
    }

    return h++, u;
  }), l.__e = m, null != r && "function" != typeof l.type) for (h = r.length; h--;) null != r[h] && a(r[h]);

  for (h = _; h--;) null != k[h] && D(k[h], k[h]);

  if (g) for (h = 0; h < g.length; h++) A(g[h], g[++h], g[++h]);
}

function x(n, l, u) {
  if (null == u && (u = []), null == n || "boolean" == typeof n) l && u.push(l(null));else if (Array.isArray(n)) for (var t = 0; t < n.length; t++) x(n[t], l, u);else u.push(l ? l(y(n)) : n);
  return u;
}

function C(n, l, u, t, i) {
  var r;

  for (r in u) r in l || N(n, r, null, u[r], t);

  for (r in l) i && "function" != typeof l[r] || "value" === r || "checked" === r || u[r] === l[r] || N(n, r, l[r], u[r], t);
}

function P(n, l, u) {
  "-" === l[0] ? n.setProperty(l, u) : n[l] = "number" == typeof u && !1 === c.test(l) ? u + "px" : null == u ? "" : u;
}

function N(n, l, u, t, i) {
  var r, o, f, e, c;
  if ("key" === (l = i ? "className" === l ? "class" : l : "class" === l ? "className" : l) || "children" === l) ;else if ("style" === l) {
    if (r = n.style, "string" == typeof u) r.cssText = u;else {
      if ("string" == typeof t && (r.cssText = "", t = null), t) for (o in t) u && o in u || P(r, o, "");
      if (u) for (f in u) t && u[f] === t[f] || P(r, f, u[f]);
    }
  } else "o" === l[0] && "n" === l[1] ? (e = l !== (l = l.replace(/Capture$/, "")), c = l.toLowerCase(), l = (c in n ? c : l).slice(2), u ? (t || n.addEventListener(l, T, e), (n.u || (n.u = {}))[l] = u) : n.removeEventListener(l, T, e)) : "list" !== l && "tagName" !== l && "form" !== l && !i && l in n ? n[l] = null == u ? "" : u : "function" != typeof u && "dangerouslySetInnerHTML" !== l && (l !== (l = l.replace(/^xlink:?/, "")) ? null == u || !1 === u ? n.removeAttributeNS("http://www.w3.org/1999/xlink", l.toLowerCase()) : n.setAttributeNS("http://www.w3.org/1999/xlink", l.toLowerCase(), u) : null == u || !1 === u ? n.removeAttribute(l) : n.setAttribute(l, u));
}

function T(l) {
  return this.u[l.type](n.event ? n.event(l) : l);
}

function $(l, u, t, i, r, o, f, e, c) {
  var a,
      h,
      v,
      p,
      y,
      w,
      g,
      k,
      _,
      C,
      P = u.type;

  if (void 0 !== u.constructor) return null;
  (a = n.__b) && a(u);

  try {
    n: if ("function" == typeof P) {
      if (k = u.props, _ = (a = P.contextType) && i[a.__c], C = a ? _ ? _.props.value : a.__p : i, t.__c ? g = (h = u.__c = t.__c).__p = h.__E : ("prototype" in P && P.prototype.render ? u.__c = h = new P(k, C) : (u.__c = h = new m(k, C), h.constructor = P, h.render = H), _ && _.sub(h), h.props = k, h.state || (h.state = {}), h.context = C, h.__n = i, v = h.__d = !0, h.__h = []), null == h.__s && (h.__s = h.state), null != P.getDerivedStateFromProps && s(h.__s == h.state ? h.__s = s({}, h.__s) : h.__s, P.getDerivedStateFromProps(k, h.__s)), v) null == P.getDerivedStateFromProps && null != h.componentWillMount && h.componentWillMount(), null != h.componentDidMount && f.push(h);else {
        if (null == P.getDerivedStateFromProps && null == h.t && null != h.componentWillReceiveProps && h.componentWillReceiveProps(k, C), !h.t && null != h.shouldComponentUpdate && !1 === h.shouldComponentUpdate(k, h.__s, C)) {
          for (h.props = k, h.state = h.__s, h.__d = !1, h.__v = u, u.__e = t.__e, u.__k = t.__k, a = 0; a < u.__k.length; a++) u.__k[a] && (u.__k[a].__p = u);

          break n;
        }

        null != h.componentWillUpdate && h.componentWillUpdate(k, h.__s, C);
      }
      p = h.props, y = h.state, h.context = C, h.props = k, h.state = h.__s, (a = n.__r) && a(u), h.__d = !1, h.__v = u, h.__P = l, a = h.render(h.props, h.state, h.context), u.__k = x(null != a && a.type == d && null == a.key ? a.props.children : a), null != h.getChildContext && (i = s(s({}, i), h.getChildContext())), v || null == h.getSnapshotBeforeUpdate || (w = h.getSnapshotBeforeUpdate(p, y)), b(l, u, t, i, r, o, f, e, c), h.base = u.__e, a = h.__h, h.__h = [], a.some(function (n) {
        n.call(h);
      }), v || null == p || null == h.componentDidUpdate || h.componentDidUpdate(p, y, w), g && (h.__E = h.__p = null), h.t = null;
    } else u.__e = z(t.__e, u, t, i, r, o, f, c);

    (a = n.diffed) && a(u);
  } catch (l) {
    n.__e(l, u, t);
  }

  return u.__e;
}

function j(l, u) {
  for (var t; t = l.pop();) try {
    t.componentDidMount();
  } catch (l) {
    n.__e(l, t.__v);
  }

  n.__c && n.__c(u);
}

function z(n, l, u, t, i, r, o, c) {
  var s,
      a,
      h,
      v,
      p,
      d = u.props,
      y = l.props;
  if (i = "svg" === l.type || i, null == n && null != r) for (s = 0; s < r.length; s++) if (null != (a = r[s]) && (null === l.type ? 3 === a.nodeType : a.localName === l.type)) {
    n = a, r[s] = null;
    break;
  }

  if (null == n) {
    if (null === l.type) return document.createTextNode(y);
    n = i ? document.createElementNS("http://www.w3.org/2000/svg", l.type) : document.createElement(l.type), r = null;
  }

  if (null === l.type) null != r && (r[r.indexOf(n)] = null), d !== y && (n.data = y);else if (l !== u) {
    if (null != r && (r = e.slice.call(n.childNodes)), h = (d = u.props || f).dangerouslySetInnerHTML, v = y.dangerouslySetInnerHTML, !c) {
      if (d === f) for (d = {}, p = 0; p < n.attributes.length; p++) d[n.attributes[p].name] = n.attributes[p].value;
      (v || h) && (v && h && v.__html == h.__html || (n.innerHTML = v && v.__html || ""));
    }

    C(n, y, d, i, c), l.__k = l.props.children, v || b(n, l, u, t, "foreignObject" !== l.type && i, r, o, f, c), c || ("value" in y && void 0 !== y.value && y.value !== n.value && (n.value = null == y.value ? "" : y.value), "checked" in y && void 0 !== y.checked && y.checked !== n.checked && (n.checked = y.checked));
  }
  return n;
}

function A(l, u, t) {
  try {
    "function" == typeof l ? l(u) : l.current = u;
  } catch (l) {
    n.__e(l, t);
  }
}

function D(l, u, t) {
  var i, r, o;

  if (n.unmount && n.unmount(l), (i = l.ref) && A(i, null, u), t || "function" == typeof l.type || (t = null != (r = l.__e)), l.__e = l.l = null, null != (i = l.__c)) {
    if (i.componentWillUnmount) try {
      i.componentWillUnmount();
    } catch (l) {
      n.__e(l, u);
    }
    i.base = i.__P = null;
  }

  if (i = l.__k) for (o = 0; o < i.length; o++) i[o] && D(i[o], u, t);
  null != r && a(r);
}

function H(n, l, u) {
  return this.constructor(n, u);
}

function I(l, u, t) {
  var i, o, c;
  n.__p && n.__p(l, u), o = (i = t === r) ? null : t && t.__k || u.__k, l = h(d, null, [l]), c = [], $(u, i ? u.__k = l : (t || u).__k = l, o || f, f, void 0 !== u.ownerSVGElement, t && !i ? [t] : o ? null : e.slice.call(u.childNodes), c, t || f, i), j(c, l);
}

function L(n, l) {
  I(n, l, r);
}

function M(n, l) {
  return l = s(s({}, n.props), l), arguments.length > 2 && (l.children = e.slice.call(arguments, 2)), v(n.type, l, l.key || n.key, l.ref || n.ref);
}

function O(n) {
  var l = {},
      u = {
    __c: "__cC" + o++,
    __p: n,
    Consumer: function (n, l) {
      return n.children(l);
    },
    Provider: function (n) {
      var t,
          i = this;
      return this.getChildContext || (t = [], this.getChildContext = function () {
        return l[u.__c] = i, l;
      }, this.shouldComponentUpdate = function (l) {
        n.value !== l.value && t.some(function (n) {
          n.__P && (n.context = l.value, k(n));
        });
      }, this.sub = function (n) {
        t.push(n);
        var l = n.componentWillUnmount;

        n.componentWillUnmount = function () {
          t.splice(t.indexOf(n), 1), l && l.call(n);
        };
      }), n.children;
    }
  };
  return u.Consumer.contextType = u, u;
}

exports.options = n = {}, exports.isValidElement = l = function (n) {
  return null != n && void 0 === n.constructor;
}, m.prototype.setState = function (n, l) {
  var u = this.__s !== this.state && this.__s || (this.__s = s({}, this.state));
  ("function" != typeof n || (n = n(u, this.props))) && s(u, n), null != n && this.__v && (this.t = !1, l && this.__h.push(l), k(this));
}, m.prototype.forceUpdate = function (n) {
  this.__v && (this.t = !0, n && this.__h.push(n), k(this));
}, m.prototype.render = d, u = [], t = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, i = n.debounceRendering, n.__e = function (n, l, u) {
  for (var t; l = l.__p;) if ((t = l.__c) && !t.__p) try {
    if (t.constructor && null != t.constructor.getDerivedStateFromError) t.setState(t.constructor.getDerivedStateFromError(n));else {
      if (null == t.componentDidCatch) continue;
      t.componentDidCatch(n);
    }
    return k(t.__E = t);
  } catch (l) {
    n = l;
  }

  throw n;
}, r = f, o = 0;
},{}],"../../../../node_modules/preact/hooks/dist/hooks.module.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useState = c;
exports.useReducer = a;
exports.useEffect = v;
exports.useLayoutEffect = m;
exports.useRef = d;
exports.useImperativeHandle = p;
exports.useMemo = l;
exports.useCallback = s;
exports.useContext = y;
exports.useDebugValue = _;

var _preact = require("preact");

var t,
    r,
    u = [],
    i = _preact.options.__r;

_preact.options.__r = function (n) {
  i && i(n), t = 0, (r = n.__c).__H && (r.__H.t = A(r.__H.t));
};

var f = _preact.options.diffed;

_preact.options.diffed = function (n) {
  f && f(n);
  var t = n.__c;

  if (t) {
    var r = t.__H;
    r && (r.u = (r.u.some(function (n) {
      n.ref && (n.ref.current = n.createHandle());
    }), []), r.i = A(r.i));
  }
};

var o = _preact.options.unmount;

function e(t) {
  _preact.options.__h && _preact.options.__h(r);
  var u = r.__H || (r.__H = {
    o: [],
    t: [],
    i: [],
    u: []
  });
  return t >= u.o.length && u.o.push({}), u.o[t];
}

function c(n) {
  return a(q, n);
}

function a(n, u, i) {
  var f = e(t++);
  return f.__c || (f.__c = r, f.v = [i ? i(u) : q(void 0, u), function (t) {
    var r = n(f.v[0], t);
    f.v[0] !== r && (f.v[0] = r, f.__c.setState({}));
  }]), f.v;
}

function v(n, u) {
  var i = e(t++);
  h(i.m, u) && (i.v = n, i.m = u, r.__H.t.push(i), T(r));
}

function m(n, u) {
  var i = e(t++);
  h(i.m, u) && (i.v = n, i.m = u, r.__H.i.push(i));
}

function d(n) {
  return l(function () {
    return {
      current: n
    };
  }, []);
}

function p(n, u, i) {
  var f = e(t++);
  h(f.m, i) && (f.m = i, r.__H.u.push({
    ref: n,
    createHandle: u
  }));
}

function l(n, r) {
  var u = e(t++);
  return h(u.m, r) ? (u.m = r, u.p = n, u.v = n()) : u.v;
}

function s(n, t) {
  return l(function () {
    return n;
  }, t);
}

function y(n) {
  var u = r.context[n.__c];
  if (!u) return n.__p;
  var i = e(t++);
  return null == i.v && (i.v = !0, u.sub(r)), u.props.value;
}

function _(t, r) {
  _preact.options.useDebugValue && _preact.options.useDebugValue(r ? r(t) : t);
}

_preact.options.unmount = function (n) {
  o && o(n);
  var t = n.__c;

  if (t) {
    var r = t.__H;
    r && r.o.forEach(function (n) {
      return n.l && n.l();
    });
  }
};

var T = function () {};

function g() {
  u.some(function (n) {
    n.s = !1, n.__P && (n.__H.t = A(n.__H.t));
  }), u = [];
}

if ("undefined" != typeof window) {
  var w = _preact.options.requestAnimationFrame;

  T = function (t) {
    (!t.s && (t.s = !0) && 1 === u.push(t) || w !== _preact.options.requestAnimationFrame) && (w = _preact.options.requestAnimationFrame, (_preact.options.requestAnimationFrame || function (n) {
      var t = function () {
        clearTimeout(r), cancelAnimationFrame(u), setTimeout(n);
      },
          r = setTimeout(t, 100),
          u = requestAnimationFrame(t);
    })(g));
  };
}

function A(n) {
  return n.forEach(E), n.forEach(F), [];
}

function E(n) {
  n.l && n.l();
}

function F(n) {
  var t = n.v();
  "function" == typeof t && (n.l = t);
}

function h(n, t) {
  return !n || t.some(function (t, r) {
    return t !== n[r];
  });
}

function q(n, t) {
  return "function" == typeof t ? t(n) : t;
}
},{"preact":"../../../../node_modules/preact/dist/preact.module.js"}],"../../../../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();

  newLink.onload = function () {
    link.remove();
  };

  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;

function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":"../../../../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"../../../server/src/ui/icons.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/tooltips.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/app.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"./icons.css":"../../../server/src/ui/icons.css","./tooltips.css":"../../../server/src/ui/tooltips.css","_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"app.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"routes/landing/landing.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../../node_modules/clsx/dist/clsx.m.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

function toVal(mix) {
  var k,
      y,
      str = '';

  if (mix) {
    if (typeof mix === 'object') {
      if (!!mix.push) {
        for (k = 0; k < mix.length; k++) {
          if (mix[k] && (y = toVal(mix[k]))) {
            str && (str += ' ');
            str += y;
          }
        }
      } else {
        for (k in mix) {
          if (mix[k] && (y = toVal(k))) {
            str && (str += ' ');
            str += y;
          }
        }
      }
    } else if (typeof mix !== 'boolean' && !mix.call) {
      str && (str += ' ');
      str += mix;
    }
  }

  return str;
}

function _default() {
  var i = 0,
      x,
      str = '';

  while (i < arguments.length) {
    if (x = toVal(arguments[i++])) {
      str && (str += ' ');
      str += x;
    }
  }

  return str;
}
},{}],"../../../server/src/ui/components/loading-spinner.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/loading-spinner.svg":[function(require,module,exports) {
module.exports = "/loading-spinner.ba6b42a7.svg";
},{}],"../../../server/src/ui/components/loading-spinner.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LoadingSpinner = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

require("./loading-spinner.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// @ts-ignore - tsc doesn't understand parcel :)
const SVG_PATH = require('./loading-spinner.svg');

const LoadingSpinner_ = () => {
  return (0, _preact.h)("img", {
    src: SVG_PATH,
    alt: "Loading spinner"
  });
};
/** @param {{solo?: boolean}} props */


const LoadingSpinner = props => {
  return (0, _preact.h)("div", {
    className: (0, _clsx.default)('loading-spinner', {
      'loading-spinner--container': !props.solo
    })
  }, (0, _preact.h)(LoadingSpinner_, null));
};

exports.LoadingSpinner = LoadingSpinner;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","./loading-spinner.css":"../../../server/src/ui/components/loading-spinner.css","./loading-spinner.svg":"../../../server/src/ui/components/loading-spinner.svg"}],"../../../server/src/ui/components/paper.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/paper.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Paper = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

require("./paper.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{children: string|JSX.Element|JSX.Element[], className?: string, key?: any}} props */
const Paper = props => {
  const {
    children
  } = props;
  return (0, _preact.h)("div", {
    className: (0, _clsx.default)('paper', props.className)
  }, children);
};

exports.Paper = Paper;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","./paper.css":"../../../server/src/ui/components/paper.css"}],"../../../server/src/ui/components/lhr-viewer-link.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LhrViewerLink = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{children: string|JSX.Element|JSX.Element[], lhr: LH.Result, className?: string}} props */
const LhrViewerLink = props => {
  const {
    children,
    lhr
  } = props;
  return (0, _preact.h)("span", {
    className: (0, _clsx.default)('lhr-viewer-link', props.className),
    onClick: evt => {
      evt.preventDefault();
      evt.stopImmediatePropagation();
      const VIEWER_ORIGIN = 'https://googlechrome.github.io'; // Chrome doesn't allow us to immediately postMessage to a popup right
      // after it's created. Normally, we could also listen for the popup window's
      // load event, however it is cross-domain and won't fire. Instead, listen
      // for a message from the target app saying "I'm open".

      window.addEventListener('message', function msgHandler(messageEvent) {
        if (messageEvent.origin !== VIEWER_ORIGIN) {
          return;
        }

        if (popup && messageEvent.data.opened) {
          popup.postMessage({
            lhresults: lhr
          }, VIEWER_ORIGIN);
          window.removeEventListener('message', msgHandler);
        }
      }); // The popup's window.name is keyed by version+url+fetchTime, so we reuse/select tabs correctly

      const fetchTime = lhr.fetchTime;
      const windowName = `${lhr.lighthouseVersion}-${lhr.requestedUrl}-${fetchTime}`;
      const popup = window.open(`${VIEWER_ORIGIN}/lighthouse/viewer`, windowName);
    }
  }, children);
};

exports.LhrViewerLink = LhrViewerLink;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js"}],"../../../server/src/ui/components/lhr-viewer-button.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/favicon.svg":[function(require,module,exports) {
module.exports = "/favicon.eb30a9d8.svg";
},{}],"../../../server/src/ui/components/lhr-viewer-button.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LhrViewerButton = void 0;

var _preact = require("preact");

var _lhrViewerLink = require("./lhr-viewer-link");

require("./lhr-viewer-button.css");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// @ts-ignore - ts doesn't know how parcel works :)
const LH_ICON_PATH = require('../favicon.svg');
/** @param {{lhr: LH.Result, label?: string}} props */


const LhrViewerButton = props => {
  const {
    lhr,
    label = 'Open Report'
  } = props;
  return (0, _preact.h)(_lhrViewerLink.LhrViewerLink, {
    lhr: lhr
  }, (0, _preact.h)("div", {
    className: "lhr-viewer-button",
    role: "button"
  }, (0, _preact.h)("img", {
    src: LH_ICON_PATH
  }), " ", (0, _preact.h)("span", null, label)));
};

exports.LhrViewerButton = LhrViewerButton;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./lhr-viewer-link":"../../../server/src/ui/components/lhr-viewer-link.jsx","./lhr-viewer-button.css":"../../../server/src/ui/components/lhr-viewer-button.css","../favicon.svg":"../../../server/src/ui/favicon.svg"}],"../../../server/src/ui/routes/project-list/confetti.svg":[function(require,module,exports) {
module.exports = "/confetti.ed985ee1.svg";
},{}],"../../../server/src/ui/logo.svg":[function(require,module,exports) {
module.exports = "/logo.f7055324.svg";
},{}],"components/lhci-components.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "LoadingSpinner", {
  enumerable: true,
  get: function () {
    return _loadingSpinner.LoadingSpinner;
  }
});
Object.defineProperty(exports, "Paper", {
  enumerable: true,
  get: function () {
    return _paper.Paper;
  }
});
Object.defineProperty(exports, "LhrViewerButton", {
  enumerable: true,
  get: function () {
    return _lhrViewerButton.LhrViewerButton;
  }
});
exports.LH_LOGO_PATH = exports.CONFETTI_PATH = void 0;

var _preact = require("preact");

var _loadingSpinner = require("../../../../server/src/ui/components/loading-spinner.jsx");

var _paper = require("../../../../server/src/ui/components/paper.jsx");

var _lhrViewerButton = require("../../../../server/src/ui/components/lhr-viewer-button.jsx");

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// @ts-ignore - tsc doesn't get parcel :)
const CONFETTI_PATH = require('../../../../server/src/ui/routes/project-list/confetti.svg'); // @ts-ignore - tsc doesn't get parcel :)


exports.CONFETTI_PATH = CONFETTI_PATH;

const LH_LOGO_PATH = require('../../../../server/src/ui/logo.svg');

exports.LH_LOGO_PATH = LH_LOGO_PATH;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","../../../../server/src/ui/components/loading-spinner.jsx":"../../../server/src/ui/components/loading-spinner.jsx","../../../../server/src/ui/components/paper.jsx":"../../../server/src/ui/components/paper.jsx","../../../../server/src/ui/components/lhr-viewer-button.jsx":"../../../server/src/ui/components/lhr-viewer-button.jsx","../../../../server/src/ui/routes/project-list/confetti.svg":"../../../server/src/ui/routes/project-list/confetti.svg","../../../../server/src/ui/logo.svg":"../../../server/src/ui/logo.svg"}],"components/report-upload-box.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"components/report-upload-box.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseStringAsLhr = parseStringAsLhr;
exports.computeBestDisplayType = computeBestDisplayType;
exports.ReportUploadBox = void 0;

var _preact = require("preact");

require("./report-upload-box.css");

var _lhciComponents = require("./lhci-components");

var _hooks = require("preact/hooks");

var _clsx = _interopRequireDefault(require("clsx"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {import('../app.jsx').ToastMessage} ToastMessage */

/** @typedef {import('../app.jsx').ReportData} ReportData */

/** @typedef {'filename'|'hostname'|'pathname'|'path'|'timestamp-hostname'|'timestamp-pathname'} DisplayType */

/** @typedef {{variant: 'base'|'compare', displayType: DisplayType, report: ReportData|undefined, setReport: (d: ReportData) => void, addToast: (t: ToastMessage) => void, showOpenLhrLink?: boolean, dragTarget?: 'self' | 'document'}} ReportUploadBoxProps */

/** @typedef {{isDragging: boolean, dragTarget: HTMLElement|undefined}} DragData */

/** @param {string} s @return {LH.Result|Error} */
function parseStringAsLhr(s) {
  if (s.includes('<script>window.__LIGHTHOUSE_JSON__ = ')) {
    const match = s.match(/window\.__LIGHTHOUSE_JSON__ = (.*?});<\/script>/);
    if (match) s = match[1];
  }

  if (s.trim().charAt(0) === '{') {
    try {
      const lhr = JSON.parse(s);
      if (lhr.lighthouseVersion) return lhr;
      return new Error(`JSON did not contain a lighthouseVersion`);
    } catch (err) {
      return new Error(`File was not valid JSON (${err.message})`);
    }
  }

  return new Error('File was not a valid report');
}
/** @param {LH.Result} lhrA  @param {LH.Result} lhrB @return {DisplayType} */


function computeBestDisplayType(lhrA, lhrB) {
  const urlA = new URL(lhrA.finalUrl);
  const urlB = new URL(lhrB.finalUrl);
  if (urlA.hostname !== urlB.hostname) return 'hostname';
  if (urlA.pathname !== urlB.pathname) return 'pathname';
  if (urlA.search !== urlB.search) return 'path';
  if (urlA.pathname.length < 5) return 'timestamp-hostname';
  return 'timestamp-pathname';
}
/** @param {{report: ReportData, displayType: DisplayType}} props */


const FilePill = props => {
  const {
    filename,
    lhr
  } = props.report;
  const url = new URL(lhr.finalUrl);
  const timestamp = new Date(lhr.fetchTime).toLocaleString();
  const options = {
    filename,
    hostname: url.hostname,
    pathname: url.pathname,
    path: `${url.pathname}${url.search}`,
    'timestamp-hostname': `${timestamp} (${url.hostname})`,
    'timestamp-pathname': `${timestamp} (${url.pathname})`
  };
  const tooltip = `${url.href} at ${timestamp}`;
  return (0, _preact.h)("span", {
    title: tooltip
  }, options[props.displayType]);
};
/** @param {Pick<ReportUploadBoxProps, 'addToast'|'setReport'>} props @param {FileList} fileList */


function handleFileInput(props, fileList) {
  const filename = fileList[0].name;
  const reader = new FileReader();
  reader.readAsText(fileList[0], 'utf-8');
  reader.addEventListener('load', () => {
    if (typeof reader.result !== 'string') {
      props.addToast({
        message: 'File was not readable as text!',
        level: 'error'
      });
      return;
    }

    const lhr = parseStringAsLhr(reader.result);

    if (lhr instanceof Error) {
      props.addToast({
        message: `Invalid file: ${lhr.message}`,
        level: 'error'
      });
      return;
    }

    props.setReport({
      filename,
      data: reader.result,
      lhr
    });
  });
  reader.addEventListener('error', () => {
    props.addToast({
      message: 'File was not readable!',
      level: 'error'
    });
  });
}
/** @param {ReportUploadBoxProps} props @param {DragData} dragData @param {(d: DragData) => void} setDragData @param {Event} e */


function handleDragEnter(props, dragData, setDragData, e) {
  if (!(e.target instanceof HTMLElement)) return;
  if (dragData.isDragging && dragData.dragTarget === e.target) return;
  e.stopPropagation();
  e.preventDefault();
  setDragData({
    isDragging: true,
    dragTarget: e.target
  });
}
/** @param {ReportUploadBoxProps} props @param {DragData} dragData @param {(d: DragData) => void} setDragData @param {Event} e */


function handleDragLeave(props, dragData, setDragData, e) {
  if (e.target !== dragData.dragTarget) return;
  e.stopPropagation();
  e.preventDefault();
  setDragData({
    isDragging: false,
    dragTarget: undefined
  });
}
/** @param {ReportUploadBoxProps} props @param {DragData} dragData @param {(d: DragData) => void} setDragData @param {Event} e */


function handleDragOver(props, dragData, setDragData, e) {
  if (!dragData.dragTarget) return;
  e.stopPropagation();
  e.preventDefault();
}
/** @param {Pick<ReportUploadBoxProps, 'addToast'|'setReport'>} props @param {DragData} dragData @param {(d: DragData) => void} setDragData @param {Event} e */


function handleDrop(props, dragData, setDragData, e) {
  if (!dragData.dragTarget) return;
  if (!(e instanceof DragEvent)) return;
  if (!e.dataTransfer) return;
  e.stopPropagation();
  e.preventDefault();
  setDragData({
    isDragging: false,
    dragTarget: undefined
  });
  handleFileInput(props, e.dataTransfer.files);
}
/** @param {ReportUploadBoxProps} props */


const ReportUploadBox = props => {
  const [dragData, setDragData] = (0, _hooks.useState)({
    isDragging: false,
    dragTarget:
    /** @type {HTMLElement|undefined} */
    undefined
  });
  (0, _hooks.useEffect)(() => {
    if (props.dragTarget !== 'document') return;
    /** @param {Event} e */

    const onDragEnter = e => handleDragEnter(props, dragData, setDragData, e);
    /** @param {Event} e */


    const onDragLeave = e => handleDragLeave(props, dragData, setDragData, e);
    /** @param {Event} e */


    const onDragOver = e => handleDragOver(props, dragData, setDragData, e);
    /** @param {Event} e */


    const onDrop = e => handleDrop(props, dragData, setDragData, e);

    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [props.dragTarget, props.addToast, props.setReport, dragData, setDragData]);
  return (0, _preact.h)("div", {
    className: (0, _clsx.default)(`report-upload-box report-upload-box--${props.variant}`, {
      'report-upload-box--drop': dragData.isDragging
    }),
    onDragEnter: e => handleDragEnter(props, dragData, setDragData, e),
    onDragLeave: e => handleDragLeave(props, dragData, setDragData, e),
    onDragOver: e => handleDragOver(props, dragData, setDragData, e),
    onDrop: e => handleDrop(props, dragData, setDragData, e)
  }, (0, _preact.h)("div", {
    className: "report-upload-box__drop-outline"
  }, "Drop your report to upload"), (0, _preact.h)("span", {
    className: "report-upload-box__label"
  }, props.variant === 'base' ? 'Base' : 'Compare'), (0, _preact.h)("div", {
    className: "report-upload-box__file"
  }, props.report ? (0, _preact.h)(FilePill, {
    report: props.report,
    displayType: props.displayType
  }) : (0, _preact.h)(_preact.Fragment, null)), (0, _preact.h)("div", {
    className: "report-upload-box__lhr-link"
  }, props.report && props.showOpenLhrLink ? (0, _preact.h)(_lhciComponents.LhrViewerButton, {
    lhr: props.report.lhr,
    label: "View Report"
  }) : null), (0, _preact.h)("div", {
    className: "report-upload-box__spacer"
  }), (0, _preact.h)("label", {
    className: "report-upload-box__upload"
  }, "Upload", (0, _preact.h)("input", {
    type: "file",
    style: {
      display: 'none'
    },
    onChange: e => {
      const input = e.target;
      if (!(input instanceof HTMLInputElement)) return;
      const fileList = input.files;
      if (!fileList || fileList.length !== 1) return;
      handleFileInput(props, fileList);
    }
  })));
};

exports.ReportUploadBox = ReportUploadBox;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./report-upload-box.css":"components/report-upload-box.css","./lhci-components":"components/lhci-components.jsx","preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js"}],"routes/landing/landing.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LandingRoute = void 0;

var _preact = require("preact");

require("./landing.css");

var _lhciComponents = require("../../components/lhci-components.jsx");

var _reportUploadBox = require("../../components/report-upload-box");

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {import('../../app.jsx').ToastMessage} ToastMessage */

/** @typedef {import('../../app.jsx').ReportData} ReportData */

/** @param {{baseReport?: ReportData, compareReport?: ReportData, setBaseReport: (d: ReportData) => void, setCompareReport: (d: ReportData) => void, addToast: (t: ToastMessage) => void}} props */
const LandingRoute = props => {
  return (0, _preact.h)("div", {
    className: "landing"
  }, (0, _preact.h)("div", {
    className: "landing__background"
  }, (0, _preact.h)("img", {
    src: _lhciComponents.CONFETTI_PATH,
    alt: "Lighthouse CI Background Image"
  })), (0, _preact.h)(_lhciComponents.Paper, {
    className: "landing__paper"
  }, (0, _preact.h)("a", {
    className: "landing__info-icon",
    href: "https://github.com/GoogleChrome/lighthouse-ci",
    target: "_blank",
    rel: "noopener noreferrer"
  }, (0, _preact.h)("i", {
    className: "material-icons"
  }, "info")), (0, _preact.h)("img", {
    className: "landing__logo",
    src: _lhciComponents.LH_LOGO_PATH,
    alt: "Lighthouse Logo"
  }), (0, _preact.h)("h1", null, "Lighthouse CI Diff"), (0, _preact.h)("span", null, "Drag or upload two Lighthouse reports to start comparing!"), (0, _preact.h)("div", {
    className: "landing__upload"
  }, (0, _preact.h)(_reportUploadBox.ReportUploadBox, {
    variant: "base",
    report: props.baseReport,
    setReport: props.setBaseReport,
    addToast: props.addToast,
    displayType: "filename",
    dragTarget: props.baseReport ? 'self' : 'document'
  }), (0, _preact.h)(_reportUploadBox.ReportUploadBox, {
    variant: "compare",
    report: props.compareReport,
    setReport: props.setCompareReport,
    addToast: props.addToast,
    displayType: "filename",
    dragTarget: props.baseReport ? 'document' : 'self'
  }))));
};

exports.LandingRoute = LandingRoute;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./landing.css":"routes/landing/landing.css","../../components/lhci-components.jsx":"components/lhci-components.jsx","../../components/report-upload-box":"components/report-upload-box.jsx"}],"routes/comparison/comparison.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../../node_modules/@lhci/utils/src/lodash.js":[function(require,module,exports) {
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Recursively merges properties of v2 into v1. Mutates o1 in place, does not return a copy.
 *
 * @template T
 * @param {T} v1
 * @param {T} v2
 * @return {T}
 */
function merge(v1, v2) {
  if (Array.isArray(v1)) {
    if (!Array.isArray(v2)) return v2;

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      v1[i] = i < v2.length ? merge(v1[i], v2[i]) : v1[i];
    }

    return v1;
  } else if (typeof v1 === 'object' && v1 !== null) {
    if (typeof v2 !== 'object' || v2 === null) return v2;
    /** @type {Record<string, *>} */
    const o1 = v1;
    /** @type {Record<string, *>} */
    const o2 = v2;

    const o1Keys = new Set(Object.keys(o1));
    const o2Keys = new Set(Object.keys(o2));
    for (const key of new Set([...o1Keys, ...o2Keys])) {
      o1[key] = key in o2 ? merge(o1[key], o2[key]) : o1[key];
    }

    return v1;
  } else {
    return v2;
  }
}

/**
 * Converts a string from camelCase to kebab-case.
 * @param {string} s
 */
function kebabCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * @template TKey
 * @template TValue
 * @param {Array<TValue>} items
 * @param {(item: TValue) => TKey} keyFn
 * @return {Map<TKey, Array<TValue>>}
 */
function groupIntoMap(items, keyFn) {
  /** @type {Map<TKey, Array<TValue>>} */
  const groups = new Map();

  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  return groups;
}

module.exports = {
  merge,
  kebabCase,
  /**
   * Generates an array of numbers from `from` (inclusive) to `to` (exclusive)
   * @param {number} from
   * @param {number} to
   * @param {number} [by]
   * @return {Array<number>}
   */
  range(from, to, by = 1) {
    /** @type {Array<number>} */
    const numbers = [];
    for (let i = from; i < to; i += by) {
      numbers.push(i);
    }
    return numbers;
  },
  /**
   * Converts a string from kebab-case or camelCase to Start Case.
   * @param {string} s
   */
  startCase(s) {
    return kebabCase(s)
      .split('-')
      .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
      .join(' ');
  },
  /**
   * @param {string} s
   * @param {number} length
   * @param {string} [padding]
   */
  padStart(s, length, padding = ' ') {
    if (s.length >= length) return s;
    return `${padding.repeat(length)}${s}`.slice(-length);
  },
  /**
   * @param {string} s
   * @param {number} length
   * @param {string} [padding]
   */
  padEnd(s, length, padding = ' ') {
    if (s.length >= length) return s;
    return `${s}${padding.repeat(length)}`.slice(0, length);
  },
  /**
   * Deep clones an object via JSON.parse/JSON.stringify.
   * @template T
   * @param {T} o
   * @return {T}
   */
  cloneDeep(o) {
    return JSON.parse(JSON.stringify(o));
  },
  /**
   * Filters items by referential uniqueness of the value returned by keyFn.
   * Unique items are guaranteed to be in the same order of the original array.
   *
   * @template TArr
   * @template TKey
   * @param {Array<TArr>} items
   * @param {(item: TArr) => TKey} keyFn
   * @return {Array<TArr>}
   */
  uniqBy(items, keyFn) {
    /** @type {Set<TKey>} */
    const seen = new Set();
    /** @type {Array<TArr>} */
    const out = [];

    for (const item of items) {
      const key = keyFn(item);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }

    return out;
  },
  /**
   * @template T
   * @param {Array<T>} items
   * @param {(item: T) => any} keyFn
   * @return {Array<Array<T>>}
   */
  groupBy(items, keyFn) {
    return [...groupIntoMap(items, keyFn).values()];
  },
  groupIntoMap,
  /**
   * @template T
   * @param {T} object
   * @param {Array<keyof T>} propertiesToPick
   * @return {Partial<T>}
   */
  pick(object, propertiesToPick) {
    /** @type {Partial<T>} */
    const out = {};
    for (const [key_, value] of Object.entries(object)) {
      const key = /** @type {keyof T} */ (key_);
      if (!propertiesToPick.includes(key)) continue;
      out[key] = value;
    }

    return out;
  },
  /**
   * @template T
   * @param {T} object
   * @param {Array<keyof T>} propertiesToDrop
   * @param {{dropUndefined?: boolean}} [options]
   * @return {Partial<T>}
   */
  omit(object, propertiesToDrop, options = {}) {
    /** @type {Partial<T>} */
    const out = {};
    for (const [key_, value] of Object.entries(object)) {
      const key = /** @type {keyof T} */ (key_);
      if (propertiesToDrop.includes(key)) continue;
      if (options.dropUndefined && value === undefined) continue;
      out[key] = value;
    }

    return out;
  },
  /** @param {string} uuid */
  shortId(uuid) {
    return uuid.replace(/-/g, '').slice(0, 12);
  },
};

},{}],"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js":[function(require,module,exports) {
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');

/** @typedef {'improvement'|'neutral'|'regression'} DiffLabel */
/** @typedef {'better'|'worse'|'added'|'removed'|'ambiguous'|'no change'} RowLabel */
/** @typedef {{item: Record<string, any>, kind?: string, index: number}} DetailItemEntry */

/**
 * @param {number} delta
 * @param {'audit'|'score'} deltaType
 * @return {DiffLabel}
 */
function getDeltaLabel(delta, deltaType = 'audit') {
  if (delta === 0) return 'neutral';
  let isImprovement = delta < 0;
  if (deltaType === 'score') isImprovement = delta > 0;
  return isImprovement ? 'improvement' : 'regression';
}

/**
 * @param {LHCI.AuditDiff} diff
 * @return {DiffLabel}
 */
function getDiffLabel(diff) {
  switch (diff.type) {
    case 'error':
      return 'regression';
    case 'score':
      return getDeltaLabel(getDeltaStats(diff).delta, 'score');
    case 'numericValue':
    case 'itemCount':
    case 'itemDelta':
      return getDeltaLabel(getDeltaStats(diff).delta, 'audit');
    case 'itemAddition':
      return 'regression';
    case 'itemRemoval':
      return 'improvement';
    default:
      return 'neutral';
  }
}

/**
 * Given the array of diffs for a particular row, determine its label.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @return {RowLabel}
 */
function getRowLabel(diffs) {
  if (!diffs.length) return 'no change';

  if (diffs.some(diff => diff.type === 'itemAddition')) return 'added';
  if (diffs.some(diff => diff.type === 'itemRemoval')) return 'removed';

  const itemDeltaDiffs = diffs.filter(
    /** @return {diff is LHCI.NumericItemAuditDiff} */ diff => diff.type === 'itemDelta'
  );

  // All the diffs were worse, it's "worse".
  if (itemDeltaDiffs.every(diff => diff.compareValue > diff.baseValue)) return 'worse';
  // All the diffs were better, it's "better".
  if (itemDeltaDiffs.every(diff => diff.compareValue < diff.baseValue)) return 'better';
  // The item had diffs but some were better and some were worse, so we can't decide.
  if (itemDeltaDiffs.length) return 'ambiguous';

  return 'no change';
}

/**
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {Array<LHCI.AuditDiff>}
 */
function getMatchingDiffsForIndex(diffs, compareItemIndex, baseItemIndex) {
  return diffs.filter(diff => {
    const compareIndex = 'compareItemIndex' in diff ? diff.compareItemIndex : undefined;
    const baseIndex = 'baseItemIndex' in diff ? diff.baseItemIndex : undefined;
    if (typeof compareIndex === 'number') return compareIndex === compareItemIndex;
    if (typeof baseIndex === 'number') return baseIndex === baseItemIndex;
    return false;
  });
}

/**
 * Given the array of all diffs for an audit, determine the label for a row with particular item index.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {RowLabel}
 */
function getRowLabelForIndex(diffs, compareItemIndex, baseItemIndex) {
  return getRowLabel(getMatchingDiffsForIndex(diffs, compareItemIndex, baseItemIndex));
}

/**
 * Given the array of all diffs for an audit, determine the worst numeric delta for a particular row.
 * Used for sorting.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {number|undefined} compareItemIndex
 * @param {number|undefined} baseItemIndex
 * @return {number|undefined}
 */
function getWorstNumericDeltaForIndex(diffs, compareItemIndex, baseItemIndex) {
  const matchingDiffs = getMatchingDiffsForIndex(diffs, compareItemIndex, baseItemIndex);
  const numericDiffs = matchingDiffs.filter(isNumericAuditDiff);
  if (!numericDiffs.length) return undefined;
  return Math.max(...numericDiffs.map(diff => getDeltaStats(diff).delta));
}

/** @param {Array<DiffLabel>} labels @return {DiffLabel} */
function getMostSevereDiffLabel(labels) {
  if (labels.some(l => l === 'regression')) return 'regression';
  if (labels.some(l => l === 'neutral')) return 'neutral';
  return 'improvement';
}

/**
 * @param {LHCI.AuditDiff} diff
 * @return {diff is LHCI.NumericAuditDiff|LHCI.NumericItemAuditDiff} */
function isNumericAuditDiff(diff) {
  return ['score', 'numericValue', 'itemCount', 'itemDelta'].includes(diff.type);
}

/** @param {number|null|undefined} score */
function getScoreLevel(score) {
  if (typeof score !== 'number') return 'error';
  if (score >= 0.9) return 'pass';
  if (score >= 0.5) return 'average';
  return 'fail';
}

/** @param {LHCI.AuditDiff} diff */
function getDiffSeverity(diff) {
  const delta = isNumericAuditDiff(diff) ? getDeltaStats(diff).absoluteDelta : 0;
  if (diff.type === 'error') return 1e12;
  if (diff.type === 'score') return 1e10 * delta;
  if (diff.type === 'numericValue') return 1e8 * Math.max(delta / 1000, 1);
  if (diff.type === 'itemCount') return 1e6 * delta;
  if (diff.type === 'itemAddition') return 1e5;
  if (diff.type === 'itemRemoval') return 1e5;
  if (diff.type === 'itemDelta') return Math.min(Math.max(delta / 100, 1), 1e5 - 1);
  return 0;
}

/**
 * @param {LHCI.NumericAuditDiff | LHCI.NumericItemAuditDiff} diff
 */
function getDeltaStats(diff) {
  const {baseValue, compareValue} = diff;
  const delta = compareValue - baseValue;
  const absoluteDelta = Math.abs(delta);
  // Handle the 0 case to avoid messy NaN handling.
  if (delta === 0) return {delta, absoluteDelta, percentDelta: 0, percentAbsoluteDelta: 0};

  // Percent delta is `delta / baseValue` unless `baseValue == 0`.
  // Then `percentDelta` is 100% by arbitrary convention (instead of Infinity/NaN).
  const percentDelta = baseValue ? delta / baseValue : 1;
  const percentAbsoluteDelta = Math.abs(percentDelta);

  return {
    delta,
    absoluteDelta,
    percentDelta,
    percentAbsoluteDelta,
  };
}

/**
 * @param {{auditId: string, type: LHCI.AuditDiffType, baseValue?: number|null, compareValue?: number|null, itemKey?: string, baseItemIndex?: number, compareItemIndex?: number}} diff
 * @return {LHCI.AuditDiff}
 */
function createAuditDiff(diff) {
  const {auditId, type, baseValue, compareValue, baseItemIndex, compareItemIndex, itemKey} = diff;
  if (type === 'itemAddition') {
    if (typeof compareItemIndex !== 'number') throw new Error('compareItemIndex is not set');
    return {auditId, type, compareItemIndex};
  }

  if (type === 'itemRemoval') {
    if (typeof baseItemIndex !== 'number') throw new Error('baseItemIndex is not set');
    return {auditId, type, baseItemIndex};
  }

  if (type === 'displayValue') {
    throw new Error('Do not use createAuditDiff for displayValue, just manually create');
  }

  if (
    typeof compareValue !== 'number' ||
    typeof baseValue !== 'number' ||
    !Number.isFinite(baseValue) ||
    !Number.isFinite(compareValue) ||
    type === 'error'
  ) {
    return {
      auditId,
      type: 'error',
      attemptedType: type,
      baseValue: baseValue || NaN,
      compareValue: compareValue || NaN,
    };
  }

  /** @type {LHCI.NumericAuditDiff} */
  const numericDiffResult = {
    auditId,
    type: 'score',
    baseValue,
    compareValue,
  };

  if (type === 'itemDelta') {
    if (typeof itemKey !== 'string') throw new Error('itemKey is not set');
    if (typeof baseItemIndex !== 'number' && typeof compareItemIndex !== 'number') {
      throw new Error('Either baseItemIndex or compareItemIndex must be set');
    }

    return {
      ...numericDiffResult,
      type: 'itemDelta',
      baseItemIndex,
      compareItemIndex,
      itemKey,
    };
  }

  return {...numericDiffResult, type};
}

/**
 *
 * @param {string} auditId
 * @param {DetailItemEntry} baseEntry
 * @param {DetailItemEntry} compareEntry
 * @param {Array<{key: string}>} headings
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemKeyDiffs(auditId, baseEntry, compareEntry, headings) {
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const key of Object.keys(baseEntry.item)) {
    const baseValue = baseEntry.item[key];
    const compareValue = compareEntry.item[key];
    // If these aren't numeric, comparable values, skip the key.
    if (typeof baseValue !== 'number' || typeof compareValue !== 'number') continue;
    // If these aren't shown in the table, skip the key.
    if (!headings.some(heading => heading.key === key)) continue;

    diffs.push(
      createAuditDiff({
        auditId,
        type: 'itemDelta',
        itemKey: key,
        baseItemIndex: baseEntry.index,
        compareItemIndex: compareEntry.index,
        baseValue,
        compareValue,
      })
    );
  }

  return diffs;
}

/**
 * This function creates NumericItemAuditDiffs from itemAddition/itemRemoved diffs. Normally, these
 * are superfluous data, but in some instances (table details views for example), it's desirable to
 * understand the diff state of each individual itemKey. The missing values are assumed to be 0
 * for the purposes of the diff.
 *
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @return {Array<LHCI.AuditDiff>}
 */
function synthesizeItemKeyDiffs(diffs, baseItems, compareItems) {
  /** @type {Array<LHCI.AuditDiff>} */
  const itemKeyDiffs = [];

  for (const diff of diffs) {
    if (diff.type !== 'itemAddition' && diff.type !== 'itemRemoval') continue;

    const item =
      diff.type === 'itemAddition'
        ? compareItems[diff.compareItemIndex]
        : baseItems[diff.baseItemIndex];

    for (const key of Object.keys(item)) {
      const baseValue = diff.type === 'itemAddition' ? 0 : item[key];
      const compareValue = diff.type === 'itemAddition' ? item[key] : 0;
      if (typeof compareValue !== 'number' || typeof baseValue !== 'number') continue;

      const itemIndexKeyName = diff.type === 'itemAddition' ? 'compareItemIndex' : 'baseItemIndex';
      const itemIndexValue =
        diff.type === 'itemAddition' ? diff.compareItemIndex : diff.baseItemIndex;
      itemKeyDiffs.push(
        createAuditDiff({
          auditId: diff.auditId,
          type: 'itemDelta',
          itemKey: key,
          [itemIndexKeyName]: itemIndexValue,
          baseValue,
          compareValue,
        })
      );
    }
  }

  return itemKeyDiffs;
}

/** @param {string} s */
function replaceNondeterministicStrings(s) {
  return (
    s
      // YouTube Embeds
      .replace(/www-embed-player-[0-9a-z]+/i, 'www-embed-player')
      .replace(/player_ias-[0-9a-z]+/i, 'player_ias')
      // UUIDs
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'UUID')
      // localhost Ports
      .replace(/:[0-9]{3,5}\//, ':PORT/')
      // Hash components embedded in filenames
      .replace(/(\.|-)[0-9a-f]{8}\.(js|css|woff|html|png|jpeg|jpg|svg)/i, '$1HASH.$2')
  );
}

/** @param {Record<string, any>} item @return {string} */
function getItemKey(item) {
  // For most opportunities, diagnostics, etc where 1 row === 1 resource
  if (typeof item.url === 'string') return item.url;
  // For the pre-grouped audits like resource-summary
  if (typeof item.label === 'string') return item.label;
  // For the pre-grouped audits like mainthread-work-breakdown
  if (typeof item.groupLabel === 'string') return item.groupLabel;
  // For user-timings
  if (typeof item.name === 'string') return item.name;
  // For dom-size
  if (typeof item.statistic === 'string') return item.statistic;
  // For third-party-summary
  if (item.entity && typeof item.entity.text === 'string') return item.entity.text;

  // For everything else, use the entire object, actually works OK on most nodes.
  return JSON.stringify(item);
}

/**
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @return {Array<{base?: DetailItemEntry, compare?: DetailItemEntry}>}
 */
function zipBaseAndCompareItems(baseItems, compareItems) {
  const groupedByKey = _.groupIntoMap(
    [
      ...baseItems.map((item, i) => ({item, kind: 'base', index: i})),
      ...compareItems.map((item, i) => ({item, kind: 'compare', index: i})),
    ],
    entry => replaceNondeterministicStrings(getItemKey(entry.item))
  );

  /** @type {Array<{base?: DetailItemEntry, compare?: DetailItemEntry}>} */
  const zipped = [];

  for (const entries of groupedByKey.values()) {
    const baseItems = entries.filter(entry => entry.kind === 'base');
    const compareItems = entries.filter(entry => entry.kind === 'compare');

    if (baseItems.length > 1 || compareItems.length > 1) {
      // The key is not actually unique, just treat all as added/removed.
      for (const entry of entries) {
        zipped.push({[entry.kind]: entry});
      }

      continue;
    }

    zipped.push({base: baseItems[0], compare: compareItems[0]});
  }

  return zipped;
}

/**
 * @param {Array<LHCI.AuditDiff>} diffs
 * @param {Array<{base?: DetailItemEntry, compare?: DetailItemEntry}>} zippedItems
 * @return {Array<{base?: DetailItemEntry, compare?: DetailItemEntry, diffs: Array<LHCI.AuditDiff>}>}
 */
function sortZippedBaseAndCompareItems(diffs, zippedItems) {
  /** @type {Array<RowLabel>} */
  const rowLabelSortOrder = ['added', 'worse', 'ambiguous', 'removed', 'better', 'no change'];

  return zippedItems
    .map(item => {
      return {
        ...item,
        diffs: getMatchingDiffsForIndex(
          diffs,
          item.compare && item.compare.index,
          item.base && item.base.index
        ),
      };
    })
    .sort((a, b) => {
      const compareIndexA = a.compare && a.compare.index;
      const baseIndexA = a.base && a.base.index;
      const compareIndexB = b.compare && b.compare.index;
      const baseIndexB = b.base && b.base.index;

      const rowStateIndexA = rowLabelSortOrder.indexOf(
        getRowLabelForIndex(diffs, compareIndexA, baseIndexA)
      );
      const rowStateIndexB = rowLabelSortOrder.indexOf(
        getRowLabelForIndex(diffs, compareIndexB, baseIndexB)
      );

      const labelValueA = getItemKey(
        (a.compare && a.compare.item) || (a.base && a.base.item) || {}
      );
      const labelValueB = getItemKey(
        (b.compare && b.compare.item) || (b.base && b.base.item) || {}
      );

      const numericValueA = getWorstNumericDeltaForIndex(diffs, compareIndexA, baseIndexA);
      const numericValueB = getWorstNumericDeltaForIndex(diffs, compareIndexB, baseIndexB);

      if (rowStateIndexA === rowStateIndexB) {
        return typeof numericValueA === 'number' && typeof numericValueB === 'number'
          ? numericValueB - numericValueA
          : labelValueA.localeCompare(labelValueB);
      }
      return rowStateIndexA - rowStateIndexB;
    });
}

/**
 * @param {string} auditId
 * @param {Array<Record<string, any>>} baseItems
 * @param {Array<Record<string, any>>} compareItems
 * @param {Array<{key: string}>} headings
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDetailItemsDiffs(auditId, baseItems, compareItems, headings) {
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  for (const {base, compare} of zipBaseAndCompareItems(baseItems, compareItems)) {
    if (base && compare) {
      diffs.push(...findAuditDetailItemKeyDiffs(auditId, base, compare, headings));
    } else if (compare) {
      diffs.push({type: 'itemAddition', auditId, compareItemIndex: compare.index});
    } else if (base) {
      diffs.push({type: 'itemRemoval', auditId, baseItemIndex: base.index});
    } else {
      throw new Error('Impossible');
    }
  }

  return diffs;
}

/**
 * @param {LH.AuditResult} audit
 */
function normalizeScore(audit) {
  if (audit.scoreDisplayMode === 'notApplicable') {
    // notApplicable should be treated as passing.
    return 1;
  }

  if (audit.scoreDisplayMode === 'informative') {
    // informative should be treated as failing.
    return 0;
  }

  return audit.score;
}

/**
 * @param {LH.AuditResult} audit
 */
function getNumericValue(audit) {
  if (
    typeof audit.numericValue !== 'number' &&
    audit.details &&
    typeof audit.details.overallSavingsMs === 'number'
  ) {
    return audit.details.overallSavingsMs;
  }

  return audit.numericValue;
}

/**
 * @param {LH.AuditResult} audit
 */
function normalizeNumericValue(audit) {
  if (audit.scoreDisplayMode === 'notApplicable') {
    return 0;
  }

  return getNumericValue(audit);
}

/**
 * @param {LH.AuditResult} audit
 * @return {Required<Pick<Required<LH.AuditResult>['details'],'items'|'headings'>>}
 */
function normalizeDetails(audit) {
  if (!audit.details) return {items: [], headings: []};
  return {items: audit.details.items || [], headings: audit.details.headings || []};
}

/**
 * @param {LH.AuditResult} baseAudit
 * @param {LH.AuditResult} compareAudit
 * @param {{forceAllScoreDiffs?: boolean, skipDisplayValueDiffs?: boolean, synthesizeItemKeyDiffs?: boolean, percentAbsoluteDeltaThreshold?: number}} options
 * @return {Array<LHCI.AuditDiff>}
 */
function findAuditDiffs(baseAudit, compareAudit, options = {}) {
  const auditId = baseAudit.id || '';
  const {percentAbsoluteDeltaThreshold = 0} = options;
  /** @type {Array<LHCI.AuditDiff>} */
  const diffs = [];

  if (typeof baseAudit.score === 'number' || typeof compareAudit.score === 'number') {
    diffs.push(
      createAuditDiff({
        auditId,
        type: 'score',
        baseValue: normalizeScore(baseAudit),
        compareValue: normalizeScore(compareAudit),
      })
    );
  }

  if (
    typeof getNumericValue(baseAudit) === 'number' ||
    typeof getNumericValue(compareAudit) === 'number'
  ) {
    diffs.push(
      createAuditDiff({
        auditId,
        type: 'numericValue',
        baseValue: normalizeNumericValue(baseAudit),
        compareValue: normalizeNumericValue(compareAudit),
      })
    );
  }

  if (typeof baseAudit.displayValue === 'string' || typeof compareAudit.displayValue === 'string') {
    diffs.push({
      auditId,
      type: 'displayValue',
      baseValue: baseAudit.displayValue || '',
      compareValue: compareAudit.displayValue || '',
    });
  }

  let hasItemDetails = false;
  if (
    (baseAudit.details && baseAudit.details.items) ||
    (compareAudit.details && compareAudit.details.items)
  ) {
    hasItemDetails = true;
    const {items: baseItems, headings: baseHeadings} = normalizeDetails(baseAudit);
    const {items: compareItems, headings: compareHeadings} = normalizeDetails(compareAudit);
    const headings = baseHeadings.concat(compareHeadings);

    diffs.push(
      createAuditDiff({
        auditId,
        type: 'itemCount',
        baseValue: baseItems.length,
        compareValue: compareItems.length,
      })
    );

    diffs.push(...findAuditDetailItemsDiffs(auditId, baseItems, compareItems, headings));

    if (options.synthesizeItemKeyDiffs) {
      diffs.push(...synthesizeItemKeyDiffs(diffs, baseItems, compareItems));
    }
  }

  const filteredDiffs = diffs.filter(diff => {
    // Errors are always surfaced.
    if (diff.type === 'error') return true;
    // Additions and removals are always surfaced.
    if (diff.type === 'itemAddition' || diff.type === 'itemRemoval') return true;
    // If it's a score and we're not forcing all score diffs, only flag level changes.
    if (diff.type === 'score' && !options.forceAllScoreDiffs) {
      return getScoreLevel(diff.baseValue) !== getScoreLevel(diff.compareValue);
    }
    // If it's a display value change, ensure the values are different, and defer to the options.
    if (diff.type === 'displayValue') {
      return diff.baseValue !== diff.compareValue && !options.skipDisplayValueDiffs;
    }

    // Ensure the percent delta is above our threshold (0 by default).
    return getDeltaStats(diff).percentAbsoluteDelta > percentAbsoluteDeltaThreshold;
  });

  // If the only diff found was a displayValue diff, skip it as the others were probably ignored by
  // our percentAbsoluteDeltaThreshold.
  if (filteredDiffs.length === 1 && filteredDiffs[0].type === 'displayValue') return [];

  // If the only diff found was a numericValue/displayValue diff *AND* it seems like the result was flaky, skip it.
  // The result is likely flaky if the audit passed *OR* it was supposed to have details but no details items changed.
  const isAllPassing = compareAudit.score === 1 && baseAudit.score === 1;
  if (
    filteredDiffs.every(diff => diff.type === 'displayValue' || diff.type === 'numericValue') &&
    (isAllPassing || hasItemDetails)
  ) {
    return [];
  }

  return filteredDiffs;
}

module.exports = {
  findAuditDiffs,
  getDiffSeverity,
  getDeltaLabel,
  getDeltaStats,
  getDiffLabel,
  getRowLabel,
  getRowLabelForIndex,
  getMostSevereDiffLabel,
  zipBaseAndCompareItems,
  synthesizeItemKeyDiffs,
  sortZippedBaseAndCompareItems,
  replaceNondeterministicStrings,
};

},{"./lodash.js":"../../../../node_modules/@lhci/utils/src/lodash.js"}],"../../../server/src/ui/components/dropdown.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/dropdown.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Dropdown = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

require("./dropdown.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{options: Array<{value: string, label: string}>, value: string, setValue(v: string): void, className?: string, title?: string, label?: string}} props */
const Dropdown = props => {
  const {
    options,
    value,
    setValue,
    className,
    title,
    label
  } = props;
  return (0, _preact.h)("div", {
    className: (0, _clsx.default)('dropdown', className),
    style: {
      position: 'relative'
    },
    "data-tooltip": title
  }, (0, _preact.h)("label", null, label ? (0, _preact.h)("span", {
    className: "dropdown__label"
  }, label) : (0, _preact.h)(_preact.Fragment, null), (0, _preact.h)("select", {
    onChange: evt => {
      if (!(evt.target instanceof HTMLSelectElement)) return;
      setValue(evt.target.value);
    }
  }, options.map(option => {
    return (0, _preact.h)("option", {
      key: option.value,
      value: option.value,
      selected: option.value === value
    }, option.label);
  }))), (0, _preact.h)("div", {
    className: "dropdown__chevron"
  }, (0, _preact.h)("i", {
    className: "material-icons"
  }, "arrow_drop_down")));
};

exports.Dropdown = Dropdown;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","./dropdown.css":"../../../server/src/ui/components/dropdown.css"}],"../../../server/src/ui/routes/build-view/audit-detail/audit-detail-pane.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/hooks/use-previous-value.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePreviousValue = usePreviousValue;

var _hooks = require("preact/hooks");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @template T
 * @param {T} value
 * @return {T|null|undefined}
 */
function usePreviousValue(value) {
  /** @type {import('preact').Ref<T|undefined>} */
  const ref = (0, _hooks.useRef)(undefined);
  (0, _hooks.useEffect)(() => {
    ref.current = value;
  }, [value]); // This is returned before our useEffect callback runs to update the value.

  return ref.current;
}
},{"preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js"}],"../../../server/src/ui/components/score-icon.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScoreWord = exports.ScoreIcon = void 0;

var _preact = require("preact");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{score: number}} props */
const ScoreIcon = props => {
  const score = props.score;
  if (score >= 0.9) return (0, _preact.h)("i", {
    className: "lh-score-pass"
  });
  if (score >= 0.5) return (0, _preact.h)("i", {
    className: "lh-score-average"
  });
  return (0, _preact.h)("i", {
    className: "lh-score-fail"
  }, (0, _preact.h)("svg", {
    viewBox: "0 0 120 120",
    xmlns: "http://www.w3.org/2000/svg"
  }, (0, _preact.h)("polygon", {
    points: "10,110 60,10 110,110"
  })));
};
/** @param {{audit: LH.AuditResult}} props */


exports.ScoreIcon = ScoreIcon;

const ScoreWord = props => {
  const score = props.audit.score || 0;
  if (score >= 0.9) return (0, _preact.h)("span", {
    className: "lh-score-word"
  }, "Pass");
  return (0, _preact.h)("span", {
    className: "lh-score-word"
  }, "Fail");
};

exports.ScoreWord = ScoreWord;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js"}],"../../../../node_modules/@lhci/utils/src/markdown.js":[function(require,module,exports) {
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @see https://github.com/GoogleChrome/lighthouse/blob/2ff07d29a3e12a75cc844427c567330eb84d4249/lighthouse-core/report/html/renderer/util.js#L320-L347
 *
 * Split a string on markdown links (e.g. [some link](https://...)) into
 * segments of plain text that weren't part of a link (marked as
 * `isLink === false`), and segments with text content and a URL that did make
 * up a link (marked as `isLink === true`).
 * @param {string} text
 * @return {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>}
 */
function splitMarkdownLink(text) {
  /** @type {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>} */
  const segments = [];

  const parts = text.split(/\[([^\]]+?)\]\((https?:\/\/.*?)\)/g);
  while (parts.length) {
    // Shift off the same number of elements as the pre-split and capture groups.
    const [preambleText, linkText, linkHref] = parts.splice(0, 3);

    if (preambleText) {
      // Skip empty text as it's an artifact of splitting, not meaningful.
      segments.push({
        isLink: false,
        text: preambleText,
      });
    }

    // Append link if there are any.
    if (linkText && linkHref) {
      segments.push({
        isLink: true,
        text: linkText,
        linkHref,
      });
    }
  }

  return segments;
}

module.exports = {splitMarkdownLink};

},{}],"../../../server/src/ui/components/markdown.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Markdown = void 0;

var _preact = require("preact");

var _markdown = require("@lhci/utils/src/markdown.js");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{text: string}} props */
const Markdown = props => {
  const segments = (0, _markdown.splitMarkdownLink)(props.text);
  return (0, _preact.h)(_preact.Fragment, null, segments.map((segment, i) => {
    if (!segment.isLink) return (0, _preact.h)("span", {
      key: i
    }, segment.text);
    const url = new URL(segment.linkHref);
    const DOCS_ORIGINS = ['https://developers.google.com', 'https://web.dev'];

    if (DOCS_ORIGINS.includes(url.origin)) {
      url.searchParams.set('utm_source', 'lighthouse');
      url.searchParams.set('utm_medium', 'ci');
    }

    return (0, _preact.h)("a", {
      key: i,
      href: url.href,
      target: "_blank",
      rel: "noopener noreferrer"
    }, segment.text);
  }));
};

exports.Markdown = Markdown;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","@lhci/utils/src/markdown.js":"../../../../node_modules/@lhci/utils/src/markdown.js"}],"../../../server/src/ui/routes/build-view/audit-detail/table-details.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/nbsp.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Nbsp = void 0;

var _preact = require("preact");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
const Nbsp = () => {
  return (0, _preact.h)("span", {
    style: {
      display: 'inline-block',
      width: 4,
      height: 1
    }
  });
};

exports.Nbsp = Nbsp;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js"}],"../../../server/src/ui/routes/build-view/audit-detail/simple-details.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/routes/build-view/audit-detail/simple-details.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SimpleDetails = void 0;

var _preact = require("preact");

var _nbsp = require("../../../components/nbsp");

require("./simple-details.css");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder.js");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{type: LH.DetailsType, baseValue: any, compareValue: any, diff?: LHCI.NumericItemAuditDiff}} props */
const SimpleDetails = props => {
  let type = props.type;
  const {
    compareValue,
    baseValue,
    diff
  } = props;
  const value = compareValue === undefined ? baseValue : compareValue;

  if (typeof value === 'object' && value.type) {
    type = value.type;
  }

  const label = diff ? (0, _auditDiffFinder.getDiffLabel)(diff) : 'neutral';
  const numericBase = Number.isFinite(baseValue) ? baseValue : 0;
  const numericCompare = Number.isFinite(compareValue) ? compareValue : 0;
  const baseDisplay = `Base Value: ${Math.round(numericBase).toLocaleString()}`;
  const compareDisplay = `Compare Value: ${Math.round(numericCompare).toLocaleString()}`;
  const numericTitle = `${baseDisplay}, ${compareDisplay}`;
  const deltaPercent = diff && (0, _auditDiffFinder.getDeltaStats)(diff).percentAbsoluteDelta !== 1 ? ` (${((0, _auditDiffFinder.getDeltaStats)(diff).percentAbsoluteDelta * 100).toLocaleString(undefined, {
    maximumFractionDigits: 0
  })}%)` : '';

  switch (type) {
    case 'bytes':
      {
        const kb = Math.abs((numericCompare - numericBase) / 1024);
        return (0, _preact.h)("pre", {
          className: `simple-details--${label}`,
          "data-tooltip": numericTitle
        }, numericCompare >= numericBase ? '+' : '-', kb.toLocaleString(undefined, {
          maximumFractionDigits: Math.abs(kb) < 1 ? 1 : 0
        }), (0, _preact.h)(_nbsp.Nbsp, null), "KB", deltaPercent);
      }

    case 'ms':
    case 'timespanMs':
      {
        const ms = Math.abs(Math.round(numericCompare - numericBase));
        return (0, _preact.h)("pre", {
          className: `simple-details--${label}`,
          "data-tooltip": numericTitle
        }, numericCompare >= numericBase ? '+' : '-', ms.toLocaleString(), (0, _preact.h)(_nbsp.Nbsp, null), "ms", deltaPercent);
      }

    case 'thumbnail':
      return (0, _preact.h)("img", {
        style: {
          width: 48,
          height: 48,
          objectFit: 'cover'
        },
        src: 'asdfasjdfoiasjdfosdj',
        onError: evt => {
          const img = evt.srcElement;
          if (!(img instanceof HTMLImageElement)) return; // On failure just replace the image with a 1x1 transparent gif.

          img.onerror = null;
          img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
        }
      });

    case 'url':
      {
        let display = value;
        let hostname = '';

        try {
          const url = new URL(value);
          display = url.pathname;
          hostname = url.hostname;
        } catch (_) {} // FIXME: use title instead of data-tooltip because of the `overflow: hidden` constraints on the table cell.


        return (0, _preact.h)("span", {
          title: value
        }, display, hostname ? (0, _preact.h)("span", {
          className: "simple-details__url-hostname"
        }, "(", hostname, ")") : '');
      }

    case 'link':
      {
        if (!value.url) return (0, _preact.h)("span", null, value.text);
        return (0, _preact.h)("a", {
          target: "_blank",
          rel: "noopener noreferrer",
          href: value.url
        }, value.text);
      }

    case 'code':
      return (0, _preact.h)("pre", null, value);

    case 'numeric':
      {
        return (0, _preact.h)("pre", {
          className: `simple-details--${label}`
        }, numericCompare >= numericBase ? '+' : '-', Math.abs(numericCompare - numericBase).toLocaleString(), deltaPercent);
      }

    case 'text':
      return (0, _preact.h)("span", null, value);

    case 'node':
      return (0, _preact.h)("pre", null, value.snippet);

    default:
      {
        const debugdata = JSON.stringify(props);
        return (0, _preact.h)("pre", {
          "data-tooltip": debugdata
        }, debugdata.slice(0, 20));
      }
  }
};

exports.SimpleDetails = SimpleDetails;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","../../../components/nbsp":"../../../server/src/ui/components/nbsp.jsx","./simple-details.css":"../../../server/src/ui/routes/build-view/audit-detail/simple-details.css","@lhci/utils/src/audit-diff-finder.js":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js"}],"../../../server/src/ui/routes/build-view/audit-detail/table-details.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TableDetails = void 0;

var _preact = require("preact");

require("./table-details.css");

var _simpleDetails = require("./simple-details");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {LH.DetailsType} itemType @return {boolean} */
function isNumericValueType(itemType) {
  switch (itemType) {
    case 'bytes':
    case 'ms':
    case 'timespanMs':
    case 'numeric':
      return true;

    default:
      return false;
  }
}
/** @param {{pair: LHCI.AuditPair}} props */


const TableDetails = props => {
  const {
    audit,
    baseAudit,
    diffs: allDiffs
  } = props.pair;
  if (!audit.details) return (0, _preact.h)(_preact.Fragment, null);
  const {
    headings: compareHeadings,
    items: compareItems
  } = audit.details;
  if (!compareHeadings || !compareItems) return (0, _preact.h)(_preact.Fragment, null);
  const baseHeadings = baseAudit && baseAudit.details && baseAudit.details.headings || [];
  const baseItems = baseAudit && baseAudit.details && baseAudit.details.items || [];
  const zippedItems = (0, _auditDiffFinder.zipBaseAndCompareItems)(baseItems, compareItems);
  const sortedItems = (0, _auditDiffFinder.sortZippedBaseAndCompareItems)(allDiffs, zippedItems);
  const headings = compareHeadings.length ? compareHeadings : baseHeadings; // We'll insert the row label before the first numeric heading, or last if none is found.

  let insertRowLabelAfterIndex = headings.findIndex(heading => isNumericValueType(heading.valueType || heading.itemType || 'unknown')) - 1;
  if (insertRowLabelAfterIndex < 0) insertRowLabelAfterIndex = headings.length - 1;
  return (0, _preact.h)("div", {
    className: "table-details"
  }, (0, _preact.h)("table", null, (0, _preact.h)("thead", null, (0, _preact.h)("tr", null, headings.map((heading, i) => {
    const itemType = heading.valueType || heading.itemType || 'unknown';
    return (0, _preact.h)(_preact.Fragment, {
      key: i
    }, (0, _preact.h)("th", {
      className: `table-column--${itemType}`
    }, heading.label), insertRowLabelAfterIndex === i ? (0, _preact.h)("th", null) : null);
  }))), (0, _preact.h)("tbody", null, sortedItems.map(({
    base,
    compare,
    diffs
  }) => {
    const definedItem = compare || base; // This should never be true, but make tsc happy

    if (!definedItem) return null;
    const key = `${base && base.index}-${compare && compare.index}`;
    const state = (0, _auditDiffFinder.getRowLabelForIndex)(allDiffs, compare && compare.index, base && base.index);
    return (0, _preact.h)("tr", {
      key: key
    }, headings.map((heading, j) => {
      const itemType = heading.valueType || heading.itemType || 'unknown';
      const diff = diffs.find(
      /** @return {diff is LHCI.NumericItemAuditDiff} */
      diff => diff.type === 'itemDelta' && diff.itemKey === heading.key);
      return (0, _preact.h)(_preact.Fragment, {
        key: j
      }, (0, _preact.h)("td", {
        className: `table-column--${itemType}`
      }, (0, _preact.h)(_simpleDetails.SimpleDetails, {
        type: itemType,
        compareValue: compare && compare.item[heading.key],
        baseValue: base && base.item[heading.key],
        diff: diff
      })), insertRowLabelAfterIndex === j ? (0, _preact.h)("td", {
        className: "table-column--row-label"
      }, state === 'added' || state === 'removed' ? state : '') : null);
    }));
  }))));
};

exports.TableDetails = TableDetails;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./table-details.css":"../../../server/src/ui/routes/build-view/audit-detail/table-details.css","./simple-details":"../../../server/src/ui/routes/build-view/audit-detail/simple-details.jsx","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js"}],"../../../server/src/ui/routes/build-view/audit-list/numeric-diff.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/routes/build-view/audit-list/numeric-diff.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumericDiff = void 0;

var _preact = require("preact");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

var _clsx = _interopRequireDefault(require("clsx"));

var _nbsp = require("../../../components/nbsp");

require("./numeric-diff.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
const BIG_PICTURE_LIMITS = {
  'first-contentful-paint': [0, 10000],
  'first-meaningful-paint': [0, 10000],
  'largest-contentful-paint': [0, 15000],
  'speed-index': [0, 15000],
  'first-cpu-idle': [0, 15000],
  interactive: [0, 20000],
  'estimated-input-latency': [0, 1500],
  'max-potential-fid': [0, 1500],
  'total-blocking-time': [0, 1500],
  __default__: [0, 30 * 1000]
};
/** @param {LH.AuditResult|undefined} audit @param {'lower'|'upper'} limitType */

const getBigPictureLimit = (audit, limitType) => {
  const auditId =
  /** @type {keyof typeof BIG_PICTURE_LIMITS} */
  audit && audit.id || '';
  const limits = BIG_PICTURE_LIMITS[auditId] || BIG_PICTURE_LIMITS.__default__;
  return limits[limitType === 'lower' ? 0 : 1];
};
/** @param {number} x @param {'up'|'down'} direction */


const toNearestRoundNumber = (x, direction) => {
  const fn = direction === 'up' ? Math.ceil : Math.floor;
  if (x < 10) return fn(x);
  if (x < 100) return fn(x / 10) * 10;
  if (x < 1000) return fn(x / 100) * 100;
  if (x < 10000) return fn(x / 1000) * 1000;
  return fn(x / 2500) * 2500;
};
/**
 * @param {LH.AuditResult|undefined} audit
 * @param {string|undefined} groupId
 * @return {'ms'|'bytes'|'none'}
 */


const getUnitFromAudit = (audit, groupId) => {
  if (groupId === 'metrics') return 'ms';
  if (groupId === 'load-opportunities') return 'ms';
  if (!audit) return 'none';

  if (audit.details) {
    const details = audit.details;
    if (details.overallSavingsMs) return 'ms';
  }

  const displayValue = audit.displayValue || '';
  if (/[0-9,.]+\s(ms|s)$/.test(displayValue)) return 'ms';
  if (/[0-9,.]+\s(KB|MB)$/.test(displayValue)) return 'bytes';
  return 'none';
};
/** @param {number} x @param {{asDelta?: boolean, unit: 'ms'|'bytes'|'none', withSuffix?: boolean, preventSecondsConversion?: boolean}} options */


const toDisplay = (x, options) => {
  const {
    asDelta = false,
    withSuffix = false,
    unit = 'none'
  } = options;
  let value = Math.round(x);
  let fractionDigits = 0;
  let suffixUnit = '';

  if (unit === 'ms') {
    suffixUnit = 'ms';

    if (Math.abs(value) >= 1000 && !options.preventSecondsConversion) {
      value /= 1000;
      fractionDigits = 1;
      suffixUnit = 's';
    }
  }

  if (unit === 'bytes') {
    suffixUnit = 'KB';
    value /= 1024;

    if (Math.abs(value) >= 500) {
      value /= 1024;
      fractionDigits = 1;
      suffixUnit = 'MB';
    }
  }

  if (unit === 'none') {
    if (Math.abs(value) >= 50) {
      value /= 1000;
      fractionDigits = 1;
      suffixUnit = 'K';
    }
  }

  const string = value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
  const numericSign = asDelta && value >= 0 ? '+' : '';
  const resultStr = numericSign + string + (withSuffix ? suffixUnit : '');
  return {
    element: (0, _preact.h)("span", null, numericSign, string, withSuffix ? (0, _preact.h)(_preact.Fragment, null, (0, _preact.h)(_nbsp.Nbsp, null), suffixUnit) : ''),
    string: resultStr,
    length: resultStr.length
  };
};
/** @param {{diff: LHCI.NumericAuditDiff, audit?: LH.AuditResult, groupId?: string, showAsBigPicture?: boolean, showAsNarrow?: boolean}} props */


const NumericDiff = props => {
  const {
    diff,
    audit,
    groupId
  } = props;
  const unit = getUnitFromAudit(audit, groupId);
  const currentNumericValue = diff.compareValue;
  const baseNumericValue = diff.baseValue;

  if (typeof baseNumericValue !== 'number' || typeof currentNumericValue !== 'number') {
    return (0, _preact.h)("span", null, "No diff available");
  }

  const delta = currentNumericValue - baseNumericValue;
  const minValue = Math.min(currentNumericValue, baseNumericValue);
  const maxValue = Math.max(currentNumericValue, baseNumericValue);
  const lowerLimit = props.showAsBigPicture ? getBigPictureLimit(audit, 'lower') : toNearestRoundNumber(minValue * 0.8, 'down');
  const upperLimit = props.showAsBigPicture ? getBigPictureLimit(audit, 'upper') : toNearestRoundNumber(maxValue * 1.2, 'up');
  const range = upperLimit - lowerLimit;
  const minValueConstrainted = Math.min(Math.max(minValue, lowerLimit), upperLimit);
  const maxValueConstrainted = Math.min(Math.max(maxValue, lowerLimit), upperLimit);
  const boxLeft = 100 * (minValueConstrainted - lowerLimit) / range;
  const boxRight = 100 - 100 * (maxValueConstrainted - lowerLimit) / range;
  const deltaType = (0, _auditDiffFinder.getDeltaLabel)(delta, 'audit');
  const minValueIsCurrentValue = minValue === currentNumericValue;
  const hoverDisplay = `${toDisplay(baseNumericValue, {
    unit,
    withSuffix: true
  }).string} to ${toDisplay(currentNumericValue, {
    withSuffix: true,
    unit
  }).string}`;

  if (props.showAsNarrow) {
    return (0, _preact.h)("div", {
      className: (0, _clsx.default)('audit-numeric-diff', `text--${deltaType}`),
      "data-tooltip": hoverDisplay
    }, toDisplay(delta, {
      asDelta: true,
      withSuffix: true,
      preventSecondsConversion: true,
      unit
    }).element);
  } // We want to ensure there's ~10px per character of space for the delta label.
  // The min-width of the bar is ~300px, so if the deltaLabel is going to take up more than
  // the narrowCutoffThresholdInPercent we want to flip it over to the other side.


  const {
    element: deltaLabel,
    length: deltaLabelLength
  } = toDisplay(delta, {
    asDelta: true,
    withSuffix: true,
    preventSecondsConversion: true,
    unit
  });
  const narrowCutoffThresholdInPercent = deltaLabelLength * 10 * 100 / 300;
  return (0, _preact.h)(_preact.Fragment, null, (0, _preact.h)("div", {
    className: "audit-numeric-diff"
  }, (0, _preact.h)("div", {
    className: "audit-numeric-diff__left-label"
  }, toDisplay(lowerLimit, {
    unit
  }).element), (0, _preact.h)("div", {
    className: "audit-numeric-diff__bar"
  }, (0, _preact.h)("div", {
    className: (0, _clsx.default)('audit-numeric-diff__box', {
      'audit-numeric-diff__box--improvement': deltaType === 'improvement',
      'audit-numeric-diff__box--regression': deltaType === 'regression'
    }),
    style: {
      left: `${boxLeft}%`,
      right: `${boxRight}%`
    },
    "data-tooltip": hoverDisplay
  }, (0, _preact.h)("div", {
    className: "audit-numeric-diff__now",
    style: {
      left: minValueIsCurrentValue ? '0%' : '100%'
    }
  }), (0, _preact.h)("div", {
    className: (0, _clsx.default)('audit-numeric-diff__delta-label', {
      'audit-numeric-diff__delta-label--narrow-left': deltaType === 'improvement' && boxLeft < narrowCutoffThresholdInPercent,
      'audit-numeric-diff__delta-label--narrow-right': deltaType === 'regression' && boxRight < narrowCutoffThresholdInPercent
    }),
    style: {
      [minValueIsCurrentValue ? 'right' : 'left']: '100%'
    }
  }, deltaLabel))), (0, _preact.h)("div", {
    className: "audit-numeric-diff__right-label"
  }, toDisplay(upperLimit, {
    unit
  }).element)));
};

exports.NumericDiff = NumericDiff;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","../../../components/nbsp":"../../../server/src/ui/components/nbsp.jsx","./numeric-diff.css":"../../../server/src/ui/routes/build-view/audit-list/numeric-diff.css"}],"../../../server/src/ui/routes/build-view/audit-list/audit-diff.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditDiff = exports.ItemDiff = void 0;

var _ = _interopRequireWildcard(require("@lhci/utils/src/lodash"));

var _preact = require("preact");

var _scoreIcon = require("../../../components/score-icon");

var _numericDiff = require("./numeric-diff");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

var _clsx = _interopRequireDefault(require("clsx"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @type {Record<string, string>} */
const ICONS_BY_AUDIT_ID = {
  'font-display': 'font_download',
  'uses-rel-preconnect': 'language',
  'user-timings': 'timer',
  'bootup-time': 'speed',
  'mainthread-work-breakdown': 'speed',
  'third-party-summary': 'language',
  deprecations: 'error',
  'errors-in-console': 'error',
  'font-sizes': 'format_size'
};
/** @param {{audit: LH.AuditResult, groupId: string}} props */

const IconForAuditItems = props => {
  const auditId = props.audit.id || '';
  const groupId = props.groupId || '';
  let icon = '';
  if (groupId.includes('opportunities')) icon = 'web_asset';
  if (groupId.includes('a11y')) icon = 'code';
  if (auditId.includes('image')) icon = 'photo';
  icon = ICONS_BY_AUDIT_ID[auditId] || icon || 'list_alt';
  return (0, _preact.h)("i", {
    className: "material-icons"
  }, icon);
};
/** @param {{diff: LHCI.AuditDiff, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */


const ScoreDiff = props => {
  return (0, _preact.h)(_preact.Fragment, null, (0, _preact.h)(_scoreIcon.ScoreWord, {
    audit: props.baseAudit
  }), (0, _preact.h)("i", {
    className: `material-icons audit-group__diff-arrow audit-group__diff-arrow--${(0, _auditDiffFinder.getDiffLabel)(props.diff)}`
  }, "arrow_forward"), (0, _preact.h)(_scoreIcon.ScoreWord, {
    audit: props.audit
  }));
};
/** @param {{diff: LHCI.DisplayValueAuditDiff, audit: LH.AuditResult, baseAudit: LH.AuditResult}} props */


const DisplayValueDiff = props => {
  return (0, _preact.h)(_preact.Fragment, null, (0, _preact.h)("span", null, props.diff.baseValue), (0, _preact.h)("i", {
    className: `material-icons audit-group__diff-arrow audit-group__diff-arrow--${(0, _auditDiffFinder.getDiffLabel)(props.diff)}`
  }, "arrow_forward"), (0, _preact.h)("span", null, props.diff.compareValue));
};
/** @param {import('@lhci/utils/src/audit-diff-finder').RowLabel} rowLabel @return {'regression'|'improvement'|'neutral'} */


function getDiffLabelForRowLabel(rowLabel) {
  switch (rowLabel) {
    case 'added':
    case 'worse':
    case 'ambiguous':
      return 'regression';

    case 'removed':
    case 'better':
      return 'improvement';

    case 'no change':
      return 'neutral';
  }
}
/** @param {Array<LHCI.AuditDiff>} diffs */


function getUniqueBaseCompareIndexPairs(diffs) {
  return _.uniqBy(diffs.map(diff => ({
    base: 'baseItemIndex' in diff ? diff.baseItemIndex : undefined,
    compare: 'compareItemIndex' in diff ? diff.compareItemIndex : undefined
  })).filter(indexes => typeof indexes.base === 'number' || typeof indexes.compare === 'number'), idx => `${idx.base}-${idx.compare}`);
}
/** @param {{diffs: Array<LHCI.AuditDiff>, audit: LH.AuditResult, baseAudit: LH.AuditResult, groupId: string, showAsNarrow?: boolean}} props */


const ItemDiff = props => {
  const {
    diffs,
    baseAudit,
    groupId
  } = props;
  if (!baseAudit.details || !baseAudit.details.items) return null;
  const rowIndexes = getUniqueBaseCompareIndexPairs(diffs);
  const rowLabels = rowIndexes.map(pair => (0, _auditDiffFinder.getRowLabelForIndex)(diffs, pair.compare, pair.base)).map(getDiffLabelForRowLabel);
  const regressionCount = rowLabels.filter(label => label === 'regression').length;
  const improvementCount = rowLabels.filter(label => label === 'improvement').length;
  const baseElements = (0, _preact.h)(_preact.Fragment, null, (0, _preact.h)("div", {
    className: "audit-group__diff-badge-group"
  }, (0, _preact.h)(IconForAuditItems, {
    audit: props.audit,
    groupId: groupId
  }), (0, _preact.h)("div", {
    className: "audit-group__diff-badges"
  }, (0, _preact.h)("span", {
    className: "audit-group__diff-badge"
  }, baseAudit.details.items.length))), (0, _preact.h)("i", {
    className: `material-icons audit-group__diff-arrow audit-group__diff-arrow--${improvementCount > regressionCount ? 'improvement' : 'regression'}`
  }, "arrow_forward"));
  return (0, _preact.h)(_preact.Fragment, null, props.showAsNarrow ? (0, _preact.h)(_preact.Fragment, null) : baseElements, (0, _preact.h)("div", {
    className: (0, _clsx.default)(`audit-group__diff-badge-group`)
  }, (0, _preact.h)(IconForAuditItems, {
    audit: props.audit,
    groupId: groupId
  }), (0, _preact.h)("div", {
    className: (0, _clsx.default)('audit-group__diff-badges', {
      'audit-group__diff-badge-group--multiple': Boolean(regressionCount && improvementCount)
    })
  }, regressionCount ? (0, _preact.h)("span", {
    className: "audit-group__diff-badge audit-group__diff-badge--regression"
  }, regressionCount) : null, improvementCount ? (0, _preact.h)("span", {
    className: "audit-group__diff-badge audit-group__diff-badge--improvement"
  }, improvementCount) : null)), (0, _preact.h)("div", {
    style: {
      width: 10
    }
  }));
};
/** @param {{pair: LHCI.AuditPair, showAsBigPicture: boolean, showAsNarrow: boolean}} props */


exports.ItemDiff = ItemDiff;

const AuditDiff = props => {
  const {
    audit,
    baseAudit,
    diffs,
    group
  } = props.pair;
  const noDiffAvailable = (0, _preact.h)("span", null, "No diff available");
  if (!baseAudit) return noDiffAvailable;
  const numericDiff = diffs.find(diff => diff.type === 'numericValue');

  if (numericDiff && numericDiff.type === 'numericValue') {
    return (0, _preact.h)(_numericDiff.NumericDiff, {
      diff: numericDiff,
      audit: audit,
      groupId: group.id,
      showAsBigPicture: props.showAsBigPicture,
      showAsNarrow: props.showAsNarrow
    });
  }

  const hasItemDiff = diffs.some(diff => diff.type === 'itemAddition' || diff.type === 'itemRemoval' || diff.type === 'itemDelta');

  if (hasItemDiff) {
    return (0, _preact.h)(ItemDiff, {
      diffs: diffs,
      audit: audit,
      baseAudit: baseAudit,
      groupId: group.id,
      showAsNarrow: props.showAsNarrow
    });
  }

  const scoreDiff = diffs.find(diff => diff.type === 'score');
  if (scoreDiff) return (0, _preact.h)(ScoreDiff, {
    diff: scoreDiff,
    audit: audit,
    baseAudit: baseAudit
  });
  const displayValueDiff = diffs.find(diff => diff.type === 'displayValue');
  if (!displayValueDiff || displayValueDiff.type !== 'displayValue') return noDiffAvailable;
  return (0, _preact.h)(DisplayValueDiff, {
    diff: displayValueDiff,
    audit: audit,
    baseAudit: baseAudit
  });
};

exports.AuditDiff = AuditDiff;
},{"@lhci/utils/src/lodash":"../../../../node_modules/@lhci/utils/src/lodash.js","preact":"../../../../node_modules/preact/dist/preact.module.js","../../../components/score-icon":"../../../server/src/ui/components/score-icon.jsx","./numeric-diff":"../../../server/src/ui/routes/build-view/audit-list/numeric-diff.jsx","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js"}],"../../../server/src/ui/routes/build-view/audit-detail/audit-detail.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditDetail = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

var _scoreIcon = require("../../../components/score-icon");

var _markdown = require("../../../components/markdown");

var _tableDetails = require("./table-details");

var _numericDiff = require("../audit-list/numeric-diff");

var _auditDiff = require("../audit-list/audit-diff");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/** @param {{pair: LHCI.AuditPair, diff: LHCI.AuditDiff}} props */
const ScoreOnlyDetails = props => {
  const {
    audit,
    baseAudit
  } = props.pair;
  if (!baseAudit) return null;
  return (0, _preact.h)("div", {
    className: "audit-detail-pane__audit-details--binary"
  }, (0, _preact.h)(_scoreIcon.ScoreWord, {
    audit: baseAudit
  }), (0, _preact.h)("i", {
    className: `material-icons audit-group__diff-arrow audit-group__diff-arrow--${(0, _auditDiffFinder.getDiffLabel)(props.diff)}`
  }, "arrow_forward"), (0, _preact.h)(_scoreIcon.ScoreWord, {
    audit: audit
  }));
};
/** @param {{pair: LHCI.AuditPair, key?: string}} props */


const Details = props => {
  const {
    pair
  } = props;
  const type = pair.audit.details && pair.audit.details.type;
  let itemDiff = undefined;
  let tableDetails = undefined;
  let numericDetails = undefined;

  if (type === 'table' || type === 'opportunity') {
    tableDetails = (0, _preact.h)(_tableDetails.TableDetails, {
      pair: pair
    });

    if (pair.baseAudit) {
      itemDiff = (0, _preact.h)(_auditDiff.ItemDiff, _extends({}, pair, {
        baseAudit: pair.baseAudit,
        groupId: pair.group.id
      }));
    }
  }

  const numericDiff = pair.diffs.find(diff => diff.type === 'numericValue');

  if (numericDiff && numericDiff.type === 'numericValue') {
    numericDetails = (0, _preact.h)(_numericDiff.NumericDiff, {
      diff: numericDiff,
      audit: pair.audit
    });
  }

  if (tableDetails || numericDiff) {
    return (0, _preact.h)(_preact.Fragment, null, (0, _preact.h)("div", {
      className: "audit-detail-pane__audit-details-summary"
    }, numericDetails || itemDiff), tableDetails);
  }

  const scoreDiff = pair.diffs.find(diff => diff.type === 'score');
  if (scoreDiff && scoreDiff.type === 'score') return (0, _preact.h)(ScoreOnlyDetails, {
    diff: scoreDiff,
    pair: props.pair
  });
  return (0, _preact.h)("pre", null, JSON.stringify(props.pair, null, 2));
};
/** @param {{pair: LHCI.AuditPair, key?: string}} props */


const AuditDetail = props => {
  const {
    audit
  } = props.pair;
  return (0, _preact.h)("div", {
    id: `audit-detail-pane-audit--${audit.id}`,
    className: (0, _clsx.default)('audit-detail-pane__audit')
  }, (0, _preact.h)("div", {
    className: "audit-detail-pane__score"
  }, (0, _preact.h)(_scoreIcon.ScoreIcon, {
    score: audit.score || 0
  })), (0, _preact.h)("div", {
    className: "audit-detail-pane__audit-title"
  }, audit.title), (0, _preact.h)("div", {
    className: "audit-detail-pane__audit-description"
  }, (0, _preact.h)(_markdown.Markdown, {
    text: audit.description || ''
  })), (0, _preact.h)("div", {
    className: "audit-detail-pane__audit-details"
  }, (0, _preact.h)(Details, {
    pair: props.pair
  })));
};

exports.AuditDetail = AuditDetail;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","../../../components/score-icon":"../../../server/src/ui/components/score-icon.jsx","../../../components/markdown":"../../../server/src/ui/components/markdown.jsx","./table-details":"../../../server/src/ui/routes/build-view/audit-detail/table-details.jsx","../audit-list/numeric-diff":"../../../server/src/ui/routes/build-view/audit-list/numeric-diff.jsx","../audit-list/audit-diff":"../../../server/src/ui/routes/build-view/audit-list/audit-diff.jsx","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js"}],"../../../server/src/ui/routes/build-view/audit-detail/audit-detail-pane.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditDetailPane = void 0;

var _preact = require("preact");

require("./audit-detail-pane.css");

var _usePreviousValue = require("../../../hooks/use-previous-value.jsx");

var _hooks = require("preact/hooks");

var _auditDetail = require("./audit-detail");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @param {{selectedAuditId: string, setSelectedAuditId: (id: string|null) => void, pairs: Array<LHCI.AuditPair>, baseLhr?: LH.Result}} props
 */
const AuditDetailPane = props => {
  /** @type {import('preact').Ref<HTMLElement|undefined>} */
  const paneElementRef = (0, _hooks.useRef)(undefined);
  const previouslySelectedAuditId = (0, _usePreviousValue.usePreviousValue)(props.selectedAuditId); // Scroll to the selected audit *when it changes*

  (0, _hooks.useEffect)(() => {
    const auditId = props.selectedAuditId;
    const paneElement = paneElementRef.current;
    if (!paneElement || !auditId || auditId === previouslySelectedAuditId) return;
    const childElement = paneElement.querySelector(`#audit-detail-pane-audit--${auditId}`);
    if (!childElement || !(childElement instanceof HTMLElement)) return;
    paneElement.scrollTo(0, childElement.offsetTop);
  }, [props.selectedAuditId, previouslySelectedAuditId]);
  return (0, _preact.h)("div", {
    className: "audit-detail-pane",
    ref: el => paneElementRef.current = el
  }, (0, _preact.h)("div", {
    className: "audit-detail-pane__close",
    onClick: () => props.setSelectedAuditId(null)
  }, (0, _preact.h)("i", {
    className: "material-icons"
  }, "close")), props.pairs.map(pair => {
    const {
      audit
    } = pair;
    if (!audit.id) return undefined;
    return (0, _preact.h)(_auditDetail.AuditDetail, {
      key: audit.id,
      pair: pair
    });
  }));
};

exports.AuditDetailPane = AuditDetailPane;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./audit-detail-pane.css":"../../../server/src/ui/routes/build-view/audit-detail/audit-detail-pane.css","../../../hooks/use-previous-value.jsx":"../../../server/src/ui/hooks/use-previous-value.jsx","preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js","./audit-detail":"../../../server/src/ui/routes/build-view/audit-detail/audit-detail.jsx"}],"../../../server/src/ui/routes/build-view/lhr-comparison-scores.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/gauge.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/gauge.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Gauge = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

require("./gauge.css");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {{className?: string, score: number, diff?: LHCI.NumericAuditDiff}} props */
const Gauge = props => {
  const score = Math.round(props.score * 100);
  const rawBaseScore = props.diff ? props.diff.baseValue : props.score;
  const baseScore = Math.round(rawBaseScore * 100);
  const label = props.diff ? (0, _auditDiffFinder.getDiffLabel)(props.diff) : 'neutral'; // 352 is ~= 2 * Math.PI * gauge radius (56)
  // https://codepen.io/xgad/post/svg-radial-progress-meters
  // score of 50: `stroke-dasharray: 176 352`;
  // The roundcap on the arc makes it extend slightly past where it should, so we need to adjust it by a few pts.

  const baseDasharrayScore = Math.max(0, props.score * 352 - 2);
  const baseStrokeDasharray = `${baseDasharrayScore} 352`;
  const delta = Math.abs(baseScore - score);
  const deltaDasharrayScore = Math.max(0, delta / 100 * 352 - 2);
  const deltaStrokeDasharray = `${deltaDasharrayScore} 352`;
  const deltaTransform = `rotate(${Math.min(score, baseScore) / 100 * 360}deg)`;
  const indicatorTransform = `rotate(${props.score * 360}deg)`;
  return (0, _preact.h)("div", {
    className: (0, _clsx.default)('gauge', `gauge--${label}`)
  }, (0, _preact.h)("div", {
    className: "gauge-arc"
  }, (0, _preact.h)("svg", {
    viewBox: "0 0 120 120"
  }, (0, _preact.h)("circle", {
    className: "gauge-arc__arc",
    transform: "rotate(-90 60 60)",
    r: "56",
    cx: "60",
    cy: "60",
    style: {
      strokeDasharray: baseStrokeDasharray
    }
  })), (0, _preact.h)("div", {
    className: "gauge-arc__delta-wrapper",
    style: {
      transform: deltaTransform,
      display: deltaDasharrayScore < 1 ? 'none' : 'block'
    }
  }, (0, _preact.h)("svg", {
    viewBox: "0 0 120 120"
  }, (0, _preact.h)("circle", {
    className: "gauge-arc__arc",
    transform: "rotate(-90 60 60)",
    r: "56",
    cx: "60",
    cy: "60",
    style: {
      strokeDasharray: deltaStrokeDasharray
    }
  }))), (0, _preact.h)("div", {
    className: "gauge-arc__indicator-wrapper",
    style: {
      transform: indicatorTransform
    }
  }, (0, _preact.h)("div", {
    className: "gauge-arc__indicator"
  }))), (0, _preact.h)("span", null, score));
};

exports.Gauge = Gauge;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","./gauge.css":"../../../server/src/ui/components/gauge.css","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js"}],"../../../server/src/ui/components/pwa-gauge.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/components/pwa-gauge.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBadgeDiffType = getBadgeDiffType;
exports.getBadgeStatus = getBadgeStatus;
exports.PWAGauge = exports.OptimizedIcon = exports.InstallableIcon = exports.FastReliableIcon = void 0;

var _preact = require("preact");

var _clsx = _interopRequireDefault(require("clsx"));

var _ = _interopRequireWildcard(require("@lhci/utils/src/lodash.js"));

require("./pwa-gauge.css");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
// For SVG to function properly, we need to use the real attribtues that preact doesn't set.

/* eslint-disable react/no-unknown-property */

/** @typedef {{optimized: boolean, installable: boolean, fastAndReliable: boolean}} PWABadgeStatus */

/** @param {{deltaType: import('@lhci/utils/src/audit-diff-finder').DiffLabel}} props */
const FastReliableIcon = props => {
  return (0, _preact.h)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    class: `pwa-icon pwa-icon--${props.deltaType}`
  }, (0, _preact.h)("g", {
    "fill-rule": "nonzero",
    fill: "none"
  }, (0, _preact.h)("circle", {
    class: `pwa-icon__background`,
    cx: "12",
    cy: "12",
    r: "12"
  }), (0, _preact.h)("path", {
    d: "M12 4.3l6.3 2.8v4.2c0 3.88-2.69 7.52-6.3 8.4-3.61-.88-6.3-4.51-6.3-8.4V7.1L12 4.3zm-.56 12.88l3.3-5.79.04-.08c.05-.1.01-.29-.26-.29h-1.96l.56-3.92h-.56L9.3 12.82c0 .03.07-.12-.03.07-.11.2-.12.37.2.37h1.97l-.56 3.92h.56z",
    fill: "#FFF"
  })));
};
/** @param {{deltaType: import('@lhci/utils/src/audit-diff-finder').DiffLabel}} props */


exports.FastReliableIcon = FastReliableIcon;

const InstallableIcon = props => {
  return (0, _preact.h)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    class: `pwa-icon pwa-icon--${props.deltaType}`
  }, (0, _preact.h)("g", {
    "fill-rule": "nonzero",
    fill: "none"
  }, (0, _preact.h)("circle", {
    class: `pwa-icon__background`,
    cx: "12",
    cy: "12",
    r: "12"
  }), (0, _preact.h)("path", {
    d: "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm3.5 7.7h-2.8v2.8h-1.4v-2.8H8.5v-1.4h2.8V8.5h1.4v2.8h2.8v1.4z",
    fill: "#FFF"
  })));
};
/** @param {{deltaType: import('@lhci/utils/src/audit-diff-finder').DiffLabel}} props */


exports.InstallableIcon = InstallableIcon;

const OptimizedIcon = props => {
  return (0, _preact.h)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    class: `pwa-icon pwa-icon--${props.deltaType}`
  }, (0, _preact.h)("g", {
    fill: "none",
    "fill-rule": "evenodd"
  }, (0, _preact.h)("rect", {
    class: `pwa-icon__background`,
    width: "24",
    height: "24",
    rx: "12"
  }), (0, _preact.h)("path", {
    d: "M5 5h14v14H5z"
  }), (0, _preact.h)("path", {
    fill: "#FFF",
    d: "M12 15.07l3.6 2.18-.95-4.1 3.18-2.76-4.2-.36L12 6.17l-1.64 3.86-4.2.36 3.2 2.76-.96 4.1z"
  })));
};
/**
 *
 * @param {PWABadgeStatus} base
 * @param {PWABadgeStatus} compare
 * @param {keyof PWABadgeStatus} key
 * @return {import('@lhci/utils/src/audit-diff-finder').DiffLabel}
 */


exports.OptimizedIcon = OptimizedIcon;

function getBadgeDiffType(base, compare, key) {
  if (base[key] === compare[key]) return 'neutral';
  if (compare[key]) return 'improvement';
  return 'regression';
}
/** @param {LH.Result} lhr @return {PWABadgeStatus} */


function getBadgeStatus(lhr) {
  const pwaCategory = lhr.categories.pwa;

  const auditsByCategory = _.groupIntoMap(pwaCategory.auditRefs, ref => ref.group);
  /** @param {LH.CategoryResult['auditRefs']} [refs] */


  const hasEveryPass = (refs = []) => refs.map(ref => lhr.audits[ref.id]).every(audit => audit && audit.score === 1);

  return {
    optimized: hasEveryPass(auditsByCategory.get('pwa-optimized') || []),
    installable: hasEveryPass(auditsByCategory.get('pwa-installable') || []),
    fastAndReliable: hasEveryPass(auditsByCategory.get('pwa-fast-reliable') || [])
  };
}
/** @param {{status: PWABadgeStatus}} props */


const PWAGauge = props => {
  const {
    status
  } = props;
  const all = status.optimized && status.installable && status.fastAndReliable;
  return (0, _preact.h)("div", {
    className: (0, _clsx.default)('pwa-gauge', {
      'pwa-gauge--all': all,
      'pwa-gauge--pwa-optimized': !all && status.optimized,
      'pwa-gauge--pwa-installable': !all && status.installable,
      'pwa-gauge--pwa-fast-reliable': !all && status.fastAndReliable
    })
  }, (0, _preact.h)("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 60 60"
  }, (0, _preact.h)("defs", null, (0, _preact.h)("linearGradient", {
    id: "pwa-gauge__check-circle__gradient",
    x1: "50%",
    y1: "0%",
    x2: "50%",
    y2: "100%"
  }, (0, _preact.h)("stop", {
    "stop-color": "#00C852",
    offset: "0%"
  }), (0, _preact.h)("stop", {
    "stop-color": "#009688",
    offset: "100%"
  })), (0, _preact.h)("linearGradient", {
    id: "pwa-gauge__installable__shadow-gradient",
    x1: "76.056%",
    x2: "24.111%",
    y1: "82.995%",
    y2: "24.735%"
  }, (0, _preact.h)("stop", {
    "stop-color": "#A5D6A7",
    offset: "0%"
  }), (0, _preact.h)("stop", {
    "stop-color": "#80CBC4",
    offset: "100%"
  })), (0, _preact.h)("linearGradient", {
    id: "pwa-gauge__fast-reliable__shadow-gradient",
    x1: "76.056%",
    y1: "82.995%",
    x2: "25.678%",
    y2: "26.493%"
  }, (0, _preact.h)("stop", {
    "stop-color": "#64B5F6",
    offset: "0%"
  }), (0, _preact.h)("stop", {
    "stop-color": "#2979FF",
    offset: "100%"
  })), (0, _preact.h)("g", {
    id: "pwa-gauge__fast-reliable-badge"
  }, (0, _preact.h)("circle", {
    fill: "#FFFFFF",
    cx: "10",
    cy: "10",
    r: "10"
  }), (0, _preact.h)("path", {
    fill: "#304FFE",
    d: "M10 3.58l5.25 2.34v3.5c0 3.23-2.24 6.26-5.25 7-3.01-.74-5.25-3.77-5.25-7v-3.5L10 3.58zm-.47 10.74l2.76-4.83.03-.07c.04-.08 0-.24-.22-.24h-1.64l.47-3.26h-.47l-2.7 4.77c-.02.01.05-.1-.04.05-.09.16-.1.31.18.31h1.63l-.47 3.27h.47z"
  })), (0, _preact.h)("g", {
    id: "pwa-gauge__installable-badge"
  }, (0, _preact.h)("circle", {
    fill: "#FFFFFF",
    cx: "10",
    cy: "10",
    r: "10"
  }), (0, _preact.h)("path", {
    fill: "#009688",
    d: "M10 4.167A5.835 5.835 0 0 0 4.167 10 5.835 5.835 0 0 0 10 15.833 5.835 5.835 0 0 0 15.833 10 5.835 5.835 0 0 0 10 4.167zm2.917 6.416h-2.334v2.334H9.417v-2.334H7.083V9.417h2.334V7.083h1.166v2.334h2.334v1.166z"
  }))), (0, _preact.h)("g", {
    stroke: "none",
    "fill-rule": "nonzero"
  }, (0, _preact.h)("circle", {
    class: "pwa-gauge__disc",
    cx: "30",
    cy: "30",
    r: "30"
  }), (0, _preact.h)("g", {
    class: "pwa-gauge__logo"
  }, (0, _preact.h)("path", {
    class: "pwa-gauge__logo--secondary-color",
    d: "M35.66 19.39l.7-1.75h2L37.4 15 38.6 12l3.4 9h-2.51l-.58-1.61z"
  }), (0, _preact.h)("path", {
    class: "pwa-gauge__logo--primary-color",
    d: "M33.52 21l3.65-9h-2.42l-2.5 5.82L30.5 12h-1.86l-1.9 5.82-1.35-2.65-1.21 3.72L25.4 21h2.38l1.72-5.2 1.64 5.2z"
  }), (0, _preact.h)("path", {
    class: "pwa-gauge__logo--secondary-color",
    "fill-rule": "nonzero",
    d: "M20.3 17.91h1.48c.45 0 .85-.05 1.2-.15l.39-1.18 1.07-3.3a2.64 2.64 0 0 0-.28-.37c-.55-.6-1.36-.91-2.42-.91H18v9h2.3V17.9zm1.96-3.84c.22.22.33.5.33.87 0 .36-.1.65-.29.87-.2.23-.59.35-1.15.35h-.86v-2.41h.87c.52 0 .89.1 1.1.32z"
  })), (0, _preact.h)("rect", {
    class: "pwa-gauge__component pwa-gauge__na-line",
    fill: "#FFFFFF",
    x: "20",
    y: "32",
    width: "20",
    height: "4",
    rx: "2"
  }), (0, _preact.h)("g", {
    class: "pwa-gauge__component pwa-gauge__fast-reliable-badge",
    transform: "translate(20, 29)"
  }, (0, _preact.h)("path", {
    fill: "url(#pwa-gauge__fast-reliable__shadow-gradient)",
    d: "M33.63 19.49A30 30 0 0 1 16.2 30.36L3 17.14 17.14 3l16.49 16.49z"
  }), (0, _preact.h)("use", {
    href: "#pwa-gauge__fast-reliable-badge"
  })), (0, _preact.h)("g", {
    class: "pwa-gauge__component pwa-gauge__installable-badge",
    transform: "translate(20, 29)"
  }, (0, _preact.h)("path", {
    fill: "url(#pwa-gauge__installable__shadow-gradient)",
    d: "M33.629 19.487c-4.272 5.453-10.391 9.39-17.415 10.869L3 17.142 17.142 3 33.63 19.487z"
  }), (0, _preact.h)("use", {
    href: "#pwa-gauge__installable-badge"
  })), (0, _preact.h)("g", {
    class: "pwa-gauge__component pwa-gauge__fast-reliable-installable-badges"
  }, (0, _preact.h)("g", {
    transform: "translate(8, 29)"
  }, (0, _preact.h)("path", {
    fill: "url(#pwa-gauge__fast-reliable__shadow-gradient)",
    d: "M16.321 30.463L3 17.143 17.142 3l22.365 22.365A29.864 29.864 0 0 1 22 31c-1.942 0-3.84-.184-5.679-.537z"
  }), (0, _preact.h)("use", {
    href: "#pwa-gauge__fast-reliable-badge"
  })), (0, _preact.h)("g", {
    transform: "translate(32, 29)"
  }, (0, _preact.h)("path", {
    fill: "url(#pwa-gauge__installable__shadow-gradient)",
    d: "M25.982 11.84a30.107 30.107 0 0 1-13.08 15.203L3 17.143 17.142 3l8.84 8.84z"
  }), (0, _preact.h)("use", {
    href: "#pwa-gauge__installable-badge"
  }))), (0, _preact.h)("g", {
    class: "pwa-gauge__component pwa-gauge__check-circle",
    transform: "translate(18, 28)"
  }, (0, _preact.h)("circle", {
    fill: "#FFFFFF",
    cx: "12",
    cy: "12",
    r: "12"
  }), (0, _preact.h)("path", {
    fill: "url(#pwa-gauge__check-circle__gradient)",
    d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
  })))));
};

exports.PWAGauge = PWAGauge;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","@lhci/utils/src/lodash.js":"../../../../node_modules/@lhci/utils/src/lodash.js","./pwa-gauge.css":"../../../server/src/ui/components/pwa-gauge.css"}],"../../../server/src/ui/routes/build-view/lhr-comparison-scores.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LhrComparisonScores = void 0;

var _preact = require("preact");

require("./lhr-comparison-scores.css");

var _clsx = _interopRequireDefault(require("clsx"));

var _gauge = require("../../components/gauge");

var _pwaGauge = require("../../components/pwa-gauge");

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @param {number} score */
const renderScore = score => Math.round(score * 100);
/** @param {{lhr: LH.Result, baseLhr?: LH.Result, categoryId: string}} props */


const StandardScoreItem = props => {
  const {
    lhr,
    baseLhr,
    categoryId
  } = props;
  const category = lhr.categories[categoryId];
  let deltaEl = null;
  let classes = '';
  /** @type {LHCI.NumericAuditDiff|undefined} */

  let diff = undefined;

  if (baseLhr) {
    const baseCategory = baseLhr.categories[categoryId];

    if (baseCategory) {
      diff = {
        auditId: '',
        type: 'score',
        baseValue: baseCategory.score,
        compareValue: category.score
      };
      const delta = renderScore(category.score - baseCategory.score);
      classes = `lhr-comparison-scores-item--${(0, _auditDiffFinder.getDiffLabel)(diff)}`;
      deltaEl = (0, _preact.h)("div", {
        className: (0, _clsx.default)('lhr-comparison-scores-item__delta')
      }, delta < 0 ? delta : `+${delta}`);
    }
  }

  return (0, _preact.h)("div", {
    key: categoryId,
    className: (0, _clsx.default)('lhr-comparison-scores-item', classes)
  }, (0, _preact.h)(_gauge.Gauge, {
    score: category.score,
    diff: diff
  }), (0, _preact.h)("div", {
    className: "lhr-comparison-scores-item__label"
  }, category.title), deltaEl);
};
/** @param {{lhr: LH.Result, baseLhr?: LH.Result, categoryId: string}} props */


const PwaScoreItem = props => {
  const {
    lhr,
    baseLhr,
    categoryId
  } = props;
  const compareStatus = (0, _pwaGauge.getBadgeStatus)(lhr);
  let deltaEl;
  const overallStatus = 'neutral';

  if (baseLhr) {
    const baseStatus = (0, _pwaGauge.getBadgeStatus)(baseLhr);
    const diffTypes = {
      fastAndReliable: (0, _pwaGauge.getBadgeDiffType)(baseStatus, compareStatus, 'fastAndReliable'),
      installable: (0, _pwaGauge.getBadgeDiffType)(baseStatus, compareStatus, 'installable'),
      optimized: (0, _pwaGauge.getBadgeDiffType)(baseStatus, compareStatus, 'optimized')
    };
    const allEqual = Object.values(diffTypes).every(type => type === 'neutral');
    const individualBadges = (0, _preact.h)(_preact.Fragment, null, diffTypes.fastAndReliable === 'neutral' ? (0, _preact.h)(_preact.Fragment, null) : (0, _preact.h)(_pwaGauge.FastReliableIcon, {
      deltaType: diffTypes.fastAndReliable
    }), diffTypes.installable === 'neutral' ? (0, _preact.h)(_preact.Fragment, null) : (0, _preact.h)(_pwaGauge.InstallableIcon, {
      deltaType: diffTypes.installable
    }), diffTypes.optimized === 'neutral' ? (0, _preact.h)(_preact.Fragment, null) : (0, _preact.h)(_pwaGauge.OptimizedIcon, {
      deltaType: diffTypes.optimized
    }));
    deltaEl = (0, _preact.h)("div", {
      className: (0, _clsx.default)('lhr-comparison-scores-item__delta')
    }, allEqual ? '-' : individualBadges);
  }

  return (0, _preact.h)("div", {
    key: categoryId,
    className: (0, _clsx.default)('lhr-comparison-scores-item', `lhr-comparison-scores-item--pwa`, `lhr-comparison-scores-item--${overallStatus}`)
  }, (0, _preact.h)(_pwaGauge.PWAGauge, {
    status: compareStatus
  }), (0, _preact.h)("div", {
    className: "lhr-comparison-scores-item__label"
  }, "PWA"), deltaEl);
};
/**
 * @param {{lhr?: LH.Result, baseLhr?: LH.Result}} props
 */


const LhrComparisonScores = props => {
  const {
    lhr,
    baseLhr
  } = props;
  if (!lhr) return null;
  const categoryIds = Object.keys(lhr.categories);
  return (0, _preact.h)("div", {
    className: "lhr-comparison-scores"
  }, categoryIds.sort((idA, idB) => {
    const sortKeyA = idA === 'pwa' ? Infinity : categoryIds.indexOf(idA);
    const sortKeyB = idB === 'pwa' ? Infinity : categoryIds.indexOf(idB);
    return sortKeyA - sortKeyB;
  }).map(id => {
    return id === 'pwa' ? (0, _preact.h)(PwaScoreItem, {
      lhr: lhr,
      baseLhr: baseLhr,
      categoryId: id
    }) : (0, _preact.h)(StandardScoreItem, {
      lhr: lhr,
      baseLhr: baseLhr,
      categoryId: id
    });
  }));
};

exports.LhrComparisonScores = LhrComparisonScores;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./lhr-comparison-scores.css":"../../../server/src/ui/routes/build-view/lhr-comparison-scores.css","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","../../components/gauge":"../../../server/src/ui/components/gauge.jsx","../../components/pwa-gauge":"../../../server/src/ui/components/pwa-gauge.jsx","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js"}],"../../../server/src/ui/routes/build-view/audit-list/audit-group.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/routes/build-view/audit-list/audit-group.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditGroup = void 0;

var _preact = require("preact");

require("./audit-group.css");

var _paper = require("../../../components/paper");

var _scoreIcon = require("../../../components/score-icon");

var _clsx = _interopRequireDefault(require("clsx"));

var _auditDiff = require("./audit-diff");

var _hooks = require("preact/hooks");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @param {{key?: string, group: {id: string, title: string}, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, pairs: Array<LHCI.AuditPair>, baseLhr?: LH.Result, showAsNarrow: boolean}} props
 */
const AuditGroup = props => {
  const {
    group,
    pairs
  } = props;
  const [showAsBigPicture, setShowAsBigPicture] = (0, _hooks.useState)(group.id === 'metrics');
  return (0, _preact.h)(_paper.Paper, {
    className: "audit-group"
  }, (0, _preact.h)("div", {
    className: "audit-group__header"
  }, (0, _preact.h)("div", {
    className: "audit-group__title"
  }, group.title), group.id === 'metrics' && !props.showAsNarrow ? (0, _preact.h)("div", {
    className: "audit-group__big-picture-tabs"
  }, (0, _preact.h)("span", {
    className: (0, _clsx.default)('big-picture-tabs__tab', {
      'big-picture-tabs__tab--selected': showAsBigPicture
    }),
    onClick: () => setShowAsBigPicture(true)
  }, "Overview"), (0, _preact.h)("span", {
    className: (0, _clsx.default)('big-picture-tabs__tab', {
      'big-picture-tabs__tab--selected': !showAsBigPicture
    }),
    onClick: () => setShowAsBigPicture(false)
  }, "Magnified")) : (0, _preact.h)(_preact.Fragment, null)), (0, _preact.h)("div", {
    className: "audit-group__audits"
  }, pairs.map(pair => {
    const {
      audit
    } = pair; // Only metrics are allowed to display the numericValue diff in this view.

    if (group.id !== 'metrics') {
      pair = { ...pair,
        diffs: pair.diffs.filter(diff => diff.type !== 'numericValue')
      };
    }

    return (0, _preact.h)("div", {
      key: audit.id,
      className: (0, _clsx.default)('audit-group__audit'),
      onClick: () => props.setSelectedAuditId(audit.id || null)
    }, (0, _preact.h)("div", {
      className: "audit-group__audit-score"
    }, (0, _preact.h)(_scoreIcon.ScoreIcon, {
      score: audit.score || 0
    })), (0, _preact.h)("div", {
      className: "audit-group__audit-title"
    }, audit.title), (0, _preact.h)("div", {
      className: "audit-group__audit-diff"
    }, (0, _preact.h)(_auditDiff.AuditDiff, {
      pair: pair,
      showAsBigPicture: showAsBigPicture,
      showAsNarrow: props.showAsNarrow
    })));
  })));
};

exports.AuditGroup = AuditGroup;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./audit-group.css":"../../../server/src/ui/routes/build-view/audit-list/audit-group.css","../../../components/paper":"../../../server/src/ui/components/paper.jsx","../../../components/score-icon":"../../../server/src/ui/components/score-icon.jsx","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","./audit-diff":"../../../server/src/ui/routes/build-view/audit-list/audit-diff.jsx","preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js"}],"../../../server/src/ui/routes/build-view/lhr-comparison-legend.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/routes/build-view/lhr-comparison-legend.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LhrComparisonLegend = void 0;

var _preact = require("preact");

require("./lhr-comparison-legend.css");

var _scoreIcon = require("../../components/score-icon");

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
const LhrComparisonLegend = () => {
  return (0, _preact.h)("div", {
    className: "lhr-comparison-legend"
  }, (0, _preact.h)(_scoreIcon.ScoreIcon, {
    score: 0
  }), (0, _preact.h)("span", {
    className: "lhr-comparison-legend__label"
  }, "0-49"), (0, _preact.h)(_scoreIcon.ScoreIcon, {
    score: 0.5
  }), (0, _preact.h)("span", {
    className: "lhr-comparison-legend__label"
  }, "50-89"), (0, _preact.h)(_scoreIcon.ScoreIcon, {
    score: 1
  }), (0, _preact.h)("span", {
    className: "lhr-comparison-legend__label"
  }, "90-100"), (0, _preact.h)("i", {
    className: "lhr-comparison-legend__chip lhr-comparison-legend__chip--regression"
  }), (0, _preact.h)("span", {
    className: "lhr-comparison-legend__label"
  }, "Regression"), (0, _preact.h)("i", {
    className: "lhr-comparison-legend__chip lhr-comparison-legend__chip--improvement"
  }), (0, _preact.h)("span", {
    className: "lhr-comparison-legend__label"
  }, "Improvement"));
};

exports.LhrComparisonLegend = LhrComparisonLegend;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./lhr-comparison-legend.css":"../../../server/src/ui/routes/build-view/lhr-comparison-legend.css","../../components/score-icon":"../../../server/src/ui/components/score-icon.jsx"}],"../../../server/src/ui/routes/build-view/lhr-comparison.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"../../../server/src/ui/routes/build-view/lhr-comparison.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.computeAuditGroups = computeAuditGroups;
exports.LhrComparison = void 0;

var _preact = require("preact");

var _hooks = require("preact/hooks");

var _clsx = _interopRequireDefault(require("clsx"));

var _lodash = _interopRequireDefault(require("@lhci/utils/src/lodash"));

var _auditDiffFinder = require("@lhci/utils/src/audit-diff-finder");

var _dropdown = require("../../components/dropdown");

var _auditDetailPane = require("./audit-detail/audit-detail-pane");

var _lhrComparisonScores = require("./lhr-comparison-scores");

var _auditGroup = require("./audit-list/audit-group");

var _lhrComparisonLegend = require("./lhr-comparison-legend");

var _paper = require("../../components/paper");

var _lhrViewerLink = require("../../components/lhr-viewer-link");

require("./lhr-comparison.css");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {{id: string, audits: Array<LH.AuditResult>, group: {id: string, title: string}}} IntermediateAuditGroupDef */

/** @typedef {{id: string, pairs: Array<LHCI.AuditPair>, group: {id: string, title: string}}} AuditGroupDef */

/**
 * @param {LH.Result} lhr
 * @param {LH.Result|undefined} baseLhr
 * @param {{percentAbsoluteDeltaThreshold: number}} options
 * @return {Array<AuditGroupDef>}
 */
function computeAuditGroups(lhr, baseLhr, options) {
  /** @type {Array<IntermediateAuditGroupDef|undefined>} */
  const rawAuditGroups = Object.entries(lhr.categories).map(([categoryId, category]) => {
    const auditRefsGroupedByGroup = _lodash.default.groupBy(category.auditRefs, ref => ref.group);

    return auditRefsGroupedByGroup.map(auditRefGroup => {
      let groupId = auditRefGroup[0].group || '';
      let group = lhr.categoryGroups && lhr.categoryGroups[groupId];

      if (!group) {
        if (auditRefsGroupedByGroup.length !== 1) return;
        groupId = `category:${categoryId}`;
        group = {
          title: category.title,
          description: category.description
        };
      }

      const audits = auditRefGroup.map(ref => ({ ...lhr.audits[ref.id],
        id: ref.id
      })).sort((a, b) => (a.score || 0) - (b.score || 0));
      return {
        id: groupId,
        group: { ...group,
          id: groupId
        },
        audits
      };
    });
  }).reduce((a, b) => a.concat(b));
  /** @type {Array<AuditGroupDef>} */

  const auditGroups = [];

  for (const intermediateGroup of rawAuditGroups) {
    if (!intermediateGroup) continue;
    const auditPairs = intermediateGroup.audits.map(audit => {
      const baseAudit = baseLhr && baseLhr.audits[audit.id || ''];
      const diffs = baseAudit ? (0, _auditDiffFinder.findAuditDiffs)(baseAudit, audit, { ...options,
        synthesizeItemKeyDiffs: true
      }) : [];
      const maxSeverity = Math.max(...diffs.map(_auditDiffFinder.getDiffSeverity), 0);
      return {
        audit,
        baseAudit,
        diffs,
        maxSeverity,
        group: intermediateGroup.group
      };
    }).filter(pair => !pair.baseAudit || pair.diffs.length);
    const auditGroup = {
      id: intermediateGroup.id,
      group: intermediateGroup.group,
      pairs: auditPairs.sort((a, b) => (a.audit.score || 0) - (b.audit.score || 0))
    };
    if (auditGroup.pairs.length) auditGroups.push(auditGroup);
  }

  return auditGroups;
}
/** @param {{hookElements: LHCI.HookElements<'dropdowns'>, selectedAuditId?: string | null, lhr?: LH.Result, baseLhr?: LH.Result, percentAbsoluteDeltaThreshold: number, setPercentAbsoluteDeltaThreshold: (x: number) => void}} props */


const LhrComparisonScoresAndUrl = props => {
  return (0, _preact.h)("div", {
    className: "lhr-comparison__scores-and-dropdowns"
  }, (0, _preact.h)("div", {
    className: "container"
  }, (0, _preact.h)("div", {
    className: "lhr-comparison__dropdowns"
  }, props.hookElements.dropdowns, (0, _preact.h)(_dropdown.Dropdown, {
    label: "Threshold",
    value: props.percentAbsoluteDeltaThreshold.toString(),
    setValue: value => {
      props.setPercentAbsoluteDeltaThreshold(Number(value));
    },
    options: [{
      value: '0',
      label: '0%'
    }, {
      value: '0.05',
      label: '5%'
    }, {
      value: '0.1',
      label: '10%'
    }, {
      value: '0.15',
      label: '15%'
    }, {
      value: '0.25',
      label: '25%'
    }]
  })), props.selectedAuditId ? (0, _preact.h)(_preact.Fragment, null) : (0, _preact.h)(_lhrComparisonScores.LhrComparisonScores, props)));
};
/** @param {{auditGroups: Array<AuditGroupDef|undefined>, baseLhr?: LH.Result, selectedAuditId: string|null, setSelectedAuditId: (id: string|null) => void, showAsNarrow: boolean}} props */


const AuditGroups = props => {
  return (0, _preact.h)("div", {
    className: "lhr-comparison__audit-groups"
  }, props.auditGroups.map(auditGroup => {
    if (!auditGroup) return undefined;
    return (0, _preact.h)(_auditGroup.AuditGroup, {
      key: auditGroup.id,
      showAsNarrow: props.showAsNarrow,
      pairs: auditGroup.pairs,
      group: auditGroup.group,
      baseLhr: props.baseLhr,
      selectedAuditId: props.selectedAuditId,
      setSelectedAuditId: props.setSelectedAuditId
    });
  }));
};
/** @param {{lhr: LH.Result, baseLhr: LH.Result|undefined, hookElements: LHCI.HookElements<'dropdowns'|'warnings'>, className?: string}} props */


const LhrComparison = props => {
  const {
    lhr,
    baseLhr
  } = props;
  const [percentAbsoluteDeltaThreshold, setDiffThreshold] = (0, _hooks.useState)(0.05);
  const [selectedAuditId, setAuditId] = (0, _hooks.useState)(
  /** @type {string|null} */
  null); // Attach the LHRs to the window for easy debugging.

  (0, _hooks.useEffect)(() => {
    // @ts-ignore
    window.__LHR__ = lhr; // @ts-ignore

    window.__BASE_LHR__ = baseLhr;
  }, [lhr, baseLhr]);
  const auditGroups = computeAuditGroups(lhr, baseLhr, {
    percentAbsoluteDeltaThreshold
  });
  return (0, _preact.h)(_preact.Fragment, null, selectedAuditId ? (0, _preact.h)(_auditDetailPane.AuditDetailPane, {
    selectedAuditId: selectedAuditId,
    setSelectedAuditId: setAuditId,
    pairs: auditGroups.map(group => group.pairs).reduce((a, b) => a.concat(b)),
    baseLhr: baseLhr
  }) : (0, _preact.h)(_preact.Fragment, null), (0, _preact.h)("div", {
    className: (0, _clsx.default)('lhr-comparison', props.className, {
      'lhr-comparison--with-audit-selection': !!selectedAuditId
    })
  }, (0, _preact.h)(LhrComparisonScoresAndUrl, {
    lhr: lhr,
    baseLhr: baseLhr,
    selectedAuditId: selectedAuditId,
    hookElements: props.hookElements,
    percentAbsoluteDeltaThreshold: percentAbsoluteDeltaThreshold,
    setPercentAbsoluteDeltaThreshold: setDiffThreshold
  }), (0, _preact.h)("div", {
    className: "container"
  }, props.hookElements.warnings, auditGroups.length && baseLhr ? (0, _preact.h)(_preact.Fragment, null, selectedAuditId ? null : (0, _preact.h)("div", {
    className: "lhr-comparison__legend-container"
  }, (0, _preact.h)(_lhrComparisonLegend.LhrComparisonLegend, null)), (0, _preact.h)(AuditGroups, {
    showAsNarrow: !!selectedAuditId,
    auditGroups: auditGroups,
    baseLhr: baseLhr,
    selectedAuditId: selectedAuditId,
    setSelectedAuditId: setAuditId
  })) : props.hookElements.warnings ? null : (0, _preact.h)(_paper.Paper, {
    className: "lhr-comparison__warning"
  }, (0, _preact.h)("i", {
    className: "material-icons"
  }, "sentiment_satisfied_alt"), (0, _preact.h)("div", null, "Woah, no differences found! Switch base builds to explore other differences, or", ' ', (0, _preact.h)(_lhrViewerLink.LhrViewerLink, {
    className: "lhr-comparison__warning__lhr-link",
    lhr: props.lhr
  }, "jump straight to the Lighthouse report."))))));
};

exports.LhrComparison = LhrComparison;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js","clsx":"../../../../node_modules/clsx/dist/clsx.m.js","@lhci/utils/src/lodash":"../../../../node_modules/@lhci/utils/src/lodash.js","@lhci/utils/src/audit-diff-finder":"../../../../node_modules/@lhci/utils/src/audit-diff-finder.js","../../components/dropdown":"../../../server/src/ui/components/dropdown.jsx","./audit-detail/audit-detail-pane":"../../../server/src/ui/routes/build-view/audit-detail/audit-detail-pane.jsx","./lhr-comparison-scores":"../../../server/src/ui/routes/build-view/lhr-comparison-scores.jsx","./audit-list/audit-group":"../../../server/src/ui/routes/build-view/audit-list/audit-group.jsx","./lhr-comparison-legend":"../../../server/src/ui/routes/build-view/lhr-comparison-legend.jsx","../../components/paper":"../../../server/src/ui/components/paper.jsx","../../components/lhr-viewer-link":"../../../server/src/ui/components/lhr-viewer-link.jsx","./lhr-comparison.css":"../../../server/src/ui/routes/build-view/lhr-comparison.css"}],"routes/comparison/comparison.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComparisonRoute = void 0;

var _preact = require("preact");

require("./comparison.css");

var _lhciComponents = require("../../components/lhci-components.jsx");

var _reportUploadBox = require("../../components/report-upload-box");

var _lhrComparison = require("../../../../../server/src/ui/routes/build-view/lhr-comparison");

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {import('../../app.jsx').ToastMessage} ToastMessage */

/** @typedef {import('../../app.jsx').ReportData} ReportData */

/** @param {{baseReport: ReportData, compareReport: ReportData, setBaseReport: (d: ReportData|undefined) => void, setCompareReport: (d: ReportData|undefined) => void, addToast: (t: ToastMessage) => void}} props */
const ComparisonRoute = props => {
  const displayType = (0, _reportUploadBox.computeBestDisplayType)(props.baseReport.lhr, props.compareReport.lhr);
  return (0, _preact.h)("div", {
    className: "comparison"
  }, (0, _preact.h)("div", {
    className: "comparison-header"
  }, (0, _preact.h)("div", {
    className: "comparison-header__switcher",
    onClick: () => {
      props.setBaseReport(props.compareReport);
      props.setCompareReport(props.baseReport);
    }
  }, (0, _preact.h)("i", {
    className: "material-icons"
  }, "swap_horiz")), (0, _preact.h)("div", {
    className: "comparison-header__logo"
  }, (0, _preact.h)("img", {
    src: _lhciComponents.LH_LOGO_PATH,
    alt: "Lighthouse Logo",
    onClick: () => {
      props.setBaseReport(undefined);
      props.setCompareReport(undefined);
    }
  })), (0, _preact.h)("div", {
    className: "comparison-header__upload"
  }, (0, _preact.h)(_reportUploadBox.ReportUploadBox, {
    variant: "base",
    report: props.baseReport,
    setReport: props.setBaseReport,
    addToast: props.addToast,
    displayType: displayType,
    showOpenLhrLink: true
  }), (0, _preact.h)(_reportUploadBox.ReportUploadBox, {
    variant: "compare",
    report: props.compareReport,
    setReport: props.setCompareReport,
    addToast: props.addToast,
    displayType: displayType,
    showOpenLhrLink: true
  })), (0, _preact.h)("a", {
    className: "comparison-header__info",
    href: "https://github.com/GoogleChrome/lighthouse-ci"
  }, (0, _preact.h)("i", {
    className: "material-icons"
  }, "info"))), (0, _preact.h)("div", {
    className: "comparison-body"
  }, (0, _preact.h)(_lhrComparison.LhrComparison, {
    lhr: props.compareReport.lhr,
    baseLhr: props.baseReport.lhr,
    hookElements: {}
  })));
};

exports.ComparisonRoute = ComparisonRoute;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./comparison.css":"routes/comparison/comparison.css","../../components/lhci-components.jsx":"components/lhci-components.jsx","../../components/report-upload-box":"components/report-upload-box.jsx","../../../../../server/src/ui/routes/build-view/lhr-comparison":"../../../server/src/ui/routes/build-view/lhr-comparison.jsx"}],"components/toast.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../../../../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"components/toast.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Toast = void 0;

var _preact = require("preact");

require("./toast.css");

var _hooks = require("preact/hooks");

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {import('../app.jsx').ToastMessage} ToastMessage */

/** @param {{toast: ToastMessage, setToasts: import('preact/hooks/src').StateUpdater<Array<ToastMessage>>}} props */
const Toast = props => {
  const setToasts = props.setToasts;
  const {
    message,
    level = 'info'
  } = props.toast;
  (0, _hooks.useEffect)(() => {
    const interval = setTimeout(() => setToasts(toasts => toasts.filter(t => t !== props.toast)), 5000);
    return () => clearInterval(interval);
  }, []);
  return (0, _preact.h)("div", {
    className: `toast toast--${level}`
  }, message);
};

exports.Toast = Toast;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./toast.css":"components/toast.css","preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js"}],"app.jsx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.App = void 0;

var _preact = require("preact");

var _hooks = require("preact/hooks");

require("../../../server/src/ui/app.css");

require("./app.css");

var _landing = require("./routes/landing/landing.jsx");

var _comparison = require("./routes/comparison/comparison.jsx");

var _lhciComponents = require("./components/lhci-components.jsx");

var _reportUploadBox = require("./components/report-upload-box.jsx");

var _toast = require("./components/toast.jsx");

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
const SEARCH_PARAMS = new URLSearchParams(location.search);
const INITIAL_BASE_URL = SEARCH_PARAMS.get('baseReport');
const INITIAL_COMPARE_URL = SEARCH_PARAMS.get('compareReport');
/**
 * @typedef {{filename: string, data: string, lhr: LH.Result}} ReportData
 */

/**
 * @typedef {{message: string, level?: 'error' | 'info'}} ToastMessage
 */

/**
 * @param {string} url
 * @param {(r: ReportData) => void} setReport
 */

async function loadReportFromURL(url, setReport) {
  const filename = new URL(url).pathname.split('/').slice(-1)[0] || 'Unknown';
  const response = await fetch(url);
  const data = await response.text();
  const lhr = (0, _reportUploadBox.parseStringAsLhr)(data);
  if (lhr instanceof Error) throw lhr;
  setReport({
    filename,
    data,
    lhr
  });
}
/**
 * @param {(r: ReportData) => void} setBaseReport
 * @param {(r: ReportData) => void} setCompareReport
 * @param {(b: boolean) => void} setIsLoading
 * @param {(t: ToastMessage) => void} addToast
 */


async function loadInitialReports(setBaseReport, setCompareReport, setIsLoading, addToast) {
  const promises = [INITIAL_BASE_URL && loadReportFromURL(INITIAL_BASE_URL, setBaseReport), INITIAL_COMPARE_URL && loadReportFromURL(INITIAL_COMPARE_URL, setCompareReport)].filter(
  /** @return {p is Promise<void>} */
  p => !!p);
  if (!promises.length) return;
  setIsLoading(true);
  await Promise.all(promises.map(p => p.catch(err => {
    console.error(err); // eslint-disable-line no-console

    addToast({
      message: `Failed loading report from URL: ${err.message}`,
      level: 'error'
    });
  })));
  setIsLoading(false);
}

const App = () => {
  const initialReport =
  /** @type {ReportData|undefined} */
  undefined;
  const [isLoading, setIsLoading] = (0, _hooks.useState)(false);
  const [baseReport, setBaseReport] = (0, _hooks.useState)(initialReport);
  const [compareReport, setCompareReport] = (0, _hooks.useState)(initialReport);
  const [toasts, setToasts] = (0, _hooks.useState)(
  /** @type {Array<ToastMessage>} */
  []);
  /** @param {ToastMessage} toast */

  const addToastUnmemoized = toast => setToasts(toasts => [...toasts, toast]);

  const addToast = (0, _hooks.useCallback)(addToastUnmemoized, [setToasts]);
  (0, _hooks.useEffect)(() => {
    loadInitialReports(setBaseReport, setCompareReport, setIsLoading, addToast);
  }, []);
  return (0, _preact.h)("div", {
    className: "lhci-viewer"
  }, isLoading ? (0, _preact.h)("div", {
    className: "loading-container"
  }, (0, _preact.h)(_lhciComponents.LoadingSpinner, null)) : (0, _preact.h)(_preact.Fragment, null), (0, _preact.h)("div", {
    className: "toast-container"
  }, toasts.map(toast => (0, _preact.h)(_toast.Toast, {
    key: toast.message,
    toast: toast,
    setToasts: setToasts
  }))), baseReport && compareReport ? (0, _preact.h)(_comparison.ComparisonRoute, {
    baseReport: baseReport,
    setBaseReport: setBaseReport,
    compareReport: compareReport,
    setCompareReport: setCompareReport,
    addToast: addToast
  }) : (0, _preact.h)(_landing.LandingRoute, {
    baseReport: baseReport,
    setBaseReport: setBaseReport,
    compareReport: compareReport,
    setCompareReport: setCompareReport,
    addToast: addToast
  }));
};

exports.App = App;
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","preact/hooks":"../../../../node_modules/preact/hooks/dist/hooks.module.js","../../../server/src/ui/app.css":"../../../server/src/ui/app.css","./app.css":"app.css","./routes/landing/landing.jsx":"routes/landing/landing.jsx","./routes/comparison/comparison.jsx":"routes/comparison/comparison.jsx","./components/lhci-components.jsx":"components/lhci-components.jsx","./components/report-upload-box.jsx":"components/report-upload-box.jsx","./components/toast.jsx":"components/toast.jsx"}],"entry.jsx":[function(require,module,exports) {
"use strict";

var _preact = require("preact");

var _app = require("./app.jsx");

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
(0, _preact.render)((0, _preact.h)(_app.App, null), document.body);
},{"preact":"../../../../node_modules/preact/dist/preact.module.js","./app.jsx":"app.jsx"}],"../../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "49870" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../../../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","entry.jsx"], null)
//# sourceMappingURL=/entry.fea2c6dd.js.map