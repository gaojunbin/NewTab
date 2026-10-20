import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useSettingsStore, rgba } from '../stores/useSettingsStore';

const greetings = ['Good Night', 'Good Morning', 'Good Afternoon', 'Good Evening'];

// Fixed timezones to always show (after detected location)
const fixedTimezones = [
  { label: 'Beijing', timezone: 'Asia/Shanghai' },
  { label: 'New York', timezone: 'America/New_York' },
  { label: 'London', timezone: 'Europe/London' },
  { label: 'Sydney', timezone: 'Australia/Sydney' },
];

interface ClockProps {
  compact?: boolean;
}

function Clock({ compact = false }: ClockProps) {
  const { settings, detectedLocation } = useSettingsStore();
  const [time, setTime] = useState(() => new Date());

  // Build dynamic timezone list: detected location first, then fixed timezones (deduplicated)
  const timezones = useMemo(() => {
    const result: { label: string; timezone: string }[] = [];
    const seenTimezones = new Set<string>();

    if (detectedLocation?.timezone) {
      result.push({
        label: detectedLocation.city,
        timezone: detectedLocation.timezone,
      });
      seenTimezones.add(detectedLocation.timezone);
    }

    for (const tz of fixedTimezones) {
      if (!seenTimezones.has(tz.timezone)) {
        result.push(tz);
        seenTimezones.add(tz.timezone);
      }
    }

    return result;
  }, [detectedLocation]);

  const activeTimezone = detectedLocation?.timezone;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Safe 0-23 hour calculation in the active timezone (fixes midnight 24 -> undefined bug)
  const getHourInTimezone = (date: Date) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hourCycle: 'h23',
        timeZone: activeTimezone,
      });
      const parsed = parseInt(formatter.format(date), 10);
      return Number.isNaN(parsed) ? date.getHours() : parsed % 24;
    } catch {
      return date.getHours();
    }
  };

  const getTimeParts = (date: Date) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: settings.clockFormat === '12h' ? 'numeric' : '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: settings.clockFormat === '12h' ? 'h12' : 'h23',
        timeZone: activeTimezone,
      });
      const parts = formatter.formatToParts(date);
      const hour = parts.find((p) => p.type === 'hour')?.value || '00';
      const minute = parts.find((p) => p.type === 'minute')?.value || '00';
      const second = (parts.find((p) => p.type === 'second')?.value || '00').padStart(2, '0');
      return { hour, minute, second };
    } catch {
      const h = date.getHours();
      const hour = settings.clockFormat === '12h' ? String(h % 12 || 12) : String(h).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return { hour, minute, second };
    }
  };

  const getAmPm = () => {
    if (settings.clockFormat !== '12h') return null;
    const hour = getHourInTimezone(time);
    return hour >= 12 ? 'PM' : 'AM';
  };

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: activeTimezone,
      });
    } catch {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const getGreeting = () => {
    const hour = getHourInTimezone(time);
    const index = Math.min(3, Math.max(0, Math.floor(hour / 6)));
    const greeting = greetings[index];
    return settings.greetingName ? `${greeting}, ${settings.greetingName}` : greeting;
  };

  const formatTimezoneTime = (tz: string) => {
    try {
      return time.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: tz,
      });
    } catch {
      return '--:--';
    }
  };

  const { hour, minute, second } = getTimeParts(time);

  // Active countdowns calculation
  const countdownItems = useMemo(() => {
    if (!settings.countdowns?.length) return [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return settings.countdowns.map((item) => {
      const target = new Date(item.date);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...item, diffDays };
    });
  }, [settings.countdowns]);

  if (!settings.showGreeting && !settings.showClock) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="text-center select-none"
    >
      {/* Greeting */}
      {settings.showGreeting && (
        <motion.p
          layout
          className={
            compact
              ? 'text-sm sm:text-base font-medium tracking-tight mb-1 opacity-75'
              : 'text-base sm:text-lg md:text-xl font-normal tracking-tight mb-2 sm:mb-3 opacity-80'
          }
          style={{ color: settings.textColor }}
        >
          {getGreeting()}
        </motion.p>
      )}

      {/* Time */}
      {settings.showClock && (
        <div className="flex items-baseline justify-center gap-1.5 sm:gap-2">
          <h1
            className={
              compact
                ? 'text-4xl sm:text-5xl font-extralight tracking-tight tabular-nums leading-none'
                : 'text-6xl sm:text-7xl md:text-8xl font-extralight tracking-tighter tabular-nums leading-none'
            }
            style={{ color: settings.textColor }}
          >
            <span>{hour}</span>
            <span className="inline-block mx-0.5 opacity-60 transition-opacity duration-500">:</span>
            <span>{minute}</span>
          </h1>
          {settings.clockShowSeconds && (
            <span
              className={
                compact
                  ? 'text-base sm:text-lg font-light tabular-nums opacity-60'
                  : 'text-xl sm:text-2xl md:text-3xl font-extralight tabular-nums opacity-65'
              }
              style={{ color: settings.accentColor }}
            >
              {second}
            </span>
          )}
          {getAmPm() && (
            <span
              className="text-xs sm:text-sm font-medium tracking-wider uppercase ml-1 opacity-70"
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
          className={
            compact
              ? 'text-xs font-normal tracking-wide mt-1.5 opacity-75'
              : 'text-xs sm:text-sm font-normal tracking-wide mt-2.5 sm:mt-3 opacity-75'
          }
          style={{ color: settings.accentColor }}
        >
          {formatDate(time)}
        </p>
      )}

      {/* Multi-timezone Strip */}
      {settings.showClock && settings.showMultiTimezone && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 sm:gap-4 mt-3 sm:mt-4 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs flex-wrap justify-center"
          style={{
            background: rgba(settings.textColor, 0.035),
            border: `1px solid ${rgba(settings.textColor, 0.07)}`,
          }}
        >
          {timezones.map((tz, index) => (
            <span key={tz.timezone} className="inline-flex items-center gap-1.5">
              {index > 0 && (
                <span className="opacity-25 mr-1.5" style={{ color: settings.accentColor }}>
                  ·
                </span>
              )}
              <span className="opacity-75" style={{ color: settings.accentColor }}>
                {tz.label}
              </span>
              <span
                className="tabular-nums font-medium"
                style={{ color: settings.textColor }}
              >
                {formatTimezoneTime(tz.timezone)}
              </span>
            </span>
          ))}
        </motion.div>
      )}

      {/* Countdowns Strip */}
      {countdownItems.length > 0 && (
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          {countdownItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{
                background: rgba(settings.textColor, 0.04),
                border: `1px solid ${rgba(settings.textColor, 0.08)}`,
                color: settings.textColor,
              }}
            >
              <Calendar className="w-3 h-3 opacity-60" style={{ color: settings.accentColor }} />
              <span className="opacity-80">{item.name}</span>
              <span className="font-medium tabular-nums" style={{ color: settings.accentColor }}>
                {item.diffDays > 0
                  ? `${item.diffDays}d`
                  : item.diffDays === 0
                    ? 'Today'
                    : `${Math.abs(item.diffDays)}d ago`}
              </span>
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Clock;
