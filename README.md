projetMaximeClientConnected
===========================
Projet facebook
Contributors : Alexandre Magne, Romain Cunault

#Fonction register
##côté router.js
```javascript
else if (b.ac == "register"){
			this.resp.writeHead(200,{"Content -Type": "application/json"});
			//on regarde si les champs objet ne contiennent pas de caracèrest spéciaux(eg: espace, crochets...) et sont de longueur entre 3 et 10 avant d'envoyer au router
			if (verification_data_entrantes.check_info_caract_(b)){
				db.register(b.username, b.password, this.resp);
			}else {
				this.resp.end(JSON.stringify({message: "register_problem_info_entered"}));
			}	
```
##côté db.js
```javascript
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
				//si le register se passe bien, on login directement l'utilisateur afin qu'il se connecte automatiquement
				//sans avoir à réentrer son username et son pwd
				exports.login(username,pwd,res);			
			}
		});
	}
});
};
```
