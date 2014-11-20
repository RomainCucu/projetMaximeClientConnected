#projetMaximeClientConnected

###Projet réalisé dans le cadre d'un TP Client - Serveur à l'ESME Sudria.
###Sujet : Client déconnecté.

######Contributors : Alexandre Magne, Romain Cunault

[pour écrire en .MD](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)

#Fonction register
##Description de la fonction
On récupère dans le router l'objet envoyé par le client composé des champs username et password.
Dans le router, si *verification_data_entrantes.check_info_caract_()* renvoie vraie, alors on envoie au router le username et le password.(CF: description *verification_data_entrantes.check_info_caract_()* tout en bas).

Dans la DB, on se connecte à notre data base et, dans la collection USERS, on insère un document composé du champs username, pseudo, et password.
Il faut savoir que l'on a crée un champs pseudo (comprenant majuscule et minuscule pour afficher le pseudo aux autres en prenant en compte la casse) et un champs username (en minuscule pour faciliter la fonction login, pas de prise en charge de la casse)
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
				res.end(JSON.stringify({message:"register_ok_"}));
			}
		});
	}
});
};
```
#Fonction login
##Description de la fonction
Le client envoie son username et son password
Dans le router, si *verification_data_entrantes.check_info_caract_()* renvoie vraie, alors on envoie au router le username.toLowerCase() (en minuscule car le username est en minuscule dans la DB) et le password.(CF: description *verification_data_entrantes.check_info_caract_()* tout en bas).

Dans la DB, on se connecte à la db et on recherche dans la collection USERS un document qui comprend l'username et le password entrés. La fonction renvoie results[0] si un document match les informations entrées, et dans ce cas, on mets on créé un cookie et on met à jour le document avec le cookie. Si la fonction ne renvoie pas de results[0], cela signifie que soit le username ou soit le password est faux.
##Côté router.js
```javascript
if (b.ac == "login") {
			this.resp.writeHead(200,{"Content-Type": "application/json" });
			if (verification_data_entrantes.check_info_caract_(b)){
				//on regarde si les champs de l'objet ne contiennent pas de caracèrest spéciaux(eg: espace, crochets...) et sont de longueur entre 3 et 10 avant d'envoyer au router
				db.login(b.username.toLowerCase(), b.password, this.resp);
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
#Fonction logout
##Description de la fonction
Dans le router, on appelle juste la fonction de la db en voyant le cookie.

Dans la DB, on se connecte à la DB et, dans la collection USERS, on remplace le cookie avec la valeur donnée par 0.
##Côté router.js
```javascript
if (b.ac == "logout"){
	this.resp.writeHead(200,{"Content -Type": "application/json"});
	db.logout(this.req.headers.cookie, this.resp);	
	return;			
}
```
##Côté db.js
```javascript
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
```
#Fonction add_friend
##Description de la fonction
Le router reçois un objet avec le champs friend_to_add. On s'assure que celui-ci soit un string, sans espace, et de taille > 0.

Dans la DB, on se connecte à la db, et dans la collection USERS:
1.On vérifie que le cookie du client est bien présent dans la DB avant toute modification, sinon on renvoi un message d'erreur au client
2.On récupère le document correspondant au cookie, qui est results[0]
3.On vérifie l'existance de results[0].friendList
..* Si results[0].friendList n'existe pas <=> l'utilisateur n'a pas encore d'amis, donc on crée un tableau avec l'ami qu'il souhaite ajouter
..* Si results[0].friendList existe => on récupère results[0].friendList dans un tableau et on regarde dans le tableau :
		..* Si le nom de l'ami qu'il veut ajouté est le même que son nom, c'est à dire qu'il s'ajoute lui même alors on dit au client que c'est pas possible
		..* Sinon on rajoute au tableau l'ami qu'il souhaite ajouter au tableau
4.On met à jour le document avec le nouveau tableau de friendList

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
					}else{//cookie non présent
						res.end(JSON.stringify({message:"cookie_not_found"}));
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
						res.end(JSON.stringify({message:"cookie_not_found"}));
						db.close(); // on referme la db
					}
		});
	}
});
};
```

#Fonction delete_friend
##Côté router.js
```javascript
else if(b.ac == "delete_friend"){				
		this.resp.writeHead(200, {"Content-Type":"application/json"});
		b.friend_to_delete += "";//pour forcer à string
		b.friend_to_delete = b.friend_to_delete.replace(/ /g,"");//on supprim les espaces
		b.friend_to_delete = b.friend_to_delete.split('-');//l'id recu est de type "pseudo-delete"
		b.friend_to_delete = b.friend_to_delete[0];
		if(b.friend_to_delete.length>0){//si le string n'est pas vide on va à la db
		db.delete_friend(b.friend_to_delete,this.req.headers.cookie, this.resp);
	}else{
		this.resp.end(JSON.stringify({message: "error_deleting_friend"}));
	}
}
```
##Côté db.js
```javascript
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
							res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
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
									res.end(JSON.stringify({message:"erreur_de_la_db_:("}));
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

```
