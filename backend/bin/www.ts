import { config } from 'dotenv'
import app from '../src/index'
import debug from 'debug'
import http from 'http'
import { Server } from 'socket.io';
import socketController from '../src/socket/socketController'

config()

const port = normalizePort(process.env.PORT ?? '4000')
app.set('port', port)

/**
 * Create HTTP server.
 */
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
})
app.set('socketio', io);
socketController(io)

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort (val: string): string | number | false {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError (error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(bind + ' is already in use')
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening (): void {
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port
  debug('Listening on ' + bind)
  console.log('Listening on ' + bind)
}
