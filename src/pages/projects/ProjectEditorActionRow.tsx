import { Button } from 'krds-react';
import { Link as RouterLink } from 'react-router-dom';

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
      <div className={'krds-page__editor-form-actions krds-page__editor-form-actions--start'}>
        {canDelete ? (
          <Button size="medium" type="button" variant="secondary" onClick={onDelete}>
            삭제
          </Button>
        ) : null}
      </div>
      <div className={'krds-page__editor-form-actions krds-page__editor-form-actions--end'}>
        <Button as={RouterLink} to="/projects" role="link">
          취소
        </Button>
        <Button size="medium" type="submit" variant="primary" disabled={saving}>
          저장
        </Button>
      </div>
    </div>
  );
}
