import { Button } from 'krds-react';
import { KrdsRouterButtonLink } from '../../components/shared';

interface ProjectEditorActionRowProps {
  canDelete: boolean;
  saving: boolean;
  onDelete: () => void;
}

export function ProjectEditorActionRow({
  canDelete,
  saving,
  onDelete,
}: ProjectEditorActionRowProps) {
  return (
    <div className="krds-page__form-actions krds-page__editor-form-actions">
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--start'
        }
      >
        {canDelete ? (
          <Button type="button" variant="secondary" onClick={onDelete}>
            삭제
          </Button>
        ) : null}
      </div>
      <div
        className={
          'krds-page__editor-form-actions krds-page__editor-form-actions--end'
        }
      >
        <KrdsRouterButtonLink to="/projects">
          취소
        </KrdsRouterButtonLink>
        <Button
          type="submit"
          variant="primary"
          disabled={saving}
        >
          저장
        </Button>
      </div>
    </div>
  );
}
