declare module '../../scripts/new-workbench.shared.mjs' {
  export function createWorkbenchTemplate(input: {
    id: string;
    title: string;
    district: 'work-experience' | 'projects' | 'personal-life' | 'clubs' | 'extracurriculars';
    category?: string;
    draftNotes?: string;
  }): {
    id: string;
    title: string;
    visibility: 'draft';
    contentMode: 'placeholder';
    placement: { mode: 'corridor'; corridorId: string };
  };
  export function renderWorkbenchEntry(entry: unknown): string;
  export function insertWorkbenchIntoLayoutSource(source: string, entryBlock: string): string;
}
