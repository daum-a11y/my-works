import { StructuredList } from 'krds-react';
import type { ReactNode } from 'react';

export interface KrdsStructuredInfoItem {
  label: ReactNode;
  value: ReactNode;
}

export interface KrdsStructuredInfoListProps {
  items: KrdsStructuredInfoItem[];
  className?: string;
}

export function KrdsStructuredInfoList({ items, className }: KrdsStructuredInfoListProps) {
  return (
    <StructuredList className={className ? `${className} sm` : 'sm'}>
      {items.map((item, index) => (
        <li key={`${String(item.label)}-${index}`} className="structured-item">
          <div className="in">
            <div className="card-body">
              <div className="c-text">
                <strong className="c-tit">{item.label}</strong>
                <span className="c-txt">{item.value}</span>
              </div>
            </div>
          </div>
        </li>
      ))}
    </StructuredList>
  );
}
