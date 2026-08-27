import React, { useState, useEffect, useCallback } from "react";
import { Watch, CaseSettings, WatchCollection } from "./types";
import { DEFAULT_WATCHES, DEFAULT_COLLECTIONS } from "./data/defaultWatches";
import { WatchCase } from "./components/WatchCase";
import { WatchInspectionModal } from "./components/WatchInspectionModal";
import { AddWatchModal } from "./components/AddWatchModal";
import { CaseSettingsModal } from "./components/CaseSettingsModal";
import { ManageCollectionsModal } from "./components/ManageCollectionsModal";
import { AuthModal } from "./components/AuthModal";
import { WatchSearchEngine } from "./components/WatchSearchEngine";
import { auth, onAuthStateChanged, User } from "./firebase";
import {
  loadUserDataFromFirestore,
  saveWatchToFirestore,
  deleteWatchFromFirestore,
  saveCollectionToFirestore,
  deleteCollectionFromFirestore,
  saveCaseSettingsToFirestore,
  syncLocalWorkspaceToCloud,
} from "./utils/cloudSync";
import {
  Watch as WatchIcon,
  Plus,
  Sliders,
  Search,
  Volume2,
  VolumeX,
  Layers,
  FolderPlus,
  Undo2,
  Cloud,
  CloudCheck,
  User as UserIcon,
  Loader2,
  Sparkles,
  Compass,
} from "lucide-react";
import { horologyAudio } from "./utils/audio";

const getStorageKey = (uid?: string | null) =>
  uid ? `watch_gallery_${uid}_watches_v2` : "watch_gallery_guest_watches_v2";
const getCollectionsKey = (uid?: string | null) =>
  uid ? `watch_gallery_${uid}_collections_v2` : "watch_gallery_guest_collections_v2";
const getSettingsKey = (uid?: string | null) =>
  uid ? `watch_gallery_${uid}_settings_v2` : "watch_gallery_guest_settings_v2";

const DEFAULT_SETTINGS: CaseSettings = {
  material: "walnut",
  cushionColor: "charcoal",
  lighting: "warm_gallery",
  soundEnabled: true,
  columns: 4,
};

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "local">("local");

  // Collections state
  const [collections, setCollections] = useState<WatchCollection[]>(() => {
    try {
      const saved = localStorage.getItem(getCollectionsKey(null));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_COLLECTIONS;
  });

  const [activeCollectionId, setActiveCollectionId] = useState<string | "all">("all");

  // Watches state
  const [watches, setWatches] = useState<Watch[]>(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(null));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WATCHES;
  });

  const [caseSettings, setCaseSettings] = useState<CaseSettings>(() => {
    try {
      const saved = localStorage.getItem(getSettingsKey(null));
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SETTINGS;
  });

  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchEngineOpen, setIsSearchEngineOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<"ai_search" | "source_catalogs">("ai_search");
  const [addModalInitialQuery, setAddModalInitialQuery] = useState<string>("");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isManageCollectionsOpen, setIsManageCollectionsOpen] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterMovement, setFilterMovement] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Undo delete snackbar state
  const [recentlyDeletedWatch, setRecentlyDeletedWatch] = useState<{ watch: Watch; index: number } | null>(null);
  const [undoToastVisible, setUndoToastVisible] = useState(false);

  // 1. Firebase Auth listener & initial cloud load (Strict per-user isolation)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setSyncStatus("saving");
        try {
          const cloudData = await loadUserDataFromFirestore(user.uid);
          if (cloudData.watches && cloudData.watches.length > 0) {
            setWatches(cloudData.watches);
          } else {
            setWatches(DEFAULT_WATCHES);
          }
          if (cloudData.collections && cloudData.collections.length > 0) {
            setCollections(cloudData.collections);
          } else {
            setCollections(DEFAULT_COLLECTIONS);
          }
          if (cloudData.caseSettings) {
            setCaseSettings(cloudData.caseSettings);
          } else {
            setCaseSettings(DEFAULT_SETTINGS);
          }
          setSyncStatus("synced");
        } catch (err) {
          console.error("Failed to load user cloud data:", err);
          setSyncStatus("local");
        }
      } else {
        // User logged out: restore guest cache or defaults to prevent data leakage across accounts
        try {
          const savedGuestWatches = localStorage.getItem(getStorageKey(null));
          const savedGuestCollections = localStorage.getItem(getCollectionsKey(null));
          const savedGuestSettings = localStorage.getItem(getSettingsKey(null));

          setWatches(savedGuestWatches ? JSON.parse(savedGuestWatches) : DEFAULT_WATCHES);
          setCollections(savedGuestCollections ? JSON.parse(savedGuestCollections) : DEFAULT_COLLECTIONS);
          if (savedGuestSettings) setCaseSettings(JSON.parse(savedGuestSettings));
        } catch {
          setWatches(DEFAULT_WATCHES);
          setCollections(DEFAULT_COLLECTIONS);
          setCaseSettings(DEFAULT_SETTINGS);
        }
        setSelectedWatch(null);
        setSyncStatus("local");
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Persist to user-namespaced LocalStorage (local-first cache per user)
  useEffect(() => {
    try {
      localStorage.setItem(getCollectionsKey(currentUser?.uid), JSON.stringify(collections));
    } catch {}
  }, [collections, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(currentUser?.uid), JSON.stringify(watches));
    } catch {}
  }, [watches, currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(getSettingsKey(currentUser?.uid), JSON.stringify(caseSettings));
    } catch {}
    horologyAudio.setMuted(!caseSettings.soundEnabled);
  }, [caseSettings, currentUser]);

  // Handle manual sync of entire workspace
  const handleSyncLocalToCloud = async () => {
    if (!currentUser) return;
    setSyncStatus("saving");
    try {
      await syncLocalWorkspaceToCloud(currentUser.uid, watches, collections, caseSettings);
      setSyncStatus("synced");
    } catch (err) {
      console.error("Cloud sync failed:", err);
      setSyncStatus("local");
      throw err;
    }
  };

  // Add Watch handler
  const handleAddWatch = (newWatch: Watch) => {
    setWatches((prev) => [newWatch, ...prev]);
    setSelectedWatch(newWatch);

    if (currentUser) {
      setSyncStatus("saving");
      saveWatchToFirestore(currentUser.uid, newWatch)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("local"));
    }
  };

  // Update single watch (e.g. notes, strap, engraving, collection)
  const handleUpdateWatch = (updatedWatch: Watch) => {
    setWatches((prev) => prev.map((w) => (w.id === updatedWatch.id ? updatedWatch : w)));
    setSelectedWatch(updatedWatch);

    if (currentUser) {
      setSyncStatus("saving");
      saveWatchToFirestore(currentUser.uid, updatedWatch)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("local"));
    }
  };

  // Delete watch with undo support
  const handleDeleteWatch = (id: string) => {
    const watchIndex = watches.findIndex((w) => w.id === id);
    const watchToDelete = watches[watchIndex];

    if (watchToDelete) {
      setRecentlyDeletedWatch({ watch: watchToDelete, index: watchIndex });
      setUndoToastVisible(true);
      setTimeout(() => {
        setUndoToastVisible(false);
      }, 5000);
    }

    setWatches((prev) => prev.filter((w) => w.id !== id));
    if (selectedWatch?.id === id) setSelectedWatch(null);

    if (currentUser) {
      setSyncStatus("saving");
      deleteWatchFromFirestore(currentUser.uid, id)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("local"));
    }
  };

  // Undo delete
  const handleUndoDelete = () => {
    if (!recentlyDeletedWatch) return;
    const restored = recentlyDeletedWatch.watch;
    setWatches((prev) => {
      const next = [...prev];
      next.splice(recentlyDeletedWatch.index, 0, restored);
      return next;
    });
    setUndoToastVisible(false);
    setRecentlyDeletedWatch(null);
    horologyAudio.playCrownClick();

    if (currentUser) {
      setSyncStatus("saving");
      saveWatchToFirestore(currentUser.uid, restored)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("local"));
    }
  };

  // Move watch between collections
  const handleMoveWatchCollection = (watchId: string, targetCollectionId: string) => {
    let updatedWatch: Watch | null = null;
    setWatches((prev) =>
      prev.map((w) => {
        if (w.id === watchId) {
          updatedWatch = { ...w, collectionId: targetCollectionId };
          return updatedWatch;
        }
        return w;
      })
    );

    if (selectedWatch && selectedWatch.id === watchId) {
      setSelectedWatch((prev) => (prev ? { ...prev, collectionId: targetCollectionId } : null));
    }

    if (currentUser && updatedWatch) {
      saveWatchToFirestore(currentUser.uid, updatedWatch);
    }
  };

  // Collection CRUD handlers
  const handleCreateCollection = (newCol: WatchCollection) => {
    setCollections((prev) => [...prev, newCol]);

    if (currentUser) {
      setSyncStatus("saving");
      saveCollectionToFirestore(currentUser.uid, newCol)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("local"));
    }
  };

  const handleUpdateCollection = (updatedCol: WatchCollection) => {
    setCollections((prev) => prev.map((c) => (c.id === updatedCol.id ? updatedCol : c)));

    if (currentUser) {
      setSyncStatus("saving");
      saveCollectionToFirestore(currentUser.uid, updatedCol)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("local"));
    }
  };

  const handleDeleteCollection = (colId: string) => {
    const fallbackColId = collections.find((c) => c.id !== colId)?.id || "col-grails";
    setWatches((prev) =>
      prev.map((w) => {
        if (w.collectionId === colId) {
          const reassigned = { ...w, collectionId: fallbackColId };
          if (currentUser) saveWatchToFirestore(currentUser.uid, reassigned);
          return reassigned;
        }
        return w;
      })
    );

    setCollections((prev) => prev.filter((c) => c.id !== colId));
    if (activeCollectionId === colId) {
      setActiveCollectionId("all");
    }

    if (currentUser) {
      deleteCollectionFromFirestore(currentUser.uid, colId);
    }
  };

  // Update Case Settings
  const handleUpdateCaseSettings = (updated: Partial<CaseSettings>) => {
    const newSettings = { ...caseSettings, ...updated };
    setCaseSettings(newSettings);

    if (currentUser) {
      saveCaseSettingsToFirestore(currentUser.uid, newSettings);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    let toggled: Watch | null = null;
    setWatches((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          toggled = { ...w, userFavorite: !w.userFavorite };
          return toggled;
        }
        return w;
      })
    );

    if (currentUser && toggled) {
      saveWatchToFirestore(currentUser.uid, toggled);
    }
  };

  // Reset to default curated collection
  const handleResetCollection = () => {
    setWatches(DEFAULT_WATCHES);
    setCollections(DEFAULT_COLLECTIONS);
    setActiveCollectionId("all");
    setSelectedWatch(null);

    if (currentUser) {
      syncLocalWorkspaceToCloud(currentUser.uid, DEFAULT_WATCHES, DEFAULT_COLLECTIONS, DEFAULT_SETTINGS);
    }
  };

  // Export JSON (Both watches and collections)
  const handleExportCollection = () => {
    const exportData = {
      version: 2,
      exportDate: new Date().toISOString(),
      user: currentUser ? currentUser.email || currentUser.uid : "guest",
      collections,
      watches,
    };
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `watch_vitrine_archive_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportCollection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === "object") {
            if (Array.isArray(parsed)) {
              setWatches(parsed);
              if (currentUser) {
                syncLocalWorkspaceToCloud(currentUser.uid, parsed, collections, caseSettings);
              }
            } else if (Array.isArray(parsed.watches)) {
              setWatches(parsed.watches);
              if (Array.isArray(parsed.collections)) {
                setCollections(parsed.collections);
              }
              if (currentUser) {
                syncLocalWorkspaceToCloud(
                  currentUser.uid,
                  parsed.watches,
                  parsed.collections || collections,
                  caseSettings
                );
              }
            }
            setIsSettingsModalOpen(false);
            horologyAudio.playCaseLid();
          }
        } catch {
          alert("Invalid collection JSON file format.");
        }
      };
    }
  };

  return (
    <div
      id="watch-gallery-app"
      className="min-h-screen bg-gradient-to-b from-[#0a0a0c] via-[#0e0e12] to-[#08080a] text-neutral-100 flex flex-col antialiased selection:bg-amber-500 selection:text-neutral-950 font-sans"
    >
      {/* Top Navbar / Horological Gallery Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/85 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/20 border border-amber-400/40">
              <WatchIcon size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg tracking-wider text-amber-100 uppercase">
                  Chronos
                </span>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  Vitrine
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block">
                Multi-Collection Virtual Vitrine • Persistent Cloud Showcase
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 max-w-xs sm:max-w-md relative hidden md:block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              id="gallery-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, brand, style (Dress, Diver), movement..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 transition-colors shadow-inner"
            />
          </div>

          {/* Action Buttons & User Cloud Auth Badge */}
          <div className="flex items-center gap-2">
            {/* Cloud Save & User Account Button */}
            <button
              id="user-cloud-account-btn"
              onClick={() => {
                setIsAuthModalOpen(true);
                horologyAudio.playCrownClick();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                currentUser
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/70"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10"
              }`}
              title={currentUser ? `Signed in as ${currentUser.email || "Guest"}` : "Sign in to save your personal vitrine in the cloud"}
            >
              {syncStatus === "saving" ? (
                <Loader2 size={14} className="animate-spin text-amber-400" />
              ) : currentUser ? (
                <Cloud size={14} className="text-emerald-400" />
              ) : (
                <Cloud size={14} className="text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {currentUser
                  ? currentUser.displayName || (currentUser.email ? currentUser.email.split("@")[0] : "Cloud Vault")
                  : "Save to Cloud"}
              </span>
            </button>

            {/* Manage Collections Button */}
            <button
              id="header-manage-collections-btn"
              onClick={() => {
                setIsManageCollectionsOpen(true);
                horologyAudio.playCrownClick();
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-medium transition-colors"
              title="Manage Collections & Vitrines"
            >
              <FolderPlus size={15} className="text-amber-400" />
              <span>Vitrines ({collections.length})</span>
            </button>

            {/* Vitrine Display Settings */}
            <button
              id="open-case-settings-btn"
              onClick={() => {
                setIsSettingsModalOpen(true);
                horologyAudio.playCrownClick();
              }}
              className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800 transition-colors"
              title="Customize Case Finish & Vitrine Lighting"
            >
              <Sliders size={16} />
            </button>

            {/* Sound Toggle */}
            <button
              id="nav-sound-toggle-btn"
              onClick={() => {
                const next = !caseSettings.soundEnabled;
                horologyAudio.setMuted(!next);
                setCaseSettings((prev) => ({ ...prev, soundEnabled: next }));
                if (next) horologyAudio.playCrownClick();
              }}
              className={`p-2.5 rounded-xl border transition-colors ${
                caseSettings.soundEnabled
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
              title={caseSettings.soundEnabled ? "Audio On" : "Audio Muted"}
            >
              {caseSettings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Watch Search Engine (Discovery Across All 9 Sources) */}
            <button
              id="header-watch-search-engine-btn"
              onClick={() => {
                setIsSearchEngineOpen(true);
                horologyAudio.playCrownClick();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 hover:border-amber-500/50 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Search & Explore Watches Across Hodinkee, Wristcheck, WatchBase, Chrono24 & More"
            >
              <Compass size={14} className="text-amber-400" />
              <span className="hidden md:inline">Watch Search Engine</span>
              <span className="md:hidden">Search Engine</span>
            </button>

            {/* AI Search Lens Direct Launcher */}
            <button
              id="header-ai-search-lens-btn"
              onClick={() => {
                setAddModalMode("ai_search");
                setAddModalInitialQuery(searchQuery);
                setIsAddModalOpen(true);
                horologyAudio.playCrownClick();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm shadow-amber-500/10 active:scale-95"
              title="Open AI Watch Recognition & Provenance Search Lens"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="hidden sm:inline">AI Lens</span>
            </button>

            {/* Add Watch Button */}
            <button
              id="nav-add-watch-btn"
              onClick={() => {
                setAddModalMode("ai_search");
                setIsAddModalOpen(true);
                horologyAudio.playCaseLid();
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Plus size={15} />
              <span className="hidden xs:inline">Input Watch</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-3 relative block md:hidden">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            id="mobile-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search watches in vitrine..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </header>

      {/* Main Watch Case Display Area */}
      <main className="flex-1 flex flex-col">
        <WatchCase
          watches={watches}
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={(id) => setActiveCollectionId(id)}
          onOpenManageCollections={() => setIsManageCollectionsOpen(true)}
          selectedWatch={selectedWatch}
          onSelectWatch={(watch) => setSelectedWatch(watch)}
          onAddNewWatch={() => {
            setIsAddModalOpen(true);
            horologyAudio.playCaseLid();
          }}
          onToggleFavorite={handleToggleFavorite}
          onDeleteWatch={handleDeleteWatch}
          onMoveWatchCollection={handleMoveWatchCollection}
          caseSettings={caseSettings}
          onUpdateCaseSettings={handleUpdateCaseSettings}
          filterCategory={filterCategory}
          onFilterChange={(cat) => setFilterCategory(cat)}
          filterMovement={filterMovement}
          onFilterMovementChange={(mov) => setFilterMovement(mov)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
        />
      </main>

      {/* Undo Delete Toast Snackbar */}
      {undoToastVisible && recentlyDeletedWatch && (
        <div
          id="undo-delete-toast"
          className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-amber-500/60 p-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-slide-up text-xs"
        >
          <div className="flex flex-col">
            <span className="font-bold text-neutral-100">
              Removed {recentlyDeletedWatch.watch.brand} {recentlyDeletedWatch.watch.name}
            </span>
            <span className="text-[11px] text-neutral-400">Timepiece removed from vitrine</span>
          </div>
          <button
            id="undo-delete-btn"
            onClick={handleUndoDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400 transition-colors ml-2"
          >
            <Undo2 size={13} />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950/60 py-6 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-neutral-400 font-mono text-[11px]">
              Multi-Vitrine Horological Engine • Persistent Firestore Cloud Vault
            </span>
          </div>
          <p className="text-[11px] text-neutral-500">
            {currentUser
              ? `Signed in as ${currentUser.displayName || currentUser.email || "Private Collector"}. All changes auto-saved to cloud.`
              : "Sign in with Google or Email to automatically save your custom collections across devices."}
          </p>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. User Auth & Cloud Save Modal */}
      {isAuthModalOpen && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setIsAuthModalOpen(false)}
          onSyncLocalToCloud={handleSyncLocalToCloud}
          watchCount={watches.length}
          collectionCount={collections.length}
        />
      )}

      {/* 2. Watch Inspection & Horological Dossier Loupe */}
      {selectedWatch && (
        <WatchInspectionModal
          watch={selectedWatch}
          collections={collections}
          onClose={() => setSelectedWatch(null)}
          onUpdateWatch={handleUpdateWatch}
          onDeleteWatch={handleDeleteWatch}
        />
      )}

      {/* 3. Add New Watch AI Modal */}
      {isAddModalOpen && (
        <AddWatchModal
          collections={collections}
          defaultCollectionId={activeCollectionId !== "all" ? activeCollectionId : undefined}
          initialMode={addModalMode}
          initialQuery={addModalInitialQuery}
          onClose={() => {
            setIsAddModalOpen(false);
            setAddModalInitialQuery("");
          }}
          onAddWatch={handleAddWatch}
        />
      )}

      {/* 4. Manage Collections Modal */}
      {isManageCollectionsOpen && (
        <ManageCollectionsModal
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={(id) => setActiveCollectionId(id)}
          onCreateCollection={handleCreateCollection}
          onUpdateCollection={handleUpdateCollection}
          onDeleteCollection={handleDeleteCollection}
          onClose={() => setIsManageCollectionsOpen(false)}
          watchCountByCollection={
            collections.reduce((acc, col) => {
              acc[col.id] = watches.filter((w) => w.collectionId === col.id).length;
              return acc;
            }, {} as Record<string, number>)
          }
        />
      )}

      {/* 5. Vitrine & Display Settings Modal */}
      {isSettingsModalOpen && (
        <CaseSettingsModal
          settings={caseSettings}
          onUpdateSettings={handleUpdateCaseSettings}
          onResetCollection={handleResetCollection}
          onExportCollection={handleExportCollection}
          onImportCollection={handleImportCollection}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {/* 6. Comprehensive Watch Search & Discovery Engine Across 9 Sources */}
      {isSearchEngineOpen && (
        <WatchSearchEngine
          isOpen={isSearchEngineOpen}
          onClose={() => setIsSearchEngineOpen(false)}
          onSelectWatchForInspection={(watch) => {
            setSelectedWatch(watch);
            setIsSearchEngineOpen(false);
          }}
          onAddWatchToCollection={(watch, collectionId) => {
            const newWatch: Watch = {
              ...watch,
              id: `watch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              collectionId: collectionId || activeCollectionId || "default",
              dateAdded: new Date().toISOString(),
            };
            handleAddWatch(newWatch);
          }}
          collections={collections}
          activeCollectionId={activeCollectionId !== "all" ? activeCollectionId : collections[0]?.id || "default"}
        />
      )}
    </div>
  );
}
