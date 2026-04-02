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
  presentationMode: 'scene-owned';
  placement: {
    mode: 'freeform';
    x: number;
    z: number;
    rotationY: number;
    yOffset: number;
  };
}

export function createWorkbenchTemplate(input: NewWorkbenchTemplateInput): NewWorkbenchTemplate;
export function renderWorkbenchEntry(entry: unknown): string;
export function insertWorkbenchIntoLayoutSource(source: string, entryBlock: string): string;
