const mysql = require('mysql')


const conexion = mysql.createConnection({
    host:'localhost',
    database: 'practica_db',
    user:'root',
    password:""
  });





module.exports = {conexion}