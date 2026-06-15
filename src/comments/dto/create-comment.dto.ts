import { IsString, IsNotEmpty, IsOptional, IsInt, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Комментарий не может быть пустым' })
  text!: string;

  @IsOptional()
  @IsInt()
  parentId?: number;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}
