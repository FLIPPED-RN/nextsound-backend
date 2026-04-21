import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsDate, IsEmail, IsNotEmpty, IsNumberString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsNumberString()
    id!: string;

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
