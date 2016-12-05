# Scroll-Sub-Menu - A free jQuery plugin

### What's this ?

Scroll-Sub-Menu is a jQuery plugin that creates contextual and animated sub-menu for target section.

### Browser Support

IE 9+, Chrome, Firefox, Safari, Opera.

Installation
---------------------------
**Note:** jquery.scroll-sub-menu.min.js have a dependency on jQuery 3.1+.
There currently are two ways to get Scroll-Sub-Menu.

### Manual
Download lastest files ```dist/jquery.scroll-sub-menu.min.js``` and ```dist/scroll-sub-menu.min.css```

```
https://github.com/dimitriaguera/Scroll-Sub-Menu
```

### GitHub
Clone the following repository into your projects directory structure.

```
git clone https://github.com/dimitriaguera/Scroll-Sub-Menu.git
```

Start
---------------------------

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
ScrollSubMenu is a statefull plugin that creates SubMenu instances for each element.
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

Create a sub menu for all ".targets" class elements, and then store different settings whenever you need in your code.

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

Options and settings
---------------------------

Options allows changing sub-sections target class, and several others things.

### Default options

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

            //Events. Null value automatically calls default animFn.
            animExitFn: null,
            animEnterFn: null,
            animWhileFn: null,
            clickHandlerFn: null,
            elementCreateCallback: null,
            scrollStepCallback: null
	});
```

### Options details.

####Settings properties.

- menuTarget (type jQuery Object | string)
	Element in which the sub-menu is inserted.
	Default value: `null` (if `null`, sub-menu is inserted in jQuery element which is applied `.ScrollSubMenu()` method.)

- lineActive (type String [top|middle|bottom] | Number)
	Define from top viewport line position that trigger sub-section change, and the sub-menu animEnterFn.
	Default value: `middle`

- deltaSectionEnd (type String [top|middle|bottom] | Number)
	Define from bottom viewport line position that trigger the sub-menu animExitFn.
	Default value: `middle`

- subSelector: (type String)
	Class name for sub-section target. This class is used for build sub-menu.
	Default value: `ssm-section`

- animWhileDelay: (type: Number)
	Time for default animWhileFn animation that move pill on sub-menu.
	Default value: `100`

- animWhileEnd:(type: Number)
	Time for default animation that show / hide sub-menu.
	Default value: `1000`

####Theming properties.

Default sub-menu html structure :
+ <div> [wrapper]
	++ <ul>
		+++ <li>
			++++ <span> [element] - contain sub-title
				+++++ <span> [pills] - decorative element.
	++ <span> [nav-pills] - moving element


- activeClass: 
	Class adds to active [element] in sub-menu.
	Default value: `ssm-sub-active`
- pillsActiveClass: 
	Class adds to active [pills] in sub-menu.
	Default value: `ssm-pills-active`
- animWhileClass:
	Animation Class adds to active [pills] in sub-menu.
	Default value: `ssm-radar`
- wrapperAttrs: 
	Attributes add to sub-menu [wrapper].
	Default value: `{class: 'ssm-sub-menu'}`
- elementAttrs: 
	Attributes add to sub-menu [element].
	Default value: `{class: 'ssm-elmt'}`
- pillsAttrs: 
	Attributes add to sub-menu [pills].
	Default value: `{class: 'ssm-pills ssm-cn'}`
- navPillsAttrs: 
	Attributes add to sub-menu's moving element [nav-pills].
	Default value: `{class: 'ssm-nav-pills'}`

####Events.
Null value automatically calls defaults animFn.

- animExitFn : (type: Function)
	Function called when Exit Event is triggered.
	Default value : `null` -> defaultAnimExit is called.
- animEnterFn : 
	Function called when Enter Event is triggered.
	Default value : `null` -> defaultAnimEnter is called.
- animWhileFn: 
	Function called when sub-menu active element change.
	Default value: `null` -> defaultAnimWhile is called.
- clickHandlerFn: 
	Function registered has listner for click event on sub-menu [element].
	Default value: `null` -> defaultClickHandler is called.
- elementCreateCallback: 
	Function called rigth before the sub-menu is injected in the DOM.
	Default value: `null` -> none
- scrollStepCallback: 
	Function called on each scroll event.
	Default value: `null` -> none


### Licence

Scroll-Sub-Menu is licensed under the terms of the [MIT license](http://roundsliderui.com/licence.html "roundSlider - MIT licence").
