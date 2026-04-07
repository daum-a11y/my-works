import { useState } from 'react';
import { getToday } from '../../utils';

export function useResourceFilters(defaultMemberId?: string) {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(getToday().slice(0, 7));
  const [selectedMemberId, setSelectedMemberId] = useState(defaultMemberId ?? '');

  return {
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedMemberId,
    setSelectedMemberId,
  };
}
