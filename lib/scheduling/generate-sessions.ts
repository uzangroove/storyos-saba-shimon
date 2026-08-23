export type HolidayRange = {
  name: string;
  startDate: string;
  endDate: string;
  noActivity?: boolean;
};

export type ScheduleDefinition = {
  weekday: number; // 0 Sunday ... 6 Saturday
  startTime: string;
  endTime: string;
  validFrom: string;
  validTo: string;
};

export type GeneratedSession = {
  sessionDate: string;
  plannedStart: string;
  plannedEnd: string;
  sequenceNumber: number | null;
  status: "PLANNED" | "HOLIDAY";
  holidayName: string | null;
};

const iso = (date: Date) => date.toISOString().slice(0, 10);
const atNoonUtc = (value: string) => new Date(`${value}T12:00:00Z`);

function holidayFor(date: string, holidays: HolidayRange[]) {
  return holidays.find((holiday) => holiday.noActivity !== false && date >= holiday.startDate && date <= holiday.endDate);
}

export function generateSessions(schedule: ScheduleDefinition, holidays: HolidayRange[] = []): GeneratedSession[] {
  const cursor = atNoonUtc(schedule.validFrom);
  const end = atNoonUtc(schedule.validTo);
  const sessions: GeneratedSession[] = [];
  let sequence = 0;

  while (cursor <= end) {
    if (cursor.getUTCDay() === schedule.weekday) {
      const sessionDate = iso(cursor);
      const holiday = holidayFor(sessionDate, holidays);
      if (holiday) {
        sessions.push({ sessionDate, plannedStart: schedule.startTime, plannedEnd: schedule.endTime, sequenceNumber: null, status: "HOLIDAY", holidayName: holiday.name });
      } else {
        sequence += 1;
        sessions.push({ sessionDate, plannedStart: schedule.startTime, plannedEnd: schedule.endTime, sequenceNumber: sequence, status: "PLANNED", holidayName: null });
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return sessions;
}
