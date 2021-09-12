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
    console.log(`User ${socket.id} connected.`);

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected.`);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});
