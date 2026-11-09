import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  AlertCircle,
  Coffee,
  LogOut,
  LogIn,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  History,
  Sparkles,
  Navigation,
  Compass,
} from 'lucide-react';
import { Employee, PunchRecord, Company, PunchType, AdjustmentRequest } from '../../types';
import { StorageService } from '../../services/storage';
import {
  formatDateBR,
  formatFullDateLong,
  formatMinutesToHours,
  formatTimeHHMM,
  getPunchTypeLabel,
  getPunchTypeShort,
} from '../../utils/formatters';
import { PunchReceiptModal } from './PunchReceiptModal';
import { EmployeeTimecard } from './EmployeeTimecard';
import { AdjustmentModal } from './AdjustmentModal';

interface EmployeePunchViewProps {
  employee: Employee;
  company?: Company;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const EmployeePunchView: React.FC<EmployeePunchViewProps> = ({
  employee,
  company,
  onShowToast,
}) => {
  // Navigation tabs for the employee
  const [activeTab, setActiveTab] = useState<'punch' | 'history'>('punch');

  // Real-time ticking clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's date string
  const todayStr = currentTime.toISOString().split('T')[0];

  // Load punches and adjustments from storage
  const [punches, setPunches] = useState<PunchRecord[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    const allPunches = StorageService.getPunches(employee.companyId, employee.id);
    setPunches(allPunches);
    const allAdjs = StorageService.getAdjustments(employee.companyId, employee.id);
    setAdjustments(allAdjs);
  };

  useEffect(() => {
    refreshData();
  }, [employee.id, employee.companyId]);

  // Filter today's punches
  const todayPunches = punches
    .filter((p) => p.date === todayStr)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Today's 4 CLT Standard Slots
  const entryPunch = todayPunches.find((p) => p.type === 'entry');
  const lunchOutPunch = todayPunches.find((p) => p.type === 'lunch_start');
  const lunchInPunch = todayPunches.find((p) => p.type === 'lunch_end');
  const exitPunch = todayPunches.find((p) => p.type === 'exit');
  const extraPunches = todayPunches.filter((p) => p.type === 'extra');

  // Determine next suggested punch type based on CLT flow
  const determineNextPunchType = (): PunchType => {
    if (!entryPunch) return 'entry';
    if (!lunchOutPunch) return 'lunch_start';
    if (!lunchInPunch) return 'lunch_end';
    if (!exitPunch) return 'exit';
    return 'extra';
  };

  const [selectedPunchType, setSelectedPunchType] = useState<PunchType>(determineNextPunchType());

  // Update selected type when today's punches change
  useEffect(() => {
    setSelectedPunchType(determineNextPunchType());
  }, [todayPunches.length]);

  // GPS / Geolocation state
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    addressText: string;
    accuracy: number;
    status: 'detecting' | 'ready' | 'denied' | 'simulated';
  }>({
    latitude: -23.561684,
    longitude: -46.655981,
    addressText: 'Av. Paulista, 1374 - Bela Vista, São Paulo - SP',
    accuracy: 9,
    status: 'ready',
  });

  // Request browser GPS on component mount
  const requestBrowserGps = () => {
    if ('geolocation' in navigator) {
      setGpsLocation((prev) => ({ ...prev, status: 'detecting' }));
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            addressText: 'Localização atual detectada via GPS do dispositivo',
            accuracy: Math.round(pos.coords.accuracy),
            status: 'ready',
          });
          onShowToast('info', 'GPS Localizado', `Precisão de ±${Math.round(pos.coords.accuracy)}m.`);
        },
        () => {
          // Fallback to simulated verified office address
          setGpsLocation({
            latitude: -23.561684,
            longitude: -46.655981,
            addressText: 'Av. Paulista, 1374 - Bela Vista, São Paulo - SP (Ponto na Empresa)',
            accuracy: 12,
            status: 'simulated',
          });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<PunchRecord | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  // Big Punch handler
  const handleRegisterPunch = () => {
    setLoading(true);

    setTimeout(() => {
      const punchTime = new Date().toTimeString().split(' ')[0];
      const newPunch = StorageService.addPunch({
        employeeId: employee.id,
        companyId: employee.companyId,
        type: selectedPunchType,
        location: {
          latitude: gpsLocation.latitude,
          longitude: gpsLocation.longitude,
          addressText: gpsLocation.addressText,
          accuracy: gpsLocation.accuracy,
        },
        deviceInfo: 'Dispositivo Ponto Fácil Web Mobile',
      });

      // Confetti effect
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#065f46', '#34d399', '#3b82f6'],
        });
      } catch {
        // ignore
      }

      refreshData();
      setLoading(false);
      setSelectedReceipt(newPunch);
      onShowToast(
        'success',
        'Ponto Registrado com Sucesso!',
        `${getPunchTypeLabel(newPunch.type)} às ${newPunch.time}`
      );
    }, 500);
  };

  // Calculate day summary metrics
  const daySummary = StorageService.getDailySummary(employee.id, todayStr);
  const targetMinutes = employee.dailyTargetMinutes;
  const progressPercent = Math.min(
    100,
    Math.round((daySummary.totalWorkedMinutes / targetMinutes) * 100)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Banner: Employee profile & Department */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex-shrink-0">
            <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center font-black text-xl text-emerald-400">
              {employee.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {employee.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ativo
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {employee.role} • <span className="text-emerald-400">{employee.department}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Matrícula: <span className="font-mono">{employee.registrationNumber}</span> | {company?.tradeName || 'Empresa'}
            </p>
          </div>
        </div>

        {/* Time Bank Balance pill */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 sm:p-4 text-right self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end">
          <span className="text-[11px] text-slate-400 font-medium">Saldo do Banco de Horas:</span>
          <span
            className={`text-lg sm:text-xl font-mono font-extrabold ${
              employee.timeBankMinutes >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatMinutesToHours(employee.timeBankMinutes, true)}
          </span>
        </div>
      </div>

      {/* Main Mode Switcher: Registrar Ponto vs Histórico / Espelho */}
      <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-200/80 p-1.5 rounded-2xl max-w-md mx-auto sm:mx-0">
        <button
          onClick={() => setActiveTab('punch')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'punch'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Registrar Ponto Hoje</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4 text-emerald-600" />
          <span>Meu Espelho & Histórico</span>
        </button>
      </div>

      {activeTab === 'punch' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Big Clock & Punch Action Card */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between items-center text-center">
            {/* Date & live time */}
            <div className="w-full">
              <span className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider block">
                {formatFullDateLong(currentTime)}
              </span>

              {/* Digital Big Clock */}
              <div className="my-4 font-mono font-black text-4xl sm:text-6xl text-slate-900 tracking-tight flex items-baseline justify-center">
                <span>{currentTime.toLocaleTimeString('pt-BR', { hour12: false })}</span>
                <span className="text-xs sm:text-sm font-sans font-bold text-slate-400 ml-2">
                  (BRT)
                </span>
              </div>
            </div>

            {/* Suggested Punch Type selector */}
            <div className="w-full max-w-sm mb-6">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Marcação a ser realizada:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'entry' as PunchType, label: '1ª Entrada' },
                  { type: 'lunch_start' as PunchType, label: '1ª Saída (Intervalo)' },
                  { type: 'lunch_end' as PunchType, label: '2ª Retorno (Almoço)' },
                  { type: 'exit' as PunchType, label: '2ª Saída (Fim)' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedPunchType(item.type)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                      selectedPunchType === item.type
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BIG PUNCH BUTTON */}
            <div className="my-2 relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-emerald-500/10 animate-ping pointer-events-none" />

              <button
                onClick={handleRegisterPunch}
                disabled={loading}
                className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-emerald-500 to-teal-700 hover:from-emerald-400 hover:to-teal-600 text-white font-extrabold shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50"
              >
                <Clock className="w-9 h-9 stroke-[2.2] animate-pulse" />
                <span className="text-base sm:text-lg font-black tracking-wide uppercase">
                  {loading ? 'Validando...' : 'Bater Ponto'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-100 px-2 py-0.5 rounded-full bg-emerald-800/40">
                  {getPunchTypeShort(selectedPunchType)}
                </span>
              </button>
            </div>

            {/* GPS Status Indicator */}
            <div className="mt-6 w-full max-w-md pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-left">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Geolocalização Ativa</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                    {gpsLocation.addressText}
                  </p>
                </div>
              </div>

              <button
                onClick={requestBrowserGps}
                className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                title="Atualizar GPS"
              >
                <Navigation className="w-3 h-3" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Right column: Today's 4 CLT Punches & Progress Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Daily Summary & Jornada progress */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Jornada de Hoje</h3>
                  <p className="text-xs text-slate-500">Carga horária diária: 08h 00m</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-black text-slate-900">
                    {formatMinutesToHours(daySummary.totalWorkedMinutes)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {progressPercent}% da jornada
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {daySummary.breakMinutes > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>Intervalo de almoço usufruído: {daySummary.breakMinutes} minutos</span>
                </div>
              )}
            </div>

            {/* 4 CLT Punch Slots of the Day */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Registros do Dia</h3>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  {formatDateBR(todayStr)}
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Entrada */}
                <div
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    entryPunch
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        entryPunch
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">1ª Entrada</p>
                      <p className="text-[11px] text-slate-500">Início do expediente</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {entryPunch ? (
                      <button
                        onClick={() => setSelectedReceipt(entryPunch)}
                        className="group text-right"
                      >
                        <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-emerald-700">
                          {entryPunch.time}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-semibold group-hover:underline">
                          Ver Comprovante
                        </span>
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">--:--:--</span>
                    )}
                  </div>
                </div>

                {/* 2. Saída Intervalo */}
                <div
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    lunchOutPunch
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        lunchOutPunch
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">1ª Saída</p>
                      <p className="text-[11px] text-slate-500">Saída para almoço</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {lunchOutPunch ? (
                      <button
                        onClick={() => setSelectedReceipt(lunchOutPunch)}
                        className="group text-right"
                      >
                        <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-amber-700">
                          {lunchOutPunch.time}
                        </span>
                        <span className="block text-[10px] text-amber-600 font-semibold group-hover:underline">
                          Ver Comprovante
                        </span>
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">--:--:--</span>
                    )}
                  </div>
                </div>

                {/* 3. Retorno Intervalo */}
                <div
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    lunchInPunch
                      ? 'bg-blue-50/50 border-blue-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        lunchInPunch
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">2ª Entrada</p>
                      <p className="text-[11px] text-slate-500">Retorno do intervalo</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {lunchInPunch ? (
                      <button
                        onClick={() => setSelectedReceipt(lunchInPunch)}
                        className="group text-right"
                      >
                        <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-blue-700">
                          {lunchInPunch.time}
                        </span>
                        <span className="block text-[10px] text-blue-600 font-semibold group-hover:underline">
                          Ver Comprovante
                        </span>
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">--:--:--</span>
                    )}
                  </div>
                </div>

                {/* 4. Saída Final */}
                <div
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    exitPunch
                      ? 'bg-teal-50/50 border-teal-200'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        exitPunch
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">2ª Saída</p>
                      <p className="text-[11px] text-slate-500">Fim do expediente</p>
                    </div>
                  </div>

                  <div className="text-right">
                    {exitPunch ? (
                      <button
                        onClick={() => setSelectedReceipt(exitPunch)}
                        className="group text-right"
                      >
                        <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-teal-700">
                          {exitPunch.time}
                        </span>
                        <span className="block text-[10px] text-teal-600 font-semibold group-hover:underline">
                          Ver Comprovante
                        </span>
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-slate-400">--:--:--</span>
                    )}
                  </div>
                </div>

                {/* Extras if any */}
                {extraPunches.map((extra) => (
                  <div
                    key={extra.id}
                    className="p-3 rounded-2xl border bg-purple-50/50 border-purple-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                        +
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Marcação Extra</p>
                        <p className="text-[11px] text-slate-500">Ponto adicional registrado</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReceipt(extra)}
                      className="group text-right"
                    >
                      <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-purple-700">
                        {extra.time}
                      </span>
                      <span className="block text-[10px] text-purple-600 font-semibold group-hover:underline">
                        Ver Comprovante
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Justification link */}
              <div className="pt-2 text-center">
                <button
                  onClick={() => setAdjustmentModalOpen(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Esqueceu de bater algum ponto? Solicitar ajuste</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Histórico & Espelho Mensal */
        <EmployeeTimecard
          employee={employee}
          company={company}
          punches={punches}
          adjustments={adjustments}
          onOpenAdjustmentModal={() => setAdjustmentModalOpen(true)}
        />
      )}

      {/* Receipt Modal */}
      <PunchReceiptModal
        punch={selectedReceipt}
        employee={employee}
        company={company}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Adjustment Request Modal */}
      <AdjustmentModal
        employee={employee}
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        onSuccess={(msg) => {
          refreshData();
          onShowToast('success', 'Solicitação Enviada', msg);
        }}
      />
    </div>
  );
};
