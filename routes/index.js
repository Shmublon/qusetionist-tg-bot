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

telegramBot.on("message", function (msg) {
    console.log("Chat id: " + msg.chat.id);
    console.log("Chat id: " + msg.from.first_name);
    if (msg.text !== '/start') {
        var storeAnswerPromise = new Promise(function (resolve, reject) {
            request.post({
                url: 'http://ec2-34-209-71-86.us-west-2.compute.amazonaws.com:3000/create-user-if-not-exist',
                form: {
                    'name': msg.from.first_name,
                    'age': 0,
                    'gender': 'male',
                    'balance': 0
                }
            }, function (err, httpResponse, body) {
                var userId = JSON.parse(body).id;
                request('http://ec2-34-209-71-86.us-west-2.compute.amazonaws.com:3000/lastUnansweredQuestion/' + userId,
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
                            }
                            request.put({
                                url: 'http://ec2-34-209-71-86.us-west-2.compute.amazonaws.com:3000/result/' + JSON.parse(result).id,
                                form: {
                                    'answer': answer,
                                    'answered': true,
                                    'skipped': skipped,
                                    'user_answer': user_answer
                                }
                            }, function (error, response, body) {
                                resolve(userId);
                            });
                        } else {
                            resolve(userId);
                        }
                    });
            });
        });
        storeAnswerPromise.then(function (userId) {
            request("http://ec2-34-209-71-86.us-west-2.compute.amazonaws.com:3000/random-question", function (error, response, question) {
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
            url: 'http://ec2-34-209-71-86.us-west-2.compute.amazonaws.com:3000/store-result',
            form: {
                'answer': '',
                'user_id': userId,
                'question_id': question.id
            }
        });
    });
}


/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

module.exports = router;
