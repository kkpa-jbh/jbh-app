import { TeamMemberApiResponse } from './team-member-api.response';

export interface TeamWithMembersApiResponse {
  id: string;
  shortName: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  members: TeamMemberApiResponse[];
}
