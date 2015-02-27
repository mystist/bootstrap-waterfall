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
    indexOf: function(array, item, isSorted) {
      if (array == null) return -1;
      var i = 0, length = array.length;
      if (isSorted) {
        if (typeof isSorted == 'number') {
          i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
        } else {
          i = _.sortedIndex(array, item);
          return array[i] === item ? i : -1;
        }
      }
      for (; i < length; i++) if (array[i] === item) return i;
      return -1;
    },
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
    },
    debounce: function (func, wait, immediate) {
      var timeout, args, context, timestamp, result;

      var later = function() {
        var last = _.now() - timestamp;

        if (last < wait && last > 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = _.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
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
    this.perPinWidth = null
    this.sail = this.sail()
    
    this
      .init()
      .compassWatch()
      .gaugeWatch()
  }
  
  Waterfall.VERSION = '0.0.1'
  
  Waterfall.DEFAULTS = {
  }
  
  Waterfall.prototype.init = function () {
    this
      .initPins()
      .calculatePosition()
      .ship()
      
    return this
  }
  
  Waterfall.prototype.initPins = function () {
    var $pins = $(this.$element.data('bootstrap-waterfall-template'))
    $pins.each(function () {
      var $img = $(this).find('img:eq(0)')
      if ($img.length > 0) {
        $(this).data('bootstrap-waterfall-src', $img.attr('src'))
        $img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
      }
    })
    this.$pins = $pins
    
    return this
  }
  
  Waterfall.prototype.calculatePosition = function () {
    // Use fake element to get per pin's width which pre set by user in CSS.
    var $fake = this.$pins.first().clone()
    this.$element.append($fake.css('opacity', 0))
    
    var width = $fake.outerWidth(true)
    var counts = parseInt((this.$element.width() / width), 10)
    
    var lefts = []
    var tops = []
    for (var i = 0; i < counts; i++) {
      lefts.push(i * width)
      tops.push(0)
    }
    this.lefts = lefts
    this.tops = tops
    
    this.perPinWidth = $fake.find('img:eq(0)').width()
    
    $fake.remove()
    
    return this
  }
  
  Waterfall.prototype.prepare = function () {
    $(window).on('scroll', this.sail)
    
    return this
  }
  
  Waterfall.prototype.sail = function () {
    var that = this
    return _.throttle(function () {
      if (self.isWantMore.call(that)) {
        that
          .hold()
          .ship()
      }    
    }, 500)
  }
  
  Waterfall.prototype.ship = function () {
    var $pins = self.getToLoadPins.call(this)
    var loader = new Loader($pins)
    loader
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
    $(window).off('scroll', this.sail)
    
    return this
  }
  
  Waterfall.prototype.render = function ($pins) {
    var that = this
    $pins.each(function () {
      that.placePin($(this))
    })
    
    return this
  }
  
  Waterfall.prototype.placePin = function ($pin) {
    var minIndex = _.indexOf(this.tops, Math.min.apply(null, this.tops))
    var position = self.getPosition.call(this, minIndex)
    
    $pin.css({
      position: 'absolute',
      left: position.left,
      top: position.top
    })
    
    // Only we load or reload images we will execute `$pin.data('bootstrap-waterfall-pin', pin)`.
    if ($pin.data('bootstrap-waterfall-pin')) {
      self.setImageHeight.call(this, $pin)
      self.showImage.call(this, $pin)
      $pin.removeData('bootstrap-waterfall-pin')
    }
    
    this.$element.append($pin)
    
    self.updatePosition.call(this, minIndex, $pin)
  }
  
  Waterfall.prototype.updateHeight = function () {
    var maxIndex = _.indexOf(this.tops, Math.max.apply(null, this.tops))
    this.$element.height(this.tops[maxIndex])
    
    return this
  }
  
  Waterfall.prototype.compassWatch = function () {
    var that = this
    var timerId = setInterval(function () {
      if (that.$element.closest('body').length < 1) { // Check if user had left the page.
        clearInterval(timerId)
        that.destroy()
      }
    }, 777)
    
    return this
  }
  
  Waterfall.prototype.destroy = function () {
    this.hold()
    this.$element.remove()
  }
  
  Waterfall.prototype.gaugeWatch = function () {
    var that = this
    $(window).on('resize', _.debounce(function () {
      that
        .hold()
        .calculatePosition()
        .render(self.getLoadedPins.call(that))
        .updateHeight()
        .prepare()
        
    }, 777))
  }
  
  var self = {
    getToLoadPins: function () {
      var steps = 8
      var $remainPins = this.$pins.map(function () {
        if ($(this).find('img').length > 0 && $(this).data('bootstrap-waterfall-src')) {
          return $(this)
        }
      })
      
      return $remainPins.slice(0, steps)
    },
    getLoadedPins: function () {
      var $loadedPins = this.$pins.map(function () {
        if ($(this).find('img').length > 0 && !$(this).data('bootstrap-waterfall-src')) {
          return $(this)
        }
      })
      
      return $loadedPins
    },
    isWantMore: function () {
      if ($(window).scrollTop() + $(window).height() > helper.getDocHeight() - 177) {
        return true
      } else {
        return false
      }
    },
    getPosition: function (index) {
      var position = {
        left: this.lefts[index],
        top: this.tops[index]
      }
      return position
    },
    setImageHeight: function ($pin) {
      var pin = $pin.data('bootstrap-waterfall-pin')
      var height = this.perPinWidth * pin.img.height / pin.img.width
      $pin.find('img:eq(0)').css({
        'height': height,
        'width': 'auto'
      })
    },
    showImage: function ($pin) {
      $pin.find('img:eq(0)').attr('src', $pin.data('bootstrap-waterfall-src'))
      $pin.removeData('bootstrap-waterfall-src')
    },
    updatePosition: function (index, $pin) {
      this.tops[index] += $pin.outerHeight(true)
    }
  }
  
  function Loader($pins) {
    this.$pins = $pins
    this.tasks = []
    this.timerId = null
    this.deferred = new $.Deferred()
  }
  
  Loader.prototype.load = function () {
    var that = this
    this.$pins.each(function () {
      var img = new Image()
      img.src = $(this).data('bootstrap-waterfall-src')
      var pin = new Pin(img)
      that.tasks.push(pin)
      $(this).data('bootstrap-waterfall-pin', pin)
    })
    
    return this
  }
  
  Loader.prototype.run = function () {
    var that = this
    this.timerId = setInterval(function () {
      that.isDone() ? that.stop() : that.check()
    }, 40)
    
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
      var pin = this.tasks[i]
      if (pin.isLoaded()) {
        this.tasks.splice(i--, 1)
      }
    }
  }
  
  function Pin(img) {
    this.img = img
    this.initWidth = img.width
    this.initHeight = img.height
  }
  
  Pin.prototype.isLoaded = function () {
    if (this.img.width !== this.initWidth || this.img.height !== this.initHeight || this.img.width * this.img.height > 1024) { // Thanks TangBin.
      return true
    } else {
      return false
    }
  }
  
  var helper = {
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
