import { Server, Socket } from "socket.io";
import {message} from './socket-handler/chat'

export default (io: Server) => {

    io.on('connection', async (socket: Socket) => {
        message(socket) // call messages 
        console.log("new client connected with SocketId:", socket.id);


        socket.on('disconnection', () => {
            console.log("Client disconnected with socketId", socket.id)
        })

    })

}