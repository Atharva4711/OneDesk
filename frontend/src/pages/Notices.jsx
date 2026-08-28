import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Megaphone, Plus, Mail, Users, Calendar, Filter, Send, GraduationCap, ShieldCheck } from "lucide-react";

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [form, setForm] = useState({ title: "", body: "", audience: "all" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notices");
      setNotices(data);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Please fill in all notice fields");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/notices", form);
      toast.success("Notice published successfully!");
      setShowForm(false);
      setForm({ title: "", body: "", audience: "all" });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = notices.filter(n => {
    if (audienceFilter === "all") return true;
    return n.audience === audienceFilter;
  });

  return (
    <div className="space-y-6" data-testid="notices-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Campus Notices</h1>
          <p className="text-slate-500 text-sm">
            Official announcements, student updates, and campus alerts.
          </p>
        </div>
        <button
          data-testid="new-notice-btn"
          onClick={() => setShowForm(s => !s)}
          className="pill bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition font-semibold"
        >
          <Plus className="w-4 h-4" /> Post a Notice
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="aura-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-lg">
            <Send className="w-5 h-5" />
            <span>Publish New Notice</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Notice Title
              </label>
              <input
                required
                placeholder="e.g., Annual Sports Meet Registration / Tech Symposium 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="notice-title"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
                Target Audience
              </label>
              <select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
                data-testid="notice-audience"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white text-sm font-medium"
              >
                <option value="all">Everyone (All Campus)</option>
                <option value="students">Students Only</option>
                <option value="teachers">Faculty Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">
              Notice Content & Details
            </label>
            <textarea
              required
              rows={4}
              placeholder="Write the full announcement message here, including dates, locations, or guidelines..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              data-testid="notice-body"
              className="w-full rounded-xl border border-slate-200 p-3.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="pill bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="notice-submit"
              className="pill bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-60 text-sm font-semibold"
            >
              <Send className="w-4 h-4" /> {submitting ? "Publishing..." : "Broadcast & Publish"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>
        <button
          onClick={() => setAudienceFilter("all")}
          className={`pill text-xs py-1.5 px-3.5 transition ${
            audienceFilter === "all" ? "bg-indigo-600 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Notices ({notices.length})
        </button>
        <button
          onClick={() => setAudienceFilter("students")}
          className={`pill text-xs py-1.5 px-3.5 transition ${
            audienceFilter === "students" ? "bg-indigo-600 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          For Students ({notices.filter(n => n.audience === "students").length})
        </button>
        <button
          onClick={() => setAudienceFilter("teachers")}
          className={`pill text-xs py-1.5 px-3.5 transition ${
            audienceFilter === "teachers" ? "bg-indigo-600 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          For Faculty ({notices.filter(n => n.audience === "teachers").length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading notices...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => {
            const isStudentAuthor = n.author_role === "student";

            return (
              <div
                key={n.id}
                data-testid={`notice-card-${n.id}`}
                className="aura-card p-6 border-l-4 border-l-indigo-500 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center flex-shrink-0 mt-0.5 border border-indigo-100">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-bold text-slate-800">{n.title}</h2>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          {isStudentAuthor ? (
                            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          Posted by <span className="font-semibold text-slate-900">{n.author_name}</span>
                        </span>
                        <span className="pill text-[10px] py-0.5 px-2 bg-slate-100 text-slate-700 font-semibold border border-slate-200/60 uppercase">
                          {isStudentAuthor ? "Student" : "Faculty"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="pill bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize text-xs font-semibold shrink-0">
                    {n.audience === "all" ? "📢 Campus-wide" : n.audience === "students" ? "🎓 Students Only" : "🏫 Faculty Only"}
                  </span>
                </div>

                <p className="mt-4 text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {n.body}
                </p>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500 aura-card">
              <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
              <div className="font-semibold text-slate-700">No notices posted in this category</div>
              <div className="text-sm text-slate-400 mt-1">Click &quot;Post a Notice&quot; above to publish an announcement for everyone.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
