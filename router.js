var util = require("util"); 
var url = require("url"); 
var fs = require("fs");
var db = require("./db.js");

var verification_data_entrantes = {};

/**
* This method is used to process the request * @param req (Object) the request object
* @param resp (Object) the response object */

exports.router = function (req, resp) {
	var inc_request = new srouter(req, resp);
	inc_request.run();
	inc_request = null;
};

/* --------*/

srouter = function (req, resp) {
	 if (req && resp) {
			this.req = req;
			this.resp = resp;
			this.pathname = "";
			this.filetype = "";
			this.path = "";
			this.image_file = "jpg png jpeg bmp gif"; 
	} else {
			util.log("ERROR - A srouter object need a request and a response object");
			return;
			}
};

srouter.prototype = {
run:
	function () { 
		this.rest_method();
	},

rest_method:
	function () {
		if (this.req.method == "GET") { 
			this.get_method();
		} else if (this.req.method == "POST") {
			this.post_method();
		} else {
			this.resp.writeHead(501,{"Content -Type": "application/json"});
			this.resp.write(JSON.stringify({message: "Not Implemented"}));
			this.resp.end();
			return;
		}
},



get_method:
	function () {
		var u = url.parse(this.req.url, true, true);
		var regexp = new RegExp("[/]+", "g");
		this.pathname = u.pathname.split(regexp);
		this.pathname = this.pathname.splice(1, this.pathname.length - 1); this.filetype = this.pathname[this.pathname.length - 1].split(".");
		this.filetype = this.filetype[this.filetype.length - 1];
		this.path = "." + u.path; //the website in the same directory than the node server
		//console.log(this.path);
		if (u.path == "/html/connected.html")//pour voir dans quel page on va
			{				
				db.valid_cookie(this.req.headers.cookie, this, "check_user"); // on verifie si c un user (si oui il accede aux pages ou il faut être admin sinon on le redirige sur la page d'accueil)
			}
		else{
			this.read_file();
			}
		},

check_user:
	function (ret) {
		if (ret == true) {			
			this.read_file();
		}else{
			this.resp.end('<p>Non connect&eacute</p><A HREF="../../index.html">Cliquer pour aller au menu principal</A><script>window.onload=function(){setTimeout(function(){window.location="../../index.html"},2000)}</script>');
		}
	},

post_method:
	function (){
		var _this = this;
        var buff = "";
        this.req.on("data", function (c) {
            buff += c;
        });
        this.req.on("end", function () {
           if(buff) _this.go_post(buff);
           else{
           	util.log('hack attempt BRO');
           }
        });
    },
    
go_post:
	function (b) {
		b = JSON.parse(b);
		this.b = b;
		if (b.ac == "login") {
			this.resp.writeHead(200,{"Content-Type": "application/json" });
			if (verification_data_entrantes.check_info_caract_(b)){
				//on regarde si les champs de l'objet ne contiennent pas de caracèrest spéciaux(eg: espace, crochets...) et sont de longueur entre 3 et 10 avant d'envoyer au router
				db.login(b.username.toLowerCase(), b.password, this.resp);
			}else{
				this.resp.end(JSON.stringify({message: "login_connexion_refused"}));
			}			
		}
		
		else if (b.ac == "register"){			
			this.resp.writeHead(200,{"Content -Type": "application/json"});
			if (verification_data_entrantes.check_info_caract_(b)){
				//on regarde si les champs de l'objet ne contiennent pas de caracèrest spéciaux(eg: espace, crochets...) et sont de longueur entre 3 et 10 avant d'envoyer au router
				db.register(b.username, b.password, this.resp);
			}else {
				this.resp.end(JSON.stringify({message: "register_problem_info_entered"}));
			}			
		}else {
			db.valid_cookie(this.req.headers.cookie, this, "cb_cookie");
		}
		
		
		
	},

cb_cookie:
	function (ret) {
		var b = this.b;
		if (ret) {

			if (b.ac == "logout"){
				this.resp.writeHead(200,{"Content -Type": "application/json"});
				db.logout(this.req.headers.cookie, this.resp);	
				return;			
			}else if(b.ac == "delete"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});
				if(b.password!=""){
					db.delete_(this.req.headers.cookie, b.password, this.resp);
					return;
				} else{
					this.resp.end(JSON.stringify({message: "error_delete_account"}));	
				} 
			}else if (b.ac == "pseudo_request_"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});
				db.pseudo_request_(this.req.headers.cookie, this.resp);
				return;
			}else if (b.ac == "search_user_request"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});
				b.search_name=b.search_name.replace(/ /g,"");//on supprim les espace
				if(b.search_name.length>=1){
					db.search_user_request(b.search_name,this.req.headers.cookie, this.resp);
				}else{
					this.resp.end(JSON.stringify({message: "search_name_length_too_short"}));
				}
				return;
			}else if(b.ac == "add_friend"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});				
				b.friend_to_add += "";//pour le forcer à être un string
				b.friend_to_add = b.friend_to_add.replace(/ /g,"");//on supprime les espaces 
				if(b.friend_to_add.length>0){//si la taille du string est supérieur à 0 on recherche l'ami sinon ca vaut pas le coup
					db.add_friend(b.friend_to_add,this.req.headers.cookie, this.resp);
				}else{
					this.resp.end(JSON.stringify({message: "error_adding_friend"}));
				}
				return;
			}else if(b.ac == "get_friends"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});
				db.get_friends(this.req.headers.cookie, this.resp);
				return;
			}else if(b.ac == "delete_friend"){				
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
			}else if(b.ac=="add_status"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});
				if(b.status_user.length>=1 && b.status_user.length<150){//status length entre 1 et 150 caract
					db.add_status_user(b.status_user, this.req.headers.cookie, this.resp);
				}else{
					this.resp.end(JSON.stringify({message: "too_short_or_too_long"}));
				}
				return;
			}else if(b.ac=="get_status"){
				this.resp.writeHead(200, {"Content-Type":"application/json"});
				db.get_status(this.req.headers.cookie, this.resp);
			}else{
				util.log("INFO - Action not found : " + b.ac);
				this.resp.writeHead(501, {"Content -Type": "application/json"});
				this.resp.end();
			}
		}else{
			this.resp.writeHead(501, {"Content -Type": "application/json"});
			this.resp.end();
		}		
	},

		
read_file:
function () {
	//console.log(util.inspect(this.pathname));
	if (!this.pathname[0] || this.pathname[0] == "router.js" || this.pathname[0] == "server.js" || this.pathname[0] == "db.js") {
		util.log("ALERT - Hack attempt, resquest on : " + util.inspect(this.pathname));
		this.pathname = "./index.html";
		this.path = "./index.html";
		this.filetype = "html";
	}	
	this.load_file();	
},
	
load_file:
	function () {
		var _this = this;
		fs.exists(this.path, function (ex) {
			if (ex) {
				fs.readFile(_this.path, function (e, d) {
					if (e) {
						util.log("ERROR - Problem reading file : " + e);
					} else {
						_this.file = d;
						//util.puts("GET on path : " + util.inspect(_this.path));
						_this.file_processing();
			} });
			} else {
				util.log("INFO - File requested not found : " + _this.path);
				_this.resp.writeHead(404,{"Content -Type":"text/html"});
				_this.resp.end(); 
			}
		});
	},
	
file_processing:
	function () {
		if (this.filetype == "htm") {
			this.resp.writeHead(200,{"Content -Type": "text/html"});
		} else if (this.image_file.indexOf(this.filetype) >= 0) {
			this.resp.writeHead(200,{"Content-Type" : "image/" + this.filetype });
		} else {
			this.resp.writeHead(200,{"Content-Type" : "text/" + this.filetype });
		}
		this.file_send();
	},
	
file_send:
function () {
	this.resp.write(this.file);
	this.resp.end();
	}
}


// Pour vérifier les données entrante

verification_data_entrantes.check_info_caract_ = function(data){
data.username ="" + data.username;//on force l'info username à être un string
data.password = "" + data.password;//on force l'info pwd à être un string
data.username = data.username.replace(/ /g,"");//on retire les espaces du username
data.password = data.password.replace(/ /g,"");//on retire les espace du pwd
var reg = new RegExp(/^\w+$/);//regexp Alphanumeric
//on retourne vrai si chaque champs est compris entre 3 et 15 caractères et si c'est bien un alphaNumeric
	if(reg.test(data.username) && reg.test(data.password) && data.username.length >= 3 && data.username.length <= 10 && data.password.length >= 3 && data.password.length <= 10){		
		return true;
	}else return false;	
};

