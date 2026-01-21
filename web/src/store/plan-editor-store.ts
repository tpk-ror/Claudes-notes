import { create } from 'zustand';
import type { PlanEditorMode, PlanContext, PlanFileInfo } from '@/types/plan-files';

interface PlanEditorState {
  /** Current mode of the editor */
  mode: PlanEditorMode;
  /** Currently active file path (project path) */
  activeFilePath: string | null;
  /** Currently active file name */
  activeFileName: string | null;
  /** File info for the active file */
  activeFileInfo: PlanFileInfo | null;
  /** Whether content is being streamed */
  isStreaming: boolean;
  /** Content being streamed (accumulates during streaming) */
  streamingContent: string;
  /** Current editor content */
  editorContent: string;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Last saved content (to compare for dirty state) */
  savedContent: string;
  /** When the content was last saved */
  lastSavedAt: Date | null;
  /** Loaded plan context for agent conversations */
  loadedPlanContext: PlanContext | null;
}

interface PlanEditorActions {
  /** Start streaming content to a new plan file */
  startStreaming: (fileName: string) => void;
  /** Append text during streaming */
  appendStreamContent: (text: string) => void;
  /** Stop streaming and finalize content */
  stopStreaming: () => void;
  /** Set the editor content (for manual edits) */
  setEditorContent: (content: string) => void;
  /** Mark content as saved */
  markSaved: (content: string) => void;
  /** Set the active file and load its content */
  setActiveFile: (path: string, fileName: string, content: string, fileInfo?: PlanFileInfo) => void;
  /** Clear the active file */
  clearActiveFile: () => void;
  /** Set the editor mode */
  setMode: (mode: PlanEditorMode) => void;
  /** Set loaded plan context for agent conversations */
  setLoadedPlanContext: (context: PlanContext | null) => void;
  /** Update loaded plan context content (when editing) */
  updateLoadedPlanContent: (content: string) => void;
  /** Clear loaded plan context */
  clearLoadedPlanContext: () => void;
  /** Reset the entire store */
  reset: () => void;
}

export type PlanEditorStore = PlanEditorState & PlanEditorActions;

const initialState: PlanEditorState = {
  mode: 'empty',
  activeFilePath: null,
  activeFileName: null,
  activeFileInfo: null,
  isStreaming: false,
  streamingContent: '',
  editorContent: '',
  isDirty: false,
  savedContent: '',
  lastSavedAt: null,
  loadedPlanContext: null,
};

export const usePlanEditorStore = create<PlanEditorStore>((set, get) => ({
  ...initialState,

  startStreaming: (fileName) => {
    set({
      mode: 'streaming',
      activeFileName: fileName,
      isStreaming: true,
      streamingContent: '',
      editorContent: '',
      isDirty: false,
      savedContent: '',
    });
  },

  appendStreamContent: (text) => {
    set((state) => ({
      streamingContent: state.streamingContent + text,
      editorContent: state.streamingContent + text,
    }));
  },

  stopStreaming: () => {
    const state = get();
    set({
      isStreaming: false,
      mode: state.editorContent ? 'editing' : 'empty',
      // Mark as dirty since it hasn't been saved yet
      isDirty: true,
    });
  },

  setEditorContent: (content) => {
    const state = get();
    set({
      editorContent: content,
      isDirty: content !== state.savedContent,
    });

    // Also update loaded plan context if one is active
    if (state.loadedPlanContext) {
      set((s) => ({
        loadedPlanContext: s.loadedPlanContext
          ? { ...s.loadedPlanContext, content }
          : null,
      }));
    }
  },

  markSaved: (content) => {
    set({
      savedContent: content,
      isDirty: false,
      lastSavedAt: new Date(),
    });
  },

  setActiveFile: (path, fileName, content, fileInfo) => {
    set({
      mode: 'viewing',
      activeFilePath: path,
      activeFileName: fileName,
      activeFileInfo: fileInfo || null,
      editorContent: content,
      savedContent: content,
      isDirty: false,
      isStreaming: false,
      streamingContent: '',
      // Set up plan context for agent conversations
      loadedPlanContext: {
        fileName,
        content,
        loadedAt: new Date(),
      },
    });
  },

  clearActiveFile: () => {
    set({
      mode: 'empty',
      activeFilePath: null,
      activeFileName: null,
      activeFileInfo: null,
      editorContent: '',
      savedContent: '',
      isDirty: false,
      isStreaming: false,
      streamingContent: '',
      loadedPlanContext: null,
    });
  },

  setMode: (mode) => {
    set({ mode });
  },

  setLoadedPlanContext: (context) => {
    set({ loadedPlanContext: context });
  },

  updateLoadedPlanContent: (content) => {
    set((state) => ({
      loadedPlanContext: state.loadedPlanContext
        ? { ...state.loadedPlanContext, content }
        : null,
    }));
  },

  clearLoadedPlanContext: () => {
    set({ loadedPlanContext: null });
  },

  reset: () => {
    set(initialState);
  },
}));
