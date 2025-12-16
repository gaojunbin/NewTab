import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/useSettingsStore';

const greetings = ['Good Night', 'Good Morning', 'Good Afternoon', 'Good Evening'];

const timezones = [
  { label: 'Beijing', timezone: 'Asia/Shanghai' },
  { label: 'Singapore', timezone: 'Asia/Singapore' },
  { label: 'New York', timezone: 'America/New_York' },
  { label: 'London', timezone: 'Europe/London' },
];

function Clock() {
  const { settings } = useSettingsStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = settings.clockFormat === '12h'
      ? date.getHours() % 12 || 12
      : date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getAmPm = () => {
    if (settings.clockFormat !== '12h') return null;
    return time.getHours() >= 12 ? 'PM' : 'AM';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = time.getHours();
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
              {time.getSeconds().toString().padStart(2, '0')}
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
