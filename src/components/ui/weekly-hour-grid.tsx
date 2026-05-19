"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import styles from "./weekly-hour-grid.module.css";

export type SlotKey = `${number}:${number}`;

export type WeeklyHourGridProps = {
  value: ReadonlySet<SlotKey>;
  onChange: (next: Set<SlotKey>) => void;
  dayLabels: readonly string[];
  startHour?: number;
  endHour?: number;
  disabled?: boolean;
  "aria-label": string;
};

export function makeSlotKey(day: number, hour: number): SlotKey {
  return `${day}:${hour}` as SlotKey;
}

export function parseSlotKey(slot: SlotKey): { day: number; hour: number } {
  const [day, hour] = slot.split(":");
  return { day: Number.parseInt(day, 10), hour: Number.parseInt(hour, 10) };
}

function formatHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

const PAGE_STEP = 6;

export function WeeklyHourGrid({
  value,
  onChange,
  dayLabels,
  startHour = 0,
  endHour = 24,
  disabled = false,
  "aria-label": ariaLabel,
}: WeeklyHourGridProps) {
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = startHour; hour < endHour; hour += 1) {
      list.push(hour);
    }
    return list;
  }, [startHour, endHour]);

  const dayCount = dayLabels.length;
  const [focusedDay, setFocusedDay] = useState(0);
  const [focusedHourIndex, setFocusedHourIndex] = useState(0);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusCell = useCallback((hourIndex: number, day: number) => {
    const cell = cellRefs.current.get(`${hourIndex}:${day}`);
    if (cell) {
      cell.focus();
    }
  }, []);

  const toggleSlot = useCallback(
    (day: number, hour: number) => {
      if (disabled) return;
      const next = new Set(value);
      const key = makeSlotKey(day, hour);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onChange(next);
    },
    [disabled, value, onChange],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, hourIndex: number, day: number) => {
      const lastHourIndex = hours.length - 1;
      const lastDay = dayCount - 1;
      switch (event.key) {
        case "ArrowRight": {
          event.preventDefault();
          const nextDay = Math.min(day + 1, lastDay);
          setFocusedDay(nextDay);
          setFocusedHourIndex(hourIndex);
          focusCell(hourIndex, nextDay);
          return;
        }
        case "ArrowLeft": {
          event.preventDefault();
          const nextDay = Math.max(day - 1, 0);
          setFocusedDay(nextDay);
          setFocusedHourIndex(hourIndex);
          focusCell(hourIndex, nextDay);
          return;
        }
        case "ArrowDown": {
          event.preventDefault();
          const nextHour = Math.min(hourIndex + 1, lastHourIndex);
          setFocusedHourIndex(nextHour);
          setFocusedDay(day);
          focusCell(nextHour, day);
          return;
        }
        case "ArrowUp": {
          event.preventDefault();
          const nextHour = Math.max(hourIndex - 1, 0);
          setFocusedHourIndex(nextHour);
          setFocusedDay(day);
          focusCell(nextHour, day);
          return;
        }
        case "Home": {
          event.preventDefault();
          setFocusedDay(0);
          setFocusedHourIndex(hourIndex);
          focusCell(hourIndex, 0);
          return;
        }
        case "End": {
          event.preventDefault();
          setFocusedDay(lastDay);
          setFocusedHourIndex(hourIndex);
          focusCell(hourIndex, lastDay);
          return;
        }
        case "PageUp": {
          event.preventDefault();
          const nextHour = Math.max(hourIndex - PAGE_STEP, 0);
          setFocusedHourIndex(nextHour);
          setFocusedDay(day);
          focusCell(nextHour, day);
          return;
        }
        case "PageDown": {
          event.preventDefault();
          const nextHour = Math.min(hourIndex + PAGE_STEP, lastHourIndex);
          setFocusedHourIndex(nextHour);
          setFocusedDay(day);
          focusCell(nextHour, day);
          return;
        }
        case " ":
        case "Enter": {
          event.preventDefault();
          toggleSlot(day, hours[hourIndex]);
          return;
        }
        default:
          return;
      }
    },
    [hours, dayCount, focusCell, toggleSlot],
  );

  const rowCount = hours.length + 1;
  const colCount = dayCount + 1;

  return (
    <div
      className={styles.scroller}
      data-disabled={disabled ? "true" : undefined}
    >
      <div
        aria-colcount={colCount}
        aria-label={ariaLabel}
        aria-rowcount={rowCount}
        className={styles.grid}
        role="grid"
        style={{ "--weekly-grid-day-count": dayCount } as React.CSSProperties}
      >
        <div className={styles.row} role="row">
          <div aria-hidden="true" className={styles.cornerCell} />
          {dayLabels.map((label, day) => (
            <div
              className={styles.columnHeader}
              key={`col-${day}`}
              role="columnheader"
            >
              {label}
            </div>
          ))}
        </div>
        {hours.map((hour, hourIndex) => {
          const hourLabel = formatHourLabel(hour);
          return (
            <div className={styles.row} key={`row-${hour}`} role="row">
              <div className={styles.rowHeader} role="rowheader">
                {hourLabel}
              </div>
              {dayLabels.map((dayLabel, day) => {
                const selected = value.has(makeSlotKey(day, hour));
                const isFocusable =
                  hourIndex === focusedHourIndex && day === focusedDay;
                return (
                  // eslint-disable-next-line jsx-a11y/role-supports-aria-props
                  <button
                    aria-label={`${dayLabel} ${hourLabel}, ${selected ? "available" : "unavailable"}`}
                    aria-pressed={selected}
                    className={styles.cell}
                    data-selected={selected ? "true" : undefined}
                    disabled={disabled}
                    key={`cell-${day}-${hour}`}
                    onClick={() => toggleSlot(day, hour)}
                    onKeyDown={(event) => handleKeyDown(event, hourIndex, day)}
                    ref={(node) => {
                      const key = `${hourIndex}:${day}`;
                      if (node) {
                        cellRefs.current.set(key, node);
                      } else {
                        cellRefs.current.delete(key);
                      }
                    }}
                    role="gridcell"
                    tabIndex={isFocusable ? 0 : -1}
                    type="button"
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
