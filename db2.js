var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

/**
*La fonction login prend en paramètre l'username, le password et la réponse.
*Si un document dans la collection "users" match avec l'username et le password, alors:
*  - il met à jour le champs "connected" à 1;
*  - on transmet l'objet avec l'id unique au client;
*Sinon on renvoie "login_ko" pour dire que les informations entrées ne correspondent à aucun document.
*/
exports.login=function(username, pwd, res){
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
						console.log("erreur de connexion dans la fonction login: "+err);
						res.writeHead(503, {"Content-Type": "application/json" });
						res.end(JSON.stringify({message: "connexion_error"}));
						return;
	}else{
		res.writeHead(200, {"Content-Type": "application/json" });		
		db.collection('users').update({username: username, password:pwd},{ $set: {"connected":1}}, { upsert: false }, function(err, docs){
			if (err) {//en cas d'erreur de la fonction find
				console.log("erreur lors dans la fonction login, collection.find: "+err);
				res.end(JSON.stringify({message: "login_ko"}));
				db.close();
			}
			else if(docs==1){
				db.collection('users').find({username:username,password:pwd}).toArray(function(err,results){
					infos={};//objet transmis au client
					infos.message="login_ok";
					infos.id=""+results[0]._id;
					res.end(JSON.stringify(infos));
					db.close();
				});				
			}else{
				res.end(JSON.stringify({message:"ko_login_informations"}));
				db.close();
			}
		});
	}
});	
};


/**
*La fonction register prend en paramètres un username, un password, et une réponse à transmettre au client.
*Dans la collection "users", on insère un document composé des champs suivant :
*	- username: username entré mis en minuscule, ainsi quand le user veut se connecter, il peut entrer avec ou sans majuscule.
*		De plus, cela permet de voir si deux username ne sont pas les mêmes ("RoMaIn" et "romain" serait insérer également, ce que l'on ne veut pas)
*	- pseudo: username entré qui peut être en majuscule ou minuscule. Il sert  a conservé la casse de l'username
*	- password: password entré
*La fonction retourne juste le message "register_ok" si le document s'est bien insérer.
*Si le document ne s'est pas insérer, cela signifie qu'il y a un doublon de l'username. En effet, un index est présent sur le champ
*username, afin qu'il n'y ait pas plusieurs utilisateurs avec le même nom.
*/
exports.register = function (username,pwd,res){

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//en cas d'erreur de connection
						console.log("erreur de connexion au niveau de register: "+err);
						res.writeHead(503, {"Content-Type": "application/json" });
						res.end(JSON.stringify({message: "connexion_error"}));
						return;
			}
	else{
		res.writeHead(200, {"Content-Type": "application/json" });
		var id_unique = ""+username.substring(0,3)+Math.floor(Math.random() * 100000000);	
		db.collection('users').insert({id_unique:id_unique,username: username.toLowerCase(), password: pwd, pseudo:username, connected:0, friendList:[], statut:"pas de statut"},function(err, doc){
			if(err){				
				res.end(JSON.stringify({message:"register_doublon"}));
				db.close();
			}else{				
				res.end(JSON.stringify({message:"register_ok"}));
				db.close();
			}
		});
	}
});
};


/**
*La fonction prend en comptre un id (envoyé par le client) et une réponse à envoyé au client.
*On met à jour, dans la collection "users", le document qui match avec l'id correspondant en attribuant 0 au champs connected.
*Si aucun document ne correspond à l'id, cela renvoie un message d'erreur.
*/
exports.logout = function(id, res){

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
			console.log("erreur de connexion fonction logout: "+err);
			res.writeHead(503, {"Content-Type": "application/json" });
			res.end(JSON.stringify({message: "connexion_error"}));
			return;
	}else{
		res.writeHead(200, {"Content-Type": "application/json" });
		db.collection('users').update({id_unique: id},{ $set: {"connected":0}}, function(err, docs){
					if(err) {
						res.end(JSON.stringify({message: "logout_ko"}));
						db.close();
					}else if(docs==1){						
						res.end(JSON.stringify({message:"logout_ok"}));
						db.close();
					}else{
						res.end(JSON.stringify({message:"logout_ko_false_id"}));
						db.close();
					}
				});
	}
});
};


/**
*La fonction prend en paramètre l'id du client, le password envoyé par le client, et la réponse à transmettre au client.
*Dans la collection "users", on recherche un document qui matche avec l'id ET le password envoyé.
*Si un document est trouvé <=> doc = 1 : cela signifie que la suppression a eu lieu
*Sinon, cela signifie que le client a envoyé un mauvais id ou un mauvais password associé à l'id
*/
exports.delete_ = function (id, password, res){

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log("erreur connexion fonction set_info: "+err);
				res.writeHead(503, {"Content-Type": "application/json" });
				res.end(JSON.stringify({message: "connexion_error"}));
				return;
			}
	else{
		res.writeHead(200, {"Content-Type": "application/json" });		
		db.collection('users').remove({id_unique: id, password:password},function(err, doc){
			if(err){
				console.log("erreur fonction delete fonction remove: "+err);
				res.end(JSON.stringify({message:"error_delete_account"})); 
				db.close();
			}else{
				if(doc==0){ // user not found( mauvais mdp)
					res.end(JSON.stringify({message:"delete_ko_wrong_pwd"})); 
					db.close();
				} else if(doc==1){ // suppression réussie
					res.end(JSON.stringify({message:"delete_ok"}));
					db.close();
				}
			}
		});
	}
});
};



/** La fonction prend en paramètre l'id du client, et la réponse à transmettre au client.
*Dans la collection users, on recherche un document qui match avec l'id.
*Si un document est trouvé, grace à une boucle foreach, on va rechercher dans cette même collection
*tous les documents correspondant au différents username présent dans le champs friendliste (un tableau de string)
*de la précédente recherche. On stocke à chaque "tour de boucle" (PAS VRAIMENT CA POUR UN FOREACH)
*le pseudo de chacun de ses amis dans un tableau.
*On renvoie alors le tableau au client.
*/
exports.get_info=function(id, res){


	MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {	
				console.log("erreur fonction get_info connection: "+err);
				res.end(JSON.stringify({message: "connexion_error"}));
				return;
			}
	else{	
			var collection2 = db.collection('users'); 
			collection2.find({id_unique: id}).toArray(function(err, results1){
				if(err){
					console.log("erreur fonction get_info fonction find 1: "+err);
					res.end(JSON.stringify({message:"erreur_de_la_db_"}));
					db.close();
				} else if (results1[0]){ // si cette personne existe
					r1=results1[0].friendList;  
					if(r1){
					if(r1.length>=1){ // si il a au moins un ami
						var tab = []; // il contiendra les username des amis
						results1[0].friendList.forEach(function(entry){
							tab.push(entry.toString());
						})
	
						collection2.find( {  username:{ $in: tab }} ).toArray(function(err, results){
							if(err){
								console.log("erreur fonction get_info fonction find 2: "+err);
								res.end(JSON.stringify({message:"erreur_de_la_db_"}));
								db.close();
							} else {
													
											var results_analyse=[];
											for(b in results){
												if(results.status){ // si l'ami a un status
													results_analyse.push(results[b].status);
												} else results_analyse.push("no status to show");
											}

											var obj_a_transmettre={};
											obj_a_transmettre.message="status_update";
											obj_a_transmettre.donnees=results_analyse;
											res.end(JSON.stringify(obj_a_transmettre)); 
											db.close();
							}
					});
				} }// if r1
					else {
						res.end(JSON.stringify({message:"no_friends"}));
						db.close();
					}	
				}else{
					res.end(JSON.stringify({message:"error_get_info"}));
					db.close(); // on referme la db
				}
			});
		}
});
};


/** La fonction prend en paramètre le status que l'user veut publier, l'id du client, et la réponse à transmettre au client.
*Dans la collection users, on recherche un document qui match avec l'id.
*Si un document est trouvé :
*	- Le champs status est mis a jour ou ajouté avec le status que l'user a rentré
*On renvoie ensuite un message au client : "status_update".
*/
exports.set_info=function(status_user, id, res){	

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				console.log("erreur connexion fonction set_info: "+err);
				res.end(JSON.stringify({message: "connexion_error"}));
				return;
			}
	else{		
			var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
			collection.update({_id: id}, { $set: {status_user:status_user}}, { upsert: true }, function(err, doc){
							if(err){
								console.log("erreur fonction set_info fonction find: "+err);
								res.end(JSON.stringify({message:"erreur_de_la_db_"}));
								db.close(); // on referme la db
							}else{
								res.end(JSON.stringify({message:"status_updated"}));
								db.close(); // on referme la db
							}
						});			
	}
});
};


/**
*Fonction qui prend en paramètre le PSEUDO à ajouter, l'id du client, et la réponse à envoyer au client.
*Tout d'abord, on cherche si un document existe avec l'id en question. Si il n'existe pas on renvoie "add_frien_ko_id_not_found".
*Si l'utilisateur existe bien:
*	le pseudo de l'ami à ajouter est-t-il le même que celui qui ajoute ?
*	- oui : on renvoie "add_friend_ko_adding_yourself" car il ne peut pas s'ajouter lui même
*	- non : l'utilisateur qui ajoute a-t-il déjà des amis?
*		- non : on ajoute l'ami dans la friend list de l'utilisateur et on renvoie "add_frien_ok"
*		- oui : l'ami ajouté est-il déjà présent dans la liste d'ami ?
*			- non : on ajoute l'ami dans la friend list de l'utilisateur et on renvoie "add_frien_ok"
*			- oui : on renvoie "add_friend_ko_already_friend"
*/
exports.add_friend = function(friend,id,res){

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
		console.log("erreur connexion fonction add_friend: "+err);
		res.writeHead(503, {"Content-Type": "application/json" });
		res.end(JSON.stringify({message: "connexion_error"}));
		return;
	}else{
		res.writeHead(200, {"Content-Type": "application/json" });		
		db.collection('users').find({id_unique: id}).toArray(function(err, results){
					if(err) {
							console.log("erreur fonction add_friend, fonction find: "+err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"}));
							db.close();
					}else if(results[0]){//si on trouve un document associé au cookie
						if(friend != results[0].pseudo){//si la personne qui demande l'ajout n'est pas la personne qui ajoute
							var tab =[];//varaiable contenant le tableau à transmettre
							if (!results[0].friendList){//si l'user n'a pas damis								
								tab.push(friend_pseudo_to_add);
							}else{//si luser a déjà une friend list
								tab = results[0].friendList;//le tableau = le tableau de friend list trouvé dans la DB
								if (tab.indexOf(friend_pseudo_to_add)> -1){//si l'ami est deja dans la friend list
									res.end(JSON.stringify({message:"add_friend_ko_already_friend"}));
									db.close(); 
								}else{
									tab.push(friend_pseudo_to_add);//on rajoute l'ami dans le tableau							
								}								
							}
							//l'user que l'on veut ajouter n'est ni SOI-M^ME ni déjà présent dans la friend list
							//on met à jour le document avec le nouveau tableau d'amis			
							collection.update({id_unique: id},{ $set: {friendList:tab}}, { upsert: true }, function(err, docs){
								if(err){
									console.log("erreur fonction add_friend, fonction update: "+err);
									res.end(JSON.stringify({message:"erreur_de_la_db_"}));
									db.close(); 
								}else{
									res.end(JSON.stringify({message:"add_frien_ok"}));
									db.close(); 
								}
							});
						}else{
							res.end(JSON.stringify({message:"add_friend_ko_adding_yourself"}));
							db.close(); 
						}
					}else{
						res.end(JSON.stringify({message:"id_not_found"}));
						db.close(); 
					}
				});
	}
});
};


/**
*La fonction prend en paramètres l'id du client, et la réponse à envoyer au client.
*On recherche dans la collection "users" le document correspondant à l'id du client.
*Si il y a un match: le champs friendList existe-t-il?
*	- oui : on renvoie le tableau d'amis au client
*	- non : on indique que l'utilisateur n'a pas d'amis
*
*Attention, côté client peut recevoir un tableau d'amis vide, donc une condition doit être faite côté client
*/
exports.get_friends = function(id,res){

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
			console.log("erreur de connexion fonction get friends: "+err);
			res.writeHead(503, {"Content-Type": "application/json" });		
			res.end(JSON.stringify({message: "connexion_error"}));
			return;
	}else{
		res.writeHead(200, {"Content-Type": "application/json" });						
		db.collection('users').find({id_unique: id}).toArray(function(err, results){//on veut acceder à la friend list du document avec le cookie correspondant
					if(err) {
						console.log("erreur fonction add_friends, fonction find: "+err);
						res.end(JSON.stringify({message:"erreur_de_la_db_"}));
						db.close();
					}else if(results[0]&&results[0].friendList){						
						res.end(JSON.stringify({message:"get_friends_ok",friendList:results[0].friendList}));
						db.close();
					}else if(results[0] && !results[0].friendList){//si on trouve bien la friend liste associé au cookie ET si la liste n'existe pas (<=> il a 0 ami)
						res.end(JSON.stringify({message:"get_friends_ko_none_friend"}));
						db.close();
					}else{
						res.end(JSON.stringify({message:"id_not_found"}));
						db.close();
					}
		});
	}
});
};


/**
*La fonction prend en paramètre le pseudo de l'ami à supprimer, l'id du client, et la réponse à envoyer.
*Dans la collection "users", on cherche d'abord si l'id match avec un document. Sinon, on renvoie "id_not_found".
*L'utilisateur a-t-il une friendList ?
*	- non : on renvoie "delete_friend_none_friend"
*	- oui : l'ami a supprimer est-il présent dans la friendList?
*		- non : on renvoie "delete_friend_ko_no_such_friend"
*		- oui : on met à jour le document avec le tableau sans l'ami et on renvoie "delete_friend_ok"
*
*/
exports.delete_friend = function(friend,id, res){

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {//si erreur de connexion
			console.log("erreur de connexion fonction delete_friend: "+err);
			res.writeHead(503, {"Content-Type": "application/json" });		
			res.end(JSON.stringify({message: "connexion_error"}));
			return;
	}else{
		res.writeHead(200, {"Content-Type": "application/json" });				
		db.collection('users').find({id_unique: id}).toArray(function(err, results){
					if(err) {//erreur fonction find
							console.log("erreur fonction delete_frien, fonction find: "+err);
							res.end(JSON.stringify({message:"erreur_de_la_db_"}));
							db.close();
					}else if(results[0]){//si on trouve un document associé au cookie
						if(results[0].friendList){//si le document a une friend liste
							var array = results[0].friendList;//on recupere le tableau friend list
							var index = array.indexOf(friend_to_delete);// on cherche l'index de l'ami à supprimer
							if (index > -1) {//si l'ami à supprimer est présent dans la friend list
							    array.splice(index, 1);//on retire l'ami du tableau								
							    collection.update({id_unique:id},{ $set: {friendList:array}}, { upsert: true }, function(err, docs){
								if(err) {
									console.log("erreur dans la fonction delete_friend, fonction update: "+err);
									res.end(JSON.stringify({message:"erreur_de_la_db_"}));
									db.close();
								}else{
									res.end(JSON.stringify({message:"delete_friend_ok"}));
									db.close();
								}
								});
							}else{//si l'ami à supprimer n'est pas dans la friend list : certainement tentative de hack								
								res.end(JSON.stringify({message:"delete_friend_ko_no_such_friend"}));
								db.close();
							}
						}else{
							res.end(JSON.stringify({message:"delete_friend_none_friend"}));
							db.close();
						}
					}else{
						res.end(JSON.stringify({message:"id_not_found"})); // conversion de l'objet JSON en string
						db.close();
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
			res.end(JSON.stringify({message: "connexion_error"}));
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
			res.end(JSON.stringify({message: "connexion_error"}));
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