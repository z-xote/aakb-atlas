"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const weekdays = ["M", "T", "W", "T", "F", "S", "S"];

const presets = [
  { label: "All dates", value: null },
  { label: "From May 1", value: "2026-05-01" },
  { label: "From Apr 1", value: "2026-04-01" },
  { label: "From Mar 1", value: "2026-03-01" },
];

function toDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getCalendarDays(monthDate: Date) {
  const first = startOfMonth(monthDate);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function formatLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function DateFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(value ? toDate(value) : new Date())
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = useMemo(() => (value ? toDate(value) : null), [value]);
  const days = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function choose(nextValue: string | null) {
    onChange(nextValue);
    if (nextValue) {
      setVisibleMonth(startOfMonth(toDate(nextValue)));
    }
    setOpen(false);
  }

  return (
    <div className="atlas-date-filter" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className="atlas-date-filter-button"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <CalendarDaysIcon />
        <span>
          <strong>
            {selectedDate ? `From ${formatLabel(selectedDate)}` : "All dates"}
          </strong>
          <small>{selectedDate ? "to today" : "search everything"}</small>
        </span>
      </button>

      {open ? (
        <div aria-label="Date filter" className="atlas-date-filter-menu" role="dialog">
          <div className="atlas-date-preset-list">
            {presets.map((preset) => (
              <button
                className={cn(
                  "atlas-date-preset",
                  value === preset.value && "atlas-active"
                )}
                key={preset.value ?? "all"}
                onClick={() => choose(preset.value)}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="atlas-calendar">
            <div className="atlas-calendar-head">
              <button
                aria-label="Previous month"
                className="atlas-calendar-arrow"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                  )
                }
                type="button"
              >
                <ChevronLeftIcon />
              </button>
              <strong>{formatMonth(visibleMonth)}</strong>
              <button
                aria-label="Next month"
                className="atlas-calendar-arrow"
                onClick={() =>
                  setVisibleMonth(
                    new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                  )
                }
                type="button"
              >
                <ChevronRightIcon />
              </button>
            </div>

            <div className="atlas-calendar-weekdays">
              {weekdays.map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
              ))}
            </div>

            <div className="atlas-calendar-grid">
              {days.map((date) => {
                const inputValue = toInputValue(date);
                const isSelected = inputValue === value;
                const isMuted = date.getMonth() !== visibleMonth.getMonth();

                return (
                  <button
                    className={cn(
                      "atlas-calendar-day",
                      isSelected && "atlas-active",
                      isMuted && "atlas-muted-day"
                    )}
                    key={inputValue}
                    onClick={() => choose(inputValue)}
                    type="button"
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
