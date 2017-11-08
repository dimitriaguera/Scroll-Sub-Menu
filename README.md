# Scroll-Sub-Menu - A free jQuery plugin

### What's this ?

Scroll-Sub-Menu is a jQuery plugin that creates contextual and animated sub-menu for target section.

### Browser Support

IE 9+, Chrome, Firefox, Safari, Opera.

### Manual installation

**Note  :** *jquery.scroll-sub-menu.min.js* have a dependency on **jQuery 2.2+**.

There currently are two ways to get Scroll-Sub-Menu.
Download and use lastest files ```dist/jquery.scroll-sub-menu.min.js``` and ```dist/scroll-sub-menu.min.css```

```
https://github.com/dimitriaguera/Scroll-Sub-Menu/archive/master.zip
```

### GitHub

Clone the following repository into your projects directory structure.

```
git clone https://github.com/dimitriaguera/Scroll-Sub-Menu.git
```

Environment installation for developers. Point on `src/` folder, and run a `npm install`.
Now, you can use **Gulp task-runner scripts**:
- `gulp` - watch js, scss files on `src/` folder. Compile and write on *scroll-sub-menu.css* and *jquery-scroll-sub-menu.js*.
- `gulp build` - Clean `dist/` folder, concat, compile and write on *scroll-sub-menu.css* and *jquery-scroll-sub-menu.js* in `dist/` folder.
- `gulp build --production`  - Clean `dist/` folder, concat, compile, minify, uglify and write on *scroll-sub-menu.min.css* and *jquery-scroll-sub-menu.min.js* in `dist/` folder.

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

Just apply ScrollSubMenu on target jQuery element.

```javascript
    $("#target").ScrollSubMenu();
```

Contextual sub-menu of '#target' element is now created.
This sub-menu contains entries pointing for all ".ssm-section"
elements in '#target' element. Each entry title comes from "data-ssm-title" attribute.
This menu appears when the '#target' element enters the viewport screen.

### Multi-targeting

ScrollSubMenu allows multi-target.

```javascript
    $(".targets").ScrollSubMenu();
```

### Statefull plugin

ScrollSubMenu is a statefull plugin that creates **SubMenu** instances for each element.

SubMenu instance object is stored on `data.subMenuPlugin.subMenuInstance` property of the jQuery target element.

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
            animWhileDelay: 200,
            speedScroll: 200,
        });

        // Store different settings on the second target element.
        $(".targets").eq(1).ScrollSubMenu({
			animEnterFn: function(){
				this.menu.wrapper.css({display:'block'}).find('li').each(function(i){
					var el = $(this).css({marginLeft:'-100%', opacity:0});
					setTimeout(function() {
						el.animate({
							marginLeft: '0',
							opacity:1
						}, 100);
					}, i * 100);
				});
			},
			animExitFn: function(){
				this.menu.wrapper.find('li').each(function(i){
					var el = $(this);
					setTimeout(function() {
						el.animate({
							marginLeft: '-100%',
							opacity:0
						}, 100);
					}, i * 100);
				});
			}
        });
```

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

### Settings properties

**menuTarget** - *(type : jQuery Object | string)*

Element in which the sub-menu is inserted.

Default value: `null` (if `null`, sub-menu is inserted in jQuery element which is applied `.ScrollSubMenu()` method.)

----------------------

**lineActive** - *(type : String [top|middle|bottom] | Number)*

Define from top viewport line position that trigger sub-section change, and the sub-menu animEnterFn.

Default value: `middle`

----------------------

**deltaSectionEnd** - *(type : String [top|middle|bottom] | Number)*

Define from bottom viewport line position that trigger the sub-menu animExitFn.

Default value: `middle`

---------------------

**subSelector** - *(type : String)*

Class name for sub-section target. This class is used for build sub-menu.

Default value: `ssm-section`

---------------------

**scrollSpeed** - *(type : Integer)*

An integer for speed scrolling animation in millisecond.
If set to 0 no scroll animation.

Default value: 200

----------------------

**scrollEasing** - *(type : String)*

Easing for scrolling animation. Must be jQuery (UI ?) easing string.
No impact if scrollSpeed setting is set to 0.

Default value: 'swing'

----------------------

**animWhileDelay** - *(type : Number)*

Time for default animWhileFn animation that move pill on sub-menu.

Default value: `100`

----------------------

**animWhileEnd** - *(type : Number)*

Time for default animation that show / hide sub-menu.

Default value: `1000`

---------------------------

### Theming properties

Default sub-menu html structure :
- `<div>` [wrapper]
	- `<span>` [nav-pills] - moving element
	- `<ul>`
		- `<li>`
			- `<span>` [element] - contain sub-title
				- `<span>` [pills] - decorative element.

----------------------

**activeClass** - *(type : String)*

Class adds to active [element] in sub-menu.

Default value: `ssm-sub-active`

--------------------------

**pillsActiveClass** - *(type : String)*

Class adds to active [pills] in sub-menu.

Default value: `ssm-pills-active`

--------------------------

**animWhileClass** - *(type : String)*

Animation Class adds to active [pills] in sub-menu.

Default value: `ssm-radar`

--------------------------

**wrapperAttrs** - *(type : Object)*

Attributes add to sub-menu [wrapper].

Default value: `{class: 'ssm-sub-menu'}`

--------------------------

**elementAttrs** - *(type : Object)*

Attributes add to sub-menu [element].

Default value: `{class: 'ssm-elmt'}`

--------------------------

**pillsAttrs** - *(type : Object)*

Attributes add to sub-menu [pills].

Default value: `{class: 'ssm-pills ssm-cn'}`

--------------------------

**navPillsAttrs** - *(type : Object)*

Attributes add to sub-menu's moving element [nav-pills].

Default value: `{class: 'ssm-nav-pills'}`

--------------------------

### Events

`null` value automatically calls defaults animFn.
All those functions are called with `this` pointing the instance of **SubMenu** object.

**animExitFn** - *(type : Function)*

Function called when Exit Event is triggered.

Default value : `null` -> `defaultAnimExit` is called.

--------------------------

**animEnterFn** - *(type : Function)*

Function called when Enter Event is triggered.

Default value : `null` -> `defaultAnimEnter` is called.

--------------------------

**animWhileFn** - *(type : Function)*

Function called when sub-menu active element change.

Called with arguments : *index* (type : Number) - Index of the sub-section active.

Default value: `null` -> `defaultAnimWhile` is called.

--------------------------

**clickHandlerFn** - *(type : Function)*

Function handler triggered when click event occurs on sub-menu [element].

Called with arguments : *event* (type : Object) / *position* (type : Object).

Default value: `null` -> `defaultClickHandler` is called.

--------------------------

**elementCreateCallback** - *(type : Function)*

Function called rigth before the sub-menu is injected in the DOM.

Default value: `null` -> none

--------------------------

**scrollStepCallback** - *(type : Function)*

Function called on each scroll event.

Default value: `null` -> none


### Licence

Scroll-Sub-Menu is licensed under the terms of the [MIT license](http://roundsliderui.com/licence.html "roundSlider - MIT licence").
