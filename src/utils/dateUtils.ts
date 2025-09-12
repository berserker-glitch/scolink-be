export class DateUtils {
  /**
   * Get the current day name (e.g., 'Monday', 'Tuesday', etc.)
   */
  static getCurrentDayName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  /**
   * Get day name from date
   */
  static getDayName(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Calculate the current week cycle for a group based on their class day
   * Returns the start and end dates of the current attendance week
   * 
   * @param classDayName - The day of the week the class occurs (e.g., 'Tuesday')
   * @returns Object with startDate and endDate for the current week cycle
   */
  static getCurrentWeekCycle(classDayName: string): { startDate: Date; endDate: Date } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const classDayIndex = dayNames.indexOf(classDayName);
    
    if (classDayIndex === -1) {
      throw new Error(`Invalid day name: ${classDayName}`);
    }
    
    const currentDayIndex = today.getDay();
    
    // Calculate days since last occurrence of the class day
    let daysSinceLastClass = currentDayIndex - classDayIndex;
    if (daysSinceLastClass < 0) {
      daysSinceLastClass += 7;
    }
    
    // Start date is the most recent occurrence of the class day
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysSinceLastClass);
    
    // End date is the next occurrence of the class day (exclusive)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    
    return { startDate, endDate };
  }

  /**
   * Check if today matches any of the given schedule days
   * 
   * @param scheduleDays - Array of day names from group schedules
   * @returns Boolean indicating if today is a class day
   */
  static isTodayAClassDay(scheduleDays: string[]): boolean {
    const today = this.getCurrentDayName();
    return scheduleDays.includes(today);
  }

  /**
   * Get the most recent class date for a group
   * 
   * @param classDayName - The day of the week the class occurs
   * @returns The most recent date when the class occurred
   */
  static getMostRecentClassDate(classDayName: string): Date {
    const { startDate } = this.getCurrentWeekCycle(classDayName);
    return startDate;
  }

  /**
   * Check if a date is within the current week cycle for a class day
   * 
   * @param date - Date to check
   * @param classDayName - The day of the week the class occurs
   * @returns Boolean indicating if the date is in current cycle
   */
  static isDateInCurrentCycle(date: Date, classDayName: string): boolean {
    const { startDate, endDate } = this.getCurrentWeekCycle(classDayName);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate >= startDate && checkDate < endDate;
  }

  /**
   * Format date to ISO string (YYYY-MM-DD)
   * 
   * @param date - Date to format
   * @returns ISO date string
   */
  static toISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Check if two dates are on the same day
   * 
   * @param date1 - First date
   * @param date2 - Second date  
   * @returns Boolean indicating if dates are same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return this.toISODateString(date1) === this.toISODateString(date2);
  }
}
