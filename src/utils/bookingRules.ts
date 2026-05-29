/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Appointment, BlockedSlot, Service } from '../types';

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
}: {
  proposedDateTimeStr: string;   // ISO 8601 string or Date format
  service: Service;
  existingAppointments: Appointment[];
  blockedSlots: BlockedSlot[];
  tzOffsetMinutes?: number;
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

  // 3. Business hours validator (08:00 to 19:00)
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const floatHour = hours + minutes / 60;

  const durationHours = service.durationMinutes / 60;
  const bufferHours = (service.bufferMinutes || 0) / 60;

  if (floatHour < 8 || floatHour + durationHours > 19) {
    return {
      isValid: false,
      reason: `Fora do horário de atendimento permitido (08:00 às 19:00). A sessão de ${service.durationMinutes} min ultrapassa o limite operacional.`,
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
export function generateDailyTimeSlots(dateString: string): string[] {
  // Generates slots from 08:00 to 19:00 in UTC strings
  // e.g. "08:00", "08:30", "09:00", ... "18:00"
  const slots: string[] = [];
  let h = 8;
  let m = 0;

  while (h < 19) {
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
