"use client";

import { useState, useEffect } from 'react';

interface CurrentTimeIndicatorProps {
  hourIndex: number;
  startHour: number;
}

const CurrentTimeIndicator = ({ hourIndex, startHour }: CurrentTimeIndicatorProps) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const [position, setPosition] = useState(0);
  const [currentDay, setCurrentDay] = useState<string | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  
  useEffect(() => {
    // Update time indicator position every minute
    const updateTimeIndicator = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Get the current day name
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayName = days[now.getDay()];
      setCurrentDay(dayName);
      
      // Show indicator always, but handle different positions
      setShowIndicator(true);
      
      // Check if time is before the start of the timetable
      if (currentHour < 6) {
        setPosition(0); // Position at the top
        setIsOutOfRange(true);
      } 
      // Check if time is after the end of the timetable
      else if (currentHour >= 18) {
        setPosition(100); // Position at the bottom
        setIsOutOfRange(true);
      } 
      // Time is within the current hour slot
      else if (currentHour === startHour) {
        // Calculate position percentage based on minutes
        const percentage = (currentMinute / 60) * 100;
        setPosition(percentage);
        setIsOutOfRange(false);
      } 
      // Time is within the timetable range but not this specific hour
      else {
        setShowIndicator(false);
      }
    };
    
    // Initial update
    updateTimeIndicator();
    
    // Set up interval for updates
    const interval = setInterval(updateTimeIndicator, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [startHour]);
  
  if (!showIndicator) return null;
  
  return (
    <div 
      className="absolute left-0 right-0 h-0.5 bg-green-500 z-10 pointer-events-none"
      style={{ 
        top: `${position}%`, 
        boxShadow: '0 0 4px rgb(21, 92, 21)'
      }}
    >
      <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-green-500"></div>
      <div className="absolute left-3 -top-5 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
        {isOutOfRange ? "Current time" : "Now"}
      </div>
    </div>
  );
};

export default CurrentTimeIndicator;