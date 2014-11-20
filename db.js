var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

exports.login=function(username, pwd, res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//en cas d'erreur de connexion
						console.log("erreur de connexion dans la fonction login: "+err);
						res.end(JSON.stringify({message: "erreur_connection"}));
						return;
	}else{	
	var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
	collection.find({username:username,password:pwd}).toArray( function(err, results){
		if (err) {//en cas d'erreur de la fonction find
						console.log("erreur lors dans la fonction login, collection.find: "+err);
						res.end(JSON.stringify({message: "erreur_login"}));
						db.close(); // on referme la db
					}
		else if(results[0]){//si on trouve bien un document avec l'username et le pwd associé, alors results[0] existe			   
				var cookie = {};// création objet cookie qui prendra un champ value et expire (date d'expiration)
				cookie.value = ""+username.substring(0,3)+Math.floor(Math.random() * 100000000); //valeur du cookie
				cookie.expire = new Date(new Date().getTime()+900000).toUTCString(); //expire au bout de 1 heure
				//on met à jour le document associé à l'username et au pwd avec le cookie
				collection.update({username: username, password: pwd},{ $set: {cookie:cookie}}, { upsert: true }, function(err, docs){
					if(err) {//en cas d'erreur d'update
						console.log("erreur fonction login, fonction collection.update"+err);
						res.end(JSON.stringify({message: "erreur_login"}));
						db.close(); // on referme la db
					}else{						
						infos={};//objet transmis au client
						infos.message="login_connexion_autorised_";
						res.writeHead(200, {"Content-Type": "'text/plain'", "Set-Cookie" : 'cookieName='+cookie.value+';expires='+cookie.expire});//on met le cookie dans le header										
						res.end(JSON.stringify(infos));
						db.close(); // on referme la db
					}
				});
			}else{//si il n'y a pas de documents associés au username et pwd
				res.end(JSON.stringify({message: "erreur_login_information_entrante"}));
				db.close(); // on referme la db
			}
			});
}
});	
};

exports.register = function (username,pwd,res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//en cas d'erreur de connection
						console.log("erreur de connexion au niveau de register: "+err);
						res.end(JSON.stringify({message: "erreur_connection"}));
						return;
			}
	else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.insert({username: username.toLowerCase(), password: pwd, pseudo:username},function(err, doc){
			if(err){
				//renvoie généralement une erreur lorsque le nom d'utilisateur est déjà présent,
				//car il y a un Index-Unique sur le username dans la collection users				
				res.end(JSON.stringify({message:"username_existant_"}));
				db.close(); // on referme la db
			}else{				
				res.end(JSON.stringify({message:"register_ok_"}));
				db.close(); // on referme la db
			}
		});
	}
});
};


exports.delete_ = function (cookie_header, password_user, res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log("erreur connexion fonction set_info: "+err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{		
		var collection = db.collection('users');
		var m = cookie_header.split("cookieName=");	
		collection.remove({"cookie.value": m[1], password:password_user},function(err, doc){
			if(err){
				console.log("erreur fonction delete fonction remove: "+err);
				res.end(JSON.stringify({message:"error_delete_account"})); 
				db.close(); // on referme la db
			}else{
				if(doc==0){ // user not found( mauvais mdp)
					res.end(JSON.stringify({message:"mauvais_pawssword"})); 
					db.close(); // on referme la db
				} else if(doc==1){ // suppression réussie
					res.end(JSON.stringify({message:"account_deleted"}));
					db.close(); // on referme la db
				}
			}
		});
	}
});
};

exports.logout = function(cookie, res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//erreur de connexion
			console.log("erreur de connexion fonction logout: "+err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		var m = cookie.split("cookieName=");//on recupére la valeur du cookie qui nous intéresse
		//on met à jour la bdd avec cookie = 0
		collection.update({"cookie.value": m[1]},{ $set: {cookie:0}}, { upsert: true }, function(err, docs){
					if(err) {//err fonction update
						console.log("erreur fonction logout, fonction update: "+err);
						res.end(JSON.stringify({message: "log_out_failed"}));
						db.close(); // on referme la db
					}else{
						res.end(JSON.stringify({message:"logout_successful"}));
						db.close(); // on referme la db
					}
				});
	}
});
};

exports.get_info=function(c, res){
	MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {	
				console.log("erreur fonction get_info connection: "+err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{	
			c = c.split("cookieName=");
			var collection = db.collection('statutBox');
			var collection2 = db.collection('users'); 
			collection2.find({"cookie.value": c[1]}).toArray(function(err, results1){
				if(err){
					console.log("erreur fonction get_info fonction find 1: "+err);
					res.end(JSON.stringify({message:"erreur_de_la_db_"}));
					db.close();
				} else if (results1[0]){
					r1=results1[0].friendList; 
				if(r1){ 
				if(r1.length>=1){ // cool il a des amis
						var tab = [];
						results1[0].friendList.forEach(function(entry){
							tab.push(entry.toString());

						})
						tab.push(results1[0].username);
						console.log(tab[tab.length-1]);
						collection.find( {  username:{ $in: tab }} ).sort({"date_status":-1}).limit(21).toArray(function(err, results){
							if(err){
								console.log("erreur fonction get_info fonction find 2: "+err);
								res.end(JSON.stringify({message:"erreur_de_la_db_"}));
								db.close();
							} else {
								if(results[0]) {// si ya au moins un statut a afficher
									
											var status_perso=[];
											for(a in results){
												if (results[a].username==results1[0].username){
													status_perso.push(results[a]);
												}
											}

											var results_analyse=[];
											for(b in results){
												if(results[b].username!=results1[0].username){
													results_analyse.push(results[b]);
												}
											}


											var obj_a_transmettre={};
											obj_a_transmettre.message="status_update";
											obj_a_transmettre.donnees=results_analyse;
											obj_a_transmettre.status_perso=status_perso[0].status_user; // le status est tjrs le premier elmt du tab
											res.end(JSON.stringify(obj_a_transmettre)); 
								} else { // si ya 0 statut à afficher
									res.end(JSON.stringify({message:"no_status_to_show"})); 
									db.close();
								}
							}
					});
				} }// if r1
					else {
						res.end(JSON.stringify({message:"no_friends"}));
						db.close();
					}	
				}
			});
		}
});
};


exports.set_info=function(status_user, cookie, res){	
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log("erreur connexion fonction set_info: "+err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{		
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		var collection2 = db.collection('statutBox');
		cookie = cookie.split("cookieName=");
			collection.find({"cookie.value": cookie[1]}).toArray(function(err, results){
					if(err) {
							console.log("erreur fonction set_info fonction find: "+err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"}));
							db.close(); // on referme la db
					}else if(results[0]){ // il a bien un cookie valide

						username=results[0].username;
						date_status = new Date();

						collection2.insert({username: username, date_status: date_status, status_user:status_user},function(err, doc){
							if(err){
								console.log("erreur fonction set_info fonction find: "+err);
								res.end(JSON.stringify({message:"erreur_de_la_db_"}));
								db.close(); // on referme la db
							}else{
								res.end(JSON.stringify({message:"tab_status_added"}));
								db.close(); // on referme la db
							}
						});			
					}					
				});
	}
});
};


exports.add_friend = function(friend_pseudo_to_add,cookie,res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//erreur de connexion
			console.log("erreur connexion fonction add_friend: "+err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		var m = cookie.split("cookieName=");//on split la valeur du cookie (eg:cookieName=rom19982790) car on veut que la deuxième partie
		collection.find({"cookie.value": m[1]}).toArray(function(err, results){
					if(err) {
							console.log("erreur fonction add_friend, fonction find: "+err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"})); // conversion de l'objet JSON en string
							db.close(); // on referme la db
					}else if(results[0]){//si on trouve un document associé au cookie
						if(friend_pseudo_to_add != results[0].pseudo){//si la personne qui demande l'ajout n'est pas la personne qui ajoute
							var tab;//varaiable contenant le tableau à transmettre
							if (!results[0].friendList){//si l'user n'a pas damis
								tab = [];//on creer un nouveau tableau avec l'user entré en paramètre
								tab.push(friend_pseudo_to_add);
							}else{//si luser a déjà une friend list
								tab = results[0].friendList;//le tableau = le tableau de friend list trouvé dans la DB
								if (tab.indexOf(friend_pseudo_to_add)> -1){//si l'ami est deja dans la friend list
									res.end(JSON.stringify({message:"amis_not_ajouted_car_deja_present"}));
									db.close(); // on referme la db
								}else{
									tab.push(friend_pseudo_to_add);//on rajoute l'ami dans le tableau							
								}								
							}
							//l'user que l'on veut ajouter n'est ni SOI-M^ME ni déjà présent dans la friend list
							//on met à jour le document avec le nouveau tableau d'amis			
							collection.update({"cookie.value": m[1]},{ $set: {friendList:tab}}, { upsert: true }, function(err, docs){
								if(err) {
									console.log("erreur fonction add_friend, fonction update: "+err);
									res.end(JSON.stringify({message:"erreur_de_la_db_"}));
									db.close(); // on referme la db
								}else{
									res.end(JSON.stringify({message:"amis_ajouted"}));
									db.close(); // on referme la db
								}
							});
						}else{
							res.end(JSON.stringify({message:"ajout_de_soi_meme"}));
							db.close(); // on referme la db
						}
					}else{//erreur si le cookie n'est pas trouvé
						res.end(JSON.stringify({message:"cookie_not_found"}));
						db.close(); // on referme la db
					}
				});
	}
});
};

exports.get_friends = function(cookie,res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//erreur de connexion
			console.log("erreur de connexion fonction get friends: "+err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		var m = cookie.split("cookieName=");//on recupere la valeur du cookie qui nous intéresse
		collection.find({"cookie.value": m[1]}).toArray(function(err, results){//on veut acceder à la friend list du document avec le cookie correspondant
					if(err) {
							console.log("erreur fonction add_friends, fonction find: "+err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"}));
							db.close(); // on referme la db
					}else if(results[0]&&results[0].friendList){//si on trouve bien la friend liste associé au cookie ET si la liste existe (<=> il a un ou + amis)
						//renvoi le tableau contenant les amis
						res.end(JSON.stringify({message:"friends_found_",friendList:results[0].friendList}));
						db.close(); // on referme la db
					}else if(results[0] && !results[0].friendList){//si on trouve bien la friend liste associé au cookie ET si la liste n'existe pas (<=> il a 0 ami)
						res.end(JSON.stringify({message:"none_friend_list_"}));
						db.close(); // on referme la db
					}else{//erreur si le cookie n'est pas trouvé
						res.end(JSON.stringify({message:"cookie_not_found"}));
						db.close(); // on referme la db
					}
		});
	}
});
};

exports.delete_friend = function(friend_to_delete,cookie, res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//si erreur de connexion
			console.log("erreur de connexion fonction delete_friend: "+err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users');//on veut acceder à la collection users de la db ProjetEsme
		var m = cookie.split("cookieName=");
		collection.find({"cookie.value": m[1]}).toArray(function(err, results){
					if(err) {//erreur fonction find
							console.log("erreur fonction delete_frien, fonction find: "+err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"}));
							db.close(); // on referme la db
					}else if(results[0]){//si on trouve un document associé au cookie
						if(results[0].friendList){//si le document a une friend liste
							var array = results[0].friendList;//on recupere le tableau friend list
							var index = array.indexOf(friend_to_delete);// on cherche l'index de l'ami à supprimer
							if (index > -1) {//si l'ami à supprimer est présent dans la friend list
							    array.splice(index, 1);//on retire l'ami du tableau
								//on met à jour le document avec le nouveau tableau d'amis
							    collection.update({"cookie.value": m[1]},{ $set: {friendList:array}}, { upsert: true }, function(err, docs){
								if(err) {//erreur update
									console.log("erreur dans la fonction delete_friend, fonction update: "+err);
									res.end(JSON.stringify({message:"erreur_de_la_db_"}));
									db.close(); // on referme la db
								}else{
									res.end(JSON.stringify({message:"deletion_done_"}));
									db.close(); // on referme la db
								}
								});
							}else{//si l'ami à supprimer n'est pas dans la friend list : certainement tentative de hack								
								res.end(JSON.stringify({message:"friend_not_in_the_list"}));
								db.close(); // on referme la db
							}
						}else{//si le document n'a pas une friend liste
							res.end(JSON.stringify({message:"none_friend_to_delete_"}));
							db.close(); // on referme la db
						}
					}else{//erreur si le cookie n'est pas trouvé
						res.end(JSON.stringify({message:"cookie_not_found"})); // conversion de l'objet JSON en string
						db.close(); // on referme la db
					}
	});
	}
});
};

exports.search_user_request = function(search_name,cookie,res){
var m = cookie.split("cookieName=");
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
			console.log(err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.find().toArray(function(err, results){
					if(err) {
						console.log(err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"})); // conversion de l'objet JSON en string				
						db.close(); // on referme la db
					}else{
						var infos={};
						infos.liste_user_found = [];
						for(var i in results){
						//boucle for pour remplir les users trouver selon l'algo de la boucle if
							if((results[i].pseudo.toLowerCase().indexOf(search_name.toLowerCase())> -1) || similar(results[i].pseudo.toLowerCase(),search_name.toLowerCase())> 50)//pour voir si la chaine est contenu dans un pseudo
								{
									infos.liste_user_found.push(results[i].pseudo);
								}
						}
						infos.message="recherche_dutilisateurs_"; // ajout d'un attribut message a l'objet pour gérer les cas dans index.jsr
						if(infos.liste_user_found.length==0){
							infos.liste_user_found.push("Not occurence founded");
							infos.message="aucun_utilisateur_trouved";
							res.end(JSON.stringify(infos))
							db.close(); // on referme la db
						} 
						res.end(JSON.stringify(infos)); // conversion de l'objet JSON en string
						db.close(); // on referme la db
					
					}
				});
	}
});//conecct
};

exports.pseudo_request_ = function(cookie,res){
var m = cookie.split("cookieName=");
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
			console.log(err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.find({"cookie.value": m[1]}).toArray(function(err, results){
					if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "pseudo_request_failed"}));
						db.close(); // on referme la db
					}else{
										infos={};
										infos.pseudo=results[0].pseudo;
										infos.message="pseudo_request_successfull";
										res.end(JSON.stringify(infos));
										db.close(); // on referme la db
					}
				});
	}
});
};

exports.valid_cookie = function(c,obj,fct){
	/*
	fonction pour voir si le cookie existe ou non dans la db
	il faut prendre dans cookieName= la valeur aprés et vérifier 
	avec cookie.value dans la DB USERS
	*/
	if (c){
				MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
				    if(err) {
				    	console.log(err);
				    	obj[fct](false);
				    	return;
				    }else{
					var collection = db.collection('users');
					c = c.split("cookieName=");
					collection.find({"cookie.value": c[1]}).toArray(function(err, results) {
						 if (err){
						 	console.log(err);
						 	obj[fct](false);
						 	db.close(); // on referme la db	 
						 }else if (results[0]){	 	
						 	obj[fct](true);	 
						 	db.close(); // on referme la db
						 }else if (!results[0]){	 	
						 	obj[fct](false);	 
						 	db.close(); // on referme la db
						 }	 
					});	
}
				});

}else{
	obj[fct](false);
}
};

function similar(a,b) {
    var lengthA = a.length;
    var lengthB = b.length;
    var equivalency = 0;
    var minLength = (a.length > b.length) ? b.length : a.length;    
    var maxLength = (a.length < b.length) ? b.length : a.length;    
    for(var i = 0; i < minLength; i++) {
        if(a[i] == b[i]) {
            equivalency++;
        }
    }
    var weight = equivalency / maxLength;
    return (weight * 100);
};

