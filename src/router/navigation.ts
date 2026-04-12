import {
  BriefcaseBusiness,
  Database,
  FileText,
  FolderCode,
  Layers,
  LayoutDashboard,
  Search,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export interface NavigationLeafItem {
  to: string;
  label: string;
  icon?: LucideIcon;
}

export interface NavigationGroupItem {
  label: string;
  icon?: LucideIcon;
  children: readonly NavigationLeafItem[];
}

export type NavigationItem = NavigationLeafItem | NavigationGroupItem;

export interface BreadcrumbItem {
  label: string;
  to: string;
}

export const baseNavigation = [
  { to: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  { to: '/person/report', label: '업무보고', icon: FileText },
  { to: '/person/search', label: '내 업무 내역', icon: Search },
  {
    label: '프로젝트',
    icon: FolderCode,
    children: [
      { to: '/projects', label: '프로젝트 관리', icon: Layers },
      { to: '/stats/qa', label: 'QA 통계' },
      { to: '/stats/monitoring', label: '모니터링 통계' },
    ],
  },
] as const satisfies readonly NavigationItem[];

export const adminNavigation = [
  {
    label: '조직 관리',
    icon: BriefcaseBusiness,
    children: [
      { to: '/org/summary', label: '업무보고 현황' },
      { to: '/org/search', label: '업무보고 조회' },
    ],
  },
  {
    label: '리소스',
    icon: Database,
    children: [
      { to: '/resource/type', label: '업무 타입 집계' },
      { to: '/resource/svc', label: '서비스 그룹 집계' },
      { to: '/resource/month', label: '월간 리포트' },
    ],
  },
  {
    label: '관리자',
    icon: Shield,
    children: [
      { to: '/admin/cost-group', label: '청구그룹 관리' },
      { to: '/admin/group', label: '서비스 그룹 관리' },
      { to: '/admin/type', label: '업무 타입 관리' },
      { to: '/admin/platform', label: '플랫폼 관리' },
      { to: '/admin/members', label: '사용자 관리' },
    ],
  },
] as const satisfies readonly NavigationItem[];

function isCurrentPath(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function getBreadcrumbs(pathname: string, navigation: readonly NavigationItem[]) {
  const parts = [{ label: '홈', to: '/dashboard' }];

  if (pathname === '/profile' || pathname === '/password-change') {
    parts.push({ label: '프로필', to: '/profile' });
    return parts;
  }

  for (const item of navigation) {
    if ('to' in item && isCurrentPath(pathname, item.to)) {
      parts.push({ label: item.label, to: item.to });
      break;
    }

    if ('children' in item) {
      for (const child of item.children) {
        if (isCurrentPath(pathname, child.to)) {
          parts.push({ label: item.label, to: '#' });
          parts.push({ label: child.label, to: child.to });
          return parts;
        }
      }
    }
  }

  return parts;
}

export function setDocumentTitle(label: string) {
  document.title = `${label} | My Works`;
}
