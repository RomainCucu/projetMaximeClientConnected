/*
		UNE SEULE FONCTION POST ET UNE SEULE CALLBACK PAR PAGE POUR UNE LISIBILITE ET COMPREHENSION PLUS FACILE
		CHANGER JUSTE LE MESSAGE DE RETOUR DU ROUTER POUR COMPRENDRE CE QUIL SE PASSE
*/

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
	}else if(id == "delete_link_"){
		alert("delete");
	}
};

window.onload = function(){
		setTimeout(index.start, 1);
};

