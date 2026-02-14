import { TeamWithMembersApiResponse } from '../api/responses/team-with-members-api.response';
import { TeamMember } from './team-member.model';

export class TeamWithMembers {
  constructor(
    public readonly id: string,
    public readonly shortName: string,
    public readonly name: string,
    public readonly createdBy: string,
    public readonly createdAt: string,
    public readonly updatedAt: string | null,
    public readonly members: TeamMember[]
  ) {}

  static fromApiResponse(response: TeamWithMembersApiResponse): TeamWithMembers {
    return new TeamWithMembers(
      response.id,
      response.shortName,
      response.name,
      response.createdBy,
      response.createdAt,
      response.updatedAt,
      response.members.map(m => TeamMember.fromApiResponse(m))
    );
  }

  get acceptedMembers(): TeamMember[] {
    return this.members.filter(m => m.isAccepted);
  }

  get pendingMembers(): TeamMember[] {
    return this.members.filter(m => m.isPending);
  }

  get declinedMembers(): TeamMember[] {
    return this.members.filter(m => m.isDeclined);
  }

  get owner(): TeamMember | undefined {
    return this.members.find(m => m.isGroupOwner);
  }
}
