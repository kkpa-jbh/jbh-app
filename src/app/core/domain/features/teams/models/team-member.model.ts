import { TeamMemberApiResponse } from '../api/responses/team-member-api.response';
import { MemberStatus } from '../types/member-status.enum';

export class TeamMember {
  constructor(
    public readonly nickName: string,
    public readonly email: string,
    public readonly status: MemberStatus,
    public readonly isGroupOwner: boolean
  ) {}

  static fromApiResponse(response: TeamMemberApiResponse): TeamMember {
    return new TeamMember(
      response.nickName,
      response.email,
      response.status as MemberStatus,
      response.isGroupOwner
    );
  }

  get isAccepted(): boolean {
    return this.status === MemberStatus.ACCEPTED;
  }

  get isPending(): boolean {
    return this.status === MemberStatus.PENDING_TO_ACCEPT;
  }

  get isDeclined(): boolean {
    return this.status === MemberStatus.DECLINED;
  }
}
