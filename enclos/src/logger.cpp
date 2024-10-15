//
// Created by tomfl on 5/7/2024.
//

#include <sstream>
#include "func.h"
#include "lib/LinkedList.h"

LinkedList<String> logs;
const short LINKED_LIST_MAX_SIZE = 100;

void Log(String const &message) {
    Serial.println(message);
    if (logs.size() >= LINKED_LIST_MAX_SIZE) {
        logs.remove(0);
    }
    logs.add(message);
}

String getJsonLogs() {
    std::stringstream json;
    json << "[";
    for (int i = 0; i < logs.size(); i++) {
        json << "\"" << logs.get(i).c_str() << "\"";
        if (i < logs.size() - 1) {
            json << ",";
        }
    }
    return String(json.str().c_str());
}