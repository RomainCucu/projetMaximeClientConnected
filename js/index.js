/*
		UNE SEULE FONCTION POST ET UNE SEULE CALLBACK PAR PAGE POUR UNE LISIBILITE ET COMPREHENSION PLUS FACILE

		CHANGER JUSTE LE MESSAGE DE RETOUR DU ROUTER POUR COMPRENDRE CE QUIL SE PASSE
*/

var index = {}; // objet contenant toutes nos fonctions
var data = {}; //objet : transmettre au routeur
var contenuHTML = {};//objet qui va contenir temporairement le code html (du bouton login par exemple)

// fonction appelée au chargement de la page (voir window.onload au bas de la page)
index.start = function () {
	index.btn_check_login_formular_(); //action du bouton login	
	index.btn_register_formular_();
};


index.btn_register_formular_ = function(){
	$( "#register_formulaire_" ).submit( function(event){
	event.preventDefault();//à laisser
	if(document.getElementById('register_password').value == document.getElementById('register_confirm_password').value){
		index.fill_data_register();		
		index.post(data, index.callback);//passage au router des données
		index.replace_content_by_animation_GIF_loader("btn_register_");//pour remplacer le bouton par un chargement
		//$('#modal-reg').modal('hide');
	}else{
		alert("confirm password et password different");
	}
	});
};

index.fill_data_register = function(){
	data.ac = "register";
	data.username =document.getElementById('register_username').value;
	data.password =document.getElementById('register_password').value;

};

index.btn_check_login_formular_ = function(){
	//ce quil se passe quand on appuie sur le bouton login
	$( "#log_in_formular_" ).submit( function(event){
	 index.fill_data_login(); //action pour remplir data	 
	 index.replace_content_by_animation_GIF_loader("button_login");//pour remplacer le bouton par un chargement
	 index.post(data, index.callback);//passage au router des données
	 event.preventDefault();//à laisser
	} );
};

index.fill_data_login = function(){
	//pour remplir l'objet data avec le username et password et l'action à réaliser
	data.ac = "login"; // action a traité pour le routeur
	data.username = document.getElementById('input_username_').value.toLowerCase();
	data.password = document.getElementById('input_password_').value;
};


index.test = function(){
	//index.post({ac:"register",username:"romain",password:"romain"},index.callback);
	index.post({ac:"login",username:"romain",password:"romain"},index.callback);
	
	//index.post({ac:"logout",id_:"546a49662d6d510f4d05cf96"},index.callback);
};

index.post = function (data, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/");
    xhr.onreadystatechange = callback;
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(data));
};

// fonction de retour pour notre objet index
index.callback = function () {
	// si tout s'est bien passé
	var r = JSON.parse(this.responseText); // conversion string en Objet JSON
	console.log(r);
	console.log("status: "+this.status);
	/*if (this.readyState == 4 && this.status == 200) {		
	//	console.log("this.responsetext :" + this.responseText);
		var r = JSON.parse(this.responseText); // conversion string en Objet JSON
		
		if (r.message=="login_connexion_autorised_"){
			window.location = "./html/connected.html";
		}else if (r.message=="erreur_login_information_entrante"){
			document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
			index.mettre_les_cases_en_rouges_du_formulaire("boites_pour_entrer_les_login_");
			alert("Erreur de connexion");
		}else if (r.message == "register_problem_info_entered"){
			document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
			alert("usernamen password length must be between 3 and 10 and only alphanumerical symbols please !");
		}else if(r.message=="username_existant_"){
			alert("username existant");
			document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
		}else if(r.message == "register_ok_"){		
			data.ac = "login";
			index.post(data, index.callback);//passage au router des données
		}
		else{
			//alert("demande  rejetée !");
			console.log("ko");
		}
}*/
};

index.replace_content_by_animation_GIF_loader = function(id){
	contenuHTML.string = document.getElementById(id).innerHTML; // objet contenuHTML créé en haut du doc
	contenuHTML.id = id;
	document.getElementById(id).innerHTML = '<img src="./images/gif_loader/loading_connexion.gif" style="height:auto width:auto" >';
	
	// script qui simule l'evenement clique sur un bouton (ici celui qui lance le modal dans le fichier index.html
	/*var evt = document.createEvent("MouseEvents");
	evt.initMouseEvent("click", true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
	document.getElementById("bt1").dispatchEvent(evt);*/
};

index.mettre_les_cases_en_rouges_du_formulaire = function(classname){
	/*
	prend en paramettre le classname
	et ajoute has error a la classe pour dire que c pas bon et entoure la case en rouge
	*/
	var arr =document.getElementsByClassName(classname);
	if(arr.length>0){
		for(i=0;i<arr.length;i++){
			arr[i].className=arr[i].className+" has-error";
		}
	}
	return;
};

window.onload = function(){
		setTimeout(index.test, 1);
};