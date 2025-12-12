// 向指定大厅广播
export function broadcastToHall(socket, room, data) {
    socket.to(room).emit('data', data)
    socket.emit('data', data)
}
