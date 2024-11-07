// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';

// Initialize Express and create an HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;
// Set EJS as the view engine
app.set('view engine', 'ejs');
// Middleware to parse URL-encoded request bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files from the 'public' directory
app.use(express.static('public'));
// Route for the home page
app.get('/', (req, res) => {
    res.render('home.ejs');
});
// Route for the chat page
app.get('/chat', (req, res) => {
    res.render('chat.ejs');
});
// In-memory storage for online users
let onlineUsers = [];
// Socket.IO connection event
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    // Add user to online list and notify others
    onlineUsers.push(socket.id);
    socket.emit('userCount', onlineUsers.length);
    // Match user with a random other user
    if (onlineUsers.length > 1) {
        const partnerId = onlineUsers.find(id => id !== socket.id);
        io.to(socket.id).emit('match', partnerId);
        io.to(partnerId).emit('match', socket.id);
    }
    // Handle incoming chat messages
    socket.on('message', (data) => {
        const { recipientId, message } = data;
        io.to(recipientId).emit('message', { senderId: socket.id, message });
    });
    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        onlineUsers = onlineUsers.filter(id => id !== socket.id);
        io.emit('userCount', onlineUsers.length);
    });
});
// Start the server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});