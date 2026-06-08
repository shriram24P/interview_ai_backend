require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

connectDB();

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.listen(process.env.PORT || 3000, ()=>{
    console.log('Server is running on port ' + (process.env.PORT || 3000));
})