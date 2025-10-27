#include "func.h"
#include "AlertSystem.h"
#include "ElectricFence.h"
#include "MQTTServer.h"
#include "V2Door.h"

MQTTServer server;
//AlertSystem alertSystem(server, 2, 21, 19);
ElectricFence electricFence(server, 18, 22, 17, 16);
V2Door door(server, 14, 27);

void setup() {
    Serial.begin(9600);
    server.setup();
    electricFence.setup();
    door.setup();
}

void loop() {
    server.work();
    electricFence.work();
    door.work();

    Order action = server.getAction();
    bool handledAction = true;
    if (action == Order::DOOR_OPEN)
        door.open();
    else if (action == Order::DOOR_CLOSE)
        door.close();
    else if (action == Order::ENABLE_ELECTRIC_FENCE)
        electricFence.enable();
    else if (action == Order::DISABLE_ELECTRIC_FENCE)
        electricFence.disable();
    else if (action == Order::STATUS_DOOR)
        server.publish("enclos/door/info", ("status-response " + door.getStatusStr()).c_str());
    else if (action == Order::STATUS_ELECTRIC_FENCE)
        server.publish("enclos/fence/info", ("status-response " + electricFence.getStatusStr()).c_str());
    else
        handledAction = false;

    if (handledAction)
        Log("Action received " + String(action));
}
