/*
		UNE SEULE FONCTION POST ET UNE SEULE CALLBACK PAR PAGE POUR UNE LISIBILITE ET COMPREHENSION PLUS FACILE
		CHANGER JUSTE LE MESSAGE DE RETOUR DU ROUTER POUR COMPRENDRE CE QUIL SE PASSE
*/

var connected = {}; // objet contenant toutes nos fonctions
var data = {}; //objet : transmettre au routeur

// fonction appelée au chargement de la page (voir window.onload au bas de la page)
connected.start = function () {
	connected.btn_delete_account_();
};


connected.btn_delete_account_ = function(){
	$( "#delete_account_" ).submit( function(event){
	event.preventDefault();
		connected.fill_data_register();		
		connected.post(data, connected.callback); //passage au router des données
	}else{
		alert("confirm password et password different");
	}
	});
};

connected.fill_data_register = function(){
	data.ac = "delete_account";
};


connected.post = function (data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.onreadystatechange = callback;
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
};

// fonction de retour pour notre objet connected
connected.callback = function () {
	if (this.readyState == 4 && this.status == 200) {		
		console.log("this.responsetext :" + this.responseText);
		var r = JSON.parse(this.responseText); // conversion string en Objet JSON

		if (r.message=="acount_deleted"){
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