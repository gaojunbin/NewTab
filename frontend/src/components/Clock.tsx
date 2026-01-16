import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/useSettingsStore';

const greetings = ['Good Night', 'Good Morning', 'Good Afternoon', 'Good Evening'];

// Fixed timezones to always show (after detected location)
const fixedTimezones = [
  { label: 'Beijing', timezone: 'Asia/Shanghai' },
  { label: 'New York', timezone: 'America/New_York' },
  { label: 'London', timezone: 'Europe/London' },
  { label: 'Sydney', timezone: 'Australia/Sydney' },
];

function Clock() {
  const { settings, detectedLocation } = useSettingsStore();
  const [time, setTime] = useState(new Date());

  // Build dynamic timezone list: detected location first, then fixed timezones (deduplicated)
  const timezones = useMemo(() => {
    const result: { label: string; timezone: string }[] = [];
    const seenTimezones = new Set<string>();

    // Add detected location first
    if (detectedLocation?.timezone) {
      result.push({
        label: detectedLocation.city,
        timezone: detectedLocation.timezone,
      });
      seenTimezones.add(detectedLocation.timezone);
    }

    // Add fixed timezones, skipping duplicates
    for (const tz of fixedTimezones) {
      if (!seenTimezones.has(tz.timezone)) {
        result.push(tz);
        seenTimezones.add(tz.timezone);
      }
    }

    return result;
  }, [detectedLocation]);

  // Use detected timezone or fallback to local
  const activeTimezone = detectedLocation?.timezone;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get hour in the active timezone
  const getHourInTimezone = (date: Date) => {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: activeTimezone,
    });
    return parseInt(timeStr, 10);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: settings.clockFormat === '12h',
      timeZone: activeTimezone,
    }).replace(/\s?(AM|PM)$/i, ''); // Remove AM/PM, we show it separately
  };

  const getSeconds = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      second: '2-digit',
      timeZone: activeTimezone,
    }).padStart(2, '0');
  };

  const getAmPm = () => {
    if (settings.clockFormat !== '12h') return null;
    const hour = getHourInTimezone(time);
    return hour >= 12 ? 'PM' : 'AM';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: activeTimezone,
    });
  };

  const getGreeting = () => {
    const hour = getHourInTimezone(time);
    const index = Math.floor(hour / 6);
    const greeting = greetings[index];
    return settings.greetingName ? `${greeting}, ${settings.greetingName}` : greeting;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      {/* Greeting */}
      <h2
        className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight mb-3 sm:mb-4"
        style={{ color: settings.textColor }}
      >
        {getGreeting()}
      </h2>

      {/* Time */}
      {settings.showClock && (
        <div className="flex items-baseline justify-center gap-1 sm:gap-2 mb-2">
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-thin tracking-tighter tabular-nums"
            style={{ color: settings.textColor }}
          >
            {formatTime(time)}
          </h1>
          {settings.clockShowSeconds && (
            <span
              className="text-xl sm:text-2xl md:text-3xl font-thin tabular-nums"
              style={{ color: settings.accentColor }}
            >
              {getSeconds(time)}
            </span>
          )}
          {getAmPm() && (
            <span
              className="text-base sm:text-lg font-light ml-1"
              style={{ color: settings.accentColor }}
            >
              {getAmPm()}
            </span>
          )}
        </div>
      )}

      {/* Date */}
      {settings.showClock && (
        <p
          className="text-xs sm:text-sm font-normal tracking-wide"
          style={{ color: settings.accentColor }}
        >
          {formatDate(time)}
        </p>
      )}

      {/* Multi-timezone */}
      {settings.showClock && settings.showMultiTimezone && (
        <div
          className="flex gap-3 sm:gap-4 mt-3 sm:mt-4 text-[10px] sm:text-xs justify-center flex-wrap px-4"
          style={{ color: settings.accentColor }}
        >
          {timezones.map((tz) => (
            <TimeZoneDisplay key={tz.timezone} label={tz.label} timezone={tz.timezone} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TimeZoneDisplay({ label, timezone }: { label: string; timezone: string }) {
  const [time, setTime] = useState('');
  const { settings } = useSettingsStore();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: timezone,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  return (
    <span className="flex items-center gap-1.5">
      <span style={{ color: settings.accentColor }}>{label}</span>
      <span className="tabular-nums font-medium" style={{ color: settings.textColor }}>{time}</span>
    </span>
  );
}

export default Clock;
