import type { AdminTaskSearchFilters } from './admin.types';

export function buildAdminTaskSearchUrl(filters: Partial<AdminTaskSearchFilters>) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `/org/search?${query}` : '/org/search';
}

export function openAdminTaskSearch(filters: Partial<AdminTaskSearchFilters>) {
  window.open(buildAdminTaskSearchUrl(filters), '_blank', 'noopener,noreferrer');
}
