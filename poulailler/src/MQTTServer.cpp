//
// Created by tomfl on 9/4/2024.
//

#include <WiFi.h>
#include "MQTTServer.h"
#include "credentials.h"
#include "func.h"
#include "typings.h"

const char* mqtt_ssid = WIFI_SSID;
const char* mqtt_password = WIFI_PASSWORD;
char const * topics[] = {"poulailler/door/order", "poulailler/ping", nullptr};



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

    if (!strcmp(topic, "poulailler/door/order")) {
        if (!strcmp(message.c_str(), "open")) {
            lastOrder = Order::OPEN_DOOR;
        } else if (!strcmp(message.c_str(), "force_close")) {
            lastOrder = Order::FORCE_CLOSE_DOOR;
        } else if (!strcmp(message.c_str(), "safe_close")) {
            lastOrder = Order::SAFE_CLOSE_DOOR;
        } else if (!strcmp(message.c_str(), "status")) {
            lastOrder = Order::STATUS_DOOR;
        } else {
            this->publish("enclos/fence/info", "bad request");
        }
    } else if (!strcmp(topic, "poulailler/ping")) {
        this->publish("poulailler/pong", "pong");
    } else {
        Log("Unknown topic " + String(topic) + " with message " + message);
    }
}

void MQTTServer::publish(const char *topic, const char *message) {
    bool res = client.publish(topic, message);
    Log("Publishing to [" + String(topic) + "] : " + message + " : " + (res ? "success" : "failed"));
}

void MQTTServer::work() {
    unsigned long now = millis();
    if (now - this->lastConnectionCheck > 10000) {
        this->lastConnectionCheck = now;
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
            if (client.connect("poulailler-esp32")) {
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
