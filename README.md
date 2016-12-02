# Scroll-Sub-Menu - A free jQuery plugin

### What's this ?

Scroll-Sub-Menu is a jQuery plugin that creates contextual and animated sub-menu for target section.

### Browser Support

IE 9+, Chrome, Firefox, Safari, Opera.

### Options

Scroll-Sub-Menu has several properties, events, and methods to interact with the control programmatically.

```javascript
	$("#target").ScrollSubMenu({

	        // Properties.
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

            //Events.
            animExitFn: null,
            animEnterFn: null,
            animWhileFn: null,
            clickHandlerFn: null,
            elementCreateCallback: null,
            scrollStepCallback: null
	});
```

### Licence

Scroll-Sub-Menu is licensed under the terms of the [MIT license](http://roundsliderui.com/licence.html "roundSlider - MIT licence").
