import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import xlsx from 'node-xlsx';
import { Notify } from '../notify';
import { MqttService, Topic } from '../mqtt/mqtt.service';
import State, { DoorOrder, DoorStatus } from '../state';
import { ConfigService } from '@nestjs/config';

const tenMinutesAsFractionOfDay = 10 / (24 * 60);

@Injectable()
export class TimerService implements OnModuleInit {
  constructor(
    private readonly mqttService: MqttService,
    private readonly configService: ConfigService,
  ) {}

  private closeTime: number;
  private openTime: number;

  async onModuleInit() {
    await this.loadTimers();
  }

  private getCurrentFractionOfDay() {
    const now = new Date();
    const hoursElapsed = now.getHours();
    const minutesElapsed = now.getMinutes();
    return this.minutesToFractionOfDay(hoursElapsed * 60 + minutesElapsed);
  }

  private minutesToFractionOfDay(minutes: number) {
    const totalMinutesInADay = 24 * 60;
    return minutes / totalMinutesInADay;
  }

  private fractionOfDayHHMM(fractionOfDay: number) {
    const totalMinutesInADay = 24 * 60;
    const totalMinutes = Math.floor(fractionOfDay * totalMinutesInADay);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes}`;
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const msInDay = 24 * 60 * 60 * 1000;
    let dayOfYear =
      Math.floor((date.getTime() - start.getTime()) / msInDay) + 1;

    // Vérifier si l'année est bissextile
    const isLeapYear = (year: number) =>
      (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const feb29 = new Date(date.getFullYear(), 1, 29); // 29 février

    // Si on est après le 28 février et ce n'est pas une année bissextile, ajouter un jour pour le 29 février
    if (date >= feb29 && !isLeapYear(date.getFullYear())) {
      dayOfYear += 1;
    }

    return dayOfYear;
  }

  async loadTimers() {
    try {
      const timetableRequest = await fetch(
        this.configService.get('TIMETABLE_URL'),
      );
      const blob = await timetableRequest.arrayBuffer();
      const workSheetsFromBuffer = xlsx.parse(blob);
      const sheetData = workSheetsFromBuffer[0].data;
      const days = sheetData[0];
      const openTimes = sheetData[1];
      const closeTimes = sheetData[2];

      const timetable = days.map((day, index) => ({
        day,
        open: openTimes[index],
        close: closeTimes[index],
      }));
      const today = this.getDayOfYear(new Date());
      const tomorow = this.getDayOfYear(
        new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      );
      const currentDay = timetable.find((day) => day.day === today);
      const tomorowDay = timetable.find((day) => day.day === tomorow);
      await Notify(
        `🕖 Ce soir la porte se fermera à ${this.fractionOfDayHHMM(currentDay.close)}, et s'ouvrira demain à ${this.fractionOfDayHHMM(tomorowDay.open)} 🕖`,
      );
    } catch (e) {
      Logger.error('Error while reading timetable', e);
      await Notify(
        "⚠️ Erreur de lecture d'horraire ⚠️ Fermez la porte manuellement ce soir ⚠️",
      );
    }
  }

  async checkTimers() {
    Logger.log('Checking timers');
    if (!this.closeTime || !this.openTime) {
      await this.loadTimers();
      return;
    }
    Logger.log('Timers loaded');
    const currentFractionOfDay = this.getCurrentFractionOfDay();

    const isAfternoon = currentFractionOfDay > 0.5;

    if (
      isAfternoon &&
      currentFractionOfDay >= this.closeTime &&
      State.poulailler.door.status !== DoorStatus.CLOSED
    ) {
      await Notify('Fermeture automatique de la porte');
      this.mqttService.publish(
        Topic.poulaillerDoorOrder,
        DoorOrder.FORCE_CLOSE,
      );
    }
    if (
      !isAfternoon &&
      currentFractionOfDay >= this.openTime &&
      State.poulailler.door.status !== DoorStatus.OPENED
    ) {
      if (currentFractionOfDay > 0.8 || currentFractionOfDay < 0.3) {
        await Notify(
          "Le système a tenté d'ouvrir la porte a une heure dangereuse ! annulation de l'ouverture",
        );
        return;
      }
      await Notify('Ouverture automatique de la porte');
      this.mqttService.publish(Topic.poulaillerDoorOrder, DoorOrder.OPEN);
    }
  }

  async safetyCheck() {
    this.mqttService.publish(Topic.poulaillerDoorOrder, DoorOrder.STATUS);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 10000));
    if (State.poulailler.door.status !== DoorStatus.CLOSED) {
      await Notify("⚠️ La porte n'est pas fermée ⚠️");
    } else {
      await Notify(
        'Vérification du soir : La porte est correctement fermée ✅ Bonne nuit les poules 🐔',
      );
    }
    this.mqttService.publish(Topic.poulaillerDoorOrder, DoorOrder.FORCE_CLOSE);
  }
}
