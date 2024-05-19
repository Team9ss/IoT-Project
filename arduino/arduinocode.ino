#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include "ArduinoJson.h"
#define LED D0
#define FAN D6                                                                                                                       
#define dhttype DHT11
#define dhtpin D4
#define ldrpin  A0
// WiFi
const char *ssid = "yourwifi";       // Enter your WiFi name
const char *password = "yourpass";  // Enter WiFi password
int ldrValue; 
// MQTT Broker
const char *mqtt_broker = "192.168.100.14";
const char *topicSensor = "sensor";
const char *topicled = "led";
const char *topicfan = "fan";
const char* notification = "thongbao";
const char* topicboth = "both";
const char *mqtt_username = "mqtt";
const char *mqtt_password = "123";
const int mqtt_port = 1883;

bool ledState = false;
bool fanState = false;

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(dhtpin, dhttype);

void setup() {
  // Set software serial baud to 115200;
  dht.begin();
  Serial.begin(115200);
  delay(1000);  // Delay for stability

  // Connecting to a WiFi network
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to the WiFi network");

  // Setting LED pin as output
  pinMode(LED, OUTPUT);
  pinMode(FAN, OUTPUT);
  pinMode(ldrpin,INPUT);
  digitalWrite(LED, LOW);  // Turn off the LED initially
  digitalWrite(FAN, LOW); 

  // Connecting to an MQTT broker
  client.setServer(mqtt_broker, mqtt_port);
  client.setCallback(callback);
  while (!client.connected()) {
    String client_id = "esp8266-client-";
    client_id += String(WiFi.macAddress());
    Serial.printf("The client %s connects to the public MQTT broker\n", client_id.c_str());
    if (client.connect(client_id.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("Public EMQX MQTT broker connected");
    } else {
      Serial.print("Failed with state ");
      Serial.print(client.state());
      delay(2000);
    }
  }

  // Publish and subscribe

  client.subscribe(topicled);
  client.subscribe(topicfan);
  client.subscribe(topicboth);
}
void callback(char *topic, byte *payload, unsigned int length) {
  // In ra Serial thông báo về việc có tin nhắn mới đến trong một chủ đề cụ thể
  Serial.print("Message arrived in topic: ");
  Serial.println(topic);
  // In ra Serial nội dung của tin nhắn
  Serial.print("Message: ");
  // Tạo một chuỗi String để lưu trữ nội dung của tin nhắn từ dạng byte
  String message;
  // Lặp qua từng byte trong payload để chuyển đổi từ dạng byte sang chuỗi String
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];  // Chuyển đổi *byte thành chuỗi
  }
  
  Serial.print(message);
  if (strcmp(topic, topicled) == 0) {
    if (message == "on" && !ledState) {
      digitalWrite(LED, HIGH);  // Turn on the LED
      ledState = true;
      
      ldrValue = analogRead(ldrpin); 
      
    }
    if (message == "off" && ledState) {
      digitalWrite(LED, LOW);  // Turn off the LED
      ledState = false;
       
    }

    // Tạo đối tượng JSON chứa trạng thái của LED và FAN
DynamicJsonDocument ledFanDoc(256);
    ledFanDoc["LED"] = ledState ? "on" : "off";
    ledFanDoc["FAN"] = fanState ? "on" : "off";

    // Serialize đối tượng JSON thành chuỗi JSON
    String ledFanPayload;
    serializeJson(ledFanDoc, ledFanPayload);

    // Gửi chuỗi JSON
    client.publish(notification, ledFanPayload.c_str());
}

if (strcmp(topic, topicfan) == 0) {
    if (message == "on" && !fanState) {
      digitalWrite(FAN, HIGH);  // Turn on the FAN
      fanState = true;
      
    }
    if (message == "off" && fanState) {
      digitalWrite(FAN, LOW);  // Turn off the FAN
      fanState = false;
      
    }

    // Tạo đối tượng JSON chứa trạng thái của LED và FAN
    DynamicJsonDocument ledFanDoc(256);
    ledFanDoc["LED"] = ledState ? "on" : "off";
    ledFanDoc["FAN"] = fanState ? "on" : "off";

    // Serialize đối tượng JSON thành chuỗi JSON
    String ledFanPayload;
    serializeJson(ledFanDoc, ledFanPayload);

    // Gửi chuỗi JSON
    client.publish(notification, ledFanPayload.c_str());
}

if (strcmp(topic, topicboth) == 0) {
    if (message == "on") {
        digitalWrite(LED, HIGH);
        digitalWrite(FAN, HIGH);
        ledState = true;
        fanState = true;
        
        // Tạo một đối tượng JSON
        DynamicJsonDocument doc(256);
        doc["LED"] = "on";
        doc["FAN"] = "on";

        // Serialize đối tượng JSON thành một chuỗi JSON
        String payload;
        serializeJson(doc, payload);

        // Gửi chuỗi JSON
        client.publish(notification, payload.c_str());

    } else if (message == "off") {
        digitalWrite(LED, LOW);
        digitalWrite(FAN, LOW);
        ledState = false;
        fanState = false;

        // Tạo một đối tượng JSON
        DynamicJsonDocument doc(256);
        doc["LED"] = "off";
        doc["FAN"] = "off";

        // Serialize đối tượng JSON thành một chuỗi JSON
        String payload;
        serializeJson(doc, payload);

        // Gửi chuỗi JSON
        client.publish(notification, payload.c_str());
    }
}

  Serial.println();
  Serial.println("-----------------------");
}

void publishSensorData() {
    // Đọc dữ liệu từ cảm biến nhiệt độ và độ ẩm
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    // Đọc giá trị cường độ ánh sáng từ cảm biến LDR
    int ldrValue = analogRead(ldrpin);

    // Kiểm tra xem dữ liệu đọc được có hợp lệ không (không phải là NaN)
    if (!isnan(temp) && !isnan(hum)) {
        // Tạo một tài liệu JSON động với dung lượng 256 bytes
        DynamicJsonDocument doc(256);

        // Thêm dữ liệu nhiệt độ, độ ẩm và ánh sáng vào tài liệu JSON
        doc["temperature"] = temp;
        doc["humidity"] = hum;
        doc["light"] = ldrValue;

        // Chuyển tài liệu JSON thành chuỗi (payload)
        String payload;
        serializeJson(doc, payload);

        // Xuất thông tin lên Serial Monitor về việc xuất bản dữ liệu MQTT
        uint16_t packetId = client.publish(topicSensor, payload.c_str(), true);
        Serial.printf("Publishing on topic %s at QoS 1, packetId: %i", topicSensor, packetId);
        Serial.printf("Message: %s\n", payload.c_str());
    } else {
        // Xuất thông báo lỗi nếu việc đọc từ cảm biến DHT thất bại
        Serial.println("Failed to read from DHT sensor!");
    }
}

// Biến lưu giữ thời điểm trước đó khi dữ liệu cảm biến được xuất bản
unsigned long previousMillis = 0;
// Khoảng thời gian giữa các lần xuất bản dữ liệu cảm biến (3000 milliseconds = 3 giây)
const long interval = 3000;

void loop() {
  // Cho phép MQTT client xử lý các tin nhắn đến
  client.loop();
  // Tạo một đợt delay ngắn để tránh việc lặp quá nhanh
  delay(100);
  // Lấy thời điểm hiện tại tính bằng mili giây
  unsigned long currentMillis = millis();
  
  // Kiểm tra xem đã đến lúc xuất bản dữ liệu cảm biến dựa trên khoảng thời gian interval đã định
  if (currentMillis - previousMillis >= interval) {
    // Cập nhật biến previousMillis với thời điểm hiện tại
    previousMillis = currentMillis;
    // Gọi hàm để xuất bản dữ liệu cảm biến
    publishSensorData();
  }
}
