/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, ShieldCheck, Sparkles, Heart, CheckCircle2, Award, 
  Lock, ArrowRight, UserCheck, Shield, LogOut, CheckCircle
} from 'lucide-react';

import rosaniLogo from './assets/images/rosani_logo_1780683714024_1780684044391.png';

// Models & Types
import { Service, Appointment, BlockedSlot, AppointmentStatus, TherapistContact } from './types';

// Web Components
import PatientPortal from './components/PatientPortal';
import TherapistAdmin from './components/TherapistAdmin';

// Styles
import './index.css';

// Firebase Integrations
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  getDoc 
} from 'firebase/firestore';

export default function App() {
  const [activeMainTab, setActiveMainTab] = useState<'LANDING' | 'PORTAL' | 'ADMIN'>('LANDING');
  const [isTherapistLoggedIn, setIsTherapistLoggedIn] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Authentication mode ('LOGIN' or 'REGISTER')
  const [authTab, setAuthTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [registerName, setRegisterName] = useState('');
  const [registerSpecialty, setRegisterSpecialty] = useState('');

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
    name: 'Rosani Halmenschlager',
    specialty: 'Reflexoterapeuta Integrativa',
    phone: '(51) 99876-5432',
    email: 'rosani@reflexoterapia.com.br',
    instagram: '@rosani.reflexo',
    workingHours: 'Segunda a Sexta, das 08:00 às 23:00',
    bio: 'Olá! Sou Rosani Halmenschlager, reflexoterapeuta integrativa especializada em bem-estar corporal e mental por meio da reflexoterapia. Atuo auxiliando pessoas a reatarem sua saúde física e emocional, ativando as capacidades naturais do corpo de auto-regeneração e relaxamento profundo, com acolhimento humano.'
  });

  // 2. APPOINTMENTS STATE
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // 3. BLOCKED SLOTS STATE
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  // REAL-TIME FIRESTORE SYNCHRONIZATION
  React.useEffect(() => {
    // 1. Listen to Authentication State Changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsTherapistLoggedIn(true);
        // Load profile settings lazily
        const docRef = doc(db, 'therapists', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTherapistContact({ ...data, id: user.uid } as TherapistContact);
            if (data.clinicAddress) setClinicAddress(data.clinicAddress);
            if (data.onlineMeetingLink) setOnlineMeetingLink(data.onlineMeetingLink);
            
            // Reconstruct and update services state if they are saved in database
            setServices(prev => prev.map(srv => {
              if (srv.type === 'REFLEXOLOGY') {
                return {
                  ...srv,
                  price: data.reflexologiaPrice !== undefined ? data.reflexologiaPrice : srv.price,
                  durationMinutes: data.reflexologiaDuration !== undefined ? data.reflexologiaDuration : srv.durationMinutes
                };
              }
              if (srv.type === 'IMT') {
                return {
                  ...srv,
                  price: data.imtPrice !== undefined ? data.imtPrice : srv.price,
                  durationMinutes: data.imtDuration !== undefined ? data.imtDuration : srv.durationMinutes
                };
              }
              return srv;
            }));
          } else {
            console.warn("Perfil do terapeuta não encontrado no banco de dados.");
          }
        } catch (err: any) {
          handleFirestoreError(err, OperationType.GET, `therapists/${user.uid}`);
        }
      } else {
        setIsTherapistLoggedIn(false);
      }
    });

    // 2. Continuous Real-time Sync for Appointments
    const unsubscribeAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as Appointment);
      });
      setAppointments(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'appointments');
    });

    // 3. Continuous Real-time Sync for Blocked Slots
    const unsubscribeBlockedSlots = onSnapshot(collection(db, 'blockedSlots'), (snapshot) => {
      const list: BlockedSlot[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data(), id: doc.id } as BlockedSlot);
      });
      setBlockedSlots(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'blockedSlots');
    });

    // 4. Real-time sync for loading the first available therapist profile if user isn't logged in
    const unsubscribeTherapists = onSnapshot(collection(db, 'therapists'), (snapshot) => {
      if (!snapshot.empty && !auth.currentUser) {
        const firstDoc = snapshot.docs[0];
        const data = firstDoc.data();
        setTherapistContact({ ...data, id: firstDoc.id } as TherapistContact);
        if (data.clinicAddress) setClinicAddress(data.clinicAddress);
        if (data.onlineMeetingLink) setOnlineMeetingLink(data.onlineMeetingLink);

        // Also reconstruct services for the patient view!
        setServices(prev => prev.map(srv => {
          if (srv.type === 'REFLEXOLOGY') {
            return {
              ...srv,
              price: data.reflexologiaPrice !== undefined ? data.reflexologiaPrice : srv.price,
              durationMinutes: data.reflexologiaDuration !== undefined ? data.reflexologiaDuration : srv.durationMinutes
            };
          }
          if (srv.type === 'IMT') {
            return {
              ...srv,
              price: data.imtPrice !== undefined ? data.imtPrice : srv.price,
              durationMinutes: data.imtDuration !== undefined ? data.imtDuration : srv.durationMinutes
            };
          }
          return srv;
        }));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'therapists');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeAppointments();
      unsubscribeBlockedSlots();
      unsubscribeTherapists();
    };
  }, []);

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

  // PERSISTENT DATABASE WRITE OPERATIONS
  const handleAddAppointment = async (newApp: Appointment) => {
    try {
      const docRef = doc(collection(db, 'appointments'));
      const appData = {
        ...newApp,
        id: docRef.id,
        createdAt: newApp.createdAt || new Date().toISOString()
      };
      await setDoc(docRef, appData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleUpdateAppointmentDateTime = async (id: string, newDateTime: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { dateTime: newDateTime });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleSaveAppointmentNotes = async (id: string, notes: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { notes: notes });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleAddBlockedSlot = async (newBlock: BlockedSlot) => {
    try {
      const docRef = doc(collection(db, 'blockedSlots'));
      const blockData = {
        ...newBlock,
        id: docRef.id
      };
      await setDoc(docRef, blockData);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'blockedSlots');
    }
  };

  const handleUnblockSlot = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'blockedSlots', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `blockedSlots/${id}`);
    }
  };

  const handleSaveAllConfigs = async (
    contact: TherapistContact,
    address: string,
    meetingLink: string,
    reflexologiaPrice: number,
    reflexologiaDuration: number,
    imtPrice: number,
    imtDuration: number
  ) => {
    setTherapistContact(contact);
    setClinicAddress(address);
    setOnlineMeetingLink(meetingLink);
    setServices((prev) =>
      prev.map((srv) => {
        if (srv.type === 'REFLEXOLOGY') {
          return { ...srv, price: reflexologiaPrice, durationMinutes: reflexologiaDuration };
        }
        if (srv.type === 'IMT') {
          return { ...srv, price: imtPrice, durationMinutes: imtDuration };
        }
        return srv;
      })
    );

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'therapists', auth.currentUser.uid), {
          ...contact,
          clinicAddress: address,
          onlineMeetingLink: meetingLink,
          reflexologiaPrice,
          reflexologiaDuration,
          imtPrice,
          imtDuration
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `therapists/${auth.currentUser.uid}`);
      }
    }
  };

  const handleSetIsAuthenticated = async (val: boolean) => {
    if (!val) {
      await signOut(auth);
      setActiveMainTab('LANDING');
    } else {
      setIsTherapistLoggedIn(true);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if this therapist profile exists in Firestore.
      const docRef = doc(db, 'therapists', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const initialProfile: TherapistContact = {
          id: user.uid,
          name: user.displayName || 'Terapeuta',
          specialty: 'Reflexoterapeuta Integrativa',
          phone: '(51) 99876-5432',
          email: user.email || '',
          instagram: '@' + (user.displayName || 'terapeuta').toLowerCase().replace(/\s+/g, '.'),
          workingHours: 'Segunda a Sexta, das 08:00 às 23:00',
          bio: `Olá! Sou ${user.displayName || 'Terapeuta'}, atuando na ativação do bem-estar físico e emocional por meio do cuidado integrativo.`,
          clinicAddress: clinicAddress,
          onlineMeetingLink: onlineMeetingLink
        };
        await setDoc(docRef, initialProfile);
        setTherapistContact(initialProfile);
      } else {
        const data = docSnap.data();
        setTherapistContact({ ...data, id: user.uid } as TherapistContact);
        if (data.clinicAddress) setClinicAddress(data.clinicAddress);
        if (data.onlineMeetingLink) setOnlineMeetingLink(data.onlineMeetingLink);
      }
      
      setActiveMainTab('ADMIN');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        const errJson = err instanceof Error ? err.message : String(err);
        setLoginError('Falha na autenticação do Google: ' + errJson);
      }
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeMainTab === 'ADMIN' && !isTherapistLoggedIn) {
      setActiveMainTab('LANDING');
    }
  }, [isTherapistLoggedIn, activeMainTab]);

  const handleTherapistLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    const email = loginEmail.trim();
    const password = loginPassword;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setActiveMainTab('ADMIN');
    } catch (err: any) {
      console.warn("Sign-in failed. Triggering automatic demo fallback validation...", err);
      // Auto-create demo credentials to prevent breaking changes on fresh databases
      if (email === 'rosani@reflexoterapia.com.br' && password === 'senha123') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setActiveMainTab('ADMIN');
        } catch (regErr: any) {
          setLoginError('Erro de conexão ou criação de usuário demo: ' + regErr.message);
        }
      } else {
        if (err.code === 'auth/wrong-password') {
          setLoginError('Senha incorreta.');
        } else if (err.code === 'auth/user-not-found') {
          setLoginError('E-mail não registrado. Mude para a aba "Criar Conta" para cadastrar-se.');
        } else if (err.code === 'auth/invalid-email') {
          setLoginError('E-mail em formato inválido.');
        } else {
          setLoginError('Erro ao entrar: ' + err.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTherapistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);
    const email = loginEmail.trim();
    const password = loginPassword;

    if (!registerName.trim()) {
      setLoginError('Por favor, informe seu nome.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const initialProfile: TherapistContact = {
        id: user.uid,
        name: registerName,
        specialty: registerSpecialty || 'Reflexoterapeuta Integrativa',
        phone: '(51) 99876-5432',
        email: email,
        instagram: '@' + registerName.toLowerCase().replace(/\s+/g, '.'),
        workingHours: 'Segunda a Sexta, das 08:00 às 23:00',
        bio: `Olá! Sou ${registerName}, ${registerSpecialty || 'reflexoterapeuta'} atuando na ativação do bem-estar física e emocional por meio do cuidado integrativo.`,
        clinicAddress: clinicAddress,
        onlineMeetingLink: onlineMeetingLink
      };

      await setDoc(doc(db, 'therapists', user.uid), initialProfile);
      setTherapistContact(initialProfile);
      setActiveMainTab('ADMIN');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setLoginError('Este e-mail de acesso já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
        setLoginError('A senha secreta deve possuir no mínimo 6 caracteres.');
      } else {
        setLoginError('Erro ao criar conta: ' + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 text-warm-950 flex flex-col antialiased selection:bg-terapia-200 selection:text-terapia-700">
      
      {/* Clinically Clean Humanized Header */}
      <header className="border-b border-warm-250 bg-white/75 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={rosaniLogo} 
              alt="Rosani Halmenschlager Logo" 
              className="w-12 h-12 rounded-full object-cover border border-warm-200 shadow-xs ring-4 ring-warm-100 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-terapia-700">
                <Heart className="w-3.5 h-3.5 fill-current text-terapia-700 animate-pulse" />
                <p className="text-[10px] font-sans font-semibold tracking-wider uppercase">
                  Rosani Halmenschlager • Reflexoterapia
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

          <nav className="flex items-center gap-1.5 bg-warm-200/50 border border-warm-350/50 p-1.5 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
            {activeMainTab === 'LANDING' ? (
              <span className="text-[10px] font-sans font-extrabold uppercase tracking-widest text-warm-600 py-1.5 px-3">
                Selecione o seu Perfil de Acesso abaixo
              </span>
            ) : activeMainTab === 'PORTAL' ? (
              <>
                <span className="bg-white text-terapia-700 border border-warm-300 font-black shadow-sm flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-terapia-700" />
                  Agendar Consulta 🗓️
                </span>
                <button
                  onClick={() => setActiveMainTab('LANDING')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider text-warm-850 border border-transparent hover:text-warm-950 hover:bg-white/50 cursor-pointer transition-all"
                >
                  <ArrowRight className="w-4 h-4 rotate-180 text-warm-500" />
                  Voltar ao Painel Inicial 🚪
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveMainTab('PORTAL')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider text-warm-850 border border-transparent hover:text-warm-950 hover:bg-white/50 cursor-pointer transition-all"
                >
                  <Calendar className="w-4 h-4 text-terapia-700" />
                  Visualizar Portal 🗓️
                </button>
                <span className="bg-white text-terapia-700 border border-warm-300 font-black shadow-sm flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-terapia-700" />
                  Painel Conectado 💼
                </span>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    setActiveMainTab('LANDING');
                  }}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[11px] font-sans font-extrabold uppercase tracking-wider text-red-800 border border-transparent hover:text-red-955 hover:bg-red-50 cursor-pointer transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-600" />
                  Sair 🚪
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

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
            {activeMainTab === 'LANDING' && (
              <div className="space-y-8 py-4 max-w-6xl mx-auto">
                {/* Header Welcome banner inside Landing component */}
                <div className="text-center space-y-3.5 bg-gradient-to-b from-white/85 to-warm-100/30 border-2 border-warm-300 p-6 sm:p-10 rounded-3xl shadow-sm">
                  <Badge text="Central de Agendamento Inteligente" />
                  <h2 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-warm-950 max-w-2xl mx-auto leading-tight">
                    Por favor, selecione como você deseja prosseguir hoje
                  </h2>
                  <p className="text-sm sm:text-base text-warm-850 max-w-3xl mx-auto leading-relaxed font-serif font-semibold">
                    Diferenciamos o acesso de <span className="text-terapia-800 font-extrabold underline decoration-terapia-300 decoration-2">Pacientes</span> que querem agendar uma consulta do <span className="text-indigo-800 font-extrabold underline decoration-indigo-300 decoration-2">Terapeuta</span> responsável pelo gerenciamento organizacional da clínica.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                  {/* Left Column: Patients Portal (No Login required) */}
                  <div className="bg-white border-3 border-warm-350 hover:border-terapia-600 rounded-[28px] p-6 lg:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300">
                    <div className="space-y-5">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-terapia-50 text-terapia-700 shadow-3xs border border-terapia-200">
                        <Calendar className="w-7 h-7" />
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-[10px] font-sans font-black uppercase text-terapia-700 tracking-wider bg-terapia-50 border border-terapia-200 px-2.5 py-1 rounded-full">Acesso Livre • Sem Login</span>
                        <h3 className="text-xl sm:text-2xl font-serif font-black text-warm-950 pt-1.5">Agendar Minha Consulta Terapêutica</h3>
                        <p className="text-sm text-warm-850 leading-relaxed font-sans font-medium">
                          Reserve e confirme suas sessões de Reflexologia Podal e Imagens Mentais Terapêuticas (IMT) de forma totalmente simplificada.
                        </p>
                      </div>

                      <ul className="space-y-2.5 text-xs text-warm-850 font-semibold pt-1">
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Não é necessário criar usuário, senha ou conta</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Confirmação imediata na tela do seu dispositivo</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Painel simples com datas e horários livres reais</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-8">
                      <button
                        type="button"
                        onClick={() => setActiveMainTab('PORTAL')}
                        className="w-full py-4.5 px-6 rounded-2xl text-xs sm:text-sm font-sans font-black uppercase tracking-widest text-white bg-terapia-700 hover:bg-terapia-600 border-2 border-terapia-900 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 text-center flex items-center justify-center gap-2.5 cursor-pointer ring-4 ring-terapia-100"
                      >
                        <span>🗓️ Quero Agendar Consulta</span>
                        <ArrowRight className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Secure Therapist Restricted Login Form */}
                  <div className="bg-warm-150/50 bg-warm-200/20 border-3 border-warm-350 hover:border-indigo-600 rounded-[28px] p-6 lg:p-8 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300">
                    <div className="space-y-5">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 shadow-3xs border border-indigo-200">
                        <Lock className="w-7 h-7" />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-sans font-black uppercase text-indigo-700 tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">Área Restrita • Com Login</span>
                        <h3 className="text-xl sm:text-2xl font-serif font-black text-warm-950 pt-1.5">Painel Secreto do Terapeuta</h3>
                        <p className="text-sm text-warm-850 leading-relaxed font-sans font-medium">
                          Acesse ou crie sua conta para gerenciar prontuários, configurar serviços e faturamentos, e ajustar períodos de bloqueio.
                        </p>
                      </div>

                      {/* Login / signup switch tabs */}
                      <div className="flex border-b border-warm-300 gap-4">
                        <button
                          type="button"
                          onClick={() => { setAuthTab('LOGIN'); setLoginError(null); }}
                          className={`pb-2.5 text-xs font-sans font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                            authTab === 'LOGIN' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-warm-500'
                          }`}
                        >
                          Entrar na Conta
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthTab('REGISTER'); setLoginError(null); }}
                          className={`pb-2.5 text-xs font-sans font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                            authTab === 'REGISTER' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-warm-500'
                          }`}
                        >
                          Criar Nova Conta
                        </button>
                      </div>

                      {/* Dynamic Auth Forms */}
                      <form onSubmit={authTab === 'LOGIN' ? handleTherapistLogin : handleTherapistSignup} className="space-y-4 pt-1">
                        {authTab === 'REGISTER' && (
                          <>
                            <div>
                              <label className="block text-[10px] font-sans font-black text-warm-850 uppercase tracking-wider mb-1.5">Nome Completo</label>
                              <input 
                                type="text"
                                required
                                value={registerName}
                                onChange={(e) => setRegisterName(e.target.value)}
                                placeholder="Insira o seu nome"
                                className="w-full bg-white border-2 border-warm-300 focus:border-indigo-600 rounded-xl p-3.5 text-xs text-warm-950 font-bold tracking-wide outline-none shadow-3xs transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-sans font-black text-warm-850 uppercase tracking-wider mb-1.5">Sua Especialidade</label>
                              <input 
                                type="text"
                                required
                                value={registerSpecialty}
                                onChange={(e) => setRegisterSpecialty(e.target.value)}
                                placeholder="Ex: Reflexoterapeuta Integrativa"
                                className="w-full bg-white border-2 border-warm-300 focus:border-indigo-600 rounded-xl p-3.5 text-xs text-warm-950 font-bold tracking-wide outline-none shadow-3xs transition-all"
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <label className="block text-[10px] font-sans font-black text-warm-850 uppercase tracking-wider mb-1.5">E-mail Corporativo</label>
                          <input 
                            type="email" 
                            required
                            value={loginEmail} 
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="seu-email@dominio.com"
                            className="w-full bg-white border-2 border-warm-300 focus:border-indigo-600 rounded-xl p-3.5 text-xs text-warm-950 font-bold tracking-wide outline-none shadow-3xs transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-sans font-black text-warm-850 uppercase tracking-wider mb-1.5">Senha Corporativa</label>
                          <input 
                            type="password" 
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white border-2 border-warm-300 focus:border-indigo-600 rounded-xl p-3.5 text-xs text-warm-950 font-bold tracking-wide outline-none shadow-3xs transition-all"
                          />
                        </div>

                        {loginError && (
                          <div className="text-xs font-sans font-bold text-red-850 bg-red-50 border-2 border-red-200 rounded-2xl p-4.5 space-y-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <span className="text-base text-red-700">⚠️</span>
                              <span className="font-black uppercase tracking-wider text-[10px]">Falha de Validação do Google</span>
                            </div>
                            
                            <p className="text-xs leading-relaxed text-red-900">
                              {loginError}
                            </p>

                            {loginError.toLowerCase().includes('unauthorized-domain') && (
                              <div className="pt-2 border-t border-red-200/60 text-red-950 space-y-3 font-semibold">
                                <p className="font-extrabold text-[10px] text-red-900 uppercase tracking-wider">
                                  Como autorizar este domínio no Firebase:
                                </p>
                                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-red-900 text-[11px]">
                                  <li>Abra o <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-black text-red-950 hover:text-red-850">Console do Firebase</a> e acesse seu projeto.</li>
                                  <li>Va até a aba <strong>Authentication</strong> no menu lateral esquerdo.</li>
                                  <li>Clique na aba superior <strong>Settings</strong> (Configurações) e depois em <strong>Authorized domains</strong> (Domínios autorizados).</li>
                                  <li>Adicione os seguintes domínios na lista para permitir o login:</li>
                                </ol>
                                
                                <div className="space-y-1.5 pt-1">
                                  <div className="flex items-center justify-between gap-2 bg-white/70 border border-red-200 p-2 rounded-xl text-[10px] font-mono select-all">
                                    <span>ais-dev-tmyvqawv2fhpa2s2pdhrjs-299922628908.us-east5.run.app</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText('ais-dev-tmyvqawv2fhpa2s2pdhrjs-299922628908.us-east5.run.app');
                                      }}
                                      className="px-2 py-1 bg-red-100/80 hover:bg-red-205 text-[9px] font-sans font-bold uppercase tracking-wider rounded border border-red-300 transition-colors"
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 bg-white/70 border border-red-200 p-2 rounded-xl text-[10px] font-mono select-all">
                                    <span>ais-pre-tmyvqawv2fhpa2s2pdhrjs-299922628908.us-east5.run.app</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText('ais-pre-tmyvqawv2fhpa2s2pdhrjs-299922628908.us-east5.run.app');
                                      }}
                                      className="px-2 py-1 bg-red-100/80 hover:bg-red-205 text-[9px] font-sans font-bold uppercase tracking-wider rounded border border-red-300 transition-colors"
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                </div>
                                
                                <p className="text-[10px] text-red-800 leading-normal font-medium pt-1">
                                  💡 <em>Após adicionar, aguarde cerca de 30 segundos para o Firebase propagar a permissão e tente entrar novamente com o Google.</em>
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 space-y-3">
                          <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4.5 px-6 rounded-2xl text-xs sm:text-sm font-sans font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 border-2 border-indigo-900 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 active:translate-y-0 text-center flex items-center justify-center gap-2.5 cursor-pointer ring-4 ring-indigo-50 disabled:opacity-50"
                          >
                            <Lock className="w-4 h-4 shrink-0" />
                            <span>{isLoading ? 'Carregando...' : authTab === 'LOGIN' ? 'Entrar no Painel Seguro ➔' : 'Criar minha Conta ➔'}</span>
                          </button>

                          <div className="relative my-4 flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-warm-300"></div>
                            </div>
                            <span className="relative bg-white px-3 text-[10px] font-sans font-black uppercase text-warm-500 tracking-wider">ou continue com</span>
                          </div>

                          <button 
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full py-4 px-6 rounded-2xl text-xs sm:text-sm font-sans font-medium uppercase tracking-widest text-warm-800 bg-white hover:bg-warm-100 border-2 border-warm-300 hover:border-warm-450 transition-all duration-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-center flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 select-none"
                          >
                            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                            </svg>
                            <span>Entrar com o Google</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
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
                onlineMeetingLink={onlineMeetingLink}
                therapistContact={therapistContact}
                onSaveAllConfigs={handleSaveAllConfigs}
                isAuthenticated={isTherapistLoggedIn}
                setIsAuthenticated={handleSetIsAuthenticated}
              />
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
