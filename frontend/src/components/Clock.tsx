import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/useSettingsStore';

const greetings = ['Good Night', 'Good Morning', 'Good Afternoon', 'Good Evening'];

function Clock() {
  const { settings } = useSettingsStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.clockFormat === '12h',
    };
    return date.toLocaleTimeString('en-US', options);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
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
      {/* Time - Large like original */}
      <div className="flex items-baseline gap-2 justify-center">
        <h1
          className="text-5xl md:text-6xl font-extralight tracking-tight tabular-nums"
          style={{ color: settings.textColor, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
        >
          {formatTime(time)}
        </h1>
        {settings.clockShowSeconds && (
          <span
            className="text-2xl font-light tabular-nums"
            style={{ color: settings.accentColor }}
          >
            {time.getSeconds().toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Greeting */}
      {settings.showGreeting && (
        <h2
          className="text-xl font-light mt-2"
          style={{ color: settings.accentColor }}
        >
          {getGreeting()}
        </h2>
      )}

      {/* Date */}
      <p
        className="text-sm mt-2"
        style={{ color: settings.accentColor }}
      >
        {formatDate(time)}
      </p>

      {/* Multi-timezone */}
      <div className="flex gap-4 mt-3 text-xs justify-center" style={{ color: settings.accentColor }}>
        <TimeZoneDisplay label="Beijing" timezone="Asia/Shanghai" />
        <TimeZoneDisplay label="Singapore" timezone="Asia/Singapore" />
        <TimeZoneDisplay label="New York" timezone="America/New_York" />
      </div>
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
    <span className="flex items-center gap-1">
      <span style={{ color: settings.accentColor }}>{label}</span>
      <span className="tabular-nums" style={{ color: settings.textColor }}>{time}</span>
    </span>
  );
}

export default Clock;
