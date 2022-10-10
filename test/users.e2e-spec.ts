import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from 'src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'test@test.com',
  password: '12345',
};

function createUserQuery(email: string, password: string) {
  return {
    query: `
    mutation {
      createUser(input: {
        email:"${email}",
        password:"${password}",
        role:Owner
      }) {
        ok
        error
      }
    }
    `,
  };
}
function loginQuery(email: string, password: string) {
  return {
    query: `
    mutation{
      login(input:{
        email:"${email}",
        password:"${password}"
      }){
        ok
        error
        token
      }
    }
  `,
  };
}
function userQuery(userId: number) {
  return {
    query: `
    {
      user(userId:${userId}){
        ok
        error
        user{
          id
        }
      }
    }
  `,
  };
}
function meQuery() {
  return {
    query: `
    {
      me{
        email
      }
    }
  `,
  };
}
function editProfileQuery(newEmail: string, newPassword: string) {
  return {
    query: `
      mutation{
        editProfile(input:{
          email:"${newEmail}",
          password:"${newPassword}"
        })
        {
          ok
          error
        }
      }
    `,
  };
}
function verifyEmailQuery(code: string) {
  return {
    query: `
      mutation{
        verifyEmail(input:{
          code:"${code}"
        }){
          ok
          error
        }
      }
    `,
  };
}

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: { query: string }) => baseTest().send(query);
  const privateTest = (query: { query: string }) =>
    baseTest().set('X-JWT', jwtToken).send(query);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    const connection = await dataSource.initialize();
    await connection.dropDatabase();
    await connection.destroy();
    await app.close();
  });

  describe('create', () => {
    it('should create account', () => {
      return publicTest(createUserQuery(testUser.email, testUser.password))
        .expect(200)
        .expect(res => {
          expect(res.body.data.createUser.ok).toBe(true);
          expect(res.body.data.createUser.error).toBe(null);
        });
    });

    it('should fail if account already exists', () => {
      return publicTest(createUserQuery(testUser.email, testUser.password))
        .expect(200)
        .expect(res => {
          expect(res.body.data.createUser.ok).toBe(false);
          expect(res.body.data.createUser.error).toEqual(
            'There is a user with that email already',
          );
        });
    });
  });

  describe('login', () => {
    it('should login with correct credentials', () => {
      return publicTest(loginQuery(testUser.email, testUser.password))
        .expect(200)
        .expect(res => {
          const { login } = res.body.data;
          expect(login.ok).toEqual(true);
          expect(login.error).toEqual(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it('should not be able to login with wrong credentials', () => {
      return publicTest(loginQuery(testUser.email, '123124'))
        .expect(200)
        .expect(res => {
          const { login } = res.body.data;
          expect(login.ok).toEqual(false);
          expect(login.error).toEqual('Wrong password');
          expect(login.token).toEqual(null);
        });
    });
  });

  describe('user', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it('should see a user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set(`X-JWT`, jwtToken)
        .send(userQuery(userId))
        .expect(200)
        .expect(res => {
          const { ok, error, user } = res.body.data.user;

          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(user.id).toBe(userId);
        });
    });

    it('should not find a profile', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set(`X-JWT`, jwtToken)
        .send(userQuery(1231234))
        .expect(200)
        .expect(res => {
          const { ok, error, user } = res.body.data.user;

          expect(ok).toBe(false);
          expect(error).toBe('User Not Found');
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('should find my profile', () => {
      return privateTest(meQuery())
        .expect(200)
        .expect(res => {
          const { email } = res.body.data.me;
          expect(email).toBe(testUser.email);
        });
    });

    it('should not allow logged out user', () => {
      return request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', 'not token')
        .send(meQuery())
        .expect(200)
        .expect(res => {
          const { errors } = res.body;
          const [error] = errors;
          expect(error.message).toBe('Forbidden resource');
        });
    });
  });

  describe('editProfile', () => {
    const NEW_EMAIL = 'test@new.com';
    const NEW_PASSWORD = 'new.password';

    it('should change email', () => {
      return privateTest(editProfileQuery(NEW_EMAIL, NEW_PASSWORD))
        .expect(200)
        .expect(res => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should have new email', () => {
      return privateTest(meQuery())
        .expect(200)
        .expect(res => {
          const { email } = res.body.data.me;
          expect(email).toBe(NEW_EMAIL);
        });
    });

    it('should fail when already email exist', () => {
      return privateTest(editProfileQuery(NEW_EMAIL, NEW_PASSWORD))
        .expect(200)
        .expect(res => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(false);
          expect(error).toBe('There is a user with that email already');
        });
    });

    it('should login with new email and new password', () => {
      return publicTest(loginQuery(NEW_EMAIL, NEW_PASSWORD))
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toEqual(true);
          expect(login.error).toEqual(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;

    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(verifyEmailQuery(verificationCode))
        .expect(200)
        .expect(res => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should fail on worng verification code', () => {
      return publicTest(verifyEmailQuery('xxxxx'))
        .expect(200)
        .expect(res => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(false);
          expect(error).toBe('Verification not found.');
        });
    });
  });
});
