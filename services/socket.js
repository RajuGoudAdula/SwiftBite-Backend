const { Server } = require('socket.io');

const connectedUsers = {}; // userId -> socketId
const userDetails = {};    // userId -> { role }

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "https://swiftbiteapp.netlify.app"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
   
    socket.on("register", ({ userId, role }) => {
      if (userId) {
        connectedUsers[userId] = socket.id;
        userDetails[userId] = { role };
      }
    });

    socket.on("disconnect", () => {
      for (const userId in connectedUsers) {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          delete userDetails[userId];
          break;
        }
      }
    });
  });

  // Expose for use in notification utility
  global.io = io;
  global.connectedUsers = connectedUsers;
  global.userDetails = userDetails;

  return { io, connectedUsers };
}

module.exports = {setupSocket};
