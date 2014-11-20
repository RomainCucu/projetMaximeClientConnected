var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;


exports.afficher_toute_la_base = function(){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
    if(err) throw err;//si erreur de connections
	
	 var collection = db.collection('test1');//on veut acceder à la collection test 1 de la db ProjetEsme
	 collection.find().toArray(function(err, results) {
    	if (err) throw err;
	
      console.log(results);
        
        // Let's close the db
      db.close();
   });
});
};



exports.get_status=function(c, res){
	MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {	
				console.log(err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{	
			c = c.split("cookieName=");
			var collection = db.collection('chatbox');
			var collection2 = db.collection('users'); 
			collection2.find({"cookie.value": c[1]}).toArray(function(err, results1){
				if(err){
					console.log(err);
					res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
				} else if (results1[0]){
					r1=results1[0].friendList; 
				if(r1){ 
				if(r1.length>=1){ // cool il a des amis

				
					/*var string_requete_db="";
		
					for(variable in r1){
						string_requete_db +='{ "username": "' + r1[variable] + '" },';
					}

					var string_requete_finale = string_requete_db.substring(0,(string_requete_db.length -1 ));
				
					string_requete_finale="[" + string_requete_finale + "]";
				
					var objet_requete_db = JSON.parse(string_requete_finale);*/
					
					// ca nous sort tous les amis qui on publié un status
					//collection.find( { $or: objet_requete_db } ).sort({"date_status":-1}).toArray(function(err, results){
						var tab = [];
						results1[0].friendList.forEach(function(entry){
							tab.push(entry.toString());

						})
						collection.find( {  username:{ $in: tab }} ).sort({"date_status":-1}).toArray(function(err, results){
							if(err){
								console.log(err);
								res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
							} else {

								if(results[0]) {// si ya au moins un statut a afficher
									
											var obj_a_transmettre={};
											obj_a_transmettre.message="status_update";
											obj_a_transmettre.donnees=results.reverse();
											res.end(JSON.stringify(obj_a_transmettre)); 
								} else { // si ya 0 statut à afficher
									res.end(JSON.stringify({message:"no_status_to_show"})); 
								}
							}
					});
					

					// A LAISSER
					
/* //TROP GOURMAND EN RESSOURCE
					collection.find({}).sort({"date_status":-1}).toArray(function(err, results){ // results est un tableau
						if(err) {
								console.log(err);
								res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
						}else { 

								var tab_status_friends =[];
								for(var i=0; i<r1.length; i++){
									for(var j=0; j<results.length; j++){
										if(results[j].username==r1[i]){
											tab_status_friends.push(results[j]);
										}
									}
								}

								if(tab_status_friends.length<1){
									res.end(JSON.stringify({message:"no_status_to_show"})); 
								} else {
										var obj_a_transmettre={};
										obj_a_transmettre.message="status_update";
										//console.log(tab_status_friends);
										obj_a_transmettre.donnees=tab_status_friends.reverse();
										//console.log(JSON.stringify(obj_a_transmettre));
										res.end(JSON.stringify(obj_a_transmettre)); 
								}
					
						}
					});
*/
				} }// if r1
					else {
						res.end(JSON.stringify({message:"no_friends"})); 
					}	
				}
			});
		}
});
};


exports.add_status_user=function(status_user, cookie, res){

status_usr = status_user;
var cookie = cookie.split("cookieName=");	

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log(err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{		
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		var collection2 = db.collection('chatbox');
		
			collection.find({"cookie.value": cookie[1]}).toArray(function(err, results){
					if(err) {
							console.log(err);
							res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
					}else if(results[0]){ // il a bien un cookie valide

						username=results[0].username;
						date_status = new Date();

						collection2.insert({username: username, date_status: date_status, status_user:status_usr},function(err, doc){
							if(err){
								res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
							}else{
								res.end(JSON.stringify({message:"tab_status_added"}));
							}
						});			
					}							
						
				});
	}
});
};


exports.login=function(username, pwd, res){
/*
Fonction pour le bouton login, pour se connecter avec un identifiant et un mot de passe
*/
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "erreur_connection"}));
						return;
	}else{
	
	var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
	collection.find({username:username,password:pwd}).toArray( function(err, results){
		if (err) {
						console.log(err);
						res.end(JSON.stringify({message: "login_connexion_refused"}));
						db.close(); // on referme la db
					}
		else if(results[0]){
			   // création objet cookie
				var cookie = {};
				cookie.value = ""+username.substring(0,3)+Math.floor(Math.random() * 100000000); //valeur du cookie
				cookie.expire = new Date(new Date().getTime()+900000).toUTCString(); //expire au bout de 1 heure
				
				// MAJ BDD avec le cookie associé à l'user name
				collection.update({username: username, password: pwd},{ $set: {cookie:cookie}}, { upsert: true }, function(err, docs){
					if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "login_connexion_refused"}));
						db.close(); // on referme la db
					}else{						
										infos={};
										infos.message="login_connexion_autorised_";
										res.writeHead(200, {"Content-Type": "'text/plain'", "Set-Cookie" : 'cookieName='+cookie.value+';expires='+cookie.expire});										
										res.end(JSON.stringify(infos)); 
										db.close(); // on referme la db
					}
				});
			}else{
				res.end(JSON.stringify({message: "login_connexion_refused"}));
				db.close(); // on referme la db
			}					

			});
}
});	
};

exports.register = function (username,pwd,res){
/*
Fonction pour le bouton register
*/
pseudo = username;
username = username.toLowerCase();
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "erreur_connection"}));
						return;
			}
	else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme

		collection.insert({username: username, password: pwd, pseudo:pseudo},function(err, doc){
			if(err){
				res.end(JSON.stringify({message:"username_existant_"}));
				db.close(); // on referme la db
			}else{
				exports.login(username,pwd,res);			
			}
		});
	}
});
};


exports.delete_account_user = function (cookie_header, password_user, res){
	
	var m = cookie_header.split("cookieName=");	

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log(err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{		
		var collection = db.collection('users'); 
		collection.remove({"cookie.value": m[1], password:password_user},function(err, doc){
			if(err){
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

exports.logout_account_user = function(cookie, res){
var m = cookie.split("cookieName=");
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
			console.log(err);
			res.end(JSON.stringify({message: "erreur_connection"}));
			return;
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.update({"cookie.value": m[1]},{ $set: {cookie:0}}, { upsert: true }, function(err, docs){
					if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "log_out_failed"}));
						db.close(); // on referme la db
					}else{						
						infos={};
						infos.message="logout_successful";
						res.end(JSON.stringify(infos));
						db.close(); // on referme la db
					}
				});
	}
});
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string				
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

exports.friend_to_add = function(friend_pseudo_to_add,cookie,res){
friend_pseudo_to_add = ""+friend_pseudo_to_add;
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
								db.close(); // on referme la db
					}else if(results[0]){
						if(friend_pseudo_to_add != results[0].pseudo){//si la personne qui demande  n'est pas la personne qui ajoute
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
									tab.push(friend_pseudo_to_add);									
								}								
							}
							//si l'user que l'on veut ajouter n'est ni SOI-M^ME ni déjà présent dans la friend list			
							collection.update({"cookie.value": m[1]},{ $set: {friendList:tab}}, { upsert: true }, function(err, docs){
								if(err) {
									console.log(err);
									res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
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
					}else{
						res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
						db.close(); // on referme la db
					}
				});
	}
});

};

exports.friend_list_request = function(cookie,res){
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
							db.close(); // on referme la db
					}else if(results[0]&&results[0].friendList){
						res.end(JSON.stringify({message:"friends_found_",friendList:results[0].friendList}));
						db.close(); // on referme la db
					}else if(results[0] && !results[0].friendList){
						res.end(JSON.stringify({message:"none_friend_list_"}));
						db.close(); // on referme la db
					}else{
						//si le cookie n'est pas dans la db
						res.end(JSON.stringify({message:"user not found"}));
						db.close(); // on referme la db
					}
		});
	}
});
};

exports.friend_to_delete = function(friend_to_delete,cookie, res){
friend_to_delete = ""+friend_to_delete;
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
							db.close(); // on referme la db
					}else if(results[0]){
						if(results[0].friendList){
							var array = results[0].friendList;
							var index = array.indexOf(friend_to_delete);
							if (index > -1) {//si l'ami à supprimer est présent dans la friend list
							    array.splice(index, 1);//on retire l'ami du tableau
							    collection.update({"cookie.value": m[1]},{ $set: {friendList:array}}, { upsert: true }, function(err, docs){
								if(err) {
									console.log(err);
									res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
									db.close(); // on referme la db
								}else{
									res.end(JSON.stringify({message:"deletion_done_"}));
									db.close(); // on referme la db
								}
								});
							}else{
								//si l'ami à supprimer n'est pas dans la friend list : certainement tentative de hack
								res.end(JSON.stringify({message:"friend_not_in_the_list"}));
								db.close(); // on referme la db
							}
						}else{
							res.end(JSON.stringify({message:"none_friend_to_delete_"}));
							db.close(); // on referme la db
						}
					}
					else{
						res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
						db.close(); // on referme la db
					}
	});
	}
});
};

/*

exports.get_status=function(res){
	MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {	
				console.log(err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				db.close(); // on referme la db
			}
	else{	
			var collection = db.collection('chatbox');
			//on recherche les 100 derniers status postés.
			collection.find({}).sort({"date_status":-1}).limit(100).toArray(function(err, results){
					if(err) {
							console.log(err);
							res.end(JSON.stringify({message:"erreur de la db :("}));
							db.close(); // on referme la db
					}else{ 
							var obj_a_transmettre={};
							obj_a_transmettre.message="status_update";
							obj_a_transmettre.donnees=results.reverse();
							res.end(JSON.stringify(obj_a_transmettre));
							db.close(); // on referme la db 
					}
			});
	}
});
};
*/

exports.add_status_user=function(status_user, cookie, res){
status_usr = status_user;
var cookie = cookie.split("cookieName=");	

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log(err);
				res.end(JSON.stringify({message: "erreur_connection"}));
				return;
			}
	else{		
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		var collection2 = db.collection('chatbox');
		
			collection.find({"cookie.value": cookie[1]}).toArray(function(err, results){
					if(err) {
							console.log(err);
							res.end(JSON.stringify({message:"erreur de la db :("}));
							db.close(); // on referme la db
					}else if(results[0]){ // il a bien un cookie valide
						username=results[0].username;
						date_status = new Date();
						collection2.insert({username: username, date_status: date_status, status_user:status_usr},function(err, doc){
							if(err){
								res.end(JSON.stringify({message:"erreur de la db :("}));
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

