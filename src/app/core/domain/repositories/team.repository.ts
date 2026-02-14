import { Observable } from 'rxjs';
import { AcceptInvitationResponse, CreateTeamRequest, CreateTeamResponse, Team, TeamWithMembers, UpdateTeamRequest } from '../features/teams';

export interface InviteMemberRequest {
  emailOrUsername: string;
  teamName: string;
  teamID: any;
}

export abstract class TeamRepository {
  abstract createTeam(request: CreateTeamRequest): Observable<CreateTeamResponse>;
  abstract updateTeam(teamId: string, request: UpdateTeamRequest): Observable<void>;
  abstract getTeams(): Observable<Team[]>;
  abstract getMyTeams(): Observable<TeamWithMembers[]>;
  abstract deleteTeam(teamId: string): Observable<void>;
  abstract deleteMember(teamId: string, email: string): Observable<void>;
  abstract reinviteMember(teamId: string, request: InviteMemberRequest): Observable<void>;
  abstract inviteMember(groupId: string, request: InviteMemberRequest): Observable<void>;
  abstract acceptInvitation(groupId: string): Observable<AcceptInvitationResponse>;
}
