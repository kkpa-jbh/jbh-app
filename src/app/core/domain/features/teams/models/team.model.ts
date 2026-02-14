import { CreateTeamResponse } from '../api/responses/create-team.response';

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
