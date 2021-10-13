const express = require("express");
const cors = require("cors");
require("dotenv").config();
const http = require("http");
const socketio = require("socket.io");
const router = require("./router");
const PORT = process.env.PORT || 5000;
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "PATCH"],
	},
});

io.on(`connection`, (socket) => {
	socket.on("join", ({ name, room }, callback) => {
		console.log(`${name} has join ${room}!`);
		const { user, error } = addUser({ id: socket.id, name, room });
		if (error) return callback(error);
		socket.emit("message", {
			user: "admin",
			text: `${user.name}, welcome to ${user.room} `,
		});
		socket.emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room),
		});
		socket.broadcast.to(user.room).emit("message", {
			user: "admin",
			text: `${user.name} has joined!`,
		});
		socket.join(user.room);
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room),
		});
		callback();
	});
	socket.on("sendMessage", (message, callback) => {
		const user = getUser(socket.id);
		io.to(user.room).emit("message", { user: user.name, text: message });
		callback();
	});
	socket.on("disconnect", () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit("message", {
				user: "admin",
				text: `${user.name} has left!!!`,
			});
		}
	});
});
app.use(cors());
app.use(router);

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));