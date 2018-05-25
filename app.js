var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var app = express();
var telegram = require('routes/telegram');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('', telegram);

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(__dirname + '../public'));

module.exports = app;
