function divEscapeContentElement(message) {
    // return $('<div></div>').text(message);
    return document.createElement('div').textContent = message;
}

function divSystemContentElement(message) {
    // return $('<div></div>').html('<i>' + message + '</i>');
    return document.createElement('div').innerHtml = '<i>' + message + '</i>';
}

function processUserInput(chatApp, socket) {
    var messageInput = document.getElementById('send-message')
    var message = messageInput.value;
    var systemMessage;
    if(message.chartAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if(systemMessage) {
            document.getElementById('messages').appendChild(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage(document.getElementById('room').textContent, message);
        var msgs = document.getElementById('messages');
        msgs.appendChild(divEscapeContentElement(message));
        // $('#messages').scrollTop($('#messages').prop('scrollHeight'));
        msgs.scrollTop = msgs.scrollHeight;
    }
    messageInput.value = '';
}