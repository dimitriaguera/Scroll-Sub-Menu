(function ($, window, document, undefined) {
  'use strict';

  $('#cont1').ScrollSubMenu();

  $('#cont2').ScrollSubMenu({

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

  $('#cont3').ScrollSubMenu({animWhileClass:''});

})($, this, this.document);