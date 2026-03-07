export interface NewWorkbenchTemplateInput {
  id: string;
  title: string;
  district: 'work-experience' | 'projects' | 'personal-life' | 'clubs' | 'extracurriculars';
  category?: string;
  draftNotes?: string;
}

export interface NewWorkbenchTemplate {
  id: string;
  title: string;
  visibility: 'draft';
  contentMode: 'placeholder';
  placement: {
    mode: 'corridor';
    corridorId: string;
  };
}

export function createWorkbenchTemplate(input: NewWorkbenchTemplateInput): NewWorkbenchTemplate;
export function renderWorkbenchEntry(entry: unknown): string;
export function insertWorkbenchIntoLayoutSource(source: string, entryBlock: string): string;
