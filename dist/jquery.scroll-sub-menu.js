(function ($, window, document, undefined) {
  'use strict';

  // Default settings.

  var defaults = {
    menuTarget: null,
    lineActive: 'middle',
    deltaSectionEnd: 'middle',
    subSelector: 'sub-menu-section',
    defaultAnimWhileClass: 'radar',
    defaultAnimWhileDelay: 100,
    defaultAnimWhileEnd: 1000,
    activeClass: 'sub-active',
    pillsActiveClass: 'pills-active',
    wrapperAttrs: { class: 'sub-menu' },
    elementAttrs: { class: 'sm-elmt' },
    pillsAttrs: { class: 'sm-pills cn' },
    navPillsAttrs: { class: 'nav-pills' },
    wrapperCSS: {},
    elementCSS: {},
    pillsCSS: {},
    navPillsCSS: {},
    animExitFn: null,
    animEnterFn: null,
    animWhileFn: null,
    clickHandlerFn: null,
    elementCreateCallback: null,
    scrollStepCallback: null
  };

  // Errors messages.
  var errors = {
    selector: { basic: 'Argument must be element ID string or jQuery object.' },
    noResult: { basic: 'Wrong ID, no jQuery object match.' },
    settings: {
      basic: 'Unrecognized settings expression or wrong value.',
      defaultAnimWhileDelay: 'defaultAnimWhileDelay must be type Number.',
      defaultAnimWhileEnd: 'defaultAnimWhileEnd must be type Number.',
      menuTarget: 'menuTarget must be type String matching element ID or jQuery Object.',
      lineActive: 'lineActive must be type Number or String value top|middle|bottom.',
      deltaSectionEnd: 'deltaSectionEnd must be type Number or String value top|middle|bottom.',
      subSelector: 'subSelector must be type String.'
    },
    method: {
      basic: 'Unrecognized method expression.',
      noInstance: 'SubMenu must be instancied before calling methods. Method wont be called.'
    }
  };

  // Privates functions. Using as default functions if no match or error in settings options.
  var privates = {
    animExitFn: defaultAnimExit,
    animEnterFn: defaultAnimEnter,
    animWhileFn: defaultAnimWhileCallback,
    clickHandlerFn: defaultClickHandler
  };

  // We defines public methods here.
  var methods = {

    /**
     * Enter jQuery method creating new SubMenu instance, storing in jQuey element data, or updating settings.
     *
     * @param {object} options - settings
     * @param {function} callback
     * @returns {object} - jQuery object, for chaining methods.
       */
    init: function (options, callback) {
      return this.each(function () {

        var $this = $(this),
            data = $this.data('subMenuPlugin'),
            obj,
            settings = $.extend({}, defaults, options);

        // If no plugin spacename on data element.
        if (!data) {
          // Creating new SubMenu object instance, and store it on data element.
          obj = new SubMenu(settings);
          // Store instance in data.
          $this.data('subMenuPlugin', {
            subMenuInstance: obj
          });
          // Initializing SubMenu in async loop.
          initialiseSubMenu.call(obj, $this, callback);
        }
        // If plugin spacename exist on data element.
        else {
            // If no SubMenu object instance alreary exist, we create it.
            if (!data.subMenuInstance) {
              // Instancying.
              obj = new SubMenu(settings);
              // Mergin data plugin spacename.
              $this.data('subMenuPlugin', $.extend({}, data, { subMenuInstance: obj }));
              // Initializing SubMenu in async loop.
              initialiseSubMenu.call(obj, $this, callback);
            }
            // If SubMenu object already instancied for this element.
            else {
                // Updating settings.
                $.extend($this.data('subMenuPlugin').subMenuInstance.settings, options);
                // Calling callback.
                if (typeof callback === 'function') {
                  callback.call($this, $this.data('subMenuPlugin').subMenuInstance);
                }
              }
          }
      });
    },
    /**
     * Getter of SubMenu instance of the jQuery element we are working on.
     *
     * @param options
     * @param callback
     * @returns {object|*} - return menu property of SubMenu instance.
       */
    getMenuItems: function (options, callback) {

      var $this = $(this),
          data = $this.data('subMenuPlugin');

      if (!data || !data.subMenuInstance) {
        error('method', 'noInstance', 'getMenuItems');
        methods.init.call($this, options, callback);
        return;
      }

      return data.subMenuInstance.getMenuItems();
    }
  };

  /**
   * Enter function, extending jQuery methods.
   * create and initialize new SubMenu instance by calling init method,
   * or refresh settings,
   * or call other methods
   *
   * @param {string} method - method call in 'method' var.
   * @param {object} options - settings values as in 'defaults'.
   * @param {function} callback - function called at the end, when menu is created, injected in the DOM and initialized.
   * @returns {object} return jQuery object, or anonym object when getMenuItems is called.
     */
  $.fn.subMenu = function (method, options, callback) {

    // If user gives a method, a callback, but no options.
    if (typeof options === "function") {
      callback = options;
      options = null;
    }
    // If user only give callback.
    if (typeof method === "function") {
      callback = method;
      options = null;
      method = null;
      // If user gives no method, but options.
    } else if (typeof method === "object") {
      options = method;
      method = null;
    }

    // Methods are called, according to params.
    // If method exist, it's called.
    if (methods[method]) {
      return methods[method].call(this, options, callback);
    }
    // If no method, init is called.
    else if (!method && (typeof options === 'object' || !options)) {
        return methods.init.call(this, options, callback);
      }
      // If method does not exist, error is called.
      else {
          error('method', method);
        }
  };

  /**
   * SubMenu constructor.
   *
   * @param {object} settings - defaults modified by options.
   * @constructor
     */
  function SubMenu(settings) {
    this.settings = settings;
    this.active = false;
    this.range = {};
    this.state = {
      active: null,
      next: null,
      baby: true
    };
  }

  /**
   * SubMenu Method.
   * Getter menu property.
   *
   * @type {{getMenuItems: SubMenu.getMenuItems}}
     */
  SubMenu.prototype = {
    getMenuItems: function () {
      return this.menu;
    }
  };

  /**
   * Create, inject in DOM and initialize subMenu.
   * Asynchrone operations.
   *
   * @param {object} obj - jQuery object.
   * @param {function} callback
     */
  function initialiseSubMenu(obj, callback) {

    // Saving this to use it in async loop.
    var self = this;

    // Here, asynchron actions starts.
    setTimeout(function () {

      // Save section's pixels range.
      setSectionRange.call(self, obj);
      // Create and inject subMenu in the DOM.
      // Apply click handler on each menu entry.
      createMenuElement.call(self, obj);
      // Apply window's handler, scroll and resize.
      applyHandler.call(self, obj);
      // Finaly call scrollhandler to initialize menu state.
      scrollHandler.call(self);
      // SubMenu has grown !
      this.state.baby = false;
      // Finaly call callback function.
      if (typeof callback === 'function') {
        return callback.call(obj, self);
      }
    }, 0);
  }

  /**
   * Create and return new Error.
   * Search error message in 'errors' var according to params.
   *
   * @param {string} type - first deep 'errors' object property.
   * @param {string} subType - second deep 'errors' object property.
   * @param {string} value - Custom message.
   * @returns {Error}
     */
  function error(type, subType, value) {

    var message = '',
        e;

    // If no entry on 'errors' object, type is considered as free message.
    if (!errors[type]) {
      message = type;
    }
    // If no second deep.
    else if (!errors[type][subType]) {
        if (subType) {
          message += '\n' + 'Value "' + subType + '"';
        }
        message += '\n' + errors[type].basic;
      }
      // If second deep.
      else {
          if (value) {
            message += '\n' + 'Value "' + value + '"';
          }
          message += '\n' + errors[type].basic;
          message += '\n' + errors[type][subType];
        }
    // Create and return new Error.
    e = new Error(message);
    console.log(e);
    return e;
  }

  /**
   * Return jQuery object
   * or null if input does not match.
   *
   * @param {object|string} input - jQuery object or string matching ID element in DOM.
   * @returns {object} - return jQuery object or null.
     */
  function giveMeJq(input) {

    var result = null,
        type = typeof input;

    switch (type) {
      case 'string':
        input = input.replace('#', '');
        result = $('#' + input);
        break;
      case 'object':
        if (input instanceof jQuery) {
          result = input;
        } else {
          error('selector');
        }
        break;
      default:
        error('selector');
    }

    if (result.length === 0) {
      error('noResult');
    }
    return result;
  }

  /**
   * Set minimal and maximal value according to the target position in the 'document'.
   * Target is the jQuery object for which subMenu is creating.
   * Determine those values according to settings too.
   * Those values are using to determinate when we call show/hide functions according to scroll position.
   *
   * @param {object} target - jQuery object we are working on.
     */
  function setSectionRange(target) {
    var start = target.offset().top,
        h = target.outerHeight(),
        wh = $(window).height(),
        delta = 0,
        deltaSection = 0;

    // Checking lineActive setting.
    if (typeof this.settings.lineActive === 'string') {
      switch (this.settings.lineActive) {
        case 'top':
          delta = 0;
          break;
        case 'bottom':
          delta = wh;
          break;
        case 'middle':
          delta = wh / 2;
          break;
        default:
          error('settings', 'lineActive', this.settings.lineActive);
          delta = wh / 2;
          break;
      }
      this.settings.delta = delta;
    } else {
      if (typeof this.settings.lineActive === 'number') {
        this.settings.delta = delta = this.settings.lineActive;
      } else {
        error('settings', 'lineActive', this.settings.lineActive);
      }
    }

    // Checking deltaSectionEnd setting.
    if (typeof this.settings.deltaSectionEnd === 'string') {
      switch (this.settings.deltaSectionEnd) {
        case 'top':
          deltaSection = 0;
          break;
        case 'bottom':
          deltaSection = wh;
          break;
        case 'middle':
          deltaSection = wh / 2;
          break;
        default:
          error('settings', 'deltaSectionEnd', this.settings.deltaSectionEnd);
          deltaSection = wh / 2;
          break;
      }
      this.settings.deltaSection = deltaSection;
    } else {
      if (typeof this.settings.deltaSectionEnd === 'number') {
        this.settings.deltaSection = deltaSection = this.settings.deltaSectionEnd;
      } else {
        error('settings', 'deltaSectionEnd', this.settings.deltaSectionEnd);
      }
    }

    // Store values on instance SubMenu.range property.
    this.range.min = start;
    this.range.max = start + h - deltaSection;
  }

  /**
   * Create subMenu element,
   * Inject subMenu on DOM,
   * Apply click handler,
   * Store Elements on SubMenu instance properties.
   *
   * @param {object} target - jQuery object we are working on.
     */
  function createMenuElement(target) {

    var nav = [],
        menuItems = [],
        menuPills = [],
        title,
        item,
        pos,
        self = this;

    // Creating subMenu container.
    var $subSections = target.find('.' + this.settings.subSelector),
        div = $('<div/>').addClass(this.settings.wrapperAttrs.class).css(this.settings.wrapperCSS),
        ul = $('<ul/>').appendTo(div),
        navPills = $('<span/>').addClass(this.settings.navPillsAttrs.class).css(this.settings.navPillsCSS).appendTo(div);

    // DOM element into which subMenu will be injected. Default is jQuery object we are working on.
    var menuTarget = this.settings.menuTarget ? giveMeJq(this.settings.menuTarget) : target;

    // Creating subMenu entries for each sub-menu section.
    $subSections.each(function () {

      var $this = $(this);

      // Searching sub menu section title.
      title = $this.data('sub-menu-title');
      // Creation sub menu entries elements.
      item = htmlElementConstructor.call(self, title);
      ul.append(item.li);
      // Calculate and store sub menu elements positions, and corresponding sub-sections positions.
      pos = elementPosition.call(self, $this, item.span, item.pills);
      // Applying click handler on sub menu elements.
      item.span.click(handlerSelector.bind(self, 'clickHandlerFn', pos));
      // Store elements on arrays.
      nav.push(pos);
      menuItems.push(item.span);
      menuPills.push(item.pills);
      // Call entry element callback, if define in settings.
      if (typeof self.settings.elementCreateCallback === 'function') {
        self.settings.elementCreateCallback.call(item.li, $this, self);
      }
    });

    // Inject subMenu in the DOM.
    menuTarget.append(div);

    // Store elements and values on SubMenu instance properties.
    this.navigation = nav;
    this.menu = {
      wrapper: div,
      menuItems: menuItems,
      menuPills: menuPills,
      navPills: {
        navPills: navPills,
        height: navPills.outerHeight()
      }
    };

    // Calculate and store menu elements positions, using in moving pills animation.
    setPillsPosition.call(this);

    /* By default, hide subMenu.
     At the and of the initialization, when scroll handler is called,
     this hidden state can be switched according to scroll position. */
    this.menu.wrapper.css({ display: 'none' });
  }

  /**
   * Scrolling handler.
   * Call show / hide functions for subMenu apparitions.
   * Determinate which sub section is active according to scrollbar position.
   * Call 'while' actions when sub section is activation. By default, this action is moving pills.
   *
   */
  function scrollHandler() {
    var y = getScrollY(),
        l = this.navigation.length,
        i;

    // If no into section, subMenu we call animExit func, and return.
    if (y < this.range.min || y > this.range.max) {
      if (this.active) {
        this.active = false;
        handlerSelector.call(this, 'animExitFn');
      }
      return;
    }
    // If into section we call animEnter.
    else {
        if (!this.active || this.state.baby) {
          this.active = true;
          handlerSelector.call(this, 'animEnterFn');
        }
      }

    // For each sub section, determinate if we are into.
    for (i = 0; i < l; i++) {

      // If into the sub section.
      if (isInRange(this.navigation[i], y, this.settings.delta)) {
        // And if we just come into.
        if (i !== this.state.active) {
          // Applying active Class.
          this.navigation[i].menuElmt.menuElmt.addClass(this.settings.activeClass);
          // Settings sub section index.
          this.state.active = i;
          // Calling while function.
          handlerSelector.call(this, 'animWhileFn', i);
        }
      }

      // If no into the sub section.
      else {
          // Removing active class.
          this.navigation[i].menuElmt.menuElmt.removeClass(this.settings.activeClass);
          // But if sub section index match to active, we turn off.
          if (i === this.state.active) {
            this.state.active = null;
          }
        }
    }

    // Calling step by step scroll callback, if define in settings.
    if (typeof this.settings.scrollStepCallback === 'function') {
      this.settings.scrollStepCallback.call(this, i);
    }
  }

  /**
   * Resize Handler.
   * Reset and calculate all new positions values.
   *
   * @param {object} obj - jQuery object we are working on.
     */
  function onResize(obj) {
    var l = this.navigation.length,
        i,
        item;
    for (i = 0; i < l; i++) {
      item = elementPosition.call(this, this.navigation[i].elmt);
      this.navigation[i].start = item.start;
      this.navigation[i].end = item.end;
    }
    setSectionRange.call(this, obj);
  }

  /**
   * Return sub menu entry element, as jQuery objects.
   *
   * @param {string} title - sub menu entry title.
   * @returns {{li:object, span:object, pills:object}} - jQuery objects.
     */
  function htmlElementConstructor(title) {
    var li = $('<li/>');
    var span = $('<span/>').addClass(this.settings.elementAttrs.class).css(this.settings.elementCSS).text(title).appendTo(li);
    var pills = $('<span/>').addClass(this.settings.pillsAttrs.class).css(this.settings.pillsCSS).appendTo(span);
    return {
      li: li,
      span: span,
      pills: pills
    };
  }

  /**
   * Calculate and set positions of a subMenu entry, and corresponding sub-section.
   *
   * @param {object} elmt - jQuery object matching the sub-section element.
   * @param {object} menuElmt - jQuery object subMenu entry targeting sub-section element.
   * @param {object} pills - jQuery object, decorating pills.
   * @returns {{menuElmt: {menuElmt: (*|null), pills: (*|null), top: *, height: *}, elmt: *, start: (Window|*), end: *}}
     */
  function elementPosition(elmt, menuElmt, pills) {
    var start,
        end,
        h,
        me = menuElmt || null,
        pi = pills || null,
        top = null,
        height = null;

    start = elmt.offset().top;
    h = elmt.outerHeight(true);
    end = start + h;

    // Si l'element depasse du cadre de section pre-defini, on prend le max-range de l'element avec son delta.
    this.range.max = this.range.max < end - this.settings.delta ? end - this.settings.delta : this.range.max;

    if (me) {
      top = me.position().top;
      height = me.outerHeight(true);
    }

    return {
      menuElmt: {
        menuElmt: me,
        pills: pi,
        top: top,
        height: height
      },
      elmt: elmt,
      start: start,
      end: end
    };
  }

  /**
   * Calculate and set positions of a subMenu entry, for moving pills animations.
   *
   */
  function setPillsPosition() {
    var l = this.navigation.length,
        i,
        item;
    for (i = 0; i < l; i++) {
      item = this.navigation[i].menuElmt;
      item.top = item.menuElmt.position().top;
      item.height = item.menuElmt.outerHeight(true);
    }
  }

  /**
   * Call the right anim method or handler.
   * Test if custom functions set by user are right.
   * If wrong, call defaults methods or anims.
   *
   * @param {string} method - the function name. Must match to privates or settings property.
   * @param {object|number|string|array} param1
   * @param {object} param2 - Must be Event object.
     */
  function handlerSelector(method, param1, param2) {

    var p1 = param1,
        p2 = param2;

    // If param2, it's Event object and need to be passed on first.
    if (param2) {
      p1 = param2;
      p2 = param1;
    }

    if (typeof this.settings[method] === "function") {
      try {
        this.settings[method].call(this, p1, p2);
      } catch (e) {
        console.log(e);
        privates[method].call(this, p1, p2);
      }
    } else {
      privates[method].call(this, p1, p2);
    }
  }

  /**
   * Applying handlers on window.
   *
   * @param {object} obj - jQuery object we are working on.
     */
  function applyHandler(obj) {
    window.addEventListener('scroll', scrollHandler.bind(this));
    window.addEventListener('resize', onResize.bind(this, obj));
  }

  /**
   * Testing if number is in range.
   *
   * @param {object} elmt - SubMenu instance property storing target sub-section positions.
   * @param {number} value - number to test.
   * @param {number} delta
   * @returns {boolean} - true if inside, false if outside.
     */
  function isInRange(elmt, value, delta) {
    var d = delta || 0;
    return value >= elmt.start - d && value < elmt.end - d;
  }

  /**
   * Default click handler.
   *
   * @param {object} e - Event object.
   * @param {object} item - set of values returning by 'elementPosition' func.
     */
  function defaultClickHandler(e, item) {
    $(window).scrollTop(item.start);
  }

  /**
   * Default hidding anim handler.
   *
   */
  function defaultAnimExit() {
    this.menu.wrapper.fadeOut();
  }

  /**
   * Default showing anim handler.
   *
   */
  function defaultAnimEnter() {
    this.menu.wrapper.fadeIn();
  }

  /**
   * Default anim while handler.
   *
   * @param {number} n - active subMenu entry index.
     */
  function defaultAnimWhileCallback(n) {
    var pills, next, top, self, nav, delay, end;

    self = this;
    pills = this.menu.navPills;
    nav = this.navigation[n];
    next = nav.menuElmt;
    delay = self.settings.defaultAnimWhileDelay;
    end = self.settings.defaultAnimWhileEnd;

    if (typeof delay !== 'number') {
      error('settings', 'defaultAnimWhileDelay');
      delay = defaults.defaultAnimWhileDelay;
    }
    if (typeof end !== 'number') {
      error('settings', 'defaultAnimWhileEnd');
      end = defaults.defaultAnimWhileEnd;
    }

    nav.menuElmt.menuElmt.removeClass(self.settings.activeClass);

    top = next.top + Math.round(next.height / 2) - Math.round(pills.height / 2);
    pills.navPills.addClass(self.settings.pillsActiveClass).animate({ top: top }, delay, function () {
      if (nav === self.navigation[self.state.active]) {
        nav.menuElmt.menuElmt.addClass(self.settings.activeClass);
      }
      nav.menuElmt.pills.addClass(self.settings.defaultAnimWhileClass).delay(end).queue(function () {
        $(this).removeClass(self.settings.defaultAnimWhileClass).clearQueue();
      });
      pills.navPills.removeClass(self.settings.pillsActiveClass);
    });
  }

  /**
   * Polyfill for window.scrollY.
   * @returns {*}
   */
  function getScrollY() {
    var supportPageOffset = window.pageXOffset !== undefined,
        isCSS1Compat = (document.compatMode || "") === "CSS1Compat";
    return supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
  }
})(jQuery, this, this.document);
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUuanMiXSwibmFtZXMiOlsiJCIsIndpbmRvdyIsImRvY3VtZW50IiwidW5kZWZpbmVkIiwiZGVmYXVsdHMiLCJtZW51VGFyZ2V0IiwibGluZUFjdGl2ZSIsImRlbHRhU2VjdGlvbkVuZCIsInN1YlNlbGVjdG9yIiwiZGVmYXVsdEFuaW1XaGlsZUNsYXNzIiwiZGVmYXVsdEFuaW1XaGlsZURlbGF5IiwiZGVmYXVsdEFuaW1XaGlsZUVuZCIsImFjdGl2ZUNsYXNzIiwicGlsbHNBY3RpdmVDbGFzcyIsIndyYXBwZXJBdHRycyIsImNsYXNzIiwiZWxlbWVudEF0dHJzIiwicGlsbHNBdHRycyIsIm5hdlBpbGxzQXR0cnMiLCJ3cmFwcGVyQ1NTIiwiZWxlbWVudENTUyIsInBpbGxzQ1NTIiwibmF2UGlsbHNDU1MiLCJhbmltRXhpdEZuIiwiYW5pbUVudGVyRm4iLCJhbmltV2hpbGVGbiIsImNsaWNrSGFuZGxlckZuIiwiZWxlbWVudENyZWF0ZUNhbGxiYWNrIiwic2Nyb2xsU3RlcENhbGxiYWNrIiwiZXJyb3JzIiwic2VsZWN0b3IiLCJiYXNpYyIsIm5vUmVzdWx0Iiwic2V0dGluZ3MiLCJtZXRob2QiLCJub0luc3RhbmNlIiwicHJpdmF0ZXMiLCJkZWZhdWx0QW5pbUV4aXQiLCJkZWZhdWx0QW5pbUVudGVyIiwiZGVmYXVsdEFuaW1XaGlsZUNhbGxiYWNrIiwiZGVmYXVsdENsaWNrSGFuZGxlciIsIm1ldGhvZHMiLCJpbml0Iiwib3B0aW9ucyIsImNhbGxiYWNrIiwiZWFjaCIsIiR0aGlzIiwiZGF0YSIsIm9iaiIsImV4dGVuZCIsIlN1Yk1lbnUiLCJzdWJNZW51SW5zdGFuY2UiLCJpbml0aWFsaXNlU3ViTWVudSIsImNhbGwiLCJnZXRNZW51SXRlbXMiLCJlcnJvciIsImZuIiwic3ViTWVudSIsImFjdGl2ZSIsInJhbmdlIiwic3RhdGUiLCJuZXh0IiwiYmFieSIsInByb3RvdHlwZSIsIm1lbnUiLCJzZWxmIiwic2V0VGltZW91dCIsInNldFNlY3Rpb25SYW5nZSIsImNyZWF0ZU1lbnVFbGVtZW50IiwiYXBwbHlIYW5kbGVyIiwic2Nyb2xsSGFuZGxlciIsInR5cGUiLCJzdWJUeXBlIiwidmFsdWUiLCJtZXNzYWdlIiwiZSIsIkVycm9yIiwiY29uc29sZSIsImxvZyIsImdpdmVNZUpxIiwiaW5wdXQiLCJyZXN1bHQiLCJyZXBsYWNlIiwialF1ZXJ5IiwibGVuZ3RoIiwidGFyZ2V0Iiwic3RhcnQiLCJvZmZzZXQiLCJ0b3AiLCJoIiwib3V0ZXJIZWlnaHQiLCJ3aCIsImhlaWdodCIsImRlbHRhIiwiZGVsdGFTZWN0aW9uIiwibWluIiwibWF4IiwibmF2IiwibWVudUl0ZW1zIiwibWVudVBpbGxzIiwidGl0bGUiLCJpdGVtIiwicG9zIiwiJHN1YlNlY3Rpb25zIiwiZmluZCIsImRpdiIsImFkZENsYXNzIiwiY3NzIiwidWwiLCJhcHBlbmRUbyIsIm5hdlBpbGxzIiwiaHRtbEVsZW1lbnRDb25zdHJ1Y3RvciIsImFwcGVuZCIsImxpIiwiZWxlbWVudFBvc2l0aW9uIiwic3BhbiIsInBpbGxzIiwiY2xpY2siLCJoYW5kbGVyU2VsZWN0b3IiLCJiaW5kIiwicHVzaCIsIm5hdmlnYXRpb24iLCJ3cmFwcGVyIiwic2V0UGlsbHNQb3NpdGlvbiIsImRpc3BsYXkiLCJ5IiwiZ2V0U2Nyb2xsWSIsImwiLCJpIiwiaXNJblJhbmdlIiwibWVudUVsbXQiLCJyZW1vdmVDbGFzcyIsIm9uUmVzaXplIiwiZWxtdCIsImVuZCIsInRleHQiLCJtZSIsInBpIiwicG9zaXRpb24iLCJwYXJhbTEiLCJwYXJhbTIiLCJwMSIsInAyIiwiYWRkRXZlbnRMaXN0ZW5lciIsImQiLCJzY3JvbGxUb3AiLCJmYWRlT3V0IiwiZmFkZUluIiwibiIsImRlbGF5IiwiTWF0aCIsInJvdW5kIiwiYW5pbWF0ZSIsInF1ZXVlIiwiY2xlYXJRdWV1ZSIsInN1cHBvcnRQYWdlT2Zmc2V0IiwicGFnZVhPZmZzZXQiLCJpc0NTUzFDb21wYXQiLCJjb21wYXRNb2RlIiwicGFnZVlPZmZzZXQiLCJkb2N1bWVu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QixFQUF4QixNQUFnQyxZQURwRDtBQUVBLFdBQU9ILG9CQUFvQjFKLE9BQU84SixXQUEzQixHQUF5Q0YsZUFBZTNKLFNBQVM4SixlQUFULENBQXlCZixTQUF4QyxHQUFvRC9JLFNBQVMrSixJQUFULENBQWNoQixTQUFsSDtBQUNEO0FBR0YsQ0F6dUJELEVBeXVCRzlELE1BenVCSCxFQXl1QlcsSUF6dUJYLEVBeXVCaUIsS0FBS2pGLFFBenVCdEIiLCJmaWxlIjoianF1ZXJ5LnNjcm9sbC1zdWItbWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoJCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyBEZWZhdWx0IHNldHRpbmdzLlxyXG4gIHZhciBkZWZhdWx0cyA9IHtcclxuICAgIG1lbnVUYXJnZXQgOiBudWxsLFxyXG4gICAgbGluZUFjdGl2ZSA6ICdtaWRkbGUnLFxyXG4gICAgZGVsdGFTZWN0aW9uRW5kOiAnbWlkZGxlJyxcclxuICAgIHN1YlNlbGVjdG9yOiAnc3ViLW1lbnUtc2VjdGlvbicsXHJcbiAgICBkZWZhdWx0QW5pbVdoaWxlQ2xhc3M6ICdyYWRhcicsXHJcbiAgICBkZWZhdWx0QW5pbVdoaWxlRGVsYXk6IDEwMCxcclxuICAgIGRlZmF1bHRBbmltV2hpbGVFbmQ6IDEwMDAsXHJcbiAgICBhY3RpdmVDbGFzczogJ3N1Yi1hY3RpdmUnLFxyXG4gICAgcGlsbHNBY3RpdmVDbGFzczogJ3BpbGxzLWFjdGl2ZScsXHJcbiAgICB3cmFwcGVyQXR0cnM6IHtjbGFzczogJ3N1Yi1tZW51J30sXHJcbiAgICBlbGVtZW50QXR0cnM6IHtjbGFzczogJ3NtLWVsbXQnfSxcclxuICAgIHBpbGxzQXR0cnM6IHtjbGFzczogJ3NtLXBpbGxzIGNuJ30sXHJcbiAgICBuYXZQaWxsc0F0dHJzOiB7Y2xhc3M6ICduYXYtcGlsbHMnfSxcclxuICAgIHdyYXBwZXJDU1M6IHt9LFxyXG4gICAgZWxlbWVudENTUzoge30sXHJcbiAgICBwaWxsc0NTUzoge30sXHJcbiAgICBuYXZQaWxsc0NTUzoge30sXHJcbiAgICBhbmltRXhpdEZuOiBudWxsLFxyXG4gICAgYW5pbUVudGVyRm46IG51bGwsXHJcbiAgICBhbmltV2hpbGVGbjogbnVsbCxcclxuICAgIGNsaWNrSGFuZGxlckZuOiBudWxsLFxyXG4gICAgZWxlbWVudENyZWF0ZUNhbGxiYWNrOiBudWxsLFxyXG4gICAgc2Nyb2xsU3RlcENhbGxiYWNrOiBudWxsXHJcbiAgfTtcclxuXHJcbiAgLy8gRXJyb3JzIG1lc3NhZ2VzLlxyXG4gIHZhciBlcnJvcnMgPSB7XHJcbiAgICBzZWxlY3Rvcjoge2Jhc2ljOidBcmd1bWVudCBtdXN0IGJlIGVsZW1lbnQgSUQgc3RyaW5nIG9yIGpRdWVyeSBvYmplY3QuJ30sXHJcbiAgICBub1Jlc3VsdDoge2Jhc2ljOidXcm9uZyBJRCwgbm8galF1ZXJ5IG9iamVjdCBtYXRjaC4nfSxcclxuICAgIHNldHRpbmdzOiB7XHJcbiAgICAgIGJhc2ljOidVbnJlY29nbml6ZWQgc2V0dGluZ3MgZXhwcmVzc2lvbiBvciB3cm9uZyB2YWx1ZS4nLFxyXG4gICAgICBkZWZhdWx0QW5pbVdoaWxlRGVsYXk6ICdkZWZhdWx0QW5pbVdoaWxlRGVsYXkgbXVzdCBiZSB0eXBlIE51bWJlci4nLFxyXG4gICAgICBkZWZhdWx0QW5pbVdoaWxlRW5kOiAnZGVmYXVsdEFuaW1XaGlsZUVuZCBtdXN0IGJlIHR5cGUgTnVtYmVyLicsXHJcbiAgICAgIG1lbnVUYXJnZXQgOiAnbWVudVRhcmdldCBtdXN0IGJlIHR5cGUgU3RyaW5nIG1hdGNoaW5nIGVsZW1lbnQgSUQgb3IgalF1ZXJ5IE9iamVjdC4nLFxyXG4gICAgICBsaW5lQWN0aXZlIDogJ2xpbmVBY3RpdmUgbXVzdCBiZSB0eXBlIE51bWJlciBvciBTdHJpbmcgdmFsdWUgdG9wfG1pZGRsZXxib3R0b20uJyxcclxuICAgICAgZGVsdGFTZWN0aW9uRW5kOiAnZGVsdGFTZWN0aW9uRW5kIG11c3QgYmUgdHlwZSBOdW1iZXIgb3IgU3RyaW5nIHZhbHVlIHRvcHxtaWRkbGV8Ym90dG9tLicsXHJcbiAgICAgIHN1YlNlbGVjdG9yOiAnc3ViU2VsZWN0b3IgbXVzdCBiZSB0eXBlIFN0cmluZy4nXHJcbiAgICB9LFxyXG4gICAgbWV0aG9kOiB7XHJcbiAgICAgIGJhc2ljOidVbnJlY29nbml6ZWQgbWV0aG9kIGV4cHJlc3Npb24uJyxcclxuICAgICAgbm9JbnN0YW5jZTogJ1N1Yk1lbnUgbXVzdCBiZSBpbnN0YW5jaWVkIGJlZm9yZSBjYWxsaW5nIG1ldGhvZHMuIE1ldGhvZCB3b250IGJlIGNhbGxlZC4nXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLy8gUHJpdmF0ZXMgZnVuY3Rpb25zLiBVc2luZyBhcyBkZWZhdWx0IGZ1bmN0aW9ucyBpZiBubyBtYXRjaCBvciBlcnJvciBpbiBzZXR0aW5ncyBvcHRpb25zLlxyXG4gIHZhciBwcml2YXRlcyA9IHtcclxuICAgIGFuaW1FeGl0Rm46IGRlZmF1bHRBbmltRXhpdCxcclxuICAgIGFuaW1FbnRlckZuOiBkZWZhdWx0QW5pbUVudGVyLFxyXG4gICAgYW5pbVdoaWxlRm46IGRlZmF1bHRBbmltV2hpbGVDYWxsYmFjayxcclxuICAgIGNsaWNrSGFuZGxlckZuOiBkZWZhdWx0Q2xpY2tIYW5kbGVyXHJcbiAgfTtcclxuXHJcbiAgLy8gV2UgZGVmaW5lcyBwdWJsaWMgbWV0aG9kcyBoZXJlLlxyXG4gIHZhciBtZXRob2RzID0ge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW50ZXIgalF1ZXJ5IG1ldGhvZCBjcmVhdGluZyBuZXcgU3ViTWVudSBpbnN0YW5jZSwgc3RvcmluZyBpbiBqUXVleSBlbGVtZW50IGRhdGEsIG9yIHVwZGF0aW5nIHNldHRpbmdzLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC0gc2V0dGluZ3NcclxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSAtIGpRdWVyeSBvYmplY3QsIGZvciBjaGFpbmluZyBtZXRob2RzLlxyXG4gICAgICAgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uICggb3B0aW9ucywgY2FsbGJhY2sgKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGRhdGEgPSAkdGhpcy5kYXRhKCdzdWJNZW51UGx1Z2luJyksXHJcbiAgICAgICAgICAgIG9iaiwgc2V0dGluZ3MgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG5cclxuICAgICAgICAvLyBJZiBubyBwbHVnaW4gc3BhY2VuYW1lIG9uIGRhdGEgZWxlbWVudC5cclxuICAgICAgICBpZiAoICFkYXRhICl7XHJcbiAgICAgICAgICAvLyBDcmVhdGluZyBuZXcgU3ViTWVudSBvYmplY3QgaW5zdGFuY2UsIGFuZCBzdG9yZSBpdCBvbiBkYXRhIGVsZW1lbnQuXHJcbiAgICAgICAgICBvYmogPSBuZXcgU3ViTWVudSggc2V0dGluZ3MgKTtcclxuICAgICAgICAgIC8vIFN0b3JlIGluc3RhbmNlIGluIGRhdGEuXHJcbiAgICAgICAgICAkdGhpcy5kYXRhKCdzdWJNZW51UGx1Z2luJywge1xyXG4gICAgICAgICAgICBzdWJNZW51SW5zdGFuY2U6IG9ialxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICAvLyBJbml0aWFsaXppbmcgU3ViTWVudSBpbiBhc3luYyBsb29wLlxyXG4gICAgICAgICAgaW5pdGlhbGlzZVN1Yk1lbnUuY2FsbChvYmosICR0aGlzLCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIElmIHBsdWdpbiBzcGFjZW5hbWUgZXhpc3Qgb24gZGF0YSBlbGVtZW50LlxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgLy8gSWYgbm8gU3ViTWVudSBvYmplY3QgaW5zdGFuY2UgYWxyZWFyeSBleGlzdCwgd2UgY3JlYXRlIGl0LlxyXG4gICAgICAgICAgaWYgKCAhZGF0YS5zdWJNZW51SW5zdGFuY2UgKSB7XHJcbiAgICAgICAgICAgIC8vIEluc3RhbmN5aW5nLlxyXG4gICAgICAgICAgICBvYmogPSBuZXcgU3ViTWVudSggc2V0dGluZ3MgKTtcclxuICAgICAgICAgICAgLy8gTWVyZ2luIGRhdGEgcGx1Z2luIHNwYWNlbmFtZS5cclxuICAgICAgICAgICAgJHRoaXMuZGF0YSgnc3ViTWVudVBsdWdpbicsICQuZXh0ZW5kKCB7fSwgZGF0YSwge3N1Yk1lbnVJbnN0YW5jZTogb2JqfSkpO1xyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXppbmcgU3ViTWVudSBpbiBhc3luYyBsb29wLlxyXG4gICAgICAgICAgICBpbml0aWFsaXNlU3ViTWVudS5jYWxsKG9iaiwgJHRoaXMsIGNhbGxiYWNrKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIElmIFN1Yk1lbnUgb2JqZWN0IGFscmVhZHkgaW5zdGFuY2llZCBmb3IgdGhpcyBlbGVtZW50LlxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFVwZGF0aW5nIHNldHRpbmdzLlxyXG4gICAgICAgICAgICAkLmV4dGVuZCgkdGhpcy5kYXRhKCdzdWJNZW51UGx1Z2luJykuc3ViTWVudUluc3RhbmNlLnNldHRpbmdzLCBvcHRpb25zKTtcclxuICAgICAgICAgICAgLy8gQ2FsbGluZyBjYWxsYmFjay5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwoJHRoaXMsICR0aGlzLmRhdGEoJ3N1Yk1lbnVQbHVnaW4nKS5zdWJNZW51SW5zdGFuY2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIEdldHRlciBvZiBTdWJNZW51IGluc3RhbmNlIG9mIHRoZSBqUXVlcnkgZWxlbWVudCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xyXG4gICAgICogQHBhcmFtIGNhbGxiYWNrXHJcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fCp9IC0gcmV0dXJuIG1lbnUgcHJvcGVydHkgb2YgU3ViTWVudSBpbnN0YW5jZS5cclxuICAgICAgICovXHJcbiAgICBnZXRNZW51SXRlbXM6IGZ1bmN0aW9uKCBvcHRpb25zLCBjYWxsYmFjayApIHtcclxuXHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ3N1Yk1lbnVQbHVnaW4nKTtcclxuXHJcbiAgICAgICAgaWYgKCAhZGF0YSB8fCAhZGF0YS5zdWJNZW51SW5zdGFuY2UpIHtcclxuICAgICAgICAgIGVycm9yKCAnbWV0aG9kJywgJ25vSW5zdGFuY2UnLCAnZ2V0TWVudUl0ZW1zJyApO1xyXG4gICAgICAgICAgbWV0aG9kcy5pbml0LmNhbGwoJHRoaXMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBkYXRhLnN1Yk1lbnVJbnN0YW5jZS5nZXRNZW51SXRlbXMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBFbnRlciBmdW5jdGlvbiwgZXh0ZW5kaW5nIGpRdWVyeSBtZXRob2RzLlxyXG4gICAqIGNyZWF0ZSBhbmQgaW5pdGlhbGl6ZSBuZXcgU3ViTWVudSBpbnN0YW5jZSBieSBjYWxsaW5nIGluaXQgbWV0aG9kLFxyXG4gICAqIG9yIHJlZnJlc2ggc2V0dGluZ3MsXHJcbiAgICogb3IgY2FsbCBvdGhlciBtZXRob2RzXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kIC0gbWV0aG9kIGNhbGwgaW4gJ21ldGhvZCcgdmFyLlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC0gc2V0dGluZ3MgdmFsdWVzIGFzIGluICdkZWZhdWx0cycuXHJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBmdW5jdGlvbiBjYWxsZWQgYXQgdGhlIGVuZCwgd2hlbiBtZW51IGlzIGNyZWF0ZWQsIGluamVjdGVkIGluIHRoZSBET00gYW5kIGluaXRpYWxpemVkLlxyXG4gICAqIEByZXR1cm5zIHtvYmplY3R9IHJldHVybiBqUXVlcnkgb2JqZWN0LCBvciBhbm9ueW0gb2JqZWN0IHdoZW4gZ2V0TWVudUl0ZW1zIGlzIGNhbGxlZC5cclxuICAgICAqL1xyXG4gICQuZm4uc3ViTWVudSA9IGZ1bmN0aW9uKCBtZXRob2QsIG9wdGlvbnMsIGNhbGxiYWNrICkge1xyXG5cclxuICAgIC8vIElmIHVzZXIgZ2l2ZXMgYSBtZXRob2QsIGEgY2FsbGJhY2ssIGJ1dCBubyBvcHRpb25zLlxyXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xyXG4gICAgICBvcHRpb25zID0gbnVsbDtcclxuICAgIH1cclxuICAgIC8vIElmIHVzZXIgb25seSBnaXZlIGNhbGxiYWNrLlxyXG4gICAgaWYgKHR5cGVvZiBtZXRob2QgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICBjYWxsYmFjayA9IG1ldGhvZDtcclxuICAgICAgb3B0aW9ucyA9IG51bGw7XHJcbiAgICAgIG1ldGhvZCA9IG51bGw7XHJcbiAgICAgIC8vIElmIHVzZXIgZ2l2ZXMgbm8gbWV0aG9kLCBidXQgb3B0aW9ucy5cclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIG1ldGhvZCA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICBvcHRpb25zID0gbWV0aG9kO1xyXG4gICAgICBtZXRob2QgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE1ldGhvZHMgYXJlIGNhbGxlZCwgYWNjb3JkaW5nIHRvIHBhcmFtcy5cclxuICAgIC8vIElmIG1ldGhvZCBleGlzdCwgaXQncyBjYWxsZWQuXHJcbiAgICBpZiAobWV0aG9kc1ttZXRob2RdKSB7XHJcbiAgICAgIHJldHVybiBtZXRob2RzW21ldGhvZF0uY2FsbCh0aGlzLCBvcHRpb25zLCBjYWxsYmFjayk7XHJcbiAgICB9XHJcbiAgICAvLyBJZiBubyBtZXRob2QsIGluaXQgaXMgY2FsbGVkLlxyXG4gICAgZWxzZSBpZiAoICFtZXRob2QgJiYgKHR5cGVvZiBvcHRpb25zID09PSAnb2JqZWN0JyB8fCAhIG9wdGlvbnMpICkge1xyXG4gICAgICByZXR1cm4gbWV0aG9kcy5pbml0LmNhbGwodGhpcywgb3B0aW9ucywgY2FsbGJhY2spO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgbWV0aG9kIGRvZXMgbm90IGV4aXN0LCBlcnJvciBpcyBjYWxsZWQuXHJcbiAgICBlbHNlIHtcclxuICAgICAgZXJyb3IoICdtZXRob2QnLCBtZXRob2QgKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBTdWJNZW51IGNvbnN0cnVjdG9yLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHNldHRpbmdzIC0gZGVmYXVsdHMgbW9kaWZpZWQgYnkgb3B0aW9ucy5cclxuICAgKiBAY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIFN1Yk1lbnUoIHNldHRpbmdzICkge1xyXG4gICAgdGhpcy5zZXR0aW5ncyA9IHNldHRpbmdzO1xyXG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcclxuICAgIHRoaXMucmFuZ2UgPSB7fTtcclxuICAgIHRoaXMuc3RhdGUgPSB7XHJcbiAgICAgIGFjdGl2ZTogbnVsbCxcclxuICAgICAgbmV4dDogbnVsbCxcclxuICAgICAgYmFieTogdHJ1ZVxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1Yk1lbnUgTWV0aG9kLlxyXG4gICAqIEdldHRlciBtZW51IHByb3BlcnR5LlxyXG4gICAqXHJcbiAgICogQHR5cGUge3tnZXRNZW51SXRlbXM6IFN1Yk1lbnUuZ2V0TWVudUl0ZW1zfX1cclxuICAgICAqL1xyXG4gIFN1Yk1lbnUucHJvdG90eXBlID0ge1xyXG4gICAgZ2V0TWVudUl0ZW1zOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm1lbnU7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlLCBpbmplY3QgaW4gRE9NIGFuZCBpbml0aWFsaXplIHN1Yk1lbnUuXHJcbiAgICogQXN5bmNocm9uZSBvcGVyYXRpb25zLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9iaiAtIGpRdWVyeSBvYmplY3QuXHJcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGluaXRpYWxpc2VTdWJNZW51KCBvYmosIGNhbGxiYWNrICkge1xyXG5cclxuICAgIC8vIFNhdmluZyB0aGlzIHRvIHVzZSBpdCBpbiBhc3luYyBsb29wLlxyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIC8vIEhlcmUsIGFzeW5jaHJvbiBhY3Rpb25zIHN0YXJ0cy5cclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgLy8gU2F2ZSBzZWN0aW9uJ3MgcGl4ZWxzIHJhbmdlLlxyXG4gICAgICBzZXRTZWN0aW9uUmFuZ2UuY2FsbChzZWxmLCBvYmopO1xyXG4gICAgICAvLyBDcmVhdGUgYW5kIGluamVjdCBzdWJNZW51IGluIHRoZSBET00uXHJcbiAgICAgIC8vIEFwcGx5IGNsaWNrIGhhbmRsZXIgb24gZWFjaCBtZW51IGVudHJ5LlxyXG4gICAgICBjcmVhdGVNZW51RWxlbWVudC5jYWxsKHNlbGYsIG9iaik7XHJcbiAgICAgIC8vIEFwcGx5IHdpbmRvdydzIGhhbmRsZXIsIHNjcm9sbCBhbmQgcmVzaXplLlxyXG4gICAgICBhcHBseUhhbmRsZXIuY2FsbChzZWxmLCBvYmopO1xyXG4gICAgICAvLyBGaW5hbHkgY2FsbCBzY3JvbGxoYW5kbGVyIHRvIGluaXRpYWxpemUgbWVudSBzdGF0ZS5cclxuICAgICAgc2Nyb2xsSGFuZGxlci5jYWxsKHNlbGYpO1xyXG4gICAgICAvLyBTdWJNZW51IGhhcyBncm93biAhXHJcbiAgICAgIHRoaXMuc3RhdGUuYmFieSA9IGZhbHNlO1xyXG4gICAgICAvLyBGaW5hbHkgY2FsbCBjYWxsYmFjayBmdW5jdGlvbi5cclxuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKG9iaiwgc2VsZik7XHJcbiAgICAgIH1cclxuICAgIH0sIDApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIGFuZCByZXR1cm4gbmV3IEVycm9yLlxyXG4gICAqIFNlYXJjaCBlcnJvciBtZXNzYWdlIGluICdlcnJvcnMnIHZhciBhY2NvcmRpbmcgdG8gcGFyYW1zLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgLSBmaXJzdCBkZWVwICdlcnJvcnMnIG9iamVjdCBwcm9wZXJ0eS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3ViVHlwZSAtIHNlY29uZCBkZWVwICdlcnJvcnMnIG9iamVjdCBwcm9wZXJ0eS5cclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWUgLSBDdXN0b20gbWVzc2FnZS5cclxuICAgKiBAcmV0dXJucyB7RXJyb3J9XHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBlcnJvciAoIHR5cGUsIHN1YlR5cGUsIHZhbHVlICl7XHJcblxyXG4gICAgdmFyIG1lc3NhZ2UgPSAnJywgZTtcclxuXHJcbiAgICAvLyBJZiBubyBlbnRyeSBvbiAnZXJyb3JzJyBvYmplY3QsIHR5cGUgaXMgY29uc2lkZXJlZCBhcyBmcmVlIG1lc3NhZ2UuXHJcbiAgICBpZiAoICFlcnJvcnNbdHlwZV0gKXtcclxuICAgICAgbWVzc2FnZSA9IHR5cGU7XHJcbiAgICB9XHJcbiAgICAvLyBJZiBubyBzZWNvbmQgZGVlcC5cclxuICAgIGVsc2UgaWYgKCAhZXJyb3JzW3R5cGVdW3N1YlR5cGVdICkge1xyXG4gICAgICBpZiAoIHN1YlR5cGUgKSB7XHJcbiAgICAgICAgbWVzc2FnZSArPSAnXFxuJyArICdWYWx1ZSBcIicgKyBzdWJUeXBlICsgJ1wiJztcclxuICAgICAgfVxyXG4gICAgICBtZXNzYWdlICs9ICdcXG4nICsgZXJyb3JzW3R5cGVdLmJhc2ljO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgc2Vjb25kIGRlZXAuXHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKCB2YWx1ZSApIHtcclxuICAgICAgICBtZXNzYWdlICs9ICdcXG4nICsgJ1ZhbHVlIFwiJyArIHZhbHVlICsgJ1wiJztcclxuICAgICAgfVxyXG4gICAgICBtZXNzYWdlICs9ICdcXG4nICsgZXJyb3JzW3R5cGVdLmJhc2ljO1xyXG4gICAgICBtZXNzYWdlICs9ICdcXG4nICsgZXJyb3JzW3R5cGVdW3N1YlR5cGVdO1xyXG4gICAgfVxyXG4gICAgLy8gQ3JlYXRlIGFuZCByZXR1cm4gbmV3IEVycm9yLlxyXG4gICAgZSA9IG5ldyBFcnJvcihtZXNzYWdlKTtcclxuICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgcmV0dXJuIGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4galF1ZXJ5IG9iamVjdFxyXG4gICAqIG9yIG51bGwgaWYgaW5wdXQgZG9lcyBub3QgbWF0Y2guXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdHxzdHJpbmd9IGlucHV0IC0galF1ZXJ5IG9iamVjdCBvciBzdHJpbmcgbWF0Y2hpbmcgSUQgZWxlbWVudCBpbiBET00uXHJcbiAgICogQHJldHVybnMge29iamVjdH0gLSByZXR1cm4galF1ZXJ5IG9iamVjdCBvciBudWxsLlxyXG4gICAgICovXHJcbiAgZnVuY3Rpb24gZ2l2ZU1lSnEoaW5wdXQpIHtcclxuXHJcbiAgICB2YXIgcmVzdWx0ID0gbnVsbCxcclxuICAgICAgICB0eXBlID0gdHlwZW9mIGlucHV0O1xyXG5cclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICBjYXNlICdzdHJpbmcnOlxyXG4gICAgICAgIGlucHV0ID0gaW5wdXQucmVwbGFjZSgnIycsICcnKTtcclxuICAgICAgICByZXN1bHQgPSAkKCcjJyArIGlucHV0KTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnb2JqZWN0JzpcclxuICAgICAgICAgICAgaWYgKCBpbnB1dCBpbnN0YW5jZW9mIGpRdWVyeSkge1xyXG4gICAgICAgICAgICAgIHJlc3VsdCA9IGlucHV0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgZXJyb3IoJ3NlbGVjdG9yJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgZXJyb3IoJ3NlbGVjdG9yJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDApIHtcclxuICAgICAgZXJyb3IoJ25vUmVzdWx0Jyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcblxyXG4gIC8qKlxyXG4gICAqIFNldCBtaW5pbWFsIGFuZCBtYXhpbWFsIHZhbHVlIGFjY29yZGluZyB0byB0aGUgdGFyZ2V0IHBvc2l0aW9uIGluIHRoZSAnZG9jdW1lbnQnLlxyXG4gICAqIFRhcmdldCBpcyB0aGUgalF1ZXJ5IG9iamVjdCBmb3Igd2hpY2ggc3ViTWVudSBpcyBjcmVhdGluZy5cclxuICAgKiBEZXRlcm1pbmUgdGhvc2UgdmFsdWVzIGFjY29yZGluZyB0byBzZXR0aW5ncyB0b28uXHJcbiAgICogVGhvc2UgdmFsdWVzIGFyZSB1c2luZyB0byBkZXRlcm1pbmF0ZSB3aGVuIHdlIGNhbGwgc2hvdy9oaWRlIGZ1bmN0aW9ucyBhY2NvcmRpbmcgdG8gc2Nyb2xsIHBvc2l0aW9uLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCAtIGpRdWVyeSBvYmplY3Qgd2UgYXJlIHdvcmtpbmcgb24uXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBzZXRTZWN0aW9uUmFuZ2UoIHRhcmdldCApIHtcclxuICAgIHZhciBzdGFydCA9IHRhcmdldC5vZmZzZXQoKS50b3AsXHJcbiAgICAgICAgaCA9IHRhcmdldC5vdXRlckhlaWdodCgpLFxyXG4gICAgICAgIHdoID0gJCggd2luZG93ICkuaGVpZ2h0KCksXHJcbiAgICAgICAgZGVsdGEgPSAwLFxyXG4gICAgICAgIGRlbHRhU2VjdGlvbiA9IDA7XHJcblxyXG4gICAgLy8gQ2hlY2tpbmcgbGluZUFjdGl2ZSBzZXR0aW5nLlxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNldHRpbmdzLmxpbmVBY3RpdmUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHN3aXRjaCAodGhpcy5zZXR0aW5ncy5saW5lQWN0aXZlKSB7XHJcbiAgICAgICAgY2FzZSAndG9wJzpcclxuICAgICAgICAgIGRlbHRhID0gMDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2JvdHRvbSc6XHJcbiAgICAgICAgICBkZWx0YSA9IHdoO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnbWlkZGxlJzpcclxuICAgICAgICAgIGRlbHRhID0gd2ggLyAyO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGVycm9yKCdzZXR0aW5ncycsICdsaW5lQWN0aXZlJywgdGhpcy5zZXR0aW5ncy5saW5lQWN0aXZlKTtcclxuICAgICAgICAgIGRlbHRhID0gd2ggLyAyO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zZXR0aW5ncy5kZWx0YSA9IGRlbHRhO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zZXR0aW5ncy5saW5lQWN0aXZlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MuZGVsdGEgPSBkZWx0YSA9IHRoaXMuc2V0dGluZ3MubGluZUFjdGl2ZTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBlcnJvcignc2V0dGluZ3MnLCAnbGluZUFjdGl2ZScsIHRoaXMuc2V0dGluZ3MubGluZUFjdGl2ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBDaGVja2luZyBkZWx0YVNlY3Rpb25FbmQgc2V0dGluZy5cclxuICAgIGlmICh0eXBlb2YgdGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb25FbmQgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHN3aXRjaCAodGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb25FbmQpIHtcclxuICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgZGVsdGFTZWN0aW9uID0gMDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ2JvdHRvbSc6XHJcbiAgICAgICAgICBkZWx0YVNlY3Rpb24gPSB3aDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ21pZGRsZSc6XHJcbiAgICAgICAgICBkZWx0YVNlY3Rpb24gPSB3aCAvIDI7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgZXJyb3IoJ3NldHRpbmdzJywgJ2RlbHRhU2VjdGlvbkVuZCcsIHRoaXMuc2V0dGluZ3MuZGVsdGFTZWN0aW9uRW5kKTtcclxuICAgICAgICAgIGRlbHRhU2VjdGlvbiA9IHdoIC8gMjtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMuc2V0dGluZ3MuZGVsdGFTZWN0aW9uID0gZGVsdGFTZWN0aW9uO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb25FbmQgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb24gPSBkZWx0YVNlY3Rpb24gPSB0aGlzLnNldHRpbmdzLmRlbHRhU2VjdGlvbkVuZDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBlcnJvcignc2V0dGluZ3MnLCAnZGVsdGFTZWN0aW9uRW5kJywgdGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb25FbmQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcmUgdmFsdWVzIG9uIGluc3RhbmNlIFN1Yk1lbnUucmFuZ2UgcHJvcGVydHkuXHJcbiAgICB0aGlzLnJhbmdlLm1pbiA9IHN0YXJ0O1xyXG4gICAgdGhpcy5yYW5nZS5tYXggPSAoc3RhcnQgKyBoKSAtIGRlbHRhU2VjdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZSBzdWJNZW51IGVsZW1lbnQsXHJcbiAgICogSW5qZWN0IHN1Yk1lbnUgb24gRE9NLFxyXG4gICAqIEFwcGx5IGNsaWNrIGhhbmRsZXIsXHJcbiAgICogU3RvcmUgRWxlbWVudHMgb24gU3ViTWVudSBpbnN0YW5jZSBwcm9wZXJ0aWVzLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHRhcmdldCAtIGpRdWVyeSBvYmplY3Qgd2UgYXJlIHdvcmtpbmcgb24uXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBjcmVhdGVNZW51RWxlbWVudCggdGFyZ2V0ICkge1xyXG5cclxuICAgIHZhciBuYXYgPSBbXSwgbWVudUl0ZW1zID0gW10sIG1lbnVQaWxscyA9IFtdLFxyXG4gICAgICAgIHRpdGxlLCBpdGVtLCBwb3MsXHJcbiAgICAgICAgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgc3ViTWVudSBjb250YWluZXIuXHJcbiAgICB2YXIgJHN1YlNlY3Rpb25zID0gdGFyZ2V0LmZpbmQoJy4nICsgdGhpcy5zZXR0aW5ncy5zdWJTZWxlY3RvciksXHJcbiAgICAgICAgZGl2ID0gJCgnPGRpdi8+JylcclxuICAgICAgICAgICAgLmFkZENsYXNzKHRoaXMuc2V0dGluZ3Mud3JhcHBlckF0dHJzLmNsYXNzKVxyXG4gICAgICAgICAgICAuY3NzKHRoaXMuc2V0dGluZ3Mud3JhcHBlckNTUyksXHJcbiAgICAgICAgdWwgPSAkKCc8dWwvPicpLmFwcGVuZFRvKGRpdiksXHJcbiAgICAgICAgbmF2UGlsbHMgPSAkKCc8c3Bhbi8+JylcclxuICAgICAgICAgICAgLmFkZENsYXNzKHRoaXMuc2V0dGluZ3MubmF2UGlsbHNBdHRycy5jbGFzcylcclxuICAgICAgICAgICAgLmNzcyh0aGlzLnNldHRpbmdzLm5hdlBpbGxzQ1NTKVxyXG4gICAgICAgICAgICAuYXBwZW5kVG8oZGl2KTtcclxuXHJcbiAgICAvLyBET00gZWxlbWVudCBpbnRvIHdoaWNoIHN1Yk1lbnUgd2lsbCBiZSBpbmplY3RlZC4gRGVmYXVsdCBpcyBqUXVlcnkgb2JqZWN0IHdlIGFyZSB3b3JraW5nIG9uLlxyXG4gICAgdmFyIG1lbnVUYXJnZXQgPSAoIHRoaXMuc2V0dGluZ3MubWVudVRhcmdldCApID8gZ2l2ZU1lSnEoIHRoaXMuc2V0dGluZ3MubWVudVRhcmdldCApIDogdGFyZ2V0O1xyXG5cclxuICAgIC8vIENyZWF0aW5nIHN1Yk1lbnUgZW50cmllcyBmb3IgZWFjaCBzdWItbWVudSBzZWN0aW9uLlxyXG4gICAgJHN1YlNlY3Rpb25zLmVhY2goIGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgdmFyICR0aGlzID0gJCggdGhpcyApO1xyXG5cclxuICAgICAgLy8gU2VhcmNoaW5nIHN1YiBtZW51IHNlY3Rpb24gdGl0bGUuXHJcbiAgICAgIHRpdGxlID0gJHRoaXMuZGF0YSgnc3ViLW1lbnUtdGl0bGUnKTtcclxuICAgICAgLy8gQ3JlYXRpb24gc3ViIG1lbnUgZW50cmllcyBlbGVtZW50cy5cclxuICAgICAgaXRlbSA9IGh0bWxFbGVtZW50Q29uc3RydWN0b3IuY2FsbCggc2VsZiwgdGl0bGUgKTtcclxuICAgICAgdWwuYXBwZW5kKCBpdGVtLmxpICk7XHJcbiAgICAgIC8vIENhbGN1bGF0ZSBhbmQgc3RvcmUgc3ViIG1lbnUgZWxlbWVudHMgcG9zaXRpb25zLCBhbmQgY29ycmVzcG9uZGluZyBzdWItc2VjdGlvbnMgcG9zaXRpb25zLlxyXG4gICAgICBwb3MgPSBlbGVtZW50UG9zaXRpb24uY2FsbChzZWxmLCAkdGhpcywgaXRlbS5zcGFuLCBpdGVtLnBpbGxzICk7XHJcbiAgICAgIC8vIEFwcGx5aW5nIGNsaWNrIGhhbmRsZXIgb24gc3ViIG1lbnUgZWxlbWVudHMuXHJcbiAgICAgIGl0ZW0uc3Bhbi5jbGljayggaGFuZGxlclNlbGVjdG9yLmJpbmQoIHNlbGYsICdjbGlja0hhbmRsZXJGbicsIHBvcyApICk7XHJcbiAgICAgIC8vIFN0b3JlIGVsZW1lbnRzIG9uIGFycmF5cy5cclxuICAgICAgbmF2LnB1c2goIHBvcyApO1xyXG4gICAgICBtZW51SXRlbXMucHVzaCggaXRlbS5zcGFuICk7XHJcbiAgICAgIG1lbnVQaWxscy5wdXNoKCBpdGVtLnBpbGxzICk7XHJcbiAgICAgIC8vIENhbGwgZW50cnkgZWxlbWVudCBjYWxsYmFjaywgaWYgZGVmaW5lIGluIHNldHRpbmdzLlxyXG4gICAgICBpZiAodHlwZW9mIHNlbGYuc2V0dGluZ3MuZWxlbWVudENyZWF0ZUNhbGxiYWNrID09PSAnZnVuY3Rpb24nICl7XHJcbiAgICAgICAgc2VsZi5zZXR0aW5ncy5lbGVtZW50Q3JlYXRlQ2FsbGJhY2suY2FsbChpdGVtLmxpLCAkdGhpcywgc2VsZik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluamVjdCBzdWJNZW51IGluIHRoZSBET00uXHJcbiAgICBtZW51VGFyZ2V0LmFwcGVuZChkaXYpO1xyXG5cclxuICAgIC8vIFN0b3JlIGVsZW1lbnRzIGFuZCB2YWx1ZXMgb24gU3ViTWVudSBpbnN0YW5jZSBwcm9wZXJ0aWVzLlxyXG4gICAgdGhpcy5uYXZpZ2F0aW9uID0gbmF2O1xyXG4gICAgdGhpcy5tZW51ID0ge1xyXG4gICAgICB3cmFwcGVyOiBkaXYsXHJcbiAgICAgIG1lbnVJdGVtczogbWVudUl0ZW1zLFxyXG4gICAgICBtZW51UGlsbHM6IG1lbnVQaWxscyxcclxuICAgICAgbmF2UGlsbHM6IHtcclxuICAgICAgICBuYXZQaWxsczogbmF2UGlsbHMsXHJcbiAgICAgICAgaGVpZ2h0OiBuYXZQaWxscy5vdXRlckhlaWdodCgpXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIGFuZCBzdG9yZSBtZW51IGVsZW1lbnRzIHBvc2l0aW9ucywgdXNpbmcgaW4gbW92aW5nIHBpbGxzIGFuaW1hdGlvbi5cclxuICAgIHNldFBpbGxzUG9zaXRpb24uY2FsbCh0aGlzKTtcclxuXHJcbiAgICAvKiBCeSBkZWZhdWx0LCBoaWRlIHN1Yk1lbnUuXHJcbiAgICAgQXQgdGhlIGFuZCBvZiB0aGUgaW5pdGlhbGl6YXRpb24sIHdoZW4gc2Nyb2xsIGhhbmRsZXIgaXMgY2FsbGVkLFxyXG4gICAgIHRoaXMgaGlkZGVuIHN0YXRlIGNhbiBiZSBzd2l0Y2hlZCBhY2NvcmRpbmcgdG8gc2Nyb2xsIHBvc2l0aW9uLiAqL1xyXG4gICAgdGhpcy5tZW51LndyYXBwZXIuY3NzKHtkaXNwbGF5Oidub25lJ30pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2Nyb2xsaW5nIGhhbmRsZXIuXHJcbiAgICogQ2FsbCBzaG93IC8gaGlkZSBmdW5jdGlvbnMgZm9yIHN1Yk1lbnUgYXBwYXJpdGlvbnMuXHJcbiAgICogRGV0ZXJtaW5hdGUgd2hpY2ggc3ViIHNlY3Rpb24gaXMgYWN0aXZlIGFjY29yZGluZyB0byBzY3JvbGxiYXIgcG9zaXRpb24uXHJcbiAgICogQ2FsbCAnd2hpbGUnIGFjdGlvbnMgd2hlbiBzdWIgc2VjdGlvbiBpcyBhY3RpdmF0aW9uLiBCeSBkZWZhdWx0LCB0aGlzIGFjdGlvbiBpcyBtb3ZpbmcgcGlsbHMuXHJcbiAgICpcclxuICAgKi9cclxuICBmdW5jdGlvbiBzY3JvbGxIYW5kbGVyKCkge1xyXG4gICAgdmFyIHkgPSBnZXRTY3JvbGxZKCksXHJcbiAgICAgICAgbCA9IHRoaXMubmF2aWdhdGlvbi5sZW5ndGgsXHJcbiAgICAgICAgaTtcclxuXHJcbiAgICAvLyBJZiBubyBpbnRvIHNlY3Rpb24sIHN1Yk1lbnUgd2UgY2FsbCBhbmltRXhpdCBmdW5jLCBhbmQgcmV0dXJuLlxyXG4gICAgaWYgKCB5IDwgdGhpcy5yYW5nZS5taW4gfHwgeSA+IHRoaXMucmFuZ2UubWF4ICkge1xyXG4gICAgICBpZiAodGhpcy5hY3RpdmUpIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGhhbmRsZXJTZWxlY3Rvci5jYWxsKHRoaXMsICdhbmltRXhpdEZuJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgaW50byBzZWN0aW9uIHdlIGNhbGwgYW5pbUVudGVyLlxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmKCAhdGhpcy5hY3RpdmUgfHwgdGhpcy5zdGF0ZS5iYWJ5KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGhhbmRsZXJTZWxlY3Rvci5jYWxsKHRoaXMsICdhbmltRW50ZXJGbicpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRm9yIGVhY2ggc3ViIHNlY3Rpb24sIGRldGVybWluYXRlIGlmIHdlIGFyZSBpbnRvLlxyXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG5cclxuICAgICAgLy8gSWYgaW50byB0aGUgc3ViIHNlY3Rpb24uXHJcbiAgICAgIGlmICggaXNJblJhbmdlKHRoaXMubmF2aWdhdGlvbltpXSwgeSwgdGhpcy5zZXR0aW5ncy5kZWx0YSkgKSB7XHJcbiAgICAgICAgLy8gQW5kIGlmIHdlIGp1c3QgY29tZSBpbnRvLlxyXG4gICAgICAgIGlmICggaSAhPT0gdGhpcy5zdGF0ZS5hY3RpdmUgKSB7XHJcbiAgICAgICAgICAvLyBBcHBseWluZyBhY3RpdmUgQ2xhc3MuXHJcbiAgICAgICAgICB0aGlzLm5hdmlnYXRpb25baV0ubWVudUVsbXQubWVudUVsbXQuYWRkQ2xhc3MoIHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MgKTtcclxuICAgICAgICAgIC8vIFNldHRpbmdzIHN1YiBzZWN0aW9uIGluZGV4LlxyXG4gICAgICAgICAgdGhpcy5zdGF0ZS5hY3RpdmUgPSBpO1xyXG4gICAgICAgICAgLy8gQ2FsbGluZyB3aGlsZSBmdW5jdGlvbi5cclxuICAgICAgICAgIGhhbmRsZXJTZWxlY3Rvci5jYWxsKHRoaXMsICdhbmltV2hpbGVGbicsIGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSWYgbm8gaW50byB0aGUgc3ViIHNlY3Rpb24uXHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIFJlbW92aW5nIGFjdGl2ZSBjbGFzcy5cclxuICAgICAgICB0aGlzLm5hdmlnYXRpb25baV0ubWVudUVsbXQubWVudUVsbXQucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MgKTtcclxuICAgICAgICAvLyBCdXQgaWYgc3ViIHNlY3Rpb24gaW5kZXggbWF0Y2ggdG8gYWN0aXZlLCB3ZSB0dXJuIG9mZi5cclxuICAgICAgICBpZiAoIGkgPT09IHRoaXMuc3RhdGUuYWN0aXZlICkge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS5hY3RpdmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENhbGxpbmcgc3RlcCBieSBzdGVwIHNjcm9sbCBjYWxsYmFjaywgaWYgZGVmaW5lIGluIHNldHRpbmdzLlxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNldHRpbmdzLnNjcm9sbFN0ZXBDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aGlzLnNldHRpbmdzLnNjcm9sbFN0ZXBDYWxsYmFjay5jYWxsKHRoaXMsIGkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzaXplIEhhbmRsZXIuXHJcbiAgICogUmVzZXQgYW5kIGNhbGN1bGF0ZSBhbGwgbmV3IHBvc2l0aW9ucyB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb2JqIC0galF1ZXJ5IG9iamVjdCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIG9uUmVzaXplKCBvYmogKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMubmF2aWdhdGlvbi5sZW5ndGgsIGksIGl0ZW07XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICBpdGVtID0gZWxlbWVudFBvc2l0aW9uLmNhbGwoIHRoaXMsIHRoaXMubmF2aWdhdGlvbltpXS5lbG10ICk7XHJcbiAgICAgIHRoaXMubmF2aWdhdGlvbltpXS5zdGFydCA9IGl0ZW0uc3RhcnQ7XHJcbiAgICAgIHRoaXMubmF2aWdhdGlvbltpXS5lbmQgPSBpdGVtLmVuZDtcclxuICAgIH1cclxuICAgIHNldFNlY3Rpb25SYW5nZS5jYWxsKHRoaXMsIG9iaik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4gc3ViIG1lbnUgZW50cnkgZWxlbWVudCwgYXMgalF1ZXJ5IG9iamVjdHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGl0bGUgLSBzdWIgbWVudSBlbnRyeSB0aXRsZS5cclxuICAgKiBAcmV0dXJucyB7e2xpOm9iamVjdCwgc3BhbjpvYmplY3QsIHBpbGxzOm9iamVjdH19IC0galF1ZXJ5IG9iamVjdHMuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBodG1sRWxlbWVudENvbnN0cnVjdG9yKCB0aXRsZSApIHtcclxuICAgIHZhciBsaSA9ICQoJzxsaS8+Jyk7XHJcbiAgICB2YXIgc3BhbiA9ICQoJzxzcGFuLz4nKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVsZW1lbnRBdHRycy5jbGFzcylcclxuICAgICAgICAuY3NzKHRoaXMuc2V0dGluZ3MuZWxlbWVudENTUylcclxuICAgICAgICAudGV4dCh0aXRsZSlcclxuICAgICAgICAuYXBwZW5kVG8obGkpO1xyXG4gICAgdmFyIHBpbGxzID0gJCgnPHNwYW4vPicpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuc2V0dGluZ3MucGlsbHNBdHRycy5jbGFzcylcclxuICAgICAgICAuY3NzKHRoaXMuc2V0dGluZ3MucGlsbHNDU1MpXHJcbiAgICAgICAgLmFwcGVuZFRvKHNwYW4pO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbGk6bGksXHJcbiAgICAgIHNwYW46c3BhbixcclxuICAgICAgcGlsbHM6cGlsbHNcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUgYW5kIHNldCBwb3NpdGlvbnMgb2YgYSBzdWJNZW51IGVudHJ5LCBhbmQgY29ycmVzcG9uZGluZyBzdWItc2VjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbG10IC0galF1ZXJ5IG9iamVjdCBtYXRjaGluZyB0aGUgc3ViLXNlY3Rpb24gZWxlbWVudC5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gbWVudUVsbXQgLSBqUXVlcnkgb2JqZWN0IHN1Yk1lbnUgZW50cnkgdGFyZ2V0aW5nIHN1Yi1zZWN0aW9uIGVsZW1lbnQuXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHBpbGxzIC0galF1ZXJ5IG9iamVjdCwgZGVjb3JhdGluZyBwaWxscy5cclxuICAgKiBAcmV0dXJucyB7e21lbnVFbG10OiB7bWVudUVsbXQ6ICgqfG51bGwpLCBwaWxsczogKCp8bnVsbCksIHRvcDogKiwgaGVpZ2h0OiAqfSwgZWxtdDogKiwgc3RhcnQ6IChXaW5kb3d8KiksIGVuZDogKn19XHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBlbGVtZW50UG9zaXRpb24oZWxtdCwgbWVudUVsbXQsIHBpbGxzKSB7XHJcbiAgICB2YXIgc3RhcnQsIGVuZCwgaCxcclxuICAgICAgICBtZSA9IG1lbnVFbG10IHx8IG51bGwsXHJcbiAgICAgICAgcGkgPSBwaWxscyB8fCBudWxsLFxyXG4gICAgICAgIHRvcCA9IG51bGwsXHJcbiAgICAgICAgaGVpZ2h0ID0gbnVsbDtcclxuXHJcbiAgICBzdGFydCA9IGVsbXQub2Zmc2V0KCkudG9wO1xyXG4gICAgaCA9IGVsbXQub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICBlbmQgPSBzdGFydCArIGg7XHJcblxyXG4gICAgLy8gU2kgbCdlbGVtZW50IGRlcGFzc2UgZHUgY2FkcmUgZGUgc2VjdGlvbiBwcmUtZGVmaW5pLCBvbiBwcmVuZCBsZSBtYXgtcmFuZ2UgZGUgbCdlbGVtZW50IGF2ZWMgc29uIGRlbHRhLlxyXG4gICAgdGhpcy5yYW5nZS5tYXggPSAodGhpcy5yYW5nZS5tYXggPCBlbmQgLSB0aGlzLnNldHRpbmdzLmRlbHRhKSA/IGVuZCAtIHRoaXMuc2V0dGluZ3MuZGVsdGEgOiB0aGlzLnJhbmdlLm1heDtcclxuXHJcbiAgICBpZiAoIG1lICkge1xyXG4gICAgICB0b3AgPSBtZS5wb3NpdGlvbigpLnRvcDtcclxuICAgICAgaGVpZ2h0ID0gbWUub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbWVudUVsbXQ6IHtcclxuICAgICAgICBtZW51RWxtdDogbWUsXHJcbiAgICAgICAgcGlsbHM6IHBpLFxyXG4gICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgIH0sXHJcbiAgICAgIGVsbXQ6IGVsbXQsXHJcbiAgICAgIHN0YXJ0OiBzdGFydCxcclxuICAgICAgZW5kOiBlbmRcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGN1bGF0ZSBhbmQgc2V0IHBvc2l0aW9ucyBvZiBhIHN1Yk1lbnUgZW50cnksIGZvciBtb3ZpbmcgcGlsbHMgYW5pbWF0aW9ucy5cclxuICAgKlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHNldFBpbGxzUG9zaXRpb24oKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMubmF2aWdhdGlvbi5sZW5ndGgsIGksIGl0ZW07XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICBpdGVtID0gdGhpcy5uYXZpZ2F0aW9uW2ldLm1lbnVFbG10O1xyXG4gICAgICBpdGVtLnRvcCA9IGl0ZW0ubWVudUVsbXQucG9zaXRpb24oKS50b3A7XHJcbiAgICAgIGl0ZW0uaGVpZ2h0ID0gaXRlbS5tZW51RWxtdC5vdXRlckhlaWdodCh0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGwgdGhlIHJpZ2h0IGFuaW0gbWV0aG9kIG9yIGhhbmRsZXIuXHJcbiAgICogVGVzdCBpZiBjdXN0b20gZnVuY3Rpb25zIHNldCBieSB1c2VyIGFyZSByaWdodC5cclxuICAgKiBJZiB3cm9uZywgY2FsbCBkZWZhdWx0cyBtZXRob2RzIG9yIGFuaW1zLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIHRoZSBmdW5jdGlvbiBuYW1lLiBNdXN0IG1hdGNoIHRvIHByaXZhdGVzIG9yIHNldHRpbmdzIHByb3BlcnR5LlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fG51bWJlcnxzdHJpbmd8YXJyYXl9IHBhcmFtMVxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbTIgLSBNdXN0IGJlIEV2ZW50IG9iamVjdC5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGhhbmRsZXJTZWxlY3RvciAoIG1ldGhvZCwgcGFyYW0xLCBwYXJhbTIgKSB7XHJcblxyXG4gICAgdmFyIHAxID0gcGFyYW0xLCBwMiA9IHBhcmFtMjtcclxuXHJcbiAgICAvLyBJZiBwYXJhbTIsIGl0J3MgRXZlbnQgb2JqZWN0IGFuZCBuZWVkIHRvIGJlIHBhc3NlZCBvbiBmaXJzdC5cclxuICAgIGlmICggcGFyYW0yICkge1xyXG4gICAgICBwMSA9IHBhcmFtMjtcclxuICAgICAgcDIgPSBwYXJhbTE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0eXBlb2YgdGhpcy5zZXR0aW5nc1ttZXRob2RdID09PSBcImZ1bmN0aW9uXCIgKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5nc1ttZXRob2RdLmNhbGwodGhpcywgcDEsIHAyKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgICAgIHByaXZhdGVzW21ldGhvZF0uY2FsbCh0aGlzLCBwMSwgcDIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcHJpdmF0ZXNbbWV0aG9kXS5jYWxsKHRoaXMsIHAxLCBwMik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBseWluZyBoYW5kbGVycyBvbiB3aW5kb3cuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb2JqIC0galF1ZXJ5IG9iamVjdCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGFwcGx5SGFuZGxlcihvYmopIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzY3JvbGxIYW5kbGVyLmJpbmQodGhpcykpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uUmVzaXplLmJpbmQodGhpcywgb2JqKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZXN0aW5nIGlmIG51bWJlciBpcyBpbiByYW5nZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbG10IC0gU3ViTWVudSBpbnN0YW5jZSBwcm9wZXJ0eSBzdG9yaW5nIHRhcmdldCBzdWItc2VjdGlvbiBwb3NpdGlvbnMuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHRlc3QuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRlbHRhXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gdHJ1ZSBpZiBpbnNpZGUsIGZhbHNlIGlmIG91dHNpZGUuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBpc0luUmFuZ2UoIGVsbXQsIHZhbHVlLCBkZWx0YSApIHtcclxuICAgIHZhciBkID0gZGVsdGEgfHwgMDtcclxuICAgIHJldHVybiAoICh2YWx1ZSA+PSAoIGVsbXQuc3RhcnQgLSBkKSApICYmICh2YWx1ZSA8ICggZWxtdC5lbmQgLSBkKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IGNsaWNrIGhhbmRsZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gZSAtIEV2ZW50IG9iamVjdC5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gaXRlbSAtIHNldCBvZiB2YWx1ZXMgcmV0dXJuaW5nIGJ5ICdlbGVtZW50UG9zaXRpb24nIGZ1bmMuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBkZWZhdWx0Q2xpY2tIYW5kbGVyKCBlLCBpdGVtICkge1xyXG4gICAgJCggd2luZG93ICkuc2Nyb2xsVG9wKCBpdGVtLnN0YXJ0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IGhpZGRpbmcgYW5pbSBoYW5kbGVyLlxyXG4gICAqXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVmYXVsdEFuaW1FeGl0KCkge1xyXG4gICAgdGhpcy5tZW51LndyYXBwZXIuZmFkZU91dCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVmYXVsdCBzaG93aW5nIGFuaW0gaGFuZGxlci5cclxuICAgKlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlZmF1bHRBbmltRW50ZXIoKSB7XHJcbiAgICB0aGlzLm1lbnUud3JhcHBlci5mYWRlSW4oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlZmF1bHQgYW5pbSB3aGlsZSBoYW5kbGVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG4gLSBhY3RpdmUgc3ViTWVudSBlbnRyeSBpbmRleC5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGRlZmF1bHRBbmltV2hpbGVDYWxsYmFjayggbiApIHtcclxuICAgIHZhciBwaWxscywgbmV4dCwgdG9wLCBzZWxmLCBuYXYsIGRlbGF5LCBlbmQ7XHJcblxyXG4gICAgc2VsZiA9IHRoaXM7XHJcbiAgICBwaWxscyA9IHRoaXMubWVudS5uYXZQaWxscztcclxuICAgIG5hdiA9IHRoaXMubmF2aWdhdGlvbltuXTtcclxuICAgIG5leHQgPSBuYXYubWVudUVsbXQ7XHJcbiAgICBkZWxheSA9IHNlbGYuc2V0dGluZ3MuZGVmYXVsdEFuaW1XaGlsZURlbGF5O1xyXG4gICAgZW5kID0gc2VsZi5zZXR0aW5ncy5kZWZhdWx0QW5pbVdoaWxlRW5kO1xyXG5cclxuICAgIGlmICggdHlwZW9mIGRlbGF5ICE9PSAnbnVtYmVyJyApIHtcclxuICAgICAgZXJyb3IoICdzZXR0aW5ncycsICdkZWZhdWx0QW5pbVdoaWxlRGVsYXknICk7XHJcbiAgICAgIGRlbGF5ID0gZGVmYXVsdHMuZGVmYXVsdEFuaW1XaGlsZURlbGF5O1xyXG4gICAgfVxyXG4gICAgaWYgKCB0eXBlb2YgZW5kICE9PSAnbnVtYmVyJyApIHtcclxuICAgICAgZXJyb3IoICdzZXR0aW5ncycsICdkZWZhdWx0QW5pbVdoaWxlRW5kJyApO1xyXG4gICAgICBlbmQgPSBkZWZhdWx0cy5kZWZhdWx0QW5pbVdoaWxlRW5kO1xyXG4gICAgfVxyXG5cclxuICAgIG5hdi5tZW51RWxtdC5tZW51RWxtdC5yZW1vdmVDbGFzcyggc2VsZi5zZXR0aW5ncy5hY3RpdmVDbGFzcyApO1xyXG5cclxuICAgIHRvcCA9IG5leHQudG9wICsgTWF0aC5yb3VuZCggKG5leHQuaGVpZ2h0IC8gMikgKSAtIE1hdGgucm91bmQoIChwaWxscy5oZWlnaHQgLyAyKSApO1xyXG4gICAgcGlsbHMubmF2UGlsbHMuYWRkQ2xhc3MoIHNlbGYuc2V0dGluZ3MucGlsbHNBY3RpdmVDbGFzcyApLmFuaW1hdGUoe3RvcDogdG9wfSwgZGVsYXksIGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmIChuYXYgPT09IHNlbGYubmF2aWdhdGlvbltzZWxmLnN0YXRlLmFjdGl2ZV0pIHsgbmF2Lm1lbnVFbG10Lm1lbnVFbG10LmFkZENsYXNzKCBzZWxmLnNldHRpbmdzLmFjdGl2ZUNsYXNzICk7IH1cclxuICAgICAgbmF2Lm1lbnVFbG10LnBpbGxzLmFkZENsYXNzKHNlbGYuc2V0dGluZ3MuZGVmYXVsdEFuaW1XaGlsZUNsYXNzKS5kZWxheSggZW5kICkucXVldWUoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKHNlbGYuc2V0dGluZ3MuZGVmYXVsdEFuaW1XaGlsZUNsYXNzKS5jbGVhclF1ZXVlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBwaWxscy5uYXZQaWxscy5yZW1vdmVDbGFzcyggc2VsZi5zZXR0aW5ncy5waWxsc0FjdGl2ZUNsYXNzICk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvbHlmaWxsIGZvciB3aW5kb3cuc2Nyb2xsWS5cclxuICAgKiBAcmV0dXJucyB7Kn1cclxuICAgKi9cclxuICBmdW5jdGlvbiBnZXRTY3JvbGxZKCl7XHJcbiAgICB2YXIgc3VwcG9ydFBhZ2VPZmZzZXQgPSB3aW5kb3cucGFnZVhPZmZzZXQgIT09IHVuZGVmaW5lZCxcclxuICAgICAgICBpc0NTUzFDb21wYXQgPSAoKGRvY3VtZW50LmNvbXBhdE1vZGUgfHwgXCJcIikgPT09IFwiQ1NTMUNvbXBhdFwiKTtcclxuICAgIHJldHVybiBzdXBwb3J0UGFnZU9mZnNldCA/IHdpbmRvdy5wYWdlWU9mZnNldCA6IGlzQ1NTMUNvbXBhdCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcclxuICB9XHJcblxyXG5cclxufSkoalF1ZXJ5LCB0aGlzLCB0aGlzLmRvY3VtZW50KTsiXX0=
