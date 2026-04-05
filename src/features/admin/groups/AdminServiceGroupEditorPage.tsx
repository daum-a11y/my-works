import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminDataClient } from '../adminClient';
import type { AdminServiceGroupItem, AdminServiceGroupPayload } from '../admin-types';
import '../../../styles/domain/pages/projects-feature.scss';

function createDraft(item?: AdminServiceGroupItem): AdminServiceGroupPayload {
  if (!item) {
    return {
      name: '',
      svcGroup: '',
      svcName: '',
      costGroupId: '',
      svcActive: true,
      displayOrder: 0,
      isActive: true,
    };
  }

  return {
    id: item.id,
    name: item.name,
    svcGroup: item.svcGroup,
    svcName: item.svcName,
    costGroupId: item.costGroupId ?? '',
    svcActive: item.svcActive,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  };
}

function composeServiceName(serviceGroup: string, serviceName: string) {
  const normalizedGroup = serviceGroup.trim();
  const normalizedName = serviceName.trim();

  if (!normalizedGroup && !normalizedName) {
    return '';
  }
  if (!normalizedGroup) {
    return normalizedName;
  }
  if (!normalizedName) {
    return normalizedGroup;
  }
  return `${normalizedGroup} / ${normalizedName}`;
}

export function AdminServiceGroupEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { serviceGroupId } = useParams<{ serviceGroupId: string }>();
  const titleRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = Boolean(serviceGroupId);
  const [draft, setDraft] = useState<AdminServiceGroupPayload>(() => createDraft());

  const serviceGroupsQuery = useQuery({
    queryKey: ['admin', 'service-groups'],
    queryFn: () => adminDataClient.listServiceGroups(),
  });
  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });

  const serviceGroups = useMemo(() => serviceGroupsQuery.data ?? [], [serviceGroupsQuery.data]);
  const costGroups = useMemo(() => costGroupsQuery.data ?? [], [costGroupsQuery.data]);
  const selectedServiceGroup = useMemo(
    () => serviceGroups.find((item) => item.id === serviceGroupId) ?? null,
    [serviceGroupId, serviceGroups],
  );
  const usageQuery = useQuery({
    queryKey: ['admin', 'service-groups', 'usage', selectedServiceGroup?.id],
    enabled: Boolean(selectedServiceGroup),
    queryFn: () => adminDataClient.getServiceGroupUsageSummary(selectedServiceGroup!.id),
  });
  const nextDisplayOrder = useMemo(
    () => Math.max(0, ...serviceGroups.map((item) => item.displayOrder)) + 1,
    [serviceGroups],
  );

  useEffect(() => {
    if (!isEditMode) {
      setDraft({
        ...createDraft(),
        displayOrder: nextDisplayOrder,
      });
      return;
    }

    if (selectedServiceGroup) {
      setDraft(createDraft(selectedServiceGroup));
    }
  }, [isEditMode, nextDisplayOrder, selectedServiceGroup]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [serviceGroupId]);

  const saveMutation = useMutation({
    mutationFn: async (payload: AdminServiceGroupPayload) => {
      const svcGroup = payload.svcGroup.trim();
      const svcName = payload.svcName.trim();
      const svcActive = payload.svcActive;

      return adminDataClient.saveServiceGroupAdmin({
        ...payload,
        name: composeServiceName(svcGroup, svcName),
        svcGroup,
        svcName,
        costGroupId: payload.costGroupId.trim(),
        svcActive,
        isActive: svcActive,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      navigate('/org/group', {
        replace: true,
        state: {
          statusMessage: isEditMode ? '서비스그룹을 저장했습니다.' : '서비스그룹을 추가했습니다.',
        },
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!serviceGroupId) {
        throw new Error('삭제할 서비스그룹이 없습니다.');
      }

      await adminDataClient.deleteServiceGroupAdmin(serviceGroupId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'service-groups'] });
      navigate('/org/group', {
        replace: true,
        state: { statusMessage: '서비스그룹을 삭제했습니다.' },
      });
    },
  });

  const errorMessage =
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (usageQuery.error instanceof Error && usageQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    '';
  const projectUsageCount = usageQuery.data?.projectCount ?? 0;
  const deleteBlocked = isEditMode && projectUsageCount > 0;
  const deleteHelpText = deleteBlocked ? `사용 중인 프로젝트 ${projectUsageCount}건` : '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async () => {
    if (!selectedServiceGroup) {
      return;
    }

    if (!window.confirm('정말 삭제 하시겠습니까? 복구할 수 없습니다.')) {
      return;
    }

    await deleteMutation.mutateAsync();
  };

  if (serviceGroupsQuery.isLoading && isEditMode) {
    return (
      <section className="projectsFeatureScope shell editorShell">
        <p className={'statusMessage'}>불러오는 중...</p>
      </section>
    );
  }

  if (isEditMode && !selectedServiceGroup && !serviceGroupsQuery.isLoading) {
    return (
      <section className="projectsFeatureScope shell editorShell">
        <header className={'editorHeader'}>
          <h1 className={'title'}>서비스그룹 수정</h1>
        </header>
        <p className={'statusMessage'}>서비스그룹을 찾을 수 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="projectsFeatureScope shell editorShell">
      <header className={'editorHeader'}>
        <h1 className={'title'}>{isEditMode ? '서비스그룹 수정' : '서비스그룹 추가'}</h1>
      </header>

      {errorMessage ? <p className={'statusMessage'}>{errorMessage}</p> : null}

      <section className={`${'modal'} ${'editorSurface'}`} aria-label="서비스그룹 편집 패널">
        <form className={`${'detailForm'} ${'editorDetailForm'}`} onSubmit={handleSubmit}>
          <div className={'editorFormGrid'}>
            <label className={'field'}>
              <span>서비스그룹</span>
              <input
                ref={titleRef}
                value={draft.svcGroup}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, svcGroup: event.target.value }))
                }
              />
            </label>

            <label className={'field'}>
              <span>서비스명</span>
              <input
                value={draft.svcName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, svcName: event.target.value }))
                }
              />
            </label>

            <label className={'field'}>
              <span>청구그룹</span>
              <select
                value={draft.costGroupId}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, costGroupId: event.target.value }))
                }
              >
                <option value="">청구그룹 선택</option>
                {costGroups.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={'field'}>
              <span>노출여부</span>
              <select
                value={draft.svcActive ? '1' : '0'}
                onChange={(event) => {
                  const nextActive = event.target.value === '1';
                  setDraft((current) => ({
                    ...current,
                    svcActive: nextActive,
                    isActive: nextActive,
                  }));
                }}
              >
                <option value="1">노출</option>
                <option value="0">숨김</option>
              </select>
            </label>
          </div>

          <div className={`${'formActions'} ${'editorFormActions'}`}>
            <div className={'editorFormActionsStart'}>
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    className={'deleteButton'}
                    onClick={() => void handleDelete()}
                    disabled={deleteMutation.isPending || deleteBlocked}
                  >
                    삭제
                  </button>
                  {deleteHelpText ? <p className={'helpText'}>{deleteHelpText}</p> : null}
                </>
              ) : null}
            </div>
            <div className={'editorFormActionsEnd'}>
              <Link to="/org/group" className={'secondaryButton'}>
                취소
              </Link>
              <button
                type="submit"
                className={'primaryButton'}
                disabled={saveMutation.isPending || !draft.costGroupId}
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
