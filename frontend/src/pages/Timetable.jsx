import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, CalendarDays, BookOpen, Layers, Check } from "lucide-react";
import { DEFAULT_CLASSES, DEFAULT_YEARS, getYearFromClass, getYearLabel } from "@/lib/academic";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const COLOR_BG = {
  indigo: "bg-indigo-50 text-indigo-900 border-indigo-200 shadow-sm",
  orange: "bg-orange-50 text-orange-900 border-orange-200 shadow-sm",
  teal: "bg-teal-50 text-teal-900 border-teal-200 shadow-sm",
  purple: "bg-purple-50 text-purple-900 border-purple-200 shadow-sm",
  pink: "bg-pink-50 text-pink-900 border-pink-200 shadow-sm",
};

export default function Timetable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [meta, setMeta] = useState({ classes: DEFAULT_CLASSES, academic_years: ["1", "2", "3", "4"] });
  
  // Division filter - for student default to their own division (user.class_name), for teacher default to "all"
  const [selectedDivision, setSelectedDivision] = useState(user.role === "student" ? (user.class_name || "SE-A") : "all");
  
  const [showForm, setShowForm] = useState(false);
  const initialClass = "SE-A";
  const [form, setForm] = useState({
    subject_id: "",
    class_name: initialClass,
    academic_year: getYearFromClass(initialClass),
    day: 0,
    start_time: "09:00",
    end_time: "10:00",
    room: "",
  });
  const [showQuick, setShowQuick] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", code: "", color: "indigo" });

  const load = () => api.get("/timetable").then(r => setEntries(r.data)).catch(() => {});
  const loadSubjects = () => api.get("/subjects").then(r => {
    setSubjects(r.data);
    if (r.data?.length > 0) {
      setForm(f => ({ ...f, subject_id: f.subject_id || r.data[0].id }));
    }
  }).catch(() => {});

  useEffect(() => {
    load();
    loadSubjects();
    api.get("/meta").then(r => {
      if (r.data) {
        setMeta({
          classes: r.data.classes?.length ? r.data.classes : DEFAULT_CLASSES,
          academic_years: r.data.academic_years?.length ? r.data.academic_years : ["1", "2", "3", "4"]
        });
      }
    }).catch(() => {});
  }, []);

  const handleClassChange = (newClass) => {
    const autoYear = getYearFromClass(newClass);
    setForm(prev => ({
      ...prev,
      class_name: newClass,
      academic_year: autoYear,
    }));
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post("/timetable", form);
      toast.success("Timetable slot added successfully!");
      setShowForm(false);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this timetable slot?")) return;
    await api.delete(`/timetable/${id}`);
    toast.success("Slot removed");
    load();
  };

  const createSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post("/subjects", quickForm);
      toast.success("Subject added");
      setQuickForm({ name: "", code: "", color: "indigo" });
      setShowQuick(false);
      loadSubjects();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  // Filter entries division-wise
  const filteredEntries = entries.filter(item => {
    if (selectedDivision === "all") return true;
    return item.class_name === selectedDivision;
  });

  const grid = {};
  filteredEntries.forEach(e => {
    const key = `${e.day}|${e.start_time.slice(0, 5)}`;
    grid[key] = grid[key] || [];
    grid[key].push(e);
  });

  const availableClasses = meta.classes?.length ? meta.classes : DEFAULT_CLASSES;

  return (
    <div className="space-y-6" data-testid="timetable-page">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-500 text-sm">
            {user.role === "teacher"
              ? "Division-wise lecture schedule & classroom allocations"
              : `Weekly schedule for Division ${user.class_name || "your assigned class"}`}
          </p>
        </div>
        {user.role === "teacher" && (
          <div className="flex gap-2 flex-wrap">
            <button data-testid="quick-subject-btn" onClick={() => setShowQuick(q => !q)}
              className="pill bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <BookOpen className="w-4 h-4"/> Add Subject
            </button>
            <button data-testid="new-slot-btn" onClick={() => setShowForm(s => !s)}
              className="pill bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 shadow hover:shadow-md transition">
              <Plus className="w-4 h-4" /> Add Slot
            </button>
          </div>
        )}
      </div>

      {/* Division-Wise Filter Tabs */}
      <div className="aura-card p-3 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Division:</span>
        </div>
        {user.role === "teacher" && (
          <button
            onClick={() => setSelectedDivision("all")}
            className={`pill text-xs py-1.5 px-3 transition shrink-0 ${
              selectedDivision === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Divisions
          </button>
        )}
        {availableClasses.map(cls => (
          <button
            key={cls}
            onClick={() => setSelectedDivision(cls)}
            className={`pill text-xs py-1.5 px-3 transition shrink-0 ${
              selectedDivision === cls ? "bg-indigo-600 text-white shadow-sm font-semibold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Division {cls}
          </button>
        ))}
      </div>

      {showQuick && user.role === "teacher" && (
        <form onSubmit={createSubject} className="aura-card p-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input required placeholder="Subject name" value={quickForm.name} data-testid="qs-name"
            onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
            className="rounded-xl border px-3 py-2 sm:col-span-2" />
          <input required placeholder="Code (e.g., CS201)" value={quickForm.code} data-testid="qs-code"
            onChange={(e) => setQuickForm({ ...quickForm, code: e.target.value.toUpperCase() })}
            className="rounded-xl border px-3 py-2" />
          <select value={quickForm.color} onChange={(e) => setQuickForm({ ...quickForm, color: e.target.value })}
            data-testid="qs-color" className="rounded-xl border px-3 py-2">
            {["indigo", "orange", "teal", "purple", "pink"].map(c => <option key={c}>{c}</option>)}
          </select>
          <button data-testid="qs-submit" className="sm:col-span-4 pill py-2 bg-slate-900 text-white">Create subject</button>
        </form>
      )}

      {showForm && user.role === "teacher" && (
        <form onSubmit={create} className="aura-card p-6 grid grid-cols-1 sm:grid-cols-6 gap-3">
          <label className="sm:col-span-2 text-xs font-semibold text-slate-600">
            Subject
            {subjects.length === 0 && (
              <div className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                You have no subjects yet — click <b>Add Subject</b> above first.
              </div>
            )}
            <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              data-testid="tt-subject" className="mt-1 w-full rounded-xl border px-3 py-2">
              <option value="">Subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Class Division
            <select value={form.class_name} onChange={(e) => handleClassChange(e.target.value)}
              data-testid="tt-class" className="mt-1 w-full rounded-xl border px-3 py-2 font-medium">
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Year (Auto-filled)
            <select value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              data-testid="tt-year" className="mt-1 w-full rounded-xl border px-3 py-2 bg-slate-50 font-medium">
              {DEFAULT_YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Day
            <select value={form.day} onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
              data-testid="tt-day" className="mt-1 w-full rounded-xl border px-3 py-2">
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Start Time
            <select value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              data-testid="tt-start" className="mt-1 w-full rounded-xl border px-3 py-2">
              {SLOTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            End Time
            <select value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              data-testid="tt-end" className="mt-1 w-full rounded-xl border px-3 py-2">
              {SLOTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="sm:col-span-3 text-xs font-semibold text-slate-600">
            Room / Lab
            <input placeholder="e.g., Lab 204 or Room 302" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
              data-testid="tt-room" className="mt-1 w-full rounded-xl border px-3 py-2" />
          </label>
          <button data-testid="tt-submit" className="sm:col-span-3 pill bg-indigo-600 text-white self-end">Add Slot</button>
        </form>
      )}

      <div className="aura-card p-4 overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Showing Schedule For: <span className="text-indigo-600 font-extrabold">{selectedDivision === "all" ? "All Divisions" : `Division ${selectedDivision}`}</span>
          </div>
          <div className="text-xs text-slate-400">
            {filteredEntries.length} slot{filteredEntries.length === 1 ? "" : "s"} scheduled
          </div>
        </div>

        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left bg-slate-50/70 border-b border-slate-200">
              <th className="p-3 text-xs uppercase text-slate-400 font-semibold w-24">Time Slot</th>
              {DAYS.map(d => (
                <th key={d} className="p-3 text-xs uppercase text-slate-600 font-bold">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.slice(0, -1).map((slot, i) => (
              <tr key={slot} className="border-t border-slate-100 hover:bg-slate-50/40 transition">
                <td className="p-3 text-xs font-mono text-slate-500 align-top font-medium">{slot}–{SLOTS[i + 1]}</td>
                {DAYS.map((_, d) => {
                  const cells = grid[`${d}|${slot}`] || [];
                  return (
                    <td key={d} className="p-1.5 align-top">
                      {cells.map(c => (
                        <div key={c.id} data-testid={`tt-cell-${c.id}`}
                          className={`rounded-xl p-2.5 mb-1.5 border transition hover:shadow-md ${COLOR_BG[c.subject_color] || COLOR_BG.indigo}`}>
                          <div className="text-xs font-bold leading-snug">{c.subject_name}</div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium opacity-90 flex-wrap">
                            <span className="pill bg-white/70 text-slate-800 px-1.5 py-0.5 border border-slate-200/50">
                              Div: {c.class_name}
                            </span>
                            {c.room && (
                              <span className="opacity-80">
                                📍 {c.room}
                              </span>
                            )}
                          </div>
                          {user.role === "teacher" && (
                            <button onClick={() => remove(c.id)} className="text-[10px] mt-1.5 text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1">
                              <Trash2 className="w-3 h-3"/> Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEntries.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
            <div className="font-semibold text-slate-700">No timetable slots found for Division {selectedDivision}</div>
            <div className="text-xs text-slate-400 mt-1">
              {user.role === "teacher" ? "Click 'Add Slot' above to create a schedule for this division." : "Your teachers have not published any slots for this division yet."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
