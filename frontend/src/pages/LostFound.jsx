import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Search, Plus, MapPin, Tag, CheckCircle2, User, Clock, AlertCircle } from "lucide-react";

export default function LostFound() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterKind, setFilterKind] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    kind: "lost",
    photo_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/lostfound");
      setItems(data);
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
    setSubmitting(true);
    try {
      await api.post("/lostfound", form);
      toast.success("Item posted successfully!");
      setShowForm(false);
      setForm({ title: "", description: "", location: "", kind: "lost", photo_url: "" });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async (id) => {
    try {
      await api.post(`/lostfound/${id}/resolve`);
      toast.success("Item marked as resolved!");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const filtered = items.filter(item => {
    if (filterKind === "all") return true;
    return item.kind === filterKind;
  });

  return (
    <div className="space-y-6" data-testid="lostfound-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Lost & Found</h1>
          <p className="text-slate-500 text-sm">
            Report lost possessions or help return found items to peers.
          </p>
        </div>
        <button
          data-testid="post-item-btn"
          onClick={() => setShowForm(s => !s)}
          className="pill bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-2 shadow-md hover:shadow-lg transition"
        >
          <Plus className="w-4 h-4" /> Report an Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="aura-card p-6 space-y-4">
          <div className="font-heading text-xl font-bold text-slate-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            <span>Post an Item</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-slate-100 max-w-xs">
            <button
              type="button"
              onClick={() => setForm({ ...form, kind: "lost" })}
              className={`py-1.5 rounded-full text-xs font-semibold ${form.kind === "lost" ? "bg-rose-500 text-white shadow" : "text-slate-600"}`}
            >
              Lost Item
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, kind: "found" })}
              className={`py-1.5 rounded-full text-xs font-semibold ${form.kind === "found" ? "bg-emerald-600 text-white shadow" : "text-slate-600"}`}
            >
              Found Item
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Item Name / Title</label>
              <input
                required
                placeholder="e.g., Blue Water Bottle or Scientific Calculator"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                data-testid="item-title"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Campus Location</label>
              <input
                required
                placeholder="e.g., Library 2nd Floor, Room 302, Canteen"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                data-testid="item-location"
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description & Details</label>
            <textarea
              required
              rows={3}
              placeholder="Provide identifiable markings, brand, color, or contact instructions..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              data-testid="item-desc"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="pill bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="item-submit"
              className="pill bg-indigo-600 text-white shadow hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Publish Post"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterKind("all")}
          className={`pill ${filterKind === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
        >
          All Items ({items.length})
        </button>
        <button
          onClick={() => setFilterKind("lost")}
          className={`pill ${filterKind === "lost" ? "bg-rose-500 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
        >
          Lost ({items.filter(i => i.kind === "lost").length})
        </button>
        <button
          onClick={() => setFilterKind("found")}
          className={`pill ${filterKind === "found" ? "bg-emerald-600 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
        >
          Found ({items.filter(i => i.kind === "found").length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading lost & found items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              data-testid={`lostfound-card-${item.id}`}
              className={`aura-card p-6 flex flex-col justify-between hover:shadow-md transition ${item.resolved ? "opacity-60 bg-slate-50" : ""}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`pill text-xs capitalize font-bold ${
                      item.kind === "lost"
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {item.kind}
                  </span>
                  {item.resolved ? (
                    <span className="pill bg-slate-200 text-slate-700 text-[11px] inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Resolved
                    </span>
                  ) : (
                    <span className="pill bg-amber-50 text-amber-700 text-[11px] border border-amber-200">
                      Active
                    </span>
                  )}
                </div>

                <h3 className="font-heading text-lg font-bold text-slate-800 mb-1">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>{item.location || "Campus"}</span>
                </div>

                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-400">
                  <div>Posted by <span className="font-medium text-slate-600">{item.author_name}</span></div>
                  <div>{new Date(item.created_at).toLocaleDateString()}</div>
                </div>

                {!item.resolved && (item.author_id === user?.id || user?.role === "teacher") && (
                  <button
                    data-testid={`resolve-btn-${item.id}`}
                    onClick={() => resolve(item.id)}
                    className="pill text-xs py-1.5 px-3 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500 aura-card">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
              <div className="font-semibold text-slate-700">No items listed in this category</div>
              <div className="text-sm text-slate-400 mt-1">Click &quot;Report an Item&quot; to post a new listing.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
