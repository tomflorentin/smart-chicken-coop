import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import xlsx from 'node-xlsx';
import { Notify } from '../notify';
import { MqttService, Topic } from '../mqtt/mqtt.service';
import State, {
  DoorOrder,
  DoorStatus,
  FenceOrder,
  FenceStatus,
} from '../state';
import { ConfigService } from '@nestjs/config';
import { sleep } from '../utils';
import { TaskService } from '../task/task.service';

@Injectable()
export class TimerService implements OnModuleInit {
  constructor(
    @Inject(forwardRef(() => TaskService))
    private readonly taskService: TaskService,
    @Inject(forwardRef(() => MqttService))
    private readonly mqttService: MqttService,
    private readonly configService: ConfigService,
  ) {}

  private closeTime: number;
  private closeTimeHasBeenProcessed = false;
  private openTime: number;
  private openTimeHasBeenProcessed = false;
  private readonly fiveMinutesAsFraction = this.minutesToFractionOfDay(5);

  async onModuleInit() {
    Logger.log('TIMEZONE IS ' + process.env.TZ);
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

  async loadTimers(resetHasBeenProcessed = false) {
    try {
      if (resetHasBeenProcessed) {
        this.closeTimeHasBeenProcessed = false;
        this.openTimeHasBeenProcessed = false;
      }
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
      const yesterday = this.getDayOfYear(
        new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      );
      const today = this.getDayOfYear(new Date());
      const tomorow = this.getDayOfYear(
        new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      );
      const currentDay = timetable.find((day) => day.day === today);
      const tomorrowDay = timetable.find((day) => day.day === tomorow);
      const oldCloseTime = this.closeTime;
      const oldOpenTime = this.openTime;
      this.openTime = tomorrowDay.open;
      this.closeTime = currentDay.close;

      await Notify(
        `🕖 Ce soir (${currentDay.day}) la porte se fermera à ${this.fractionOfDayHHMM(currentDay.close)}, et s'ouvrira demain (${tomorrowDay.day}) à ${this.fractionOfDayHHMM(tomorrowDay.open)} 🕖`,
      );
      if (oldCloseTime && oldOpenTime) {
        const closeDiff = Math.abs(oldCloseTime - this.closeTime);
        if (closeDiff > this.fiveMinutesAsFraction * 1.05) {
          await Notify(
            `🕖 L'heure de fermeture change trop vite entre le jour ${yesterday} et le jour ${today} ⚠️  (de ${this.fractionOfDayHHMM(oldCloseTime)} à ${this.fractionOfDayHHMM(this.closeTime)})`,
          );
        }
      }
    } catch (e) {
      Logger.error('Error while reading timetable', e);
      await Notify(
        "⚠️ Erreur de lecture d'horraire ⚠️ Fermez la porte manuellement ce soir ⚠️",
      );
    }
  }

  async getTimers() {
    if (!this.openTime || !this.closeTime) {
      await this.loadTimers();
    }
    return {
      openTime: this.openTime,
      closeTime: this.closeTime,
    };
  }

  async checkTimers() {
    try {
      Logger.log('Checking timers');
      if (!this.closeTime || !this.openTime) {
        await this.loadTimers();
        return;
      }
      Logger.log('Timers loaded');

      const notifs = [];

      console.log({
        closeTime: this.closeTime,
        openTime: this.openTime,
      });
      if (!this.closeTimeHasBeenProcessed && this.isAtNight()) {
        await this.closeRoutine(notifs);
        this.closeTimeHasBeenProcessed = true;
      }
      if (!this.openTimeHasBeenProcessed && this.isAtDay()) {
        await this.openRoutine(notifs);
        this.openTimeHasBeenProcessed = true;
      }

      if (notifs.length) {
        await Notify(notifs.join('\n'));
      }
    } catch (ex) {
      Logger.error('Error while checking timers', ex);
      await Notify(
        '⚠️ !!! Erreur de la tache de preparation a la nuit/matin !!!',
      );
    }
  }

  private async openRoutine(notifs: any[]) {
    try {
      const currentFractionOfDay = this.getCurrentFractionOfDay();
      if (State.poulailler.door.status !== DoorStatus.OPENED) {
        if (currentFractionOfDay > 0.9 || currentFractionOfDay < 0.25) {
          await Notify(
            "Le système a tenté d'ouvrir la porte a une heure dangereuse ! annulation de l'ouverture",
          );
        } else {
          await this.taskService.executeTask(
            Topic.poulaillerDoorOrder,
            DoorOrder.OPEN,
          );
          notifs.push('🚪🕙Ouverture automatique de la porte');
        }
      } else {
        Logger.log('Door already opened');
      }
      // if (State.enclos.alertSystem.status !== AlertStatus.DISABLED) {
      //   await this.mqttService.publish(
      //     Topic.enclosAlertOrder,
      //     FenceOrder.DISABLE,
      //   );
      //   notifs.push('🛡️🕙 Extinction automatique des détecteurs de mouvements');
      // } else {
      //   Logger.log('Alert system already disabled');
      // }
      notifs.push(
        `🌡️ La temperature minimale cette nuit a été de ${State.poulailler.minTemperature}°C`,
      );
      State.poulailler.minTemperature = null;
    } catch (ex) {
      notifs.push("⚠️ Erreur de la routine d'ouverture ⚠️ : " + ex.message);
    }
  }

  private async closeRoutine(notifs: any[]) {
    try {
      if (State.poulailler.door.status !== DoorStatus.CLOSED) {
        await this.taskService.executeTask(
          Topic.poulaillerDoorOrder,
          DoorOrder.FORCE_CLOSE,
        );
        notifs.push('🚪🕙Fermeture automatique de la porte');
      } else {
        Logger.log('Door already closed');
      }
    } catch (ex) {
      notifs.push(
        '⚠️ Erreur de la routine de fermeture de la porte ⚠️ : ' + ex.message,
      );
    }
    try {
      if (State.enclos.electricFence.status !== FenceStatus.ENABLED) {
        await this.taskService.executeTask(
          Topic.enclosFenceOrder,
          FenceOrder.ENABLE,
        );
        notifs.push('⚡🕙 Allumage automatique de la clôture électrique');
      } else {
        Logger.log('Electric Fence already enabled');
      }
      // if (State.enclos.alertSystem.status !== AlertStatus.ENABLED) {
      //   await this.mqttService.publish(Topic.enclosAlertOrder, AlertOrder.ENABLE);
      //   notifs.push('🛡️🕙 Allumage automatique des détecteurs de mouvements');
      // } else {
      //   Logger.log('Alert system already enabled');
      // }
    } catch (ex) {
      notifs.push(
        "⚠️ Erreur de la routine d'allumage de l'electricité ⚠️ : " +
          ex.message,
      );
    }
    notifs.push(
      `🌡️ La temperature maximale aujourd'hui a été de ${State.poulailler.maxTemperature}°C`,
    );
    State.poulailler.maxTemperature = null;
  }

  async safetyCheck() {
    await this.mqttService.publish(Topic.poulaillerDoorOrder, DoorOrder.STATUS);
    await this.mqttService.publish(Topic.enclosFenceOrder, FenceOrder.STATUS);
    await sleep(10000);
    if (State.poulailler.door.status !== DoorStatus.CLOSED) {
      await Notify("⚠️ La porte n'est pas fermée ️");
      await this.mqttService.publish(
        Topic.poulaillerDoorOrder,
        DoorOrder.FORCE_CLOSE,
      );
    } else {
      await Notify(
        'Vérification du soir : La porte est correctement fermée ✅ Bonne nuit les poules 🐔',
      );
    }

    // Electric fence
    if (State.enclos.electricFence.status !== FenceStatus.ENABLED) {
      await Notify("⚠️ La clôture électrique n'est pas activée ️");
      await this.mqttService.publish(Topic.enclosFenceOrder, FenceOrder.ENABLE);
    }
  }

  isAtNight() {
    const currentFractionOfDay = this.getCurrentFractionOfDay();
    const isAfternoon = currentFractionOfDay > 0.5;

    return isAfternoon && currentFractionOfDay >= this.closeTime;
  }

  public isAtDay() {
    const currentFractionOfDay = this.getCurrentFractionOfDay();
    const isAfternoon = currentFractionOfDay > 0.5;

    return !isAfternoon && currentFractionOfDay >= this.openTime;
  }
}
