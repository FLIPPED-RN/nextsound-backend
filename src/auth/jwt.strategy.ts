import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { UsersService } from "../users/users.service";
import { Strategy } from 'passport-jwt';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UsersService, private readonly configService: ConfigService) {
        super({
            jwtFromRequest: (req) => {
                if (!req || !req.cookies) return null
                return req.cookies['token']
            },
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        })
    }
    async validate(payload: any){
        const user = await this.userService.findOneById(payload.id)

        if(!user){
            throw new UnauthorizedException('Пользователь не найден')
        }

        return user;
    }
}