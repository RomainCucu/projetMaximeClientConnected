var db1=require("./db.js");
var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;


/*
####################################
####################################
FONCITION POUR AFFICHER TOUTE LA BASE
RETOURNE JE NE SAIS PLUS QUOI DONC A REMPLI
####################################
####################################
*/
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

exports.login=function(username, pwd, res){
/*
Fonction pour le bouton login, pour se connecter avec un identifiant et un mot de passe
*/
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
						util.log(err);
						res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet
					}
	
	var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
	collection.find({username:username,password:pwd}).toArray( function(err, results){
		if (err) {
						util.log(err);
						res.end(JSON.stringify({message: "login_connexion_refused"})); // on convertit le string en objet
					}
		else if(results[0]){
			// création du cookie
				var cookie = {}; //mon objet cookie
				cookie.value = ""+username.substring(0,3)+Math.floor(Math.random() * 100000000); //valeur du cookie
				cookie.expire = new Date(new Date().getTime()+900000).toUTCString(); //expire au bout de 1 heure
				
				// MAJ BDD
				collection.update({username: username, password: pwd},{ $set: {cookie:cookie}}, { upsert: true }, function(err, docs){
					if(err) {
						util.log(err);
						res.end(JSON.stringify({message: "login_connexion_refused"})); // on convertit le string en objet
					}else{						
										infos={};
										infos.message="login_connexion_autorised_"; // ajout d'un attribut message a l'objet pour gérer les cas dans index.js
										res.writeHead(200, {"Content-Type": "'text/plain'", "Set-Cookie" : 'cookieName='+cookie.value+';expires='+cookie.expire});										
										res.end(JSON.stringify(infos)); // conversion de l'objet JSON en string
										db.close(); // on referme la db
					}
				});
			}else{
				res.end(JSON.stringify({message: "login_connexion_refused"})); // on convertit le string en objet
			}					

});
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
						util.log(err);
						res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet
			}
	else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme

		collection.insert({username: username, password: pwd, pseudo:pseudo},function(err, doc){
			if(err){
				res.end(JSON.stringify({message:"username_existant_"})); // conversion de l'objet JSON en string
			}else{
				db1.login(username,pwd,res);
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
				    	util.log(err);
				    	res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet
				    }
					var collection = db.collection('users');//pour aller choper le cookie dans la db
					c = c.split("cookieName=");//car c ="GA=iyiuyeuiyizeu ; cookieName=rom19282839" par excemple donc on eneleve le cookieName
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
				});
}else{
					obj[fct](false);
}
};


exports.delete_account_user = function (cookie_header, password_user, res){
	
	var m = cookie_header.split("cookieName=");	

MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				util.log(err);
				res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet
			}
	else{		
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.remove({"cookie.value": m[1], password:password_user},function(err, doc){
			if(err){
				res.end(JSON.stringify({message:"error_delete_account"})); // conversion de l'objet JSON en string
			}else{
				if(doc==0){ // user not found( mauvais mdp)
					res.end(JSON.stringify({message:"mauvais_pawssword"})); // conversion de l'objet JSON en string
				} else if(doc==1){ // suppression réussie
				res.end(JSON.stringify({message:"account_deleted"}));
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
			util.log(err);
			res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet}
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.update({"cookie.value": m[1]},{ $set: {cookie:0}}, { upsert: true }, function(err, docs){
					if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "log_out_failed"})); // on convertit le string en objet
					}else{						
										infos={};
										infos.message="logout_successful"; // ajout d'un attribut message a l'objet pour gérer les cas dans index.js										
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
			util.log(err);
			res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet}
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.find({"cookie.value": m[1]}).toArray(function(err, results){
					if(err) {
						console.log(err);
						res.end(JSON.stringify({message: "pseudo_request_failed"})); // on convertit le string en objet
					}else{
										infos={};
										infos.pseudo=results[0].pseudo;
										infos.message="pseudo_request_successfull"; // ajout d'un attribut message a l'objet pour gérer les cas dans index.jsr
										res.end(JSON.stringify(infos)); // conversion de l'objet JSON en string
										db.close(); // on referme la db
					}
				});
	}
});//conecct
};

exports.search_user_request = function(search_name,cookie,res){
var m = cookie.split("cookieName=");
MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
			util.log(err);
			res.end(JSON.stringify({message: "erreur_connection"})); // on convertit le string en objet}
	}else{
		var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
		collection.find().toArray(function(err, results){
					if(err) {
						console.log(err);
							res.end(JSON.stringify({message:"erreur de la db :("})); // conversion de l'objet JSON en string
					}else{
						var infos={};
						infos.liste_user_found = [];
						for(var i in results){

							if((results[i].pseudo.toLowerCase().indexOf(search_name.toLowerCase())> -1) || similar(results[i].pseudo.toLowerCase(),search_name.toLowerCase())> 50)//pour voir si la chaine est contenu dans un pseudo
								{
									infos.liste_user_found.push(results[i].pseudo);
								}

						}
						infos.message="recherche_dutilisateurs_"; // ajout d'un attribut message a l'objet pour gérer les cas dans index.jsr
						if(infos.liste_user_found.length==0){
							infos.liste_user_found.push("Not occurence founded");
							infos.message="pseudo_request_failed";
							res.end(JSON.stringify(infos))
						} 
						res.end(JSON.stringify(infos)); // conversion de l'objet JSON en string
						db.close(); // on referme la db
					
					}
				});
	}
});//conecct
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

