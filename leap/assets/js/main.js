/**
 * Main JS file for Leap
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'infinite-scroll': true,
        'infinite-scroll-step': 3,
        'disqus-shortname': 'hauntedthemes-demo'
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
        h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        msnry;

    setGalleryRation();

    // Execute on load
    $(window).on('load', function(event) {

        setGalleryRation();

        $('.post-content img').each(function(index, el) {
            if (!$(this).parent().is("a")) {
                $( "<a href='" + $(this).attr('src') + "' class='zoom'></a>" ).insertAfter( $(this) );
                $(this).appendTo($(this).next("a"));
            };
        });

        $('.zoom').fluidbox();

        $(window).on('scroll', function(event) {
            $('.zoom').fluidbox('close');
        });

        // Initialize Masonry - Cascading grid layout library
        if ($('.grid').length) {

            $('.grid .post').each(function(index, el) {
                expand($(this));

                var a = $(this).find('.post-title a');
                a.html(a.html().replace(/^(\w+)/, '<span>$1</span>'));

            });

            var elem = document.querySelector('.grid');
            msnry = new Masonry(elem, {
                itemSelector: '.grid .grid-item',
                columnWidth: '.grid .grid-sizer',
                percentPosition: true,
                gutter: 30,
                transitionDuration: 0
            });
        }

        var currentPage = 1;
        var pathname = window.location.pathname;
        var $result = $('.grid-item');
        var step = 0;

        // remove hash params from pathname
        pathname = pathname.replace(/#(.*)$/g, '').replace('/\//g', '/');

        // Load more posts on click
        if (config['load-more']) {

            $('#load-posts').addClass('visible');

            $('#load-posts').on('click', function(event) {
                event.preventDefault();

                if (currentPage == maxPages) {
                    $('#load-posts').addClass('end').text($('#load-posts').attr('data-end'));
                    return;
                };

                var $this = $(this);

                // next page
                currentPage++;

                if ($('body').hasClass('paged')) {
                    pathname = '/';
                };

                // Load more
                var nextPage = pathname + 'page/' + currentPage + '/';

                if ($this.hasClass('was-dots')) {
                    setTimeout(function() {
                       $this.removeClass('was-dots').addClass('dots');
                       step = 0;
                    }, 1000);
                };

                $.get(nextPage, function (content) {
                    step++;
                    var post = $(content).find('.post');
                    post.find('.content-holder').addClass('no-opacity');
                    $('#content .grid').append( post );
                    $.each(post, function(index, val) {
                        var $this = $(this);
                        var id = $(this).attr('data-id');
                        $('#content .grid').imagesLoaded( function() {
                            expand($this);

                            var a = $this.find('.post-title a');
                            a.html(a.html().replace(/^(\w+)/, '<span>$1</span>'));

                            msnry.appended( $this );
                            var animeOpts = {
                                duration: 800,
                                easing: [0.1,1,0.3,1],
                                delay: function(t,i) {
                                    return i*35;
                                },
                                opacity: {
                                    value: [0,1],
                                    duration: 600,
                                    easing: 'linear'
                                },
                                translateY: [200,0],
                                translateZ: [300,0],
                                rotateX: [75,0]
                            }

                            animeOpts.targets = '.post[data-id="'+ id +'"] .content-holder';
                            anime.remove(animeOpts.targets);
                            anime(animeOpts);
                        });
                    });
                });

            });
        };

        // Infinite scroll
        if (config['infinite-scroll'] && config['load-more']) {
            var checkTimer = 'on';
            if ($('#load-posts').length > 0) {
                $('#load-posts').addClass('dots');
                $(window).on('scroll', function(event) {
                    var timer;
                    if (isScrolledIntoView('#load-posts') && checkTimer == 'on' && step < config['infinite-scroll-step']) {
                        $('#load-posts').addClass('load').click();
                        checkTimer = 'off';
                        timer = setTimeout(function() {
                            $('#load-posts').removeClass('load');
                            checkTimer = 'on';
                            if (step == config['infinite-scroll-step']) {
                                $('#load-posts').removeClass('dots').addClass('was-dots');
                            };
                        }, 1000);
                    };
                });
            };
        };
    });


    $( document ).ajaxStart(function() {
        if ($('#load-posts').hasClass('dots load')) {
            $('#load-posts').addClass('active');
        };
    });

    $( document ).ajaxComplete(function() {
        if ($('#load-posts').hasClass('dots')) {
            $('#load-posts').removeClass('active');
        };
    });

    // Menu trigger
    $(".nav-trigger").on('click', function(event) {
        event.preventDefault();
        if ($(".search-trigger").hasClass('active')) {
            $(".search-trigger").toggleClass('active');
            $('.search-container').slideToggle(500, function(){
                $(".nav-trigger").toggleClass('active');
                $('.menu-container').slideToggle(500);
            });
        }else{
            $(".nav-trigger").toggleClass('active');
            $('.menu-container').slideToggle(500);
        }
    });

    // Initialize ghostHunter - A Ghost blog search engine
    $("#search-field").ghostHunter({
        results             : "#results",
        onKeyUp             : true,
        zeroResultsInfo     : true,
        displaySearchInfo   : true,
        info_template       : "<p>"+ $("#results").attr('data-no-results') +"</p>",
        result_template     : "<li><a href='{{link}}' title='{{title}}'>{{title}}</a></li>",
        onComplete      : function( results ){
            if (results.length == 0 && $('#search-field').val() != '') {
                $('#results p').addClass('empty');
            };
            if ($('.search-inner').find('a').length) {
                $('.search-inner a').each(function(index, el) {
                    var a = $(this);
                    a.html(a.html().replace(/^(\w+)/, '<span>$1</span>'));
                });
            };
            $('#results li').each(function(index, el) {
                if (index > 11) {
                    $(this).hide();
                };
            });
        }
    });

    // Highlight active tag
    if ($('.tag-template').length) {
        var tagSlug = $('.tag-template .tags-container').attr('data-tag');
        $('.tags-container .' + tagSlug).parent().addClass('active');
    };

    // Position social share buttons inside a single post
    var checkIfSticky = 0;
    if (w >= 900) {
        stickIt();
        checkIfSticky = 1;
    };
    $(".content-inner .info-bar").stick_in_parent().
    on("sticky_kit:stick", function(e) {
        $(".content-inner .info-bar").addClass('active');
    })
    .on("sticky_kit:unstick", function(e) {
        $(".content-inner .info-bar").removeClass('active');
    });

    // Initialize shareSelectedText
    if (config['share-selected-text']) {
        shareSelectedText('.content-inner .post-content', {
            sanitize: true,
            buttons: [
                'twitter',
            ],
            tooltipTimeout: 250
        });
    };

    $(window).on('resize', function(event) {
        w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        if (w < 900) {
            $(".author-template .authors").trigger("sticky_kit:detach");
            $(".tags-container").trigger("sticky_kit:detach");
            $(".content-inner .authors").trigger("sticky_kit:detach");
            checkIfSticky = 0;
        }else{
            if (checkIfSticky == 0) {
                stickIt();
                checkIfSticky++;
            }
        };
        $('.grid .post').each(function(index, el) {
            if ($(this).find('.post-meta').hasClass('expand')) {
                $(this).find('.post-meta').attr('style', '').removeClass('expand');
                expand($(this));
            };
        });
    });

    // Leap's functions

    // Check if element is into view when scrolling
    function isScrolledIntoView(elem){
        var docViewTop = $(window).scrollTop();
        var docViewBottom = docViewTop + $(window).height();

        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

    // Get first number of words from a string
    function getWords(str) {
        return str.split(/\s+/).slice(0,22).join(" ");
    }

    // Expand post image if is too small
    function expand(el){
        var minHeight = el.find('.tags').height() + 125;
        var postMetaHeight = el.find('.post-meta').height();
        if (minHeight > postMetaHeight) {
            el.find('.post-meta').height(minHeight).addClass('expand');
        };
    }

    // Search trigger
    $(".search-trigger").on('click', function(event) {
        event.preventDefault();
        if ($(".nav-trigger").hasClass('active')) {
            $(".nav-trigger").toggleClass('active');
            $('.menu-container').slideToggle(500, function(){
                $(".search-trigger").toggleClass('active');
                $('.search-container').slideToggle(500, function(){
                    $('#search-field').focus();
                });
            });
        }else{
            $(".search-trigger").toggleClass('active');
            $('.search-container').slideToggle(500, function(){
                $('#search-field').focus();
            });
        };
    });

    // Initialize stick_in_parent
    function stickIt(){
        $(".author-template .authors").stick_in_parent({
            offset_top: 30
        });
        $(".content-inner .authors").stick_in_parent({
            offset_top: 50
        });
        $(".tags-container").stick_in_parent();
    }

    // Progress bar for inner post
    function progressBar(){
        var postContentOffsetTop = $('.post-content').offset().top;
        var postContentHeight = $('.post-content').height();
        if ($(window).scrollTop() > postContentOffsetTop && $(window).scrollTop() < (postContentOffsetTop + postContentHeight)) {
            var heightPassed = $(window).scrollTop() - postContentOffsetTop;
            var percentage = heightPassed * 100/postContentHeight;
            $('.progress').css({
                width: percentage + '%'
            });
        }else if($(window).scrollTop() < postContentOffsetTop){
            $('.progress').css({
                width: '0%'
            });
        }else{
            $('.progress').css({
                width: '100%'
            });
        };
    }

    $(window).on('scroll', function(event) {
        if ($('.post-template').length) {
            progressBar();
        };
    });

    // Initialize Disqus comments
    if ($('#content').attr('data-id') && config['disqus-shortname'] != '') {

        $('.comments-trigger').on('click', function(event) {
            event.preventDefault();
            $('.comments').append('<div id="disqus_thread"></div>').addClass('active');

            var url = [location.protocol, '//', location.host, location.pathname].join('');
            var disqus_config = function () {
                this.page.url = url;
                this.page.identifier = $('#content').attr('data-id');
            };

            (function() {
            var d = document, s = d.createElement('script');
            s.src = '//'+ config['disqus-shortname'] +'.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
            })();
        });

    };

    // Validate Subscribe input
    $('.gh-signin').on('submit', function(event) {
        var email = $('.gh-input').val();
        if (!validateEmail(email)) {
            $('.gh-input').addClass('error');
            setTimeout(function() {
                $('.gh-input').removeClass('error');
            }, 500);
            event.preventDefault();
        };
    });

    // Validate email input
    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    } 

    // Initialize Highlight.js
    $('pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });

    // Set the right proportion for images inside the gallery
    function setGalleryRation(){
        $('.kg-gallery-image img').each(function(index, el) {
            var container = $(this).closest('.kg-gallery-image');
            var width = $(this)[0].naturalWidth;
            var height = $(this)[0].naturalHeight;
            var ratio = width / height;
            container.attr('style', 'flex: ' + ratio + ' 1 0%');
        });
    }

});