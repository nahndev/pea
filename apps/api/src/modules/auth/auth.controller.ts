import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNoContentResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SESSION_COOKIE } from '@tomato/constants';
import type { CurrentUser } from '@tomato/types';
import type { Request, Response } from 'express';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SESSION_TTL_MS } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('sessions')
@Controller('sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<CurrentUser> {
    const { token, user } = await this.authService.login(dto);
    response.cookie(SESSION_COOKIE, token, { ...this.authService.cookieOptions, maxAge: SESSION_TTL_MS });
    return user;
  }

  @Get('current')
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  findCurrent(@AuthUser() user: CurrentUser): CurrentUser {
    return user;
  }

  @Public()
  @Delete('current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.authService.logout(request.cookies?.[SESSION_COOKIE] as string | undefined);
    response.clearCookie(SESSION_COOKIE, this.authService.cookieOptions);
  }
}
