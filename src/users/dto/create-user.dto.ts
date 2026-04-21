import { IsDate, IsEmail, IsNotEmpty, IsNumberString, IsStrongPassword } from "class-validator";

export class CreateUserDto {
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
