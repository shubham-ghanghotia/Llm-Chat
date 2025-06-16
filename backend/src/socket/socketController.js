import { message } from './socket-handler/chat';
export default (io) => {
    io.on('connection', async (socket) => {
        message(socket); // call messages 
        console.log("new client connected with SocketId:", socket.id);
        socket.on('disconnection', () => {
            console.log("Client disconnected with socketId", socket.id);
        });
    });
};
