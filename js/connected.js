/*
		UNE SEULE FONCTION POST ET UNE SEULE CALLBACK PAR PAGE POUR UNE LISIBILITE ET COMPREHENSION PLUS FACILE
		CHANGER JUSTE LE MESSAGE DE RETOUR DU ROUTER POUR COMPRENDRE CE QUIL SE PASSE
*/

// DOCUMENT PARTIE SERVEUR 
var connected = {};
var data = {};

connected.start=function(){

	document.addEventListener('click', connected.on_click_function_);
};

connected.on_click_function_ = function(ev){
	var src = ev.target;
	var id = src.id;

	if(id == "logout_link_"){
		alert('logout');
	}else if(id == "delete_account_"){
		connected.fill_data_();
		connected.post(data, connected.callback); //passage au router des données
	}
};

connected.fill_data_ = function(){
	data.ac = "delete_account";
};


connected.post = function (data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.onreadystatechange = callback;
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
};



connected.callback = function () {
	if (this.readyState == 4 && this.status == 200) {

	var r = JSON.parse(this.responseText); // conversion string en Objet JSON
	console.log(r);
	if (r.message=="account_deleted"){
		window.location = "../index.html";
	}else if (r.message=="error_delete_account"){
		alert("Erreur de suppression du compte");
	}else{
		alert("Erreur de connexion à la db");
	}
}
};

window.onload = function(){
		setTimeout(connected.start, 1);
};

