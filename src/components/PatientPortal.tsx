/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Clock, User, Phone, Mail, CheckCircle, Video, AlertCircle, Heart, Check, Brain, Sparkles, Instagram, Info } from 'lucide-react';
import { Service, Appointment, BlockedSlot, TherapistContact } from '../types';
import { validateBookingSlot, generateDailyTimeSlots } from '../utils/bookingRules';

// Import newly generated therapeutic images and logo
import holosLogo from '../assets/images/holos_logo_1779572745868.png';
import reflexologiaImg from '../assets/images/reflexologia_service_1779572762940.png';
import imtImg from '../assets/images/imt_service_1779572781493.png';
import sereneRoomImg from '../assets/images/serene_room_1779576499863.png';

interface PatientPortalProps {
  services: Service[];
  existingAppointments: Appointment[];
  blockedSlots: BlockedSlot[];
  onAddAppointment: (appointment: Appointment) => void;
  clinicAddress: string;
  onlineMeetingLink: string;
  therapistContact: TherapistContact;
}

export default function PatientPortal({
  services,
  existingAppointments,
  blockedSlots,
  onAddAppointment,
  clinicAddress,
  onlineMeetingLink,
  therapistContact,
}: PatientPortalProps) {
  const [selectedService, setSelectedService] = useState<Service>(services[0]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-05-25'); // Monday (future)
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [activePortalTab, setActivePortalTab] = useState<'BOOKING' | 'CONTACT'>('BOOKING');
  
  // Form fields
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  
  // Status feedback
  const [bookingResult, setBookingResult] = useState<{ success: boolean; message: string } | null>(null);

  // Helper properties for dates
  const dates = [
    { dateStr: '2026-05-25', label: 'Segunda', dayNum: 25, formatted: 'Segunda-feira, 25 de Maio' },
    { dateStr: '2026-05-26', label: 'Terça', dayNum: 26, formatted: 'Terça-feira, 26 de Maio' },
    { dateStr: '2026-05-27', label: 'Quarta', dayNum: 27, formatted: 'Quarta-feira, 27 de Maio' },
    { dateStr: '2026-05-28', label: 'Quinta', dayNum: 28, formatted: 'Quinta-feira, 28 de Maio' },
    { dateStr: '2026-05-29', label: 'Sexta', dayNum: 29, formatted: 'Sexta-feira, 29 de Maio' },
    { dateStr: '2026-05-30', label: 'Sábado', dayNum: 30, formatted: 'Sábado, 30 de Maio' }, 
    { dateStr: '2026-05-31', label: 'Domingo', dayNum: 31, formatted: 'Domingo, 31 de Maio' },
  ];

  const timeSlots = generateDailyTimeSlots(selectedDate);

  const morningSlots = timeSlots.filter(t => {
    const hour = parseInt(t.split(':')[0], 10);
    return hour < 12;
  });
  
  const afternoonSlots = timeSlots.filter(t => {
    const hour = parseInt(t.split(':')[0], 10);
    return hour >= 12;
  });

  const isReflexologySelected = selectedService.type === 'REFLEXOLOGY';

  const renderTimeButton = (time: string) => {
    const isSelected = selectedTime === time;
    const fullDateTimeStr = `${selectedDate}T${time}:00.000Z`;
    const tempValidation = validateBookingSlot({
      proposedDateTimeStr: fullDateTimeStr,
      service: selectedService,
      existingAppointments,
      blockedSlots,
    });

    const activeThemeStyles = isSelected
      ? isReflexologySelected
        ? 'bg-emerald-700 text-white border-emerald-850 font-black shadow-md ring-2 ring-emerald-100 scale-102'
        : 'bg-indigo-600 text-white border-indigo-750 font-black shadow-md ring-2 ring-indigo-100 scale-102'
      : !tempValidation.isValid
      ? 'bg-red-50/40 border-red-200 text-red-700 cursor-not-allowed opacity-60'
      : 'bg-warm-100 hover:bg-white border-warm-250 text-warm-950 font-extrabold hover:border-warm-350 hover:shadow-2xs hover:-translate-y-0.5';

    return (
      <button
        key={time}
        onClick={() => {
          setSelectedTime(time);
          setBookingResult(null);
        }}
        type="button"
        title={!tempValidation.isValid ? `Regra de agendamento violada: ${tempValidation.reason}` : 'Horário livre'}
        className={`py-2 px-1 rounded-xl text-center font-mono text-xs transition-all border flex flex-col items-center justify-center min-h-[52px] cursor-pointer select-none ${activeThemeStyles}`}
      >
        <span className="font-extrabold text-[13px]">{time}</span>
        {!tempValidation.isValid ? (
          <span className="text-[8px] px-1 py-0.5 bg-red-55 bg-red-100 text-red-700 rounded-sm font-sans font-bold leading-none mt-0.5 scale-90">Ocupado</span>
        ) : isSelected ? (
          <span className="text-[8px] px-1 py-0.5 bg-white/20 text-white rounded-sm font-sans font-extrabold leading-none mt-0.5 scale-90">Ativo ✓</span>
        ) : (
          <span className="text-[8px] px-1 py-0.5 bg-emerald-100 text-emerald-850 rounded-sm border border-emerald-250/20 font-sans font-bold leading-none mt-0.5 scale-90">Livre</span>
        )}
      </button>
    );
  };

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      setBookingResult({ success: false, message: 'Por favor, toque em um horário disponível antes de confirmar.' });
      return;
    }
    if (!name.trim()) {
      setBookingResult({ success: false, message: 'Por favor, escreva o seu nome completo.' });
      return;
    }
    if (!whatsapp.trim()) {
      setBookingResult({ success: false, message: 'Por favor, informe seu número de WhatsApp.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setBookingResult({ success: false, message: 'Por favor, digite um e-mail válido para receber a confirmação.' });
      return;
    }

    // Combine Date & Time into an ISO timestamp
    const [hours, minutes] = selectedTime.split(':');
    const proposedDate = new Date(`${selectedDate}T${hours}:${minutes}:00.000Z`);
    const isoString = proposedDate.toISOString();

    // Challenge the business validation rules
    const validation = validateBookingSlot({
      proposedDateTimeStr: isoString,
      service: selectedService,
      existingAppointments,
      blockedSlots,
    });

    if (!validation.isValid) {
      setBookingResult({
        success: false,
        message: validation.reason || 'Desculpe, este horário não cumpre as regras operacionais da clínica.',
      });
      return;
    }

    // Success - Create the entity
    const generatedMeetLink = selectedService.type === 'IMT'
      ? `https://meet.google.com/imt-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
      : undefined;

    const newAppointment: Appointment = {
      id: `app-${Math.random().toString(36).substring(2, 9)}`,
      serviceId: selectedService.id,
      therapistId: 'therapist-1',
      dateTime: isoString,
      durationMinutes: selectedService.durationMinutes,
      patientName: name,
      patientWhatsapp: whatsapp,
      patientEmail: email,
      status: 'PENDENTE',
      notes: selectedService.type === 'IMT' ? `Sessão Online integrada. Link do Meet/Zoom: ${onlineMeetingLink}` : `Atendimento presencial no consultório: ${clinicAddress}`,
      createdAt: new Date().toISOString(),
    };

    const meetingDetails = selectedService.modality === 'ONLINE'
      ? `Sessão Online integrada. Acesse na hora pelo link: ${onlineMeetingLink}`
      : `Endereço para atendimento presencial na clínica: ${clinicAddress}`;

    onAddAppointment(newAppointment);
    setBookingResult({
      success: true,
      message: `Tudo pronto! Seu agendamento foi registrado como PENDENTE DE CONFIRMAÇÃO na clínica. Entraremos em contato pelo WhatsApp para certificar os dados.

📌 Instruções importantes: ${meetingDetails}`,
    });

    // Reset Form
    setName('');
    setWhatsapp('');
    setEmail('');
    setSelectedTime('');
  };

  const getSelectedDateLabel = () => {
    const dMatch = dates.find(d => d.dateStr === selectedDate);
    return dMatch ? dMatch.formatted : selectedDate;
  };

  return (
    <div className="bg-white border border-warm-200 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8" id="patient-portal-container">
      
      {/* Expanded Premium Welcoming & Cozy Consulting Room Introduction */}
      <div className="bg-gradient-to-br from-warm-50 via-warm-100/35 to-white border border-warm-200 rounded-3xl p-6 sm:p-8 lg:p-10 mb-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center" id="expanded-welcome-banner">
        
        {/* Left column: Larger descriptive context */}
        <div className="md:col-span-7 space-y-4 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="text-xs font-sans font-extrabold text-terapia-700 bg-terapia-55 bg-terapia-55/70 px-3.5 py-1 rounded-full border border-terapia-200/50 flex items-center gap-1.5 shadow-3xs">
              <Sparkles className="w-3.5 h-3.5 text-terapia-700" /> ESPAÇO HOLOS
            </span>
            <span className="text-xs font-sans font-extrabold text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/50 flex items-center gap-1.5 shadow-3xs">
              <Brain className="w-3.5 h-3.5 text-indigo-700" /> TERAPIAS INTEGRATIVAS
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div className="bg-white p-3 rounded-full border border-warm-200/80 shadow-xs shrink-0 self-center md:self-start">
              <img 
                src={holosLogo} 
                alt="Espaço Holos Emblema" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-warm-950 tracking-tight leading-tight">
                Seu Refúgio de Paz & Equilíbrio Integral
              </h1>
              <p className="text-sm sm:text-base text-warm-900 leading-relaxed font-bold">
                Seja muito bem-vindo(a) ao seu espaço sagrado de restauração mental e física.
              </p>
            </div>
          </div>
          
          <p className="text-xs sm:text-sm text-warm-800 leading-relaxed font-semibold">
            Proporcione a si mesmo(a) um instante de autocuidado profundo e revigorante. Aqui, cada detalhe foi sintonizado para o seu acolhimento e escuta atenta. Abaixo, explore as nossas principais terapias corporais e mentais, escolha a melhor data e horário em nossa agenda automatizada e confirme seu momento de bem-estar.
          </p>
        </div>

        {/* Right column: Serene and Calming consulting room frame with overlay details */}
        <div className="md:col-span-5 w-full">
          <div className="relative group rounded-2xl overflow-hidden border border-warm-250 shadow-sm bg-warm-150 aspect-video md:aspect-[4/3] lg:aspect-video">
            <img 
              src={sereneRoomImg} 
              alt="Sala de Atendimento Espaço Holos" 
              className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-103"
              referrerPolicy="no-referrer"
            />
            {/* Soft gradient overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-warm-950/70 via-warm-950/20 to-transparent"></div>
            
            {/* Visual labels overlay */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
              <span className="text-[10px] font-sans font-extrabold tracking-wider uppercase bg-warm-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 shadow-3xs">
                🛋️ Nosso Consultório
              </span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-warm-200 bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-md">
                AMBIENTE SERENO & SEGURO
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Premium, Interactive & High-Contrast Tab Navigation - Optimized for visibility & effortless clicks */}
      <div className="space-y-2 mb-8 max-w-2xl" id="portal-tab-navigation">
        <span className="block text-[10px] font-sans font-black text-warm-850 uppercase tracking-widest flex items-center gap-1.5 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-terapia-700 animate-pulse" />
          Selecione uma das opções abaixo para navegar:
        </span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-warm-200/40 p-2 rounded-2xl border-2 border-warm-300 shadow-sm">
          <button
            type="button"
            onClick={() => setActivePortalTab('BOOKING')}
            className={`w-full py-4 px-5 rounded-xl text-xs sm:text-sm font-sans font-black uppercase tracking-wider transition-all duration-300 text-center flex items-center justify-center gap-2.5 cursor-pointer border-2 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 ${
              activePortalTab === 'BOOKING'
                ? 'bg-terapia-700 text-white border-terapia-900 shadow-md ring-4 ring-terapia-100 scale-102 font-black'
                : 'bg-white hover:bg-warm-100 text-warm-900 border-warm-300 font-extrabold hover:border-warm-450'
            }`}
          >
            <span className="text-base sm:text-lg">🗓️</span>
            <span>Marcar Consulta</span>
            {activePortalTab === 'BOOKING' && (
              <span className="text-[9px] px-2 py-0.5 bg-white/20 text-white rounded-full font-sans font-black leading-none uppercase">Ativo</span>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setActivePortalTab('CONTACT')}
            className={`w-full py-4 px-5 rounded-xl text-xs sm:text-sm font-sans font-black uppercase tracking-wider transition-all duration-300 text-center flex items-center justify-center gap-2.5 cursor-pointer border-2 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 ${
              activePortalTab === 'CONTACT'
                ? 'bg-indigo-650 bg-indigo-600 text-white border-indigo-800 shadow-md ring-4 ring-indigo-100 scale-102 font-black'
                : 'bg-white hover:bg-warm-100 text-warm-900 border-warm-300 font-extrabold hover:border-warm-450'
            }`}
          >
            <span className="text-base sm:text-lg">👤</span>
            <span>Informações do Terapeuta</span>
            {activePortalTab === 'CONTACT' && (
              <span className="text-[9px] px-2 py-0.5 bg-white/20 text-white rounded-full font-sans font-black leading-none uppercase">Ativo</span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activePortalTab === 'BOOKING' ? (
          <motion.div
            key="booking-tab-grid"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Left column: Setup steps */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-8">
              
              {/* Passo 1 - Seleção de Serviço */}
              <div id="service-selection-section" className="bg-white p-5 rounded-2xl border border-warm-200 shadow-3xs space-y-4">
                <div className="flex items-center gap-3 border-b border-warm-101 border-warm-200 pb-3">
                  <span className="text-xs bg-terapia-700 text-white font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    01
                  </span>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-warm-950 tracking-wide uppercase">
                      Serviço Desejado
                    </h3>
                    <p className="text-[11px] text-warm-850 -mt-0.5 font-medium">Selecione a terapia ideal de acordo com suas necessidades</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((srv) => {
                    const isSelected = selectedService.id === srv.id;
                    const isReflexology = srv.type === 'REFLEXOLOGY';
                    const srvImage = isReflexology ? reflexologiaImg : imtImg;
                    
                    // Style variables for unique card designs
                    const cardStyles = isReflexology
                      ? isSelected
                        ? 'bg-emerald-50/40 border-emerald-700 ring-2 ring-emerald-100 shadow-xs'
                        : 'bg-white hover:border-emerald-300 hover:bg-emerald-50/5 border-warm-200 shadow-2xs hover:shadow-xs'
                      : isSelected
                        ? 'bg-indigo-50/40 border-indigo-700 ring-2 ring-indigo-100 shadow-xs'
                        : 'bg-white hover:border-indigo-300 hover:bg-indigo-50/5 border-warm-200 shadow-2xs hover:shadow-xs';

                    const tagStyles = isReflexology
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-250/50'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-250/50';

                    const titleColor = isReflexology ? 'text-emerald-950 hover:text-emerald-700' : 'text-indigo-950 hover:text-indigo-700';
                    const priceColor = isReflexology ? 'text-emerald-700 font-bold' : 'text-indigo-700 font-bold';

                    const sectionTag = isReflexology ? 'Corpo • Reflexologia' : 'Mente • Imagens Mentais';
                    const tagline = isReflexology
                      ? 'Ativação dos meridianos reflexos para desbloqueio somático integral.'
                      : 'Dissolução mental guiada de ansiedades severas e estresse psicossomático.';

                    return (
                      <button
                        key={srv.id}
                        id={`btn-select-service-${srv.id}`}
                        onClick={() => {
                          setSelectedService(srv);
                          setSelectedTime('');
                          setBookingResult(null);
                        }}
                        type="button"
                        className={`text-left rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-full cursor-pointer group ${cardStyles}`}
                        style={{ minHeight: '390px' }}
                      >
                        {/* Visual Card Image */}
                        <div className="w-full h-36 overflow-hidden relative border-b border-warm-101 border-warm-200 bg-warm-100">
                          <img 
                            src={srvImage} 
                            alt={srv.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-sans font-bold tracking-wider uppercase shadow-xs border ${tagStyles}`}>
                              {srv.modality === 'ONLINE' ? '🎥 ONLINE' : '📍 PRESENCIAL'}
                            </span>
                            <span className="text-[9px] bg-white/95 backdrop-blur-xs text-warm-900 px-2 py-0.5 rounded-full font-sans font-bold tracking-wider uppercase border border-warm-250/50 shadow-xs">
                              {sectionTag}
                            </span>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="p-4 flex-1 flex flex-col justify-between w-full space-y-3">
                          <div className="space-y-1.5">
                            <h4 className={`font-serif font-black text-base leading-tight ${titleColor}`}>
                              {srv.name}
                            </h4>
                            <p className="text-[10px] font-sans font-semibold text-warm-850 leading-relaxed italic">
                              "{tagline}"
                            </p>
                            <p className="text-[11px] text-warm-850 leading-relaxed font-semibold">
                              {srv.description}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className={`flex items-center justify-between text-xs font-sans text-warm-850 border-t ${isReflexology ? 'border-emerald-100' : 'border-indigo-100'} pt-2.5`}>
                              <span className="flex items-center gap-1.5 font-bold text-[11px]">
                                <Clock className={`w-4 h-4 shrink-0 ${isReflexology ? 'text-emerald-600' : 'text-indigo-650 text-indigo-600'}`} />
                                {srv.durationMinutes} minutos
                              </span>
                              <div className="text-right">
                                <span className="text-[9px] text-warm-400 block -mb-0.5 leading-none font-bold uppercase tracking-wider">Investimento</span>
                                <span className={`font-serif font-black text-sm ${priceColor}`}>
                                  R$ {srv.price.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* EXPLICIT TACTILE BUTTON FOR OPTIMIZED USER INTERACTION */}
                            <div className={`w-full py-2.5 px-3.5 rounded-xl border text-[10px] font-sans font-extrabold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all shadow-3xs ${
                              isSelected
                                ? isReflexology
                                  ? 'bg-emerald-700 text-white border-emerald-850 shadow-sm'
                                  : 'bg-indigo-600 text-white border-indigo-750 shadow-sm'
                                : isReflexology
                                ? 'bg-emerald-50/50 text-emerald-800 border-emerald-200/70 group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-800'
                                : 'bg-indigo-50/50 text-indigo-800 border-indigo-200/70 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-750'
                            }`}>
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                  <span>Terapia Ativa ✓</span>
                                </>
                              ) : (
                                <>
                                  <span>👉 Clique Para Escolher</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Selection Indicator Badge */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 flex h-6 w-6 z-10">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isReflexology ? 'bg-emerald-600' : 'bg-indigo-600'}`}></span>
                            <span className={`relative inline-flex rounded-full h-6 w-6 items-center justify-center text-white ${isReflexology ? 'bg-emerald-600' : 'bg-indigo-600 shadow-xs'}`}>
                              <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passo 2 - Seleção de data */}
              <div id="date-selection-section" className="bg-white p-5 rounded-2xl border border-warm-200 shadow-3xs space-y-4">
                <div className="flex items-center gap-3 border-b border-warm-101 border-warm-200 pb-3">
                  <span className="text-xs bg-terapia-700 text-white font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    02
                  </span>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-warm-950 tracking-wide uppercase">
                      Data de Preferência
                    </h3>
                    <p className="text-[11px] text-warm-850 -mt-0.5 font-medium">Selecione o melhor dia de segunda a sexta</p>
                  </div>
                </div>
                
                <p className="text-[11px] text-amber-900 leading-relaxed -mt-1 font-semibold bg-amber-50/65 p-2.5 rounded-xl border border-amber-250/20 shadow-3xs">
                  ⚠️ <strong>Calendário Demonstrativo:</strong> Atendemos de segunda a sexta. Fins de semana (sábados e domingos) estão representados em vermelho apenas para certificar o funcionamento das validações operacionais de impedimento automática.
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {dates.map((d) => {
                    const isSelected = selectedDate === d.dateStr;
                    const isWeekend = d.label === 'Sábado' || d.label === 'Domingo';
                    return (
                      <button
                        key={d.dateStr}
                        onClick={() => {
                          setSelectedDate(d.dateStr);
                          setSelectedTime('');
                          setBookingResult(null);
                        }}
                        type="button"
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all cursor-pointer shadow-3xs hover:-translate-y-0.5 ${
                          isSelected
                            ? isReflexologySelected
                              ? 'bg-emerald-700 border-emerald-850 text-white font-bold ring-2 ring-emerald-100'
                              : 'bg-indigo-600 border-indigo-750 text-white font-bold ring-2 ring-indigo-100'
                            : isWeekend
                            ? 'bg-red-50/80 border-red-200 text-red-800 cursor-not-allowed opacity-80'
                            : 'bg-warm-100 hover:bg-warm-100/80 border-warm-250 text-warm-950'
                        }`}
                      >
                        <span className={`text-[9px] font-sans font-extrabold uppercase tracking-wider ${isSelected ? 'text-white/90' : 'text-warm-850'}`}>
                          {d.label}
                        </span>
                        <span className="text-xl font-serif font-black my-1 leading-none">{d.dayNum}</span>
                        <span className={`text-[8px] font-sans font-extrabold uppercase tracking-widest leading-none ${isSelected ? 'text-white/80' : isWeekend ? 'text-red-700 font-black' : 'text-warm-450'}`}>
                          {isWeekend ? 'Fechado' : isSelected ? 'Ativo ✓' : 'Escolher'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Passo 3 - Escolha o horário */}
              <div id="time-selection-section" className="bg-white p-5 rounded-2xl border border-warm-200 shadow-3xs space-y-4">
                <div className="flex items-center gap-3 border-b border-warm-101 border-warm-200 pb-3">
                  <span className="text-xs bg-terapia-700 text-white font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    03
                  </span>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-warm-950 tracking-wide uppercase">
                      Horário de Preferência
                    </h3>
                    <p className="text-[11px] text-warm-850 -mt-0.5 font-medium">Os horários disponíveis são das 08:00 às 19:00</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Período da Manhã */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-warm-200 p-1.5 px-3 rounded-lg flex items-center gap-1 w-max shadow-3xs">
                      🌅 Período da Manhã (08h às 12h)
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 bg-warm-50/40 p-3 rounded-xl border border-warm-200/55">
                      {morningSlots.map((time) => renderTimeButton(time))}
                      {morningSlots.length === 0 && (
                        <p className="text-[11px] text-warm-500 py-2 col-span-full italic">Não há horários de manhã.</p>
                      )}
                    </div>
                  </div>

                  {/* Período da Tarde */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-indigo-850 text-indigo-800 bg-indigo-50 border border-warm-200 p-1.5 px-3 rounded-lg flex items-center gap-1 w-max shadow-3xs">
                      ☀️ Período da Tarde (12h às 19h)
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 bg-warm-50/40 p-3 rounded-xl border border-warm-200/55">
                      {afternoonSlots.map((time) => renderTimeButton(time))}
                      {afternoonSlots.length === 0 && (
                        <p className="text-[11px] text-warm-500 py-2 col-span-full italic">Não há horários de tarde.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right column: Form and Submit summary */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-6">
              <form onSubmit={handleBooking} className="space-y-5 bg-white p-5 rounded-2xl border border-warm-200 shadow-3xs">
                <div className="flex items-center gap-3 border-b border-warm-101 border-warm-200 pb-3">
                  <span className={`text-xs text-white font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isReflexologySelected ? 'bg-emerald-600' : 'bg-indigo-600'
                  }`}>
                    04
                  </span>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-warm-950 tracking-wide uppercase">
                      Identificação do Cliente
                    </h3>
                    <p className="text-[11px] text-warm-850 -mt-0.5 font-medium">Informe seus dados para contato e avisos</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-850 uppercase tracking-wide">Seu Nome Completo</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-warm-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Nome e sobrenome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-warm-50/40 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-950 focus:outline-none transition-all font-sans ${
                        isReflexologySelected ? 'focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200' : 'focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-850 uppercase tracking-wide">Seu WhatsApp</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-warm-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={`w-full bg-warm-50/40 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-950 focus:outline-none transition-all font-sans ${
                        isReflexologySelected ? 'focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200' : 'focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-warm-450 leading-relaxed font-semibold">Escreva seu número com DDD para enviarmos lembretes da consulta.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-850 uppercase tracking-wide">Seu E-mail</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-warm-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="exemplo@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-warm-50/40 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-950 focus:outline-none transition-all font-sans ${
                        isReflexologySelected ? 'focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200' : 'focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200'
                      }`}
                    />
                  </div>
                </div>

                {/* Resume Voucher - Card com Visual Único */}
                <div className={`border rounded-2xl overflow-hidden transition-all duration-300 shadow-sm relative ${
                  isReflexologySelected
                    ? 'border-emerald-200 bg-gradient-to-br from-white via-emerald-50/10 to-white'
                    : 'border-indigo-200 bg-gradient-to-br from-white via-indigo-50/10 to-white'
                }`}>
                  {/* Header inside ticket */}
                  <div className={`px-4 py-2.5 text-[10px] font-sans font-extrabold tracking-wider uppercase text-center flex items-center justify-center gap-1.5 ${
                    isReflexologySelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}>
                    <span>🎟️ VOUCHER DE ATENDIMENTO INTEGRADO</span>
                  </div>

                  <div className="p-4 sm:p-5 text-xs text-warm-950 space-y-3.5">
                    <div className="flex justify-between items-center pb-2 border-b border-dashed border-warm-200">
                      <span className="text-warm-850 font-semibold text-[11px] uppercase tracking-wider">Terapia Desejada:</span>
                      <div className="text-right">
                        <span className={`block font-serif font-black text-sm leading-tight ${
                          isReflexologySelected ? 'text-emerald-950' : 'text-indigo-950'
                        }`}>
                          {selectedService.name}
                        </span>
                        <span className="text-[9px] text-warm-450 uppercase font-bold tracking-wider">
                          {isReflexologySelected ? 'Física • Corporal' : 'Mental • Cognitivo'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 border-b border-dashed border-warm-200 pb-3">
                      <span className="text-warm-800 font-bold text-[10px] uppercase tracking-wider mb-1">Local & Informações Críticas:</span>
                      {selectedService.modality === 'ONLINE' ? (
                        <div className="bg-indigo-50/80 border border-indigo-150 p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span>Sessão Online (Chamada Virtual)</span>
                          </div>
                          <p className="text-[10px] text-indigo-900 leading-relaxed font-semibold">
                            Um link exclusivo para sua chamada foi gerado e integrado pelo terapeuta. Prepare seu celular ou fones de ouvido:
                            <span className="block font-mono text-[9px] truncate text-indigo-650 bg-white/90 border border-indigo-100 rounded-md px-2 py-1 mt-1.5 select-all" title={onlineMeetingLink}>
                              {onlineMeetingLink}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/85 border border-emerald-150 p-3 rounded-xl space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-955">
                            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>Consultório Presencial</span>
                          </div>
                          <p className="text-[10px] text-emerald-900 leading-balanced font-semibold">
                            Compareça ao consultório do terapeuta no dia agendado. Recomendamos chegar com 10 minutos de antecedência florestosa:
                            <strong className="block text-emerald-955 font-bold bg-white/90 border border-emerald-100 rounded-md px-2 py-1 mt-1.5">{clinicAddress}</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ticket separation dash line decoration */}
                    <div className="relative flex items-center justify-between -mx-5 sm:-mx-6 font-mono text-warm-350 tracking-wider">
                      <span className="w-4 h-4 rounded-full bg-warm-50 border-r border-warm-200/80 -ml-2"></span>
                      <span className="border-t border-dashed border-warm-250 flex-1 mx-2"></span>
                      <span className="w-4 h-4 rounded-full bg-warm-50 border-l border-warm-200/80 -mr-2"></span>
                    </div>

                    <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
                      <span className="text-warm-850 font-bold text-[10px] uppercase tracking-wider">Agendamento Solicitado para:</span>
                      <span className={`font-mono font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 shadow-3xs border ${
                        isReflexologySelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-indigo-50 text-indigo-805 text-indigo-800 border-indigo-200'
                      }`}>
                        <Calendar className="w-3.5 h-3.5 text-current shrink-0" />
                        {getSelectedDateLabel()} às {selectedTime || '--:--'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center border-t border-warm-101 border-warm-200/70 pt-3 text-warm-955 font-medium">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-warm-800">Total a pagar na clínica:</span>
                      <span className={`font-serif font-black text-base ${
                        isReflexologySelected ? 'text-emerald-700' : 'text-indigo-700'
                      }`}>
                        R$ {selectedService.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  type="submit"
                  className={`w-full mt-5 text-white font-extrabold tracking-wider uppercase py-4 px-6 rounded-2xl shadow-md transition-all text-xs flex items-center justify-center gap-2.5 cursor-pointer border scale-100 hover:scale-[1.015] active:scale-[0.985] ${
                    isReflexologySelected
                      ? 'bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 hover:shadow-md shadow-emerald-700/20 border-emerald-850'
                      : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 hover:shadow-md shadow-indigo-600/20 border-indigo-750'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  <span>Confirmar Agendamento Terapêutico ➔</span>
                </button>
              </form>

              {/* Feedback Section */}
              <AnimatePresence mode="wait">
                {bookingResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-4 p-4.5 p-4 rounded-2xl border shadow-3xs ${
                      bookingResult.success
                        ? isReflexologySelected
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-250/50'
                          : 'bg-indigo-50 text-indigo-900 border-indigo-250/50'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {bookingResult.success ? (
                        <CheckCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                          isReflexologySelected ? 'text-emerald-700' : 'text-indigo-700'
                        }`} />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h5 className="font-sans font-extrabold text-[10px] uppercase tracking-wider leading-none mb-1">
                          {bookingResult.success ? 'RESERVA SOLICITADA COM SUCESSO' : 'ATENÇÃO: DIA OU HORÁRIO INDISPONÍVEL'}
                        </h5>
                        <p className="text-[11px] mt-1.5 leading-relaxed font-semibold">{bookingResult.message}</p>
                        {bookingResult.success && selectedService.modality === 'ONLINE' && (
                          <div className="mt-3 p-2.5 bg-white border border-warm-200 rounded-xl font-mono text-[10px] text-warm-950 flex flex-col [@media(min-width:340px)]:flex-row [@media(min-width:340px)]:items-center gap-2 shadow-3xs">
                            <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="font-sans text-[11px] font-semibold">
                              Atendimento online integrado:{" "}
                              <a 
                                href={onlineMeetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-650 underline font-extrabold hover:text-indigo-805 transition-colors"
                              >
                                {onlineMeetingLink}
                              </a>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="contact-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-warm-50 via-warm-100/35 to-white border border-warm-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start gap-8 shadow-3xs">
              {/* Profile Avatar / Left Column */}
              <div className="flex flex-col items-center text-center shrink-0 w-full md:w-56 space-y-4">
                <div className="relative">
                  <img 
                    src={holosLogo} 
                    alt={therapistContact.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-warm-200/65"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-1 right-2 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full shadow-xs animate-pulse" title="Profissional Ativo"></div>
                </div>
                <div>
                  <h3 className="text-lg font-serif font-black text-warm-950 leading-tight">{therapistContact.name}</h3>
                  <p className="text-xs font-bold text-terapia-700 bg-terapia-50 border border-terapia-200 rounded-full px-3 py-1 mt-2 inline-block">
                    {therapistContact.specialty}
                  </p>
                </div>
              </div>

              {/* Bio & Details / Right Column */}
              <div className="flex-1 space-y-5 w-full">
                <div className="bg-white border border-warm-200 p-5 rounded-2xl relative shadow-3xs">
                  <span className="absolute top-3 right-4 opacity-15 text-5xl font-serif text-warm-400 select-none leading-none">“</span>
                  <h4 className="text-xs font-bold font-sans text-warm-900 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-terapia-700" />
                    Biografia do Terapeuta
                  </h4>
                  <p className="text-xs text-warm-850 leading-relaxed font-semibold">
                    {therapistContact.bio}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone card */}
                  <div className="bg-white border border-warm-200 rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-3xs transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-700 shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-warm-400 uppercase font-black tracking-wider leading-none block mb-0.5">WhatsApp de Atendimento</span>
                      <a 
                        href={`https://wa.me/55${therapistContact.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-extrabold text-warm-950 hover:text-emerald-700 transition-colors"
                      >
                        {therapistContact.phone}
                      </a>
                    </div>
                  </div>

                  {/* Email card */}
                  <div className="bg-white border border-warm-200 rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-3xs transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-indigo-700 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-warm-400 uppercase font-black tracking-wider leading-none block mb-0.5">E-mail de Contato</span>
                      <a 
                        href={`mailto:${therapistContact.email}`} 
                        className="text-sm font-extrabold text-warm-950 hover:text-indigo-700 transition-colors"
                      >
                        {therapistContact.email}
                      </a>
                    </div>
                  </div>

                  {/* Instagram card */}
                  <div className="bg-white border border-warm-200 rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-3xs transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-100/50 flex items-center justify-center text-pink-700 shrink-0">
                      <Instagram className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-warm-400 uppercase font-black tracking-wider leading-none block mb-0.5">Instagram Profissional</span>
                      <a 
                        href={`https://instagram.com/${therapistContact.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-extrabold text-warm-950 hover:text-pink-700 transition-colors"
                      >
                        {therapistContact.instagram}
                      </a>
                    </div>
                  </div>

                  {/* Working Hours Card */}
                  <div className="bg-white border border-warm-200 rounded-2xl p-4 flex gap-3.5 items-center hover:shadow-3xs transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-warm-105 flex items-center justify-center text-amber-700 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-warm-400 uppercase font-black tracking-wider leading-none block mb-0.5">Horário de Atividades</span>
                      <span className="text-xs font-extrabold text-warm-950">
                        {therapistContact.workingHours}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consultation Info details */}
                <div className="bg-warm-50/70 border border-warm-200 p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-warm-900 uppercase tracking-widest border-b border-warm-200 pb-2">
                    🌍 Salas Operacionais de Atendimento
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white border border-warm-200 p-4 rounded-xl space-y-1 shadow-3xs">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Consultório Presencial</span>
                      </div>
                      <p className="text-xs text-warm-950 font-bold font-sans pt-1 leading-normal">{clinicAddress}</p>
                      <p className="text-[10px] text-warm-450 leading-tight">Compareça no dia agendado. Há estacionamento conveniado na frente.</p>
                    </div>

                    <div className="bg-white border border-warm-200 p-4 rounded-xl space-y-1 shadow-3xs">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700">
                        <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Sala Virtual Integrada</span>
                      </div>
                      <p className="text-xs text-indigo-700 font-extrabold font-mono pt-1 leading-normal break-all">{onlineMeetingLink}</p>
                      <p className="text-[10px] text-warm-450 leading-tight">Salas de conferência criptografadas e otimizadas para notebooks e celulares.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
