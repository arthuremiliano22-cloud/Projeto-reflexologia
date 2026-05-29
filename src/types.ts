/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceType = 'REFLEXOLOGY' | 'IMT';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  durationMinutes: number;
  price: number;
  modality: 'PRESENCIAL' | 'ONLINE';
  bufferMinutes: number;
  description: string;
}

export type AppointmentStatus = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO';

export interface Patient {
  name: string;
  whatsapp: string;
  email: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  therapistId: string;
  dateTime: string; // ISO String representation of local therapist time
  durationMinutes: number;
  patientName: string;
  patientWhatsapp: string;
  patientEmail: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface AvailabilityRule {
  id: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM" e.g. "08:00"
  endTime: string;   // "HH:MM" e.g. "19:00"
}

export interface BlockedSlot {
  id: string;
  therapistId: string;
  dateStr: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  reason: string;
}

export interface Therapist {
  id: string;
  name: string;
  email: string;
}

export interface TherapistContact {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  instagram: string;
  workingHours: string;
  bio: string;
}

export interface SpecificationSection {
  id: string;
  title: string;
  category: string;
  content: string;
  summary: string;
}
