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
						throw err;
						res.end(JSON.stringify({message: "login_connexion_refused"})); // on convertit le string en objet
					}
	
	var collection = db.collection('users'); // on veut acceder à la collection users de la db ProjetEsme
	collection.find({username:username,password:pwd}).toArray( function(err, results){
		if (err) {
						throw err;
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
						throw err;
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
						throw err;
						res.end(JSON.stringify({message: "login_connexion_refused"})); // on convertit le string en objet
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
				    if(err) throw err;	
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


exports.delete_account_user = function (cookie_header, res){
	
	var m = cookie_header.split("=");





MongoClient.connect('mongodb://romain:alex@dogen.mongohq.com:10034/projet_maxime', function(err, db) {
	if(err) {
				throw err;
				res.end(JSON.stringify({message: "login_connexion_refused"})); // on convertit le string en objet
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










	var stmt = "SELECT pw FROM test WHERE cookie_id=\""+  m[1] + "\""; // on récup le email et le mdp
	console.log('objet de la bdd ' + stmt);
	db.each(stmt, function (e, r) {
		console.log('objet de reponse r: ' + r.pw); 
		console.log('pw de la base de donneeé' + r.mail); // le mdp de la db
		console.log('pw que luser a rentré' + mdp); // ce que l'utilisateur a rentré (son mdp)
	
		if(r){ // si on a une réponse de la base de donnée
		
				if ( r.pw == mdp ){
					console.log('if mdp egal');
					db.run("DELETE FROM test WHERE cookie_id = ?", m[1]);
					res.end(JSON.stringify({message: "OK"}));
				}
				else {
					res.end(JSON.stringify({message: "KO"}));
				}
			}
		else{
				res.end(JSON.stringify({message: "KOtech"}));
			}
		
	});
};

