var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');

var question = require('./routes/telegram');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.use('', question);
app.use('', user);

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(__dirname + '../public'));
app.set('views', __dirname + '/public');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({
    extended: true, limit: '5mb'
}));
app.use(bodyParser.json({limit: '5mb'}));

app.get('/', function(req, res){
    res.render('main.html');
});

module.exports = app;
