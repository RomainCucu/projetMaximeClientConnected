// DOCUMENT PARTIE SERVEUR 
var index = {};

index.start=function(){
	document.addEventListener('click', index.on_click_function_);
};

index.on_click_function_ = function(ev){
	var src = ev.target;
	var id = src.id;

	if(id == "logout_link_"){
		alert('logout');
	}
};

window.onload = function(){
		setTimeout(index.start, 1);
};

