export interface ResourceFieldDefinition {
  id: number;
  field_name: string;
  field_type: 'image' | 'text' | 'number' | 'document' | 'phone' | 'date';
  is_required: boolean;
  order: number;
  help_text: string;
  max_file_size_mb?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  allowed_extensions?: string[];
}

export interface DynamicResourceSubmission {
  field_definition: number;
  text_value?: string;
  number_value?: number;
  file_value?: File;
}
