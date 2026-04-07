import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import { setDocumentTitle } from '../../../router/navigation';
import type { MemberFilterState } from './AdminMembersPage.types';
import { createInitialFilters, matchesMemberFilters } from './AdminMembersPage.utils';
import {
  ADMIN_MEMBERS_DEFAULT_PAGE_SIZE,
  ADMIN_MEMBERS_PAGE_TITLE,
} from './AdminMembersPage.constants';

export function useAdminMembersPage() {
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');
  const [filterDraft, setFilterDraft] = useState<MemberFilterState>(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilterState>(createInitialFilters);
  const [pageSize, setPageSize] = useState<number>(ADMIN_MEMBERS_DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });

  useEffect(() => {
    const nextMessage = (location.state as { statusMessage?: string } | null)?.statusMessage;

    if (nextMessage) {
      setStatusMessage(nextMessage);
    }
  }, [location.state]);

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMemberFilters(member, appliedFilters)),
    [appliedFilters, members],
  );
  const totalMembers = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalMembers / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedMembers = useMemo(() => {
    const from = (currentPageSafe - 1) * pageSize;
    return filteredMembers.slice(from, from + pageSize);
  }, [currentPageSafe, filteredMembers, pageSize]);
  const activeMemberCount = useMemo(
    () => members.filter((member) => member.userActive).length,
    [members],
  );

  useEffect(() => {
    setDocumentTitle(ADMIN_MEMBERS_PAGE_TITLE);
  }, []);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filterDraft);
    setCurrentPage(1);
  };

  const handleReset = () => {
    const initialFilters = createInitialFilters();
    setFilterDraft(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  return {
    activeMemberCount,
    errorMessage: (membersQuery.error instanceof Error && membersQuery.error.message) || '',
    filterDraft,
    handleReset,
    handleSearchSubmit,
    loading: membersQuery.isLoading,
    members,
    pagedMembers,
    pageSize,
    setCurrentPage,
    setFilterDraft,
    setPageSize,
    statusMessage,
    totalMembers,
    totalPages,
    currentPageSafe,
  };
}
