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
var previousQuestion = null;
telegramBot.on("message", function (msg) {
    console.log("Chat id: " + msg.chat.id);
    console.log("Chat id: " + msg.from.first_name);
    if (msg.text !== '/start') {
        var storeAnswerPromise = new Promise(function (resolve, reject) {
            if (previousQuestion !== null) {
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
                        request.post({
                            url: 'https://questions-engine.herokuapp.com/store-result',
                            form: {
                                'answer': msg.text,
                                'user_id': userId,
                                'question_id': previousQuestion.id
                            }
                        }, function (error, response, body) {
                            console.log('Question: ' + previousQuestion.text);
                            console.log('Answer: ' + msg.text);
                            console.log('Stored!');
                            resolve();
                        });
                    })
                } else {
                    request.post({
                        url: 'https://questions-engine.herokuapp.com/store-result',
                        form: {
                            'answer': msg.text,
                            'user_id': userId,
                            'question_id': previousQuestion.id
                        }
                    }, function (error, response, body) {
                        console.log('Question: ' + previousQuestion.text);
                        console.log('Answer: ' + msg.text);
                        console.log('Stored!');
                        resolve();
                    });
                }
            } else {
                resolve();
            }
        });
        storeAnswerPromise.then(function () {
            request("https://questions-engine.herokuapp.com/random-question", function (error, response, question) {
                var parsedQuestion = JSON.parse(question);
                nextQuestion(msg, parsedQuestion);
                previousQuestion = parsedQuestion;
            });
        });
    }
});

function nextQuestion(msg, question) {
    return new Promise(function (resolve, reject) {
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
        }).then(function (value) {
            resolve(question);
        });
    })
}


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

module.exports = router;
