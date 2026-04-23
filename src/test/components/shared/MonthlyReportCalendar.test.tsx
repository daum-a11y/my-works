import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MonthlyReportCalendar } from '../../../components/shared/MonthlyReportCalendar/MonthlyReportCalendar';
import type { CalendarCell } from '../../../components/shared/MonthlyReportCalendar/MonthlyReportCalendar.types';

function createCell(day: number, weekday: number): CalendarCell {
  return {
    day,
    date: `2026-04-${String(day).padStart(2, '0')}`,
    weekday,
  };
}

describe('MonthlyReportCalendar', () => {
  it('renders a caption for screen readers and marks today', () => {
    render(
      <MemoryRouter>
        <MonthlyReportCalendar
          weeks={[[createCell(7, 2), createCell(8, 3)]]}
          summary={new Map([[7, 480]])}
          currentMonth
          futureMonth={false}
          todayDay={7}
          caption="업무일지 작성 현황"
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('업무일지 작성 현황')).toBeInTheDocument();
    expect(screen.getByText('오늘')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders date links when a link resolver is provided', () => {
    render(
      <MemoryRouter>
        <MonthlyReportCalendar
          weeks={[[createCell(7, 2)]]}
          summary={new Map([[7, 600]])}
          currentMonth
          futureMonth={false}
          todayDay={7}
          getDateLink={(date) => ({ to: `/reports/${date}` })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: '7일' })).toHaveAttribute(
      'href',
      '/reports/2026-04-07',
    );
    expect(screen.getByText('+120분')).toBeInTheDocument();
  });
});
