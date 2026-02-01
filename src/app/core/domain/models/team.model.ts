export interface CreateTeamRequest {
  shortName: string;
  name: string;
}

export interface UpdateTeamRequest {
  shortName: string;
  name: string;
}

export interface CreateTeamResponse {
  id: string;
  shortName: string;
  name: string;
  createdAt: string;
}

export enum MemberStatus {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PENDING_TO_ACCEPT = 'PENDING_TO_ACCEPT'
}

export interface TeamMemberApiResponse {
  nickName: string;
  email: string;
  status: string;
  isGroupOwner: boolean;
}

export interface TeamWithMembersApiResponse {
  id: string;
  shortName: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  members: TeamMemberApiResponse[];
}

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

export class Team {
  constructor(
    public readonly id: string,
    public readonly shortName: string,
    public readonly name: string,
    public readonly createdAt?: string
  ) {}

  static fromApiResponse(response: CreateTeamResponse): Team {
    return new Team(
      response.id,
      response.shortName,
      response.name,
      response.createdAt
    );
  }
}

export interface AcceptInvitationResponse {
  groupId: string;
  groupName: string;
  message: string;
}
