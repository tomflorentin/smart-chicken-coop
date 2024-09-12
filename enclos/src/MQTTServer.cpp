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
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.println("Connecting to WiFi..");
    } Serial.println("Connected to the Wi-Fi network");
    //connexion au broker MQTT
    client.setServer("192.168.1.111", 1883);
    client.setCallback([this](char* topic, byte* payload, unsigned int length) {
        this->handleCallback(topic, payload, length);
    });
    while (!client.connected()) {
        String client_id = "esp32-client-";
        client_id += String(WiFi.macAddress());
        Serial.printf("The client %s connects to the public MQTT broker", client_id.c_str());
        if (client.connect(client_id.c_str())) {
            Serial.println("Public EMQX MQTT broker connected");
        } else {
            Serial.print("failed with state ");
            Serial.print(client.state());
            delay(2000);
        }
    }
    for (int i = 0; topics[i] != nullptr; i++) {
        client.subscribe(topics[i]);
    }
    Log("MQTT server setup done");
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
    client.loop();
}

Order MQTTServer::getAction() {
    Order order = lastOrder;
    lastOrder = Order::NONE;
    return order;
}
