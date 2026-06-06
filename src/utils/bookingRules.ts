/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Appointment, BlockedSlot, Service } from '../types';

/**
 * Parses start and end hours from workingHours string.
 * Supports patterns like "08:00 às 19:00", "08:00 - 23:00", "08h às 23h", etc.
 */
export function parseWorkingHours(workingHoursStr?: string): { startHour: number; endHour: number } {
  const defaults = { startHour: 8, endHour: 19 };
  if (!workingHoursStr) return defaults;

  try {
    // Regex that matches hours and optional minutes
    // Examples: "08:30", "08h30", "19", "23h", "08:00", etc.
    const timePattern = /\b([0-2]?\d)(?:[h:](\d{2}))?\b/g;
    const matches = [...workingHoursStr.matchAll(timePattern)];

    if (matches.length >= 2) {
      // Parse all matched candidates to decimal hours (e.g. 8.5 for 08:30)
      const parsedCandidates = matches
        .map(m => {
          const h = parseInt(m[1], 10);
          const mins = m[2] ? parseInt(m[2], 10) : 0;
          return h + mins / 60;
        })
        .filter(val => val >= 0 && val <= 24);

      // We look for a valid starting and ending hour pair scanning from the back,
      // which is extremely robust and avoids matching calendar day labels or single numbers
      for (let i = parsedCandidates.length - 2; i >= 0; i--) {
        const start = parsedCandidates[i];
        const end = parsedCandidates[i + 1];
        if (start < end && end - start >= 1 && end - start <= 18) {
          return { startHour: start, endHour: end };
        }
      }
    }
  } catch (err) {
    console.error("Error parsing working hours:", err);
  }

  return defaults;
}

/**
 * Validates whether a proposed appointment slot complies with all business rules.
 * Returns an object indicating success or a specific business rule violation message.
 */
export function validateBookingSlot({
  proposedDateTimeStr,
  service,
  existingAppointments,
  blockedSlots,
  tzOffsetMinutes = -180, // Default to Brasilia Time (UTC-3)
  workingHoursStr,
}: {
  proposedDateTimeStr: string;   // ISO 8601 string or Date format
  service: Service;
  existingAppointments: Appointment[];
  blockedSlots: BlockedSlot[];
  tzOffsetMinutes?: number;
  workingHoursStr?: string;
}): { isValid: boolean; reason?: string } {
  const date = new Date(proposedDateTimeStr);
  const now = new Date('2026-05-23T20:52:35Z'); // Keep in sync with user's current system date

  // 1. Prevent Past Datetimes
  if (date.getTime() < now.getTime()) {
    return { isValid: false, reason: 'O horário selecionado já passou.' };
  }

  // 2. Weekday restriction (Only Monday to Friday)
  // Note: Local day of week inside the chosen timezone
  const localDate = new Date(date.getTime() + tzOffsetMinutes * 60 * 1000);
  const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 6 is Saturday
  
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isValid: false, reason: 'Atendimentos ocorrem apenas de segunda a sexta-feira.' };
  }

  // 3. Business hours validator (defaults to 08:00 to 19:00 or parsed from workingHoursStr)
  const { startHour, endHour } = parseWorkingHours(workingHoursStr);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const floatHour = hours + minutes / 60;

  const durationHours = service.durationMinutes / 60;

  if (floatHour < startHour || floatHour + durationHours > endHour) {
    const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');
    const formattedStart = `${pad(startHour)}:${pad((startHour % 1) * 60)}`;
    const formattedEnd = `${pad(endHour)}:${pad((endHour % 1) * 60)}`;
    return {
      isValid: false,
      reason: `Fora do horário de atendimento permitido (${formattedStart} às ${formattedEnd}). A sessão de ${service.durationMinutes} min ultrapassa o limite operacional.`,
    };
  }

  // 4. Overlap/Double Booking validation with other sessions (Buffers included)
  const proposedStart = date.getTime();
  const proposedEnd = proposedStart + (service.durationMinutes + service.bufferMinutes) * 60 * 1000;

  for (const app of existingAppointments) {
    if (app.status === 'CANCELADO') continue;

    const existStart = new Date(app.dateTime).getTime();
    // Assuming existing service duration. In a real system, we'd query the specific duration of that service.
    const existEnd = existStart + (app.durationMinutes + (service.id === app.serviceId ? service.bufferMinutes : 15)) * 60 * 1000;

    // Standard interval overlap check: [Start1, End1] overlaps with [Start2, End2] if Start1 < End2 and End1 > Start2
    if (proposedStart < existEnd && proposedEnd > existStart) {
      return {
        isValid: false,
        reason: `Conflito de agenda (Double booking): Este horário coincide com outro atendimento existente de ${app.patientName} (${app.status}).`,
      };
    }
  }

  // 5. Check against Manual Blocked Slots
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const proposedEndStr = (() => {
    const endTotalMinutes = hours * 60 + minutes + service.durationMinutes;
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  })();

  for (const block of blockedSlots) {
    if (block.dateStr === dateStr) {
      // Overlap of time strings
      if (timeStr < block.endTime && proposedEndStr > block.startTime) {
        return {
          isValid: false,
          reason: `Slot bloqueado manualmente pelo terapeuta. Motivo: ${block.reason}`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Generates available 30-minute block slots for a given services
 */
export function generateDailyTimeSlots(dateString: string, workingHoursStr?: string): string[] {
  // Generates slots from starting hour to ending hour in UTC strings based on workingHoursStr
  const { startHour, endHour } = parseWorkingHours(workingHoursStr);
  const slots: string[] = [];
  let h = startHour;
  let m = 0;

  while (h < endHour) {
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push(timeStr);
    m += 30;
    if (m >= 60) {
      m = 0;
      h += 1;
    }
  }
  return slots;
}
