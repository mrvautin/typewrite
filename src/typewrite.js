(function ($){
    $.fn.typewrite = function(options){
        // setup defaults
        var settings = $.extend({
            speed: 12,
            blinkSpeed: 2,
            showCursor: true,
            blinkingCursor: true,
            cursor: '|',
            selectedBackground: '#F1F1F1',
            selectedText: '#333333',
            continuous: false
        }, options);

        // set the blink speed of the cursor
        settings.blinkSpeed = 1000 / settings.blinkSpeed;

        // add cursor if set to true.
        if(settings.showCursor){
            $(this).html('<span></span><span class="blinkingCursor">' + settings.cursor + '</span>');
            if(settings.blinkingCursor){
                // cache cursor object
                var $cursor = $('.blinkingCursor');
                setInterval(function(){
                    // check if blinkingCursor is set to opacity
                    if(settings.blinkingCursor === 'opacity'){
                        // toggle cursor opacity
                        if($cursor.css('opacity') === '1'){ 
                            $cursor.css({'opacity': 0});
                        }else{
                            $cursor.css({'opacity': 1});
                        }
                    }else{
                        // default to show/hide
                        $cursor.toggle();
                    }
                }, settings.blinkSpeed);
            }
        }else{
            $(this).html('<span></span>');
        }

        // set the main element, not the span
        settings.mainEl = this;

        // add a span to hold our text
        settings.el = $(this).children('span')[0];

        // set the typing speed
        settings.speed = 1000 / settings.speed;

        // holds the tags in an array
        var actions = options.actions;

        // holds the queue of actions
        settings.queue = actions.length;

        // trigger the 'typewriteStarted' event
        $(settings.mainEl).trigger('typewriteStarted');

        // execute the actions
        processActions();

        function processActions(){
            actions.forEach(function(element, index){
                // changes the typing speed
                if(Object.keys(element).includes('speed')){
                    settings.speed = 1000 / element.speed;
                }

                // removes any previous selections
                if(!Object.keys(element).includes('speed')){
                    removeSelection();
                }

                // adds a delay to the sequence
                if(Object.keys(element).includes('delay')){
                    delay(element.delay);
                }

                // removes characters
                if(Object.keys(element).includes('remove')){
                    remove(element.remove);
                }

                // adds a span which selects the text
                if(Object.keys(element).includes('select')){
                    select(element.select);
                }

                // types out text
                if(Object.keys(element).includes('type')){
                    if(element.type === '<br>'){
                        newLine();
                    }else{
                        var text = $('<div/>').html(element.type).text();
                        typeText(text, settings);
                    }
                }
            });
        }

        var done = setInterval(function(){
            if(settings.queue === 0){
                clearInterval(done);
                $(settings.mainEl).trigger('typewriteComplete');
                if(settings.continuous){
                    $(settings.el).empty();
                    processActions();
                }
            }
        }, 500);

        // adds a wrapper span around given index of characters to mimick selecting the text
        function select(action, callback){
            var charLen = action.to - action.from;
            var spanOpen = '<span class="typewriteSelected" style="background-color:' + settings.selectedBackground + '; color: ' + settings.selectedText + '">';
            var blankstr = new Array(charLen + 1).join(' ');
            var chars = blankstr.split('');
            chars.forEach(function(char, index){
                $(settings.el).delay(settings.speed).queue(function (next){
                    var newIndex = index + 1;
                    var newTo = action.to - newIndex;
                    $(settings.el).html($(settings.el).html().replace(/<br.*?>/g, ' \n '));
                    var currentString = $(settings.el).text();
                    var firstPart = currentString.slice(0, newTo);
                    var selectPart = currentString.slice(newTo, action.to);
                    var lastPart = currentString.slice(action.to, currentString.length);
                    var newString = firstPart + spanOpen + selectPart + '</span>' + lastPart;
                    $(this).html(newString.replace(/ \n /g, '<br>'));
                    next();

                    // we are done, remove from queue
                    if(index === chars.length - 1){
                        settings.queue = settings.queue - 1;
                        $(settings.mainEl).trigger('typewriteSelected', action);
                    }
                });
            });
        }

        // pauses/delay
        function delay(time){
            $(settings.el).delay(time).queue(function (next){
                next();

                // we are done, remove from queue
                settings.queue = settings.queue - 1;
                $(settings.mainEl).trigger('typewriteDelayEnded');
            });
        }

        // removes text. Can be stepped (one character at a time) or all in one hit
        function remove(remove){
            var blankstr = new Array(remove.num + 1).join(' ');
            var chars = blankstr.split('');

            // default to stepped
            var removeType = typeof remove.type !== 'undefined' ? remove.type : 'stepped';

            // if invalid, set to stepped
            if(removeType !== 'stepped' && removeType !== 'whole'){
                removeType = 'stepped';
            }

            if(removeType === 'stepped'){
                chars.forEach(function(char, index){
                    $(settings.el).delay(settings.speed).queue(function (next){
                        $(settings.el).html($(settings.el).html().replace(/<br.*?>/g, ' \n '));
                        var currText = $(this).text().substring(0, $(this).text().length - 1);
                        $(this).html(currText.replace(/ \n /g, '<br>'));
                        next();

                        // we are done, remove from queue
                        if(index === chars.length - 1){
                            settings.queue = settings.queue - 1;
                            $(settings.mainEl).trigger('typewriteRemoved', remove);
                        }
                    });
                }, this);
            }
            if(removeType === 'whole'){
                $(settings.el).delay(settings.speed).queue(function (next){
                    $(settings.el).html($(settings.el).html().replace(/<br.*?>/g, ' \n '));
                    var currText = $(this).text().substring(0, $(this).text().length - remove.num);
                    $(this).html(currText.replace(/ \n /g, '<br>'));
                    next();

                    // we are done, remove from queue
                    settings.queue = settings.queue - 1;
                    $(settings.mainEl).trigger('typewriteRemoved', remove);
                });
            }
        }

        // types out the given text one character at a time
        function typeText(text){
            var chars = text.split('');
            chars.forEach(function(char, index){
                $(settings.el).delay(settings.speed).queue(function (next){
                    var text = $(this).html() + char;
                    $(this).html(text);
                    next();

                    // we are done, remove from queue
                    if(index === chars.length - 1){
                        settings.queue = settings.queue - 1;
                        $(settings.mainEl).trigger('typewriteTyped', text);
                    }
                });
            }, this);
        }

        // adds a new line <br> to the html
        function newLine(){
            $(settings.el).delay(settings.speed).queue(function (next){
                var currTextNoCurr = $(this).html().substring(0, $(this).html().length);
                $(this).html(currTextNoCurr + '<br>');
                next();

                // we are done, remove from queue
                settings.queue = settings.queue - 1;
                $(settings.mainEl).trigger('typewriteNewLine');
            });
        }

        function removeSelection(){
            // check selection exists
            if($('.typewriteSelected').length > 0){
                // removes selection
                var selectionText = $('.typewriteSelected').text();
                $('.typewriteSelected').replaceWith(selectionText);
            }
        }
    };
}(jQuery));
