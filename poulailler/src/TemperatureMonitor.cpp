//
// Created by tomfl on 10/21/2024.
//

#include "TemperatureMonitor.h"

#define CONSTANTS_SEND_INTERVAL 1000 * 60 * 2

TemperatureMonitor::TemperatureMonitor(MQTTServer &_server, uint8_t pin) : server(_server), dht(pin) {
}

void TemperatureMonitor::setup() {
    dht.begin();
}

void TemperatureMonitor::work() {
    unsigned long now = millis();
    if (now - lastSend > CONSTANTS_SEND_INTERVAL) {
        lastSend = now;
        float temperature = dht.readTemperature();
        float humidity = dht.readHumidity();
        server.publish("poulailler/temperature", String(temperature).c_str());
        server.publish("poulailler/humidity", String(humidity).c_str());
    }
}
