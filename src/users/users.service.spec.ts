import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificatoinRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    verificatoinRepository = module.get(getRepositoryToken(Verification));
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserArgs = {
      email: 'email@email.com',
      password: 'password',
      role: 0,
    };
    const codeArgs = {
      code: 'code',
    };

    it('sholud fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'lalalalalalal',
      });
      const result = await service.create(createUserArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockReturnValue(undefined);
      usersRepository.create.mockReturnValue(createUserArgs);
      usersRepository.save.mockResolvedValue(createUserArgs);
      verificatoinRepository.create.mockReturnValue({
        user: createUserArgs,
      });
      verificatoinRepository.save.mockResolvedValue(codeArgs);

      const result = await service.create(createUserArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createUserArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createUserArgs);

      expect(verificatoinRepository.create).toHaveBeenCalledTimes(1);
      expect(verificatoinRepository.create).toHaveBeenCalledWith({
        user: createUserArgs,
      });

      expect(verificatoinRepository.save).toHaveBeenCalledTimes(1);
      expect(verificatoinRepository.save).toHaveBeenCalledWith({
        user: createUserArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        createUserArgs.email,
        codeArgs.code,
      );

      expect(result).toEqual({ ok: true });
    });

    it('shold throw exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.create(createUserArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't create account" });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'email@email.com',
      password: 'password',
    };

    it('should fail if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: loginArgs.email,
        },
        select: ['id', 'password'],
      });
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });

    it('should fail if the password is worng', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(result).toEqual({ ok: false, error: 'Wrong password' });
    });

    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };

      usersRepository.findOne.mockResolvedValue(mockedUser);

      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(mockedUser.id);
      console.log(result);
      expect(result).toEqual({ ok: true, token: 'signed-token' });
    });

    it('shold throw exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: Error() });
    });
  });

  describe('findById', () => {
    const mockedUser = { id: 1 };

    it('should return user when user found', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(mockedUser);
      const result = await service.findById(mockedUser.id);
      expect(result).toEqual({ ok: true, user: mockedUser });
    });

    it('should fail if no user is found', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: 'old@email.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        input: {
          email: 'new@email.com',
        },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        verified: false,
        email: editProfileArgs.input.email,
      };

      usersRepository.findOne.mockResolvedValue(oldUser);
      verificatoinRepository.create.mockReturnValue(newVerification);
      verificatoinRepository.save.mockResolvedValue(newVerification);

      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });

      expect(verificatoinRepository.create).toHaveBeenCalledTimes(1);
      expect(verificatoinRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });

      expect(verificatoinRepository.save).toHaveBeenCalledTimes(1);
      expect(verificatoinRepository.save).toHaveBeenCalledWith(newVerification);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: {
          password: 'new.password',
        },
      };

      usersRepository.findOne.mockResolvedValue({ password: 'old' });

      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '123' });
      expect(result).toEqual({ ok: false, error: 'Could not update profile.' });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerificaion = {
        user: {
          verified: false,
        },
        id: 1,
      };
      const code = 'code';
      verificatoinRepository.findOne.mockResolvedValue(mockedVerificaion);

      const result = await service.verifyEmail(code);

      expect(verificatoinRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificatoinRepository.findOne).toHaveBeenCalledWith({
        where: { code },
        relations: ['user'],
      });

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });

      expect(verificatoinRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificatoinRepository.delete).toHaveBeenCalledWith(
        mockedVerificaion.id,
      );

      expect(result).toEqual({ ok: true });
    });
    it('should fail on verification not found',async()=>{
      verificatoinRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail("");
      expect(result).toEqual({ ok: false, error: 'Verification not found.' })
    });
    it('should fail on execption', async()=>{
      verificatoinRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail("");
      expect(result).toEqual({ ok: false, error:"Could not verified email" })
    });
  });
});
