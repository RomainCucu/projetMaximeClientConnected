/*
		UNE SEULE FONCTION POST ET UNE SEULE CALLBACK PAR PAGE POUR UNE LISIBILITE ET COMPREHENSION PLUS FACILE
		CHANGER JUSTE LE MESSAGE DE RETOUR DU ROUTER POUR COMPRENDRE CE QUIL SE PASSE
*/

// DOCUMENT PARTIE SERVEUR 
var connected = {};
var data = {};
var contenuHTML = {};//objet qui va contenir temporairement le code html (du bouton login par exemple)

connected.start=function(){
	document.addEventListener('click', connected.on_click_function_);//evenement on clique
	connected.btn_search_a_user();//pour la rechearche d'users
	connected.show_pseudo_();//pour afficher le pseudo
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

connected.btn_search_a_user = function(){
	$( "#search_form_" ).submit( function(event){
	event.preventDefault();//à laisser
	$('#affichage_users_found_under_').popover('destroy');
	connected.replace_content_by_animation_GIF_loader("btn_search_a_user");
	connected.post({ac:"search_user_request",search_name:document.getElementById("affichage_users_found_under_").value}, connected.callback); //passage au router des données	
	//document.getElementById("affichage_users_found_under_").data-toggle="popover"
	});
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
	}else if(r.message=="recherche_dutilisateurs_"){
		connected.show_user_under_search_bar(r.liste_user_found);//envoi du tableau contenant les user pour afficher les user trouvé
		document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
	}else if(r.message=="search_name_length_too_short"){
		document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
	}
	else{
		alert("Erreur");
	}
}else if(this.status==501) window.location="../index.html"
};

window.onload = function(){
		setTimeout(connected.start, 1);
};


connected.show_user_under_search_bar = function(tab){
	console.log("kokkok");
	var content_tmp="";
	for(var i in tab){
		content_tmp+= "<p>"+tab[i]+"</p>";
	}
	$('#affichage_users_found_under_').popover({
		title : 'resultat de la recherche',
		html: true,
		content : content_tmp,
		placement : "bottom"
	});
	$('#affichage_users_found_under_').popover('show');
};

connected.replace_content_by_animation_GIF_loader = function(id){
	contenuHTML.string = document.getElementById(id).innerHTML; // objet contenuHTML créé en haut du doc
	contenuHTML.id = id;
	document.getElementById(id).innerHTML = '<img src="../images/gif_loader/loading_connexion.gif" style="height:auto width:auto" >';
	
	// script qui simule l'evenement clique sur un bouton (ici celui qui lance le modal dans le fichier index.html
	/*var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
	document.getElementById("bt1").dispatchEvent(evt);*/
};

