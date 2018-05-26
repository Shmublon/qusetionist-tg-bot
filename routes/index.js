var express = require('express');
var router = express.Router();

var TelegramBot = require('node-telegram-bot-api');
var token = '599469376:AAE-o8YndW53cVB_LNGP3ssx4hdLGlxeeaA';
var request = require("request");
var telegramBot = new TelegramBot(token, {polling: true});

telegramBot.onText(/\/start/, function (msg) {
    telegramBot.sendMessage(msg.chat.id, "Тут будет некое описание того как этой штукой пользоваться. " +
        "Для начала введите что угодно...", {
        "reply_markup": {
            "keyboard": [["Поехали!"]],
            "one_time_keyboard": true
        }
    });
});

var userId = null;
var userName = null;
telegramBot.on("message", function (msg) {
    console.log("Chat id: " + msg.chat.id);
    console.log("Chat id: " + msg.from.first_name);
    if (msg.text !== '/start') {
        var storeAnswerPromise = new Promise(function (resolve, reject) {
            if (userId === null || userName !== msg.from.first_name) {
                request.post({
                    url: 'https://questions-engine.herokuapp.com/create-user-if-not-exist',
                    form: {
                        'name': msg.from.first_name,
                        'age': 0,
                        'gender': 'male',
                        'balance': 0
                    }
                }, function (err, httpResponse, body) {
                    userId = JSON.parse(body).id;
                    userName = JSON.parse(body).name;
                    request('https://questions-engine.herokuapp.com/lastUnansweredQuestion/' + userId,
                        function (error, response, result) {
                            if (response.statusCode === 200) {
                                request.put({
                                    url: 'https://questions-engine.herokuapp.com/result/' + JSON.parse(result).id,
                                    form: {
                                        'answer': msg.text,
                                        'answered': true
                                    }
                                }, function (error, response, body) {
                                    resolve();
                                });
                            } else {
                                resolve();
                            }
                        });
                })
            } else {
                request('https://questions-engine.herokuapp.com/lastUnansweredQuestion/' + userId,
                    function (error, response, result) {
                        if (response.statusCode === 200) {
                            request.put({
                                url: 'https://questions-engine.herokuapp.com/result/' + JSON.parse(result).id,
                                form: {
                                    'answer': msg.text,
                                    'answered': true
                                }
                            }, function (error, response, body) {
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    });
            }
        });
        storeAnswerPromise.then(function () {
            request("https://questions-engine.herokuapp.com/random-question", function (error, response, question) {
                nextQuestion(msg, JSON.parse(question), userId);
            });
        });
    }
});

function nextQuestion(msg, question, userId) {
    var answers = question.answers.split("/");
    var answersButtons = [];
    answers.forEach(function (value) {
        var buffer = [];
        buffer.push(value);
        answersButtons.push(buffer)
    });
    answersButtons.push(["пропустить"]);
    telegramBot.sendMessage(msg.chat.id, question.text.toString(), {
        "reply_markup": {
            "keyboard": answersButtons,
            "one_time_keyboard": true
        }
    }).then(function (sentQuestion) {
        request.post({
            url: 'https://questions-engine.herokuapp.com/store-result',
            form: {
                'answer': '',
                'user_id': userId,
                'question_id': question.id,
                'answered': false
            }
        });
    });
}


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

module.exports = router;
