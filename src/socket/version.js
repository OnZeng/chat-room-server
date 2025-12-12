export default function (socket) {
    socket.emit('version', process.env.VERSION);
}