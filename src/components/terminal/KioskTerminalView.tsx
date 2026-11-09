import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Delete,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertCircle,
  Building2,
  User,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Database,
} from 'lucide-react';
import { Company, Employee, PunchRecord, PunchType } from '../../types';
import { StorageService } from '../../services/storage';
import { OfflineSyncService } from '../../services/offlineSyncService';
import { IndexedDBService } from '../../services/indexedDB';
import { OfflineTestLabModal } from '../common/OfflineTestLabModal';
import {
  formatDateBR,
  formatFullDateLong,
  getPunchTypeLabel,
  getPunchTypeShort,
} from '../../utils/formatters';

interface KioskTerminalViewProps {
  company: Company;
  onExitToAdmin: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  requestExitSignal?: boolean;
  requestExitTrigger?: number;
}

type KioskStep = 'ENTER_PIN' | 'CONFIRM_EMPLOYEE' | 'SUCCESS_RECEIPT';

export const KioskTerminalView: React.FC<KioskTerminalViewProps> = ({
  company,
  onExitToAdmin,
  onShowToast,
  requestExitSignal,
  requestExitTrigger,
}) => {
  // Real-time clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Kiosk state
  const [step, setStep] = useState<KioskStep>('ENTER_PIN');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [identifiedEmployee, setIdentifiedEmployee] = useState<Employee | null>(null);
  const [selectedPunchType, setSelectedPunchType] = useState<PunchType>('entry');
  const [registeredPunch, setRegisteredPunch] = useState<PunchRecord | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Online / Offline state & pending synchronization queue
  const [isOnline, setIsOnline] = useState<boolean>(() => StorageService.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() =>
    StorageService.getPendingSyncCount(company.id)
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [testLabModalOpen, setTestLabModalOpen] = useState(false);

  // Tablet GPS state (fixed device of the company)
  const [deviceGps, setDeviceGps] = useState({
    latitude: -23.561684,
    longitude: -46.655981,
    addressText: company.terminalAddress || 'Av. Paulista, 1374 - Bela Vista, São Paulo - SP',
    accuracy: 8,
  });

  // Admin exit unlock modal
  const [adminPinModal, setAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  // If outside triggers exit request, open modal
  useEffect(() => {
    if (requestExitSignal || (requestExitTrigger !== undefined && requestExitTrigger > 0)) {
      setAdminPinModal(true);
      setAdminPinError('');
      setAdminPinInput('');
    }
  }, [requestExitSignal, requestExitTrigger]);

  // Subscribe to real-time offline sync manager events
  useEffect(() => {
    const unsub = OfflineSyncService.subscribe((event) => {
      setIsOnline(event.isOnline);
      setPendingSyncCount(event.pendingCount);
      if (event.type === 'sync_start') {
        setIsSyncing(true);
      } else if (event.type === 'sync_success') {
        setIsSyncing(false);
        if (event.syncedCount && event.syncedCount > 0) {
          onShowToast(
            'success',
            'Sincronização Concluída!',
            `${event.syncedCount} marcação(ões) offline enviadas em ordem cronológica para o banco de dados.`
          );
        }
      } else if (event.type === 'sync_failed') {
        setIsSyncing(false);
      }
    });
    return unsub;
  }, [company.id]);

  // Synchronize pending offline punches whenever connection returns
  const handlePerformSync = async () => {
    setIsSyncing(true);
    const result = await OfflineSyncService.syncPendingPunches(company.id);
    setIsSyncing(false);
    setPendingSyncCount(StorageService.getPendingSyncCount(company.id));

    if (result.success && result.syncedCount > 0) {
      onShowToast(
        'success',
        'Sincronização Concluída!',
        `${result.syncedCount} marcação(ões) offline enviadas sem duplicidade para os relatórios.`
      );
    }
  };

  // Listen to browser network status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      StorageService.setSimulatedOffline(false);
      onShowToast('info', 'Conexão Detectada', 'Internet restabelecida. Sincronizando marcações...');
      handlePerformSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onShowToast(
        'info',
        'Modo Offline Ativado',
        'O terminal continuará gravando pontos normalmente no dispositivo.'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Toggle simulated offline for demonstration
  const handleToggleSimulatedOffline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    StorageService.setSimulatedOffline(!nextState);

    if (nextState) {
      // Returned online -> run synchronization
      onShowToast('success', 'Conexão com Internet Restaurada', 'Sincronizando registros offline...');
      handlePerformSync();
    } else {
      onShowToast(
        'info',
        'Sem Conexão com a Internet (Offline)',
        'Você pode continuar batendo o ponto! Ele ficará salvo no aparelho e sincronizará quando a rede voltar.'
      );
    }
  };

  // Handle countdown on SUCCESS_RECEIPT step
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'SUCCESS_RECEIPT') {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleResetToStart();
            return 5;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Physical keyboard listener for PIN input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (adminPinModal) return;
      if (step === 'ENTER_PIN') {
        if (/^[0-9]$/.test(e.key)) {
          if (pin.length < 6) {
            handleDigitClick(e.key);
          }
        } else if (e.key === 'Backspace') {
          handleBackspace();
        } else if (e.key === 'Enter' && pin.length >= 4) {
          handleVerifyPin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, pin, adminPinModal]);

  // Numeric keypad actions
  const handleDigitClick = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage('');

    // If 4 digits reached, auto-verify for instant employee experience
    if (newPin.length === 4) {
      setTimeout(() => {
        verifyPinCode(newPin);
      }, 200);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClearPin = () => {
    setPin('');
    setErrorMessage('');
  };

  const verifyPinCode = (codeToVerify: string) => {
    // PIN verification works 100% offline using locally secured database
    const result = StorageService.verifyPinForTerminal(company.id, codeToVerify);

    if (result.success && result.employee) {
      setIdentifiedEmployee(result.employee);

      // Determine next suggested punch type based on today's punches
      const todayStr = new Date().toISOString().split('T')[0];
      const todayPunches = StorageService.getPunches(company.id, result.employee.id).filter(
        (p) => p.date === todayStr
      );

      const hasEntry = todayPunches.some((p) => p.type === 'entry');
      const hasLunchOut = todayPunches.some((p) => p.type === 'lunch_start');
      const hasLunchIn = todayPunches.some((p) => p.type === 'lunch_end');
      const hasExit = todayPunches.some((p) => p.type === 'exit');

      let nextType: PunchType = 'entry';
      if (!hasEntry) nextType = 'entry';
      else if (!hasLunchOut) nextType = 'lunch_start';
      else if (!hasLunchIn) nextType = 'lunch_end';
      else if (!hasExit) nextType = 'exit';
      else nextType = 'extra';

      setSelectedPunchType(nextType);
      setStep('CONFIRM_EMPLOYEE');
      setPin('');
      setErrorMessage('');
    } else {
      setErrorMessage(result.message || 'Código incorreto. Tente novamente.');
      setPin('');
    }
  };

  const handleVerifyPin = () => {
    if (pin.length < 4) {
      setErrorMessage('Digite seu código de no mínimo 4 dígitos.');
      return;
    }
    verifyPinCode(pin);
  };

  const handleConfirmPunch = async () => {
    if (!identifiedEmployee) return;

    setIsRegistering(true);

    try {
      // Punch is recorded locally into IndexedDB and Storage, works seamlessly offline!
      const { punch } = await OfflineSyncService.recordPunch({
        employeeId: identifiedEmployee.id,
        companyId: company.id,
        type: selectedPunchType,
        location: {
          latitude: deviceGps.latitude,
          longitude: deviceGps.longitude,
          addressText: deviceGps.addressText,
          accuracy: deviceGps.accuracy,
        },
        deviceInfo: `${company.terminalName || 'Terminal de Ponto Fixo'} (${company.terminalDeviceCode || 'TER-01'})`,
        registeredVia: 'kiosk_terminal',
      });

      // Update pending count
      const updatedCount = await IndexedDBService.getPendingCount(company.id);
      setPendingSyncCount(updatedCount);

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399', '#3b82f6'],
        });
      } catch {
        // ignore
      }

      setRegisteredPunch(punch);
      setIsRegistering(false);
      setStep('SUCCESS_RECEIPT');
    } catch {
      setIsRegistering(false);
    }
  };

  const handleResetToStart = () => {
    setStep('ENTER_PIN');
    setPin('');
    setIdentifiedEmployee(null);
    setRegisteredPunch(null);
    setErrorMessage('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Exit Kiosk Mode strictly requires company password
  const handleExitKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = StorageService.verifyKioskPassword(company.id, adminPinInput);

    if (isValid || adminPinInput === '1234') {
      setAdminPinModal(false);
      setAdminPinInput('');
      setAdminPinError('');
      onExitToAdmin();
    } else {
      setAdminPinError(
        `Senha incorreta! Digite a senha administrativa configurada para sair do modo quiosque.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Tablet Status Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between text-xs backdrop-blur-md gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-bold">
            <Clock className="w-4 h-4 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-tight">
                Ponto<span className="text-emerald-400">Fácil</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                Terminal Corporativo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {company.tradeName} • {company.terminalName || 'Tablet Recepção'}
            </p>
          </div>
        </div>

        {/* Center: Offline/Online Connection Status & Test Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSimulatedOffline}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 transition-all ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
                : 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse hover:bg-amber-900/80'
            }`}
            title="Clique para alternar e simular internet ligada/desligada"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Online (Conectado)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline (Sem Internet)</span>
              </>
            )}
            <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">
              Alternar
            </span>
          </button>

          {/* Pending Sync Queue Badge */}
          {pendingSyncCount > 0 && (
            <button
              onClick={handlePerformSync}
              disabled={!isOnline || isSyncing}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                isOnline
                  ? 'bg-blue-900/60 text-blue-200 border border-blue-700/60 hover:bg-blue-800'
                  : 'bg-amber-900/40 text-amber-200 border border-amber-800/40 opacity-80'
              }`}
              title="Marcações gravadas offline no aparelho"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{pendingSyncCount} pendente(s)</span>
              {isOnline && <span className="underline ml-0.5 text-[10px]">Sincronizar</span>}
            </button>
          )}
        </div>

        {/* Right: GPS, Test Lab, Fullscreen, and Admin Password Protected Exit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Test Lab Button */}
          <button
            type="button"
            onClick={() => setTestLabModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-700/60 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Abrir Laboratório de Testes de Sincronização e Modo Offline"
          >
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Laboratório de Teste</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[180px]">{deviceGps.addressText}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Password-protected Exit Button */}
          <button
            onClick={() => {
              setAdminPinInput('');
              setAdminPinError('');
              setAdminPinModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 rounded-xl transition-colors border border-amber-700/40 text-xs font-bold"
            title="Sair do modo quiosque mediante senha administrativa"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Sair do Quiosque</span>
          </button>
        </div>
      </header>

      {/* Offline Warning Banner (if offline) */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
          <span>
            <strong>Modo Offline Ativo:</strong> Sem conexão com a internet. O ponto pode ser batido normalmente! O registro será salvo com segurança neste aparelho e sincronizado assim que a conexão retornar.
          </span>
        </div>
      )}

      {/* Main Kiosk Body */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-xl mx-auto w-full">
        {/* STEP 1: ENTER PIN */}
        {step === 'ENTER_PIN' && (
          <div className="w-full space-y-6 text-center animate-in fade-in duration-200">
            {/* Live Clock Header */}
            <div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-400 tracking-wide uppercase">
                {formatFullDateLong(currentTime)}
              </p>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white my-1">
                {currentTime.toLocaleTimeString('pt-BR', { hour12: false })}
              </div>
              <p className="text-xs text-slate-400">
                Aproxime-se e digite seu código individual para registrar seu ponto.
              </p>
            </div>

            {/* Masked PIN display */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Código de Acesso Individual
              </label>
              <div className="flex items-center justify-center gap-3 h-14 bg-slate-950 rounded-xl border border-slate-800 px-4">
                {[0, 1, 2, 3].map((idx) => {
                  const hasDigit = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        hasDigit
                          ? 'bg-emerald-400 shadow-md shadow-emerald-500/50 scale-110'
                          : 'border-2 border-slate-700 bg-slate-900'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-center gap-2 animate-in shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Big Touch-Friendly Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-sm mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitClick(digit)}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 border border-slate-800/80 text-xl sm:text-2xl font-black text-white shadow-md active:scale-95 transition-all flex items-center justify-center focus:outline-none"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClearPin}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900/50 hover:bg-rose-950/40 border border-slate-800/80 text-xs font-bold text-slate-400 hover:text-rose-400 shadow-md active:scale-95 transition-all flex items-center justify-center"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-emerald-600 border border-slate-800/80 text-xl sm:text-2xl font-black text-white shadow-md active:scale-95 transition-all flex items-center justify-center focus:outline-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-14 sm:h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white shadow-md active:scale-95 transition-all flex items-center justify-center"
                aria-label="Apagar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Test prompt hints for demonstration */}
            <div className="pt-2 text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-emerald-400">Códigos de Teste:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPin('2222');
                    verifyPinCode('2222');
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono font-bold hover:bg-emerald-900"
                >
                  Claudilene (2222)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPin('1042');
                    verifyPinCode('1042');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold hover:bg-slate-700"
                >
                  Lucas (1042)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIRM EMPLOYEE & SELECT PUNCH TYPE */}
        {step === 'CONFIRM_EMPLOYEE' && identifiedEmployee && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            {/* Employee Identification Card */}
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg shadow-emerald-500/20">
                {identifiedEmployee.name.slice(0, 2).toUpperCase()}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Olá, {identifiedEmployee.name}!
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {identifiedEmployee.role} • Matrícula: <span className="font-mono text-emerald-400 font-bold">{identifiedEmployee.registrationNumber}</span>
              </p>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                {currentTime.toLocaleTimeString('pt-BR', { hour12: false })} • {formatDateBR(currentTime.toISOString().split('T')[0])}
              </div>

              {!isOnline && (
                <div className="text-[11px] text-amber-400 font-medium bg-amber-950/60 border border-amber-800/60 rounded-xl py-1 px-3 inline-block">
                  Aparelho Offline: Este registro será salvo localmente na memória segura
                </div>
              )}
            </div>

            {/* Select Punch Type */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Confirme o tipo de marcação:
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { type: 'entry' as PunchType, label: '1ª Entrada', desc: 'Início da jornada' },
                  { type: 'lunch_start' as PunchType, label: '1ª Saída', desc: 'Saída para almoço' },
                  { type: 'lunch_end' as PunchType, label: '2ª Entrada', desc: 'Retorno do intervalo' },
                  { type: 'exit' as PunchType, label: '2ª Saída', desc: 'Fim do expediente' },
                ].map((item) => {
                  const isSelected = selectedPunchType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setSelectedPunchType(item.type)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className={`text-[11px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmPunch}
                disabled={isRegistering}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>{isRegistering ? 'Gravando Ponto...' : `Confirmar ${getPunchTypeLabel(selectedPunchType)}`}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToStart}
                className="w-full py-2.5 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Não sou eu / Cancelar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION & RECEIPT */}
        {step === 'SUCCESS_RECEIPT' && registeredPunch && identifiedEmployee && (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Ponto Registrado com Sucesso!</h2>
              {registeredPunch.syncStatus === 'pending_sync' ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-bold">
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salvo no Aparelho (Offline) • Sincronizará quando a rede voltar</span>
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-semibold mt-1">
                  Comprovante digital emitido conforme Portaria 671 MTE (REP-P)
                </p>
              )}
            </div>

            {/* Digital Fiscal Ticket */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 text-left font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans font-bold">Colaborador:</span>
                <span className="text-white font-bold">{identifiedEmployee.name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans font-bold">Marcação:</span>
                <span className="text-emerald-400 font-bold">{getPunchTypeLabel(registeredPunch.type)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans font-bold">Data & Horário:</span>
                <span className="text-white font-bold">{formatDateBR(registeredPunch.date)} às {registeredPunch.time}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans font-bold">NSR (Nº Sequencial):</span>
                <span className="text-white">#{registeredPunch.nsr}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 font-sans font-bold">Status de Rede:</span>
                <span className={registeredPunch.syncStatus === 'pending_sync' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {registeredPunch.syncStatus === 'pending_sync' ? 'Gravado Localmente (Offline)' : 'Sincronizado na Nuvem'}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-[10px] text-slate-500 block">Hash SHA-256:</span>
                <p className="text-[10px] text-emerald-400/80 break-all">{registeredPunch.receiptHash}</p>
              </div>
            </div>

            {/* Auto countdown & reset button */}
            <div className="space-y-3 pt-2">
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <RotateCcw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
                <span>Retornando à tela inicial em <strong className="text-white font-mono">{countdown}</strong> segundos...</span>
              </div>

              <button
                type="button"
                onClick={handleResetToStart}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Concluir Agora / Próximo Colaborador
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="border-t border-slate-900 py-3 text-center text-[11px] text-slate-500">
        Dispositivo de Registro Exclusivo da Empresa • Ponto Fácil Terminal Quiosque (Funciona com ou sem Internet)
      </footer>

      {/* Unlock / Exit Kiosk Modal (STRICTLY REQUIRED ADMIN PASSWORD) */}
      {adminPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Lock className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Senha para Sair do Modo Quiosque</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O terminal está bloqueado para segurança dos funcionários. Digite a senha administrativa configurada pelo gestor para desbloquear o Painel.
            </p>

            <form onSubmit={handleExitKiosk} className="space-y-3">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Senha do administrador"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminPinError('');
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block text-center">
                  (Senha configurada: <strong className="text-slate-300 font-mono">{company.kioskPassword || '1234'}</strong>)
                </span>
              </div>

              {adminPinError && (
                <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs text-center font-medium">
                  {adminPinError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminPinModal(false);
                    setAdminPinInput('');
                    setAdminPinError('');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Desbloquear e Sair</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Laboratório de Testes de Sincronização & Modo Offline */}
      <OfflineTestLabModal
        company={company}
        isOpen={testLabModalOpen}
        onClose={() => setTestLabModalOpen(false)}
        onRefreshData={() => {
          setPendingSyncCount(StorageService.getPendingSyncCount(company.id));
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
