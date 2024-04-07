var mqtt = require('mqtt');
var mysql = require('mysql');

var mqttOptions = {
    host: "192.168.100.14",
    port: 1883,
    protocol: "mqtt",
    username: "mqtt",
    password: "123",
  };
  
  var mysqlConfig = {
    host: "localhost",
    user: "root",
    password: "123456",
    database: "iot",
  };

// Initialize MQTT client
var mqttClient = mqtt.connect(mqttOptions);

// Initialize MySQL connection
var mysqlConnection = mysql.createConnection(mysqlConfig);

// MQTT connect event
mqttClient.on('connect', function () {
    console.log('Connected to MQTT broker');
    // Subscribe to the topic where sensor data is published
    mqttClient.subscribe('sensor');
});

mqttClient.on('message', (topic, message) => {
    console.log('Nhận được dữ liệu từ topic:', topic);
    console.log('Nội dung:', message.toString());

    try {
        if (topic === "sensor")  {
            const data = JSON.parse(message); // Chuyển đổi chuỗi JSON thành đối tượng JavaScript

            // Lưu dữ liệu vào cơ sở dữ liệu MySQL
            const query = 'INSERT INTO sensor_data (temperature, humidity, light, created_at) VALUES (?, ?, ?, NOW())';
            const values = [data.temperature, data.humidity, data.light];
    
            mysqlConnection.query(query, values, (err, results, fields) => {
                if (err) {
                    console.error('Lỗi khi thêm dữ liệu vào MySQL:', err);
                    return;
                }
                console.log('Dữ liệu đã được lưu vào MySQL');
            });
        }

    } catch (error) {
        console.error('Lỗi khi xử lý dữ liệu:', error);
    }
});

mqttClient.on('connect', function () {
    console.log('Connected to MQTT broker');
    // Subscribe to the topics for controlling the devices
    mqttClient.subscribe('led');
    mqttClient.subscribe('fan');
});

mqttClient.on('message', (topic, message) => {
    console.log('Received message from topic:', topic);
    console.log('Content:', message.toString());

    if (topic === "led" || topic === "fan") {
        var device;
        if (topic === 'led') {
            device = 'LED';
        } else if (topic === 'fan') {
            device = 'FAN';
        } else {
            console.log('Unknown topic:', topic);
            return;
        }
    
        var action = message.toString();
        saveDeviceAction(device, action);
    }
});
function saveDeviceAction(device, action) {
    // Save device action to MySQL database
    var query = 'INSERT INTO device_actions (Device, action, created_at) VALUES (?, ?, NOW())';
    var values = [device, action];

    mysqlConnection.query(query, values, (err, results, fields) => {
        if (err) {
            console.error('Error saving device action to MySQL:', err);
            return;
        }
        console.log('Device action saved to MySQL');
    });
}
// MySQL connect event
mysqlConnection.connect(function (error) {
    if (error) {
        console.error('Error connecting to MySQL:', error);
    } else {
        console.log('Connected to MySQL database');
    }
});
