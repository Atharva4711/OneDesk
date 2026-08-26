import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Search, Plus, MapPin, Tag, CheckCircle2, User, Clock, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";

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
      toast.success(form.kind === "lost" ? "Lost item report published!" : "Found item post published!");
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
      toast.success("Item successfully marked as Found & Resolved!");
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  // Filter items according to category
  // When an item is resolved, it is placed in the "Found" category (and "Resolved")
  const filtered = items.filter(item => {
    if (filterKind === "all") return true;
    if (filterKind === "lost") {
      // Active lost items only
      return item.kind === "lost" && !item.resolved;
    }
    if (filterKind === "found") {
      // Items posted as found OR lost items that have been resolved/found
      return item.kind === "found" || item.resolved;
    }
    if (filterKind === "resolved") {
      return !!item.resolved;
    }
    return true;
  });

  const activeLostCount = items.filter(i => i.kind === "lost" && !i.resolved).length;
  const foundAndResolvedCount = items.filter(i => i.kind === "found" || i.resolved).length;
  const resolvedCount = items.filter(i => i.resolved).length;

  return (
    <div className="space-y-6" data-testid="lostfound-page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Lost & Found</h1>
          <p className="text-slate-500 text-sm">
            Report lost possessions or help return found items to peers across campus.
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
            <span>Post an Item Listing</span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-slate-100 max-w-xs">
            <button
              type="button"
              onClick={() => setForm({ ...form, kind: "lost" })}
              className={`py-1.5 rounded-full text-xs font-semibold transition ${form.kind === "lost" ? "bg-rose-500 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
            >
              Lost Item
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, kind: "found" })}
              className={`py-1.5 rounded-full text-xs font-semibold transition ${form.kind === "found" ? "bg-emerald-600 text-white shadow" : "text-slate-600 hover:text-slate-900"}`}
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
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
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description & Identifiable Details</label>
            <textarea
              required
              rows={3}
              placeholder="Provide identifiable markings, brand, color, or contact instructions..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              data-testid="item-desc"
              className="mt-1 w-full rounded-xl border border-slate-200 p-3.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
              className="pill bg-indigo-600 text-white shadow hover:bg-indigo-700 transition disabled:opacity-60 font-semibold"
            >
              {submitting ? "Publishing..." : "Publish Item"}
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterKind("all")}
          className={`pill text-xs py-1.5 px-3.5 transition shrink-0 ${
            filterKind === "all" ? "bg-slate-900 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Listings ({items.length})
        </button>
        <button
          onClick={() => setFilterKind("lost")}
          className={`pill text-xs py-1.5 px-3.5 transition shrink-0 ${
            filterKind === "lost" ? "bg-rose-500 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Lost ({activeLostCount})
        </button>
        <button
          onClick={() => setFilterKind("found")}
          className={`pill text-xs py-1.5 px-3.5 transition shrink-0 ${
            filterKind === "found" ? "bg-emerald-600 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Found & Recovered ({foundAndResolvedCount})
        </button>
        <button
          onClick={() => setFilterKind("resolved")}
          className={`pill text-xs py-1.5 px-3.5 transition shrink-0 ${
            filterKind === "resolved" ? "bg-indigo-600 text-white shadow-sm font-semibold" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Resolved Archive ({resolvedCount})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading lost & found items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isResolved = !!item.resolved;
            const isOriginallyLost = item.kind === "lost";

            return (
              <div
                key={item.id}
                data-testid={`lostfound-card-${item.id}`}
                className={`aura-card p-6 flex flex-col justify-between hover:shadow-md transition ${
                  isResolved ? "bg-emerald-50/40 border-emerald-200" : ""
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {isResolved ? (
                      <span className="pill text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Found & Resolved
                      </span>
                    ) : item.kind === "lost" ? (
                      <span className="pill text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Lost Item
                      </span>
                    ) : (
                      <span className="pill text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        Found Item
                      </span>
                    )}

                    {isResolved ? (
                      <span className="pill bg-emerald-200/70 text-emerald-900 text-[11px] font-semibold">
                        Archived
                      </span>
                    ) : (
                      <span className="pill bg-amber-50 text-amber-700 text-[11px] border border-amber-200 font-medium">
                        Active Listing
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-slate-800 mb-1">{item.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <span>{item.location || "Campus Premises"}</span>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    <div>Reported by <span className="font-medium text-slate-600">{item.author_name}</span></div>
                    <div>{new Date(item.created_at).toLocaleDateString()}</div>
                  </div>

                  {!isResolved && (item.author_id === user?.id || user?.role === "teacher") && (
                    <button
                      data-testid={`resolve-btn-${item.id}`}
                      onClick={() => resolve(item.id)}
                      className="pill text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition inline-flex items-center gap-1 font-semibold"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Found & Resolved
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-slate-500 aura-card">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
              <div className="font-semibold text-slate-700">No items found in this section</div>
              <div className="text-sm text-slate-400 mt-1">
                {filterKind === "lost"
                  ? "Great news! There are currently no active lost item reports."
                  : filterKind === "found"
                  ? "No found or recovered items reported currently."
                  : "Click 'Report an Item' to publish a listing."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
