import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Building2, 
  Search, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  X,
  Edit2
} from 'lucide-react';
import { Prescription, SupportedLanguage, User as UserType } from '../types/index.js';
import { api } from '../services/api.js';

interface PrescriptionsViewProps {
  currentUser: UserType;
  currentLang: SupportedLanguage;
  seniorMode?: boolean;
  selectedPatientId?: string; // Optional: If passed, filter/create for this patient
  onBack?: () => void;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  currentUser,
  currentLang,
  seniorMode = false,
  selectedPatientId,
  onBack
}) => {
  const isDoctor = currentUser.role === 'doctor';
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patientId: selectedPatientId || '',
    title: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    medicines: '',
    dosage: '',
    instructions: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, [selectedPatientId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await api.getPrescriptions();
      // If selectedPatientId is provided, filter for that patient (mostly for doctor view)
      if (selectedPatientId) {
        setPrescriptions(data.filter(p => p.patientId === selectedPatientId));
      } else {
        setPrescriptions(data);
      }
      setError(null);
    } catch (err: any) {
      console.error('[PrescriptionsView] Error fetching prescriptions:', {
        message: err.message,
        role: currentUser.role,
        userId: currentUser._id,
        selectedPatientId
      });
      if (err.message.includes('403') || err.message.toLowerCase().includes('denied')) {
        setError('You do not have permission to view these prescriptions.');
      } else if (err.message.includes('401')) {
        setError('Please sign in again to view prescriptions.');
      } else {
        setError('Unable to load prescriptions. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      patientId: selectedPatientId || '',
      title: '',
      prescriptionDate: new Date().toISOString().split('T')[0],
      medicines: '',
      dosage: '',
      instructions: '',
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Prescription) => {
    setEditingId(p._id);
    setFormData({
      patientId: p.patientId,
      title: p.title,
      prescriptionDate: p.prescriptionDate,
      medicines: p.medicines || '',
      dosage: p.dosage || '',
      instructions: p.instructions || '',
      notes: p.notes
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.patientId) return;

    try {
      setFormLoading(true);
      if (editingId) {
        await api.updatePrescription(editingId, formData);
        setSuccessMsg('Prescription updated successfully!');
      } else {
        await api.createPrescription(formData);
        setSuccessMsg('Prescription created successfully!');
      }
      setShowAddModal(false);
      fetchPrescriptions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(`Failed to ${editingId ? 'update' : 'create'} prescription.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this prescription?')) return;

    try {
      await api.deletePrescription(id);
      setPrescriptions(prev => prev.filter(p => p._id !== id));
      setSuccessMsg('Prescription deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError('Failed to delete prescription.');
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.doctorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          )}
          <div>
            <h2 className={`font-extrabold text-slate-900 font-outfit ${seniorMode ? 'text-3xl' : 'text-2xl sm:text-3xl'}`}>
              {isDoctor ? 'Prescription Management' : 'My Prescriptions'}
            </h2>
            <p className="text-slate-600 text-sm">
              {isDoctor ? 'Create and manage medical prescriptions for your patients.' : 'Manage and view your stored medical prescriptions securely.'}
            </p>
          </div>
        </div>

        {isDoctor && (
          <button
            onClick={handleOpenAdd}
            className="uiverse-btn-primary px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add Prescription</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={isDoctor ? "Search prescriptions by name or patient..." : "Search prescriptions by name or doctor..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none ${seniorMode ? 'py-4 text-lg' : 'py-3 text-sm'}`}
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Records...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <p className="text-rose-800 font-bold">{error}</p>
          <button onClick={fetchPrescriptions} className="text-teal-700 font-bold hover:underline">Try Again</button>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
            <FileText className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Prescriptions Found</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchQuery ? "We couldn't find any prescriptions matching your search." : "No prescriptions are currently registered in this view."}
          </p>
          {isDoctor && !searchQuery && (
            <button onClick={handleOpenAdd} className="text-teal-600 font-bold hover:underline">
              Create a new prescription
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrescriptions.map((p) => (
            <div key={p._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              {isDoctor && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenEdit(p)}
                    className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Edit prescription"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeletePrescription(p._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete prescription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className={`font-bold text-slate-900 truncate ${seniorMode ? 'text-xl' : 'text-base'}`}>{p.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> {p.prescriptionDate}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor</p>
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-teal-500" /> {p.doctorName}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hospital</p>
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-teal-500" /> {p.hospitalName}
                    </p>
                  </div>
                </div>

                {p.medicines && (
                  <div className="bg-teal-50/50 rounded-xl p-3 border border-teal-100">
                    <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wider mb-1">Medicines & Details</p>
                    <p className="text-xs font-bold text-slate-800 leading-relaxed">{p.medicines}</p>
                    {p.dosage && <p className="text-[10px] text-teal-800 mt-1 font-semibold">Dosage: {p.dosage}</p>}
                  </div>
                )}

                {p.instructions && (
                  <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">Patient Instructions</p>
                    <p className="text-xs text-slate-700 leading-relaxed">{p.instructions}</p>
                  </div>
                )}

                {p.notes && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                    <p className={`text-xs text-slate-600 leading-relaxed ${seniorMode ? 'text-sm' : ''}`}>{p.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Prescription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 font-outfit">{editingId ? 'Edit Prescription' : 'New Prescription'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!selectedPatientId && !editingId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Patient ID</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. pat_rajesh_kumar"
                    value={formData.patientId}
                    onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Prescription Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Cardiology Follow-up meds"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Medicine & Details</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg, Atorvastatin 10mg"
                  value={formData.medicines}
                  onChange={(e) => setFormData({...formData, medicines: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-0-1"
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Date</label>
                  <input
                    type="date"
                    value={formData.prescriptionDate}
                    onChange={(e) => setFormData({...formData, prescriptionDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Take after food"
                  value={formData.instructions}
                  onChange={(e) => setFormData({...formData, instructions: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Additional Clinical Notes</label>
                <textarea
                  rows={3}
                  placeholder="Clinical observations or internal notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 uiverse-btn-primary px-4 py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {editingId ? 'Update Record' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
