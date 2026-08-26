import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { GraduationCap, Check, Plus, X } from "lucide-react";
import { getYearFromClass } from "@/lib/academic";

const DEFAULT_DEPARTMENTS = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Artificial Intelligence & Data Science",
  "Administration",
];

const DEFAULT_CLASSES = ["FE-A", "FE-B", "SE-A", "SE-B", "TE-A", "TE-B", "BE-A", "BE-B"];
const DEFAULT_YEARS = [
  { value: "1", label: "1st Year (FE)" },
  { value: "2", label: "2nd Year (SE)" },
  { value: "3", label: "3rd Year (TE)" },
  { value: "4", label: "4th Year (BE)" },
];

const POPULAR_SUBJECTS = [
  "Data Structures & Algorithms",
  "Database Management Systems",
  "Operating Systems",
  "Web Technology",
  "Computer Networks",
  "Artificial Intelligence",
  "Software Engineering",
  "Cloud Computing",
];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [meta, setMeta] = useState({
    departments: DEFAULT_DEPARTMENTS,
    classes: DEFAULT_CLASSES,
    academic_years: ["1", "2", "3", "4"],
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: DEFAULT_DEPARTMENTS[0],
    class_name: DEFAULT_CLASSES[2], // SE-A
    academic_year: "2",
    enrollment_number: "",
  });

  const [selectedSubjects, setSelectedSubjects] = useState(["Data Structures & Algorithms", "Web Technology"]);
  const [customSubject, setCustomSubject] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/meta")
      .then((r) => {
        if (r.data) {
          setMeta({
            departments: r.data.departments?.length ? r.data.departments : DEFAULT_DEPARTMENTS,
            classes: r.data.classes?.length ? r.data.classes : DEFAULT_CLASSES,
            academic_years: r.data.academic_years?.length ? r.data.academic_years : ["1", "2", "3", "4"],
          });
        }
      })
      .catch(() => {
        // Safe fallbacks already initialized in state
      });
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSubject = (subj) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const addCustomSubject = (e) => {
    e.preventDefault();
    const s = customSubject.trim();
    if (!s) return;
    if (!selectedSubjects.includes(s)) {
      setSelectedSubjects([...selectedSubjects, s]);
    }
    setCustomSubject("");
  };

  const removeSubject = (subj) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s !== subj));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (role === "teacher" && selectedSubjects.length === 0) {
      toast.error("Please select or add at least one subject you teach.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        department: form.department,
        role,
      };
      if (role === "student") {
        body.class_name = form.class_name;
        body.academic_year = form.academic_year;
        body.enrollment_number = form.enrollment_number.trim().toUpperCase();
      } else {
        body.subjects = selectedSubjects;
      }
      await signup(body);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-xl aura-card p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center shadow-md">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-heading text-2xl font-bold text-slate-900">Create Account</div>
            <div className="text-xs text-slate-500">Join OneDesk Smart Campus Suite</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-slate-100 mb-6">
          <button
            type="button"
            data-testid="signup-role-student"
            onClick={() => setRole("student")}
            className={`py-2 rounded-full text-sm font-semibold transition ${
              role === "student" ? "bg-white shadow text-indigo-700 font-bold" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            I&apos;m a Student
          </button>
          <button
            type="button"
            data-testid="signup-role-teacher"
            onClick={() => setRole("teacher")}
            className={`py-2 rounded-full text-sm font-semibold transition ${
              role === "teacher" ? "bg-white shadow text-indigo-700 font-bold" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            I&apos;m a Teacher
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" testid="signup-name">
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="input"
              placeholder="e.g. Atharva Teli"
            />
          </Field>

          <Field label="Phone Number" testid="signup-phone">
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input"
              placeholder="e.g. 9876543210"
            />
          </Field>

          <Field label="Email Address" span testid="signup-email">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="input"
              placeholder="you@onedesk.com"
            />
          </Field>

          <Field label="Password" span testid="signup-password">
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </Field>

          <Field label="Department" span testid="signup-department">
            <select
              value={form.department}
              onChange={(e) => update("department", e.target.value)}
              className="input bg-white cursor-pointer"
            >
              {meta.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>

          {role === "student" ? (
            <>
              <Field label="Enrollment Number" testid="signup-enrollment">
                <input
                  required
                  value={form.enrollment_number}
                  onChange={(e) => update("enrollment_number", e.target.value.toUpperCase())}
                  className="input font-mono uppercase tracking-wider"
                  placeholder="AC2025001"
                />
              </Field>

              <Field label="Class Division" testid="signup-class">
                <select
                  value={form.class_name}
                  onChange={(e) => {
                    const cls = e.target.value;
                    const autoYear = getYearFromClass(cls);
                    setForm(f => ({ ...f, class_name: cls, academic_year: autoYear }));
                  }}
                  className="input bg-white cursor-pointer font-medium"
                >
                  {meta.classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Academic Year (Auto-filled)" span testid="signup-year">
                <select
                  value={form.academic_year}
                  onChange={(e) => update("academic_year", e.target.value)}
                  className="input bg-slate-50 cursor-pointer font-medium"
                >
                  {DEFAULT_YEARS.map((y) => (
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <div className="sm:col-span-2 space-y-3">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Select Teaching Subjects ({selectedSubjects.length} selected)
              </label>

              {/* Popular Subject Chips */}
              <div className="flex flex-wrap gap-2">
                {POPULAR_SUBJECTS.map((subj) => {
                  const isSel = selectedSubjects.includes(subj);
                  return (
                    <button
                      type="button"
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`pill text-xs py-1 px-3 border transition inline-flex items-center gap-1.5 ${
                        isSel
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSel && <Check className="w-3 h-3" />}
                      {subj}
                    </button>
                  );
                })}
              </div>

              {/* Selected Custom Subjects Tags */}
              {selectedSubjects.some((s) => !POPULAR_SUBJECTS.includes(s)) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedSubjects
                    .filter((s) => !POPULAR_SUBJECTS.includes(s))
                    .map((subj) => (
                      <span
                        key={subj}
                        className="pill text-xs py-1 px-2.5 bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1"
                      >
                        {subj}
                        <button
                          type="button"
                          onClick={() => removeSubject(subj)}
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              )}

              {/* Add Custom Subject Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or type a custom subject name..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSubject(e);
                    }
                  }}
                  className="input flex-1 mt-0"
                />
                <button
                  type="button"
                  onClick={addCustomSubject}
                  className="pill bg-slate-800 hover:bg-slate-900 text-white text-xs px-4 flex items-center gap-1 flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            data-testid="signup-submit"
            disabled={loading}
            className="sm:col-span-2 mt-2 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl active:scale-[.98] transition disabled:opacity-60"
          >
            {loading ? "Creating Account…" : `Create ${role === "teacher" ? "Teacher" : "Student"} Account`}
          </button>
        </form>

        <div className="text-sm text-slate-500 mt-5 text-center">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
      <style>{`.input{ width:100%; margin-top:.25rem; border:1px solid #CBD5E1; border-radius:.75rem; padding:.65rem .9rem; outline:none; background:#fff; font-size:.875rem;} .input:focus{ border-color:#6366F1; box-shadow:0 0 0 3px rgba(99,102,241,.15);} `}</style>
    </div>
  );
}

function Field({ label, testid, span, children }) {
  return (
    <div className={span ? "sm:col-span-2" : ""} data-testid={testid}>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  );
}
