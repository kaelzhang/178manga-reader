// ==UserScript==
// @match        http://www.178.com/mh/*
// @match        http://www.dmzj.com/*
// @match        http://manhua.dmzj.com/*
// ==/UserScript==

(function(){

function get_inline_script_text_by_regex(regex){
    var inline_scripts = document.getElementsByTagName('script'),
        len = inline_scripts.length,
        i = 0,
        inline_script,
        inline_script_text;
        
    for(; i < len; i ++){
        inline_script = inline_scripts[i];
        inline_script_text = inline_script && inline_script.innerText;
        
        if(inline_script_text && regex.test(inline_script_text)){
            break;
        }
    }
    
    return inline_script_text;
};
	
function id(id){
	return document.getElementById(id);
};
	
// function get_pages_list(pages){
//	return pages.substr(2, pages.length - 4).split('","');
// };

function get_manga_html(list){
	var length = list.length,
		html = list.map(function(img, i){
	
			return '<div style="margin-bottom:3px;">'
				+		'<div style="color:#999; text-shadow:0 1px 0 #fff">PAGE: ' + (i + 1) + ' / ' + length + '</div>'
				+ 		'<img src="' + MANHUA_ROOT + img + '"/>'
				+	'</div>'
			
		}).join('');
		
	return '<div style="border-top:1px solid #aaa; border-bottom:1px solid #ddd; padding:10px 0;">' + html + '</div>';

};


var query = {};

location.search.replace(/^\?/, '').split('&').forEach(function(key_value) {
    key_value = key_value.split('=');

    query[key_value[0]] = key_value[1];
});

var no_convert = query.no_convert;

if(no_convert){
    var element = document.createElement('div');
    element.innerHTML = 
        '<div style="font-family: arial; background:#fff; position:fixed; top:0; left: 0; padding: 3px 10px; box-shadow:0 1px 4px rgba(0, 0, 0, .2);">'
        + '<a href="' + location.pathname + '">转换为阅读模式</a>'
        + '</div>';

    document.body.insertBefore(element, document.body.firstChild);


}else{
    var inline_script_text = get_inline_script_text_by_regex(/arr_pages/);

    var MANHUA_ROOT = 'http://imgfast.dmzj.com/';

    if(!inline_script_text){
        return;
    }

    eval(inline_script_text);

    var prev = id('prev_chapter');
    var next = id('next_chapter');
        
    var navi = '<div style="background:#f0f0f0;box-shadow:0 1px 4px rgba(0, 0, 0, .2); font-family: arial;">'
            +   '<div style="margin:0 auto; width:960px; padding: 5px; 0; font-size:14px;">'
            +       ( prev ? '<a style="float:left;" href="' + prev.href + '">&laquo;' + prev.innerHTML + '</a>' : '')
            +       ( next ? '<a style="float:right;" href="' + next.href + '">' + next.innerHTML + '&raquo;</a>' : '')
            +       '<a href="?no_convert=true">普通模式</a>'
            +       '<div style="clear:both;"></div>'
            +   '</div>'
            + '</div>';

    var body_html = navi 
        + get_manga_html( arr_pages ) 
        + navi 

        // fix chrome horizontal scroll bar
        + '<div style="height: 30px"></div>';

    document.body.innerHTML = body_html;
}




})();