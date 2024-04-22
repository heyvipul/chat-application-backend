const express = require("express")
const { Server } = require("socket.io");
const { createServer } = require("http");
const router = require("./routers/router")
const cors = require("cors")
const {addUser,removeUser,getUser,getUserInRoom } = require("./helpers/user")

const PORT = process.env.PORT || 5000

const app = express()
app.use(cors()); 
// const server = http.createServer(app)
// const io = socketio(server)
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});
  

io.on("connection",(socket)=>{
    socket.on("join", ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });
    
        if (error) {
            return callback(error); // Handle error object returned from addUser
        }

        //single message to user join
        socket.emit("message",{user : "admin", text: `${user.name} welcome to room ${user.room}`})

        //broadcast send message to everyone
        socket.broadcast.to(user.room).emit("message",{user:"admin",text : `${user.name} has joined`})

        socket.join(user.room);

        io.to(user.room).emit('roomData',{room:user.room,users:getUserInRoom(user.room)})

        callback();
    })

    //events for user generated messages;
    

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id);

        io.to(user.room).emit("message",{user:user.name,text:message});
        io.to(user.room).emit("roomData",{room:user.room,users:getUserInRoom(user.room)});

        callback();
    })
    
    
    socket.on("disconnect",()=>{
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit("message",{user:'admin',text:`${user.name} has left.`})
        }
    })
})

app.use(router);

httpServer.listen(PORT,()=>{
    console.log(`Server started on port ${PORT}`);
})

