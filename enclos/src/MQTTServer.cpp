//
// Created by tomfl on 9/4/2024.
//

#include <WiFi.h>
#include "MQTTServer.h"
#include "credentials.h"
#include "func.h"

const char* mqtt_ssid = WIFI_SSID;
const char* mqtt_password = WIFI_PASSWORD;
char const * topics[] = {"enclos/ping", "enclos/fence/order", "enclos/alert/order", nullptr};

void MQTTServer::setup() {
    WiFi.begin(mqtt_ssid, mqtt_password);
    client.setServer("192.168.1.111", 1883);
    client.setCallback([this](char* topic, byte* payload, unsigned int length) {
        this->handleCallback(topic, payload, length);
    });
    delay(5000);
    this->connect();
}

void MQTTServer::handleCallback(char *topic, byte *payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Log("Message arrived [" + String(topic) + "] : " + message);

    if (!strcmp(topic, "enclos/fence/order")) {
        if (!strcmp(message.c_str(), "enable")) {
            lastOrder = Order::ENABLE_ELECTRIC_FENCE;
        } else if (!strcmp(message.c_str(), "disable")) {
            lastOrder = Order::DISABLE_ELECTRIC_FENCE;
        } else if (!strcmp(message.c_str(), "status")) {
            lastOrder = Order::STATUS_ELECTRIC_FENCE;
        }
        else {
            this->publish("enclos/fence/info", "bad request");
        }
    }
    else if (!strcmp(topic, "enclos/alert/order")) {
        if (!strcmp(message.c_str(), "enable")) {
            lastOrder = Order::ENABLE_ALERT;
        } else if (!strcmp(message.c_str(), "disable")) {
            lastOrder = Order::DISABLE_ALERT;
        } else if (!strcmp(message.c_str(), "status")) {
            lastOrder = Order::STATUS_ALERT;
        } else {
            this->publish("enclos/alert/info", "bad request");
        }
    } else if (!strcmp(topic, "enclos/ping")) {
        this->publish("enclos/pong", "pong");
    } else {
        Log("Unknown topic " + String(topic) + " with message " + message);
    }
}

void MQTTServer::publish(const char *topic, const char *message) {
    client.publish(topic, message);
}

void MQTTServer::work() {
    unsigned long now = millis();
    if (now - this->lastConnectionCheck > 10000) {
        this->lastConnectionCheck = now;
        this->connect();
    }
    client.loop();
}

Order MQTTServer::getAction() {
    Order order = lastOrder;
    lastOrder = Order::NONE;
    return order;
}

bool MQTTServer::connect() {
    if (!WiFi.isConnected()) {
        Log("Cannot connect to WiFi");
        return false;
    } else {
        Log("Connected to WiFi");
        if (!client.connected()) {
            if (client.connect("esp32-client")) {
                for (int i = 0; topics[i] != nullptr; i++) {
                    client.subscribe(topics[i]);
                }
                Log("Connected to MQTT server");
            } else {
                Log("Cannot connect to MQTT server");
                return false;
            }
        }
    }
    return true;
}
