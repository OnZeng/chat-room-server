export default function (socket, allDB) {
  socket.on('ping', (callback) => {
    callback();
  });
}
