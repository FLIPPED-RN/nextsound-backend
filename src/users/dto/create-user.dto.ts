import { IsDate, IsEmail, IsNotEmpty, IsNumber } from "class-validator";

export class CreateUserDto {
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
