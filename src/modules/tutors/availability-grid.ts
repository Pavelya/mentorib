import type { SlotKey } from "@/components/ui/weekly-hour-grid";

type AvailabilityRuleShape = {
  dayOfWeek: number;
  startLocalTime: string;
  endLocalTime: string;
};

function parseTimeOfDay(value: string): { hour: number; minute: number } {
  const [hourPart, minutePart = "0"] = value.split(":");
  const hour = Number.parseInt(hourPart, 10);
  const minute = Number.parseInt(minutePart, 10);
  return { hour, minute };
}

function formatWholeHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function expandAvailabilityRulesToSlots(
  rules: ReadonlyArray<AvailabilityRuleShape>,
): Set<SlotKey> {
  const slots = new Set<SlotKey>();
  for (const rule of rules) {
    const start = parseTimeOfDay(rule.startLocalTime);
    const end = parseTimeOfDay(rule.endLocalTime);

    const expandedStart = start.hour;
    const expandedEnd =
      end.hour + (end.minute > 0 ? 1 : 0);

    for (let hour = expandedStart; hour < expandedEnd && hour < 24; hour += 1) {
      slots.add(`${rule.dayOfWeek}:${hour}` as SlotKey);
    }
  }
  return slots;
}

export function coalesceSlotsToAvailabilityRules(
  slots: ReadonlySet<SlotKey>,
): Array<AvailabilityRuleShape> {
  const byDay = new Map<number, number[]>();
  for (const slot of slots) {
    const [dayPart, hourPart] = slot.split(":");
    const day = Number.parseInt(dayPart, 10);
    const hour = Number.parseInt(hourPart, 10);
    const list = byDay.get(day);
    if (list) {
      list.push(hour);
    } else {
      byDay.set(day, [hour]);
    }
  }

  const rules: Array<AvailabilityRuleShape> = [];
  const sortedDays = Array.from(byDay.keys()).sort((a, b) => a - b);
  for (const day of sortedDays) {
    const hours = byDay.get(day);
    if (!hours || hours.length === 0) continue;
    hours.sort((a, b) => a - b);
    let runStart = hours[0];
    let runEnd = hours[0];
    for (let index = 1; index < hours.length; index += 1) {
      const hour = hours[index];
      if (hour === runEnd + 1) {
        runEnd = hour;
        continue;
      }
      rules.push({
        dayOfWeek: day,
        startLocalTime: formatWholeHour(runStart),
        endLocalTime: formatWholeHour(runEnd + 1),
      });
      runStart = hour;
      runEnd = hour;
    }
    rules.push({
      dayOfWeek: day,
      startLocalTime: formatWholeHour(runStart),
      endLocalTime: formatWholeHour(runEnd + 1),
    });
  }
  return rules;
}
