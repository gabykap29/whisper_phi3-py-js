import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import router from "./routes/routes.js";
const app = express();

// settings
app.use(cors('*'));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


//routes

app.use('/api', router);


app.listen(3000, () => {
    console.log('Server on port 3000');
});