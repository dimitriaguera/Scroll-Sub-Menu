(function ($, window, document, undefined) {
  'use strict';

  // Default settings.
  var defaults = {
    menuTarget : null,
    lineActive : 'middle',
    deltaSectionEnd: 'middle',
    subSelector: 'ssm-section',
    animWhileClass: 'ssm-radar',
    animWhileDelay: 100,
    animWhileEnd: 1000,
    activeClass: 'ssm-sub-active',
    pillsActiveClass: 'ssm-pills-active',
    wrapperAttrs: {class: 'ssm-sub-menu'},
    elementAttrs: {class: 'ssm-elmt'},
    pillsAttrs: {class: 'ssm-pills ssm-cn'},
    navPillsAttrs: {class: 'ssm-nav-pills'},
    wrapperCSS: {},
    elementCSS: {},
    pillsCSS: {},
    navPillsCSS: {},
    animExitFn: null,
    animEnterFn: null,
    animWhileFn: null,
    clickHandlerFn: null,
    elementCreateCallback: null,
    scrollStepCallback: null,
    scrollSpeed: 200,
    scrollEasing: 'swing',
  };

  // Errors messages.
  var errors = {
    selector: {basic:'Argument must be element ID string or jQuery object.'},
    noResult: {basic:'Wrong ID, no jQuery object match.'},
    settings: {
      basic:'Unrecognized settings expression or wrong value.',
      animWhileDelay: 'animWhileDelay must be type Number.',
      animWhileEnd: 'animWhileEnd must be type Number.',
      menuTarget : 'menuTarget must be type String matching element ID or jQuery Object.',
      lineActive : 'lineActive must be type Number or String value top|middle|bottom.',
      deltaSectionEnd: 'deltaSectionEnd must be type Number or String value top|middle|bottom.',
      subSelector: 'subSelector must be type String.'
    },
    method: {
      basic:'Unrecognized method expression.',
      noInstance: 'SubMenu must be instancied before calling methods. Method wont be called.'
    }
  };

  // Privates functions. Using as default functions if no match or error in settings options.
  var privates = {
    animExitFn: defaultAnimExit,
    animEnterFn: defaultAnimEnter,
    animWhileFn: defaultAnimWhileCallback,
    clickHandlerFn: defaultSmoothClickHandler,
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
    init: function ( options, callback ) {
      return this.each(function() {

        var $this = $(this),
            data = $this.data('subMenuPlugin'),
            obj, settings = $.extend({}, defaults, options);

        // If no plugin spacename on data element.
        if ( !data ){
          // Creating new SubMenu object instance, and store it on data element.
          obj = new SubMenu( settings );
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
          if ( !data.subMenuInstance ) {
            // Instancying.
            obj = new SubMenu( settings );
            // Mergin data plugin spacename.
            $this.data('subMenuPlugin', $.extend( {}, data, {subMenuInstance: obj}));
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
    getMenuItems: function( options, callback ) {

        var $this = $(this),
            data = $this.data('subMenuPlugin');

        if ( !data || !data.subMenuInstance) {
          error( 'method', 'noInstance', 'getMenuItems' );
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
  $.fn.ScrollSubMenu = function( method, options, callback ) {

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
    else if ( !method && (typeof options === 'object' || ! options) ) {
      return methods.init.call(this, options, callback);
    }
    // If method does not exist, error is called.
    else {
      error( 'method', method );
    }
  };

  /**
   * SubMenu constructor.
   *
   * @param {object} settings - defaults modified by options.
   * @constructor
     */
  function SubMenu( settings ) {
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
  function initialiseSubMenu( obj, callback ) {

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
  function error ( type, subType, value ){

    var message = '', e;

    // If no entry on 'errors' object, type is considered as free message.
    if ( !errors[type] ){
      message = type;
    }
    // If no second deep.
    else if ( !errors[type][subType] ) {
      if ( subType ) {
        message += '\n' + 'Value "' + subType + '"';
      }
      message += '\n' + errors[type].basic;
    }
    // If second deep.
    else {
      if ( value ) {
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
            if ( input instanceof jQuery) {
              result = input;
            }
            else{
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
  function setSectionRange( target ) {
    var start = target.offset().top,
        h = target.outerHeight(),
        wh = $( window ).height(),
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
    }
    else {
      if (typeof this.settings.lineActive === 'number') {
        this.settings.delta = delta = this.settings.lineActive;
      }
      else {
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
    }
    else {
      if (typeof this.settings.deltaSectionEnd === 'number') {
        this.settings.deltaSection = deltaSection = this.settings.deltaSectionEnd;
      }
      else {
        error('settings', 'deltaSectionEnd', this.settings.deltaSectionEnd);
      }
    }

    // Store values on instance SubMenu.range property.
    this.range.min = start;
    this.range.max = (start + h) - deltaSection;
  }

  /**
   * Create subMenu element,
   * Inject subMenu on DOM,
   * Apply click handler,
   * Store Elements on SubMenu instance properties.
   *
   * @param {object} target - jQuery object we are working on.
     */
  function createMenuElement( target ) {

    var nav = [], menuItems = [], menuPills = [],
        title, item, pos,
        self = this;

    // Creating subMenu container.
    var $subSections = target.find('.' + this.settings.subSelector),
        div = $('<div/>')
            .addClass(this.settings.wrapperAttrs.class)
            .css(this.settings.wrapperCSS),
        ul = $('<ul/>').appendTo(div),
        navPills = $('<span/>')
            .addClass(this.settings.navPillsAttrs.class)
            .css(this.settings.navPillsCSS)
            .appendTo(div);

    // DOM element into which subMenu will be injected. Default is jQuery object we are working on.
    var menuTarget = ( this.settings.menuTarget ) ? giveMeJq( this.settings.menuTarget ) : target;

    // Creating subMenu entries for each sub-menu section.
    $subSections.each( function() {

      var $this = $( this );

      // Searching sub menu section title.
      title = $this.data('ssm-title');
      // Creation sub menu entries elements.
      item = htmlElementConstructor.call( self, title );
      ul.append( item.li );
      // Calculate and store sub menu elements positions, and corresponding sub-sections positions.
      pos = elementPosition.call(self, $this, item.span, item.pills );
      // Applying click handler on sub menu elements.
      item.span.click( handlerSelector.bind( self, 'clickHandlerFn', pos ) );
      // Store elements on arrays.
      nav.push( pos );
      menuItems.push( item.span );
      menuPills.push( item.pills );
      // Call entry element callback, if define in settings.
      if (typeof self.settings.elementCreateCallback === 'function' ){
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
    this.menu.wrapper.css({display:'none'});
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
    if ( y < this.range.min || y > this.range.max ) {
      if (this.active) {
        this.active = false;
        handlerSelector.call(this, 'animExitFn');
      }
      return;
    }
    // If into section we call animEnter.
    else {
      if( !this.active || this.state.baby) {
        this.active = true;
        handlerSelector.call(this, 'animEnterFn');
      }
    }

    // For each sub section, determinate if we are into.
    for (i = 0; i < l; i++) {

      // If into the sub section.
      if ( isInRange(this.navigation[i], y, this.settings.delta) ) {
        // And if we just come into.
        if ( i !== this.state.active ) {
          // Applying active Class.
          this.navigation[i].menuElmt.menuElmt.addClass( this.settings.activeClass );
          // Settings sub section index.
          this.state.active = i;
          // Calling while function.
          handlerSelector.call(this, 'animWhileFn', i);
        }
      }

      // If no into the sub section.
      else {
        // Removing active class.
        this.navigation[i].menuElmt.menuElmt.removeClass( this.settings.activeClass );
        // But if sub section index match to active, we turn off.
        if ( i === this.state.active ) {
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
  function onResize( obj ) {
    var l = this.navigation.length, i, item;
    for ( i = 0; i < l; i++) {
      item = elementPosition.call( this, this.navigation[i].elmt );
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
  function htmlElementConstructor( title ) {
    var li = $('<li/>');
    var span = $('<span/>')
        .addClass(this.settings.elementAttrs.class)
        .css(this.settings.elementCSS)
        .text(title)
        .appendTo(li);
    var pills = $('<span/>')
        .addClass(this.settings.pillsAttrs.class)
        .css(this.settings.pillsCSS)
        .appendTo(span);
    return {
      li:li,
      span:span,
      pills:pills
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
    var start, end, h,
        me = menuElmt || null,
        pi = pills || null,
        top = null,
        height = null;

    start = elmt.offset().top;
    h = elmt.outerHeight(true);
    end = start + h;

    // Si l'element depasse du cadre de section pre-defini, on prend le max-range de l'element avec son delta.
    this.range.max = (this.range.max < end - this.settings.delta) ? end - this.settings.delta : this.range.max;

    if ( me ) {
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
    }
  }

  /**
   * Calculate and set positions of a subMenu entry, for moving pills animations.
   *
   */
  function setPillsPosition() {
    var l = this.navigation.length, i, item;
    for ( i = 0; i < l; i++) {
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
  function handlerSelector ( method, param1, param2 ) {

    var p1 = param1, p2 = param2;

    // If param2, it's Event object and need to be passed on first.
    if ( param2 ) {
      p1 = param2;
      p2 = param1;
    }

    if ( typeof this.settings[method] === "function" ) {
      try {
        this.settings[method].call(this, p1, p2);
      }
      catch (e) {
        console.log(e);
        privates[method].call(this, p1, p2);
      }
    }
    else {
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
  function isInRange( elmt, value, delta ) {
    var d = delta || 0;
    return ( (value >= ( elmt.start - d) ) && (value < ( elmt.end - d) ) );
  }

  /**
   * Default click handler.
   *
   * @param {object} e - Event object.
   * @param {object} item - set of values returning by 'elementPosition' func.
     */
  function defaultClickHandler( e, item ) {
    $( window ).scrollTop( item.start );
      e.preventDefault();
  }

    /**
     * Default smooth scroll click handler.
     *
     * @param {object} e - Event object.
     * @param {object} item - set of values returning by 'elementPosition' func.
     * @param {integer} speed - scroll anomation speed, ms.
     *
     */
    function defaultSmoothClickHandler( e, item ) {

       var time = this.settings.scrollSpeed;
       var ease = this.settings.scrollEasing;

       if ( !time ) {
         return defaultClickHandler(e, item);
       }

        $('html, body').animate({
            scrollTop: item.start
        }, time, ease);

       e.preventDefault();
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
  function defaultAnimWhileCallback( n ) {
    var pills, next, top, self, nav, delay, end;

    self = this;
    pills = this.menu.navPills;
    nav = this.navigation[n];
    next = nav.menuElmt;
    delay = self.settings.animWhileDelay;
    end = self.settings.animWhileEnd;

    if ( typeof delay !== 'number' ) {
      error( 'settings', 'animWhileDelay' );
      delay = defaults.animWhileDelay;
    }
    if ( typeof end !== 'number' ) {
      error( 'settings', 'animWhileEnd' );
      end = defaults.animWhileEnd;
    }

    nav.menuElmt.menuElmt.removeClass( self.settings.activeClass );

    top = next.top + Math.round( (next.height / 2) ) - Math.round( (pills.height / 2) );
    pills.navPills.addClass( self.settings.pillsActiveClass ).animate({top: top}, delay, function(){
      if (nav === self.navigation[self.state.active]) { nav.menuElmt.menuElmt.addClass( self.settings.activeClass ); }
      nav.menuElmt.pills.addClass(self.settings.animWhileClass).delay( end ).queue(function(){
        $(this).removeClass(self.settings.animWhileClass).clearQueue();
      });
      pills.navPills.removeClass( self.settings.pillsActiveClass );
    });
  }

  /**
   * Polyfill for window.scrollY.
   * @returns {*}
   */
  function getScrollY(){
    var supportPageOffset = window.pageXOffset !== undefined,
        isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
    return supportPageOffset ? window.pageYOffset : isCSS1Compat ? document.documentElement.scrollTop : document.body.scrollTop;
  }


})(jQuery, this, this.document);