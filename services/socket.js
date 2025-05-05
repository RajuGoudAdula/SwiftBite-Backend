const { Server } = require('socket.io');

const connectedUsers = {}; // userId -> [socketId1, socketId2, ...]
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
        // If user is not in the connectedUsers, create an empty array
        if (!connectedUsers[userId]) {
          connectedUsers[userId] = [];
        }
        // Add the socket ID to the user's list of socket IDs
        connectedUsers[userId].push(socket.id);
        
        // Optionally store user details (like role)
        userDetails[userId] = { role };
        
      }
    });

    socket.on("disconnect", () => {
      // Remove the socket ID from the user's list when they disconnect
      for (const userId in connectedUsers) {
        const index = connectedUsers[userId].indexOf(socket.id);
        if (index !== -1) {
          connectedUsers[userId].splice(index, 1); // Remove the socket ID
          break;
        }
      }
    });
  });

  // Function to send notifications to all connected devices/tabs of a user
  const sendNotification = (userId, message) => {
    const sockets = connectedUsers[userId];
    if (sockets && sockets.length > 0) {
      sockets.forEach((socketId) => {
        io.to(socketId).emit("notification", message); // Send notification to each socket ID
      });
    } else {
      // console.log(`User ${userId} is not connected`);
    }
  };

  // Expose for use in notification utility
  global.io = io;
  global.connectedUsers = connectedUsers;
  global.userDetails = userDetails;
  global.sendNotification = sendNotification;

  return { io, connectedUsers, sendNotification };
}

module.exports = { setupSocket };
