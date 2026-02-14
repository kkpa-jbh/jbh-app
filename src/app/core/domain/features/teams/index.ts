// API Requests
export * from './api/requests/create-team.request';
export * from './api/requests/update-team.request';

// API Responses
export * from './api/responses/create-team.response';
export * from './api/responses/accept-invitation.response';
export * from './api/responses/team-member-api.response';
export * from './api/responses/team-with-members-api.response';

// Domain Models
export * from './models/team.model';
export * from './models/team-member.model';
export * from './models/team-with-members.model';

// Types
export * from './types/member-status.enum';

// Re-export commonly used types for backward compatibility
export type { CreateTeamRequest } from './api/requests/create-team.request';
export type { UpdateTeamRequest } from './api/requests/update-team.request';
export type { CreateTeamResponse } from './api/responses/create-team.response';
export type { AcceptInvitationResponse } from './api/responses/accept-invitation.response';
export type { TeamWithMembersApiResponse } from './api/responses/team-with-members-api.response';
