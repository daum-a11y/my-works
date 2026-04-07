import type { FormEvent } from 'react';
import type { ProjectPage } from '../../types/domain';
import type { PageFormState } from './ProjectEditorPage.types';

interface ProjectEditorPagesSectionProps {
  pageAddOpen: boolean;
  newPageDraft: PageFormState | null;
  selectedProjectPages: ProjectPage[];
  pageDrafts: Record<string, PageFormState>;
  canDeletePage: (page: ProjectPage) => boolean;
  onToggleAdd: () => void;
  onNewPageDraftChange: (patch: Partial<PageFormState>) => void;
  onAddSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPageDraftChange: (pageId: string, patch: Partial<PageFormState>) => void;
  onPageSave: (pageId: string) => void;
  onPageDelete: (page: ProjectPage) => void;
  savePending: boolean;
  toPageDraft: (page: ProjectPage) => PageFormState;
}

export function ProjectEditorPagesSection({
  pageAddOpen,
  newPageDraft,
  selectedProjectPages,
  pageDrafts,
  canDeletePage,
  onToggleAdd,
  onNewPageDraftChange,
  onAddSubmit,
  onPageDraftChange,
  onPageSave,
  onPageDelete,
  savePending,
  toPageDraft,
}: ProjectEditorPagesSectionProps) {
  return (
    <section className={'projects-feature__page-section'}>
      <div className={'projects-feature__section-header'}>
        <h2 className={'projects-feature__section-title'}>페이지 목록</h2>
        <button
          type="button"
          className={'projects-feature__button projects-feature__button--secondary'}
          onClick={onToggleAdd}
        >
          페이지 추가
        </button>
      </div>

      {pageAddOpen && newPageDraft ? (
        <form className={'projects-feature__page-form-panel'} onSubmit={onAddSubmit}>
          <div className={'projects-feature__page-form-grid'}>
            <label className={'projects-feature__field'}>
              <span className={'sr-only'}>페이지명</span>
              <input
                value={newPageDraft.title}
                placeholder="페이지명"
                onChange={(event) => onNewPageDraftChange({ title: event.target.value })}
              />
            </label>
            <label className={'projects-feature__field'}>
              <span className={'sr-only'}>페이지URL</span>
              <input
                value={newPageDraft.url}
                placeholder="페이지URL"
                onChange={(event) => onNewPageDraftChange({ url: event.target.value })}
              />
            </label>
          </div>
          <div className="projects-feature__form-actions projects-feature__page-table-actions">
            <button
              type="submit"
              className={'projects-feature__button projects-feature__button--primary'}
              disabled={savePending}
            >
              추가
            </button>
          </div>
        </form>
      ) : null}

      {selectedProjectPages.length ? (
        <div className={'projects-feature__page-table-wrap'}>
          <table className={'projects-feature__page-table'}>
            <caption className={'sr-only'}>페이지 리스트</caption>
            <thead>
              <tr>
                <th scope="col">페이지명</th>
                <th scope="col">페이지URL</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {selectedProjectPages.map((page) => {
                const draft = pageDrafts[page.id] ?? toPageDraft(page);

                return (
                  <tr key={page.id}>
                    <td>
                      <label className={'sr-only'} htmlFor={`page-title-${page.id}`}>
                        페이지명
                      </label>
                      <input
                        id={`page-title-${page.id}`}
                        value={draft.title}
                        placeholder="페이지명"
                        onChange={(event) =>
                          onPageDraftChange(page.id, { title: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <label className={'sr-only'} htmlFor={`page-url-${page.id}`}>
                        페이지URL
                      </label>
                      <input
                        id={`page-url-${page.id}`}
                        value={draft.url}
                        placeholder="페이지URL"
                        onChange={(event) =>
                          onPageDraftChange(page.id, { url: event.target.value })
                        }
                      />
                    </td>
                    <td>
                      <div className={'projects-feature__page-table-actions'}>
                        <button
                          type="button"
                          className={'projects-feature__button projects-feature__button--secondary'}
                          onClick={() => onPageSave(page.id)}
                        >
                          수정
                        </button>
                        {canDeletePage(page) ? (
                          <button
                            type="button"
                            className={'projects-feature__delete-button'}
                            onClick={() => onPageDelete(page)}
                          >
                            삭제
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={'projects-feature__empty-state'}>등록된 페이지가 없습니다.</div>
      )}
    </section>
  );
}
