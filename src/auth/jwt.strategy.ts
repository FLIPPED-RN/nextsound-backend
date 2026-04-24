// import { Injectable } from "@nestjs/common";
// import { PassportStrategy } from "@nestjs/passport";
// import { UsersService } from "../users/users.service";

// @Injectable()
// export class JwtStrategy extends PassportStrategy() {
//     constructor(private readonly userService: UsersService) {
//         super({
//             jwtFromReques: (req) => {
//                 if (!req || !req.cookies) return null
//                 return req.signedCookies['token']
//             }
//         })
//     }
// }