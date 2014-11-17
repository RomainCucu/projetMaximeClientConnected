/*
		UNE SEULE FONCTION POST ET UNE SEULE CALLBACK PAR PAGE POUR UNE LISIBILITE ET COMPREHENSION PLUS FACILE
		CHANGER JUSTE LE MESSAGE DE RETOUR DU ROUTER POUR COMPRENDRE CE QUIL SE PASSE
*/

// DOCUMENT PARTIE SERVEUR 
var connected = {};
var data = {};

connected.start=function(){
	document.addEventListener('click', connected.on_click_function_);//evenement on clique
	connected.show_pseudo_();
};

connected.on_click_function_ = function(ev){
	var src = ev.target;
	var id = src.id;

	if(id == "logout_link_"){
		connected.post({ac:"log_out_account"}, connected.callback); //passage au router des données
	}else if(id == "delete_account_"){
		connected.fill_data_();
		connected.post(data, connected.callback); //passage au router des données
	}
};

connected.fill_data_ = function(){
	data.ac = "delete_account";
};

connected.show_pseudo_ = function(){
	connected.post({ac:"pseudo_request_"}, connected.callback); //passage au router des données
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
	}else if (r.message=="logout_successful"){
		window.location = "../index.html";
	}else if (r.message=="log_out_failed"){
		alert("Erreur de deconnexion du compte");
	}else if (r.message=="pseudo_request_successfull"){
		document.getElementById("showing_pseudo").innerHTML = "signed as "+r.pseudo;
	}
	else{
		alert("Erreur");
	}
}
};

window.onload = function(){
		setTimeout(connected.start, 1);
};

