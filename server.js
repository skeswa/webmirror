var express = require("express");
var http = require('http');
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var md5 = require('MD5');
var request = require('request');
var MongoClient = require('mongodb').MongoClient
var net = require('net');
var engines = require('consolidate');
var sendgrid = require('sendgrid')('caputit1', 'dabdabd6');
var Email = sendgrid.Email;
var machines = require('./device.js');

const PORT = 3546;
const CLIENT_CONNECTION_PORT = 7373;
const MONGO_URL = 'mongodb://pooter.sandile.me:27017/';
const COLLECTION_NAME = 'lmgtfy';

const GOOGLE_CLIENT_ID = '536098998739-dn8iv8i1gk4pre2phi8umoutnareqac3.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'f4vl7cFJRglIj5G9OFDVu4j9';
const REDIRECT_URI = 'http://pooter.sandile.me:3546/google/callback';

//express
var app = express();
app.use(express.cookieParser());
app.use(express.session({
    secret: 'secret_key',
    store: express.session.MemoryStore({
        reapInterval: 60000 * 10
    })
}));
app.use(express.bodyParser());
app.use("/js", express.static(__dirname + "/web/js"));
app.use("/css", express.static(__dirname + "/web/css"));
app.use("/img", express.static(__dirname + "/web/img"));
app.use(function(req, res, next){
    console.log("CALL: " + req.url);
    next();
});

app.set('views', __dirname + '/web/views');
app.engine('html', engines.mustache);
app.set('view engine', 'html');


/*----------------------------GOOGLE INFO------------------------------*/

app.get('/google/info', function(req, res){
	if(!req.session.access_token){
		req.session.state = md5((new Date()).getTime() + Math.floor((Math.random() * 100) + 1) + 'totallythestate');
		var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + qs.stringify({
			client_id: GOOGLE_CLIENT_ID, 
			redirect_uri: REDIRECT_URI, 
			response_type: 'code',
			scope: 'openid profile email',
			state: req.session.state
			});
		res.redirect(authUrl);
	}else{
		request('https://www.googleapis.com/oauth2/v3/userinfo?' + qs.stringify({access_token: req.session.access_token}), function(err, response, body){
			if(err) res.send(400, err);
			var payload = JSON.parse(body);
			req.session.user = payload.email.split('@')[0];
			res.redirect('/main');
		});
	}
});

app.get('/google/callback', function(req, res){
	//totally confirming the state....
	if(req.session.state !== req.param('state')) res.send(400, 'bad state');
	else{
		request({
			url: 'https://accounts.google.com/o/oauth2/token',
			form: {
				client_id: GOOGLE_CLIENT_ID,
				client_secret: GOOGLE_CLIENT_SECRET,
				grant_type: 'authorization_code',
				redirect_uri: REDIRECT_URI,
				code: req.param('code')
			},
			method: 'POST'
		}, function(err, response, body){
			if(err) res.send(400, err);
			var payload = JSON.parse(body);
			req.session.access_token = payload.access_token;
			res.redirect('/google/info');
		});
	}
});

/*-------------------------------Getters---------------------------------*/
app.get('/username', function(req, res){
	if(req.session.user) res.send(200, req.session.user);
	else res.send(400, 'not authed');
});

app.get('/machines', function(req, res){
	if(req.param('userId')) {
		res.json(200, machines.get(req.param('userId')));
	}else res.send(400, 'userId not included');
});

app.post('/machines/register', function(req, res){
	if(req.body.machineId && req.body.peerId) {
		var payload = req.body;
		machines.register(req.session.user, payload.machineId, payload.peerId, payload.deviceType);
		res.json(200, {});
	}else res.send(400, 'machineId or peerId missing');
});


/*-------------------------------Page Routing---------------------------------*/

app.get('/', function(req, res){
	if(req.session.user) res.redirect('/main');
	else res.render('intro.html');
});

app.get('/main', function(req, res){
	if(!req.session.user) res.redirect('/');
	else res.render('main.html');
});

http.createServer(app).listen(PORT);