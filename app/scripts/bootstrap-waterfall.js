/*
 * bootstrap-waterfall
 * 
 *
 * Copyright (c) 2014 
 * Licensed under the MIT license.
 */

+function ($) {
  'use strict';
  
  // http://underscorejs.org/ (1.7.0)
  var _ = _ || {
    now: Date.now || function () {
      return new Date().getTime();
    },
    throttle: function (func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      if (!options) options = {};
      var later = function() {
        previous = options.leading === false ? 0 : _.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function() {
        var now = _.now();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    }
  }
  
  var Waterfall = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, Waterfall.DEFAULTS, options)
    this.$pins = null
    this.lefts = []
    this.tops = []
    
    this.init()
  }
  
  Waterfall.VERSION = '0.0.1'
  
  Waterfall.DEFAULTS = {
  }
  
  Waterfall.prototype.init = function () {
    this
      .initPins()
      .calculatePosition()
      .runCompass()
      .ship()
  }
  
  Waterfall.prototype.initPins = function () {
    var $pins = $($('*[type="text/bootstrap-waterfall-template"]').html())
    $pins.each(function () {
      var $img = $(this).find('img:eq(0)')
      if ($img.length > 0) {
        $img
          .attr('data-bootstrap-waterfall-src', $img.attr('src'))
          .attr('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
      }
    })
    this.$pins = $pins
    
    return this
  }
  
  Waterfall.prototype.calculatePosition = function () {
    var $fake = this.$pins.first().clone()
    this.$element.append($fake)
    
    var width = $fake.outerWidth(true)
    var countsPerRow = parseInt((this.$element.width() / width), 10)
    
    for (var i = 0; i < countsPerRow; i++) {
      this.lefts.push(i * width)
      this.tops.push(0)
    }
    
    $fake.remove()
    
    return this
  }
  
  Waterfall.prototype.runCompass = function () {
    var that = this
    var timerId = setInterval(function () {
      if (that.$element.closest('body').length < 1) { // Check if user had left the page.
        clearInterval(timerId)
        that.destroy()
      }
    }, 777)
    
    return this
  }
  
  Waterfall.prototype.prepare = function () {
    $(window).on('scroll', $.proxy(this.sail, this))
    
    return this
  }
  
  Waterfall.prototype.sail = _.throttle($.proxy(function () {
    if (self.isWantMore.call(this)) {
      this.ship()
    }
  }, this), 500)
  
  Waterfall.prototype.ship = function () {
    var $pins = self.getToLoadPins.call(this)
    var loader = new Loader()
    this.hold()
    loader
      .init($pins)
      .load()
      .run()
      .deferred.done($.proxy(function () {
        this
          .render($pins)
          .updateHeight()
          .prepare()
      }, this))
  }
  
  Waterfall.prototype.hold = function () {
    $(window).off('scroll', $.proxy(this.sail, this))
  }
  
  Waterfall.prototype.render = function ($pins) {
    var that = this
    $pins.each(function () {
      that.placePin($(this))
    })
    
    return this
  }
  
  Waterfall.prototype.placePin = function ($pin) {
    var minIndex = this.tops.indexOf(helper.m(this.tops).min)
    var position = self.getPositionByIndex.call(this, minIndex)
    
    $pin.css({
      position: 'absolute',
      left: position.left,
      top: position.top
    })
    
    this.$element.append($pin)
    
    self.updatePositionByIndexAndPin.call(this, minIndex, $pin)
  }
  
  Waterfall.prototype.updateHeight = function () {
    var maxIndex = this.tops.indexOf(helper.m(this.tops).max)
    this.$element.height(this.tops[maxIndex])
    
    return this
  }
  
  Waterfall.prototype.destroy = function () {
    this.hold()
    this.$element.remove()
  }
  
  var self = {
    getToLoadPins: function () {
      var steps = 8
      var $remainPins = this.$pins.map(function () {
        if ($(this).find('img:eq(0)').attr('data-bootstrap-waterfall-src')) {
          return $(this)
        }
      })
      
      return $remainPins.slice(0, steps)
    },
    isWantMore: function () {
      if ($(window).scrollTop() + $(window).height() > helper.getDocHeight() - 177) {
        return true
      } else {
        return false
      }
    },
    getPositionByIndex: function (index) {
      var position = {
        left: this.lefts[index],
        top: this.tops[index]
      }
      return position
    },
    updatePositionByIndexAndPin: function (index, $pin) {
      this.tops[index] += $pin.outerHeight(true)
    }
  }
  
  function Loader() {
    this.tasks = []
    this.timerId = null
    this.deferred = new $.Deferred()
  }
  
  Loader.prototype.init = function ($pins) {
    var that = this
    $pins.each(function () {
      var pin = new Pin($(this).find('img:eq(0)'))
      that.tasks.push(pin)
    })
    
    return this
  }
  
  Loader.prototype.load = function () {
    $.each(this.tasks, function (i, pin) {
      pin.$img[0].src = pin.$img.attr('data-bootstrap-waterfall-src')
      pin.$img.removeAttr('data-bootstrap-waterfall-src')
    })
    
    return this
  }
  
  Loader.prototype.run = function () {
    var that = this
    this.timerId = setInterval(function () {
      that.isDone() ? that.stop() : that.check()
    }, 13)
    
    return this
  }
  
  Loader.prototype.isDone = function () {
    return this.tasks.length === 0 ? true : false
  }
  
  Loader.prototype.stop = function () {
    clearInterval(this.timerId)
    this.deferred.resolve()
  }
  
  Loader.prototype.check = function () {
    for (var i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].isLoaded()) {
        this.tasks.splice(i--, 1)
      }
    }
  }
  
  function Pin($img) {
    this.$img = $img
  }
  
  Pin.prototype.isLoaded = function () {
    return this.$img[0].height ? true : false
  }
  
  var helper = {
    m: function (arr) {
      var m = {
        max: -Infinity,
        min: Infinity
      }
      for (var i = 0, l = arr.length; i < l; i++) {
        if (arr[i] > m.max) m.max = arr[i]
        if (arr[i] < m.min) m.min = arr[i]
      }
      return m
    },
    // http://james.padolsey.com/javascript/get-document-height-cross-browser/
    getDocHeight: function () {
      var D = document;
      return Math.max(
        D.body.scrollHeight, D.documentElement.scrollHeight,
        D.body.offsetHeight, D.documentElement.offsetHeight,
        D.body.clientHeight, D.documentElement.clientHeight
      );
    }
  }
  
  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data = $this.data('mystist.waterfall')
      var options = typeof option == 'object' && option
      
      if (!data) $this.data('mystist.waterfall', (data = new Waterfall(this, options)))
    })
  }
  
  var old = $.fn.waterfall
  
  $.fn.waterfall = Plugin
  $.fn.waterfall.Constructor = Waterfall
  
  $.fn.waterfall.noConflict = function () {
    $.fn.waterfall = old
    return this
  }

}(jQuery);
