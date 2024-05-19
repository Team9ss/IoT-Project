// add hovered class to selected list item
let list = document.querySelectorAll(".navigation li");

function activeLink() {
  list.forEach((item) => {
    item.classList.remove("hovered");
  });
  this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

// Menu Toggle
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

toggle.onclick = function () {
  navigation.classList.toggle("active");
  main.classList.toggle("active");
};

// On Off light bulb
var lightButton = document.getElementById('lightButton');
var lightBulb = document.getElementById('lightBulb');
var isOn = true;

lightButton.addEventListener('click', function() {
  isOn = !isOn; // Chuyển đổi giữa trạng thái ON và OFF
  updateLightButtonState();
  updateLightBulb();
});

function updateLightButtonState() {
  if (isOn) {
    lightButton.innerHTML = 'ON';
    lightButton.classList.remove('off');
    pub_led("on");
  } else {
    lightButton.innerHTML = 'OFF';
    lightButton.classList.add('off');
    pub_led("off");
  }
}

function updateLightBulb() {
  var imagePath = isOn ? 'img/lighton.png' : 'img/lightoff.png';
  lightBulb.src = imagePath;
}


// On Off Fan
var fanButton = document.getElementById('fanButton');
var fan = document.getElementById('fan');
var isOn = true;

fanButton.addEventListener('click', function() {
  isOn = !isOn;
  updateFanButtonState();
  updateFan();
});

function updateFanButtonState() {
  if (isOn) {
    fanButton.innerHTML = 'ON';
    fanButton.classList.remove('off');
    pub_fan("on");
  } else {
    fanButton.innerHTML = 'OFF';
    fanButton.classList.add('off');
    pub_fan("off");
  }
}

function updateFan() {
  var imagePath = isOn ? 'img/fanon.gif' : 'img/fanoff.gif';
  fan.src = imagePath;
}



const chart = new Chart("chartInformation", {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperature",
        borderColor: "red",
        backgroundColor: "red",
        lineTension: 0,
        data: [],
        fill: false,
      },
      {
        label: "Humidity",
        borderColor: "blue",
        backgroundColor: "blue",
        lineTension: 0,
        data: [],
        fill: false,
      },
      {
        label: "Light",
        borderColor: "orange",
        backgroundColor: "orange",
        lineTension: 0,
        data: [],
        fill: false,
        yAxisID: "light-y-axis", // Thiết lập ID của trục y cho dataset "Light"
      },
    ],
  },
  options: {
    scales: {
      y: {
        title: {
          display: true,
          text: "Temperature & Humidity",
        },
      },
      "light-y-axis": {
        // Trục mới cho giá trị của light
        position: "right", // Đặt vị trí ở bên phải
        title: {
          display: true,
          text: "Light",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            if (label) {
              return label + ": " + context.parsed.y;
            }
            return null;
          },
        },
      },
    },
    // Các tùy chọn khác của biểu đồ...
  },
});


  function updateTemperatureColor(temp) {
    const informationTempBox = document.getElementById('temperatureValue');
    const informationTempColor = document.getElementById('temperatureColor');

    if (temp > 80) {
      informationTempColor.style.background = 'rgb(159, 0, 0)';
      alert('Cảnh báo: Nhiệt độ trong phòng quá cao!');
    } else if (temp > 60) {
      informationTempColor.style.background = 'red';
    } else if (temp > 40) {
      informationTempColor.style.background = 'rgb(230, 49, 49)';
    } else if (temp > 20) {
      informationTempColor.style.background = 'rgb(237, 90, 90)';
    } else {
      informationTempColor.style.background = 'rgb(236, 136, 136)';
    }
  
    // Update the content of the temperature box
    informationTempBox.innerText = temp + "°C";
  }

// Humid Color
  function updateHumidityColor(humid) {
    const informationHumidBox = document.getElementById('humidityValue');
    const informationHumidColor = document.getElementById('humidityColor');
  
    if (humid > 80) {
      informationHumidColor.style.background = 'rgb(0, 112, 149)';
    } else if (humid > 60) {
      informationHumidColor.style.background = 'rgb(0, 141, 188)';
    } else if (humid > 40) {
      informationHumidColor.style.background = 'rgb(0, 170, 226)';
    } else if (humid > 20) {
      informationHumidColor.style.background = 'rgb(96, 194, 227)';
    } else {
      informationHumidColor.style.background = 'lightblue';
    }
  
    // Update the content of the humidity box
    informationHumidBox.innerText = humid + "%";
  }


  function updateLightColor(light) {
    const informationLightBox = document.getElementById('lightValue');
    const informationLightColor = document.getElementById('lightColor');
  
    if (light > 800) {
      informationLightColor.style.background = 'rgb(226, 226, 0)';
    } else if (light > 600) {
      informationLightColor.style.background = 'rgb(225, 225, 43)';
    } else if (light > 400) {
      informationLightColor.style.background = 'rgb(225, 225, 101)';
    } else if (light > 200) {
      informationLightColor.style.background = 'rgb(225, 225, 151)';
    } else {
      informationLightColor.style.background = 'rgb(226, 226, 183)';
    }
  
    // Update the content of the light box
    informationLightBox.innerText = light + " LUX";
  }
  


function updateChart() {
  $.ajax({
    url: "http://localhost:2002/dashboard/all",
    type: "GET",
    dataType: "json",
    success: function (data) {
      var latestData = data[0];
      var temp = latestData.temperature;
      var humid = latestData.humidity;
      var light = latestData.light;

      // Thêm dữ liệu vào biểu đồ và cập nhật biểu đồ
      if (chart.data.labels.length > 20) {
        chart.data.datasets.forEach((dataset) => {
          dataset.data.shift();
        });
        chart.data.labels.shift();
      }

      chart.data.datasets[0].data.push(temp);
      chart.data.datasets[1].data.push(humid);
      chart.data.datasets[2].data.push(light);
      chart.data.labels.push(new Date().toLocaleTimeString());

      document.getElementById("temperatureValue").innerText = temp + "°C";
      document.getElementById("humidityValue").innerText = humid + "%";
      document.getElementById("lightValue").innerText = light + " LUX";

      updateTemperatureColor(temp);
      updateHumidityColor(humid);
      updateLightColor(light);
      chart.update();
    },
    error: function (xhr, status, error) {
      if (xhr.status === 404) {
        // Xử lý khi không tìm thấy dữ liệu API
      } else {
        console.error("Error:", error);
      }
    },
  });
}

setInterval(updateChart, 3000);


function checkDeviceStatus() {
  fetch("http://localhost:2002/dash_board/check_device_status")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch device status");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Device status:", data);

      // Cập nhật trạng thái của LED
      if (data.LED.action === "on") {
        lightButton.innerHTML = 'ON';
        lightButton.classList.remove('off');
        pub_led("on");
        document.getElementById("lightBulb").src = "img/lighton.png";
      } else {
        lightButton.innerHTML = 'OFF';
        lightButton.classList.add('off');
        pub_led("off");
        document.getElementById("lightBulb").src = "img/lightoff.png";
      }

      // Cập nhật trạng thái của Fan (tương tự)
      if (data.FAN.action === "on") {
        fanButton.innerHTML = 'ON';
        fanButton.classList.remove('off');
        pub_fan("on");
        
        document.getElementById("fan").src = "img/fanon.gif";
      } else {
        fanButton.innerHTML = 'OFF';
        fanButton.classList.add('off');
        pub_fan("off");
        document.getElementById("fan").src = "img/fanoff.gif";
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
  // Gọi hàm để kiểm tra trạng thái của thiết bị
  checkDeviceStatus();
});


function pub_led(action) {
  fetch(`http://localhost:2002/dash_board/led_control/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: action }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to publish message");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function pub_fan(action) {
  fetch(`http://localhost:2002/dash_board/fan_control/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: action }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to publish message");
      }
      return response.json();
    })
    .then((data) => {
      console.log(data.message);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}