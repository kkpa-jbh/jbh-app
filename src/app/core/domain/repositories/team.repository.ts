import { Observable } from 'rxjs';
import { CreateTeamRequest, CreateTeamResponse, Team, TeamWithMembers } from '../models/team.model';

export interface InviteMemberRequest {
  emailOrUsername: string;
}

export abstract class TeamRepository {
  abstract createTeam(request: CreateTeamRequest): Observable<CreateTeamResponse>;
  abstract getTeams(): Observable<Team[]>;
  abstract getMyTeams(): Observable<TeamWithMembers[]>;
  abstract deleteTeam(teamId: string): Observable<void>;
  abstract deleteMember(teamId: string, email: string): Observable<void>;
  abstract reinviteMember(teamId: string, email: string): Observable<void>;
  abstract inviteMember(groupId: string, request: InviteMemberRequest): Observable<void>;
}
