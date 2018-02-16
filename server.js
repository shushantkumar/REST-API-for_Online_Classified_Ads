const http = require('http');           //importing the http
const app = require('./app');           //this was to link it to the app.js file 

const port = process.env.PORT || 3000;  //creating port where the project will run

const server = http.createServer(app);  //this creates a server. (app) is passed to it

server.listen(port);