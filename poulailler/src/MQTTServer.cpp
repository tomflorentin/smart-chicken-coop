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
    client.loop();
}

Order MQTTServer::getAction() {
    Order order = lastOrder;
    lastOrder = Order::NONE;
    return order;
}
