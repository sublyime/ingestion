const API_BASE = 'http://localhost:4000';

export interface SourceType {
  id: number;
  name: string;
  description?: string;
}

export interface ConnectionProperty {
  property_key: string;
  property_value: string;
}

export interface DataSource {
  id: number;
  name: string;
  source_type_id: number;
  is_active: boolean;
  connection_properties: ConnectionProperty[];
}

export async function fetchSourceTypes(): Promise<SourceType[]> {
  const response = await fetch(`${API_BASE}/source-types`);
  if (!response.ok) throw new Error('Failed to fetch source types');
  return response.json();
}

export async function fetchDataSources(): Promise<DataSource[]> {
  const response = await fetch(`${API_BASE}/data-sources`);
  if (!response.ok) throw new Error('Failed to fetch data sources');
  return response.json();
}
