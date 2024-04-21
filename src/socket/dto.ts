import { IsString, Length, IsEmpty } from 'class-validator';

export class MessageDto {
  @IsEmpty()
  @IsString()
  id: string;
  @IsEmpty()
  @IsString()
  @Length(1, 20)
  name: string;
  @IsEmpty()
  @IsString()
  avatar: string;
  @IsEmpty()
  @IsString()
  content: string;
}
