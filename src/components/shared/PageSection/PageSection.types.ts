import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { PAGE_SECTION_VARIANTS } from './PageSection.constants';

export type PageSectionVariant = (typeof PAGE_SECTION_VARIANTS)[number];

export interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  title: string;
  actions?: ReactNode;
  variant?: PageSectionVariant;
}
