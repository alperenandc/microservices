const crypto = require("crypto");

class AuthService {
  constructor({ authUserRepository, sessionTokenRepository, config }) {
    this.authUserRepository = authUserRepository;
    this.sessionTokenRepository = sessionTokenRepository;
    this.config = config;
  }

  async seedDefaults() {
    await this.authUserRepository.seedDefaultUser(
      this.config.defaultUsername,
      this.config.defaultPassword
    );
  }

  async login(username, password) {
    if (!username || !password) {
      return {
        status: 400,
        body: {
          error: true,
          message: "Kullanici adi ve sifre zorunludur.",
        },
      };
    }

    const user = await this.authUserRepository.findByCredentials(username, password);

    if (!user) {
      return {
        status: 401,
        body: {
          error: true,
          message: "Gecersiz kullanici adi veya sifre.",
        },
      };
    }

    const token = crypto.randomBytes(24).toString("hex");
    await this.sessionTokenRepository.createSession({
      token,
      username: user.username,
      active: true,
    });

    return {
      status: 200,
      body: {
        token,
        tokenType: "Bearer",
        username: user.username,
      },
    };
  }

  async validate(token) {
    if (!token) {
      return {
        status: 401,
        body: {
          error: true,
          message: "Token bulunamadi.",
        },
      };
    }

    const session = await this.sessionTokenRepository.findActiveToken(token);

    if (!session) {
      return {
        status: 401,
        body: {
          error: true,
          message: "Gecersiz veya pasif token.",
        },
      };
    }

    return {
      status: 200,
      body: {
        valid: true,
        username: session.username,
      },
    };
  }
}

module.exports = { AuthService };
