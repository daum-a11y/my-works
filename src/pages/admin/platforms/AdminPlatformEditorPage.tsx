import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../../../api/admin';
import { AdminPlatformEditorActionRow } from './AdminPlatformEditorActionRow';
import { AdminPlatformEditorForm } from './AdminPlatformEditorForm';
import type { AdminPlatformItem, AdminPlatformPayload } from '../admin.types';
import '../../../styles/domain/pages/projects-feature.scss';

function createDraft(item?: AdminPlatformItem): AdminPlatformPayload {
  if (!item) {
    return {
      name: '',
      displayOrder: 0,
      isVisible: true,
    };
  }

  return {
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isVisible: item.isVisible,
  };
}

export function AdminPlatformEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { platformId } = useParams<{ platformId: string }>();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(platformId);
  const [draft, setDraft] = useState<AdminPlatformPayload>(() => createDraft());

  const platformsQuery = useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: () => adminDataClient.listPlatforms(),
  });

  const platforms = useMemo(() => platformsQuery.data ?? [], [platformsQuery.data]);
  const selectedPlatform = useMemo(
    () => platforms.find((item) => item.id === platformId) ?? null,
    [platformId, platforms],
  );
  const nextDisplayOrder = useMemo(
    () => Math.max(0, ...platforms.map((item) => item.displayOrder)) + 1,
    [platforms],
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraft({ ...createDraft(), displayOrder: nextDisplayOrder });
      return;
    }
    if (selectedPlatform) {
      setDraft(createDraft(selectedPlatform));
    }
  }, [isEditMode, nextDisplayOrder, selectedPlatform]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [platformId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminPlatformPayload) =>
      adminDataClient.savePlatformAdmin({ ...payload, name: payload.name.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      navigate('/admin/platform', {
        replace: true,
        state: { statusMessage: isEditMode ? '플랫폼을 저장했습니다.' : '플랫폼을 추가했습니다.' },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!platformId) throw new Error('삭제할 플랫폼이 없습니다.');
      await adminDataClient.deletePlatformAdmin(platformId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'platforms'] });
      navigate('/admin/platform', {
        replace: true,
        state: { statusMessage: '플랫폼을 삭제했습니다.' },
      });
    },
  });

  const errorMessage =
    (platformsQuery.error instanceof Error && platformsQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!selectedPlatform) return;
    if (!window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')) return;
    await deleteMutation.mutateAsync();
  };

  if (platformsQuery.isLoading && isEditMode) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <p className={'projects-feature__status-message'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedPlatform && !platformsQuery.isLoading) {
    return (
      <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
        <header className={'projects-feature__editor-header'}>
          <h1 className={'projects-feature__title'}>플랫폼 수정</h1>
        </header>
        <p className={'projects-feature__status-message'}>플랫폼을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projects-feature projects-feature__shell projects-feature__editor-shell">
      <header className={'projects-feature__editor-header'}>
        <h1 className={'projects-feature__title'}>{isEditMode ? '플랫폼 수정' : '플랫폼 추가'}</h1>
      </header>
      {errorMessage ? <p className={'projects-feature__status-message'}>{errorMessage}</p> : null}
      <section
        className="projects-feature__modal projects-feature__editor-surface"
        aria-label="플랫폼 편집 패널"
      >
        <form
          className="projects-feature__detail-form projects-feature__editor-detail-form"
          onSubmit={handleSubmit}
        >
          <AdminPlatformEditorForm
            draft={draft}
            titleRef={titleRef}
            onDraftChange={(patch) =>
              setDraft((current) => ({
                ...current,
                ...patch,
              }))
            }
          />
          <AdminPlatformEditorActionRow
            isEditMode={isEditMode}
            deletePending={deleteMutation.isPending}
            savePending={saveMutation.isPending}
            onDelete={() => void handleDelete()}
          />
        </form>
      </section>
    </section>
  );
}
