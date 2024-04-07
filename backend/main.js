const express = require('express');
const app = express();
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Import tài liệu OpenAPI từ file swagger.json
const pool  = require('./connectDB');
const req = require('express/lib/request');
app.use(express.json());
// Sử dụng tài liệu OpenAPI
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
// Sử dụng tài liệu OpenAPI

app.get('/dasboard/all',(req,res) =>{
    const query = 'SELECT * FROM dashboard';

    // Thực hiện truy vấn vào cơ sở dữ liệu
    pool.query(query, (error, results, fields) => {
      if (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      // Kiểm tra xem có dữ liệu trả về hay không
      if (results.length === 0) {
        res.status(404).send('Không có dữ liệu');
        return;
      }
  
      // Trả về dữ liệu như JSON
      res.json(results);
    });
});

app.get('/data_sensor/all', (req, res) => {
    let page = req.query.page || 'all'; // Mặc định là 'all' nếu không có trang được chỉ định
    let limit = 10; // Số lượng dữ liệu trên mỗi trang
    let offset = 0; // Offset mặc định là 0

    if (page !== 'all') {
        // Nếu page không phải là 'all', tính offset dựa trên trang và limit
        offset = (parseInt(page) - 1) * limit;
    }

    let sortField = req.query.sort || 'id'; // Mặc định sắp xếp theo id nếu không có trường sắp xếp được chỉ định
    let sortOrder = req.query.order || 'ASC'; // Mặc định là sắp xếp từ bé đến lớn

    let query = 'SELECT * FROM sensor_data';

    // Thêm điều kiện sắp xếp
    if (sortField !== 'all') {
        query += ` ORDER BY ${sortField} ${sortOrder}`;
    }

    // Thêm điều kiện phân trang nếu page không phải là 'all'
    if (page !== 'all') {
        query += ' LIMIT ? OFFSET ?';
    }

    // Thực thi truy vấn
    pool.query(query, (page !== 'all') ? [limit, offset] : [], (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).send('Không có data');
            return;
        }
        res.json(results);
    });
});



app.get('/data_sensor/search', (req, res) => {
    let page = req.query.page || 'all'; // Lấy trang từ tham số truy vấn, mặc định là 'all'
    const limit = 10; // Số lượng dữ liệu trên mỗi trang
    const offset = (page === 'all') ? 0 : ((parseInt(page) - 1) * limit); // Tính offset dựa trên trang và limit
    let filter = req.query.filter;
    let value = req.query.value;

    let query = 'SELECT * FROM sensor_data';

    if (!filter) {
        filter = 'all'; // Nếu không có bộ lọc, mặc định là 'all'
    }

    if (!value) {
        value = ''; // Nếu không có giá trị, sử dụng chuỗi trống
    }

    if (filter === 'all') {
        query += ` WHERE temperature LIKE '%${value}%' OR humidity LIKE '%${value}%' OR light LIKE '%${value}%' OR created_at LIKE '%${value}%'`;
    } else if (filter === 'temperature' || filter === 'humidity' || filter === 'light' || filter === 'created_at') {
        query += ` WHERE ${filter} LIKE '%${value}%'`;
    }

    if (page !== 'all') {
        query += ' LIMIT ? OFFSET ?';
    }

    const params = (page !== 'all') ? [limit, offset] : []; // Thêm limit và offset vào mảng tham số nếu page không phải là 'all'

    pool.query(query, params, (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).send('Không có data');
            return;
        }
        res.json(results);
    });
}); 

app.post('/data_sensor/addData', (req, res) => {
    // Xử lý logic
    const { temperature, humidity, light } = req.body;
    
    if (!temperature || !humidity || !light) {
        return res.status(400).json({ error: 'Temperature, humidity, and light are required' });
    }

    const query = 'INSERT INTO sensor_data (temperature, humidity, light, created_at) VALUES (?, ?, ?, NOW())';
    pool.query(query, [temperature, humidity, light], (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(201).json({ message: 'Data added successfully' });
    });
});

app.put('/data_sensor/:id', (req, res) => {
    // Xử lý logic
    const { id } = req.params;
    const { temperature, humidity, light } = req.body;

    if (!temperature && !humidity && !light) {
        return res.status(400).json({ error: 'At least one field (temperature, humidity, light) must be provided for update' });
    }

    const updateFields = {};
    if (temperature) updateFields.temperature = temperature;
    if (humidity) updateFields.humidity = humidity;
    if (light) updateFields.light = light;

    const query = 'UPDATE sensor_data SET ? WHERE id = ?';
    pool.query(query, [updateFields, id], (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.status(200).json({ message: 'Data updated successfully' });
    });
});

app.delete('/data_sensor/:id', (req, res) => {
    // Xử lý logic
    const { id } = req.params;

    const query = 'DELETE FROM sensor_data WHERE id = ?';
    pool.query(query, id, (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.status(200).json({ message: 'Data deleted successfully' });
    });
});

app.get('/action_history/all', (req, res) => {
    let page = req.query.page || 'all'; // Mặc định là 'all' nếu không có trang được chỉ định
    let limit = 10; // Số lượng dữ liệu trên mỗi trang
    let offset = 0; // Offset mặc định là 0
    let sortField = req.query.sort || 'id'; // Mặc định sắp xếp theo id nếu không có trường sắp xếp được chỉ định
    let query = 'SELECT * FROM device_actions';
  
    if (page !== 'all') {
        offset = (parseInt(page) - 1) * limit;
    }
    // Thêm điều kiện sắp xếp theo Device
    if (sortField === 'Device') {
      query += ' ORDER BY CASE WHEN Device = "LED" THEN 1 ELSE 2 END, id'; // Mặc định sắp xếp theo LED trước và FAN sau
    }
  
    // Thêm điều kiện sắp xếp theo Action
    if (sortField === 'Action') {
      query += ' ORDER BY CASE WHEN Action = "off" THEN 1 ELSE 2 END, id'; // Mặc định sắp xếp 'on' trước và 'off' sau
    }

    // Thêm điều kiện sắp xếp theo created_at
    if (sortField === 'created_at') {
      query += ' ORDER BY created_at, id'; // Mặc định sắp xếp theo created_at nếu không có lựa chọn được chỉ định
    }
  
    // Thêm điều kiện phân trang nếu page không phải là 'all'
    if (page !== 'all') {
      query += ' LIMIT ? OFFSET ?';
    }
  
    // Thực thi truy vấn
    pool.query(query, (page !== 'all') ? [limit, offset] : [], (error, results, fields) => {
      if (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      if (results.length === 0) {
        res.status(404).send('No data found');
        return;
      }
      res.json(results);
    });
});
  
app.get('/action_history/search', (req, res) => {
    let page = req.query.page || 'all'; // Lấy trang từ tham số truy vấn, mặc định là 'all'
    const limit = 10; // Số lượng dữ liệu trên mỗi trang
    const offset = (page === 'all') ? 0 : ((parseInt(page) - 1) * limit); // Tính offset dựa trên trang và limit
    let filter = req.query.filter;
    let value = req.query.value;

    let query = 'SELECT * FROM device_actions';

    if (!filter || !value) {
        query += '';
    } else if (filter === 'all' ) {
        query += ` WHERE Device LIKE '%${value}%' OR action LIKE '%${value}%' `;
    } else if (filter === 'device' && (value.toLowerCase() === 'led' || value.toLowerCase() === 'fan')) {
        query += ` WHERE Device LIKE '%${value}%'`;
    } else if (filter === 'action' && (value.toLowerCase() === 'on' || value.toLowerCase() === 'off')) {
        query += ` WHERE action LIKE '%${value}%'`;
    }

    if (page !== 'all') {
        query += ' LIMIT ? OFFSET ?';
    }

    const params = (page !== 'all') ? [limit, offset] : []; // Thêm limit và offset vào mảng tham số nếu page không phải là 'all'

    pool.query(query, params, (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).send('Không có data');
            return;
        }
        res.json(results);
    });
});
app.post('/action_history/addData', (req, res) => {
    // Xử lý logic
    const { Device, action } = req.body;
    
    if (!Device || !action) {
        return res.status(400).json({ error: 'Device and action are required' });
    }

    const query = 'INSERT INTO device_actions (Device, action, created_at) VALUES (?, ?, NOW())';
    pool.query(query, [Device, action], (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(201).json({ message: 'Data added successfully' });
    });
});
app.put('/action_history/:id', (req, res) => {
    const { id } = req.params;
    const { device, action } = req.body;

    if (!device && !action) {
        return res.status(400).json({ error: 'At least one field (device, action) must be provided for update' });
    }

    const updateFields = {};
    if (device) updateFields.device = device;
    if (action) updateFields.action = action;

    const query = 'UPDATE device_actions SET ? WHERE id = ?';
    pool.query(query, [updateFields, id], (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.status(200).json({ message: 'Data updated successfully' });
    });
});

app.delete('/action_history/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM device_actions WHERE id = ?';
    pool.query(query, id, (error, results, fields) => {
        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Data not found' });
        }

        res.status(200).json({ message: 'Data deleted successfully' });
    });
});
// Khởi động máy chủ
app.listen(2002, () => {
    console.log(`Server đang chạy trên cổng 2002`);
});
