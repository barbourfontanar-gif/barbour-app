import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  Star,
  CheckCircle,
  BarChart3,
  LogOut,
  Loader2,
  Package,
  Clock,
  Calendar,
  AlertTriangle,
  User,
  Eye,
  EyeOff,
  Lock,
  X,
  ClipboardList,
} from 'lucide-react';

// --- CONFIGURACIÓN ---
const LOGO_URL =
  'https://upload.wikimedia.org/wikipedia/commons/a/a5/Barbour_Brand_Logo.svg';
const STORES = ['fontanar', 'andino', 'unicentro', 'calle90'];

// --- UTILIDADES ---
const formatDate = (isoString) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getMonthYear = (isoString) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (key) => {
  const [year, month] = key.split('-');
  const date = new Date(year, month - 1);
  return date
    .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    .toUpperCase();
};

const calculateDays = (start, end) => {
  const diffTime = Math.abs(new Date(end) - new Date(start));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- COMPONENTE 1: ENCUESTA (CLIENTE) ---
const Survey = () => {
  const [searchParams] = useSearchParams();
  const store = searchParams.get('store') || 'General';
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    tiempo: '',
    presentacion: 0,
    calidad: '',
    confirmacion: false,
  });

  // Lógica de Puntaje Global
  const calculateScore = () => {
    let timeScore = answers.tiempo === 'Hubo demora' ? 1 : 5;
    let qualityScore = 5;
    if (answers.calidad.includes('esperaba más')) qualityScore = 3;
    if (answers.calidad.includes('No estoy')) qualityScore = 1;

    // Promedio: (Tiempo + Presentación + Calidad) / 3
    return ((timeScore + answers.presentacion + qualityScore) / 3).toFixed(1);
  };

  const submitSurvey = async () => {
    setLoading(true);
    const finalScore = calculateScore();
    try {
      await addDoc(collection(db, 'surveys'), {
        ...answers,
        store: store.toLowerCase(),
        timestamp: new Date().toISOString(),
        status: 'pending',
        clientName: '',
        daysProcess: 0,
        globalScore: parseFloat(finalScore), // Guardamos el promedio real
      });
      setStep(step + 1);
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const steps = [
    {
      title: 'Bienvenido a Barbour Re-Waxing',
      content: (
        <div className="text-center flex flex-col items-center">
          <img src={LOGO_URL} className="w-48 mb-8" alt="Barbour" />
          <p className="text-gray-600 mb-8 text-center">
            Ayúdanos a mejorar nuestro servicio legendario.
          </p>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-[#2d3b2d] text-white py-4 rounded-full font-bold shadow-lg"
          >
            INICIAR ENCUESTA
          </button>
          <p className="mt-4 text-xs text-gray-400 uppercase tracking-widest">
            Tienda: {store}
          </p>
        </div>
      ),
    },
    {
      title: '¿Tu prenda estuvo lista a tiempo?',
      content: (
        <div className="space-y-4 flex flex-col items-center w-full">
          {['Antes de la fecha', 'Justo a tiempo', 'Hubo demora'].map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setAnswers({ ...answers, tiempo: opt });
                setStep(2);
              }}
              className="w-full border border-[#2d3b2d] text-[#2d3b2d] p-4 rounded-xl hover:bg-[#2d3b2d] hover:text-white transition-all font-medium text-center justify-center"
            >
              {opt}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Presentación de la prenda',
      content: (
        <div className="text-center flex flex-col items-center w-full">
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                onClick={() => setAnswers({ ...answers, presentacion: n })}
                className={`w-10 h-10 cursor-pointer transition-all ${
                  answers.presentacion >= n
                    ? 'fill-[#a67c52] text-[#a67c52] scale-110'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            disabled={!answers.presentacion}
            onClick={() => setStep(3)}
            className="w-full bg-[#2d3b2d] text-white py-4 rounded-full disabled:opacity-50 font-bold"
          >
            SIGUIENTE
          </button>
        </div>
      ),
    },
    {
      title: 'Calidad del encerado',
      content: (
        <div className="space-y-4 flex flex-col items-center w-full">
          {[
            'Uniforme y renovado',
            'Cumple, pero esperaba más',
            'No estoy satisfecho',
          ].map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setAnswers({ ...answers, calidad: opt });
                setStep(4);
              }}
              className="w-full border border-[#2d3b2d] p-4 rounded-xl hover:bg-[#2d3b2d] hover:text-white text-center font-medium justify-center"
            >
              {opt}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Confirmación final',
      content: (
        <div className="text-center flex flex-col items-center w-full">
          <label className="flex items-center justify-center gap-4 bg-white p-4 rounded-xl shadow-sm mb-6 cursor-pointer border border-gray-100 w-full">
            <input
              type="checkbox"
              className="w-6 h-6 accent-[#2d3b2d]"
              onChange={(e) =>
                setAnswers({ ...answers, confirmacion: e.target.checked })
              }
            />
            <span className="text-sm font-medium">Confirmo recibido.</span>
          </label>
          <button
            disabled={!answers.confirmacion || loading}
            onClick={submitSurvey}
            className="w-full bg-[#2d3b2d] text-white py-4 rounded-full flex justify-center font-bold"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              'ENVIAR RESPUESTAS'
            )}
          </button>
        </div>
      ),
    },
    {
      title: '¡Gracias!',
      content: (
        <div className="text-center flex flex-col items-center">
          <CheckCircle className="w-20 h-20 text-green-700 mb-4" />
          <p className="font-serif italic text-lg text-center">
            "The best British clothing for the worst British weather."
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fdfcfb] flex items-center justify-center p-6 font-serif">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {step > 0 && step < 5 && (
              <h2 className="text-xl text-center mb-6 text-[#2d3b2d] font-bold uppercase tracking-widest">
                {steps[step].title}
              </h2>
            )}
            {steps[step].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- COMPONENTE 2: ADMIN DASHBOARD ---
const Admin = () => {
  const [user, setUser] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [monthsList, setMonthsList] = useState([]);
  const [filterStore, setFilterStore] = useState('todas');

  // Modales
  const [editingId, setEditingId] = useState(null);
  const [viewingSurvey, setViewingSurvey] = useState(null); // Estado para ver detalles
  const [editData, setEditData] = useState({
    clientName: '',
    receptionDate: '',
    deliveryDate: '',
  });
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchSurveys();
    });
  }, []);

  const fetchSurveys = async () => {
    const q = query(collection(db, 'surveys'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSurveys(data);

    const months = [...new Set(data.map((d) => getMonthYear(d.timestamp)))];
    setMonthsList(months);
    if (months.length > 0 && !selectedMonth) setSelectedMonth(months[0]);
  };

  const handleUpdate = async () => {
    if (
      !editData.receptionDate ||
      !editData.deliveryDate ||
      !editData.clientName
    )
      return alert('Llena todos los datos');
    const days = calculateDays(editData.receptionDate, editData.deliveryDate);
    await updateDoc(doc(db, 'surveys', editingId), {
      clientName: editData.clientName,
      receptionDate: editData.receptionDate,
      deliveryDate: editData.deliveryDate,
      daysProcess: days,
      status: 'completed',
    });
    setEditingId(null);
    fetchSurveys();
  };

  const handleChangePass = async () => {
    if (newPass.length < 6)
      return alert('La contraseña debe tener al menos 6 caracteres');
    try {
      await updatePassword(user, newPass);
      alert('Contraseña actualizada correctamente');
      setShowPassModal(false);
      setNewPass('');
    } catch (e) {
      alert('Error: Sal y vuelve a entrar para cambiar la clave.');
    }
  };

  if (!user) return <Login />;

  const isManager = user.email.includes('gerencia');
  const userStore = user.email.split('@')[0];

  const filteredData = surveys.filter((d) => {
    const matchesMonth = selectedMonth
      ? getMonthYear(d.timestamp) === selectedMonth
      : true;
    const matchesStore = isManager
      ? filterStore === 'todas' || d.store === filterStore
      : d.store === userStore;
    return matchesMonth && matchesStore;
  });

  // KPI Promedio Global
  const avgGlobalScore = (
    filteredData.reduce(
      (acc, c) => acc + (c.globalScore || c.presentacion),
      0
    ) / filteredData.length || 0
  ).toFixed(1);
  const completedSurveys = filteredData.filter((d) => d.status === 'completed');
  const avgDays = (
    completedSurveys.reduce((acc, c) => acc + c.daysProcess, 0) /
      completedSurveys.length || 0
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-sm md:text-base">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-4 rounded-xl shadow-sm border-t-4 border-[#2d3b2d]">
        <div>
          <h1 className="text-2xl font-bold text-[#2d3b2d] flex items-center gap-2">
            <BarChart3 />{' '}
            {isManager ? 'Panel Gerencia' : `Tienda ${userStore.toUpperCase()}`}
          </h1>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <User size={12} /> {user.email}
          </p>
        </div>

        <div className="flex gap-2 items-center flex-wrap justify-center">
          {monthsList.length > 0 && (
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <Calendar size={18} className="mr-2 text-gray-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-[#2d3b2d] outline-none cursor-pointer"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {getMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setShowPassModal(true)}
            className="bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200"
            title="Cambiar Contraseña"
          >
            <Lock size={18} />
          </button>
          <button
            onClick={() => signOut(auth)}
            className="text-red-500 hover:bg-red-50 p-2 rounded flex items-center gap-1 font-bold"
          >
            <LogOut size={18} /> Salir
          </button>
        </div>
      </header>

      {isManager && (
        <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
          <button
            onClick={() => setFilterStore('todas')}
            className={`px-4 py-2 rounded-full font-bold transition-all ${
              filterStore === 'todas'
                ? 'bg-[#2d3b2d] text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            Global
          </button>
          {STORES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStore(s)}
              className={`px-4 py-2 rounded-full capitalize transition-all ${
                filterStore === s
                  ? 'bg-[#2d3b2d] text-white'
                  : 'bg-white shadow-sm hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Encuestas"
          value={filteredData.length}
          icon={<Package />}
        />
        <KpiCard
          title="Exp. Global"
          value={`${avgGlobalScore} / 5`}
          icon={<Star />}
          alert={avgGlobalScore < 4 && filteredData.length > 0}
        />
        <KpiCard
          title="Días Promedio"
          value={avgDays > 0 ? `${avgDays}` : '-'}
          icon={<Clock />}
        />
        <KpiCard
          title="Por Completar"
          value={filteredData.filter((d) => d.status === 'pending').length}
          icon={<AlertTriangle />}
          alert={true}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-lg text-[#2d3b2d]">
            Historial Detallado
          </h3>
          {selectedMonth && (
            <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded border">
              {getMonthLabel(selectedMonth)}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">Fecha</th>
                <th className="p-4">Tienda</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Calif. Global</th>
                <th className="p-4">Entrega</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((d) => (
                <tr
                  key={d.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    d.globalScore < 3 ? 'bg-red-50' : ''
                  }`}
                >
                  <td className="p-4 text-gray-600 text-xs font-mono">
                    {formatDate(d.timestamp)}
                  </td>
                  <td className="p-4 capitalize font-bold text-xs text-[#2d3b2d]">
                    {d.store}
                  </td>
                  <td className="p-4 text-sm">
                    {d.clientName || (
                      <span className="text-gray-300 italic text-xs">
                        -- Pendiente --
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#2d3b2d]">
                        {d.globalScore || d.presentacion}
                      </span>
                      <Star
                        size={14}
                        fill="#a67c52"
                        text="#a67c52"
                        className="text-[#a67c52]"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    {d.status === 'completed' ? (
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          d.daysProcess > 15
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {d.daysProcess} días
                      </span>
                    ) : (
                      <span className="text-xs text-orange-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> Proceso
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => setViewingSurvey(d)}
                      className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600"
                      title="Ver Detalles"
                    >
                      <Eye size={16} />
                    </button>
                    {d.status === 'pending' && !isManager && (
                      <button
                        onClick={() => {
                          setEditingId(d.id);
                          setEditData({
                            clientName: '',
                            receptionDate: '',
                            deliveryDate: '',
                          });
                        }}
                        className="bg-[#2d3b2d] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-black shadow-md"
                      >
                        Completar
                      </button>
                    )}
                    {d.status === 'pending' && isManager && (
                      <span className="text-xs text-gray-400 italic">
                        Espera Tienda
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VER DETALLES */}
      {viewingSurvey && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setViewingSurvey(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X size={20} />
            </button>
            <h3 className="font-bold mb-6 text-lg text-[#2d3b2d] flex items-center gap-2">
              <ClipboardList /> Detalle de Encuesta
            </h3>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="block text-xs text-gray-500 uppercase">
                    Tienda
                  </span>
                  <span className="font-bold capitalize">
                    {viewingSurvey.store}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 uppercase">
                    Fecha
                  </span>
                  <span className="font-bold">
                    {formatDate(viewingSurvey.timestamp)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">1. Tiempo de Entrega:</span>
                  <span
                    className={`font-bold ${
                      viewingSurvey.tiempo === 'Hubo demora'
                        ? 'text-red-500'
                        : 'text-green-600'
                    }`}
                  >
                    {viewingSurvey.tiempo}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">2. Presentación:</span>
                  <span className="font-bold text-[#a67c52] flex items-center gap-1">
                    {viewingSurvey.presentacion}{' '}
                    <Star size={12} fill="currentColor" />
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">3. Calidad:</span>
                  <span
                    className={`font-bold ${
                      viewingSurvey.calidad.includes('No')
                        ? 'text-red-500'
                        : 'text-[#2d3b2d]'
                    }`}
                  >
                    {viewingSurvey.calidad}
                  </span>
                </div>
              </div>

              {viewingSurvey.status === 'completed' && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 mt-4">
                  <h4 className="font-bold text-green-800 mb-2 text-xs uppercase">
                    Datos del Proceso
                  </h4>
                  <div className="flex justify-between mb-1">
                    <span>Cliente:</span> <b>{viewingSurvey.clientName}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Días totales:</span>{' '}
                    <b>{viewingSurvey.daysProcess} días</b>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 text-center text-xs text-gray-400">
              ID: {viewingSurvey.id}
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPLETAR (Igual que antes) */}
      {editingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold mb-4 text-lg text-[#2d3b2d]">
              Completar Servicio
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Nombre Cliente
                </label>
                <input
                  className="w-full border p-2 rounded"
                  type="text"
                  onChange={(e) =>
                    setEditData({ ...editData, clientName: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Recepción
                  </label>
                  <input
                    className="w-full border p-2 rounded"
                    type="date"
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        receptionDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Entrega
                  </label>
                  <input
                    className="w-full border p-2 rounded"
                    type="date"
                    onChange={(e) =>
                      setEditData({ ...editData, deliveryDate: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 py-3 text-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 bg-[#2d3b2d] text-white py-3 rounded font-bold"
              >
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CAMBIAR CLAVE (Igual que antes) */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="font-bold mb-4 text-lg text-[#2d3b2d]">
              Cambiar Contraseña
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Ingresa la nueva contraseña para <b>{user.email}</b>.
            </p>
            <input
              className="w-full border p-3 rounded mb-4"
              type="password"
              placeholder="Nueva contraseña (mín. 6 caracteres)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPassModal(false)}
                className="flex-1 py-3 text-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePass}
                className="flex-1 bg-[#2d3b2d] text-white py-3 rounded font-bold"
              >
                ACTUALIZAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ title, value, icon, alert }) => (
  <div
    className={`p-4 rounded-xl shadow-sm border-l-4 transition-all ${
      alert
        ? 'bg-red-50 border-red-500'
        : 'bg-white border-[#2d3b2d] hover:shadow-md'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-gray-500 text-xs uppercase font-bold tracking-wider">
        {title}
      </span>
      <div className={`${alert ? 'text-red-500' : 'text-[#2d3b2d]'}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-800">{value}</div>
  </div>
);

// --- LOGIN (Igual que antes) ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      alert('Error de credenciales');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcfb] p-6">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border-t-4 border-[#2d3b2d]"
      >
        <img src={LOGO_URL} className="w-40 mx-auto mb-8" />
        <h2 className="text-xl font-bold mb-6 text-center text-gray-700">
          Acceso Corporativo
        </h2>
        <input
          type="email"
          placeholder="Correo"
          className="w-full mb-4 p-3 border rounded bg-gray-50 outline-none focus:border-[#2d3b2d]"
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative mb-4">
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Contraseña"
            className="w-full p-3 border rounded bg-gray-50 outline-none focus:border-[#2d3b2d]"
            onChange={(e) => setPass(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-3 text-gray-400 hover:text-[#2d3b2d]"
          >
            {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <label className="flex items-center gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-[#2d3b2d]"
          />
          <span className="text-sm text-gray-600">
            Mantener sesión iniciada
          </span>
        </label>
        <button className="w-full bg-[#2d3b2d] text-white py-3 rounded font-bold hover:bg-black transition-colors shadow-lg">
          ENTRAR AL SISTEMA
        </button>
      </form>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Survey />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}
