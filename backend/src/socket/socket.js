const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const env = require("../config/env");
const User = require("../models/User");

const getUserRoom = (userId) => `user:${userId}`;

const configureSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          env.clientUrl,
          "https://task-management-application-xi-six.vercel.app"
        ];
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.includes(origin) || 
                          (origin.startsWith("https://task-management-application-") && origin.endsWith(".vercel.app"));
        callback(null, isAllowed);
      },
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User no longer exists"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const room = getUserRoom(socket.user._id);
    socket.join(room);

    socket.emit("socket:ready", {
      userId: socket.user._id,
      room
    });
  });

  return io;
};

module.exports = {
  configureSocket,
  getUserRoom
};
