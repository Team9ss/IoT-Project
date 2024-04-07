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
  } else {
    lightButton.innerHTML = 'OFF';
    lightButton.classList.add('off');
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
  } else {
    fanButton.innerHTML = 'OFF';
    fanButton.classList.add('off');
  }
}

function updateFan() {
  var imagePath = isOn ? 'img/fanon.gif' : 'img/fanoff.gif';
  fan.src = imagePath;
}



// Chart
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
        },
      ],
    },
    options: {
      onClick: function (event, elements) {
        if (elements.length > 0) {
          const datasetIndex = elements[0].datasetIndex;
          const meta = chart.getDatasetMeta(datasetIndex);
  
          meta.hidden = !meta.hidden;
  
          chart.update();
        }
      },
  
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
      },
  
      onHover(event) {
        event.target.style.cursor = "default";
      },
    },
  });


  function updateTemperatureColor(temp) {
    const informationTempBox = document.getElementById('temperatureValue');
    const informationTempColor = document.getElementById('temperatureColor');

    if (temp > 80) {
      informationTempColor.style.background = 'red';
    } else if (temp > 60) {
      informationTempColor.style.background = 'rgb(230, 49, 49)';
    } else if (temp > 40) {
      informationTempColor.style.background = 'rgb(237, 90, 90)';
    } else if (temp > 20) {
      informationTempColor.style.background = 'lightcoral';
    } else {
      informationTempColor.style.background = 'lightblue';
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
  
    if (light > 80) {
      informationLightColor.style.background = 'rgb(228, 228, 0)';
    } else if (light > 60) {
      informationLightColor.style.background = 'rgb(220, 220, 73)';
    } else if (light > 40) {
      informationLightColor.style.background = 'rgb(195, 195, 132)';
    } else if (light > 20) {
      informationLightColor.style.background = 'rgb(112, 112, 102)';
    } else {
      informationLightColor.style.background = 'rgb(57, 57, 57)';
    }
  
    // Update the content of the light box
    informationLightBox.innerText = light + " LUX";
  }
  

// Upd Chart
function updateChart() {
    const temp = Math.floor(Math.random() * 101);
    const humid = Math.floor(Math.random() * 101);
    const light = Math.floor(Math.random() * 101);

    if (chart.data.labels.length > 10) {
        chart.data.datasets.forEach(dataset => {
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

}

setInterval(updateChart, 1000);
