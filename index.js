const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
require('dotenv').config(); // For environment variables

const app = express();
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(bodyParser.json()); // Middleware to parse JSON bodies


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));




// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const canteenRoutes = require('./routes/canteenRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/user',userRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/canteen',canteenRoutes);


app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

app.get("/check",(req,res)=>{
  res.status(200).json({message : "successfully running"});
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
