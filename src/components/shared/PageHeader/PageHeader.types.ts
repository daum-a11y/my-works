import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { PAGE_HEADER_ALIGNS } from './PageHeader.constants';

export type PageHeaderAlign = (typeof PAGE_HEADER_ALIGNS)[number];

export interface PageHeaderProps extends ComponentPropsWithoutRef<'header'> {
  title: string;
  kicker?: string;
  description?: ReactNode;
  actions?: ReactNode;
  align?: PageHeaderAlign;
}
