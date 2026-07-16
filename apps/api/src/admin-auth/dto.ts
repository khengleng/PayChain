import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class MfaSetupDto {
  @IsString()
  @MinLength(10)
  challengeToken!: string;
}

export class MfaVerifyDto {
  @IsString()
  @MinLength(10)
  challengeToken!: string;

  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsString()
  @MinLength(10, { message: 'new password must be at least 10 characters' })
  newPassword!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(10)
  token!: string;

  @IsString()
  @MinLength(10, { message: 'new password must be at least 10 characters' })
  newPassword!: string;
}
