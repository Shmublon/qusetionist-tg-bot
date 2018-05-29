var express = require('express');
var router = express.Router();

var TelegramBot = require('node-telegram-bot-api');
// var token = '594036190:AAFuHq9GsgTybrX_3HLEhIh4c3LnK5j2DH8'; // token for testing bot
var token = '599469376:AAE-o8YndW53cVB_LNGP3ssx4hdLGlxeeaA'; // token for real bot
var request = require("request");
var telegramBot = new TelegramBot(token, {polling: true});

var domain = 'http://ec2-34-209-71-86.us-west-2.compute.amazonaws.com:3000';
// var domain = 'http://localhost:3000';
telegramBot.onText(/\/start/, function (msg) {
    telegramBot.sendMessage(msg.chat.id, "Тут будет некое описание того как этой штукой пользоваться. " +
        "Для начала введите что угодно...", {
        "reply_markup": {
            "keyboard": [["Поехали!"]],
            "one_time_keyboard": true
        },
        "disable_notification": true
    });
});

telegramBot.on("message", function (msg) {
    console.log("Chat id: " + msg.chat.id);
    console.log("Chat id: " + msg.from.first_name);
    if (msg.text !== '/start') {
        var storeAnswerPromise = new Promise(function (resolve, reject) {
            request.post({
                url: domain + '/create-user-if-not-exist',
                form: {
                    'name': msg.from.first_name,
                    'age': 0,
                    'gender': 'male',
                    'balance': 0
                }
            }, function (err, httpResponse, body) {
                var userId = JSON.parse(body).id;
                var balance = JSON.parse(body).balance;
                request(domain + '/lastUnansweredQuestion/' + userId,
                    function (error, response, result) {
                        if (response.statusCode === 200) {
                            var skipped = false;
                            var user_answer = false;
                            var answer = '';
                            if (msg.text.toLowerCase() === 'пропустить') {
                                skipped = true;
                            } else {
                                answer = msg.text;
                                if (JSON.parse(result).question.answers.indexOf(msg.text) === -1) {
                                    user_answer = true;
                                }
                                balance = balance + 1;
                            }
                            request.put({
                                url: domain + '/result/' + JSON.parse(result).id,
                                form: {
                                    'answer': answer,
                                    'answered': true,
                                    'skipped': skipped,
                                    'user_answer': user_answer
                                }
                            }, function (error, response, body) {
                                request.put({
                                    url: domain + '/user/' + userId,
                                    form: {
                                        'balance': balance
                                    }
                                }, function (error, response, user) {
                                    telegramBot.sendMessage(msg.chat.id,
                                        "Вы заработали токен! Ваш баланс: <b>" + JSON.parse(user).balance + "</b>",
                                        {
                                            "parse_mode": "html",
                                            "disable_notification": true
                                        });
                                    resolve(userId);
                                });
                            });
                        } else {
                            resolve(userId);
                        }
                    });
            });
        });
        storeAnswerPromise.then(function (userId) {
            request(domain + '/next-question/' + userId, function (error, response, question) {
                if (response.statusCode === 200) {
                    nextQuestion(msg, JSON.parse(question), userId);
                } else {
                    telegramBot.sendMessage(msg.chat.id, 'Вы ответили на все доступные вопросы, ждите новых вопросов!', {
                        "disable_notification": true,
                        "reply_markup": {
                            "remove_keyboard": true
                        }
                    })
                }
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
        },
        "disable_notification": true
    }).then(function (sentQuestion) {
        request.post({
            url: domain + '/store-result',
            form: {
                'answer': '',
                'user_id': userId,
                'question_id': question.id,
                'answered': false,
                'skipped': false,
                'user_answer': false,
                'archived': false
            }
        });
    });
}


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

module.exports = router;
