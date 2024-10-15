//
// Created by tomfl on 5/12/2024.
//

#include <WiFi.h>
#include <HTTPClient.h>
#include <sstream>
#include "credentials.h"
#include "func.h"

const char* url = "http://api.pushover.net/1/messages.json";

bool Notify(String const &message) {
    Log("Sending notification " + message);
    if (!WiFi.isConnected()) {
        return false;
    }


    WiFiClient client;
    HTTPClient http;

    http.begin(client, url);

    std::stringstream body;
    body << "{";
    body << "\"token\": \"" << PUSHOVER_TOKEN << "\",";
    body << "\"user\": \"" << PUSHOVER_USER << "\",";
    body << "\"title\": \"Poulailler\",";
    body << "\"message\": \"" << message.c_str() << "\"";
    body << "}";

    // Send HTTP POST request
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(body.str().c_str());

    String payload = "{}";

    if (httpResponseCode>0) {
        Serial.print("HTTP Response code: ");
        Serial.println(httpResponseCode);
        payload = http.getString();
    }
    else {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
    }
    // Free resources
    http.end();

    bool result =  payload.indexOf("\"status\":1") != -1;
    Log(payload);
    Log(String("Notification sent: ") + (result ? "success" : "failure"));
    return result;
}
