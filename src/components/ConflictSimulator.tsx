/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, Lock, HelpCircle, AlertTriangle, ArrowRight, CheckCircle2, 
  RefreshCw, Clock, Globe, ShieldCheck, Heart
} from 'lucide-react';

export default function ConflictSimulator() {
  const [activePlayground, setActivePlayground] = useState<'RACE_CONDITION' | 'BUFFERS' | 'TIMEZONE'>('RACE_CONDITION');

  // Race condition simulator states
  const [raceStep, setRaceStep] = useState<number>(0);
  const [isSimulatingRace, setIsSimulatingRace] = useState<boolean>(false);

  // Timezone simulation state
  const [selectedPatientTz, setSelectedPatientTz] = useState<number>(1); // GMT+1 e.g. Lisbon
  const [selectedHour, setSelectedHour] = useState<number>(14);

  // Triggering the Race condition animation steps
  const startRaceSimulation = () => {
    setIsSimulatingRace(true);
    setRaceStep(1);

    const steps = [
      { id: 2, t: 1500 }, // SELECT ... FOR UPDATE starts
      { id: 3, t: 3200 }, // Client A gets lock, Client B suspended
      { id: 4, t: 5000 }, // Client A writes and commits
      { id: 5, t: 6800 }, // Client B resumes, conflicts, safe rollback
      { id: 6, t: 8400 }, // Done. Completed.
    ];

    steps.forEach((st) => {
      setTimeout(() => {
        setRaceStep(st.id);
        if (st.id === 6) setIsSimulatingRace(false);
      }, st.t);
    });
  };

  return (
    <div className="bg-white border border-warm-200 rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8" id="conflict-simulator-panel">
      
      {/* Header */}
      <div className="border-b border-warm-100 pb-5 mb-6">
        <span className="text-terapia-700 text-xs font-sans font-bold tracking-wider uppercase bg-terapia-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Como Funciona por Trás da Agenda
        </span>
        <h2 className="text-2xl font-serif font-semibold text-warm-950 tracking-tight mt-2">
          Testador de Segurança e Evitação de Conflitos
        </h2>
        <p className="text-warm-850 text-sm mt-1">
          Veja de forma interativa como nossa tecnologia inteligente evita que dois pacientes agendem a mesma vaga ao mesmo tempo, gerenciem fusos horários e respeitem intervalos de higienização.
        </p>
      </div>

      {/* Navegação Interna */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setActiveTabAndReset('RACE_CONDITION'); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            activePlayground === 'RACE_CONDITION'
              ? 'bg-terapia-700 border-terapia-700 text-white font-bold'
              : 'bg-warm-50 border-warm-200 text-warm-950 hover:bg-warm-100'
          }`}
        >
          Dois Cliques Simultâneos ⚡
        </button>
        <button
          onClick={() => { setActiveTabAndReset('BUFFERS'); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            activePlayground === 'BUFFERS'
              ? 'bg-terapia-700 border-terapia-700 text-white font-bold'
              : 'bg-warm-50 border-warm-200 text-warm-950 hover:bg-warm-100'
          }`}
        >
          Intervalo de Higienização (Buffer) 🧹
        </button>
        <button
          onClick={() => { setActiveTabAndReset('TIMEZONE'); }}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            activePlayground === 'TIMEZONE'
              ? 'bg-terapia-700 border-terapia-700 text-white font-bold'
              : 'bg-warm-50 border-warm-200 text-warm-950 hover:bg-warm-100'
          }`}
        >
          Conversão de Fusos Horários 🗺️
        </button>
      </div>

      {/* RENDER RACE CONDITION */}
      {activePlayground === 'RACE_CONDITION' && (
        <div className="space-y-6">
          <div className="bg-warm-50 p-4 border border-warm-200 rounded-xl space-y-1">
            <h4 className="text-warm-950 text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-terapia-700" />
              Simulação de cliques simultâneos de dois pacientes
            </h4>
            <p className="text-xs text-warm-850 leading-relaxed">
              O paciente **Arthur** e a paciente **Júlia** tentam reservar exatamente a mesma vaga das **14:00 de Reflexologia** no mesmo milissegundo de segundo. 
              Clique no botão de teste para observar como o sistema reage protegendo a clínica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left controller */}
            <div className="md:col-span-4 flex flex-col justify-center bg-warm-50 p-6 rounded-2xl border border-warm-200 text-center min-h-[200px]">
              <h5 className="text-xs text-warm-850 font-bold mb-3 font-sans uppercase tracking-wider">Iniciar Teste</h5>
              <button
                disabled={isSimulatingRace}
                onClick={startRaceSimulation}
                className="w-full bg-terapia-700 text-white font-semibold py-3 px-4 rounded-xl hover:bg-terapia-700/90 transition-all font-sans text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSimulatingRace ? 'animate-spin' : ''}`} />
                {isSimulatingRace ? 'Fazendo Teste de Conflito...' : 'Iniciar Teste de Simultaneidade'}
              </button>
              <span className="text-[10px] text-warm-850 mt-2.5 font-sans">
                Proteção Ativa contra agendamentos duplicados (PostgreSQL Transactional Lock)
              </span>
            </div>

            {/* Right Graphic timeline */}
            <div className="md:col-span-8 bg-warm-50 p-6 rounded-2xl border border-warm-200 min-h-[220px] relative overflow-hidden flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {raceStep === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8 text-warm-850 space-y-2">
                    <Heart className="w-8 h-8 mx-auto text-warm-350 animate-pulse" />
                    <p className="text-xs">Para testar, clique no botão à esquerda para disparar as duas tentativas juntas.</p>
                  </motion.div>
                )}

                {raceStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <span className="inline-flex text-[10px] font-sans tracking-wide bg-amber-50 text-amber-805 text-amber-800 px-3 py-1 rounded-full border border-amber-200 uppercase font-bold">1. Cliques chegando juntos ao servidor</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-warm-200">
                        <p className="text-xs font-bold text-warm-950">Arthur (Tentativa 1)</p>
                        <p className="text-[10px] font-mono text-terapia-700 mt-1">Quer a vaga de Segunda @ 14:00:00.001</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-warm-200">
                        <p className="text-xs font-bold text-warm-950">Júlia (Tentativa 2)</p>
                        <p className="text-[10px] font-mono text-indigo-600 mt-1">Quer a vaga de Segunda @ 14:00:00.002</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {raceStep === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <span className="inline-flex text-[10px] font-sans tracking-wide bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 uppercase font-bold">2. Ativação da Análise de Segurança</span>
                    <p className="text-xs text-warm-850">
                      O sistema entra no banco de dados e tranca temporariamente a linha da agenda daquela tarde para ninguém mais escrever até que decidamos quem chegou primeiro.
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-warm-200 font-mono text-[10px] text-warm-950">
                      Buscar agendamentos para Segunda-feira às 14:00 com Bloqueio de Segurança Ativo...
                    </div>
                  </motion.div>
                )}

                {raceStep === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <span className="inline-flex text-[10px] font-sans tracking-wide bg-terapia-50 text-terapia-700 px-3 py-1 rounded-full border border-terapia-200 uppercase font-bold">3. Arthur ganha o direito de alteração primeiro</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-terapia-55 bg-terapia-50 p-4 rounded-xl border border-terapia-700/35 text-terapia-700">
                        <p className="text-xs font-bold flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Arthur (ATIVO)</p>
                        <p className="text-[10px] mt-1 text-warm-850 font-sans">Sua vaga está sendo escrita no banco...</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-warm-200 text-warm-350 opacity-60">
                        <p className="text-xs font-bold flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Júlia (Fila de Espera)</p>
                        <p className="text-[10px] mt-1">Aguardando decisão da primeira transação...</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {raceStep === 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <span className="inline-flex text-[10px] font-sans tracking-wide bg-terapia-50 text-terapia-700 px-3 py-1 rounded-full border border-terapia-200 uppercase font-bold">4. Vaga do Arthur Registrada</span>
                    <p className="text-xs text-warm-850">
                      O agendamento do Arthur é finalizado e guardado permanentemente. O banco libera a tranca de segurança daquela agenda.
                    </p>
                    <div className="bg-terapia-50 p-3 rounded-xl border border-terapia-205 text-terapia-700 font-sans text-[11px] flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Agendamento do Arthur Gravado com Sucesso!</span>
                    </div>
                  </motion.div>
                )}

                {raceStep === 5 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <span className="inline-flex text-[10px] font-sans tracking-wide bg-red-50 text-red-700 px-3 py-1 rounded-full border border-red-200 uppercase font-bold">5. Júlia é Atendida e Encontra o Conflito</span>
                    <p className="text-xs text-warm-850">
                      O processo de verificação da Júlia acorda de imediato, mas encontra a vaga ocupada pelo **Arthur**. O sistema cancela educadamente a segunda ação ilegal.
                    </p>
                    <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-red-700 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span>Cancelamento da Ação de Júlia (Proteção Ativa!)</span>
                      </div>
                      <p className="text-[11px] opacity-85 pl-5 leading-normal">
                        Mensagem do Servidor: "Desculpe, a vaga das 14:00 acaba de ser alocada para outro paciente alguns milissegundos atrás."
                      </p>
                    </div>
                  </motion.div>
                )}

                {raceStep === 6 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="text-center space-y-2">
                      <ShieldCheck className="w-12 h-12 text-terapia-700 mx-auto animate-bounce mt-2" />
                      <h4 className="font-serif font-bold text-warm-950 text-base">Nenhum Conflito Gerado!</h4>
                      <p className="text-xs text-warm-850 max-w-sm mx-auto leading-relaxed">
                        Nossa tecnologia evitou com sucesso a duplicidade. Apenas o Arthur ficou com o horário e a Júlia recebeu uma resposta imediata para escolher outra vaga disponível, mantendo o controle cirúrgico da recepção.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* RENDER BUFFERS */}
      {activePlayground === 'BUFFERS' && (
        <div className="space-y-6" id="buffer-playground">
          <div className="bg-warm-50 p-4 border border-warm-200 rounded-xl space-y-1">
            <h4 className="text-warm-950 text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-terapia-700" />
              Entendendo a Regra de Intervalos e Higienização (Buffer)
            </h4>
            <p className="text-xs text-warm-850 leading-relaxed">
              O agendamento de **Reflexologia Podal** possui uma regra de **15 minutos de intervalo** (para limpeza da maca, assepsia e descanso do profissional).
              Se um atendimento for marcado das **10:00 às 11:00**, a próxima vaga do dia só estará livre às **11:15**.
            </p>
          </div>

          <div className="space-y-4 bg-warm-50 p-5 rounded-2xl border border-warm-200">
            {/* Visual calendar block */}
            <div className="relative h-14 bg-white rounded-xl border border-warm-200 flex overflow-hidden">
              {/* Active Session A */}
              <div className="w-[60%] bg-amber-500/10 border-r border-dashed border-amber-500/30 flex items-center justify-center text-amber-800 text-[11px] font-semibold text-center leading-normal px-2">
                Consulta A: 10:00 - 11:00
              </div>
              {/* Buffer interval */}
              <div className="w-[15%] bg-red-500/10 border-r border-dashed border-red-500/30 flex items-center justify-center text-[9px] text-red-700 font-sans text-center leading-tight">
                Intervalo Técnico (15 min)
              </div>
              {/* Free Slot */}
              <div className="w-[25%] bg-terapia-55 bg-terapia-50/55 flex items-center justify-center text-terapia-700 text-xs font-semibold text-center leading-normal">
                Agenda Livre (A partir de 11:15)
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-white rounded-xl border border-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-650 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="text-xs font-bold text-warm-950">Paciente tenta agendar às 11:00:</h6>
                  <p className="text-xs text-red-600 mt-1 font-sans">🚫 REJEITANTE: O sistema avisa que o terapeuta está em intervalo.</p>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-terapia-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-terapia-700 shrink-0 mt-0.5" />
                <div>
                  <h6 className="text-xs font-bold text-warm-950">Paciente tenta agendar às 11:15:</h6>
                  <p className="text-xs text-terapia-700 mt-1 font-sans">✅ LIBERADO: Período livre para marcação imediata!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TIMEZONE */}
      {activePlayground === 'TIMEZONE' && (
        <div className="space-y-6" id="timezone-resolver">
          <div className="bg-warm-50 p-4 border border-warm-200 rounded-xl space-y-1">
            <h4 className="text-warm-950 text-xs font-sans font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-terapia-700" />
              Sincronização entre Localidades Diferentes (Timezones)
            </h4>
            <p className="text-xs text-warm-850 leading-relaxed">
              Nosso sistema armazena tudo em ponto absoluto (UTC), mas avisa se o paciente ou terapeuta estiverem em locais com fuso diferente, evitando confusão de horários marcados online.
            </p>
          </div>

          <div className="bg-warm-50 p-5 rounded-2xl border border-warm-200 space-y-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-warm-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-warm-950">Local de Acesso do Paciente:</span>
                <select
                  value={selectedPatientTz}
                  onChange={(e) => setSelectedPatientTz(Number(e.target.value))}
                  className="bg-white border border-warm-200 text-warm-955 text-xs rounded-lg p-2 focus:outline-none focus:border-terapia-700 outline-none cursor-pointer"
                >
                  <option value={1}>Lisboa / Londres (GMT+1)</option>
                  <option value={0}>UTC Absoluto (GMT+0)</option>
                  <option value={-3}>São Paulo / Brasília / Rio (GMT-3)</option>
                  <option value={-5}>Nova York (GMT-5)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-warm-950">Hora Escolhida na Agenda:</span>
                <input
                  type="number"
                  min={8}
                  max={20}
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                  className="bg-white border border-warm-200 text-warm-950 text-xs rounded-lg p-2 w-12 text-center font-bold outline-none"
                />
                <span className="text-xs text-warm-350 font-mono font-bold">:00</span>
              </div>
            </div>

            {/* Calculations flow step by step */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs text-warm-950">
              <div className="p-4 bg-white border border-warm-200 rounded-xl shadow-xs">
                <span className="block text-[10px] text-warm-350 mb-1 uppercase tracking-wider font-bold">1. Computador do Paciente</span>
                <span className="text-lg font-bold text-warm-950">{selectedHour}:00</span>
                <span className="block text-[10px] text-warm-350 mt-1">Fuso GMT{selectedPatientTz >= 0 ? `+${selectedPatientTz}` : selectedPatientTz}</span>
              </div>

              <div className="p-4 bg-terapia-55 bg-terapia-50 border border-terapia-200 rounded-xl shadow-xs">
                <span className="block text-[10px] text-terapia-700 mb-1 uppercase tracking-wider font-bold">2. Servidor da Nuvem</span>
                <span className="text-lg font-bold text-terapia-700">{getUtcHour(selectedHour, selectedPatientTz)}:00</span>
                <span className="block text-[10px] text-terapia-700 mt-1">Armazenado em UTC Geral</span>
              </div>

              <div className="p-4 bg-white border border-warm-200 rounded-xl shadow-xs">
                <span className="block text-[10px] text-warm-350 mb-1 uppercase tracking-wider font-bold">3. Agenda do Terapeuta</span>
                <span className="text-lg font-bold text-warm-950">{getTherapistHour(selectedHour, selectedPatientTz, -3)}:00</span>
                <span className="block text-[10px] text-warm-350 mt-1">Fuso de São Paulo (GMT-3)</span>
              </div>
            </div>

            {/* Final result evaluations */}
            <div className={`p-4 rounded-xl flex items-center gap-3 border ${
              evaluateTherapistWorkingHours(selectedHour, selectedPatientTz, -3)
                ? 'bg-terapia-50 border-terapia-205 text-terapia-700'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {evaluateTherapistWorkingHours(selectedHour, selectedPatientTz, -3) ? (
                <>
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-xs">
                    **HORÁRIO VÁLIDO**: Este horário equivale às **{getTherapistHour(selectedHour, selectedPatientTz, -3)}:00** do terapeuta, o que se enquadra perfeitamente no período de atendimento da clínica (das 08:00 às 19:00).
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 shrink-0 text-red-650" />
                  <span className="text-xs text-red-850">
                    **RESTRITO**: Isso seria às **{getTherapistHour(selectedHour, selectedPatientTz, -3)}:00** do fuso do terapeuta, o que viola as regras de funcionamento clínico (fora do horário comercial permitidos).
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function setActiveTabAndReset(tab: 'RACE_CONDITION' | 'BUFFERS' | 'TIMEZONE') {
    setActivePlayground(tab);
    setRaceStep(0);
    setIsSimulatingRace(false);
  }

  // Pure functions helper calculations for Timezone sim
  function getUtcHour(localHour: number, timezone: number): number {
    let utc = localHour - timezone;
    if (utc < 0) utc += 24;
    return utc % 24;
  }

  // Therapist is in Brasília/São Paulo timezone (-3)
  function getTherapistHour(localHour: number, patientTz: number, therapistTz: number): number {
    const utc = getUtcHour(localHour, patientTz);
    let therm = utc + therapistTz;
    if (therm < 0) therm += 24;
    return therm % 24;
  }

  function evaluateTherapistWorkingHours(localHour: number, patientTz: number, therapistTz: number): boolean {
    const hours = getTherapistHour(localHour, patientTz, therapistTz);
    return hours >= 8 && hours <= 18; // Operates within 08:00 and 19:00
  }
}
