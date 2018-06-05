---
layout: default
title: Getting Started
permalink: /getting-started/
---

## Getting Started

Download the [production version][min] or the [development version][max].

[min]: https://raw.githubusercontent.com/Mystist/bootstrap-waterfall/master/dist/bootstrap-waterfall.js
[max]: https://raw.githubusercontent.com/Mystist/bootstrap-waterfall/master/src/bootstrap-waterfall.js

In your web page:

```html
<body>

  <div id="waterfall-container">
    <!- Should have markups of the list of pins here ->
  </div>

  <script src="jquery.js"></script>
  <script src="bootstrap-waterfall.js"></script>
  <script>
    $(document).ready(function () {
      $('#waterfall-container').waterfall();
    });
  </script>

</body>
```

That's it!

Those markups within the `waterfall-container` should be a repeated list:  

```html
<ul class="pin"><img src="" /></ul>
<ul class="pin"><img src="" /></ul>
<ul class="pin"><img src="" /></ul>

or

<div class="pin"><img src="" /></div>
<div class="pin"><img src="" /></div>
<div class="pin"><img src="" /></div>
```

For instance:  

```html
<ul class="pin list-group">
  <li class="list-group-item">
    <a href="javascript:;">
      <img src="images/1.jpg" />
    </a>
  </li>
</ul>
<ul class="pin list-group">
  <li class="list-group-item">
    <a href="javascript:;">
      <img src="images/2.jpg" />
    </a>
  </li>
</ul>
<ul class="pin list-group">
  <li class="list-group-item">
    <a href="javascript:;">
      <img src="images/3.jpg" />
    </a>
  </li>
</ul>
```

Of cause, you will need to add some styles for the markups at first. I guess you've already done that!

Keep in mind:  

- `<img />` tag should always has a tag wrap it. Let's say:  
    
    ```html
    <div class="pin">
      <img src="images/3.jpg" />
    </div>
    ```
    
- Should preset a `width` style for a pin:  
    
    ```html
      .waterfall .pin {
        width: 200px;
      }
    ```
  
***

## Q&A:  
- #### Those markups will load before the plugin runs, so do we need to pre set the width and height for images? or the plugin will wait for all the images loaded?  
  No need. The plugin will cancel all the image request at first. Then send new asynchronous request to load a few images which is in the front. Then repeat this process when we scrolled down near the bottom.

- #### But I don't want to show those markups in the beginning. I just want to show them when it's ready.  
  There are options, we can put those markups in a `script` tag with a special type, so the browser will ignore it:
    
    ```html
    <script id="waterfall-template" type="text/template">
      <ul class="pin"><img src="" /></ul>
      <ul class="pin"><img src="" /></ul>
      <ul class="pin"><img src="" /></ul>
    </script>
    ```
    
    To use it, we need to save it to the container's data object:  
  
    ```javascript
    $('#waterfall-container').data('bootstrap-waterfall-template', $('#waterfall-template').html())
    ```
    
    Then, we will have it:
  
    ```javascript
    $('#waterfall-container').waterfall();
    ```

- #### How to use it with ajax?
    An example here:

    ```javascript
      $('.waterfall')
        .data('bootstrap-waterfall-template', $('#waterfall-template').html())
        .on('finishing.mystist.waterfall', function () {
          setTimeout(function () { // simulate ajax
            $('.waterfall').data('mystist.waterfall').addPins($($('#another-template').html()))
          }, 2000);
        })
        .waterfall()
    ```

    The `finishing` event will be fired when scroll to the bottom with no more pins to be loaded.  
    You can also refer to this issue here: [#9](https://github.com/Mystist/bootstrap-waterfall/issues/9)
***

## Documentation

#### Setup  
- Install `Nodejs` on your computer. (Please use node 4)
- Install `yo` and other required tools: `npm install -g yo bower grunt-cli gulp`
- [Clone](https://github.com/Mystist/bootstrap-waterfall) the latest source code.
- Run `npm install`, `bower install` to install devDependencies.
- Run `gulp`. Make sure you can see `Finished 'build' after xxx ms`. Congratulations!

#### Examples
- Run `gulp serve` to see the demo.
