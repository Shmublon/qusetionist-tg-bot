var TelegramBot = require('node-telegram-bot-api');
var token = '599469376:AAE-o8YndW53cVB_LNGP3ssx4hdLGlxeeaA';
var request = require("request");
var telegramBot = new TelegramBot(token, {polling: true});

telegramBot.onText(/\/start/, function (msg) {
    telegramBot.sendMessage(msg.chat.id, "Тут будет некое описание того как этой штукой польщоваться. " +
        "Для начала введите что угодно...", {
        "reply_markup": {
            "keyboard": [["Поехали!"]],
            "one_time_keyboard": true
        }
    });
});

var userId = null;
telegramBot.on("message", function (msg) {
    if (msg.text !== '/start') {
        request("https://questions-engine.herokuapp.com/random-question", function (error, response, question) {
            nextQuestion(msg, JSON.parse(question)).then(function () {
                if (userId === null) {
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
                        request.post({
                            url: 'https://questions-engine.herokuapp.com/store-result',
                            form: {
                                'answer': msg.text,
                                'user_id': userId,
                                'question_id': JSON.parse(question).id
                            }
                        }, function (error, response, body) {
                            console.log('Stored answer id: ' + JSON.parse(body).id)
                        });
                    })
                } else {
                    request.post({
                        url: 'https://questions-engine.herokuapp.com/store-result',
                        form: {
                            'answer': msg.text,
                            'user_id': userId,
                            'question_id': JSON.parse(question).id
                        }
                    }, function (error, response, body) {
                        console.log('Stored answer id: ' + JSON.parse(body).id)
                    });
                }
            });
        });
    }
});

function nextQuestion(msg, question) {
    var answers = question.answers.split("/");
    var answersButtons = [];
    answers.forEach(function (value) {
        var buffer = [];
        buffer.push(value);
        answersButtons.push(buffer)
    });
    answersButtons.push(["пропустить"]);
    return telegramBot.sendMessage(msg.chat.id, question.text.toString(), {
        "reply_markup": {
            "keyboard": answersButtons,
            "one_time_keyboard": true
        }
    });
}
