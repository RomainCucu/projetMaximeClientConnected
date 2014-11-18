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
	connected.show_frient_list();
	connected.btn_delete_account_(); // pour supprimer le compte de l'user
	connected.btn_submit_status_(); // pour stocker un status de l'user
};

connected.on_click_function_ = function(ev){ // pour logout et masquer le popup de la recherche d'user
	var src = ev.target;
	var id = src.id;
	if(id == "logout_link_"){
		connected.post({ac:"log_out_account"}, connected.callback); //passage au router des données
	}else if(src.className.indexOf("lien_ajout_ami")>-1){
		connected.replace_content_by_animation_GIF_loader(id);//pour remplacer le bouton par un chargement
		connected.post({ac:"add_friend_request",friend_to_add:id}, connected.callback); //passage au router des données
	}else if(src.className.indexOf("lien_supp_ami")>-1){
		connected.replace_content_by_animation_GIF_loader(id);//pour remplacer le bouton par un chargement
		connected.post({ac:"delete_friend_request",friend_to_delete:id}, connected.callback); //passage au router des données
	}
	else{
		$('#affichage_users_found_under_').popover('destroy'); // efface le popover quand on clique n'imp ou sur la page
	}
};

connected.btn_submit_status_=function(){
	$("#submit_status_user").submit(function(event){
		event.preventDefault();
		if(document.getElementById('status_user').value != ""){
			connected.fill_data_status();
			connected.post(data, connected.callback);
			console.log("on envoie au router maggle");
		}
	});
};

connected.fill_data_status=function(){
	data.ac = "add_status";
	data.status_user=document.getElementById('status_user').value;
	console.log(data.status_user);
};

connected.btn_delete_account_ = function(){
	$( "#delete_account_confirm" ).submit( function(event){
	event.preventDefault(); // ne nous redirige pas vers une page pourri
	if(document.getElementById('confim_password_to_delete').value != ""){
		connected.fill_data_();		
		connected.post(data, connected.callback);//passage au router des données
		connected.replace_content_by_animation_GIF_loader("btn_del_usr");//pour remplacer le bouton par un chargement
	}else{
		alert("Please, enter a valid password");
	}

	});
};

connected.get_status=function(){
	data.ac = "get_status";
	connected.post(data, connected.callback);//passage au router des données
};

connected.fill_data_ = function(){
	data.ac = "delete_account";
	data.password=document.getElementById('confim_password_to_delete').value;
};

connected.show_pseudo_ = function(){
	connected.post({ac:"pseudo_request_"}, connected.callback); //passage au router des données
};

connected.show_frient_list = function(){
	connected.post({ac:"friend_list_request"}, connected.callback); //passage au router des données
};

connected.btn_search_a_user = function(){
	$( "#search_form_" ).submit( function(event){ // quand on clique sur le bouton search
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
		if (r.message=="account_deleted"){
			window.location = "../index.html";
		}else if (r.message=="error_delete_account"){
			console.log("Erreur de suppression du compte");
		}else if(r.message == "mauvais_pawssword"){
			document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
			console.log("Suppr impossible, mauvais mdp");
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
		}else if (r.message=="pseudo_request_failed"){
			connected.show_user_under_search_bar(r.liste_user_found);//envoi du tableau contenant "no occurence found"
			document.getElementById(contenuHTML.id).innerHTML = contenuHTML.string;//pour remettre le bouton originel (car gif qui tourne)
		}else if (r.message=="ajout_de_soi_meme"){
			document.getElementById(contenuHTML.id).innerHTML = '<span class="text-danger">Vous ne pouvez pas vous ajoutez</span>';
			console.log("tu t'ajoutes toi même");
		}else if (r.message=="amis_not_ajouted_car_deja_present"){
			document.getElementById(contenuHTML.id).innerHTML = '<span class="text-warning">Vous avez deja cet ami</span>';
			console.log("tu as deja cet amis dans ta liste damis");
		}else if (r.message=="amis_ajouted"){
			connected.show_frient_list();
			document.getElementById(contenuHTML.id).innerHTML = '<span class="text-success">Ajout Réussi</span>';
			console.log("amis ajouté avec succés");
		}else if (r.message=="friends_found_"){
			console.log("amis trouvés");
			connected.afficher_friend_list_dans_html(r.friendList);
		}else if(r.message == "none_friend_list_"){
			document.getElementById("affichage_friend_list_").innerHTML = '<li class="list-group-item"><strong>No Friends Found</strong></li>'
		}else if(r.message == "deletion_done_"){
			console.log("amis supprimés");
			connected.show_frient_list();
		}else if(r.message=="tab_status_added"){
			console.log("status ajouté avec succes !");
		}else if(r.message=="to_short"){
			alert("Status vide");
		}else if(r.message=="status_update"){
			connected.display_status(r);				
		}else{
			console.log("Erreur");
		}
	}else if(this.status==501) window.location="../index.html"
};


connected.display_status=function(r){
	document.getElementById("show_status").innerHTML = ""; // On efface le contenu avant de recréer le chat
					
						// pour le titre
			
								var newLine1 = document.createElement('TR'); // pour creer une nouvelle ligne qui contiendra le titre "id" et "messages"
		
								// ID
								var newRow01 = document.createElement('TH');// pour creer une nouvelle colonne avec le titre ID
								
								newRow01.style.width="100px";
								newRow01.style.minWidth="100px";
								newRow01.style.maxWidth="100px";
								
					
								var newRowText01 = document.createTextNode('Pseudo'); // qui contient la chaine de caractere 'ID'
								newRow01.appendChild(newRowText01); // On ajoute le titre à TD	
								newLine1.appendChild(newRow01); // On ajoute 'TD' à 'TR'
								
								// Messages
								var newRow02 = document.createElement('TH');// pour creer une nouvelle colonne avec le titre ID
								newRow02.style.minWidth="50px";
								newRow02.style.maxWidth="100px";
							
								
								var newRowText02 = document.createTextNode('Pseudo'); // qui contient la chaine de caractere 'ID'
								newRow02.appendChild(newRowText02); // On ajoute le titre à TD	
								newLine1.appendChild(newRow02); // On ajoute 'TD' à 'TR'
								
								
									// date
								var newRow03 = document.createElement('TH');// pour creer une nouvelle colonne avec le titre ID
								newRow03.style.minWidth="50px";
								newRow03.style.maxWidth="100px";
							
								var newRowText03 = document.createTextNode('Date'); // qui contient la chaine de caractere 'ID'
								newRow03.appendChild(newRowText03); // On ajoute le titre à TD	
								newLine1.appendChild(newRow03); // On ajoute 'TD' à 'TR'
								
								document.getElementById("show_status").appendChild(newLine1); // On ajoute TR au tableau
								
								
								
			for(i=r.length-1; i>r.length-20; i--) {// pour parcourir du plus récent au plus vieux
									
					var newLine = document.createElement('TR'); // pour creer une nouvelle ligne qui contien id + message
					newLine.style.height="30px";	
							
						if(i%2==0){
							newLine.style.background="#eee";
						}
						
						// pour les id
				
						var newRow1 = document.createElement('TD');// pour creer une nouvelle colonne avec l'id

						var newRowText1 = document.createTextNode(r[i].username);// qui contien lid						
						newRow1.appendChild(newRowText1);// on ajoute le texte à TD
						newLine.appendChild(newRow1);// on ajoute TD à TR
			
						// pour les message
					
						// pour creer une nouvelle colonne avec le message
						var str = r[i].status_user;
						
						if (str.length > 75){
							var newRow2 = document.createElement('td');
						
							var ell = str.substring(0,75);
							var ell2 = str.substring(76, 150);
							var newRowText2 = document.createTextNode(ell +"\n" + ell2);// qui contient le message					
							newRow2.appendChild(newRowText2);// on ajoute le message à TD
							
							newLine.appendChild(newRow2);// on ajoute TD à TR
							
						}else{
							var newRow2 = document.createElement('td');
							var newRowText2 = document.createTextNode(str);// qui contient le message					
							newRow2.appendChild(newRowText2);// on ajoute le message à TD
							newLine.appendChild(newRow2);// on ajoute TD à TR
						}
						
						
						// Pour la date
						/* var now = new Date();
						var annee   = now.getFullYear();
						var mois    = now.getMonth() + 1;
						var jour    = now.getDate();
						var heure   = now.getHours();
						var minute  = now.getMinutes();
						var seconde = now.getSeconds();
	 
						var DateDuJour = ("posté le "+jour+"/"+mois+"/"+annee+" à "+heure+" : "+minute+" : "+seconde+" :" );
						// Résultat: Nous sommes le 2/11/2012 et il est 19 heure 57 minutes 37 secondes */
						
						
						var newRow3 = document.createElement('TD');// pour creer une nouvelle colonne avec la date
						console.log(r[2][i]);
						var newRowText3 = document.createTextNode((r[i].date_status));// qui contien la date	
						newRow3.style.color ="purple";					
						newRow3.appendChild(newRowText3);// on ajoute le texte à TD
						newLine.appendChild(newRow3);// on ajoute TD à TR
						
						//on ajoute TR à table
						
						
						document.getElementById("show_status").appendChild(newLine);
						}

};

connected.show_user_under_search_bar = function(tab){	
	var content_tmp="";
	for(var i in tab){
		content_tmp+= "<p>"+tab[i]+" "+'<a  class="lien_ajout_ami glyphicon glyphicon-plus-sign" id="'+tab[i]+'" style="color:green;"aria-hidden="true"></a>'+"</p>";
	}
	$('#affichage_users_found_under_').popover({
		title : 'Resultat de la recherche',
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

connected.afficher_friend_list_dans_html = function(tab){
	if(tab.length>0){
		var content_tmp="";
		content_tmp='<li class="list-group-item"><strong>Your Friends</strong></li>';
		for(i in tab){		
			content_tmp+='<li class="list-group-item">'+tab[i]+'<a  class="lien_supp_ami glyphicon glyphicon-remove-sign" id="'+tab[i]+'-delete" style="color:red;"aria-hidden="true"></a>'+'</li>';
		}
		document.getElementById("affichage_friend_list_").innerHTML = content_tmp;
	}else{
		document.getElementById("affichage_friend_list_").innerHTML = '<li class="list-group-item"><strong>None friends</strong></li>';
	}
};


window.onload = function(){
		setTimeout(connected.start, 1);
};

window.setInterval(connected.get_status,20000);


