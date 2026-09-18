export const EXPERIMENT_DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export type ExperimentDay = (typeof EXPERIMENT_DAYS)[number];

export interface TimeSlot {
  /** 24h "HH:mm" key, e.g. "16:00" */
  value: string;
  /** Human-readable label, e.g. "4:00 PM" */
  label: string;
}

/** 15-minute slots from 4:00 PM up to (not including) 11:00 PM. */
export function getTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const startMinutes = 16 * 60;
  const endMinutes = 23 * 60;

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 15) {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${String(hours24).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const label = `${hours12}:${String(mins).padStart(2, "0")} ${period}`;
    slots.push({ value, label });
  }

  return slots;
}

export function slotKey(day: string, time: string) {
  return `${day}-${time}`;
}
