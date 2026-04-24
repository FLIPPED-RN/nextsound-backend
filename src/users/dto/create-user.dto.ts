import { IsDate, IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsNotEmpty({ message: 'Имя обязательно для заполнения' })
    @IsString({ message: 'Имя должно быть строкой' })
    firstName!: string;

    @IsNotEmpty({ message: 'Фамилия обязательна для заполнения' })
    @IsString({ message: 'Фамилия должна быть строкой' })
    lastName!: string;

    @IsNotEmpty({ message: 'Никнейм обязателен для заполнения' })
    @IsString({ message: 'Никнейм должен быть строкой' })
    nickname!: string;

    @IsString({ message: 'Email должен быть строкой' })
    @IsNotEmpty({ message: 'Email обязателен для заполнения' })
    @IsEmail({}, { message: 'Некорректный формат Email' })
    email!: string;

    @IsNotEmpty({ message: 'Пароль обязателен для заполнения' })
    @MinLength(6)
    password!: string;
}
