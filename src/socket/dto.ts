import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  avatar: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UserDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  avatar: string;
}
