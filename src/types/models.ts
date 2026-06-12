export interface Song {
  id: number;
  name: string;
  bpm: number | null;
  norte: string | null;
  ref_instrumental: string | null;
  ref_vocal: string | null;
  concept_word: string | null;
  concept_phrase: string | null;
  created_at: number;
  updated_at: number;
}

export interface ScheduleProgress {
  song_id: number;
  phase_id: string;
  completed: boolean;
  completed_at: number | null;
}

export interface PhaseNote {
  id: number;
  song_id: number;
  phase_id: string;
  text: string;
  created_at: number;
}

export type AttachmentKind = 'link' | 'file';

export interface Attachment {
  id: number;
  song_id: number;
  kind: AttachmentKind;
  label: string;
  url: string | null;
  mime: string | null;
  size: number | null;
  created_at: number;
}

export interface WorkSession {
  id: number;
  song_id: number;
  started_at: number;
  ended_at: number | null;
}

export interface ScheduleTemplateRow {
  id: string;
  tiempo: string;
  fase: string;
  actividad: string;
  quien: string;
  entregableParcial: string;
}

export interface RuleRow {
  regla: string;
  detalle: string;
}

export interface DeliverableRow {
  entregable: string;
  estadoEsperado: string;
}
