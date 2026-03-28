import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageSection } from "../../components/ui/PageSection";
import {
  buildProjectMaps,
  buildTaskTypeRequirementMap,
  countWorkingDays,
  countWorkingDaysUntil,
  filterTasksByMonth,
  formatMd,
  formatMm,
  getCurrentMonth,
  getTaskServiceInfo,
  isServiceTask,
  shiftMonth,
  useResourceDataset,
} from "./resource-shared";
import styles from "./ResourcePage.module.css";

interface TypeRow {
  type1: string;
  totalMinutes: number;
  requiresServiceGroup: boolean;
  items: Array<{
    type2: string;
    minutes: number;
    requiresServiceGroup: boolean;
  }>;
}

interface ServiceSummaryRow {
  group: string;
  totalMinutes: number;
  names: Array<{
    name: string;
    minutes: number;
  }>;
}

interface ServiceDetailRow {
  group: string;
  totalMinutes: number;
  names: Array<{
    name: string;
    items: Array<{
      type1: string;
      minutes: number;
    }>;
  }>;
}

function parseMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

export function ResourceMonthPage() {
  const { type } = useParams();
  const selectedMonth = type && /^\d{4}-\d{2}$/.test(type) ? type : getCurrentMonth();
  const query = useResourceDataset();
  const data = query.data;
  const [workFold, setWorkFold] = useState(false);
  const [svcFold, setSvcFold] = useState(false);

  useEffect(() => {
    document.title = "월간 투입리소스 | My Works";
  }, []);

  const monthTasks = useMemo(() => filterTasksByMonth(data?.tasks ?? [], selectedMonth), [data?.tasks, selectedMonth]);
  const requirementMap = useMemo(() => buildTaskTypeRequirementMap(data?.taskTypes ?? []), [data?.taskTypes]);
  const { projectsById, serviceGroupsById } = useMemo(
    () => buildProjectMaps(data?.projects ?? [], data?.serviceGroups ?? []),
    [data?.projects, data?.serviceGroups],
  );

  const typeRows = useMemo<TypeRow[]>(() => {
    const grouped = new Map<string, Map<string, { minutes: number; requiresServiceGroup: boolean }>>();

    for (const task of monthTasks) {
      const type1 = task.taskType1 || "미분류";
      const type2 = task.taskType2 || "미분류";
      const requiresServiceGroup = isServiceTask(task, requirementMap);
      const items = grouped.get(type1) ?? new Map<string, { minutes: number; requiresServiceGroup: boolean }>();
      const current = items.get(type2) ?? { minutes: 0, requiresServiceGroup };
      current.minutes += Math.round(task.hours);
      current.requiresServiceGroup = current.requiresServiceGroup || requiresServiceGroup;
      items.set(type2, current);
      grouped.set(type1, items);
    }

    return Array.from(grouped.entries())
      .map(([type1, items]) => {
        const rows = Array.from(items.entries())
          .map(([type2, item]) => ({
            type2,
            minutes: item.minutes,
            requiresServiceGroup: item.requiresServiceGroup,
          }))
          .sort(
            (left, right) =>
              Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) || left.type2.localeCompare(right.type2),
          );

        return {
          type1,
          totalMinutes: rows.reduce((sum, item) => sum + item.minutes, 0),
          requiresServiceGroup: rows.some((item) => item.requiresServiceGroup),
          items: rows,
        };
      })
      .sort(
        (left, right) =>
          Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) || left.type1.localeCompare(right.type1),
      );
  }, [monthTasks, requirementMap]);

  const serviceSummaryRows = useMemo<ServiceSummaryRow[]>(() => {
    const grouped = new Map<string, Map<string, number>>();

    for (const task of monthTasks) {
      if (!isServiceTask(task, requirementMap)) {
        continue;
      }

      const info = getTaskServiceInfo(task, projectsById, serviceGroupsById);
      const names = grouped.get(info.group) ?? new Map<string, number>();
      names.set(info.name, (names.get(info.name) ?? 0) + Math.round(task.hours));
      grouped.set(info.group, names);
    }

    return Array.from(grouped.entries())
      .map(([group, names]) => ({
        group,
        totalMinutes: Array.from(names.values()).reduce((sum, value) => sum + value, 0),
        names: Array.from(names.entries())
          .map(([name, minutes]) => ({ name, minutes }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => left.group.localeCompare(right.group));
  }, [monthTasks, projectsById, requirementMap, serviceGroupsById]);

  const serviceDetailRows = useMemo<ServiceDetailRow[]>(() => {
    const grouped = new Map<string, Map<string, Map<string, number>>>();

    for (const task of monthTasks) {
      if (!isServiceTask(task, requirementMap)) {
        continue;
      }

      const info = getTaskServiceInfo(task, projectsById, serviceGroupsById);
      const names = grouped.get(info.group) ?? new Map<string, Map<string, number>>();
      const typeMap = names.get(info.name) ?? new Map<string, number>();
      const type1 = task.taskType1 || "미분류";
      typeMap.set(type1, (typeMap.get(type1) ?? 0) + Math.round(task.hours));
      names.set(info.name, typeMap);
      grouped.set(info.group, names);
    }

    return Array.from(grouped.entries())
      .map(([group, names]) => ({
        group,
        totalMinutes: Array.from(names.values())
          .flatMap((items) => Array.from(items.values()))
          .reduce((sum, value) => sum + value, 0),
        names: Array.from(names.entries())
          .map(([name, items]) => ({
            name,
            items: Array.from(items.entries())
              .map(([type1, minutes]) => ({ type1, minutes }))
              .sort((left, right) => left.type1.localeCompare(right.type1)),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      }))
      .sort((left, right) => left.group.localeCompare(right.group));
  }, [monthTasks, projectsById, requirementMap, serviceGroupsById]);

  const memberTotals = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.members
      .map((member) => ({
        id: member.id,
        legacyUserId: member.legacyUserId,
        totalMinutes: monthTasks
          .filter((task) => task.memberId === member.id)
          .reduce((sum, task) => sum + Math.round(task.hours), 0),
      }))
      .filter((member) => member.totalMinutes > 0);
  }, [data, monthTasks]);

  const totalMinutes = typeRows.reduce((sum, row) => sum + row.totalMinutes, 0);
  const unpaidLeaveMinutes =
    typeRows.find((row) => row.type1 === "휴무")?.items.find((item) => item.type2 === "무급휴가")?.minutes ?? 0;
  const holidayMinutes = Math.max(0, (typeRows.find((row) => row.type1 === "휴무")?.totalMinutes ?? 0) - unpaidLeaveMinutes);
  const bufferMinutes = typeRows.find((row) => row.type1 === "기타버퍼")?.totalMinutes ?? 0;
  const adjustedTotalMinutes = totalMinutes - unpaidLeaveMinutes;
  const projectMinutes = serviceSummaryRows.reduce((sum, row) => sum + row.totalMinutes, 0);
  const nonProjectMinutes = Math.max(0, adjustedTotalMinutes - holidayMinutes - bufferMinutes - projectMinutes);
  const unpaidRows = typeRows
    .filter((row) => !row.requiresServiceGroup)
    .map((row) => ({
      type1: row.type1,
      totalMinutes: row.type1 === "휴무" ? Math.max(0, row.totalMinutes - unpaidLeaveMinutes) : row.totalMinutes,
    }))
    .filter((row) => row.totalMinutes > 0);

  const { year, month } = parseMonth(selectedMonth);
  const beforeMonth = shiftMonth(selectedMonth, -1);
  const afterMonth = shiftMonth(selectedMonth, 1);
  const isCurrentMonth = selectedMonth === getCurrentMonth();
  const workingDays = countWorkingDays(selectedMonth);
  const monthWorkingDays = countWorkingDaysUntil(selectedMonth, new Date().getDate());
  const expectedMinutes = (isCurrentMonth ? monthWorkingDays : workingDays) * 480;

  return (
    <div className={styles.page}>
      <div className={styles.monthNav}>
        <div className={styles.monthNavSide}>
          <Link className={styles.monthNavButton} to={`/resource/month/${beforeMonth}`}>
            {beforeMonth.replace("-", "/")}
          </Link>
        </div>
        <div className={styles.monthNavCenter}>
          <h3>
            {year}/{month}
          </h3>
        </div>
        <div className={`${styles.monthNavSide} ${styles.monthNavSideRight}`}>
          <Link className={styles.monthNavButton} to={`/resource/month/${afterMonth}`}>
            {afterMonth.replace("-", "/")}
          </Link>
        </div>
      </div>

      {query.isPending ? (
        <div className={styles.empty}>로딩중</div>
      ) : (
        <>
          <div className={styles.badgeRow}>
            <span className={`${styles.infoBadge} ${styles.infoBadgeAccent}`}>WD {workingDays}일</span>
            <span className={styles.infoBadge}>총 {formatMm(adjustedTotalMinutes, workingDays)} MM</span>
            <span className={styles.infoBadge}>휴무 제외 {formatMm(adjustedTotalMinutes - holidayMinutes, workingDays)} MM</span>
            {unpaidLeaveMinutes > 0 ? <span className={styles.infoBadge}>무급휴가 {formatMm(unpaidLeaveMinutes, workingDays)} MM</span> : null}
          </div>

          <div className={styles.progressBar}>
            {adjustedTotalMinutes > 0 ? (
              <>
                <div
                  className={`${styles.progressSegment} ${styles.progressHoliday}`}
                  style={{ width: `${Math.ceil((holidayMinutes / adjustedTotalMinutes) * 100)}%` }}
                  title={`휴가/휴무 ${formatMm(holidayMinutes, workingDays)}MM`}
                >
                  휴가/휴무
                  <br />
                  {formatMm(holidayMinutes, workingDays)} MM
                </div>
                <div
                  className={`${styles.progressSegment} ${styles.progressProject}`}
                  style={{ width: `${Math.ceil((projectMinutes / adjustedTotalMinutes) * 100)}%` }}
                  title={`프로젝트 ${formatMm(projectMinutes, workingDays)}MM`}
                >
                  프로젝트
                  <br />
                  {formatMm(projectMinutes, workingDays)} MM
                </div>
                <div
                  className={`${styles.progressSegment} ${styles.progressNormal}`}
                  style={{ width: `${Math.ceil((nonProjectMinutes / adjustedTotalMinutes) * 100)}%` }}
                  title={`일반 (비프로젝트) ${formatMm(nonProjectMinutes, workingDays)}MM`}
                >
                  일반 (비프로젝트)
                  <br />
                  {formatMm(nonProjectMinutes, workingDays)} MM
                </div>
                <div
                  className={`${styles.progressSegment} ${styles.progressBuffer}`}
                  style={{ width: `${Math.ceil((bufferMinutes / adjustedTotalMinutes) * 100)}%` }}
                  title={`기타버퍼 ${formatMm(bufferMinutes, workingDays)}MM`}
                >
                  기타버퍼
                  <br />
                  {formatMm(bufferMinutes, workingDays)} MM
                </div>
              </>
            ) : null}
          </div>

          <div className={styles.badgeRow}>
            {memberTotals.map((member) => {
              const diffMinutes = member.totalMinutes - expectedMinutes;
              const className =
                diffMinutes < 0
                  ? styles.memberBadgeDanger
                  : diffMinutes > 0
                    ? styles.memberBadgeWarning
                    : styles.memberBadgeSuccess;

              return (
                <span key={member.id} className={`${styles.memberBadge} ${className}`}>
                  {member.legacyUserId}
                  {diffMinutes > 0 ? `  +${diffMinutes}분` : diffMinutes === 0 ? "" : `  ${diffMinutes}분`}
                </span>
              );
            })}
          </div>

          <div className={styles.splitGrid}>
            <PageSection
              title="업무타입별 월간 리소스"
              actions={
                <button type="button" onClick={() => setWorkFold((current) => !current)} disabled={!typeRows.length}>
                  {workFold ? "펼치기" : "접기"}
                </button>
              }
            >
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>type 1</th>
                      <th>type 2</th>
                      <th>총 시간 (분)</th>
                      <th>총 일 (d)</th>
                      <th>M/M</th>
                    </tr>
                  </thead>
                  <tfoot>
                    <tr className={styles.sumRow}>
                      <th colSpan={2}>합계</th>
                      <td className={styles.numberCell}>{totalMinutes}</td>
                      <td className={styles.numberCell}>{formatMd(totalMinutes)}</td>
                      <td className={styles.numberCell}>{formatMm(totalMinutes, workingDays)}</td>
                    </tr>
                  </tfoot>
                  <tbody>
                    {typeRows.map((row) => (
                      <Fragment key={row.type1}>
                        <tr className={row.requiresServiceGroup ? undefined : styles.lightGrayRow}>
                          <th rowSpan={workFold ? 1 : row.items.length + 1}>{row.type1}</th>
                          <th>합계</th>
                          <td className={styles.numberCell}>{row.totalMinutes}</td>
                          <td className={styles.numberCell}>{formatMd(row.totalMinutes)}</td>
                          <td className={styles.numberCell}>{formatMm(row.totalMinutes, workingDays)}</td>
                        </tr>
                        {!workFold
                          ? row.items.map((item) => (
                              <tr key={`${row.type1}-${item.type2}`} className={item.requiresServiceGroup ? undefined : styles.lightGrayRow}>
                                <th>{item.type2}</th>
                                <td className={styles.numberCell}>{item.minutes}</td>
                                <td className={styles.numberCell}>{formatMd(item.minutes)}</td>
                                <td className={styles.numberCell}>{formatMm(item.minutes, workingDays)}</td>
                              </tr>
                            ))
                          : null}
                      </Fragment>
                    ))}
                    {!typeRows.length ? (
                      <tr>
                        <td colSpan={5} className={styles.empty}>
                          데이터 없음
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </PageSection>

            <PageSection
              title="서비스그룹별 월간 리소스"
              actions={
                <button type="button" onClick={() => setSvcFold((current) => !current)} disabled={!serviceDetailRows.length}>
                  {svcFold ? "펼치기" : "접기"}
                </button>
              }
            >
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>서비스그룹</th>
                      <th>서비스명</th>
                      <th>type1</th>
                      <th>총 시간 (분)</th>
                      <th>총 일 (d)</th>
                      <th>M/M</th>
                    </tr>
                  </thead>
                  <tfoot>
                    <tr className={styles.sumRow}>
                      <th colSpan={3}>합계</th>
                      <td className={styles.numberCell}>{projectMinutes}</td>
                      <td className={styles.numberCell}>{formatMd(projectMinutes)}</td>
                      <td className={styles.numberCell}>{formatMm(projectMinutes, workingDays)}</td>
                    </tr>
                  </tfoot>
                  <tbody>
                    {serviceDetailRows.map((group) => {
                      const detailLength = group.names.reduce((sum, name) => sum + name.items.length, 0);

                      return (
                        <Fragment key={group.group}>
                          <tr>
                            <th rowSpan={svcFold ? 1 : detailLength + 1}>{group.group}</th>
                            <th colSpan={2}>합계</th>
                            <td className={styles.numberCell}>{group.totalMinutes}</td>
                            <td className={styles.numberCell}>{formatMd(group.totalMinutes)}</td>
                            <td className={styles.numberCell}>{formatMm(group.totalMinutes, workingDays)}</td>
                          </tr>
                          {!svcFold
                            ? group.names.map((name) =>
                                name.items.map((item, index) => (
                                  <tr key={`${group.group}-${name.name}-${item.type1}`}>
                                    {index === 0 ? <th rowSpan={name.items.length}>{name.name}</th> : null}
                                    <th>{item.type1}</th>
                                    <td className={styles.numberCell}>{item.minutes}</td>
                                    <td className={styles.numberCell}>{formatMd(item.minutes)}</td>
                                    <td className={styles.numberCell}>{formatMm(item.minutes, workingDays)}</td>
                                  </tr>
                                )),
                              )
                            : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </PageSection>
          </div>

          <PageSection title="월간 리소스 보고서양식">
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>type1</th>
                    <th>type2</th>
                    <th>M/M</th>
                  </tr>
                </thead>
                <tfoot>
                  <tr className={styles.sumRow}>
                    <th colSpan={2}>합계</th>
                    <td className={styles.numberCell}>{formatMm(adjustedTotalMinutes, workingDays)}</td>
                  </tr>
                </tfoot>
                <tbody>
                  {serviceSummaryRows.map((group) => (
                    <Fragment key={group.group}>
                      <tr>
                        <th rowSpan={group.names.length + 1}>{group.group}</th>
                        <th>합계</th>
                        <td className={styles.numberCell}>{formatMm(group.totalMinutes, workingDays)}</td>
                      </tr>
                      {group.names.map((name) => (
                        <tr key={`${group.group}-${name.name}`} className={styles.summaryStrongRow}>
                          <th>{name.name}</th>
                          <td className={styles.numberCell}>{formatMm(name.minutes, workingDays)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  {unpaidRows.map((row) => (
                    <tr key={row.type1} className={styles.summaryStrongRow}>
                      <th colSpan={2}>{row.type1}</th>
                      <td className={styles.numberCell}>{formatMm(row.totalMinutes, workingDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PageSection>
        </>
      )}
    </div>
  );
}
