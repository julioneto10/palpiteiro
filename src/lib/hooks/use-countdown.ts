"use client";

import { useState, useEffect } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(targetDate: string | Date): CountdownResult {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;

  const calculate = (): CountdownResult => {
    const total = Math.max(0, target.getTime() - Date.now());
    const isExpired = total <= 0;
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((total % (1000 * 60)) / 1000);

    let formatted: string;
    if (isExpired) {
      formatted = "Encerrado";
    } else if (days > 0) {
      formatted = `${days}d ${hours}h`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}min`;
    } else if (minutes > 0) {
      formatted = `${minutes}min ${seconds}s`;
    } else {
      formatted = `${seconds}s`;
    }

    return { days, hours, minutes, seconds, total, isExpired, formatted };
  };

  const [countdown, setCountdown] = useState<CountdownResult>(calculate);

  useEffect(() => {
    const interval = setInterval(() => {
      const result = calculate();
      setCountdown(result);
      if (result.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  return countdown;
}
