import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginInput } from 'src/users/dto/login.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from 'src/users/dto/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config:ConfigService,
    private readonly jwtService:JwtService
  ) {}

  async create({
    email,
    password,
    role,
  }: CreateUserInput): Promise<{ ok: boolean; error?: string }> {
    // check new user
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        // make error
        return { ok: false, error: 'There is a user with that email already' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (error) {
      // make error
      return { ok: false, error: "Couldn't create account" };
    }
    // hash the password
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    // find the user with the email
    // check if the password is correct
    // make a JWT and give it to the user
    try {
      const user = await this.users.findOne({ where: { email } });
      if (!user) {
        return {
          ok: false,
          error: 'User not found',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if(!passwordCorrect){
        return {
          ok:false,
          error:'User not found'
        }
      }
      const token = this.jwtService.sign(user.id)
      return {
        ok: true,
        token
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id:number):Promise<User>{
    return this.users.findOne({where:{id}});
  }

  async editProfile(userId:number, {email, password}:EditProfileInput):Promise<User>{
    // return this.users.update(userId, {...editProfileInput}) // 이러면 @BeforeUpdate 작동 안함
    const user = await this.users.findOne({where:{id:userId}});
    if(email){
      user.email = email
    }
    if(password){
      user.password = password
    }
    return this.users.save(user);
  }

}
