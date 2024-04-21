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
    let { page, pageSize } = req.query; // Lấy trang và kích thước trang từ query string
    page = page ? parseInt(page) : 1; // Chuyển đổi trang và kích thước trang sang số nguyên, mặc định là 1 và 10 nếu không có giá trị
    pageSize = pageSize ? parseInt(pageSize) : 10; 
    const offset = (page - 1) * pageSize;  // Tính offset (số lượng bỏ qua dữ liệu)

    // Thiết lập trường và thứ tự sắp xếp mặc định nếu không được chỉ định
    let sortField = req.query.sort || 'id'; 
    let sortOrder = req.query.order || 'ASC'; 

    // Xây dựng truy vấn SQL cơ bản
    let query = 'SELECT * FROM sensor_data';

    // Thêm điều kiện sắp xếp nếu không sắp xếp theo tất cả các trường
    if (sortField !== 'all') {
        query += ` ORDER BY ${sortField} ${sortOrder}`;
    }

    // Thêm điều kiện phân trang nếu page không phải là 'all'
    if (page !== 'all') {
        query += ' LIMIT ? OFFSET ?';
    }

    // Thực thi truy vấn SQL, truyền tham số phân trang nếu có
    pool.query(query, (page !== 'all') ? [pageSize, offset] : [], (error, results, fields) => {
        if (error) {
            // Xử lý lỗi truy vấn
            console.error('Error querying database:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        if (results.length === 0) {
            // Trả về mã trạng thái 404 nếu không có dữ liệu được tìm thấy
            res.status(404).send('Không có data');
            return;
        }
        // Trả về dữ liệu nếu tìm thấy
        res.json(results);
    });
});





app.get('/data_sensor/search', (req, res) => {
    let { page, pageSize } = req.query; // Lấy trang và kích thước trang từ query string
    page = page ? parseInt(page) : 1; // Chuyển đổi trang và kích thước trang sang số nguyên, mặc định là 1 và 10 nếu không có giá trị
    pageSize = pageSize ? parseInt(pageSize) : 10; 
    const offset = (page - 1) * pageSize;  // Tính offset (số lượng bỏ qua dữ liệu)
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

    const params = (page !== 'all') ? [pageSize, offset] : []; // Thêm limit và offset vào mảng tham số nếu page không phải là 'all'

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
        res.json(results); // Trả về kết quả dữ liệu dưới dạng JSON
    });
}); 

// Xử lý route POST '/data_sensor/addData'
app.post('/data_sensor/addData', (req, res) => {
    // Lấy dữ liệu từ request body gửi từ client
    const { temperature, humidity, light } = req.body;
    
    // Kiểm tra xem các trường temperature, humidity, light có tồn tại không
    if (!temperature || !humidity || !light) {
        // Nếu không tồn tại, trả về lỗi và mã trạng thái 400 (Bad Request)
        return res.status(400).json({ error: 'Temperature, humidity, and light are required' });
    }

    // Tạo câu truy vấn SQL để chèn dữ liệu vào bảng sensor_data với các tham số thay thế (?)
    const query = 'INSERT INTO sensor_data (temperature, humidity, light, created_at) VALUES (?, ?, ?, NOW())';

    // Thực thi câu truy vấn SQL với các giá trị thay thế được cung cấp
    pool.query(query, [temperature, humidity, light], (error, results, fields) => {
        // Kiểm tra xem có lỗi trong quá trình thực thi câu truy vấn không
        if (error) {
            // Nếu có lỗi, hiển thị thông báo lỗi và trả về mã trạng thái 500 (Internal Server Error)
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        // Nếu không có lỗi, trả về mã trạng thái 201 (Created) và thông báo thành công
        res.status(201).json({ message: 'Data added successfully' });
    });
});


// Xử lý route PUT '/data_sensor/:id'
app.put('/data_sensor/:id', (req, res) => {
    // Lấy ID từ đường dẫn của request
    const { id } = req.params;
    // Lấy dữ liệu cập nhật từ request body
    const { temperature, humidity, light } = req.body;

    // Kiểm tra xem ít nhất một trường (temperature, humidity, light) có được cung cấp không
    if (!temperature && !humidity && !light) {
        // Nếu không có trường nào được cung cấp, trả về lỗi và mã trạng thái 400 (Bad Request)
        return res.status(400).json({ error: 'At least one field (temperature, humidity, light) must be provided for update' });
    }

    // Tạo một đối tượng chứa các trường cần cập nhật
    const updateFields = {};
    if (temperature) updateFields.temperature = temperature;
    if (humidity) updateFields.humidity = humidity;
    if (light) updateFields.light = light;

    // Tạo câu truy vấn SQL để cập nhật dữ liệu trong bảng sensor_data với các trường được cung cấp
    const query = 'UPDATE sensor_data SET ? WHERE id = ?';

    // Thực thi câu truy vấn SQL với các giá trị thay thế được cung cấp
    pool.query(query, [updateFields, id], (error, results, fields) => {
        // Kiểm tra xem có lỗi trong quá trình thực thi câu truy vấn không
        if (error) {
            // Nếu có lỗi, hiển thị thông báo lỗi và trả về mã trạng thái 500 (Internal Server Error)
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Kiểm tra xem có dữ liệu nào được cập nhật không
        if (results.affectedRows === 0) {
            // Nếu không có dữ liệu nào được cập nhật, trả về lỗi và mã trạng thái 404 (Not Found)
            return res.status(404).json({ error: 'Data not found' });
        }

        // Nếu dữ liệu được cập nhật thành công, trả về mã trạng thái 200 (OK) và thông báo thành công
        res.status(200).json({ message: 'Data updated successfully' });
    });
});



app.delete('/data_sensor/:id', (req, res) => {
    // Lấy ID từ đường dẫn của request
    const { id } = req.params;

    // Tạo câu truy vấn SQL để xóa dữ liệu trong bảng sensor_data dựa trên ID
    const query = 'DELETE FROM sensor_data WHERE id = ?';

    // Thực thi câu truy vấn SQL với giá trị thay thế là ID của dữ liệu cần xóa
    pool.query(query, id, (error, results, fields) => {
        // Kiểm tra xem có lỗi trong quá trình thực thi câu truy vấn không
        if (error) {
            // Nếu có lỗi, hiển thị thông báo lỗi và trả về mã trạng thái 500 (Internal Server Error)
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Kiểm tra xem có dữ liệu nào bị ảnh hưởng (đã bị xóa) không
        if (results.affectedRows === 0) {
            // Nếu không có dữ liệu nào bị ảnh hưởng, trả về lỗi và mã trạng thái 404 (Not Found)
            return res.status(404).json({ error: 'Data not found' });
        }

        // Nếu dữ liệu được xóa thành công, trả về mã trạng thái 200 (OK) và thông báo thành công
        res.status(200).json({ message: 'Data deleted successfully' });
    });
});


app.get('/action_history/all', (req, res) => {
    let { page, pageSize } = req.query; // Lấy trang và kích thước trang từ query string
    page = page ? parseInt(page) : 1; // Chuyển đổi trang và kích thước trang sang số nguyên, mặc định là 1 và 10 nếu không có giá trị
    pageSize = pageSize ? parseInt(pageSize) : 10; 
    const offset = (page - 1) * pageSize;  // Tính offset (số lượng bỏ qua dữ liệu)
    let sortField = req.query.sort || 'id'; // Mặc định sắp xếp theo id nếu không có trường sắp xếp được chỉ định
    let query = 'SELECT * FROM device_actions';

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
    pool.query(query, (page !== 'all') ? [pageSize, offset] : [], (error, results, fields) => {
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
    let { page, pageSize } = req.query; // Lấy trang và kích thước trang từ query string
    page = page ? parseInt(page) : 1; // Chuyển đổi trang và kích thước trang sang số nguyên, mặc định là 1 và 10 nếu không có giá trị
    pageSize = pageSize ? parseInt(pageSize) : 10; 
    const offset = (page - 1) * pageSize;  // Tính offset (số lượng bỏ qua dữ liệu)
    let filter = req.query.filter;
    let value = req.query.value;

    let query = 'SELECT * FROM device_actions';

    // Kiểm tra các điều kiện filter và value để thêm vào câu truy vấn SQL
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

    const params = (page !== 'all') ? [pageSize, offset] : []; // Thêm limit và offset vào mảng tham số nếu page không phải là 'all'

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
    // Lấy dữ liệu từ request body gửi từ client
    const { Device, action } = req.body;
    
    // Kiểm tra xem trường Device và action có tồn tại không
    if (!Device || !action) {
        // Nếu không tồn tại, trả về lỗi và mã trạng thái 400 (Bad Request)
        return res.status(400).json({ error: 'Device and action are required' });
    }

    // Tạo câu truy vấn SQL để chèn dữ liệu vào bảng device_actions với các tham số thay thế (?)
    const query = 'INSERT INTO device_actions (Device, action, created_at) VALUES (?, ?, NOW())';

    // Thực thi câu truy vấn SQL với các giá trị thay thế được cung cấp
    pool.query(query, [Device, action], (error, results, fields) => {
        // Kiểm tra xem có lỗi trong quá trình thực thi câu truy vấn không
        if (error) {
            // Nếu có lỗi, hiển thị thông báo lỗi và trả về mã trạng thái 500 (Internal Server Error)
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        // Nếu không có lỗi, trả về mã trạng thái 201 (Created) và thông báo thành công
        res.status(201).json({ message: 'Data added successfully' });
    });
});


app.put('/action_history/:id', (req, res) => {
    // Lấy ID từ đường dẫn của request
    const { id } = req.params;
    // Lấy dữ liệu cập nhật từ request body
    const { device, action } = req.body;

    // Kiểm tra xem ít nhất một trường (device, action) đã được cung cấp để cập nhật không
    if (!device && !action) {
        // Nếu không có trường nào được cung cấp, trả về lỗi và mã trạng thái 400 (Bad Request)
        return res.status(400).json({ error: 'At least one field (device, action) must be provided for update' });
    }

    // Tạo một đối tượng chứa các trường cần cập nhật
    const updateFields = {};
    if (device) updateFields.device = device;
    if (action) updateFields.action = action;

    // Tạo câu truy vấn SQL để cập nhật dữ liệu trong bảng device_actions với các trường được cung cấp
    const query = 'UPDATE device_actions SET ? WHERE id = ?';

    // Thực thi câu truy vấn SQL với các giá trị thay thế là đối tượng updateFields và ID của dữ liệu cần cập nhật
    pool.query(query, [updateFields, id], (error, results, fields) => {
        // Kiểm tra xem có lỗi trong quá trình thực thi câu truy vấn không
        if (error) {
            // Nếu có lỗi, hiển thị thông báo lỗi và trả về mã trạng thái 500 (Internal Server Error)
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Kiểm tra xem có dữ liệu nào bị ảnh hưởng (đã bị cập nhật) không
        if (results.affectedRows === 0) {
            // Nếu không có dữ liệu nào bị ảnh hưởng, trả về lỗi và mã trạng thái 404 (Not Found)
            return res.status(404).json({ error: 'Data not found' });
        }

        // Nếu dữ liệu được cập nhật thành công, trả về mã trạng thái 200 (OK) và thông báo thành công
        res.status(200).json({ message: 'Data updated successfully' });
    });
});



app.delete('/action_history/:id', (req, res) => {
    // Lấy ID từ đường dẫn của request
    const { id } = req.params;

    // Tạo câu truy vấn SQL để xóa dữ liệu trong bảng device_actions dựa trên ID
    const query = 'DELETE FROM device_actions WHERE id = ?';

    // Thực thi câu truy vấn SQL với giá trị thay thế là ID của dữ liệu cần xóa
    pool.query(query, id, (error, results, fields) => {
        // Kiểm tra xem có lỗi trong quá trình thực thi câu truy vấn không
        if (error) {
            // Nếu có lỗi, hiển thị thông báo lỗi và trả về mã trạng thái 500 (Internal Server Error)
            console.error('Error querying database:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Kiểm tra xem có dữ liệu nào bị ảnh hưởng (đã bị xóa) không
        if (results.affectedRows === 0) {
            // Nếu không có dữ liệu nào bị ảnh hưởng, trả về lỗi và mã trạng thái 404 (Not Found)
            return res.status(404).json({ error: 'Data not found' });
        }

        // Nếu dữ liệu được xóa thành công, trả về mã trạng thái 200 (OK) và thông báo thành công
        res.status(200).json({ message: 'Data deleted successfully' });
    });
});



// Khởi động máy chủ
app.listen(2002, () => {
    console.log(`Server đang chạy trên cổng 2002`);
});
