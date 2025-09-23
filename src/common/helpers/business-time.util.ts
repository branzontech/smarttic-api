import { LaborHour } from 'src/modules/labor-hours/entities/labor-hours.entity';
import { Holiday } from 'src/modules/holidays/entities/holidays.entity';
import * as dayjs from 'dayjs';

type Block = { start: string; end: string };

export function calculateBusinessMinutesBetweenDates(
  start: Date,
  end: Date,
  laborHours: LaborHour[],
  holidays: Holiday[],
): number {
  if (!start || !end || start >= end) return 0;

  const startDate = dayjs(start);
  const endDate = dayjs(end);

  const holidaySet = new Set(
    holidays.map((h) => dayjs(h.date).format('YYYY-MM-DD')),
  );

  const scheduleMap = groupLaborHoursByDay(laborHours);

  let totalMinutes = 0;
  let current = startDate.startOf('day');

  while (current.isBefore(endDate, 'day') || current.isSame(endDate, 'day')) {
    const currentDateStr = current.format('YYYY-MM-DD');

    if (holidaySet.has(currentDateStr)) {
      current = current.add(1, 'day');
      continue;
    }

    const dayOfWeek = current.day(); 
    const blocks = scheduleMap.get(dayOfWeek);
    if (!blocks?.length) {
      current = current.add(1, 'day');
      continue;
    }

    for (const block of blocks) {
      const blockStart = dayjs(`${currentDateStr}T${block.start}`);
      const blockEnd = dayjs(`${currentDateStr}T${block.end}`);

      const overlapStart = startDate.isAfter(blockStart)
        ? startDate
        : blockStart;
      const overlapEnd = endDate.isBefore(blockEnd) ? endDate : blockEnd;

      if (overlapStart.isBefore(overlapEnd)) {
        totalMinutes += overlapEnd.diff(overlapStart, 'minute');
      }
    }

    current = current.add(1, 'day');
  }

  return totalMinutes;
}

function groupLaborHoursByDay(laborHours: LaborHour[]): Map<number, Block[]> {
  const map = new Map<number, Block[]>();

  for (const hour of laborHours) {
    if (!hour.is_active) continue;

    const blocks: Block[] = [];

    if (hour.start_time && hour.end_time) {
      if (hour.start_break && hour.end_break) {
        blocks.push(
          { start: hour.start_time, end: hour.start_break },
          { start: hour.end_break, end: hour.end_time },
        );
      } else {
        blocks.push({ start: hour.start_time, end: hour.end_time });
      }
    }

    if (!map.has(hour.day_of_week)) {
      map.set(hour.day_of_week, []);
    }

    map.get(hour.day_of_week)?.push(...blocks);
  }

  return map;
}
