import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Комментарий не может быть пустым' })
  text!: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}
