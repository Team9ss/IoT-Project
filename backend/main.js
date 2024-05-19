const express = require('express');
const cors = require('cors');
const app = express();
const req = require('express/lib/request');
const { mqttClient } = require("./mqtt");
const { pool } = require("./mqtt");
app.use(express.json());
app.use(cors());


app.get("/dash_board/check_device_status", (req, res) => {
    // Truy vấn trạng thái của FAN
    pool.query(
        "SELECT * FROM device_actions WHERE Device = 'FAN' ORDER BY created_at DESC LIMIT 1",
        (error, fanResults) => {
            if (error) {
                console.error("Error querying database:", error);
                res.status(500).json({ error: "Internal Server Error" });
                return;
            }

            // Truy vấn trạng thái của LED
            pool.query(
                "SELECT * FROM device_actions WHERE Device = 'LED' ORDER BY created_at DESC LIMIT 1",
                (error, ledResults) => {
                    if (error) {
                        console.error("Error querying database:", error);
                        res.status(500).json({ error: "Internal Server Error" });
                        return;
                    }

                    const response = {};

                    if (fanResults.length > 0) {
                        response.FAN = fanResults[0];
                    }
                    if (ledResults.length > 0) {
                        response.LED = ledResults[0];
                    }

                    if (Object.keys(response).length === 0) {
                        res.status(404).send("No data found");
                    } else {
                        res.json(response);
                    }
                }
            );
        }
    );
});



app.post("/dash_board/led_control/:action", (req, res) => {
    const action = req.params.action;
    mqttClient.publish("led", action);
    res.status(200).json("LED: " + action);
});


app.post("/dash_board/fan_control/:action", (req, res) => {
    const action = req.params.action;
    mqttClient.publish("fan", action);
    res.status(200).json("FAN: " + action);
});

app.post("/dash_board/both_control/:action", (req, res) => {
    const action = req.params.action;
    mqttClient.publish("fan", action);
    res.status(200).json("FAN: " + action);
});

app.get('/dashboard/all', (req, res) => {
    const query = 'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT 1';

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




app.get("/action_history", (req, res) => {
    // Phân tích các tham số truy vấn cho phân trang, sắp xếp và tìm kiếm
    const perPage = parseInt(req.query.pageSize) || 10;  // Số lượng bản ghi mỗi trang, mặc định là 10
    const page = parseInt(req.query.page) || 1;          // Số trang hiện tại, mặc định là 1
    const sortField = req.query.sortField || "id";       // Trường để sắp xếp, mặc định là "id"
    const sortBy = req.query.sortBy || "ASC";            // Thứ tự sắp xếp, mặc định là tăng dần
    const keyword = req.query.keyword || "";             // Từ khóa để tìm kiếm, mặc định là rỗng
    const searchField = req.query.searchField || "all";  // Trường để tìm kiếm, mặc định là "all" (tất cả)

    // Khởi tạo điều kiện tìm kiếm và giá trị cho truy vấn SQL
    let searchCondition = "";
    let searchValues = [];

    // Nếu tìm kiếm một trường cụ thể và có từ khóa
    if (searchField !== "all" && keyword.trim() !== "") {
        searchCondition = ` WHERE ${searchField} LIKE ?`;  // Đặt điều kiện tìm kiếm cho trường cụ thể
        searchValues = [`%${keyword.trim()}%`];            // Đặt giá trị tìm kiếm với ký tự đại diện cho khớp một phần
    } else if (searchField === "all" && keyword.trim() !== "") {
        // Nếu tìm kiếm trên tất cả các trường
        const columns = ["id", "Device", "action", "created_at"];  // Danh sách các cột để tìm kiếm
        const conditions = columns.map((column) => `${column} LIKE ?`).join(" OR ");  // Tạo điều kiện tìm kiếm cho tất cả các cột
        searchCondition = ` WHERE ${conditions}`;  // Đặt điều kiện tìm kiếm cho tất cả các cột
        searchValues = columns.map(() => `%${keyword.trim()}%`);  // Đặt giá trị tìm kiếm cho tất cả các cột
    }

    // Truy vấn SQL để đếm tổng số bản ghi khớp với điều kiện tìm kiếm
    const sql = `SELECT COUNT(*) AS total FROM device_actions ${searchCondition}`;
    pool.query(sql, searchValues, (err, result) => {
        if (err) {
            console.error("Error counting total record", err);  
            res.status(500).send("Internal Server Error");     
            return;
        }

        const totalRecords = result[0].total;                   // Lấy tổng số bản ghi
        const totalPages = Math.ceil(totalRecords / perPage);   // Tính tổng số trang

        const offset = (page - 1) * perPage;  // Tính toán offset cho phân trang

        // Truy vấn SQL để lấy dữ liệu thực tế với điều kiện tìm kiếm, sắp xếp và phân trang
        let dataSql = `SELECT * FROM device_actions ${searchCondition} ORDER BY ${sortField} ${sortBy} LIMIT ?, ?`;
        let dataValues = [...searchValues, offset, perPage];  // Thêm offset và limit vào giá trị truy vấn

        pool.query(dataSql, dataValues, (err, result) => {
            if (err) {
                console.error("Error retrieving device action:", err); 
                res.status(500).send("Internal Server Error");     
                return;
            }

            // Gửi dữ liệu lấy được và thông tin phân trang trong phản hồi
            res.json({
                data: result,  // Dữ liệu lấy được
                pagination: {
                    currentPage: page,         // Số trang hiện tại
                    totalPages: totalPages,    // Tổng số trang
                    hasNextPage: page < totalPages,  // Có trang tiếp theo không
                    hasPrevPage: page > 1,          // Có trang trước đó không
                },
            });
        });
    });
});


app.get("/data_sensor", (req, res) => {
    // Phân tích các tham số truy vấn cho phân trang, sắp xếp và tìm kiếm
    const perPage = parseInt(req.query.pageSize) || 10;  // Số lượng bản ghi mỗi trang, mặc định là 10
    const page = parseInt(req.query.page) || 1;          // Số trang hiện tại, mặc định là 1
    const sortField = req.query.sortField || "id";       // Trường để sắp xếp, mặc định là "id"
    const sortBy = req.query.sortBy || "ASC";            // Thứ tự sắp xếp, mặc định là tăng dần
    const keyword = req.query.keyword || "";             // Từ khóa để tìm kiếm, mặc định là rỗng
    const searchField = req.query.searchField || "all";  // Trường để tìm kiếm, mặc định là "all" (tất cả)

    // Khởi tạo điều kiện tìm kiếm và giá trị cho truy vấn SQL
    let searchCondition = "";
    let searchValues = [];

    // Nếu tìm kiếm một trường cụ thể và có từ khóa
    if (searchField !== "all" && keyword.trim() !== "") {
        searchCondition = ` WHERE ${searchField} LIKE ?`;  // Đặt điều kiện tìm kiếm cho trường cụ thể
        searchValues = [`%${keyword.trim()}%`];            // Đặt giá trị tìm kiếm với ký tự đại diện cho khớp một phần
    } else if (searchField === "all" && keyword.trim() !== "") {
        // Nếu tìm kiếm trên tất cả các trường
        const columns = ["id", "temperature", "humidity", "light", "created_at"];  // Danh sách các cột để tìm kiếm
        const conditions = columns.map((column) => `${column} LIKE ?`).join(" OR ");  // Tạo điều kiện tìm kiếm cho tất cả các cột
        searchCondition = ` WHERE ${conditions}`;  // Đặt điều kiện tìm kiếm cho tất cả các cột
        searchValues = columns.map(() => `%${keyword.trim()}%`);  // Đặt giá trị tìm kiếm cho tất cả các cột
    }

    // Truy vấn SQL để đếm tổng số bản ghi khớp với điều kiện tìm kiếm
    const sql = `SELECT COUNT(*) AS total FROM sensor_data ${searchCondition}`;
    pool.query(sql, searchValues, (err, result) => {
        if (err) {
            console.error("Error counting total record", err); 
            res.status(500).send("Internal Server Error"); 
            return;
        }

        const totalRecords = result[0].total;                   // Lấy tổng số bản ghi
        const totalPages = Math.ceil(totalRecords / perPage);   // Tính tổng số trang

        const offset = (page - 1) * perPage;  // Tính toán offset cho phân trang

        // Truy vấn SQL để lấy dữ liệu thực tế với điều kiện tìm kiếm, sắp xếp và phân trang
        let dataSql = `SELECT * FROM sensor_data ${searchCondition} ORDER BY ${sortField} ${sortBy} LIMIT ?, ?`;
        let dataValues = [...searchValues, offset, perPage];  // Thêm offset và limit vào giá trị truy vấn

        pool.query(dataSql, dataValues, (err, result) => {
            if (err) {
                console.error("Error retrieving sensor data", err);
                res.status(500).send("Internal Server Error");    
                return;
            }

            // Gửi dữ liệu lấy được và thông tin phân trang trong phản hồi
            res.json({
                data: result,  // Dữ liệu lấy được
                pagination: {
                    currentPage: page,         // Số trang hiện tại
                    totalPages: totalPages,    // Tổng số trang
                    hasNextPage: page < totalPages,  // Có trang tiếp theo không
                    hasPrevPage: page > 1,          // Có trang trước đó không
                },
            });
        });
    });
});


// Khởi động máy chủ
app.listen(2002, () => {
    console.log(`Server đang chạy trên cổng 2002`);
});
