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
    nickNames['socket.id'] = name;
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
    if(usersInRoom.length > 1){
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