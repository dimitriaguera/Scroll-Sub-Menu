# Scroll-Sub-Menu - A free jQuery plugin

### What's this ?

Scroll-Sub-Menu is a jQuery plugin that creates contextual and animated sub-menu for target section.

### Browser Support

IE 9+, Chrome, Firefox, Safari, Opera.

### Start

Let's create html element containing sub elements width "ssm-section" class, and a "data-ssm-title" attribute.

```html
		<div id="target">
			<h1>Section 1</h1>
			<div data-ssm-title="sub-section title 1" class="ssm-section">
			    <h2>Section 1 - Sub section 1</h2>
			</div>
			<div data-ssm-title="sub-section title 2" class="ssm-section">
			    <h2>Section 1 - Sub-section 2</h2>
			</div>
			<div data-ssm-title="sub-section title 3" class="ssm-section">
			    <h2>Section 1 - Sub-section 3</h2>
			</div>
		</div>
```

Just apply ScrollSubMenu on parent element.

```javascript
    $("#target").ScrollSubMenu();
```

Contextual sub-menu of '#target' element is now created.
This sub-menu contains entries pointing for all ".ssm-section"
elements in '#target' element. Each entry title comes from "data-ssm-title" attribute.
This menu appears when the '#target' element enters the viewport screen.

ScrollSubMenu allows multi-target.

```javascript
    $(".targets").ScrollSubMenu();
```
ScrollSubMenu is a statefull plugin that create SubMenu instances for each element.
For example :

```html
		<div class="targets">
			<h1>Section 1</h1>
			<div data-ssm-title="sub-section 1 title 1" class="ssm-section">
			    <h2>Section 1 - Sub section 1</h2>
			</div>
			<div data-ssm-title="sub-section 1 title 2" class="ssm-section">
			    <h2>Section 1 - Sub-section 2</h2>
			</div>
		</div>

		<div class="targets">
   			<h1>Section 2</h1>
        	<div data-ssm-title="sub-section 2 title 1" class="ssm-section">
        	    <h2>Section 2 - Sub section 1</h2>
        	</div>
        	<div data-ssm-title="sub-section 2 title 2" class="ssm-section">
        		<h2>Section 2 - Sub-section 2</h2>
        	</div>
        </div>
```

You can create a sub menu for all ".targets" class elements, and then store different settings.

```javascript

        $(".targets").ScrollSubMenu();

        // Store new settings on the first target element.
        $(".targets").eq(0).ScrollSubMenu({
            animWhileDelay: 200
        });

        // Store different settings on the second target element.
        $(".targets").eq(1).ScrollSubMenu({
            animWhileDelay: 400
        });
```

Options allows changing sub-sections target class, and several others things.

### Options

Scroll-Sub-Menu has several properties, events, and methods to interact with the control programmatically.

```javascript
	$("#target").ScrollSubMenu({

	        // Settings properties.
		    menuTarget: null,
            lineActive: 'middle',
            deltaSectionEnd: 'middle',
            subSelector: 'ssm-section',
            animWhileDelay: 100,
            animWhileEnd: 1000,

            // Theming properties.
            activeClass: 'ssm-sub-active',
            pillsActiveClass: 'ssm-pills-active',
            animWhileClass: 'ssm-radar',
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
