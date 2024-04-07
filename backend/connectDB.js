const express = require('express')
const mysql = require('mysql')


var mysqlConfig = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'iot'
};
var pool  = mysql.createConnection(mysqlConfig);

// Kết nối đến cơ sở dữ liệu MySQL
pool .connect((err) => {
if (err) {
   console.error('Error connecting to MySQL:', err);
   return;
}
console.log('Connected to MySQL database');
});
module.exports = pool;