export class Config {
  private static instance: Config;
  private initialBalance: number = 5000.00;
  private static readonly INITIAL_BALANCE = 10000;
  private static readonly MAX_VERIFICATION_ATTEMPTS = 3;

  private constructor() {}

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public static getInitialBalance(): number {
    return Config.getInstance().initialBalance;
  }

  public static setInitialBalance(balance: number): void {
    Config.getInstance().initialBalance = balance;
  }

  static getMaxVerificationAttempts(): number {
    return this.MAX_VERIFICATION_ATTEMPTS;
  }
} 