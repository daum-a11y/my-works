import type { ReportDraft } from '../../reports/reportUtils';

interface AdminReportEditorTypeFieldsProps {
  draft: ReportDraft;
  isProjectLinkedTab: boolean;
  projectTypeSelected: boolean;
  type1Value: string;
  reportTabType1Options: string[];
  type1Options: string[];
  type2Options: string[];
  type2Placeholder: string;
  onType1Change: (value: string) => void;
  onType2Change: (value: string) => void;
}

export function AdminReportEditorTypeFields({
  draft,
  isProjectLinkedTab,
  projectTypeSelected,
  type1Value,
  reportTabType1Options,
  type1Options,
  type2Options,
  type2Placeholder,
  onType1Change,
  onType2Change,
}: AdminReportEditorTypeFieldsProps) {
  return (
    <>
      {projectTypeSelected ? (
        <label className={'reports-page__field'}>
          <span>타입1</span>
          <input value={type1Value} readOnly />
        </label>
      ) : (
        <label className={'reports-page__field'}>
          <span>타입1</span>
          <select value={draft.type1} onChange={(event) => onType1Change(event.target.value)}>
            <option value="">{isProjectLinkedTab ? '선택해주세요' : 'type1'}</option>
            {(isProjectLinkedTab ? reportTabType1Options : type1Options).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={'reports-page__field'}>
        <span>타입2</span>
        <select value={draft.type2} onChange={(event) => onType2Change(event.target.value)}>
          {type2Placeholder ? <option value="">{type2Placeholder}</option> : null}
          {type2Options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
