// ==UserScript==
// @match        http://www.178.com/mh/*
// @match        http://www.dmzj.com/*
// @match        http://manhua.dmzj.com/*
// ==/UserScript==

(function() {
    var MANHUA_ROOT = 'http://images.dmzj.com/',
        LOAD_TIME_INTERVAL = 2000,
        LOAD_HEIGHT = 1000,
        is_body_purged = false,
        current_page = null,
        is_loading_next = false,
        last_load_time = null,
        loading = '<div style="width: 100px; height: 20px; line-height: 20px; z-index: 1000000; background-color: green; color: white; position: fixed; top: 0; right: 0;">拼命加载中...</div>';

    function id(id) {
        return document.getElementById(id);
    };

    function purge_body() {
        if (!is_body_purged) {
            var body = document.getElementsByTagName('body')[0];
            body.innerHTML = '';
            is_body_purged = true;
        };
    };

    function timestamp() {
        return (new Date()).getTime();
    }

    function show_loading() {
        var lol = id('lol');
        if (lol === null) {
            lol = document.createElement('div');
            lol.id = 'lol';
            lol.innerHTML = loading;
        };
        document.body.appendChild(lol);
        lol.style.display = 'block';
    }

    function hide_loading() {
        var lol = id('lol');
        if (lol !== null) {
            lol.style.display = 'none';
        };
    }

    function ajax_load(url, callback, context) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', url, true);
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 2) {
                is_loading_next = true;
                show_loading();
            } else if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    if (context) {
                        callback.call(context, xmlHttp.responseText);
                    } else {
                        callback(xmlHttp.responseText);
                    }
                }
                is_loading_next = false;
                hide_loading();
            }
        }
        xmlHttp.send();
    };

    var MODE_NORMAL = "normal";
    var MODE_RIGHT_LEFT = "right-left";
    var MODE_LEFT_RIGHT = "left-right";
    var availableModes = [MODE_NORMAL, MODE_RIGHT_LEFT, MODE_LEFT_RIGHT];
    var modeStorageKey = "manga-reader-mode";
    var currentMode = localStorage.getItem(modeStorageKey) || availableModes[0];
    document.body.addEventListener("keydown",function(e){
        if(e.which >= 49 && e.which <= 51 && e.ctrlKey){
            localStorage.setItem(modeStorageKey, availableModes[e.which - 49] || MODE_NORMAL);
            location.reload();
        }
    });

    var Page = (function(){
        function Page(url, page) {
            this.url = url;
            this.page = page;
            this.next_page_url = null;
        }

        function get_inline_script_text_by_regex(regex) {
            var matched = this.page.match(regex);
            if (matched !== null) {
                return matched[0];
            };
            return null;
        };

        function get_image_html(img, i){
            var defaultHtml = '<img src="' + MANHUA_ROOT + img + '"/>';
            if(i == 0){
                return defaultHtml;
            }
            switch(currentMode){
                case MODE_NORMAL:
                    return defaultHtml;
                case MODE_RIGHT_LEFT:
                    return '<div style="width:50%;margin:0 auto;overflow:hidden">' + '<img style="float:right" src="' + MANHUA_ROOT + img + '"/>' + '</div>'
                        + '<div style="width:50%;margin:0 auto;overflow:hidden">' + '<img style="float:left" src="' + MANHUA_ROOT + img + '"/>' + '</div>';
                case MODE_LEFT_RIGHT:
                    return '<div style="width:50%;margin:0 auto;overflow:hidden">' + '<img style="float:left" src="' + MANHUA_ROOT + img + '"/>' + '</div>'
                        + '<div style="width:50%;margin:0 auto;overflow:hidden">' + '<img style="float:right" src="' + MANHUA_ROOT + img + '"/>' + '</div>';
                default:
                    return defaultHtml;
            }
        }

        function get_manga_html(list) {
           var length = list.length,
           html = list.map(function(img, i) {
               return '<div style="margin-bottom:3px;">'
               +        '<div style="color:#999; text-shadow:0 1px 0 #fff">PAGE: ' + (i + 1) + ' / ' + length + '</div>'
               +        get_image_html(img, i)
               +    '</div>';
           }).join('');

           return '<div style="border-top:1px solid #aaa; border-bottom:1px solid #ddd; padding:10px 0;">' + html + '</div>';
        };

        function chapter_link(comic_url) {
            var result = {},
                matched,
                prev_chapter_pattern = /prev_chapter" href="(.+)">([^<]+)/,
                next_chapter_pattern = /next_chapter" href="(.+)">([^<]+)/;
            matched = this.page.match(prev_chapter_pattern);
            if (matched !== null && matched.length === 3) {
                result.p = {href: '/' + comic_url + matched[1], text: matched[2]};
            };
            matched = this.page.match(next_chapter_pattern);
            if (matched !== null && matched.length === 3) {
                result.n = {href: '/' + comic_url + matched[1], text: matched[2]};
            };
            return result;
        }

        Page.prototype.process = function() {
            var inline_script_text = get_inline_script_text_by_regex.call(this, /var arr_img[\s\S]*var res_type= 1;/m);
            if (!inline_script_text) {
                return;
            }

            var data = (function() {
                eval(inline_script_text);
                return {arr_pages: arr_pages, g_comic_url: g_comic_url};
            })();

            nav_links = chapter_link.call(this, data.g_comic_url);

            var prev = nav_links.p;
            var next = nav_links.n;

            if (next) {
                this.next_page_url = next.href;
            };

            var navi = '<div style="background:#f0f0f0;box-shadow:0 1px 4px rgba(0, 0, 0, .2); font-family: arial;">'
            +   '<div style="margin:0 auto; width:950px; padding: 5px; 0; font-size:14px;">'
            +       ( prev ? '<a style="float:left;" href="' + prev.href + '">&laquo;' + prev.text + '</a>' : '')
            +       ( next ? '<a style="float:right;" href="' + next.href + '">' + next.text + '&raquo;</a>' : '')
            +       '<a href="' + this.url + '?no_convert=true">普通模式</a>'
            +       '<div style="clear:both;"></div>'
            +   '</div>'
            + '</div>';

            var body_html = navi
            + get_manga_html(data.arr_pages)
            //+ navi

            // fix chrome horizontal scroll bar
            + '<div style="height: 30px"></div>';

            purge_body();
            var e = document.createElement('div');
            e.innerHTML = body_html;
            document.body.appendChild(e);
        };

        Page.prototype.load_next = function() {
            if (this.next_page_url) {
                ajax_load(this.next_page_url, function(content) {
                    current_page = new Page(this.next_page_url, content);
                    current_page.process();
                }, this);
            };
        }

        return Page;
    })();

    var query = {};

    location.search.replace(/^\?/, '').split('&').forEach(function(key_value) {
        key_value = key_value.split('=');
        query[key_value[0]] = key_value[1];
    });

    var no_convert = query.no_convert;

    function init() {
        if (no_convert) {
            var element = document.createElement('div');
            element.innerHTML =
            '<div style="font-family: arial; z-index: 100000; width: 100%; background:#fff; position:fixed; top:0; left: 0; padding: 3px 10px; box-shadow:0 1px 4px rgba(0, 0, 0, .2);">'
            + '<div style="margin:0 auto; padding: 5px; 0; font-size:14px;">'
            + '<a href="' + location.pathname + '">转换为阅读模式</a>'
            + '</div>'
            + '</div>';

            document.body.insertBefore(element, document.body.firstChild);
        } else {
            var html = document.getElementsByTagName('html')[0];
            current_page = new Page(location.href, html.innerHTML);
            current_page.process();
            window.onscroll = function (event) {
                var window_height = window.innerHeight,
                    document_height = document.body.clientHeight,
                    scroll_top = window.scrollY,
                    time = timestamp();
                if (last_load_time && time - last_load_time < LOAD_TIME_INTERVAL) {
                    return;
                }
                if (!is_loading_next && (window_height + scroll_top > document_height - LOAD_HEIGHT)) {
                    last_load_time = timestamp();
                    current_page.load_next();
                };
            }
        }
    };

    init();
})();
