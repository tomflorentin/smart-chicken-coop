//
// Created by tomfl on 9/4/2024.
//

#include <WiFi.h>
#include "MQTTServer.h"
#include "credentials.h"
#include "func.h"

void MQTTServer::setup() {
    this->safeConnection.addTopic("enclos/ping");
    this->safeConnection.addTopic("enclos/fence/order");
    this->safeConnection.addTopic("enclos/alert/order");
    this->safeConnection.setCallback([this](char* topic, byte* payload, unsigned int length) {
        this->handleCallback(topic, payload, length);
    });
    this->safeConnection.setup();
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
    this->safeConnection.publish(topic, message);
}

void MQTTServer::work() {
    this->safeConnection.work();
}

Order MQTTServer::getAction() {
    Order order = lastOrder;
    lastOrder = Order::NONE;
    return order;
}

