//
// Created by tomfl on 5/7/2024.
//

#include "Arduino.h"

#ifndef POULAILLER_FUNC_H
#define POULAILLER_FUNC_H

void Log(String const &message);
String getJsonLogs();
bool Notify(String const &message);

#endif //POULAILLER_FUNC_H
