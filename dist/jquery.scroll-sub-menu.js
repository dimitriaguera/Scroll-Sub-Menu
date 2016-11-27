(function ($, window, document, undefined) {
  'use strict';

  // Default settings.

  var defaults = {
    menuTarget: null,
    lineActive: 'middle',
    deltaSectionEnd: 'middle',
    subSelector: 'ssm-section',
    defaultAnimWhileClass: 'ssm-radar',
    defaultAnimWhileDelay: 100,
    defaultAnimWhileEnd: 1000,
    activeClass: 'ssm-sub-active',
    pillsActiveClass: 'ssm-pills-active',
    wrapperAttrs: { class: 'ssm-sub-menu' },
    elementAttrs: { class: 'ssm-elmt' },
    pillsAttrs: { class: 'ssm-pills ssm-cn' },
    navPillsAttrs: { class: 'ssm-nav-pills' },
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
      self.state.baby = false;
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
      title = $this.data('ssm-title');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUuanMiXSwibmFtZXMiOlsiJCIsIndpbmRvdyIsImRvY3VtZW50IiwidW5kZWZpbmVkIiwiZGVmYXVsdHMiLCJtZW51VGFyZ2V0IiwibGluZUFjdGl2ZSIsImRlbHRhU2VjdGlvbkVuZCIsInN1YlNlbGVjdG9yIiwiZGVmYXVsdEFuaW1XaGlsZUNsYXNzIiwiZGVmYXVsdEFuaW1XaGlsZURlbGF5IiwiZGVmYXVsdEFuaW1XaGlsZUVuZCIsImFjdGl2ZUNsYXNzIiwicGlsbHNBY3RpdmVDbGFzcyIsIndyYXBwZXJBdHRycyIsImNsYXNzIiwiZWxlbWVudEF0dHJzIiwicGlsbHNBdHRycyIsIm5hdlBpbGxzQXR0cnMiLCJ3cmFwcGVyQ1NTIiwiZWxlbWVudENTUyIsInBpbGxzQ1NTIiwibmF2UGlsbHNDU1MiLCJhbmltRXhpdEZuIiwiYW5pbUVudGVyRm4iLCJhbmltV2hpbGVGbiIsImNsaWNrSGFuZGxlckZuIiwiZWxlbWVudENyZWF0ZUNhbGxiYWNrIiwic2Nyb2xsU3RlcENhbGxiYWNrIiwiZXJyb3JzIiwic2VsZWN0b3IiLCJiYXNpYyIsIm5vUmVzdWx0Iiwic2V0dGluZ3MiLCJtZXRob2QiLCJub0luc3RhbmNlIiwicHJpdmF0ZXMiLCJkZWZhdWx0QW5pbUV4aXQiLCJkZWZhdWx0QW5pbUVudGVyIiwiZGVmYXVsdEFuaW1XaGlsZUNhbGxiYWNrIiwiZGVmYXVsdENsaWNrSGFuZGxlciIsIm1ldGhvZHMiLCJpbml0Iiwib3B0aW9ucyIsImNhbGxiYWNrIiwiZWFjaCIsIiR0aGlzIiwiZGF0YSIsIm9iaiIsImV4dGVuZCIsIlN1Yk1lbnUiLCJzdWJNZW51SW5zdGFuY2UiLCJpbml0aWFsaXNlU3ViTWVudSIsImNhbGwiLCJnZXRNZW51SXRlbXMiLCJlcnJvciIsImZuIiwic3ViTWVudSIsImFjdGl2ZSIsInJhbmdlIiwic3RhdGUiLCJuZXh0IiwiYmFieSIsInByb3RvdHlwZSIsIm1lbnUiLCJzZWxmIiwic2V0VGltZW91dCIsInNldFNlY3Rpb25SYW5nZSIsImNyZWF0ZU1lbnVFbGVtZW50IiwiYXBwbHlIYW5kbGVyIiwic2Nyb2xsSGFuZGxlciIsInR5cGUiLCJzdWJUeXBlIiwidmFsdWUiLCJtZXNzYWdlIiwiZSIsIkVycm9yIiwiY29uc29sZSIsImxvZyIsImdpdmVNZUpxIiwiaW5wdXQiLCJyZXN1bHQiLCJyZXBsYWNlIiwialF1ZXJ5IiwibGVuZ3RoIiwidGFyZ2V0Iiwic3RhcnQiLCJvZmZzZXQiLCJ0b3AiLCJoIiwib3V0ZXJIZWlnaHQiLCJ3aCIsImhlaWdodCIsImRlbHRhIiwiZGVsdGFTZWN0aW9uIiwibWluIiwibWF4IiwibmF2IiwibWVudUl0ZW1zIiwibWVudVBpbGxzIiwidGl0bGUiLCJpdGVtIiwicG9zIiwiJHN1YlNlY3Rpb25zIiwiZmluZCIsImRpdiIsImFkZENsYXNzIiwiY3NzIiwidWwiLCJhcHBlbmRUbyIsIm5hdlBpbGxzIiwiaHRtbEVsZW1lbnRDb25zdHJ1Y3RvciIsImFwcGVuZCIsImxpIiwiZWxlbWVudFBvc2l0aW9uIiwic3BhbiIsInBpbGxzIiwiY2xpY2siLCJoYW5kbGVyU2VsZWN0b3IiLCJiaW5kIiwicHVzaCIsIm5hdmlnYXRpb24iLCJ3cmFwcGVyIiwic2V0UGlsbHNQb3NpdGlvbiIsImRpc3BsYXkiLCJ5IiwiZ2V0U2Nyb2xsWSIsImwiLCJpIiwiaXNJblJhbmdlIiwibWVudUVsbXQiLCJyZW1vdmVDbGFzcyIsIm9uUmVzaXplIiwiZWxtdCIsImVuZCIsInRleHQiLCJtZSIsInBpIiwicG9zaXRpb24iLCJwYXJhbTEiLCJwYXJhbTIiLCJwMSIsInAyIiwiYWRkRXZlbnRMaXN0ZW5lciIsImQiLCJzY3JvbGxUb3AiLCJmYWRlT3V0IiwiZmFkZUluIiwibiIsImRlbGF5IiwiTWF0aCIsInJvdW5kIiwiYW5pbWF0ZSIsInF1ZXVlIiwiY2xlYXJRdWV1ZSIsInN1cHBvcnRQYWdlT2Zmc2V0IiwicGFnZVhPZmZzZXQiLCJpc0NTUzFDb21wYXQiLCJjb21wYXRNb2RlIiwicGFnZVlPZmZzZXQiLCJkb2N1bWVu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QXVCLEVBQXhCLE1BQWdDLFlBRHBEO0FBRUEsV0FBT0gsb0JBQW9CMUosT0FBTzhKLFdBQTNCLEdBQXlDRixlQUFlM0osU0FBUzhKLGVBQVQsQ0FBeUJmLFNBQXhDLEdBQW9EL0ksU0FBUytKLElBQVQsQ0FBY2hCLFNBQWxIO0FBQ0Q7QUFHRixDQXp1QkQsRUF5dUJHOUQsTUF6dUJILEVBeXVCVyxJQXp1QlgsRUF5dUJpQixLQUFLakYsUUF6dUJ0QiIsImZpbGUiOiJqcXVlcnkuc2Nyb2xsLXN1Yi1tZW51LmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgkLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIERlZmF1bHQgc2V0dGluZ3MuXHJcbiAgdmFyIGRlZmF1bHRzID0ge1xyXG4gICAgbWVudVRhcmdldCA6IG51bGwsXHJcbiAgICBsaW5lQWN0aXZlIDogJ21pZGRsZScsXHJcbiAgICBkZWx0YVNlY3Rpb25FbmQ6ICdtaWRkbGUnLFxyXG4gICAgc3ViU2VsZWN0b3I6ICdzc20tc2VjdGlvbicsXHJcbiAgICBkZWZhdWx0QW5pbVdoaWxlQ2xhc3M6ICdzc20tcmFkYXInLFxyXG4gICAgZGVmYXVsdEFuaW1XaGlsZURlbGF5OiAxMDAsXHJcbiAgICBkZWZhdWx0QW5pbVdoaWxlRW5kOiAxMDAwLFxyXG4gICAgYWN0aXZlQ2xhc3M6ICdzc20tc3ViLWFjdGl2ZScsXHJcbiAgICBwaWxsc0FjdGl2ZUNsYXNzOiAnc3NtLXBpbGxzLWFjdGl2ZScsXHJcbiAgICB3cmFwcGVyQXR0cnM6IHtjbGFzczogJ3NzbS1zdWItbWVudSd9LFxyXG4gICAgZWxlbWVudEF0dHJzOiB7Y2xhc3M6ICdzc20tZWxtdCd9LFxyXG4gICAgcGlsbHNBdHRyczoge2NsYXNzOiAnc3NtLXBpbGxzIHNzbS1jbid9LFxyXG4gICAgbmF2UGlsbHNBdHRyczoge2NsYXNzOiAnc3NtLW5hdi1waWxscyd9LFxyXG4gICAgd3JhcHBlckNTUzoge30sXHJcbiAgICBlbGVtZW50Q1NTOiB7fSxcclxuICAgIHBpbGxzQ1NTOiB7fSxcclxuICAgIG5hdlBpbGxzQ1NTOiB7fSxcclxuICAgIGFuaW1FeGl0Rm46IG51bGwsXHJcbiAgICBhbmltRW50ZXJGbjogbnVsbCxcclxuICAgIGFuaW1XaGlsZUZuOiBudWxsLFxyXG4gICAgY2xpY2tIYW5kbGVyRm46IG51bGwsXHJcbiAgICBlbGVtZW50Q3JlYXRlQ2FsbGJhY2s6IG51bGwsXHJcbiAgICBzY3JvbGxTdGVwQ2FsbGJhY2s6IG51bGxcclxuICB9O1xyXG5cclxuICAvLyBFcnJvcnMgbWVzc2FnZXMuXHJcbiAgdmFyIGVycm9ycyA9IHtcclxuICAgIHNlbGVjdG9yOiB7YmFzaWM6J0FyZ3VtZW50IG11c3QgYmUgZWxlbWVudCBJRCBzdHJpbmcgb3IgalF1ZXJ5IG9iamVjdC4nfSxcclxuICAgIG5vUmVzdWx0OiB7YmFzaWM6J1dyb25nIElELCBubyBqUXVlcnkgb2JqZWN0IG1hdGNoLid9LFxyXG4gICAgc2V0dGluZ3M6IHtcclxuICAgICAgYmFzaWM6J1VucmVjb2duaXplZCBzZXR0aW5ncyBleHByZXNzaW9uIG9yIHdyb25nIHZhbHVlLicsXHJcbiAgICAgIGRlZmF1bHRBbmltV2hpbGVEZWxheTogJ2RlZmF1bHRBbmltV2hpbGVEZWxheSBtdXN0IGJlIHR5cGUgTnVtYmVyLicsXHJcbiAgICAgIGRlZmF1bHRBbmltV2hpbGVFbmQ6ICdkZWZhdWx0QW5pbVdoaWxlRW5kIG11c3QgYmUgdHlwZSBOdW1iZXIuJyxcclxuICAgICAgbWVudVRhcmdldCA6ICdtZW51VGFyZ2V0IG11c3QgYmUgdHlwZSBTdHJpbmcgbWF0Y2hpbmcgZWxlbWVudCBJRCBvciBqUXVlcnkgT2JqZWN0LicsXHJcbiAgICAgIGxpbmVBY3RpdmUgOiAnbGluZUFjdGl2ZSBtdXN0IGJlIHR5cGUgTnVtYmVyIG9yIFN0cmluZyB2YWx1ZSB0b3B8bWlkZGxlfGJvdHRvbS4nLFxyXG4gICAgICBkZWx0YVNlY3Rpb25FbmQ6ICdkZWx0YVNlY3Rpb25FbmQgbXVzdCBiZSB0eXBlIE51bWJlciBvciBTdHJpbmcgdmFsdWUgdG9wfG1pZGRsZXxib3R0b20uJyxcclxuICAgICAgc3ViU2VsZWN0b3I6ICdzdWJTZWxlY3RvciBtdXN0IGJlIHR5cGUgU3RyaW5nLidcclxuICAgIH0sXHJcbiAgICBtZXRob2Q6IHtcclxuICAgICAgYmFzaWM6J1VucmVjb2duaXplZCBtZXRob2QgZXhwcmVzc2lvbi4nLFxyXG4gICAgICBub0luc3RhbmNlOiAnU3ViTWVudSBtdXN0IGJlIGluc3RhbmNpZWQgYmVmb3JlIGNhbGxpbmcgbWV0aG9kcy4gTWV0aG9kIHdvbnQgYmUgY2FsbGVkLidcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBQcml2YXRlcyBmdW5jdGlvbnMuIFVzaW5nIGFzIGRlZmF1bHQgZnVuY3Rpb25zIGlmIG5vIG1hdGNoIG9yIGVycm9yIGluIHNldHRpbmdzIG9wdGlvbnMuXHJcbiAgdmFyIHByaXZhdGVzID0ge1xyXG4gICAgYW5pbUV4aXRGbjogZGVmYXVsdEFuaW1FeGl0LFxyXG4gICAgYW5pbUVudGVyRm46IGRlZmF1bHRBbmltRW50ZXIsXHJcbiAgICBhbmltV2hpbGVGbjogZGVmYXVsdEFuaW1XaGlsZUNhbGxiYWNrLFxyXG4gICAgY2xpY2tIYW5kbGVyRm46IGRlZmF1bHRDbGlja0hhbmRsZXJcclxuICB9O1xyXG5cclxuICAvLyBXZSBkZWZpbmVzIHB1YmxpYyBtZXRob2RzIGhlcmUuXHJcbiAgdmFyIG1ldGhvZHMgPSB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbnRlciBqUXVlcnkgbWV0aG9kIGNyZWF0aW5nIG5ldyBTdWJNZW51IGluc3RhbmNlLCBzdG9yaW5nIGluIGpRdWV5IGVsZW1lbnQgZGF0YSwgb3IgdXBkYXRpbmcgc2V0dGluZ3MuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgLSBzZXR0aW5nc1xyXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9IC0galF1ZXJ5IG9iamVjdCwgZm9yIGNoYWluaW5nIG1ldGhvZHMuXHJcbiAgICAgICAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24gKCBvcHRpb25zLCBjYWxsYmFjayApIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgZGF0YSA9ICR0aGlzLmRhdGEoJ3N1Yk1lbnVQbHVnaW4nKSxcclxuICAgICAgICAgICAgb2JqLCBzZXR0aW5ncyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XHJcblxyXG4gICAgICAgIC8vIElmIG5vIHBsdWdpbiBzcGFjZW5hbWUgb24gZGF0YSBlbGVtZW50LlxyXG4gICAgICAgIGlmICggIWRhdGEgKXtcclxuICAgICAgICAgIC8vIENyZWF0aW5nIG5ldyBTdWJNZW51IG9iamVjdCBpbnN0YW5jZSwgYW5kIHN0b3JlIGl0IG9uIGRhdGEgZWxlbWVudC5cclxuICAgICAgICAgIG9iaiA9IG5ldyBTdWJNZW51KCBzZXR0aW5ncyApO1xyXG4gICAgICAgICAgLy8gU3RvcmUgaW5zdGFuY2UgaW4gZGF0YS5cclxuICAgICAgICAgICR0aGlzLmRhdGEoJ3N1Yk1lbnVQbHVnaW4nLCB7XHJcbiAgICAgICAgICAgIHN1Yk1lbnVJbnN0YW5jZTogb2JqXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIC8vIEluaXRpYWxpemluZyBTdWJNZW51IGluIGFzeW5jIGxvb3AuXHJcbiAgICAgICAgICBpbml0aWFsaXNlU3ViTWVudS5jYWxsKG9iaiwgJHRoaXMsIGNhbGxiYWNrKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gSWYgcGx1Z2luIHNwYWNlbmFtZSBleGlzdCBvbiBkYXRhIGVsZW1lbnQuXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAvLyBJZiBubyBTdWJNZW51IG9iamVjdCBpbnN0YW5jZSBhbHJlYXJ5IGV4aXN0LCB3ZSBjcmVhdGUgaXQuXHJcbiAgICAgICAgICBpZiAoICFkYXRhLnN1Yk1lbnVJbnN0YW5jZSApIHtcclxuICAgICAgICAgICAgLy8gSW5zdGFuY3lpbmcuXHJcbiAgICAgICAgICAgIG9iaiA9IG5ldyBTdWJNZW51KCBzZXR0aW5ncyApO1xyXG4gICAgICAgICAgICAvLyBNZXJnaW4gZGF0YSBwbHVnaW4gc3BhY2VuYW1lLlxyXG4gICAgICAgICAgICAkdGhpcy5kYXRhKCdzdWJNZW51UGx1Z2luJywgJC5leHRlbmQoIHt9LCBkYXRhLCB7c3ViTWVudUluc3RhbmNlOiBvYmp9KSk7XHJcbiAgICAgICAgICAgIC8vIEluaXRpYWxpemluZyBTdWJNZW51IGluIGFzeW5jIGxvb3AuXHJcbiAgICAgICAgICAgIGluaXRpYWxpc2VTdWJNZW51LmNhbGwob2JqLCAkdGhpcywgY2FsbGJhY2spO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gSWYgU3ViTWVudSBvYmplY3QgYWxyZWFkeSBpbnN0YW5jaWVkIGZvciB0aGlzIGVsZW1lbnQuXHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXBkYXRpbmcgc2V0dGluZ3MuXHJcbiAgICAgICAgICAgICQuZXh0ZW5kKCR0aGlzLmRhdGEoJ3N1Yk1lbnVQbHVnaW4nKS5zdWJNZW51SW5zdGFuY2Uuc2V0dGluZ3MsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAvLyBDYWxsaW5nIGNhbGxiYWNrLlxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbCgkdGhpcywgJHRoaXMuZGF0YSgnc3ViTWVudVBsdWdpbicpLnN1Yk1lbnVJbnN0YW5jZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogR2V0dGVyIG9mIFN1Yk1lbnUgaW5zdGFuY2Ugb2YgdGhlIGpRdWVyeSBlbGVtZW50IHdlIGFyZSB3b3JraW5nIG9uLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSBvcHRpb25zXHJcbiAgICAgKiBAcGFyYW0gY2FsbGJhY2tcclxuICAgICAqIEByZXR1cm5zIHtvYmplY3R8Kn0gLSByZXR1cm4gbWVudSBwcm9wZXJ0eSBvZiBTdWJNZW51IGluc3RhbmNlLlxyXG4gICAgICAgKi9cclxuICAgIGdldE1lbnVJdGVtczogZnVuY3Rpb24oIG9wdGlvbnMsIGNhbGxiYWNrICkge1xyXG5cclxuICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICBkYXRhID0gJHRoaXMuZGF0YSgnc3ViTWVudVBsdWdpbicpO1xyXG5cclxuICAgICAgICBpZiAoICFkYXRhIHx8ICFkYXRhLnN1Yk1lbnVJbnN0YW5jZSkge1xyXG4gICAgICAgICAgZXJyb3IoICdtZXRob2QnLCAnbm9JbnN0YW5jZScsICdnZXRNZW51SXRlbXMnICk7XHJcbiAgICAgICAgICBtZXRob2RzLmluaXQuY2FsbCgkdGhpcywgb3B0aW9ucywgY2FsbGJhY2spO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGRhdGEuc3ViTWVudUluc3RhbmNlLmdldE1lbnVJdGVtcygpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEVudGVyIGZ1bmN0aW9uLCBleHRlbmRpbmcgalF1ZXJ5IG1ldGhvZHMuXHJcbiAgICogY3JlYXRlIGFuZCBpbml0aWFsaXplIG5ldyBTdWJNZW51IGluc3RhbmNlIGJ5IGNhbGxpbmcgaW5pdCBtZXRob2QsXHJcbiAgICogb3IgcmVmcmVzaCBzZXR0aW5ncyxcclxuICAgKiBvciBjYWxsIG90aGVyIG1ldGhvZHNcclxuICAgKlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBtZXRob2QgY2FsbCBpbiAnbWV0aG9kJyB2YXIuXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgLSBzZXR0aW5ncyB2YWx1ZXMgYXMgaW4gJ2RlZmF1bHRzJy5cclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uIGNhbGxlZCBhdCB0aGUgZW5kLCB3aGVuIG1lbnUgaXMgY3JlYXRlZCwgaW5qZWN0ZWQgaW4gdGhlIERPTSBhbmQgaW5pdGlhbGl6ZWQuXHJcbiAgICogQHJldHVybnMge29iamVjdH0gcmV0dXJuIGpRdWVyeSBvYmplY3QsIG9yIGFub255bSBvYmplY3Qgd2hlbiBnZXRNZW51SXRlbXMgaXMgY2FsbGVkLlxyXG4gICAgICovXHJcbiAgJC5mbi5zdWJNZW51ID0gZnVuY3Rpb24oIG1ldGhvZCwgb3B0aW9ucywgY2FsbGJhY2sgKSB7XHJcblxyXG4gICAgLy8gSWYgdXNlciBnaXZlcyBhIG1ldGhvZCwgYSBjYWxsYmFjaywgYnV0IG5vIG9wdGlvbnMuXHJcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICBjYWxsYmFjayA9IG9wdGlvbnM7XHJcbiAgICAgIG9wdGlvbnMgPSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgdXNlciBvbmx5IGdpdmUgY2FsbGJhY2suXHJcbiAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICAgIGNhbGxiYWNrID0gbWV0aG9kO1xyXG4gICAgICBvcHRpb25zID0gbnVsbDtcclxuICAgICAgbWV0aG9kID0gbnVsbDtcclxuICAgICAgLy8gSWYgdXNlciBnaXZlcyBubyBtZXRob2QsIGJ1dCBvcHRpb25zLlxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbWV0aG9kID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgIG9wdGlvbnMgPSBtZXRob2Q7XHJcbiAgICAgIG1ldGhvZCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWV0aG9kcyBhcmUgY2FsbGVkLCBhY2NvcmRpbmcgdG8gcGFyYW1zLlxyXG4gICAgLy8gSWYgbWV0aG9kIGV4aXN0LCBpdCdzIGNhbGxlZC5cclxuICAgIGlmIChtZXRob2RzW21ldGhvZF0pIHtcclxuICAgICAgcmV0dXJuIG1ldGhvZHNbbWV0aG9kXS5jYWxsKHRoaXMsIG9wdGlvbnMsIGNhbGxiYWNrKTtcclxuICAgIH1cclxuICAgIC8vIElmIG5vIG1ldGhvZCwgaW5pdCBpcyBjYWxsZWQuXHJcbiAgICBlbHNlIGlmICggIW1ldGhvZCAmJiAodHlwZW9mIG9wdGlvbnMgPT09ICdvYmplY3QnIHx8ICEgb3B0aW9ucykgKSB7XHJcbiAgICAgIHJldHVybiBtZXRob2RzLmluaXQuY2FsbCh0aGlzLCBvcHRpb25zLCBjYWxsYmFjayk7XHJcbiAgICB9XHJcbiAgICAvLyBJZiBtZXRob2QgZG9lcyBub3QgZXhpc3QsIGVycm9yIGlzIGNhbGxlZC5cclxuICAgIGVsc2Uge1xyXG4gICAgICBlcnJvciggJ21ldGhvZCcsIG1ldGhvZCApO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1Yk1lbnUgY29uc3RydWN0b3IuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gc2V0dGluZ3MgLSBkZWZhdWx0cyBtb2RpZmllZCBieSBvcHRpb25zLlxyXG4gICAqIEBjb25zdHJ1Y3RvclxyXG4gICAgICovXHJcbiAgZnVuY3Rpb24gU3ViTWVudSggc2V0dGluZ3MgKSB7XHJcbiAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XHJcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5yYW5nZSA9IHt9O1xyXG4gICAgdGhpcy5zdGF0ZSA9IHtcclxuICAgICAgYWN0aXZlOiBudWxsLFxyXG4gICAgICBuZXh0OiBudWxsLFxyXG4gICAgICBiYWJ5OiB0cnVlXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU3ViTWVudSBNZXRob2QuXHJcbiAgICogR2V0dGVyIG1lbnUgcHJvcGVydHkuXHJcbiAgICpcclxuICAgKiBAdHlwZSB7e2dldE1lbnVJdGVtczogU3ViTWVudS5nZXRNZW51SXRlbXN9fVxyXG4gICAgICovXHJcbiAgU3ViTWVudS5wcm90b3R5cGUgPSB7XHJcbiAgICBnZXRNZW51SXRlbXM6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWVudTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUsIGluamVjdCBpbiBET00gYW5kIGluaXRpYWxpemUgc3ViTWVudS5cclxuICAgKiBBc3luY2hyb25lIG9wZXJhdGlvbnMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb2JqIC0galF1ZXJ5IG9iamVjdC5cclxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFja1xyXG4gICAgICovXHJcbiAgZnVuY3Rpb24gaW5pdGlhbGlzZVN1Yk1lbnUoIG9iaiwgY2FsbGJhY2sgKSB7XHJcblxyXG4gICAgLy8gU2F2aW5nIHRoaXMgdG8gdXNlIGl0IGluIGFzeW5jIGxvb3AuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgLy8gSGVyZSwgYXN5bmNocm9uIGFjdGlvbnMgc3RhcnRzLlxyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAvLyBTYXZlIHNlY3Rpb24ncyBwaXhlbHMgcmFuZ2UuXHJcbiAgICAgIHNldFNlY3Rpb25SYW5nZS5jYWxsKHNlbGYsIG9iaik7XHJcbiAgICAgIC8vIENyZWF0ZSBhbmQgaW5qZWN0IHN1Yk1lbnUgaW4gdGhlIERPTS5cclxuICAgICAgLy8gQXBwbHkgY2xpY2sgaGFuZGxlciBvbiBlYWNoIG1lbnUgZW50cnkuXHJcbiAgICAgIGNyZWF0ZU1lbnVFbGVtZW50LmNhbGwoc2VsZiwgb2JqKTtcclxuICAgICAgLy8gQXBwbHkgd2luZG93J3MgaGFuZGxlciwgc2Nyb2xsIGFuZCByZXNpemUuXHJcbiAgICAgIGFwcGx5SGFuZGxlci5jYWxsKHNlbGYsIG9iaik7XHJcbiAgICAgIC8vIEZpbmFseSBjYWxsIHNjcm9sbGhhbmRsZXIgdG8gaW5pdGlhbGl6ZSBtZW51IHN0YXRlLlxyXG4gICAgICBzY3JvbGxIYW5kbGVyLmNhbGwoc2VsZik7XHJcbiAgICAgIC8vIFN1Yk1lbnUgaGFzIGdyb3duICFcclxuICAgICAgc2VsZi5zdGF0ZS5iYWJ5ID0gZmFsc2U7XHJcbiAgICAgIC8vIEZpbmFseSBjYWxsIGNhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmNhbGwob2JqLCBzZWxmKTtcclxuICAgICAgfVxyXG4gICAgfSwgMCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGUgYW5kIHJldHVybiBuZXcgRXJyb3IuXHJcbiAgICogU2VhcmNoIGVycm9yIG1lc3NhZ2UgaW4gJ2Vycm9ycycgdmFyIGFjY29yZGluZyB0byBwYXJhbXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIGZpcnN0IGRlZXAgJ2Vycm9ycycgb2JqZWN0IHByb3BlcnR5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdWJUeXBlIC0gc2Vjb25kIGRlZXAgJ2Vycm9ycycgb2JqZWN0IHByb3BlcnR5LlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIEN1c3RvbSBtZXNzYWdlLlxyXG4gICAqIEByZXR1cm5zIHtFcnJvcn1cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGVycm9yICggdHlwZSwgc3ViVHlwZSwgdmFsdWUgKXtcclxuXHJcbiAgICB2YXIgbWVzc2FnZSA9ICcnLCBlO1xyXG5cclxuICAgIC8vIElmIG5vIGVudHJ5IG9uICdlcnJvcnMnIG9iamVjdCwgdHlwZSBpcyBjb25zaWRlcmVkIGFzIGZyZWUgbWVzc2FnZS5cclxuICAgIGlmICggIWVycm9yc1t0eXBlXSApe1xyXG4gICAgICBtZXNzYWdlID0gdHlwZTtcclxuICAgIH1cclxuICAgIC8vIElmIG5vIHNlY29uZCBkZWVwLlxyXG4gICAgZWxzZSBpZiAoICFlcnJvcnNbdHlwZV1bc3ViVHlwZV0gKSB7XHJcbiAgICAgIGlmICggc3ViVHlwZSApIHtcclxuICAgICAgICBtZXNzYWdlICs9ICdcXG4nICsgJ1ZhbHVlIFwiJyArIHN1YlR5cGUgKyAnXCInO1xyXG4gICAgICB9XHJcbiAgICAgIG1lc3NhZ2UgKz0gJ1xcbicgKyBlcnJvcnNbdHlwZV0uYmFzaWM7XHJcbiAgICB9XHJcbiAgICAvLyBJZiBzZWNvbmQgZGVlcC5cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoIHZhbHVlICkge1xyXG4gICAgICAgIG1lc3NhZ2UgKz0gJ1xcbicgKyAnVmFsdWUgXCInICsgdmFsdWUgKyAnXCInO1xyXG4gICAgICB9XHJcbiAgICAgIG1lc3NhZ2UgKz0gJ1xcbicgKyBlcnJvcnNbdHlwZV0uYmFzaWM7XHJcbiAgICAgIG1lc3NhZ2UgKz0gJ1xcbicgKyBlcnJvcnNbdHlwZV1bc3ViVHlwZV07XHJcbiAgICB9XHJcbiAgICAvLyBDcmVhdGUgYW5kIHJldHVybiBuZXcgRXJyb3IuXHJcbiAgICBlID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgY29uc29sZS5sb2coZSk7XHJcbiAgICByZXR1cm4gZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybiBqUXVlcnkgb2JqZWN0XHJcbiAgICogb3IgbnVsbCBpZiBpbnB1dCBkb2VzIG5vdCBtYXRjaC5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fHN0cmluZ30gaW5wdXQgLSBqUXVlcnkgb2JqZWN0IG9yIHN0cmluZyBtYXRjaGluZyBJRCBlbGVtZW50IGluIERPTS5cclxuICAgKiBAcmV0dXJucyB7b2JqZWN0fSAtIHJldHVybiBqUXVlcnkgb2JqZWN0IG9yIG51bGwuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBnaXZlTWVKcShpbnB1dCkge1xyXG5cclxuICAgIHZhciByZXN1bHQgPSBudWxsLFxyXG4gICAgICAgIHR5cGUgPSB0eXBlb2YgaW5wdXQ7XHJcblxyXG4gICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgIGNhc2UgJ3N0cmluZyc6XHJcbiAgICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKCcjJywgJycpO1xyXG4gICAgICAgIHJlc3VsdCA9ICQoJyMnICsgaW5wdXQpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdvYmplY3QnOlxyXG4gICAgICAgICAgICBpZiAoIGlucHV0IGluc3RhbmNlb2YgalF1ZXJ5KSB7XHJcbiAgICAgICAgICAgICAgcmVzdWx0ID0gaW5wdXQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBlcnJvcignc2VsZWN0b3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBlcnJvcignc2VsZWN0b3InKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICBlcnJvcignbm9SZXN1bHQnKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbiAgfVxyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogU2V0IG1pbmltYWwgYW5kIG1heGltYWwgdmFsdWUgYWNjb3JkaW5nIHRvIHRoZSB0YXJnZXQgcG9zaXRpb24gaW4gdGhlICdkb2N1bWVudCcuXHJcbiAgICogVGFyZ2V0IGlzIHRoZSBqUXVlcnkgb2JqZWN0IGZvciB3aGljaCBzdWJNZW51IGlzIGNyZWF0aW5nLlxyXG4gICAqIERldGVybWluZSB0aG9zZSB2YWx1ZXMgYWNjb3JkaW5nIHRvIHNldHRpbmdzIHRvby5cclxuICAgKiBUaG9zZSB2YWx1ZXMgYXJlIHVzaW5nIHRvIGRldGVybWluYXRlIHdoZW4gd2UgY2FsbCBzaG93L2hpZGUgZnVuY3Rpb25zIGFjY29yZGluZyB0byBzY3JvbGwgcG9zaXRpb24uXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIHNldFNlY3Rpb25SYW5nZSggdGFyZ2V0ICkge1xyXG4gICAgdmFyIHN0YXJ0ID0gdGFyZ2V0Lm9mZnNldCgpLnRvcCxcclxuICAgICAgICBoID0gdGFyZ2V0Lm91dGVySGVpZ2h0KCksXHJcbiAgICAgICAgd2ggPSAkKCB3aW5kb3cgKS5oZWlnaHQoKSxcclxuICAgICAgICBkZWx0YSA9IDAsXHJcbiAgICAgICAgZGVsdGFTZWN0aW9uID0gMDtcclxuXHJcbiAgICAvLyBDaGVja2luZyBsaW5lQWN0aXZlIHNldHRpbmcuXHJcbiAgICBpZiAodHlwZW9mIHRoaXMuc2V0dGluZ3MubGluZUFjdGl2ZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgc3dpdGNoICh0aGlzLnNldHRpbmdzLmxpbmVBY3RpdmUpIHtcclxuICAgICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgICAgZGVsdGEgPSAwO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcclxuICAgICAgICAgIGRlbHRhID0gd2g7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlICdtaWRkbGUnOlxyXG4gICAgICAgICAgZGVsdGEgPSB3aCAvIDI7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgZXJyb3IoJ3NldHRpbmdzJywgJ2xpbmVBY3RpdmUnLCB0aGlzLnNldHRpbmdzLmxpbmVBY3RpdmUpO1xyXG4gICAgICAgICAgZGVsdGEgPSB3aCAvIDI7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgICB0aGlzLnNldHRpbmdzLmRlbHRhID0gZGVsdGE7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNldHRpbmdzLmxpbmVBY3RpdmUgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncy5kZWx0YSA9IGRlbHRhID0gdGhpcy5zZXR0aW5ncy5saW5lQWN0aXZlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGVycm9yKCdzZXR0aW5ncycsICdsaW5lQWN0aXZlJywgdGhpcy5zZXR0aW5ncy5saW5lQWN0aXZlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNraW5nIGRlbHRhU2VjdGlvbkVuZCBzZXR0aW5nLlxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNldHRpbmdzLmRlbHRhU2VjdGlvbkVuZCA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgc3dpdGNoICh0aGlzLnNldHRpbmdzLmRlbHRhU2VjdGlvbkVuZCkge1xyXG4gICAgICAgIGNhc2UgJ3RvcCc6XHJcbiAgICAgICAgICBkZWx0YVNlY3Rpb24gPSAwO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnYm90dG9tJzpcclxuICAgICAgICAgIGRlbHRhU2VjdGlvbiA9IHdoO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnbWlkZGxlJzpcclxuICAgICAgICAgIGRlbHRhU2VjdGlvbiA9IHdoIC8gMjtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBlcnJvcignc2V0dGluZ3MnLCAnZGVsdGFTZWN0aW9uRW5kJywgdGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb25FbmQpO1xyXG4gICAgICAgICAgZGVsdGFTZWN0aW9uID0gd2ggLyAyO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy5zZXR0aW5ncy5kZWx0YVNlY3Rpb24gPSBkZWx0YVNlY3Rpb247XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNldHRpbmdzLmRlbHRhU2VjdGlvbkVuZCA9PT0gJ251bWJlcicpIHtcclxuICAgICAgICB0aGlzLnNldHRpbmdzLmRlbHRhU2VjdGlvbiA9IGRlbHRhU2VjdGlvbiA9IHRoaXMuc2V0dGluZ3MuZGVsdGFTZWN0aW9uRW5kO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGVycm9yKCdzZXR0aW5ncycsICdkZWx0YVNlY3Rpb25FbmQnLCB0aGlzLnNldHRpbmdzLmRlbHRhU2VjdGlvbkVuZCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTdG9yZSB2YWx1ZXMgb24gaW5zdGFuY2UgU3ViTWVudS5yYW5nZSBwcm9wZXJ0eS5cclxuICAgIHRoaXMucmFuZ2UubWluID0gc3RhcnQ7XHJcbiAgICB0aGlzLnJhbmdlLm1heCA9IChzdGFydCArIGgpIC0gZGVsdGFTZWN0aW9uO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIHN1Yk1lbnUgZWxlbWVudCxcclxuICAgKiBJbmplY3Qgc3ViTWVudSBvbiBET00sXHJcbiAgICogQXBwbHkgY2xpY2sgaGFuZGxlcixcclxuICAgKiBTdG9yZSBFbGVtZW50cyBvbiBTdWJNZW51IGluc3RhbmNlIHByb3BlcnRpZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGNyZWF0ZU1lbnVFbGVtZW50KCB0YXJnZXQgKSB7XHJcblxyXG4gICAgdmFyIG5hdiA9IFtdLCBtZW51SXRlbXMgPSBbXSwgbWVudVBpbGxzID0gW10sXHJcbiAgICAgICAgdGl0bGUsIGl0ZW0sIHBvcyxcclxuICAgICAgICBzZWxmID0gdGhpcztcclxuXHJcbiAgICAvLyBDcmVhdGluZyBzdWJNZW51IGNvbnRhaW5lci5cclxuICAgIHZhciAkc3ViU2VjdGlvbnMgPSB0YXJnZXQuZmluZCgnLicgKyB0aGlzLnNldHRpbmdzLnN1YlNlbGVjdG9yKSxcclxuICAgICAgICBkaXYgPSAkKCc8ZGl2Lz4nKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy53cmFwcGVyQXR0cnMuY2xhc3MpXHJcbiAgICAgICAgICAgIC5jc3ModGhpcy5zZXR0aW5ncy53cmFwcGVyQ1NTKSxcclxuICAgICAgICB1bCA9ICQoJzx1bC8+JykuYXBwZW5kVG8oZGl2KSxcclxuICAgICAgICBuYXZQaWxscyA9ICQoJzxzcGFuLz4nKVxyXG4gICAgICAgICAgICAuYWRkQ2xhc3ModGhpcy5zZXR0aW5ncy5uYXZQaWxsc0F0dHJzLmNsYXNzKVxyXG4gICAgICAgICAgICAuY3NzKHRoaXMuc2V0dGluZ3MubmF2UGlsbHNDU1MpXHJcbiAgICAgICAgICAgIC5hcHBlbmRUbyhkaXYpO1xyXG5cclxuICAgIC8vIERPTSBlbGVtZW50IGludG8gd2hpY2ggc3ViTWVudSB3aWxsIGJlIGluamVjdGVkLiBEZWZhdWx0IGlzIGpRdWVyeSBvYmplY3Qgd2UgYXJlIHdvcmtpbmcgb24uXHJcbiAgICB2YXIgbWVudVRhcmdldCA9ICggdGhpcy5zZXR0aW5ncy5tZW51VGFyZ2V0ICkgPyBnaXZlTWVKcSggdGhpcy5zZXR0aW5ncy5tZW51VGFyZ2V0ICkgOiB0YXJnZXQ7XHJcblxyXG4gICAgLy8gQ3JlYXRpbmcgc3ViTWVudSBlbnRyaWVzIGZvciBlYWNoIHN1Yi1tZW51IHNlY3Rpb24uXHJcbiAgICAkc3ViU2VjdGlvbnMuZWFjaCggZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgJHRoaXMgPSAkKCB0aGlzICk7XHJcblxyXG4gICAgICAvLyBTZWFyY2hpbmcgc3ViIG1lbnUgc2VjdGlvbiB0aXRsZS5cclxuICAgICAgdGl0bGUgPSAkdGhpcy5kYXRhKCdzc20tdGl0bGUnKTtcclxuICAgICAgLy8gQ3JlYXRpb24gc3ViIG1lbnUgZW50cmllcyBlbGVtZW50cy5cclxuICAgICAgaXRlbSA9IGh0bWxFbGVtZW50Q29uc3RydWN0b3IuY2FsbCggc2VsZiwgdGl0bGUgKTtcclxuICAgICAgdWwuYXBwZW5kKCBpdGVtLmxpICk7XHJcbiAgICAgIC8vIENhbGN1bGF0ZSBhbmQgc3RvcmUgc3ViIG1lbnUgZWxlbWVudHMgcG9zaXRpb25zLCBhbmQgY29ycmVzcG9uZGluZyBzdWItc2VjdGlvbnMgcG9zaXRpb25zLlxyXG4gICAgICBwb3MgPSBlbGVtZW50UG9zaXRpb24uY2FsbChzZWxmLCAkdGhpcywgaXRlbS5zcGFuLCBpdGVtLnBpbGxzICk7XHJcbiAgICAgIC8vIEFwcGx5aW5nIGNsaWNrIGhhbmRsZXIgb24gc3ViIG1lbnUgZWxlbWVudHMuXHJcbiAgICAgIGl0ZW0uc3Bhbi5jbGljayggaGFuZGxlclNlbGVjdG9yLmJpbmQoIHNlbGYsICdjbGlja0hhbmRsZXJGbicsIHBvcyApICk7XHJcbiAgICAgIC8vIFN0b3JlIGVsZW1lbnRzIG9uIGFycmF5cy5cclxuICAgICAgbmF2LnB1c2goIHBvcyApO1xyXG4gICAgICBtZW51SXRlbXMucHVzaCggaXRlbS5zcGFuICk7XHJcbiAgICAgIG1lbnVQaWxscy5wdXNoKCBpdGVtLnBpbGxzICk7XHJcbiAgICAgIC8vIENhbGwgZW50cnkgZWxlbWVudCBjYWxsYmFjaywgaWYgZGVmaW5lIGluIHNldHRpbmdzLlxyXG4gICAgICBpZiAodHlwZW9mIHNlbGYuc2V0dGluZ3MuZWxlbWVudENyZWF0ZUNhbGxiYWNrID09PSAnZnVuY3Rpb24nICl7XHJcbiAgICAgICAgc2VsZi5zZXR0aW5ncy5lbGVtZW50Q3JlYXRlQ2FsbGJhY2suY2FsbChpdGVtLmxpLCAkdGhpcywgc2VsZik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEluamVjdCBzdWJNZW51IGluIHRoZSBET00uXHJcbiAgICBtZW51VGFyZ2V0LmFwcGVuZChkaXYpO1xyXG5cclxuICAgIC8vIFN0b3JlIGVsZW1lbnRzIGFuZCB2YWx1ZXMgb24gU3ViTWVudSBpbnN0YW5jZSBwcm9wZXJ0aWVzLlxyXG4gICAgdGhpcy5uYXZpZ2F0aW9uID0gbmF2O1xyXG4gICAgdGhpcy5tZW51ID0ge1xyXG4gICAgICB3cmFwcGVyOiBkaXYsXHJcbiAgICAgIG1lbnVJdGVtczogbWVudUl0ZW1zLFxyXG4gICAgICBtZW51UGlsbHM6IG1lbnVQaWxscyxcclxuICAgICAgbmF2UGlsbHM6IHtcclxuICAgICAgICBuYXZQaWxsczogbmF2UGlsbHMsXHJcbiAgICAgICAgaGVpZ2h0OiBuYXZQaWxscy5vdXRlckhlaWdodCgpXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgLy8gQ2FsY3VsYXRlIGFuZCBzdG9yZSBtZW51IGVsZW1lbnRzIHBvc2l0aW9ucywgdXNpbmcgaW4gbW92aW5nIHBpbGxzIGFuaW1hdGlvbi5cclxuICAgIHNldFBpbGxzUG9zaXRpb24uY2FsbCh0aGlzKTtcclxuXHJcbiAgICAvKiBCeSBkZWZhdWx0LCBoaWRlIHN1Yk1lbnUuXHJcbiAgICAgQXQgdGhlIGFuZCBvZiB0aGUgaW5pdGlhbGl6YXRpb24sIHdoZW4gc2Nyb2xsIGhhbmRsZXIgaXMgY2FsbGVkLFxyXG4gICAgIHRoaXMgaGlkZGVuIHN0YXRlIGNhbiBiZSBzd2l0Y2hlZCBhY2NvcmRpbmcgdG8gc2Nyb2xsIHBvc2l0aW9uLiAqL1xyXG4gICAgdGhpcy5tZW51LndyYXBwZXIuY3NzKHtkaXNwbGF5Oidub25lJ30pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogU2Nyb2xsaW5nIGhhbmRsZXIuXHJcbiAgICogQ2FsbCBzaG93IC8gaGlkZSBmdW5jdGlvbnMgZm9yIHN1Yk1lbnUgYXBwYXJpdGlvbnMuXHJcbiAgICogRGV0ZXJtaW5hdGUgd2hpY2ggc3ViIHNlY3Rpb24gaXMgYWN0aXZlIGFjY29yZGluZyB0byBzY3JvbGxiYXIgcG9zaXRpb24uXHJcbiAgICogQ2FsbCAnd2hpbGUnIGFjdGlvbnMgd2hlbiBzdWIgc2VjdGlvbiBpcyBhY3RpdmF0aW9uLiBCeSBkZWZhdWx0LCB0aGlzIGFjdGlvbiBpcyBtb3ZpbmcgcGlsbHMuXHJcbiAgICpcclxuICAgKi9cclxuICBmdW5jdGlvbiBzY3JvbGxIYW5kbGVyKCkge1xyXG4gICAgdmFyIHkgPSBnZXRTY3JvbGxZKCksXHJcbiAgICAgICAgbCA9IHRoaXMubmF2aWdhdGlvbi5sZW5ndGgsXHJcbiAgICAgICAgaTtcclxuXHJcbiAgICAvLyBJZiBubyBpbnRvIHNlY3Rpb24sIHN1Yk1lbnUgd2UgY2FsbCBhbmltRXhpdCBmdW5jLCBhbmQgcmV0dXJuLlxyXG4gICAgaWYgKCB5IDwgdGhpcy5yYW5nZS5taW4gfHwgeSA+IHRoaXMucmFuZ2UubWF4ICkge1xyXG4gICAgICBpZiAodGhpcy5hY3RpdmUpIHtcclxuICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgIGhhbmRsZXJTZWxlY3Rvci5jYWxsKHRoaXMsICdhbmltRXhpdEZuJyk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gSWYgaW50byBzZWN0aW9uIHdlIGNhbGwgYW5pbUVudGVyLlxyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlmKCAhdGhpcy5hY3RpdmUgfHwgdGhpcy5zdGF0ZS5iYWJ5KSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgIGhhbmRsZXJTZWxlY3Rvci5jYWxsKHRoaXMsICdhbmltRW50ZXJGbicpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRm9yIGVhY2ggc3ViIHNlY3Rpb24sIGRldGVybWluYXRlIGlmIHdlIGFyZSBpbnRvLlxyXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xyXG5cclxuICAgICAgLy8gSWYgaW50byB0aGUgc3ViIHNlY3Rpb24uXHJcbiAgICAgIGlmICggaXNJblJhbmdlKHRoaXMubmF2aWdhdGlvbltpXSwgeSwgdGhpcy5zZXR0aW5ncy5kZWx0YSkgKSB7XHJcbiAgICAgICAgLy8gQW5kIGlmIHdlIGp1c3QgY29tZSBpbnRvLlxyXG4gICAgICAgIGlmICggaSAhPT0gdGhpcy5zdGF0ZS5hY3RpdmUgKSB7XHJcbiAgICAgICAgICAvLyBBcHBseWluZyBhY3RpdmUgQ2xhc3MuXHJcbiAgICAgICAgICB0aGlzLm5hdmlnYXRpb25baV0ubWVudUVsbXQubWVudUVsbXQuYWRkQ2xhc3MoIHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MgKTtcclxuICAgICAgICAgIC8vIFNldHRpbmdzIHN1YiBzZWN0aW9uIGluZGV4LlxyXG4gICAgICAgICAgdGhpcy5zdGF0ZS5hY3RpdmUgPSBpO1xyXG4gICAgICAgICAgLy8gQ2FsbGluZyB3aGlsZSBmdW5jdGlvbi5cclxuICAgICAgICAgIGhhbmRsZXJTZWxlY3Rvci5jYWxsKHRoaXMsICdhbmltV2hpbGVGbicsIGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSWYgbm8gaW50byB0aGUgc3ViIHNlY3Rpb24uXHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vIFJlbW92aW5nIGFjdGl2ZSBjbGFzcy5cclxuICAgICAgICB0aGlzLm5hdmlnYXRpb25baV0ubWVudUVsbXQubWVudUVsbXQucmVtb3ZlQ2xhc3MoIHRoaXMuc2V0dGluZ3MuYWN0aXZlQ2xhc3MgKTtcclxuICAgICAgICAvLyBCdXQgaWYgc3ViIHNlY3Rpb24gaW5kZXggbWF0Y2ggdG8gYWN0aXZlLCB3ZSB0dXJuIG9mZi5cclxuICAgICAgICBpZiAoIGkgPT09IHRoaXMuc3RhdGUuYWN0aXZlICkge1xyXG4gICAgICAgICAgdGhpcy5zdGF0ZS5hY3RpdmUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENhbGxpbmcgc3RlcCBieSBzdGVwIHNjcm9sbCBjYWxsYmFjaywgaWYgZGVmaW5lIGluIHNldHRpbmdzLlxyXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNldHRpbmdzLnNjcm9sbFN0ZXBDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aGlzLnNldHRpbmdzLnNjcm9sbFN0ZXBDYWxsYmFjay5jYWxsKHRoaXMsIGkpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmVzaXplIEhhbmRsZXIuXHJcbiAgICogUmVzZXQgYW5kIGNhbGN1bGF0ZSBhbGwgbmV3IHBvc2l0aW9ucyB2YWx1ZXMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb2JqIC0galF1ZXJ5IG9iamVjdCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIG9uUmVzaXplKCBvYmogKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMubmF2aWdhdGlvbi5sZW5ndGgsIGksIGl0ZW07XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICBpdGVtID0gZWxlbWVudFBvc2l0aW9uLmNhbGwoIHRoaXMsIHRoaXMubmF2aWdhdGlvbltpXS5lbG10ICk7XHJcbiAgICAgIHRoaXMubmF2aWdhdGlvbltpXS5zdGFydCA9IGl0ZW0uc3RhcnQ7XHJcbiAgICAgIHRoaXMubmF2aWdhdGlvbltpXS5lbmQgPSBpdGVtLmVuZDtcclxuICAgIH1cclxuICAgIHNldFNlY3Rpb25SYW5nZS5jYWxsKHRoaXMsIG9iaik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZXR1cm4gc3ViIG1lbnUgZW50cnkgZWxlbWVudCwgYXMgalF1ZXJ5IG9iamVjdHMuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGl0bGUgLSBzdWIgbWVudSBlbnRyeSB0aXRsZS5cclxuICAgKiBAcmV0dXJucyB7e2xpOm9iamVjdCwgc3BhbjpvYmplY3QsIHBpbGxzOm9iamVjdH19IC0galF1ZXJ5IG9iamVjdHMuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBodG1sRWxlbWVudENvbnN0cnVjdG9yKCB0aXRsZSApIHtcclxuICAgIHZhciBsaSA9ICQoJzxsaS8+Jyk7XHJcbiAgICB2YXIgc3BhbiA9ICQoJzxzcGFuLz4nKVxyXG4gICAgICAgIC5hZGRDbGFzcyh0aGlzLnNldHRpbmdzLmVsZW1lbnRBdHRycy5jbGFzcylcclxuICAgICAgICAuY3NzKHRoaXMuc2V0dGluZ3MuZWxlbWVudENTUylcclxuICAgICAgICAudGV4dCh0aXRsZSlcclxuICAgICAgICAuYXBwZW5kVG8obGkpO1xyXG4gICAgdmFyIHBpbGxzID0gJCgnPHNwYW4vPicpXHJcbiAgICAgICAgLmFkZENsYXNzKHRoaXMuc2V0dGluZ3MucGlsbHNBdHRycy5jbGFzcylcclxuICAgICAgICAuY3NzKHRoaXMuc2V0dGluZ3MucGlsbHNDU1MpXHJcbiAgICAgICAgLmFwcGVuZFRvKHNwYW4pO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbGk6bGksXHJcbiAgICAgIHNwYW46c3BhbixcclxuICAgICAgcGlsbHM6cGlsbHNcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDYWxjdWxhdGUgYW5kIHNldCBwb3NpdGlvbnMgb2YgYSBzdWJNZW51IGVudHJ5LCBhbmQgY29ycmVzcG9uZGluZyBzdWItc2VjdGlvbi5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbG10IC0galF1ZXJ5IG9iamVjdCBtYXRjaGluZyB0aGUgc3ViLXNlY3Rpb24gZWxlbWVudC5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gbWVudUVsbXQgLSBqUXVlcnkgb2JqZWN0IHN1Yk1lbnUgZW50cnkgdGFyZ2V0aW5nIHN1Yi1zZWN0aW9uIGVsZW1lbnQuXHJcbiAgICogQHBhcmFtIHtvYmplY3R9IHBpbGxzIC0galF1ZXJ5IG9iamVjdCwgZGVjb3JhdGluZyBwaWxscy5cclxuICAgKiBAcmV0dXJucyB7e21lbnVFbG10OiB7bWVudUVsbXQ6ICgqfG51bGwpLCBwaWxsczogKCp8bnVsbCksIHRvcDogKiwgaGVpZ2h0OiAqfSwgZWxtdDogKiwgc3RhcnQ6IChXaW5kb3d8KiksIGVuZDogKn19XHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBlbGVtZW50UG9zaXRpb24oZWxtdCwgbWVudUVsbXQsIHBpbGxzKSB7XHJcbiAgICB2YXIgc3RhcnQsIGVuZCwgaCxcclxuICAgICAgICBtZSA9IG1lbnVFbG10IHx8IG51bGwsXHJcbiAgICAgICAgcGkgPSBwaWxscyB8fCBudWxsLFxyXG4gICAgICAgIHRvcCA9IG51bGwsXHJcbiAgICAgICAgaGVpZ2h0ID0gbnVsbDtcclxuXHJcbiAgICBzdGFydCA9IGVsbXQub2Zmc2V0KCkudG9wO1xyXG4gICAgaCA9IGVsbXQub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICBlbmQgPSBzdGFydCArIGg7XHJcblxyXG4gICAgLy8gU2kgbCdlbGVtZW50IGRlcGFzc2UgZHUgY2FkcmUgZGUgc2VjdGlvbiBwcmUtZGVmaW5pLCBvbiBwcmVuZCBsZSBtYXgtcmFuZ2UgZGUgbCdlbGVtZW50IGF2ZWMgc29uIGRlbHRhLlxyXG4gICAgdGhpcy5yYW5nZS5tYXggPSAodGhpcy5yYW5nZS5tYXggPCBlbmQgLSB0aGlzLnNldHRpbmdzLmRlbHRhKSA/IGVuZCAtIHRoaXMuc2V0dGluZ3MuZGVsdGEgOiB0aGlzLnJhbmdlLm1heDtcclxuXHJcbiAgICBpZiAoIG1lICkge1xyXG4gICAgICB0b3AgPSBtZS5wb3NpdGlvbigpLnRvcDtcclxuICAgICAgaGVpZ2h0ID0gbWUub3V0ZXJIZWlnaHQodHJ1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbWVudUVsbXQ6IHtcclxuICAgICAgICBtZW51RWxtdDogbWUsXHJcbiAgICAgICAgcGlsbHM6IHBpLFxyXG4gICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIGhlaWdodDogaGVpZ2h0XHJcbiAgICAgIH0sXHJcbiAgICAgIGVsbXQ6IGVsbXQsXHJcbiAgICAgIHN0YXJ0OiBzdGFydCxcclxuICAgICAgZW5kOiBlbmRcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGN1bGF0ZSBhbmQgc2V0IHBvc2l0aW9ucyBvZiBhIHN1Yk1lbnUgZW50cnksIGZvciBtb3ZpbmcgcGlsbHMgYW5pbWF0aW9ucy5cclxuICAgKlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIHNldFBpbGxzUG9zaXRpb24oKSB7XHJcbiAgICB2YXIgbCA9IHRoaXMubmF2aWdhdGlvbi5sZW5ndGgsIGksIGl0ZW07XHJcbiAgICBmb3IgKCBpID0gMDsgaSA8IGw7IGkrKykge1xyXG4gICAgICBpdGVtID0gdGhpcy5uYXZpZ2F0aW9uW2ldLm1lbnVFbG10O1xyXG4gICAgICBpdGVtLnRvcCA9IGl0ZW0ubWVudUVsbXQucG9zaXRpb24oKS50b3A7XHJcbiAgICAgIGl0ZW0uaGVpZ2h0ID0gaXRlbS5tZW51RWxtdC5vdXRlckhlaWdodCh0cnVlKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGwgdGhlIHJpZ2h0IGFuaW0gbWV0aG9kIG9yIGhhbmRsZXIuXHJcbiAgICogVGVzdCBpZiBjdXN0b20gZnVuY3Rpb25zIHNldCBieSB1c2VyIGFyZSByaWdodC5cclxuICAgKiBJZiB3cm9uZywgY2FsbCBkZWZhdWx0cyBtZXRob2RzIG9yIGFuaW1zLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIHRoZSBmdW5jdGlvbiBuYW1lLiBNdXN0IG1hdGNoIHRvIHByaXZhdGVzIG9yIHNldHRpbmdzIHByb3BlcnR5LlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fG51bWJlcnxzdHJpbmd8YXJyYXl9IHBhcmFtMVxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbTIgLSBNdXN0IGJlIEV2ZW50IG9iamVjdC5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGhhbmRsZXJTZWxlY3RvciAoIG1ldGhvZCwgcGFyYW0xLCBwYXJhbTIgKSB7XHJcblxyXG4gICAgdmFyIHAxID0gcGFyYW0xLCBwMiA9IHBhcmFtMjtcclxuXHJcbiAgICAvLyBJZiBwYXJhbTIsIGl0J3MgRXZlbnQgb2JqZWN0IGFuZCBuZWVkIHRvIGJlIHBhc3NlZCBvbiBmaXJzdC5cclxuICAgIGlmICggcGFyYW0yICkge1xyXG4gICAgICBwMSA9IHBhcmFtMjtcclxuICAgICAgcDIgPSBwYXJhbTE7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCB0eXBlb2YgdGhpcy5zZXR0aW5nc1ttZXRob2RdID09PSBcImZ1bmN0aW9uXCIgKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5nc1ttZXRob2RdLmNhbGwodGhpcywgcDEsIHAyKTtcclxuICAgICAgfVxyXG4gICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgICAgIHByaXZhdGVzW21ldGhvZF0uY2FsbCh0aGlzLCBwMSwgcDIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcHJpdmF0ZXNbbWV0aG9kXS5jYWxsKHRoaXMsIHAxLCBwMik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBcHBseWluZyBoYW5kbGVycyBvbiB3aW5kb3cuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gb2JqIC0galF1ZXJ5IG9iamVjdCB3ZSBhcmUgd29ya2luZyBvbi5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGFwcGx5SGFuZGxlcihvYmopIHtcclxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzY3JvbGxIYW5kbGVyLmJpbmQodGhpcykpO1xyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uUmVzaXplLmJpbmQodGhpcywgb2JqKSk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZXN0aW5nIGlmIG51bWJlciBpcyBpbiByYW5nZS5cclxuICAgKlxyXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBlbG10IC0gU3ViTWVudSBpbnN0YW5jZSBwcm9wZXJ0eSBzdG9yaW5nIHRhcmdldCBzdWItc2VjdGlvbiBwb3NpdGlvbnMuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gbnVtYmVyIHRvIHRlc3QuXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRlbHRhXHJcbiAgICogQHJldHVybnMge2Jvb2xlYW59IC0gdHJ1ZSBpZiBpbnNpZGUsIGZhbHNlIGlmIG91dHNpZGUuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBpc0luUmFuZ2UoIGVsbXQsIHZhbHVlLCBkZWx0YSApIHtcclxuICAgIHZhciBkID0gZGVsdGEgfHwgMDtcclxuICAgIHJldHVybiAoICh2YWx1ZSA+PSAoIGVsbXQuc3RhcnQgLSBkKSApICYmICh2YWx1ZSA8ICggZWxtdC5lbmQgLSBkKSApICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IGNsaWNrIGhhbmRsZXIuXHJcbiAgICpcclxuICAgKiBAcGFyYW0ge29iamVjdH0gZSAtIEV2ZW50IG9iamVjdC5cclxuICAgKiBAcGFyYW0ge29iamVjdH0gaXRlbSAtIHNldCBvZiB2YWx1ZXMgcmV0dXJuaW5nIGJ5ICdlbGVtZW50UG9zaXRpb24nIGZ1bmMuXHJcbiAgICAgKi9cclxuICBmdW5jdGlvbiBkZWZhdWx0Q2xpY2tIYW5kbGVyKCBlLCBpdGVtICkge1xyXG4gICAgJCggd2luZG93ICkuc2Nyb2xsVG9wKCBpdGVtLnN0YXJ0ICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IGhpZGRpbmcgYW5pbSBoYW5kbGVyLlxyXG4gICAqXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gZGVmYXVsdEFuaW1FeGl0KCkge1xyXG4gICAgdGhpcy5tZW51LndyYXBwZXIuZmFkZU91dCgpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVmYXVsdCBzaG93aW5nIGFuaW0gaGFuZGxlci5cclxuICAgKlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIGRlZmF1bHRBbmltRW50ZXIoKSB7XHJcbiAgICB0aGlzLm1lbnUud3JhcHBlci5mYWRlSW4oKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlZmF1bHQgYW5pbSB3aGlsZSBoYW5kbGVyLlxyXG4gICAqXHJcbiAgICogQHBhcmFtIHtudW1iZXJ9IG4gLSBhY3RpdmUgc3ViTWVudSBlbnRyeSBpbmRleC5cclxuICAgICAqL1xyXG4gIGZ1bmN0aW9uIGRlZmF1bHRBbmltV2hpbGVDYWxsYmFjayggbiApIHtcclxuICAgIHZhciBwaWxscywgbmV4dCwgdG9wLCBzZWxmLCBuYXYsIGRlbGF5LCBlbmQ7XHJcblxyXG4gICAgc2VsZiA9IHRoaXM7XHJcbiAgICBwaWxscyA9IHRoaXMubWVudS5uYXZQaWxscztcclxuICAgIG5hdiA9IHRoaXMubmF2aWdhdGlvbltuXTtcclxuICAgIG5leHQgPSBuYXYubWVudUVsbXQ7XHJcbiAgICBkZWxheSA9IHNlbGYuc2V0dGluZ3MuZGVmYXVsdEFuaW1XaGlsZURlbGF5O1xyXG4gICAgZW5kID0gc2VsZi5zZXR0aW5ncy5kZWZhdWx0QW5pbVdoaWxlRW5kO1xyXG5cclxuICAgIGlmICggdHlwZW9mIGRlbGF5ICE9PSAnbnVtYmVyJyApIHtcclxuICAgICAgZXJyb3IoICdzZXR0aW5ncycsICdkZWZhdWx0QW5pbVdoaWxlRGVsYXknICk7XHJcbiAgICAgIGRlbGF5ID0gZGVmYXVsdHMuZGVmYXVsdEFuaW1XaGlsZURlbGF5O1xyXG4gICAgfVxyXG4gICAgaWYgKCB0eXBlb2YgZW5kICE9PSAnbnVtYmVyJyApIHtcclxuICAgICAgZXJyb3IoICdzZXR0aW5ncycsICdkZWZhdWx0QW5pbVdoaWxlRW5kJyApO1xyXG4gICAgICBlbmQgPSBkZWZhdWx0cy5kZWZhdWx0QW5pbVdoaWxlRW5kO1xyXG4gICAgfVxyXG5cclxuICAgIG5hdi5tZW51RWxtdC5tZW51RWxtdC5yZW1vdmVDbGFzcyggc2VsZi5zZXR0aW5ncy5hY3RpdmVDbGFzcyApO1xyXG5cclxuICAgIHRvcCA9IG5leHQudG9wICsgTWF0aC5yb3VuZCggKG5leHQuaGVpZ2h0IC8gMikgKSAtIE1hdGgucm91bmQoIChwaWxscy5oZWlnaHQgLyAyKSApO1xyXG4gICAgcGlsbHMubmF2UGlsbHMuYWRkQ2xhc3MoIHNlbGYuc2V0dGluZ3MucGlsbHNBY3RpdmVDbGFzcyApLmFuaW1hdGUoe3RvcDogdG9wfSwgZGVsYXksIGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmIChuYXYgPT09IHNlbGYubmF2aWdhdGlvbltzZWxmLnN0YXRlLmFjdGl2ZV0pIHsgbmF2Lm1lbnVFbG10Lm1lbnVFbG10LmFkZENsYXNzKCBzZWxmLnNldHRpbmdzLmFjdGl2ZUNsYXNzICk7IH1cclxuICAgICAgbmF2Lm1lbnVFbG10LnBpbGxzLmFkZENsYXNzKHNlbGYuc2V0dGluZ3MuZGVmYXVsdEFuaW1XaGlsZUNsYXNzKS5kZWxheSggZW5kICkucXVldWUoZnVuY3Rpb24oKXtcclxuICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKHNlbGYuc2V0dGluZ3MuZGVmYXVsdEFuaW1XaGlsZUNsYXNzKS5jbGVhclF1ZXVlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgICBwaWxscy5uYXZQaWxscy5yZW1vdmVDbGFzcyggc2VsZi5zZXR0aW5ncy5waWxsc0FjdGl2ZUNsYXNzICk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvbHlmaWxsIGZvciB3aW5kb3cuc2Nyb2xsWS5cclxuICAgKiBAcmV0dXJucyB7Kn1cclxuICAgKi9cclxuICBmdW5jdGlvbiBnZXRTY3JvbGxZKCl7XHJcbiAgICB2YXIgc3VwcG9ydFBhZ2VPZmZzZXQgPSB3aW5kb3cucGFnZVhPZmZzZXQgIT09IHVuZGVmaW5lZCxcclxuICAgICAgICBpc0NTUzFDb21wYXQgPSAoKGRvY3VtZW50LmNvbXBhdE1vZGUgfHwgXCJcIikgPT09IFwiQ1NTMUNvbXBhdFwiKTtcclxuICAgIHJldHVybiBzdXBwb3J0UGFnZU9mZnNldCA/IHdpbmRvdy5wYWdlWU9mZnNldCA6IGlzQ1NTMUNvbXBhdCA/IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgOiBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcDtcclxuICB9XHJcblxyXG5cclxufSkoalF1ZXJ5LCB0aGlzLCB0aGlzLmRvY3VtZW50KTsiXX0=
