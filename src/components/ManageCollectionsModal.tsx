import React, { useState } from "react";
import { WatchCollection, CaseMaterial, CushionColor, VaultLighting } from "../types";
import {
  X,
  Plus,
  FolderPlus,
  Edit2,
  Trash2,
  Check,
  Crown,
  Sparkles,
  Compass,
  Shield,
  Layers,
  Award,
  Palette,
  Clock,
} from "lucide-react";
import { horologyAudio } from "../utils/audio";

interface ManageCollectionsModalProps {
  collections: WatchCollection[];
  activeCollectionId: string | "all";
  onSelectCollection: (id: string | "all") => void;
  onCreateCollection: (newCol: WatchCollection) => void;
  onUpdateCollection: (updatedCol: WatchCollection) => void;
  onDeleteCollection: (colId: string) => void;
  onClose: () => void;
  watchCountByCollection: Record<string, number>;
}

const AVAILABLE_ICONS = [
  { id: "crown", label: "Crown", icon: Crown },
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "compass", label: "Compass", icon: Compass },
  { id: "shield", label: "Shield", icon: Shield },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "award", label: "Award", icon: Award },
  { id: "clock", label: "Clock", icon: Clock },
];

const THEME_COLORS = [
  { id: "amber", label: "Imperial Gold", bg: "bg-amber-500", border: "border-amber-400" },
  { id: "emerald", label: "British Racing Green", bg: "bg-emerald-500", border: "border-emerald-400" },
  { id: "blue", label: "Navy Royal", bg: "bg-blue-500", border: "border-blue-400" },
  { id: "purple", label: "Imperial Violet", bg: "bg-purple-500", border: "border-purple-400" },
  { id: "rose", label: "Rose Gold", bg: "bg-rose-500", border: "border-rose-400" },
  { id: "slate", label: "Titanium Steel", bg: "bg-slate-400", border: "border-slate-300" },
];

const MATERIALS: { id: CaseMaterial; label: string; color: string }[] = [
  { id: "walnut", label: "American Walnut Wood", color: "bg-[#2b1810]" },
  { id: "piano_black", label: "Piano Black Lacquer", color: "bg-neutral-950" },
  { id: "forest_leather", label: "British Racing Green Leather", color: "bg-emerald-950" },
  { id: "carbon_fiber", label: "Matte Carbon Fiber", color: "bg-zinc-900" },
  { id: "mahogany", label: "Imperial Mahogany", color: "bg-[#381008]" },
];

const CUSHIONS: { id: CushionColor; label: string; color: string }[] = [
  { id: "ivory", label: "Ivory Velvet", color: "bg-amber-100" },
  { id: "midnight", label: "Midnight Blue", color: "bg-blue-950" },
  { id: "burgundy", label: "Burgundy Bordeaux", color: "bg-rose-950" },
  { id: "hunter_green", label: "Hunter Green", color: "bg-emerald-950" },
  { id: "charcoal", label: "Charcoal Suede", color: "bg-neutral-800" },
];

export const ManageCollectionsModal: React.FC<ManageCollectionsModalProps> = ({
  collections,
  activeCollectionId,
  onSelectCollection,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onClose,
  watchCountByCollection,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("crown");
  const [selectedColor, setSelectedColor] = useState("amber");
  const [material, setMaterial] = useState<CaseMaterial>("walnut");
  const [cushionColor, setCushionColor] = useState<CushionColor>("ivory");
  const [lighting, setLighting] = useState<VaultLighting>("warm_gallery");

  const startCreateNew = () => {
    setName("");
    setDescription("");
    setSelectedIcon("crown");
    setSelectedColor("amber");
    setMaterial("walnut");
    setCushionColor("ivory");
    setLighting("warm_gallery");
    setEditingCollectionId(null);
    setIsCreatingNew(true);
  };

  const startEditing = (col: WatchCollection) => {
    setName(col.name);
    setDescription(col.description || "");
    setSelectedIcon(col.icon || "crown");
    setSelectedColor(col.themeColor || "amber");
    setMaterial(col.caseSettings?.material || "walnut");
    setCushionColor(col.caseSettings?.cushionColor || "ivory");
    setLighting(col.caseSettings?.lighting || "warm_gallery");
    setEditingCollectionId(col.id);
    setIsCreatingNew(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingCollectionId) {
      const existing = collections.find((c) => c.id === editingCollectionId);
      if (existing) {
        onUpdateCollection({
          ...existing,
          name: name.trim(),
          description: description.trim(),
          icon: selectedIcon,
          themeColor: selectedColor,
          caseSettings: {
            material,
            cushionColor,
            lighting,
          },
        });
      }
    } else {
      const newCol: WatchCollection = {
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        themeColor: selectedColor,
        caseSettings: {
          material,
          cushionColor,
          lighting,
        },
        createdAt: new Date().toISOString(),
      };
      onCreateCollection(newCol);
      onSelectCollection(newCol.id);
    }

    horologyAudio.playCaseLid();
    setIsCreatingNew(false);
    setEditingCollectionId(null);
  };

  const getIconComponent = (iconId?: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.id === iconId);
    const IconCmp = found ? found.icon : Crown;
    return <IconCmp size={16} />;
  };

  return (
    <div
      id="manage-collections-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-3xl border border-neutral-800 shadow-2xl p-6 sm:p-8 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-collections-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">
            <FolderPlus size={14} />
            <span>Curatorial Organization</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-100">
            Manage Watch Collections & Vitrines
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Organize your timepieces into specialized vitrine boxes (e.g. Holy Grails, Daily Divers, Vintage Dress) with custom materials and ambient lighting.
          </p>
        </div>

        {/* Form View (Create or Edit) */}
        {isCreatingNew ? (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-neutral-200">
                {editingCollectionId ? "Edit Collection Parameters" : "Create New Vitrine Collection"}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingCollectionId(null);
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                Back to Collections List
              </button>
            </div>

            {/* Collection Name */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
                Collection Name *
              </label>
              <input
                id="collection-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Independent Haute Horlogerie, Vintage Chronographs, Grails..."
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Collection Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
                Curation Description & Theme
              </label>
              <input
                id="collection-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Masterpieces representing the zenith of hand-finishing and complication mechanics..."
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Icon & Theme Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                  Emblem Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map((ico) => {
                    const IconComponent = ico.icon;
                    return (
                      <button
                        key={ico.id}
                        type="button"
                        onClick={() => setSelectedIcon(ico.id)}
                        className={`p-2.5 rounded-xl border transition-all ${
                          selectedIcon === ico.id
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                        }`}
                        title={ico.label}
                      >
                        <IconComponent size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {THEME_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id)}
                      className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                        col.bg
                      } ${selectedColor === col.id ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"}`}
                      title={col.label}
                    >
                      {selectedColor === col.id && <Check size={14} className="text-neutral-950 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vitrine Finishes */}
            <div className="pt-2 border-t border-neutral-800/80">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-3">
                Vitrine Case Finish & Interior Velvet
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Wood finish */}
                <div>
                  <span className="text-[11px] text-neutral-400 block mb-1.5 font-medium">Exterior Material</span>
                  <div className="space-y-1.5">
                    {MATERIALS.map((mat) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => setMaterial(mat.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center gap-2 text-xs transition-all ${
                          material === mat.id
                            ? "bg-amber-500/10 border-amber-500 text-amber-200"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border border-white/20 ${mat.color}`} />
                        <span>{mat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Velvet Cushion */}
                <div>
                  <span className="text-[11px] text-neutral-400 block mb-1.5 font-medium">Velvet Pillow Color</span>
                  <div className="space-y-1.5">
                    {CUSHIONS.map((cush) => (
                      <button
                        key={cush.id}
                        type="button"
                        onClick={() => setCushionColor(cush.id)}
                        className={`w-full px-3 py-2 rounded-xl border text-left flex items-center gap-2 text-xs transition-all ${
                          cushionColor === cush.id
                            ? "bg-amber-500/10 border-amber-500 text-amber-200"
                            : "bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border border-white/20 ${cush.color}`} />
                        <span>{cush.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingCollectionId(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                id="save-collection-btn"
                type="button"
                onClick={handleSave}
                disabled={!name.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-bold text-xs uppercase tracking-wider disabled:opacity-40 shadow-lg shadow-amber-500/20 transition-all"
              >
                {editingCollectionId ? "Update Collection" : "Create Vitrine Collection"}
              </button>
            </div>
          </div>
        ) : (
          /* Collections List View */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                {collections.length} Vitrine {collections.length === 1 ? "Box" : "Boxes"} Configured
              </span>
              <button
                id="add-new-collection-modal-btn"
                onClick={startCreateNew}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <Plus size={14} />
                <span>New Collection</span>
              </button>
            </div>

            {/* Collection Cards List */}
            <div className="space-y-3">
              {collections.map((col) => {
                const count = watchCountByCollection[col.id] || 0;
                const isActive = activeCollectionId === col.id;

                return (
                  <div
                    key={col.id}
                    id={`collection-item-${col.id}`}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 bg-neutral-900/60 ${
                      isActive
                        ? "border-amber-500/80 ring-1 ring-amber-500/40 bg-amber-500/5"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3.5 cursor-pointer flex-1"
                      onClick={() => {
                        onSelectCollection(col.id);
                        horologyAudio.playCrownClick();
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        {getIconComponent(col.icon)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-100">{col.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                            {count} {count === 1 ? "Timepiece" : "Timepieces"}
                          </span>
                          {isActive && (
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              Active Vitrine
                            </span>
                          )}
                        </div>
                        {col.description && (
                          <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">{col.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        id={`edit-col-${col.id}`}
                        onClick={() => startEditing(col)}
                        className="p-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                        title="Edit collection settings"
                      >
                        <Edit2 size={14} />
                      </button>

                      {collections.length > 1 && (
                        <button
                          id={`delete-col-${col.id}`}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete collection "${col.name}"? Timepieces inside will be reassigned to the default collection.`
                              )
                            ) {
                              onDeleteCollection(col.id);
                              horologyAudio.playCrownClick();
                            }
                          }}
                          className="p-2 rounded-lg bg-neutral-800/80 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors"
                          title="Delete collection"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
