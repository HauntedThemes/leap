/**
 * Main JS file for Tria
 */

jQuery(document).ready(function($) {

    var config = {
        'share-selected-text': true,
        'load-more': true,
        'infinite-scroll': false,
        'disqus-shortname': 'lizun-1'
    };

    var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var msnry;

    $(window).load(function() {

        // Initialize Masonry - Cascading grid layout library
        if ($('.grid').length) {
            var elem = document.querySelector('.grid');
            msnry = new Masonry(elem, {
                itemSelector: '.grid .grid-item',
                columnWidth: '.grid .grid-sizer',
                percentPosition: true,
                gutter: 30,
                hiddenStyle: {
                    opacity: 0
                },
                visibleStyle: {
                    opacity: 1
                }
            });
        }

    });

    // Load more posts on click
    if (config['load-more']) {

        $('#load-posts').addClass('visible');

        var nextPage = 2;
        var pagination = $('#load-posts').attr('data-posts_per_page');

        $('#load-posts').click(function() {

            var parseUrl = '&include=tags&limit=' + pagination + '&page=' + nextPage;
            if ($('body').attr('data-author')) {
                parseUrl = parseUrl + '&filter=author:' + $('body').attr('data-author');
            }else if($('body').attr('data-tag')){
                parseUrl = parseUrl + '&filter=tag:' + $('body').attr('data-tag');
            }

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
                    $('#load-posts').addClass('hidden');
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
            $(window).on('scroll', function(event) {
                var timer;
                if (isScrolledIntoView('#load-posts') && checkTimer == 'on') {
                    $('#load-posts').click();
                    checkTimer = 'off';
                    timer = setTimeout(function() {
                        checkTimer = 'on';
                    }, 1000);
                };
            });
        };
    };

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
        return str.split(/\s+/).slice(0,44).join(" ");
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

        var datetime = d[0] +'-'+ d[1] +'-'+ d[2];
        var date = d[2] +' '+ monthNames[monthNumber] +' '+ d[0];
        var excerpt = getWords($(postData.html).text());

        var data = {
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
        	'<article class="post grid-item {{#tags}}{{#tags.tag}}tag-{{slug}} {{/tags.tag}}{{/tags}}">',
			    '<div class="content-holder">',
			        '<div class="post-meta {{#if feature_image}}has-image{{/if}}">',
			            '{{#if tags}}',
			                '<ul class="tags">',
			                '{{#foreach tags}}',
			                    '<li>',
			                        '<a href="{{url}}" title="{{name}}" class="tag tag-{{id}} {{slug}}">{{name}}</a>',
			                    '</li>',
			                '{{/foreach}}',
			                '</ul>',
			            '{{/if}}',
			            '<a href="{{url}}" title="{{title}}" class="img-holder">',
			                '{{#if feature_image}}',
			                    '<img src="{{img_url feature_image}}" alt="{{title}}">',
			                '{{/if}}',
			            '</a>',
			            '<time class="post-date" datetime="{{date format="YYYY-MM-DD"}}">{{date format="MMMM D, YYYY"}}</time>',
			        '</div>',
			        '<h2 class="post-title"><a href="{{url}}" title="{{title}}">{{title}}</a></h2>',
			        '<p>',
			            '{{excerpt words="22"}}',
			        '</p>',
			    '</div>',
			'</article>';
            // '<article class="post grid-item {{#tags}}{{#tags.tag}}tag-{{slug}} {{/tags.tag}}{{/tags}}">',
            //    ' <div class="post-meta">',
            //         '<a href="/author/{{author.slug}}/">{{author.name}}</a>',
            //         '<time class="post-date" datetime="{{date.datetime}}">{{date.date}}</time>',
            //     '</div>',
            //     '<h2 class="post-title"><a href="{{url}}" title="{{title}}">{{title}}</a></h2>',
            //     '<div class="content-holder">',
            //         '{{#feature_image}}',
            //             '<a href="{{url}}" title="{{title}}" class="img-holder">',
            //                 '<img src="{{feature_image}}" alt="{{title}}" class="rellax notransition" data-rellax-speed="2" data-rellax-percentage="0.5">',
            //             '</a>',
            //         '{{/feature_image}}',
            //         '<p>',
            //             '{{excerpt}}',
            //         '</p>',
            //     '</div>',
            //     '<a class="read-more btn" href="{{url}}" title="{{title}}">Read more</a>',
            // '</article>'
        ].join("\n");

        var post = Mustache.render(template, data);
        post = $(post);

        post.addClass('hidden');
        $('#content').append( post );
        $('#content').imagesLoaded( function() {
            msnry.appended( post );
            post.removeClass('hidden');
        });
    }

});