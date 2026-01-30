import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, shareReplay, tap } from 'rxjs';
import { TeamRepository, InviteMemberRequest } from '../repositories/team.repository';
import { AcceptInvitationResponse, CreateTeamRequest, CreateTeamResponse, Team, TeamWithMembers } from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class TeamUseCase {

  private teams$: Observable<Team[]> | null = null;
  private myTeams$: Observable<TeamWithMembers[]> | null = null;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private teamRepository: TeamRepository) {}

  getTeams(): Observable<Team[]> {
    if (!this.teams$) {
      this.loadingSubject.next(true);
      this.teams$ = this.teamRepository.getTeams().pipe(
        tap(() => this.loadingSubject.next(false)),
        shareReplay(1)
      );
    }
    return this.teams$;
  }

  getMyTeams(): Observable<TeamWithMembers[]> {
    if (!this.myTeams$) {
      this.loadingSubject.next(true);
      this.myTeams$ = this.teamRepository.getMyTeams().pipe(
        tap(() => this.loadingSubject.next(false)),
        shareReplay(1)
      );
    }
    return this.myTeams$;
  }

  createTeam(request: CreateTeamRequest): Observable<CreateTeamResponse> {
    return this.teamRepository.createTeam(request).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteTeam(teamId: string): Observable<void> {
    return this.teamRepository.deleteTeam(teamId).pipe(
      tap(() => this.clearCache())
    );
  }

  deleteMember(teamId: string, email: string): Observable<void> {
    return this.teamRepository.deleteMember(teamId, email).pipe(
      tap(() => this.clearCache())
    );
  }

  reinviteMember(teamId: string, invitationRequest: InviteMemberRequest): Observable<void> {
    return this.teamRepository.reinviteMember(teamId, invitationRequest).pipe(
      tap(() => this.clearCache())
    );
  }

  inviteMember(invitationRequest: InviteMemberRequest): Observable<void> {
   
    return this.teamRepository.inviteMember(invitationRequest.teamID, invitationRequest).pipe(
      tap(() => this.clearCache())
    );
  }

  acceptInvitation(groupId: string): Observable<AcceptInvitationResponse> {
    return this.teamRepository.acceptInvitation(groupId).pipe(
      tap(() => this.clearCache())
    );
  }

  clearCache(): void {
    this.teams$ = null;
    this.myTeams$ = null;
  }

  refreshMyTeams(): Observable<TeamWithMembers[]> {
    this.myTeams$ = null;
    return this.getMyTeams();
  }
}
