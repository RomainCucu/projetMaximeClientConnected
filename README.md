#projetMaximeClientConnected

###Projet réalisé dans le cadre d'un TP Client - Serveur à l'ESME Sudria.
###Sujet : Client déconnecté.

######Contributors : Alexandre Magne, Romain Cunault

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
#Fonction login
##Côté router.js
```javascript
if (b.ac == "login") {
			this.resp.writeHead(200,{"Content-Type": "application/json" });
			if (verification_data_entrantes.check_info_caract_(b)){
				//on regarde si les champs de l'objet ne contiennent pas de caracèrest spéciaux(eg: espace, crochets...) et sont de longueur entre 3 et 10 avant d'envoyer au router
				db.login(b.username, b.password, this.resp);
			}else{
				this.resp.end(JSON.stringify({message: "login_connexion_refused"}));
			}			
		}
```
##Côté db.js
```javascript
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
```
#Fonction add_friend
##Côté router.js
```javascript
else if(b.ac == "add_friend"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});				
				b.friend_to_add += "";//pour le forcer à être un string
				b.friend_to_add = b.friend_to_add.replace(/ /g,"");//on supprime les espaces 
				if(b.friend_to_add.length>0){//si la taille du string est supérieur à 0 on recherche l'ami sinon ca vaut pas le coup
					db.add_friend(b.friend_to_add,this.req.headers.cookie, this.resp);
				}else{
					this.resp.end(JSON.stringify({message: "error_adding_friend"}));
				}
				return;
			}
```
##Côté db.js
```javascript
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("})); // conversion de l'objet JSON en string
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
									res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
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
					}else{//normalement on rentre dans ce cas que si le mec change lui même las valeur du cookie
						res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
						db.close(); // on referme la db
					}
				});
	}
});
};
```
#Fonction get_friends
##Côté router.js
```javascript
else if(b.ac == "get_friends"){
	this.resp.writeHead(200, {"Content-Type":"application/json"});
	db.friend_list_request(this.req.headers.cookie, this.resp);
	return;
}
```
##Côté db.js
```javascript
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
							db.close(); // on referme la db
					}else if(results[0]&&results[0].friendList){//si on trouve bien la friend liste associé au cookie ET si la liste existe (<=> il a un ou + amis)
					//renvoi le tableau contenant les amis
						res.end(JSON.stringify({message:"friends_found_",friendList:results[0].friendList}));
						db.close(); // on referme la db
					}else if(results[0] && !results[0].friendList){//si on trouve bien la friend liste associé au cookie ET si la liste n'existe pas (<=> il a 0 ami)
						res.end(JSON.stringify({message:"none_friend_list_"}));
						db.close(); // on referme la db
					}else{//si le cookie n'est pas dans la db, arrive que si utilisateur change la valeur du cookie
						res.end(JSON.stringify({message:"user not found"}));
						db.close(); // on referme la db
					}
		});
	}
});
};
```
