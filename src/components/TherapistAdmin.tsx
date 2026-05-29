/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar as CalendarIcon, Clock, Link as LinkIcon, 
  Trash2, Plus, LogOut, Check, X, ShieldAlert, Lock, FileText, 
  DollarSign, RefreshCw, AlertTriangle, Instagram, User
} from 'lucide-react';
import { Appointment, BlockedSlot, Service, AppointmentStatus, TherapistContact } from '../types';

interface TherapistAdminProps {
  services: Service[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  onUpdateAppointmentStatus: (id: string, newStatus: AppointmentStatus) => void;
  onUpdateAppointmentDateTime: (id: string, newDateTime: string) => void;
  onSaveAppointmentNotes: (id: string, notes: string) => void;
  onAddBlockedSlot: (blocked: BlockedSlot) => void;
  onDeleteBlockedSlot: (id: string) => void;
  clinicAddress: string;
  onChangeClinicAddress: (address: string) => void;
  onlineMeetingLink: string;
  onChangeOnlineMeetingLink: (link: string) => void;
  onUpdateServicePrice: (id: string, price: number) => void;
  onUpdateServiceDuration: (id: string, duration: number) => void;
  therapistContact: TherapistContact;
  onUpdateTherapistContact: (contact: TherapistContact) => void;
}

export default function TherapistAdmin({
  services,
  appointments,
  blockedSlots,
  onUpdateAppointmentStatus,
  onUpdateAppointmentDateTime,
  onSaveAppointmentNotes,
  onAddBlockedSlot,
  onDeleteBlockedSlot,
  clinicAddress,
  onChangeClinicAddress,
  onlineMeetingLink,
  onChangeOnlineMeetingLink,
  onUpdateServicePrice,
  onUpdateServiceDuration,
  therapistContact,
  onUpdateTherapistContact,
}: TherapistAdminProps) {
  // Authentication mock state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Start true for seamless MVP presentation
  const [email, setEmail] = useState('carlos@espacoholos.com');
  const [password, setPassword] = useState('••••••••••••');
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState<'AGENDAS' | 'PACIENTES' | 'BLOQUEIOS' | 'CONFIGS'>('AGENDAS');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  // Clinic config temporary states
  const [tempAddress, setTempAddress] = useState(clinicAddress);
  const [tempMeetingLink, setTempMeetingLink] = useState(onlineMeetingLink);
  const [tempReflexologiaPrice, setTempReflexologiaPrice] = useState(() => {
    return services.find(s => s.type === 'REFLEXOLOGY')?.price || 120;
  });
  const [tempImtPrice, setTempImtPrice] = useState(() => {
    return services.find(s => s.type === 'IMT')?.price || 150;
  });
  const [tempReflexologiaDuration, setTempReflexologiaDuration] = useState(() => {
    return services.find(s => s.type === 'REFLEXOLOGY')?.durationMinutes || 60;
  });
  const [tempImtDuration, setTempImtDuration] = useState(() => {
    return services.find(s => s.type === 'IMT')?.durationMinutes || 45;
  });
  const [configsSuccessMsg, setConfigsSuccessMsg] = useState<string | null>(null);

  // Therapist contact edit states
  const [tempName, setTempName] = useState(therapistContact.name);
  const [tempSpecialty, setTempSpecialty] = useState(therapistContact.specialty);
  const [tempBio, setTempBio] = useState(therapistContact.bio);
  const [tempPhone, setTempPhone] = useState(therapistContact.phone);
  const [tempEmail, setTempEmail] = useState(therapistContact.email);
  const [tempInstagram, setTempInstagram] = useState(therapistContact.instagram);
  const [tempWorkingHours, setTempWorkingHours] = useState(therapistContact.workingHours);
  
  // Handlers for edit actions
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-05-25');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');

  // New Blocked slot state
  const [blockDate, setBlockDate] = useState('2026-05-25');
  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('13:30');
  const [blockReason, setBlockReason] = useState('Intervalo de Almoço do Terapeuta');

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  // Logics for calculation of indicators
  const stats = {
    totalRevenue: appointments
      .filter((app) => app.status === 'CONCLUIDO' || app.status === 'CONFIRMADO')
      .reduce((sum, app) => {
        const srv = services.find((s) => s.id === app.serviceId);
        return sum + (srv ? srv.price : 0);
      }, 0),
    totalBookings: appointments.length,
    pendingConfirmations: appointments.filter((app) => app.status === 'PENDENTE').length,
    activePatients: new Set(appointments.map((app) => app.patientEmail)).size,
  };

  // Sort and filter appointments
  const filteredAppointments = appointments.filter((app) => {
    if (selectedDateFilter === 'all') return true;
    return app.dateTime.startsWith(selectedDateFilter);
  }).sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-6 bg-warm-50 border border-warm-200 rounded-3xl h-[520px]" id="admin-login-shield">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white border border-warm-200 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-terapia-55 bg-terapia-50 text-terapia-700 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-warm-950">Acesso Restrito ao Terapeuta</h3>
            <p className="text-warm-850 text-xs mt-1">Sessão segura para proteção de privacidade de prontuários</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-warm-950 mb-1">E-mail de Acesso</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-warm-200 rounded-xl p-3 text-sm text-warm-955 outline-none focus:border-terapia-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-950 mb-1">Senha Secreta</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-warm-200 rounded-xl p-3 text-sm text-warm-955 outline-none focus:border-terapia-700 transition-all"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-terapia-700 hover:bg-terapia-700/90 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Entrar na minha Agenda
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6]/90 border border-warm-200 rounded-[28px] shadow-sm p-5 sm:p-7 lg:p-9 space-y-6" id="therapist-admin-container">
      
      {/* Admin header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-warm-200 pb-5">
        <div>
          <span className="text-terapia-700 text-[10px] font-sans font-bold tracking-wider uppercase bg-terapia-50/70 border border-terapia-200 px-3 py-1 rounded-full">
            Painel de Gestão do Profissional
          </span>
          <h2 className="text-2xl font-serif font-bold text-warm-950 tracking-tight mt-2.5 flex flex-wrap items-center gap-2">
            Workspace Dr. Carlos Emiliano
            <span className="inline-flex items-center justify-center bg-terapia-50 text-terapia-700 text-[10px] px-2.5 py-1 rounded-full border border-terapia-200 font-sans font-medium">
              ● Conexão Segura Ativa
            </span>
          </h2>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="text-xs text-warm-850 hover:text-red-750 flex items-center gap-1.5 bg-white hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all border border-warm-200 hover:border-red-200 cursor-pointer shadow-xs"
        >
          <LogOut className="w-4 h-4 text-warm-350" />
          Sair da Conta
        </button>
      </div>

      {/* Grid Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-warm-200 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-warm-850 mb-1">
            <span className="text-[11px] font-bold text-warm-850 uppercase tracking-wider">Faturamento</span>
            <div className="w-8 h-8 rounded-xl bg-terapia-50 border border-terapia-200 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-terapia-700" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-terapia-700 tracking-tight block mt-1.5">R$ {stats.totalRevenue.toFixed(2)}</span>
          <p className="text-[10px] text-warm-850 mt-1 font-sans">Sessões confirmadas / concluídas</p>
        </div>

        <div className="bg-white border border-warm-200 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-warm-850 mb-1">
            <span className="text-[11px] font-bold text-warm-850 uppercase tracking-wider">Consultas</span>
            <div className="w-8 h-8 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4 text-warm-850" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-warm-955 tracking-tight block mt-1.5">{stats.totalBookings}</span>
          <p className="text-[10px] text-warm-850 mt-1 font-sans">Sessões registradas na semana</p>
        </div>

        <div className="bg-white border border-warm-200 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-warm-850 mb-1">
            <span className="text-[11px] font-bold text-warm-850 uppercase tracking-wider">Aguardando</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-amber-705 tracking-tight block mt-1.5" style={{ color: '#b45309' }}>{stats.pendingConfirmations}</span>
          <p className="text-[10px] text-warm-850 mt-1 font-sans">Aguardando sua confirmação</p>
        </div>

        <div className="bg-white border border-warm-200 p-4 sm:p-5 rounded-2xl shadow-xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-warm-850 mb-1">
            <span className="text-[11px] font-bold text-warm-850 uppercase tracking-wider">Pacientes</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-150 flex items-center justify-center shrink-0" style={{ borderColor: '#c7d2fe' }}>
              <Users className="w-4 h-4 text-indigo-700" />
            </div>
          </div>
          <span className="text-2xl font-bold font-mono text-warm-950 tracking-tight block mt-1.5">{stats.activePatients}</span>
          <p className="text-[10px] text-warm-850 mt-1 font-sans font-medium">Clientes fidelizados</p>
        </div>
      </div>

      {/* Internal Navigation tabs - Modern Segmented Control with premium highlights */}
      <div className="flex flex-wrap gap-2 bg-warm-200/50 p-1.5 rounded-2xl border border-warm-350/50 w-full overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('AGENDAS')}
          className={`flex items-center gap-2 py-2.5 px-4.5 text-[11px] font-sans font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
            activeTab === 'AGENDAS' 
              ? 'bg-white text-terapia-700 shadow-sm font-black border-warm-300' 
              : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/40'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-terapia-700 mt-[-1px]" />
          <span>Agenda da Clínica</span>
        </button>
        <button
          onClick={() => setActiveTab('BLOQUEIOS')}
          className={`flex items-center gap-2 py-2.5 px-4.5 text-[11px] font-sans font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
            activeTab === 'BLOQUEIOS' 
              ? 'bg-white text-terapia-700 shadow-sm font-black border-warm-300' 
              : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/40'
          }`}
        >
          <Clock className="w-4 h-4 text-terapia-700 mt-[-1px]" />
          <span>Bloqueios / Intervalos</span>
        </button>
        <button
          onClick={() => setActiveTab('PACIENTES')}
          className={`flex items-center gap-2 py-2.5 px-4.5 text-[11px] font-sans font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
            activeTab === 'PACIENTES' 
              ? 'bg-white text-terapia-700 shadow-sm font-black border-warm-300' 
              : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/40'
          }`}
        >
          <Users className="w-4 h-4 text-terapia-700 mt-[-1px]" />
          <span>Contato de Pacientes</span>
        </button>
        <button
          id="tab-clinic-settings"
          onClick={() => setActiveTab('CONFIGS')}
          className={`flex items-center gap-2 py-2.5 px-4.5 text-[11px] font-sans font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
            activeTab === 'CONFIGS' 
              ? 'bg-white text-terapia-700 shadow-sm font-black border-warm-300' 
              : 'text-warm-850 border-transparent hover:text-warm-950 hover:bg-white/40'
          }`}
        >
          <span className="text-sm mt-[-1px]">⚙️</span>
          <span>Valores e Local</span>
        </button>
      </div>

      {/* RENDER AGENDAS */}
      {activeTab === 'AGENDAS' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4.5 rounded-2xl border border-warm-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-warm-855">Selecione o dia para conferência:</span>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-warm-50 hover:bg-warm-100 border border-warm-200 text-warm-955 text-xs rounded-xl p-2.5 px-3.5 focus:outline-none focus:border-terapia-700 outline-none cursor-pointer transition-all"
              >
                <option value="all">📅 Ver Todas as Datas</option>
                <option value="2026-05-25">Segunda-feira (25/Mai)</option>
                <option value="2026-05-26">Terça-feira (26/Mai)</option>
                <option value="2026-05-27">Quarta-feira (27/Mai)</option>
                <option value="2026-05-28">Quinta-feira (28/Mai)</option>
                <option value="2026-05-29">Sexta-feira (29/Mai)</option>
              </select>
            </div>
            <p className="text-xs text-warm-850 font-bold bg-warm-100/60 px-3 py-1.5 rounded-lg border border-warm-200">
              {filteredAppointments.length} horários reservados
            </p>
          </div>

          {/* Agenda Table/List */}
          {filteredAppointments.length === 0 ? (
            <div className="border border-warm-200 border-dashed rounded-2xl p-12 text-center text-warm-850 bg-warm-50/40">
              <CalendarIcon className="w-10 h-10 mx-auto text-warm-350 mb-3" />
              <p className="text-sm font-medium">Nenhum atendimento cadastrado para este dia.</p>
              <p className="text-xs text-warm-850 mt-1">Marque um horário no Portal do Paciente para preencher sua agenda!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((app) => {
                const srv = services.find((s) => s.id === app.serviceId);
                const srvTypeStr = srv?.type === 'IMT' ? 'IMT (Online • Vídeo)' : 'Reflexologia (Presencial)';
                const isOnline = srv?.type === 'IMT';
                
                // Formatted dates
                const dObj = new Date(app.dateTime);
                const timeStr = dObj.toTimeString().substring(0, 5);
                const dateStr = app.dateTime.split('T')[0];

                return (
                  <div 
                    key={app.id} 
                    className={`p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition-all bg-white shadow-xs ${
                      app.status === 'CANCELADO' 
                        ? 'border-warm-200 opacity-60' 
                        : isOnline 
                        ? 'border-indigo-150 hover:border-indigo-300' 
                        : 'border-amber-150 hover:border-amber-300'
                    }`}
                  >
                    <div className="space-y-3 flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                          app.status === 'CONFIRMADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          app.status === 'PENDENTE' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          app.status === 'CONCLUIDO' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {app.status}
                        </span>
                        
                        <span className={`text-[10px] font-sans font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                          isOnline ? 'bg-indigo-50 text-indigo-700 border-indigo-150' : 'bg-amber-55 bg-amber-50 text-amber-800 border-warm-200'
                        }`}>
                          {srvTypeStr}
                        </span>

                        <span className="text-xs text-warm-850 font-semibold flex items-center gap-1.5 bg-warm-50 border border-warm-200/55 px-2.5 py-0.5 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-warm-350" />
                          Dia {dateStr} às {timeStr} ({app.durationMinutes} min)
                        </span>
                      </div>

                      <h4 className="text-lg font-serif font-bold text-warm-950">
                        {app.patientName}
                      </h4>

                      <div className="flex flex-wrap text-xs text-warm-850 gap-x-5 gap-y-1 bg-warm-50/55 p-2.5 px-3.5 rounded-xl border border-warm-100/90">
                        <span className="flex items-center gap-1 font-semibold text-warm-955">WhatsApp: <strong className="text-terapia-700 font-mono font-bold">{app.patientWhatsapp}</strong></span>
                        <span className="hidden sm:inline text-warm-200">|</span>
                        <span className="flex items-center gap-1 text-warm-855 font-sans">E-mail: {app.patientEmail}</span>
                      </div>

                      {app.notes && (
                        <div className="bg-warm-50/80 p-3.5 text-xs text-warm-955 rounded-xl border border-warm-200/70 flex items-start gap-2.5 leading-relaxed">
                          <FileText className="w-4 h-4 text-warm-350 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-warm-950">Notas do Caso / Evolução Clínica:</span> {app.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions tools */}
                    <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 border-warm-100 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                      {app.status === 'PENDENTE' && (
                        <button
                          type="button"
                          onClick={() => onUpdateAppointmentStatus(app.id, 'CONFIRMADO')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm"
                        >
                          <Check className="w-4 h-4" /> Confirmar
                        </button>
                      )}
                      {app.status !== 'CONCLUIDO' && app.status !== 'CANCELADO' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onUpdateAppointmentStatus(app.id, 'CONCLUIDO')}
                            className="bg-terapia-700 hover:bg-terapia-700/90 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            <Check className="w-4 h-4" /> Finalizar Atendimento
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReschedulingId(app.id);
                              setRescheduleDate(dateStr);
                              setRescheduleTime(timeStr);
                            }}
                            className="bg-white hover:bg-warm-100 text-warm-955 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 border border-warm-200 transition-all shadow-xs"
                          >
                            <RefreshCw className="w-4 h-4 text-warm-355 text-warm-350" /> Reagendar
                          </button>

                          <button
                            type="button"
                            onClick={() => onUpdateAppointmentStatus(app.id, 'CANCELADO')}
                            className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 border border-red-200 transition-all"
                          >
                            <X className="w-4 h-4" /> Desmarcar
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNotesId(app.id);
                          setTempNotes(app.notes || '');
                        }}
                        className="bg-warm-50 hover:bg-warm-100 text-warm-955 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 border border-warm-200 transition-all"
                      >
                        <FileText className="w-4 h-4 text-warm-350 shrink-0" /> Prontuário
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dialog inside React for notes editing */}
          {editingNotesId && (
            <div className="fixed inset-0 z-50 bg-warm-950/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-warm-200 rounded-2xl p-6 w-full max-w-md shadow-lg space-y-4 text-warm-950"
              >
                <h4 className="font-serif font-bold text-warm-950 flex items-center gap-1.5 text-base">
                  <FileText className="w-5 h-5 text-terapia-700" />
                  Prontuário de Atendimento Seguro (LGPD)
                </h4>
                <p className="text-xs text-warm-850 leading-relaxed">
                  As anotações abaixo são confidenciais e protegidas por legislação, sendo visíveis exclusivamente pelo terapeuta.
                </p>
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Escreva como foi a evolução terapêutica do paciente nesta sessão..."
                  className="w-full bg-warm-50 border border-warm-200 text-xs text-warm-955 p-3 rounded-xl h-32 outline-none focus:border-terapia-700"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setEditingNotesId(null)}
                    className="bg-warm-50 text-warm-950 border border-warm-200 py-2 px-4 rounded-xl hover:bg-warm-100 cursor-pointer"
                  >
                    Ignorar
                  </button>
                  <button
                    onClick={() => {
                      onSaveAppointmentNotes(editingNotesId, tempNotes);
                      setEditingNotesId(null);
                    }}
                    className="bg-terapia-700 text-white font-semibold py-2 px-4 rounded-xl hover:bg-terapia-700/90 cursor-pointer"
                  >
                    Gravar Notas Clínicas
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Dialog for Rescheduling */}
          {reschedulingId && (
            <div className="fixed inset-0 z-50 bg-warm-950/40 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white border border-warm-200 rounded-2xl p-6 w-full max-w-sm shadow-lg space-y-4"
              >
                <h4 className="font-serif font-bold text-warm-950 flex items-center gap-2 text-base">
                  <RefreshCw className="w-5 h-5 text-terapia-700" />
                  Reagendar Sessão Clínica
                </h4>
                <p className="text-xs text-warm-850">
                  Insira uma nova data e fuso. O sistema re-validará as regras de conflito de horário automaticamente.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-warm-950 mb-1">Nova Data</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full bg-warm-50 border border-warm-200 p-2.5 text-xs text-warm-955 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-warm-950 mb-1">Novo Horário</label>
                    <input
                      type="text"
                      placeholder="HH:MM (ex: 14:00)"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                      className="w-full bg-warm-50 border border-warm-200 p-2.5 text-xs text-warm-955 rounded-xl font-mono outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs pt-2">
                  <button
                    onClick={() => setReschedulingId(null)}
                    className="bg-warm-50 text-warm-955 border border-warm-200 py-2 px-4 rounded-xl hover:bg-warm-100 cursor-pointer"
                  >
                    Ignorar
                  </button>
                  <button
                    onClick={() => {
                      const iso = `${rescheduleDate}T${rescheduleTime}:00.000Z`;
                      onUpdateAppointmentDateTime(reschedulingId, iso);
                      setReschedulingId(null);
                    }}
                    className="bg-terapia-700 text-white font-semibold py-2 px-4 rounded-xl hover:bg-terapia-700/90 cursor-pointer"
                  >
                    Gravar Mudança
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </div>
      )}

      {/* RENDER BLOQUEIOS */}
      {activeTab === 'BLOQUEIOS' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="blocked-slots-manager">
          {/* Add block */}
          <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-warm-200 space-y-4 shadow-xs">
            <h4 className="font-serif font-bold text-warm-950 text-base border-b border-warm-200 pb-2">
              🔒 Bloquear Atendimento na Agenda
            </h4>
            <p className="text-xs text-warm-850 leading-relaxed">
              Defina blocos manuais de indisponibilidade (por exemplo, feriados, férias ou descansos pessoais) que ficarão desativados para o paciente.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-warm-950 mb-1">Data que deseja bloquear</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full bg-warm-50/70 border border-warm-200 text-warm-955 p-3 rounded-xl outline-none focus:border-terapia-700 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-warm-955 mb-1">Horário de Início</label>
                  <input
                    type="text"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 text-warm-955 p-3 rounded-xl font-mono outline-none focus:border-terapia-700 transition-colors"
                    placeholder="HH:MM (ex: 12:00)"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-warm-955 mb-1">Horário Limite</label>
                  <input
                    type="text"
                    value={blockEnd}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 text-warm-955 p-3 rounded-xl font-mono outline-none focus:border-terapia-700 transition-colors"
                    placeholder="HH:MM (ex: 13:00)"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-warm-955 mb-1">Motivo do Bloqueio</label>
                <input
                  type="text"
                  placeholder="Exemplo: Almoço / Aula Teórica"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-warm-50/70 border border-warm-200 text-warm-955 p-3 rounded-xl outline-none focus:border-terapia-700 transition-colors"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddBlockedSlot({
                    id: `block-${Math.random().toString(36).substring(2, 9)}`,
                    therapistId: 'therapist-1',
                    dateStr: blockDate,
                    startTime: blockStart,
                    endTime: blockEnd,
                    reason: blockReason,
                  });
                }}
                className="w-full bg-terapia-700 hover:bg-terapia-700/90 text-white font-bold py-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:shadow"
              >
                <Plus className="w-4 h-4" /> Ativar Bloqueio na Agenda
              </button>
            </div>
          </div>

          {/* List blocks */}
          <div className="md:col-span-7 space-y-4">
            <h4 className="font-serif font-bold text-warm-950 text-base">
              📅 Bloqueios Ativos no Momento
            </h4>

            {blockedSlots.length === 0 ? (
              <div className="border border-warm-200 border-dashed rounded-2xl p-10 text-center text-warm-850 bg-warm-50/40">
                <Clock className="w-10 h-10 mx-auto text-warm-350 mb-3" />
                <p className="text-xs font-semibold text-warm-855">Não há impedimentos de horários criados.</p>
                <p className="text-[11px] text-warm-850 mt-1">Sua agenda está totalmente desbloqueada para marcações.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {blockedSlots.map((block) => (
                  <div key={block.id} className="bg-white p-4.5 border border-warm-200 rounded-2xl flex justify-between items-start gap-3 shadow-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans font-bold text-terapia-700 bg-terapia-50 px-2.5 py-1 rounded-full border border-terapia-200">
                        🗓️ {block.dateStr}
                      </span>
                      <p className="text-xs font-bold text-warm-950 font-mono pt-2">
                        Das {block.startTime} às {block.endTime}
                      </p>
                      <p className="text-[11px] text-warm-850 font-medium leading-normal">{block.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteBlockedSlot(block.id)}
                      className="text-warm-350 hover:text-red-700 transition-all p-1.5 cursor-pointer rounded-lg hover:bg-red-50"
                      title="Destravar horário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER PACIENTES */}
      {activeTab === 'PACIENTES' && (
        <div className="space-y-4" id="registered-patients-section">
          <h4 className="font-serif font-bold text-warm-950 text-base">
            👥 Contato dos Pacientes Cadastrados
          </h4>

          {appointments.length === 0 ? (
            <div className="border border-warm-200 border-dashed rounded-2xl p-10 text-center text-warm-850 bg-warm-50/45">
              Nenhum cliente cadastrado no momento.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-warm-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-warm-200 bg-warm-50 text-warm-955 font-sans font-bold">
                      <th className="p-4 text-xs tracking-wider uppercase">Nome do Cliente</th>
                      <th className="p-4 text-xs tracking-wider uppercase">E-mail Cadastrado</th>
                      <th className="p-4 text-xs tracking-wider uppercase">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200 text-warm-955 bg-white">
                    {Array.from(new Set(appointments.map(a => a.patientEmail))).map((email) => {
                      const match = appointments.find(a => a.patientEmail === email);
                      if (!match) return null;
                      return (
                        <tr key={email} className="hover:bg-warm-50/50 transition-all">
                          <td className="p-4 font-bold text-warm-950 text-sm">{match.patientName}</td>
                          <td className="p-4 font-sans text-warm-850 font-medium">{match.patientEmail}</td>
                          <td className="p-4 font-mono text-terapia-700 font-extrabold">{match.patientWhatsapp}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RENDER CONFIGURATIONS */}
      {activeTab === 'CONFIGS' && (
        <form onSubmit={(e) => {
          e.preventDefault();
          onChangeClinicAddress(tempAddress);
          onChangeOnlineMeetingLink(tempMeetingLink);
          
          // Find services and call updates
          const refSrv = services.find(s => s.type === 'REFLEXOLOGY');
          if (refSrv) {
            onUpdateServicePrice(refSrv.id, Number(tempReflexologiaPrice));
            onUpdateServiceDuration(refSrv.id, Number(tempReflexologiaDuration));
          }
          
          const imtSrv = services.find(s => s.type === 'IMT');
          if (imtSrv) {
            onUpdateServicePrice(imtSrv.id, Number(tempImtPrice));
            onUpdateServiceDuration(imtSrv.id, Number(tempImtDuration));
          }

          // Save therapist contact details
          onUpdateTherapistContact({
            name: tempName,
            specialty: tempSpecialty,
            bio: tempBio,
            phone: tempPhone,
            email: tempEmail,
            instagram: tempInstagram,
            workingHours: tempWorkingHours,
          });
          
          setConfigsSuccessMsg("Configurações gerais e dados do perfil médico atualizados com sucesso! Os pacientes já podem visualizar as informações atualizadas na aba de contato.");
          setTimeout(() => {
            setConfigsSuccessMsg(null);
          }, 6000);
        }} className="space-y-6 animate-fade-in" id="panel-clinic-configs">
          <div className="bg-white border border-warm-200 p-6 rounded-2xl space-y-5 shadow-xs">
            <h3 className="font-serif font-bold text-warm-950 text-lg flex items-center gap-2">
              ⚙️ Configurações Gerais do Consultório
            </h3>
            <p className="text-xs text-warm-850 leading-relaxed -mt-3.5">
              Personalize os valores de consulta, o endereço físico para as sessões presenciais e o link permanente de vídeo integrado para facilitar a rotina das suas consultas.
            </p>

            {configsSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{configsSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Box 1: Reflexologia Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-warm-950 uppercase tracking-wider">
                  Valor da Reflexologia Podal (Presencial)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-warm-450 text-xs font-bold font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={tempReflexologiaPrice}
                    onChange={(e) => setTempReflexologiaPrice(Number(e.target.value))}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-955 font-mono focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all shadow-xs"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[10px] text-warm-850">Preço visível ao paciente no momento de selecionar esta terapia.</p>
              </div>

              {/* Box 2: IMT Price */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-warm-950 uppercase tracking-wider">
                  Valor da Terapia de Imagens Mentais (IMT)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-warm-450 text-xs font-bold font-mono">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={tempImtPrice}
                    onChange={(e) => setTempImtPrice(Number(e.target.value))}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-955 font-mono focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all shadow-xs"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-[10px] text-warm-850">Preço cobrado pelas sessões online de reabilitação cognitiva IMT.</p>
              </div>

              {/* Box 1b: Reflexologia Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-warm-950 uppercase tracking-wider">
                  Duração da Reflexologia Podal (Minutos)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-warm-450 text-xs font-bold">
                    ⏱️
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="480"
                    step="5"
                    required
                    value={tempReflexologiaDuration}
                    onChange={(e) => setTempReflexologiaDuration(Number(e.target.value))}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-955 font-mono focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all shadow-xs"
                    placeholder="60"
                  />
                </div>
                <p className="text-[10px] text-warm-850">Duração estimada em minutos que guiará a ocupação de horários da agenda.</p>
              </div>

              {/* Box 2b: IMT Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-warm-950 uppercase tracking-wider">
                  Duração da Terapia IMT (Minutos)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-warm-450 text-xs font-bold">
                    ⏱️
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="480"
                    step="5"
                    required
                    value={tempImtDuration}
                    onChange={(e) => setTempImtDuration(Number(e.target.value))}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl pl-9 pr-3 py-3 text-xs text-warm-955 font-mono focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all shadow-xs"
                    placeholder="45"
                  />
                </div>
                <p className="text-[10px] text-warm-850">Duração estimada para as sessões de Imaginação Mental Integrada IMT.</p>
              </div>
            </div>

            {/* Box 3: Address for Presencial */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-warm-950 uppercase tracking-wide">
                📍 Endereço Completo para Atendimentos Presenciais
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans"
                  placeholder="Rua, Número, Sala, Bairro - Cidade / Estado"
                />
              </div>
              <p className="text-[10px] text-warm-850">
                Endereço físico que o paciente receberá nas notificações e tela de resumo ao agendar Reflexologia Podal.
              </p>
            </div>

            {/* Box 4: IMT Integration Link */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-warm-950 uppercase tracking-wide">
                🔗 Link Permanente de Chamada (Google Meet ou Zoom)
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={tempMeetingLink}
                  onChange={(e) => setTempMeetingLink(e.target.value)}
                  className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 font-mono focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all"
                  placeholder="https://meet.google.com/xyz-abc-123 ou zoom.us..."
                />
              </div>
              <p className="text-[10px] text-warm-850">
                O link integrado será exibido diretamente na tela do paciente após o agendamento de consultas IMT online.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-warm-200/70 my-6 pt-6">
              <h4 className="text-sm font-sans font-black text-warm-950 uppercase tracking-widest flex items-center gap-2 mb-3.5">
                <User className="w-5 h-5 text-terapia-700" />
                Informações Públicas e Contato do Terapeuta
              </h4>
              <p className="text-xs text-warm-850 leading-relaxed mb-5 font-medium">
                Estes dados são exibidos de forma especial no Portal do Paciente, garantindo que o seu público possa conhecer sua biografia, especialidade e canais diretos de contato.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome do Terapeuta */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    Nome do Terapeuta
                  </label>
                  <input
                    type="text"
                    required
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans shadow-3xs"
                    placeholder="Ex: Dr. Carlos Emiliano"
                  />
                </div>

                {/* Especialidade */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    Especialidade / Título Principal
                  </label>
                  <input
                    type="text"
                    required
                    value={tempSpecialty}
                    onChange={(e) => setTempSpecialty(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans shadow-3xs"
                    placeholder="Ex: Terapeuta Integrativo & Reflexologista"
                  />
                </div>

                {/* Telefone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    WhatsApp para Atendimento
                  </label>
                  <input
                    type="text"
                    required
                    value={tempPhone}
                    onChange={(e) => setTempPhone(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans shadow-3xs"
                    placeholder="Ex: (11) 98765-4321"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    E-mail Profissional
                  </label>
                  <input
                    type="email"
                    required
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans shadow-3xs"
                    placeholder="Ex: carlos@espacoholos.com"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    Perfil do Instagram (com @)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-warm-450 text-xs font-bold">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      value={tempInstagram.startsWith('@') ? tempInstagram.substring(1) : tempInstagram}
                      onChange={(e) => setTempInstagram('@' + (e.target.value.startsWith('@') ? e.target.value.substring(1) : e.target.value))}
                      className="w-full bg-warm-50/70 border border-warm-200 rounded-xl pl-8 pr-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans shadow-3xs"
                      placeholder="carlos.terapia"
                    />
                  </div>
                </div>

                {/* Horários */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    Horário de Atividades
                  </label>
                  <input
                    type="text"
                    required
                    value={tempWorkingHours}
                    onChange={(e) => setTempWorkingHours(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans shadow-3xs"
                    placeholder="Ex: Segunda à Sexta, das 08h às 19h"
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-warm-955 uppercase tracking-wider">
                    Sua Biografia / Abordagem Clínica
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full bg-warm-50/70 border border-warm-200 rounded-2xl px-3.5 py-3 text-xs text-warm-955 focus:outline-none focus:border-terapia-700 focus:ring-1 focus:ring-terapia-200 transition-all font-sans leading-relaxed shadow-3xs"
                    placeholder="Escreva sobre sua formação em Reflexologia e IMT..."
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="bg-terapia-700 hover:bg-terapia-700/90 text-white font-bold px-6 py-3 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow"
              >
                <Check className="w-4 h-4" />
                Salvar Configurações do Consultório
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}
