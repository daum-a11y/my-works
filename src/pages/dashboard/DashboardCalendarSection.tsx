import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Button } from 'krds-react';
import { EmptyState } from '../../components/shared/EmptyState';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';

interface DashboardMonthState {
  currentMonth: boolean;
  future: boolean;
  today: number;
  weeks: ReturnType<
    typeof import('../resource/resourceUtils').buildCalendarWeeks
  >;
  year: number;
  month: number;
  summary: Map<number, number>;
}

interface DashboardCalendarSectionProps {
  monthState: DashboardMonthState | null;
  onShiftMonth: (offset: number) => void;
  onResetMonth: () => void;
}

export function DashboardCalendarSection({
  monthState,
  onShiftMonth,
  onResetMonth
}: DashboardCalendarSectionProps) {
  return (
    <section
      id='dashboard-calendar'
      className='page-section dashboard-calendar-section'>
      {monthState && (
        <div className='section-head dashboard-calendar-head'>
          <div className='calendar-heading'>
            <span
              className='calendar-heading-icon'
              aria-hidden='true'>
              <CalendarDays
                size={20}
                strokeWidth={2.2}
              />
            </span>
            <div>
              <p className='calendar-kicker'>업무일지 달력</p>
              <h2
                className='calendar-title'
                aria-live='polite'>
                {monthState.year}년 {monthState.month}월
              </h2>
            </div>
          </div>
          <nav
            className='calendar-nav'
            aria-label='대시보드 업무일지 월 이동'>
            <div className='calendar-nav-group'>
              <Button
                size='medium'
                type='button'
                variant='tertiary'
                onClick={() => onShiftMonth(-1)}>
                <ChevronLeft
                  size={16}
                  strokeWidth={2.4}
                  aria-hidden='true'
                />
                <span className='sr-only'>이전달 보기</span>
              </Button>
              <Button
                size='medium'
                type='button'
                variant='secondary'
                disabled={monthState.currentMonth}
                onClick={onResetMonth}>
                <RotateCcw
                  size={16}
                  strokeWidth={2.2}
                  aria-hidden='true'
                />
                이번달
              </Button>
              <Button
                size='medium'
                type='button'
                variant='tertiary'
                onClick={() => onShiftMonth(1)}>
                <ChevronRight
                  size={16}
                  strokeWidth={2.4}
                  aria-hidden='true'
                />
                <span className='sr-only'>다음달 보기</span>
              </Button>
            </div>
          </nav>
        </div>
      )}
      {monthState ? (
        <MonthlyReportCalendar
          caption='업무일지 작성 현황'
          weeks={monthState.weeks}
          summary={monthState.summary}
          currentMonth={monthState.currentMonth}
          futureMonth={monthState.future}
          todayDay={monthState.today}
          padded={false}
          panel={false}
          getDateLink={date => ({
            to: '/reports',
            state: { reportDate: date }
          })}
        />
      ) : (
        <EmptyState message='사용자 정보를 확인할 수 없습니다.' />
      )}
    </section>
  );
}
