import { getToday, parseLocalDateInput, toLocalDateInputValue } from '../../utils';
import type { ProjectFilterState } from './ProjectsPage.types';

export function createInitialProjectFilters(): ProjectFilterState {
  const endDate = getToday();
  const end = parseLocalDateInput(endDate) ?? new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);

  return {
    startDate: toLocalDateInputValue(start),
    endDate,
  };
}
