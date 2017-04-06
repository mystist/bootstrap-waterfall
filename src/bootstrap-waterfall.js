/*
 * bootstrap-waterfall
 *
 *
 * Copyright (c) 2014-2017
 * Licensed under the MIT license.
 */

+function ($) {
  'use strict';

  // http://underscorejs.org/ (1.8.3)
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
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
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

        if (last < wait && last >= 0) {
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
    this.id = Math.random().toString().slice(2)
    this.$fakePin = null
    this.$container = null
    this.$pins = null
    this.pinWidth = null
    this.imgWidth = null
    this.lefts = []
    this.tops = []

    this
      .init()
      .calculateWidth()
      .calculatePosition()
      .sail()

    $(window).on('resize.mystist.waterfall' + this.id, _.debounce($.proxy(function () {
      $(window).off('scroll.mystist.waterfall' + this.id)
      this
        .calculateWidth()
        .calculatePosition()
        .ship(self.getLoadedPins.call(this))
    }, this), 777))
  }

  Waterfall.VERSION = '0.2.5'

  Waterfall.DEFAULTS = {
  }

  Waterfall.prototype.init = function () {
    this
      .initPins()
      .initAttributes()

    return this
  }

  Waterfall.prototype.initPins = function () {
    var $elements = this.$element.children().length > 0 ? this.$element.children().remove() : $(this.$element.data('bootstrap-waterfall-template'))
    this.$pins = self.decorate($elements)

    return this
  }

  Waterfall.prototype.initAttributes = function () {
    // Use fake pin to calculate per pin's width which set by user via CSS.
    this.$fakePin = this.$pins.first().clone()

    this.$container = $('<div />').css('position', 'relative')
    this.$element.html(this.$container)

    return this
  }

  Waterfall.prototype.calculateWidth = function () {
    var $clone = this.$fakePin.clone()
    this.$container.append($clone.css('opacity', 0))

    this.pinWidth = $clone.outerWidth(true)
    this.imgWidth = $clone.find('img:eq(0)').css('width', '100%').width()

    $clone.remove()

    return this
  }

  Waterfall.prototype.calculatePosition = function () {
    var counts = parseInt((this.$container.width() / this.pinWidth), 10)

    var lefts = []
    var tops = []
    for (var i = 0; i < counts; i++) {
      lefts.push(i * this.pinWidth)
      tops.push(0)
    }
    this.lefts = lefts
    this.tops = tops

    return this
  }

  Waterfall.prototype.sail = function () {
    var $pins = self.getToLoadPins.call(this)
    var loader = new Loader($pins)
    loader
      .load()
      .run()
      .deferred.done($.proxy(function () {
        this.ship($pins)
      }, this))

    return this
  }

  Waterfall.prototype.ship = function ($pins) {
    this
      .render($pins)
      .updateHeight()

    $(window).on('scroll.mystist.waterfall' + this.id, _.throttle($.proxy(function () {
      if (self.isWantMore.call(this)) {
        $(window).off('scroll.mystist.waterfall' + this.id)
        this.sail()
      }
    }, this), 500))

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
    var minIndex = helper.indexOf(this.tops, Math.min.apply(null, this.tops))
    var position = self.getPosition.call(this, minIndex)

    $pin.css({
      position: 'absolute',
      left: position.left,
      top: position.top
    })

    if ($pin.data('bootstrap-waterfall-pin')) {
      self.setImageHeight.call(this, $pin)
    }
    if ($pin.data('bootstrap-waterfall-src')) {
      self.makeImageAvailable.call(this, $pin)
      $pin.removeData('bootstrap-waterfall-src')
    }

    this.$container.append($pin)

    self.updatePosition.call(this, minIndex, $pin)

    return this
  }

  Waterfall.prototype.updateHeight = function () {
    var maxIndex = helper.indexOf(this.tops, Math.max.apply(null, this.tops))
    this.$container.height(this.tops[maxIndex])

    return this
  }

  Waterfall.prototype.destroy = function () {
    $(window).off('scroll.mystist.waterfall' + this.id)
    $(window).off('resize.mystist.waterfall' + this.id)
    this.$element
      .empty()
      .removeData('mystist.waterfall')

    return this
  }

  Waterfall.prototype.addPins = function ($elements) {
    this.$pins = this.$pins.add(self.decorate($elements))
  }

  var self = {
    decorate: function ($elements) {
      return $elements.map(function () {
        var $img = $(this).find('img:eq(0)')
        if ($img.length > 0) {
          $(this).data('bootstrap-waterfall-src', $img.attr('src'))
          $img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
          return this
        }
      })
    },
    getToLoadPins: function () {
      var counts = parseInt((this.$container.width() / this.pinWidth), 10)
      var steps = counts * 3

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
      if ($(window).scrollTop() + $(window).height() > helper.getDocHeight() - 377) {
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
      var height = this.imgWidth * pin.img.height / pin.img.width
      $pin.find('img:eq(0)').css({
        'height': height,
        'width': 'auto'
      })
    },
    makeImageAvailable: function ($pin) {
      $pin.find('img:eq(0)').attr('src', $pin.data('bootstrap-waterfall-src'))
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
      // https://github.com/Mystist/bootstrap-waterfall/pull/2
      img.onload = function () {
        var pin = new Pin(this)
        that.tasks.push(pin)
        $(this).data('bootstrap-waterfall-pin', pin)
      }
    })

    return this
  }

  Loader.prototype.run = function () {
    this.timerId = setInterval($.proxy(function () {
      this.isDone() ? this.stop() : this.check()
    }, this), 40)

    return this
  }

  Loader.prototype.isDone = function () {
    return this.tasks.length === 0 ? true : false
  }

  Loader.prototype.stop = function () {
    clearInterval(this.timerId)
    this.timerId = null
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
    this.initialWidth = img.width
    this.initialHeight = img.height
  }

  Pin.prototype.isLoaded = function () {
    if (this.img.width !== this.initialWidth || this.img.height !== this.initialHeight || this.img.width * this.img.height > 1024) { // Thanks TangBin.
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
    },
    // http://underscorejs.org/ (1.7.0), modified.
    indexOf: function (array, item) {
      if (array == null) return -1;
      var i = 0, length = array.length;
      for (; i < length; i++) if (array[i] === item) return i;
      return -1;
    }
  }

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data = $this.data('mystist.waterfall')
      var options = typeof option == 'object' && option

      if (data && typeof option != 'string') data.destroy() && (data = null)
      if (!data) $this.data('mystist.waterfall', (data = new Waterfall(this, options)))
      if (typeof option == 'string') data[option]()
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
