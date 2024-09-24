//
// Created by tomfl on 9/4/2024.
//

#include <WiFi.h>
#include "MQTTServer.h"
#include "credentials.h"
#include "func.h"
#include "typings.h"

#define MQTT_DOMAIN "192.168.1.111"
#define MQTT_PORT 1883

char const * topics[] = {"poulailler/door/order", "poulailler/ping", nullptr};

void MQTTServer::setup() {
    safeConnection.addTopic("poulailler/door/order");
    safeConnection.addTopic("poulailler/ping");
    safeConnection.setCallback([this](char* topic, byte* payload, unsigned int length) {
        this->handleCallback(topic, payload, length);
    });
    safeConnection.setup();
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
    bool res = this->safeConnection.publish(topic, message);
    Log("Publishing to [" + String(topic) + "] : " + message + " : " + (res ? "success" : "failed"));
}

void MQTTServer::work() {
    this->safeConnection.work();
}

Order MQTTServer::getAction() {
    Order order = lastOrder;
    lastOrder = Order::NONE;
    return order;
}

