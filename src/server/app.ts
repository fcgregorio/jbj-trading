import express, { ErrorRequestHandler, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res, next) {
    console.log(path.join(__dirname, 'public', 'index.html'))
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default app;
