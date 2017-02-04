const socketio = require('socket.io');
const guestNumeber = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom = {};
let io;

exports.listen = function(server) {
    // Start socket.io server, allowing it to piggyback on existing HTTP server sharing TCP/IP port
    io = socketio.listen(server);

    io.sockets.on('connections', function(socket) {
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    
        joinRoom(socket, 'General');

        handleMessangerBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms', function() {
            socket.emit('rooms', io.socket.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

// Helper function 
function assignGuestName(socket, guestNumberm, nickNamesm, namesUsed) {
    let name = 'Gest' + guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult', {
        success: true,
        name: name 
    });
    namesUsed.push(name);
    return guestNumber + 1;
}

// Helper function 
function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    // Broadcast to all users in room the user
    socket.broadcast.to(room).emit('message', {
        text: `${nickNames[socket.id]} has joined ${room}:`,
    });
    // Get all users in socket channel
    let usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length > 1) {
        let usersInRoomSummary = `Users currently in ${room} :`;
        for(let index in usersInRoom) {
            let userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id) {
                if(index > 0) {
                    usersInRoomSummary += `, `;
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += `.`;
        // Send new user in the room summary of all other users
        socket.emit('message', {
            text: usersInRoomSummary
        });
    }
}

// Helper function
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function(name) {
        if(name.indexOf('Guest') == 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'Name cannot begin whit "Guest".'
            });
        } else {
            if(namesUsed.indexOf(name) == -1) {
                let previousName = nickNames[socket.id];
                let prviouesNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[prviouesNameIndex];
                socket.emit('nameResult',{
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: `${previousName} is now known as ${name}.`
                });
            } else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use'
                });
            }
        }
    });
}

// Helper function 
function handleMessageBroadcasting(socket) {
    socket.on('message', function(message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ':' + message.text
        });
    });
}

// Helper function
function handleRoomJoining(socket) {
    socket.on('join', function(socket) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    });
}

// Helper function
function handleClientDisconnection(socket) {
    socket.on('disconnect', function() {
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id]; 
    });
}