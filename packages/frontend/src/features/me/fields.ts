import type { ChangeEvent } from 'react';
import type { MeField } from './validation';

/** What one form field needs from ProfileForm: spread onto Input, PasswordInput or Textarea. */
export interface FieldBinding {
  name: MeField;
  value: string;
  error: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: () => void;
}

/** ProfileForm's binder: the sections ask it for each field they render. */
export type BindField = (field: MeField) => FieldBinding;
