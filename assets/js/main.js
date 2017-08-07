/**
 * Main JS file for Tria
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'infinite-scroll': true,
        'infinite-scroll-step': 1,
        'disqus-shortname': 'lizun-1'
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var msnry;
    var step = 0;

    $(window).load(function() {

        // Initialize Masonry - Cascading grid layout library
        if ($('.grid').length) {

        	$('.grid .post').each(function(index, el) {
        		var minHeight = $(this).find('.tags').height() + 125;
        		var postMetaHeight = $(this).find('.post-meta').height();
        		if (minHeight > postMetaHeight) {
        			$(this).find('.post-meta').height(minHeight).addClass('expand');
        		};
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

    });

    // Load more posts on click
    if (config['load-more']) {

        $('#load-posts').addClass('visible');

        var nextPage = 2;
        var pagination = $('#load-posts').attr('data-posts_per_page');

        $('#load-posts').on('click', function(event) {
            event.preventDefault();

            var $this = $(this);

            var parseUrl = '&include=tags&limit=' + pagination + '&page=' + nextPage;
            if ($('body').attr('data-author')) {
                parseUrl = parseUrl + '&filter=author:' + $('body').attr('data-author');
            }else if($('body').attr('data-tag')){
                parseUrl = parseUrl + '&filter=tag:' + $('body').attr('data-tag');
            }

            if ($this.hasClass('was-dots')) {
                setTimeout(function() {
                    console.log($(this));
            	   $this.removeClass('was-dots').addClass('dots');
            	   step = 0;
                }, 1000);
            };

            $.ajax({
                url: ghost.url.api("posts") + parseUrl,
                type: 'get'
            }).done(function(data) {
                $.each(data.posts, function(i, post) {
                    $.ajax({
                        url: ghost.url.api("users") + '&filter=id:' + post.author,
                        type: 'get'
                    }).done(function(data) {
                        $.each(data.users, function(i, users) {
                            insertPost(post, users);
                        });
                    });
                });
            }).done(function(data) {
                var sum = nextPage*pagination;
                if (sum >= data.meta.pagination.total) {
                    $('#load-posts').addClass('end').text('No more posts');
                }
                nextPage += 1;
            }).fail(function(err) {
                console.log(err);
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
                    step++;
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

    // Tria's functions

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

    // Append posts on masonry container
    function insertPost(postData, authorData) {

        var d = postData.published_at.slice(0, 10).split('-');
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var monthNumber = d[1];
        if (monthNumber.slice(0,1) == '0') {
            monthNumber = monthNumber.slice(1,2) - 1;
        }else{
            monthNumber--;
        };

        var featured = '';

        if (postData.featured) {
            featured = 'featured';
        };

        if (d[2].slice(0,1) == '0') {
            d[2] = d[2].slice(1,2);
        }

        var datetime = d[0] +'-'+ d[1] +'-'+ d[2];
        var date = monthNames[monthNumber] + ' ' + d[2] + ', ' + d[0];
        var excerpt;
        if (postData.custom_excerpt != null) {
        	excerpt = postData.custom_excerpt;
        }else{
        	excerpt = getWords($(postData.html).text());
        };

        var data = {
        	comment_id: postData.comment_id,
            title: postData.title,
            date: {
                "datetime": datetime,
                "date": date
            },
            featured: featured,
            url: postData.url,
            excerpt: excerpt,
            author: {
                "slug": authorData.slug,
                "name": authorData.name
            },
            tags: function(){
                if (!$.isEmptyObject(postData.tags)) {
                    data.tags.tag = postData.tags;
                    return true;
                };
            },
            feature_image: function(){
                if (postData.feature_image != '' && postData.feature_image != null) {
                    return postData.feature_image;
                };
            },
        }

        var template = [
        	'<article class="post grid-item {{#tags}}{{#tags.tag}}tag-{{slug}} {{/tags.tag}}{{/tags}}" data-id="{{comment_id}}">',
			    '<div class="content-holder">',
			        '<div class="post-meta {{#feature_image}}has-image{{/feature_image}}">',
			            '{{#tags}}',
			                '<ul class="tags">',
			                '{{#tags.tag}}',
			                    '<li>',
			                        '<a href="/tag/{{slug}}" title="{{name}}" class="tag tag-{{id}} {{slug}}">{{name}}</a>',
			                    '</li>',
			                '{{/tags.tag}}',
			                '</ul>',
			            '{{/tags}}',
			            '<a href="{{url}}" title="{{title}}" class="img-holder">',
			                '{{#feature_image}}',
			                    '<img src="{{feature_image}}" alt="{{title}}">',
			                '{{/feature_image}}',
			            '</a>',
			            '<time class="post-date" datetime="{{date.datetime}}">{{date.date}}</time>',
			        '</div>',
			        '<h2 class="post-title"><a href="{{url}}" title="{{title}}">{{title}}</a></h2>',
			        '<p>',
			            '{{excerpt}}',
			        '</p>',
			    '</div>',
			'</article>'
        ].join("\n");

        var post = Mustache.render(template, data);
        post = $(post);
        post.find('.content-holder').addClass('no-opacity');
        $('#content .grid').append( post );
        $('#content .grid').imagesLoaded( function() {
	        var minHeight = post.find('.tags').height() + 125;
			var postMetaHeight = post.find('.post-meta').height();
			if (minHeight > postMetaHeight) {
				post.find('.post-meta').height(minHeight).addClass('expand');
			};

            msnry.appended( post );
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
            animeOpts.targets = '.post[data-id="'+ postData.comment_id +'"] .content-holder';
            anime.remove(animeOpts.targets);
        	anime(animeOpts);
        });
    }

    $(".search-trigger").on('click', function(event) {
        event.preventDefault();
        if ($(".nav-trigger").hasClass('active')) {
            $(".nav-trigger").toggleClass('active');
            $('.menu-container').slideToggle(500, function(){
                $(".search-trigger").toggleClass('active');
                $('.search-container').slideToggle(500);
            });
        }else{
            $(".search-trigger").toggleClass('active');
            $('.search-container').slideToggle(500);
        };
    });

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
        info_template       : "<p>No posts found</p>",
        result_template     : "<li><a href='{{link}}' title='{{title}}'>{{title}}</a></li>",
        onComplete      : function( results ){
            if (results.length == 0 && $('#search-field').val() != '') {
                $('#results p').addClass('empty');
            };
        }
    });

    if ($('.tag-template').length) {
        var tagSlug = $('.tag-template').attr('data-tag');
        $('.tags-container .' + tagSlug).parent().addClass('active');
    };

    // Position tags share buttons inside a single post
    if ($('.tags-container').length) {
        $(window).scroll(function() {
            tagsPosition();
        });
        tagsPosition();
    };

    // Position share buttons
    function tagsPosition(){
        
        var contentHolderDistanceTop = $('#content .grid').offset().top;
        var contentHeight = $('#content').outerHeight(true);
        var contentDistanceTop = $('#content').offset().top - parseInt($('#content').css('marginTop'), 10);
        var tagsHeight = $('#content .tags-container').height();
        var contentHeightAndDistance = contentHeight + contentDistanceTop;

        if ($(window).scrollTop() > (contentHolderDistanceTop - 30) && $(window).scrollTop() < (contentHeightAndDistance - 30 - tagsHeight)) {
            $('.tags-container').addClass('active');
            $('.tags-container').attr('style', '');
        }else if($(window).scrollTop() > (contentHeightAndDistance - 30 - tagsHeight)){
            $('.tags-container').css({
                position: 'absolute',
                top: $('#content').height() + $('header').height() + 30 + 'px'
            });
        }else if($(window).scrollTop() < (contentHolderDistanceTop - 30)){
            $('.tags-container').removeClass('active');
            $('.tags-container').attr('style', '');
        }
    }

});