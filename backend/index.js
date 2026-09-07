import express from 'express';
import dotenv from 'dotenv';

dotenv.config();



import cors from 'cors';
import dbConnect from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());


dbConnect();

app.use('/api/auth', userRoutes);   
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => {
    res.json({
        name: "shlok",
        class: "B.tech"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});