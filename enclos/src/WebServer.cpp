//
// Created by tomfl on 4/27/2024.
//

#include <sstream>
#include "WebServer.h"
#include "func.h"
#include "credentials.h"


const char* webserver_ssid = WIFI_SSID;
const char* webserver_password = WIFI_PASSWORD;

const char* standard_accepted = "{ \"status\": \"accepted\" }";

WebServer::WebServer(short port) : server(port) {

}

bool WebServer::setup() {
   Log("Connecting to ");
   Log(webserver_ssid);
   WiFi.begin(webserver_ssid, webserver_password);
   while (WiFi.status() != WL_CONNECTED) {
     delay(500);
     Log("Connecting to wifi...");
   }
    Log("IP address: ");
    Log(WiFi.localIP().toString());
    server.begin();
    return true;
}

bool WebServer::isConnected() {
    return WiFi.isConnected();
}

void WebServer::work() {
    WiFiClient client = server.available();
    if (!client) {
        return;
    }
    String request = this->readRequest(client);
    Log(request);
    String response = this->handleRequest(request);
    this->sendResponse(client, response);
}

Order WebServer::getAction() {
    Order _action = this->action;
    this->action = NONE;
    return _action;
}

String WebServer::readRequest(WiFiClient &client) {
    unsigned long const startTime = millis();
    String request = "";
    while (client.connected()) {
        if (millis() - startTime > 1000) {
            return "";
        }
        if (client.available()) {
            char c = client.read();
            request += c;
            if (c == '\n') {
                break;
            }
        }
    }
    return request;
}


String WebServer::handleRequest(const String &request) {
    if (request.indexOf("GET /logs") != -1) {
        return "{ \"status\": \"accepted\", \"logs\": " + getJsonLogs() + " }";
    }
    else if (request.indexOf("GET /action/alert/enable") != -1) {
        this->action = ENABLE_ALERT;
        return standard_accepted;
    }
    else if (request.indexOf("GET /action/alert/disable") != -1) {
        this->action = DISABLE_ALERT;
        return standard_accepted;
    }
    else if (request.indexOf("GET /action/fence/enable") != -1) {
        this->action = ENABLE_ELECTRIC_FENCE;
        return standard_accepted;
    }
    else if (request.indexOf("GET /action/fence/disable") != -1) {
        this->action = DISABLE_ELECTRIC_FENCE;
        return standard_accepted;
    }
    return "{ \"status\": \"unknown command\" }";
}

void WebServer::sendResponse(WiFiClient &client, const String &response) {
    client.flush();
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.println("");
    client.println(response);
    client.println("");
}

void WebServer::reconnect() {
    WiFi.reconnect();
    Serial.print("Reconnecting to wifi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Log("");
    Log("WiFi reconnected.");
}
