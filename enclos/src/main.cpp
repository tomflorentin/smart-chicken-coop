#include "func.h"
#include "AlertSystem.h"
#include "ElectricFence.h"
#include "MQTTServer.h"

MQTTServer server;
AlertSystem alertSystem(server, 2, 16, 1, 17);
ElectricFence electricFence(server, 18);

void setup() {
    Serial.begin(9600);
    server.setup();
    alertSystem.setup();
    electricFence.setup();
    server.publish("enclos/boot", "booted");
    alertSystem.enable();
}

void loop() {
    server.work();
    alertSystem.work();
    electricFence.work();

    Order action = server.getAction();
    bool handledAction = true;
    if (action == Order::ENABLE_ALERT)
        alertSystem.enable();
    else if (action == Order::DISABLE_ALERT)
        alertSystem.disable();
    else if (action == Order::ENABLE_ELECTRIC_FENCE)
        electricFence.enable();
    else if (action == Order::DISABLE_ELECTRIC_FENCE)
        electricFence.disable();
    else
        handledAction = false;

    if (handledAction)
        Log("Action received " + String(action));
}
