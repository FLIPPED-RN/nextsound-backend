import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsDate, IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsNumber()
    id!: number;

    @IsNotEmpty()
    fullName!: string;

    @IsNotEmpty()
    nickname!: string;

    @IsEmail()
    email!: string;

    @IsNotEmpty()
    password_hash!: string;

    @IsNotEmpty()
    role!: string;

    @IsDate()
    created_at!: string;

    @IsDate()
    updated_at!: string;
}
