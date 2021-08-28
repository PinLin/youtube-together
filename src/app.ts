import { config } from 'dotenv';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import path from 'path';
import { Server } from 'socket.io';

config();

const app = express();
app.use(morgan('common'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/hello', (req, res) => {
    res.send('Hello World!');
});

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('message', (message) => {
        console.log('message:', message);
        io.send(message);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});
