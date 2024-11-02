//
// Created by tomfl on 10/21/2024.
//

#include "TemperatureMonitor.h"
#include "func.h"

#define CONSTANTS_SEND_INTERVAL 1000 * 60 * 2

TemperatureMonitor::TemperatureMonitor(MQTTServer &_server, uint8_t pin) : server(_server), dht(pin) {
}

void TemperatureMonitor::setup() {
    Log("Temperature monitor setup");
    dht.begin();
}

void TemperatureMonitor::work() {
    unsigned long now = millis();
    if (now - lastSend > CONSTANTS_SEND_INTERVAL) {
        lastSend = now;
        float temperature = dht.readTemperature();
        float humidity = dht.readHumidity();
        Log("Temperature : " + String(temperature) + " Humidity : " + String(humidity));
        server.publish("poulailler/temperature", String(temperature).c_str());
        server.publish("poulailler/humidity", String(humidity).c_str());
    }
}
