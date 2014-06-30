//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.

define(['jquery','jquery_hammer','hammer'], function($,jqueryHammer,Hammer){

    var gesturesHandler = function(reader,viewport){

        var nextPage = function(){
            setTimeout(function()
            {
                reader.openPageRight();
            }, 0);
        };

        var prevPage = function(){
            setTimeout(function()
            {
                reader.openPageLeft();
            }, 0);
        };

        this.initialize= function(){

            document.addEventListener('touchstart', function(e)
            {
                var t2 = e.timeStamp;
                var t1 = document.documentElement.getAttribute('data-touchStart') || t2;
                var dt = t2 - t1;
                var fingers = e.touches.length;
                document.documentElement.setAttribute('data-touchStart', t2);

                if (!dt || dt > 500 || fingers > 1)
                {
                    /*
                    console.log("===");
                    console.log(that.left);
                    console.log(that.top);
                    */
                    return;
                }

console.debug("touchstart PREVENT DEFAULT");
                e.preventDefault();
            }, true);
            
            var hammer = new Hammer(document.documentElement,
            {
                prevent_mouseevents: true,
                
                drag: true,
                dragend: false,
                dragstart: true,
        
                drag_vertical: false,
                drag_horizontal: false,
        
                transform: false,
                transformend: false,
                transformstart: false,
        
                swipe: true,
                swipeleft: true,
                swiperight: true,
                swipeup: true,
                swipedown: true,
        
                tap: false,
                tap_double: false,
        
                hold: false,
        
                prevent_default: false,
        
                css_hacks: false,
        
                swipe_velocity: 1
            });
    
            var scrolling = false;

            var onDragStart = function(hammerEvent, fromIframe)
            {
console.debug("DRAG START: " + fromIframe);
                scrolling = false;
    
                var target = hammerEvent.target;
                while (target)
                {
                    if(document.defaultView && document.defaultView.getComputedStyle)
                    {
                        var style = document.defaultView.getComputedStyle(target,null);
                        if (style)
                        {
                            var overflow = style.getPropertyValue("overflow");
                            var overflowX = style.getPropertyValue("overflow-x");
                            var overflowY = style.getPropertyValue("overflow-y");
                            if (overflow && overflow !== "" && overflow !== "hidden" && overflow !== "visible") // auto + scroll
                            {
                                if (hammerEvent.gesture &&
                                ((target.offsetHeight < target.scrollHeight) && (hammerEvent.gesture.direction === "down" || hammerEvent.gesture.direction === "up")) ||
                                ((target.offsetWidth < target.scrollWidth) && (hammerEvent.gesture.direction === "left" || hammerEvent.gesture.direction === "right")))
                                {
                                    if (target.scrollTop <= 0 && hammerEvent.gesture.direction === "down")
                                    {
                                    }
                                    else if (target.scrollTop >= (target.scrollHeight - target.offsetHeight) && hammerEvent.gesture.direction === "up")
                                    {
                                    }
                                    else if (target.scrollLeft <= 0 && hammerEvent.gesture.direction === "right")
                                    {
                                    }
                                    else if (target.scrollLeft >= (target.scrollWidth - target.offsetWidth) && hammerEvent.gesture.direction === "left")
                                    {
                                    }
                                    else
                                    {
console.debug("SCROLLING: " + fromIframe);
                                        scrolling = true;
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    target = target.parentNode;
                }

                if (hammerEvent.gesture)
                {
console.debug("READIUM HAMMER PREVENT DEFAULT: " + fromIframe);
                    hammerEvent.gesture.preventDefault();
                    //hammerEvent.gesture.stopPropagation();
                }
                else
                {
console.debug("READIUM HAMMER PREVENT DEFAULT ALT?: " + fromIframe);
                    //hammerEvent.preventDefault();
                    //hammerEvent.stopPropagation();
                }
            };
            

            var onSwipeLeft = function(hammerEvent, fromIframe)
            {
console.debug("SWIPE LEFT: " + fromIframe);
                if (scrolling)
                {
                    return;
                }

                if (navigator.epubReadingSystem.Pagination && navigator.epubReadingSystem.Pagination.TouchSuspend())
                {
console.debug("READIUM navigator.epubReadingSystem.Pagination.TouchSuspended (LEFT)");
                    return;
                }
                    
                if (reader.package() && reader.package().spine && reader.package().spine.isRightToLeft())
                {
                    prevPage();
                }
                else
                {
                    nextPage();
                }
            };

            var onSwipeRight = function(hammerEvent, fromIframe)
            {
console.debug("SWIPE RIGHT: " + fromIframe);
                if (scrolling)
                {
                    return;
                }

                if (navigator.epubReadingSystem.Pagination && navigator.epubReadingSystem.Pagination.TouchSuspend())
                {
console.debug("READIUM navigator.epubReadingSystem.Pagination.TouchSuspended (RIGHT)");
                    return;
                }
                    
                if (reader.package() && reader.package().spine && reader.package().spine.isRightToLeft())
                {
                    nextPage();
                }
                else
                {
                    prevPage();
                }
            };

            hammer.on("dragstart", function(e) {onDragStart(e, false)});
            hammer.on("swipeleft", function(e) {onSwipeLeft(e, false)});
            hammer.on("swiperight", function(e) {onSwipeRight(e, false)});
                
    
            reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function(iframe, s)
            {
                if (!iframe || !iframe.length || !iframe[0]) return;
            
                var win = iframe[0].contentWindow;
                if (!win) return;
                
                if (win.ReadiumHammered)
                {
                    console.debug("win.ReadiumHammered");
                    return;
                }
                win.ReadiumHammered = true;
                
                var doc = iframe.contents();
                if (!doc || !doc.length || !doc[0]) return;

                // SETUP FOR ANY NEW INSTANCES!
                Hammer.DOCUMENT = doc[0];
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);
                //Hammer.READY = false;

                if (true // USE COMMON TOP-LEVEL HAMMER RATHER THAN TRYING TO GET THE IFRAME's OWN
                )
                {
console.debug("SHARED TOP-LEVEL Hammer FOR IFRAME");
                    var hammerx = new Hammer.Instance(doc[0].documentElement,
                    {
                        prevent_mouseevents: true,
                
                        drag: true,
                        dragend: true,
                        dragstart: true,
    
                        drag_vertical: false,
                        drag_horizontal: false,
    
                        transform: false,
                        transformend: false,
                        transformstart: false,
    
                        swipe: true,
                        swipeleft: true,
                        swiperight: true,
                        swipeup: true,
                        swipedown: true,

                        tap: false,
                        tap_double: false,
    
                        hold: false,
    
                        prevent_default: false,
    
                        css_hacks: false,
    
                        swipe_velocity: 1
                    });

                    //hammerEvent.preventDefault();
                    //hammerEvent.stopPropagation();
            
                    //hammerEvent.gesture.preventDefault();
                    //hammerEvent.gesture.stopPropagation();
            
                    //hammerEvent.gesture.stopDetect();

                    hammerx.on("dragstart", function(e) {onDragStart(e, true)});
                    hammerx.on("swipeleft", function(e) {onSwipeLeft(e, true)});
                    hammerx.on("swiperight", function(e) {onSwipeRight(e, true)});
                }
                else
                {
                    var hammery = new Hammer.Instance(doc[0].documentElement,
                    {
                        prevent_mouseevents: true,
                
                        drag: true,
                        dragend: true,
                        dragstart: true,
    
                        drag_vertical: false,
                        drag_horizontal: false,
    
                        transform: false,
                        transformend: false,
                        transformstart: false,
    
                        swipe: true,
                        swipeleft: true,
                        swiperight: true,
                        swipeup: true,
                        swipedown: true,
    
                        tap: false,
                        tap_double: false,
    
                        hold: false,
    
                        prevent_default: false,
    
                        css_hacks: false,
    
                        swipe_velocity: 1
                    });
                    hammery.on("dragstart", function(e) {onDragStart(e, true)});
                
                
                    var setHammerSwipe = function()
                    {
                        var Hammerx = Hammer;
                        var hammerx = undefined;
                
                        if (win.Hammer)
                        {
    console.debug("iframe[0].contentWindow YES Hammer");
                            Hammerx = win.Hammer;
                        }
                        else
                        {
    console.debug("iframe[0].contentWindow NO Hammer");
                        }

                        var hammerx = new Hammerx.Instance(doc[0].documentElement,
                        {
                            prevent_mouseevents: true,
                
                            drag: false,
                            dragend: false,
                            dragstart: false,
        
                            drag_vertical: false,
                            drag_horizontal: false,
        
                            transform: false,
                            transformend: false,
                            transformstart: false,
        
                            swipe: true,
                            swipeleft: true,
                            swiperight: true,
                            swipeup: true,
                            swipedown: true,

                            tap: false,
                            tap_double: false,
        
                            hold: false,
        
                            prevent_default: false,
        
                            css_hacks: false,
        
                            swipe_velocity: 1
                        });

                        //hammerEvent.preventDefault();
                        //hammerEvent.stopPropagation();
                
                        //hammerEvent.gesture.preventDefault();
                        //hammerEvent.gesture.stopPropagation();
                
                        //hammerEvent.gesture.stopDetect();

                        hammerx.on("swipeleft", function(e) {onSwipeLeft(e, true)});
                        hammerx.on("swiperight", function(e) {onSwipeRight(e, true)});
                    };
                
                    var tryHammer = function(func, tries)
                    {
                        if (tries < 0 || iframe[0].contentWindow.Hammer)
                        {
                            func();
                            return;
                        }
                    
                        setTimeout(function()
                        {
                            tryHammer(func, --tries);
                        }, 100);
                    };
                    tryHammer(setHammerSwipe, 5);
                }
            });
        };

    };
    return gesturesHandler;
});