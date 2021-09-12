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

interface Room {
    media: string;
    state: number;
    speed: number;
    progress: number;
    updateTime?: number;
}
const rooms = {} as { [userId: string]: Room };

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected.`);

    socket.on('host', () => {
        function update() {
            var startTime = Date.now();
            socket.emit('update', (room: Room) => {
                var offset = (Date.now() - startTime) / 2000;
                rooms[socket.id] = {
                    ...room,
                    progress: room.progress + offset,
                    updateTime: Date.now(),
                };
            });

            setTimeout(() => { update(); }, 1000);
        }
        update();
    });

    socket.on('sync', (userId: string, callback: (room: Room) => void) => {
        const room = rooms[userId];
        if (room) {
            callback({
                ...room,
                progress: room.progress + (Date.now() - room.updateTime) / 1000,
            });
        }
    });

    socket.on('disconnect', () => {
        delete rooms[socket.id];
        console.log(`User ${socket.id} disconnected.`);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on http://localhost:${port}`);
});
