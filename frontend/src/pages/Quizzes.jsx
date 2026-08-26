import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Brain, Plus, Trophy, BarChart3, X, Timer, Download, Layers } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DEFAULT_CLASSES, DEFAULT_YEARS, getYearFromClass, getYearLabel } from "@/lib/academic";

export default function Quizzes() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [meta, setMeta] = useState({ classes: DEFAULT_CLASSES, academic_years: ["1", "2", "3", "4"] });
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState(user.role === "student" ? (user.class_name || "all") : "all");
  const [showForm, setShowForm] = useState(false);
  const [attemptQuiz, setAttemptQuiz] = useState(null);
  const [analyticsQuiz, setAnalyticsQuiz] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (subjectFilter !== "all") params.set("subject_id", subjectFilter);
    return api.get(`/quizzes?${params.toString()}`).then(r => setItems(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [subjectFilter]);
  useEffect(() => {
    api.get("/subjects").then(r => setSubjects(r.data)).catch(() => {});
    api.get("/meta").then(r => {
      if (r.data) {
        setMeta({
          classes: r.data.classes?.length ? r.data.classes : DEFAULT_CLASSES,
          academic_years: r.data.academic_years?.length ? r.data.academic_years : ["1", "2", "3", "4"]
        });
      }
    }).catch(() => {});
  }, []);

  const availableClasses = meta.classes?.length ? meta.classes : DEFAULT_CLASSES;

  const filteredItems = items.filter(q => {
    if (divisionFilter !== "all" && q.class_name && q.class_name !== divisionFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6" data-testid="quizzes-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Quiz Center</h1>
          <p className="text-slate-500 text-sm">
            {user.role === "teacher" ? "Design division-wise quizzes & review analytics" : "Attempt quizzes across subjects & divisions"}
          </p>
        </div>
        {user.role === "teacher" && (
          <button data-testid="new-quiz-btn" onClick={() => setShowForm(s => !s)}
            className="pill bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 shadow hover:shadow-md transition">
            <Plus className="w-4 h-4" /> New Quiz
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="space-y-2">
        {/* Division Filter */}
        <div className="aura-card p-3 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 shrink-0">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Division:</span>
          </div>
          <button
            onClick={() => setDivisionFilter("all")}
            className={`pill text-xs py-1.5 px-3 transition shrink-0 ${
              divisionFilter === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Divisions
          </button>
          {availableClasses.map(cls => (
            <button
              key={cls}
              onClick={() => setDivisionFilter(cls)}
              className={`pill text-xs py-1.5 px-3 transition shrink-0 ${
                divisionFilter === cls ? "bg-indigo-600 text-white shadow-sm font-semibold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Division {cls}
            </button>
          ))}
        </div>

        {/* Subject Filter */}
        <div className="flex gap-2 flex-wrap items-center pt-1">
          <button className={`pill text-xs py-1.5 px-3 ${subjectFilter === "all" ? "bg-indigo-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"}`}
            onClick={() => setSubjectFilter("all")}>All Subjects</button>
          {subjects.map(s => (
            <button key={s.id} className={`pill text-xs py-1.5 px-3 ${subjectFilter === s.id ? "bg-indigo-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"}`}
              onClick={() => setSubjectFilter(s.id)}>{s.name}</button>
          ))}
        </div>
      </div>

      {showForm && <QuizForm subjects={subjects} meta={meta} onClose={() => setShowForm(false)} onCreated={load} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(q => (
          <div key={q.id} data-testid={`quiz-${q.id}`} className="aura-card p-6 hover:-translate-y-0.5 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-1.5 font-semibold text-purple-600">
                  <Brain className="w-4 h-4" /> {q.subject_name}
                </span>
                {q.class_name && (
                  <span className="pill bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold">
                    Div: {q.class_name}
                  </span>
                )}
              </div>
              <div className="font-heading text-xl font-semibold mt-2 text-slate-800">{q.title}</div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 pill bg-slate-100 text-slate-700 text-[11px]">
                  <Timer className="w-3 h-3 text-indigo-500" /> {q.duration_min}m
                </span>
                <span className="pill bg-slate-100 text-slate-700 text-[11px]">{q.question_count} questions</span>
                {q.academic_year && (
                  <span className="pill bg-slate-100 text-slate-600 text-[10px] font-medium">
                    {getYearLabel(q.academic_year)}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-2">by {q.teacher_name || "OneDesk Faculty"}</div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              {user.role === "teacher" ? (
                <button data-testid={`analytics-${q.id}`} onClick={() => setAnalyticsQuiz(q)}
                  className="pill w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center gap-2 transition">
                  <BarChart3 className="w-4 h-4" /> Analytics & Reports
                </button>
              ) : q.my_attempt ? (
                <div className="pill w-full py-2 bg-emerald-100 text-emerald-700 text-center inline-flex justify-center items-center gap-2 font-bold">
                  <Trophy className="w-4 h-4" /> Scored {q.my_attempt.percent}%
                </div>
              ) : (
                <button data-testid={`attempt-${q.id}`} onClick={() => setAttemptQuiz(q)}
                  className="pill w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow hover:shadow-md transition">
                  Start Quiz
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-16 aura-card">
            <Brain className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
            <div className="font-semibold text-slate-700">No quizzes match these filters</div>
            <div className="text-xs text-slate-400 mt-1">Select another division or subject to see available quizzes.</div>
          </div>
        )}
      </div>

      {attemptQuiz && <AttemptModal quiz={attemptQuiz} onClose={() => setAttemptQuiz(null)} onDone={() => { setAttemptQuiz(null); load(); }} />}
      {analyticsQuiz && <AnalyticsModal quiz={analyticsQuiz} onClose={() => setAnalyticsQuiz(null)} />}
    </div>
  );
}

function QuizForm({ subjects, meta, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
  const initialClass = meta.classes?.[0] || "SE-A";
  const [className, setClassName] = useState(initialClass);
  const [academicYear, setAcademicYear] = useState(getYearFromClass(initialClass));
  const [duration, setDuration] = useState(15);
  const [qs, setQs] = useState([{ question: "", options: ["", "", "", ""], correct_index: 0, points: 1 }]);

  const handleClassChange = (newClass) => {
    setClassName(newClass);
    setAcademicYear(getYearFromClass(newClass));
  };

  const addQ = () => setQs(a => [...a, { question: "", options: ["", "", "", ""], correct_index: 0, points: 1 }]);
  const updateQ = (i, patch) => setQs(a => a.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const updateOpt = (i, oi, v) => setQs(a => a.map((q, idx) => idx === i ? { ...q, options: q.options.map((o, k) => k === oi ? v : o) } : q));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/quizzes", {
        title,
        subject_id: subjectId,
        class_name: className,
        academic_year: academicYear,
        duration_min: duration,
        questions: qs
      });
      toast.success("Quiz created successfully!");
      onCreated();
      onClose();
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const availableClasses = meta.classes?.length ? meta.classes : DEFAULT_CLASSES;

  return (
    <form onSubmit={submit} className="aura-card p-6 space-y-4">
      <div className="font-heading text-xl font-bold text-slate-800 flex items-center gap-2">
        <Brain className="w-5 h-5 text-indigo-600" />
        <span>Create Division Quiz</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
        <div className="sm:col-span-3">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Quiz Title</label>
          <input required placeholder="e.g. Unit 1: Data Structures Assessment" value={title} onChange={(e) => setTitle(e.target.value)}
            data-testid="quiz-title" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-medium" />
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Subject</label>
          <select required value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
            data-testid="quiz-subject" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white">
            <option value="">Select Subject…</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Class Division</label>
          <select value={className} onChange={(e) => handleClassChange(e.target.value)}
            data-testid="quiz-class" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white font-medium">
            {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Year (Auto-filled)</label>
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}
            data-testid="quiz-year" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-slate-50 font-medium">
            {DEFAULT_YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Duration (Minutes)</label>
          <input type="number" min="1" max="180" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
            data-testid="quiz-duration" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="15" />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Quiz Questions & Options</div>
        {qs.map((q, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">Question {i + 1}</span>
              {qs.length > 1 && (
                <button type="button" onClick={() => setQs(qs.filter((_, idx) => idx !== i))} className="text-xs text-rose-600 hover:text-rose-800">
                  Remove
                </button>
              )}
            </div>
            <input required placeholder={`Enter question text for Question ${i + 1}`} value={q.question}
              onChange={(e) => updateQ(i, { question: e.target.value })}
              data-testid={`q-${i}`} className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {q.options.map((opt, oi) => (
                <label key={oi} className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition ${q.correct_index === oi ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-slate-200 bg-white"}`}>
                  <input type="radio" name={`correct-${i}`} checked={q.correct_index === oi} onChange={() => updateQ(i, { correct_index: oi })} className="accent-emerald-600"/>
                  <input required placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => updateOpt(i, oi, e.target.value)}
                    data-testid={`q-${i}-opt-${oi}`} className="flex-1 outline-none bg-transparent text-sm" />
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={addQ} className="pill bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">+ Add Question</button>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="pill bg-slate-100 text-slate-700 hover:bg-slate-200 transition">Cancel</button>
        <button data-testid="quiz-submit" className="pill bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow hover:shadow-md transition">Publish Quiz</button>
      </div>
    </form>
  );
}

function AttemptModal({ quiz, onClose, onDone }) {
  const [answers, setAnswers] = useState(quiz.questions.map(() => -1));
  const submit = async () => {
    try {
      const { data } = await api.post(`/quizzes/${quiz.id}/attempt`, { answers });
      toast.success(`Quiz submitted! Scored ${data.percent}% (${data.score}/${data.total})`);
      onDone();
    } catch (e) { toast.error(formatApiError(e)); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm grid place-items-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <div className="font-heading text-2xl font-bold text-slate-900">{quiz.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{quiz.subject_name} • Division {quiz.class_name} • {quiz.questions?.length} Questions</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-4">
          {quiz.questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
              <div className="font-semibold text-slate-800 mb-3 text-sm">Q{i + 1}. {q.question}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} data-testid={`ans-${i}-${oi}`}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer text-sm transition ${answers[i] === oi ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-medium shadow-sm" : "border-slate-200 bg-white text-slate-700"}`}>
                    <input type="radio" name={`a-${i}`} checked={answers[i] === oi}
                      onChange={() => setAnswers(a => a.map((x, idx) => idx === i ? oi : x))} className="accent-indigo-600" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button data-testid="attempt-submit" onClick={submit} className="mt-5 w-full pill py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow hover:shadow-lg transition">Submit Quiz Answers</button>
      </div>
    </div>
  );
}

function AnalyticsModal({ quiz, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/quizzes/${quiz.id}/analytics`).then(r => setData(r.data)); }, [quiz.id]);
  const exportPdf = () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`OneDesk — ${quiz.title} Analytics`, 14, 18);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Subject: ${quiz.subject_name}   Class: ${quiz.class_name || "-"}   Year: ${quiz.academic_year || "-"}`, 14, 25);
    doc.text(`Attempts: ${data.stats.count}   Average: ${data.stats.avg}%   Top: ${data.stats.top}%   Lowest: ${data.stats.low}%`, 14, 31);
    autoTable(doc, {
      startY: 38,
      head: [["Student", "Score", "Percent"]],
      body: data.attempts.map(a => [a.student_name, `${a.score}/${a.total}`, `${a.percent}%`]),
      headStyles: { fillColor: [79, 70, 229] },
    });
    doc.save(`quiz-${quiz.title.replace(/\s+/g,'_')}.pdf`);
  };
  if (!data) return null;
  const distData = Object.entries(data.stats.distribution).map(([range, count]) => ({ range, count }));
  const colors = ["#F43F5E", "#F59E0B", "#3B82F6", "#10B981"];
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-heading text-2xl font-bold">{quiz.title} — Analytics</div>
          <div className="flex items-center gap-2">
            <button data-testid="export-quiz-pdf" onClick={exportPdf} className="pill bg-slate-800 text-white flex items-center gap-1 text-sm shadow">
              <Download className="w-3 h-3"/> Export PDF
            </button>
            <button onClick={onClose}><X className="w-5 h-5"/></button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <Stat label="Attempts" value={data.stats.count}/>
          <Stat label="Average" value={`${data.stats.avg}%`}/>
          <Stat label="Top" value={`${data.stats.top}%`}/>
          <Stat label="Lowest" value={`${data.stats.low}%`}/>
        </div>
        <div className="h-64 mb-4">
          <ResponsiveContainer>
            <BarChart data={distData}>
              <XAxis dataKey="range" fontSize={12}/>
              <YAxis fontSize={12}/>
              <Tooltip/>
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {distData.map((_, i) => <Cell key={i} fill={colors[i]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b"><tr><th className="text-left py-2">Student</th><th>Score</th><th>Percent</th></tr></thead>
            <tbody>
              {data.attempts.map(a => (
                <tr key={a.id} className="border-b last:border-none">
                  <td className="py-2">{a.student_name}</td>
                  <td className="text-center">{a.score}/{a.total}</td>
                  <td className="text-center font-semibold">{a.percent}%</td>
                </tr>
              ))}
              {data.attempts.length === 0 && <tr><td colSpan="3" className="text-center py-6 text-slate-500">No attempts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="p-4 rounded-xl bg-indigo-50"><div className="text-xs uppercase text-slate-500">{label}</div><div className="font-heading text-2xl font-bold text-indigo-700">{value}</div></div>;
}
