/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Calendar, ShieldCheck, Zap, Sparkles, Heart, CheckCircle2, Award
} from 'lucide-react';

import holosLogo from './assets/images/holos_logo_1779572745868.png';

// Models & Types
import { Service, Appointment, BlockedSlot, AppointmentStatus, TherapistContact } from './types';

// Web Components
import DocViewer from './components/DocViewer';
import PatientPortal from './components/PatientPortal';
import TherapistAdmin from './components/TherapistAdmin';
import ConflictSimulator from './components/ConflictSimulator';

// Styles
import './index.css';

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<'SPEC' | 'PORTAL' | 'ADMIN' | 'SIMULATOR'>('PORTAL');

  // 1. SERVICES STATE
  const [services, setServices] = useState<Service[]>([
    {
      id: 'srv-reflexologia',
      name: 'Reflexologia Podal',
      type: 'REFLEXOLOGY',
      durationMinutes: 60,
      price: 120.0,
      modality: 'PRESENCIAL',
      bufferMinutes: 15,
      description: 'Massagem manual aplicada nos meridianos dos pés para desbloqueio energético, relaxamento profundo de tensões e harmonização das funções do corpo.'
    },
    {
      id: 'srv-imt',
      name: 'Imagens Mentais Terapêuticas (IMT)',
      type: 'IMT',
      durationMinutes: 45,
      price: 150.0,
      modality: 'ONLINE',
      bufferMinutes: 10,
      description: 'Terapia cognitiva profunda que utiliza técnicas de visualização guiada e relaxamento mental para dissolver bloqueios psicossomáticos e estresse.'
    }
  ]);

  // CLINIC CONFIGS STATE
  const [clinicAddress, setClinicAddress] = useState<string>('Rua das Flores, 123, Sala 402 - Centro, São Paulo - SP');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState<string>('https://meet.google.com/imt-session-room');
  const [therapistContact, setTherapistContact] = useState<TherapistContact>({
    name: 'Dr. Carlos Emiliano',
    specialty: 'Terapeuta Integrativo (CRTH-BR 4102)',
    phone: '(11) 98765-4321',
    email: 'carlos@espacoholos.com.br',
    instagram: '@dr.carlos.holos',
    workingHours: 'Segunda a Sexta, das 08:00 às 19:00',
    bio: 'Olá! Sou o Dr. Carlos Emiliano, terapeuta integrativo especializado em bem-estar corporal e mental. Atuo há mais de 10 anos auxiliando pessoas a reatar a saúde através de práticas integrativas e acolhimento humano.'
  });

  const handleUpdateServicePrice = (id: string, newPrice: number) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, price: newPrice } : srv))
    );
  };

  const handleUpdateServiceDuration = (id: string, newDuration: number) => {
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, durationMinutes: newDuration } : srv))
    );
  };

  // 2. APPOINTMENTS STATE (REPRESENTING THE SHARED DATABASE SYSTEM)
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 'app-1',
      serviceId: 'srv-reflexologia',
      therapistId: 'therapist-1',
      dateTime: '2026-05-25T09:00:00.000Z', 
      durationMinutes: 60,
      patientName: 'Arthur Emiliano',
      patientWhatsapp: '+5511988887777',
      patientEmail: 'arthur.emiliano22@gmail.com',
      status: 'CONFIRMADO',
      createdAt: '2026-05-23T20:52:35.000Z'
    },
    {
      id: 'app-2',
      serviceId: 'srv-imt',
      therapistId: 'therapist-1',
      dateTime: '2026-05-25T11:00:00.000Z', 
      durationMinutes: 45,
      patientName: 'Mariana Vasconcelos',
      patientWhatsapp: '+5511977776666',
      patientEmail: 'mariana.vasco@hotmail.com',
      status: 'PENDENTE',
      createdAt: '2026-05-23T20:52:35.000Z'
    },
    {
      id: 'app-3',
      serviceId: 'srv-reflexologia',
      therapistId: 'therapist-1',
      dateTime: '2026-05-26T14:30:00.000Z', 
      durationMinutes: 60,
      patientName: 'Felipe Drummond',
      patientWhatsapp: '+5521966665555',
      patientEmail: 'felipe.drummond@uol.com.br',
      status: 'CONCLUIDO',
      notes: 'Paciente relatou drástica redução de dores de cabeça após a ativação dos meridianos reflexos podais.',
      createdAt: '2026-05-23T20:52:35.000Z'
    },
    {
      id: 'app-4',
      serviceId: 'srv-imt',
      therapistId: 'therapist-1',
      dateTime: '2026-05-27T16:00:00.000Z', 
      durationMinutes: 45,
      patientName: 'Beatriz Muller',
      patientWhatsapp: '+5511999991111',
      patientEmail: 'beatriz.muller@gmail.com',
      status: 'CANCELADO',
      notes: 'Paciente solicitou cancelamento devido a imprevisto familiar com antecedência.',
      createdAt: '2026-05-23T20:52:35.000Z'
    }
  ]);

  // 3. BLOCKED SLOTS STATE
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([
    {
      id: 'block-1',
      therapistId: 'therapist-1',
      dateStr: '2026-05-25',
      startTime: '12:00',
      endTime: '13:30',
      reason: 'Intervalo de Almoço do Terapeuta'
    },
    {
      id: 'block-2',
      therapistId: 'therapist-1',
      dateStr: '2026-05-27',
      startTime: '08:00',
      endTime: '09:30',
      reason: 'Assepsia, Organização do Espaço e Macas'
    }
  ]);

  // DATABASE WRITE HANDLERS (Simulated transactions)
  const handleAddAppointment = (newApp: Appointment) => {
    setAppointments((prev) => [...prev, newApp]);
  };

  const handleUpdateAppointmentStatus = (id: string, newStatus: AppointmentStatus) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    );
  };

  const handleUpdateAppointmentDateTime = (id: string, newDateTime: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, dateTime: newDateTime } : app))
    );
  };

  const handleSaveAppointmentNotes = (id: string, notes: string) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, notes: notes } : app))
    );
  };

  const handleAddBlockedSlot = (newBlock: BlockedSlot) => {
    setBlockedSlots((prev) => [...prev, newBlock]);
  };

  const handleUnblockSlot = (id: string) => {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-warm-50 text-warm-950 flex flex-col antialiased selection:bg-terapia-200 selection:text-terapia-700">
      
      {/* Clinically Clean Humanized Header */}
      <header className="border-b border-warm-200 bg-white/75 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={holosLogo} 
              alt="Espaço Holos Logo" 
              className="w-12 h-12 rounded-full object-cover border border-warm-200 shadow-xs ring-4 ring-warm-100 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-terapia-700">
                <Heart className="w-3.5 h-3.5 fill-current text-terapia-700 animate-pulse" />
                <p className="text-[10px] font-sans font-semibold tracking-wider uppercase">
                  Espaço Holos • Cuidados Especiais
                </p>
              </div>
              
              <h1 className="text-xl font-serif font-black text-warm-950 tracking-tight flex items-center gap-2">
                <span>Agendamento de Terapias</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warm-100 border border-warm-200 font-sans font-medium text-warm-850">
                  Agenda Online
                </span>
              </h1>
            </div>
          </div>

          {/* Simple Navigation Tabs - optimized for non-tech users with high-contrast highlighted borders */}
          <nav className="flex items-center gap-1.5 bg-warm-200/50 border border-warm-350/50 p-1.5 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              id="tab-patient-portal"
              onClick={() => setActiveMainTab('PORTAL')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                activeMainTab === 'PORTAL'
                  ? 'bg-white text-terapia-700 border-warm-300 font-black shadow-sm scale-102'
                  : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-4 h-4 text-terapia-700" />
              Agendar Consulta 🗓️
            </button>

            <button
              id="tab-therapist-admin"
              onClick={() => setActiveMainTab('ADMIN')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                activeMainTab === 'ADMIN'
                  ? 'bg-white text-terapia-700 border-warm-300 font-black shadow-sm scale-102'
                  : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-terapia-700" />
              Painel do Terapeuta 💼
            </button>

            <button
              id="tab-conflict-simulator"
              onClick={() => setActiveMainTab('SIMULATOR')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                activeMainTab === 'SIMULATOR'
                  ? 'bg-white text-terapia-700 border-warm-300 font-black shadow-sm scale-102'
                  : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/50'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-600" />
              Simulador ⚡
            </button>

            <button
              id="tab-spec-viewer"
              onClick={() => setActiveMainTab('SPEC')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                activeMainTab === 'SPEC'
                  ? 'bg-white text-terapia-700 border-warm-300 font-black shadow-sm scale-102'
                  : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-terapia-700" />
              Manual do Sistema 📖
            </button>
          </nav>
        </div>
      </header>

      {/* Human welcome introduction for non-technical users */}
      <div className="bg-white border-b border-warm-200 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-2.5">
          <Badge text="Prático, Calmo e Sem Complicações" />
          <h2 className="text-xl sm:text-2xl font-serif font-medium text-warm-950">
            Boas-vindas ao seu Espaço de Bem-Estar e Harmonia
          </h2>
          <p className="text-sm text-warm-850 max-w-2xl mx-auto leading-relaxed">
            Seja você paciente ou profissional, nossa agenda inteligente foi desenhada para ser simples,
            limpa e livre de estresse. Aqui você agenda fusos e sessões sem precisar criar contas de acesso demoradas.
          </p>
        </div>
      </div>

      {/* Main Sandbox Interactive Experience Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8" id="primary-app-viewport">
        
        {/* Dynamic transition of panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMainTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            {activeMainTab === 'SPEC' && (
              <DocViewer />
            )}

             {activeMainTab === 'PORTAL' && (
              <PatientPortal 
                services={services}
                existingAppointments={appointments}
                blockedSlots={blockedSlots}
                onAddAppointment={handleAddAppointment}
                clinicAddress={clinicAddress}
                onlineMeetingLink={onlineMeetingLink}
                therapistContact={therapistContact}
              />
            )}

            {activeMainTab === 'ADMIN' && (
              <TherapistAdmin 
                services={services}
                appointments={appointments}
                blockedSlots={blockedSlots}
                onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
                onUpdateAppointmentDateTime={handleUpdateAppointmentDateTime}
                onSaveAppointmentNotes={handleSaveAppointmentNotes}
                onAddBlockedSlot={handleAddBlockedSlot}
                onDeleteBlockedSlot={handleUnblockSlot}
                clinicAddress={clinicAddress}
                onChangeClinicAddress={setClinicAddress}
                onlineMeetingLink={onlineMeetingLink}
                onChangeOnlineMeetingLink={setOnlineMeetingLink}
                onUpdateServicePrice={handleUpdateServicePrice}
                onUpdateServiceDuration={handleUpdateServiceDuration}
                therapistContact={therapistContact}
                onUpdateTherapistContact={setTherapistContact}
              />
            )}

            {activeMainTab === 'SIMULATOR' && (
              <ConflictSimulator />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Warm human footer */}
      <footer className="border-t border-warm-200 bg-white py-8 text-center text-xs text-warm-850">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Espaço Holos • Terapias Integrativas. Atendimento humanizado e focado em você.</p>
          <div className="flex items-center gap-4 text-warm-850">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-terapia-700" />
              Proteção de Dados: em conformidade com a LGPD
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple internal helper component
function Badge({ text }: { text: string }) {
  return (
    <span className="inline-block bg-terapia-50 border border-terapia-200 text-terapia-700 text-[10px] font-sans font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
      {text}
    </span>
  );
}
