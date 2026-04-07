import { Link } from 'react-router-dom';

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
    <div className="projects-feature__form-actions projects-feature__editor-form-actions">
      <div
        className={
          'projects-feature__editor-form-actions projects-feature__editor-form-actions--start'
        }
      >
        {canDelete ? (
          <button type="button" className={'projects-feature__delete-button'} onClick={onDelete}>
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
          to="/projects"
          className={'projects-feature__button projects-feature__button--secondary'}
        >
          취소
        </Link>
        <button
          type="submit"
          className={'projects-feature__button projects-feature__button--primary'}
          disabled={saving}
        >
          저장
        </button>
      </div>
    </div>
  );
}
