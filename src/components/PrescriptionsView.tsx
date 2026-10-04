import React, { useEffect, useState } from 'react';
import { Prescription } from '../types/index.js';
import { api } from '../services/api.js';

interface Props { onToast: (message: string, type?: 'success' | 'error') => void; }

export const PrescriptionsView: React.FC<Props> = ({ onToast }) => {
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', prescriptionDate: '', doctorName: '', hospitalName: '', notes: '' });
  const load = async () => { try { setLoading(true); setItems(await api.getPrescriptions()); } catch (e: any) { onToast(e.message, 'error'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.prescriptionDate) { onToast('Prescription title and date are required.', 'error'); return; }
    try { setSaving(true); await api.createPrescription(form); setForm({ title: '', prescriptionDate: '', doctorName: '', hospitalName: '', notes: '' }); await load(); onToast('Prescription saved successfully.'); }
    catch (e: any) { onToast(e.message, 'error'); } finally { setSaving(false); }
  };
  const remove = async (id: string) => { if (!window.confirm('Delete this prescription?')) return; try { await api.deletePrescription(id); setItems(items.filter(item => item._id !== id)); onToast('Prescription deleted.'); } catch (e: any) { onToast(e.message, 'error'); } };
  return <section className="max-w-5xl mx-auto space-y-6">
    <div><p className="text-sm font-semibold text-teal-700">Patient records</p><h1 className="text-3xl font-bold text-slate-900">Prescriptions</h1><p className="mt-1 text-slate-600">Store and review your prescription history securely.</p></div>
    <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm grid gap-4 sm:grid-cols-2">
      <h2 className="sm:col-span-2 text-lg font-bold">Add prescription</h2>
      <label className="text-sm font-medium">Prescription title<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Cardiology prescription" required /></label>
      <label className="text-sm font-medium">Prescription date<input type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.prescriptionDate} onChange={e => setForm({ ...form, prescriptionDate: e.target.value })} required /></label>
      <label className="text-sm font-medium">Doctor name<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} /></label>
      <label className="text-sm font-medium">Hospital / clinic<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} /></label>
      <label className="sm:col-span-2 text-sm font-medium">Notes<textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 min-h-24" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>
      <button disabled={saving} className="sm:col-span-2 justify-self-start rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save prescription'}</button>
    </form>
    <div className="grid gap-4 md:grid-cols-2">{loading ? <p className="text-slate-500">Loading prescriptions…</p> : items.length === 0 ? <div className="md:col-span-2 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No prescriptions saved yet.</div> : items.map(item => <article key={item._id} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><div className="flex justify-between gap-3"><div><h2 className="font-bold text-lg">{item.title}</h2><p className="text-sm text-slate-500">{item.prescriptionDate}</p></div><button onClick={() => remove(item._id)} className="text-sm text-rose-600 hover:underline">Delete</button></div><dl className="mt-4 grid gap-2 text-sm"><div><dt className="font-semibold inline">Doctor: </dt><dd className="inline">{item.doctorName || 'Not provided'}</dd></div><div><dt className="font-semibold inline">Hospital: </dt><dd className="inline">{item.hospitalName || 'Not provided'}</dd></div>{item.notes && <div><dt className="font-semibold inline">Notes: </dt><dd className="inline">{item.notes}</dd></div>}</dl></article>)}</div>
  </section>;
};

export default PrescriptionsView;
