import React, { useState } from 'react';
import { GraduationCap, BookOpen, Calendar, PlusCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { formatPKR, roundHalfUp } from '../utils/feeCalculator';
import { AcademicClass, Subject, AcademicSession } from '../types';

interface ClassesSubjectsViewProps {
  classes: AcademicClass[];
  subjects: Subject[];
  sessions: AcademicSession[];
  onRefresh: () => void;
}

export const ClassesSubjectsView: React.FC<ClassesSubjectsViewProps> = ({
  classes,
  subjects,
  sessions,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'sessions'>('classes');

  // New Class Form
  const [newClassName, setNewClassName] = useState('');
  const [newClassFee, setNewClassFee] = useState<number>(2500);

  // New Subject Form
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  // New Session Form
  const [newSessionName, setNewSessionName] = useState('');

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      await api.createClass({
        name: newClassName.trim(),
        defaultMonthlyFee: roundHalfUp(newClassFee),
        active: true,
      });
      setNewClassName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add class');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await api.deleteClass(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Cannot delete class with enrolled students.');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await api.createSubject({
        name: newSubName.trim(),
        code: newSubCode.trim().toUpperCase() || undefined,
      });
      setNewSubName('');
      setNewSubCode('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add subject');
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    try {
      await api.createSession({
        name: newSessionName.trim(),
        isCurrent: false,
      });
      setNewSessionName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to add session');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Classes, Subjects & Sessions</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure academic hierarchy, standard class tuition fee defaults, and academic sessions.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'classes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>Classes & Grades ({classes.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'subjects'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Subjects ({subjects.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'sessions'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Academic Sessions ({sessions.length})</span>
        </button>
      </div>

      {/* Tab 1: Classes */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Class Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Class / Grade</h3>
            <form onSubmit={handleAddClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 11 - Computer Science"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Monthly Fee (PKR)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={newClassFee}
                  onChange={(e) => setNewClassFee(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                + Add Class
              </button>
            </form>
          </div>

          {/* Classes List */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Configured Classes
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{cls.name}</span>
                    <span className="text-slate-500 text-xs">
                      Default Monthly Tuition: <strong className="text-emerald-700">{formatPKR(cls.defaultMonthlyFee)}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteClass(cls.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                    title="Delete Class"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Subjects */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Statistics"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. STAT-101"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                + Add Subject
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {subjects.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900 text-xs block">{s.name}</span>
                  {s.code && <span className="font-mono text-[10px] text-emerald-700 font-bold">{s.code}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sessions */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Academic Session</h3>
            <form onSubmit={handleAddSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2027-2028"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                + Add Session
              </button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 divide-y divide-slate-100">
            {sessions.map((ses) => (
              <div key={ses.id} className="py-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 text-sm">{ses.name}</span>
                {ses.isCurrent ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Current Active Session
                  </span>
                ) : (
                  <span className="text-slate-400">Past / Upcoming</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
