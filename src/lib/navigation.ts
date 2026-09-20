import { Buildings, ChartLineUp, Checks, Compass, House, NotePencil, UserCircle } from '@phosphor-icons/react';

/** The seven workspace sections, in the order a student uses them. Shared by the sidebar and the tour. */
export const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: House },
  { id: 'profile', label: 'My profile', icon: UserCircle },
  { id: 'universities', label: 'Universities', icon: Buildings },
  { id: 'planner', label: 'Score planner', icon: ChartLineUp },
  { id: 'essays', label: 'Essay studio', icon: NotePencil },
  { id: 'applications', label: 'My applications', icon: Checks },
  { id: 'guide', label: 'How to apply', icon: Compass },
] as const;
export type NavigationId = (typeof navigation)[number]['id'];
