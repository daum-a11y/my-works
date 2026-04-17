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
    <div className="action-area">
      <div className={'action-group is-start'}>
        {canDelete ? (
          <Button size="medium" type="button" variant="secondary" onClick={onDelete}>
            삭제
          </Button>
        ) : null}
      </div>
      <div className={'action-group is-end'}>
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
