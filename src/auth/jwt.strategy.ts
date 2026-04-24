import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { UsersService } from "../users/users.service";
import { Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UsersService) {
        super({
            jwtFromReques: (req) => {
                if (!req || !req.cookies) return null
                return req.signedCookies['token']
            },
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        })
    }
    async validate(payload: any){
        const user = await this.userService.findOneById(payload.id)

        if(!user){
            throw new UnauthorizedException('Печалька с jwt')
        }
    }
}