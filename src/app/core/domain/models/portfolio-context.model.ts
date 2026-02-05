export enum PortfolioContextType {
  PERSONAL = 'PERSONAL',
  TEAM = 'TEAM'
}

export class PortfolioContext {
  constructor(
    public readonly type: PortfolioContextType,
    public readonly teamId: string | null = null,
    public readonly teamName: string | null = null
  ) {}

  get isPersonal(): boolean {
    return this.type === PortfolioContextType.PERSONAL;
  }

  get isTeam(): boolean {
    return this.type === PortfolioContextType.TEAM;
  }

  static createPersonal(): PortfolioContext {
    return new PortfolioContext(PortfolioContextType.PERSONAL);
  }

  static createTeam(teamId: string, teamName: string): PortfolioContext {
    return new PortfolioContext(PortfolioContextType.TEAM, teamId, teamName);
  }

  toJSON(): PortfolioContextJSON {
    return {
      type: this.type,
      teamId: this.teamId,
      teamName: this.teamName
    };
  }

  static fromJSON(json: PortfolioContextJSON): PortfolioContext {
    return new PortfolioContext(json.type, json.teamId, json.teamName);
  }
}

export interface PortfolioContextJSON {
  type: PortfolioContextType;
  teamId: string | null;
  teamName: string | null;
}
