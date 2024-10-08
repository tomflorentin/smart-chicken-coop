
#include "DoorController.h"
#include "func.h"
#include "ManualControl.h"
#include "MQTTServer.h"

MQTTServer server;
DoorController door(server, 27, 26, 33, 25, 14, 36);
ManualControl manualControl(server, 32);

void setup() {
    Serial.begin(9200);
    server.setup();
    door.setup();
    server.publish("poulailler/boot", "booted");
}


void loop() {
    manualControl.work(door.getStatus());
    server.work();
    door.work();
    Order action = manualControl.getAction();
    if (action == Order::NONE)
        action = server.getAction();
    if (action != Order::NONE) {
        Log("Action received");
        door.executeOrder(action);
    }
}
