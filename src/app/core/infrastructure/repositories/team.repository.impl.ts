import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TeamRepository, InviteMemberRequest } from '@core/domain/repositories/team.repository';
import {
  AcceptInvitationResponse,
  CreateTeamRequest,
  CreateTeamResponse,
  Team,
  TeamWithMembers,
  TeamWithMembersApiResponse,
  UpdateTeamRequest
} from '@core/domain/features/teams';
import { ApiBaseService } from '@core/infrastructure/api/api-base.service';
import { HttpClient } from '@angular/common/http';
import { EnvironmentConfig } from '@core/infrastructure/config/environment.config';
import { LoggerService } from '@core/infrastructure/logging/logger.service';

@Injectable({
  providedIn: 'root'
})
export class TeamRepositoryImpl extends ApiBaseService implements TeamRepository {

  private readonly TEAMS_ENDPOINT = '/user-groups';
  private readonly MY_TEAMS_ENDPOINT = '/user-groups/my-groups';

  constructor(http: HttpClient, envConfig: EnvironmentConfig, logger: LoggerService) {
    super(http, envConfig, logger);
  }

  createTeam(request: CreateTeamRequest): Observable<CreateTeamResponse> {
    return this.post<CreateTeamResponse>(this.TEAMS_ENDPOINT, request);
  }

  updateTeam(teamId: string, request: UpdateTeamRequest): Observable<void> {
    return this.put<void>(`${this.TEAMS_ENDPOINT}/${teamId}`, request);
  }

  getTeams(): Observable<Team[]> {
    return this.get<CreateTeamResponse[]>(this.TEAMS_ENDPOINT).pipe(
      map(responses => responses.map(response => Team.fromApiResponse(response)))
    );
  }

  getMyTeams(): Observable<TeamWithMembers[]> {
    return this.get<TeamWithMembersApiResponse[]>(this.MY_TEAMS_ENDPOINT).pipe(
      map(responses => responses.map(response => TeamWithMembers.fromApiResponse(response)))
    );
  }

  deleteTeam(teamId: string): Observable<void> {
    return this.delete<void>(`${this.TEAMS_ENDPOINT}/${teamId}`);
  }

  deleteMember(teamId: string, email: string): Observable<void> {
    return this.delete<void>(`${this.TEAMS_ENDPOINT}/${teamId}/members/${encodeURIComponent(email)}`);
  }

  reinviteMember(teamId: string, request: InviteMemberRequest): Observable<void> {
    return this.post<void>(`${this.TEAMS_ENDPOINT}/${teamId}/reinvite`, request);
  }

  inviteMember(groupId: string, request: InviteMemberRequest): Observable<void> {
    return this.post<void>(`${this.TEAMS_ENDPOINT}/${groupId}/invitations`, request);
  }

  acceptInvitation(groupId: string): Observable<AcceptInvitationResponse> {
    return this.post<AcceptInvitationResponse>(`${this.TEAMS_ENDPOINT}/${groupId}/invitations/accept`, {});
  }
}
