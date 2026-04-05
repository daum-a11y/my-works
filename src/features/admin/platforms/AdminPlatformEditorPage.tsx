import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../adminClient';
import type { AdminPlatformItem, AdminPlatformPayload } from '../admin-types';
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
      navigate('/org/platform', {
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
      navigate('/org/platform', {
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
          <div className={'projects-feature__editor-form-grid'}>
            <label className={'projects-feature__field'}>
              <span>플랫폼명</span>
              <input
                ref={titleRef}
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className={'projects-feature__field'}>
              <span>노출여부</span>
              <select
                value={draft.isVisible ? '1' : '0'}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, isVisible: event.target.value === '1' }))
                }
              >
                <option value="1">노출</option>
                <option value="0">미노출</option>
              </select>
            </label>
          </div>
          <div className="projects-feature__form-actions projects-feature__editor-form-actions">
            <div
              className={
                'projects-feature__editor-form-actions projects-feature__editor-form-actions--start'
              }
            >
              {isEditMode ? (
                <button
                  type="button"
                  className={'projects-feature__delete-button'}
                  onClick={() => void handleDelete()}
                  disabled={deleteMutation.isPending}
                >
                  삭제
                </button>
              ) : null}
            </div>
            <div
              className={
                'projects-feature__editor-form-actions projects-feature__editor-form-actions--end'
              }
            >
              <Link
                to="/org/platform"
                className={'projects-feature__button projects-feature__button--secondary'}
              >
                취소
              </Link>
              <button
                type="submit"
                className={'projects-feature__button projects-feature__button--primary'}
                disabled={saveMutation.isPending}
              >
                저장
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
}
